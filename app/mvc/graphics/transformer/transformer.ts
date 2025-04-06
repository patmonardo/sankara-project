import { SaraContext } from "../schema/context";
import {
  Graph,
  GraphNode,
  createGraph,
  addNodeToGraph,
  addEdgeToGraph,
  getNodeFromGraph,
  getEdgeFromGraph,
  getIncomingEdges,
  getOutgoingEdges,
  findNodesByProperty,
} from "@/neo/graph";

/**
 * TransformError - Standard error type for transformation failures
 * Includes metadata about the transformation context
 */
export class TransformError extends Error {
  constructor(
    message: string,
    public readonly metadata: {
      transformerName?: string;
      nodeId?: string;
      duration?: number;
      context?: Partial<SaraContext>;
      cause?: unknown;
    } = {}
  ) {
    super(message);
    this.name = "TransformError";

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TransformError);
    }
  }
}

/**
 * Transformer - The unit that performs transformations based on context
 */
export interface Transformer<TIn, TOut> {
  /**
   * Transform input to output based on context
   */
  transform(input: TIn, context: SaraContext): TOut;

  /**
   * Optional name for debugging
   */
  readonly name?: string;
}

/**
 * BaseTransformer - Abstract base class for transformers
 */
export abstract class BaseTransformer<TIn, TOut>
  implements Transformer<TIn, TOut>
{
  constructor(public readonly name: string = "Transformer") {}

  abstract transform(input: TIn, context: SaraContext): TOut;
}

/**
 * TransformResult - The result of a transformation
 * Captures both the transformed data and metadata about the transformation
 */
export interface TransformResult<T> {
  data: T;
  meta?: {
    duration?: number;
    timestamp?: number;
    transformations?: string[];
  };
}

/**
 * IdentityTransformer - Returns input unchanged
 * Represents the moment of simple self-identity in the dialectic
 */
export class IdentityTransformer<T> extends BaseTransformer<T, T> {
  constructor() {
    super("IdentityTransformer");
  }

  transform(input: T, context: SaraContext): T {
    return input;
  }
}

/**
 * CompositeTransformer - Combines multiple transformers
 */
export class CompositeTransformer<TIn, TOut> extends BaseTransformer<
  TIn,
  TOut
> {
  constructor(
    private readonly transformers: Transformer<any, any>[],
    name: string = "CompositeTransformer"
  ) {
    super(name);
  }

  transform(input: TIn, context: SaraContext): TOut {
    let current: any = input;

    for (const transformer of this.transformers) {
      current = transformer.transform(current, context);
    }

    return current as TOut;
  }
}

export function chainTransformers<A, B, C>(
  first: Transformer<A, B>,
  second: Transformer<B, C>
): Transformer<A, C> {
  return new CompositeTransformer([first, second], 
    `${first.name || 'unnamed'} → ${second.name || 'unnamed'}`);
}

/**
 * GraphTransformer - Transformer that uses a property graph for transformation
 */
export class GraphTransformer<T> extends BaseTransformer<T, T> {
  // Use the property graph system for the transformation graph
  private transformGraph: Graph;

  constructor(name: string = "GraphTransformer") {
    super(name);

    // Initialize the transformation graph
    this.transformGraph = createGraph({
      id: `transformer-${Date.now()}`,
      name: name || "Transformation Graph",
      description: "Graph of transformation nodes and their relationships",
      directed: true, // Directed graph for dependencies
      properties: {
        createdAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Add a node to the transformation graph
   */
  addNode<TNodeIn, TNodeOut>(
    id: string,
    transformer: Transformer<TNodeIn, TNodeOut>,
    dependencies: string[] = []
  ): GraphTransformer<T> {
    // Verify that all dependencies exist
    for (const depId of dependencies) {
      if (!getNodeFromGraph(this.transformGraph, depId)) {
        throw new Error(
          `Dependency node '${depId}' not found in the transformation graph`
        );
      }
    }

    // Add the transformer node to the graph
    this.transformGraph = addNodeToGraph(this.transformGraph, {
      id,
      type: "transformer",
      label: transformer.name || id,
      properties: {
        transformer: transformer, // Store the actual transformer
        transformerType: transformer.constructor.name,
        createdAt: new Date().toISOString(),
      },
    });

    // Add dependency edges
    for (const depId of dependencies) {
      const edgeId = `${depId}_to_${id}`;
      this.transformGraph = addEdgeToGraph(this.transformGraph, {
        id: edgeId,
        source: depId,
        target: id,
        type: "dependency",
        properties: {
          createdAt: new Date().toISOString(),
        },
      });
    }

    return this;
  }

  /**
   * Transform using the graph of transformers
   */
  transform(input: T, context: SaraContext): T {
    // Get the execution order (topological sort)
    const order = this.getExecutionOrder();

    // Create working copy and intermediates storage
    const result = { ...(input as any) };
    const intermediates = new Map<string, any>();

    // Execute transformers in order
    for (const nodeId of order) {
      const node = getNodeFromGraph(this.transformGraph, nodeId);
      if (!node || node.type !== "transformer") continue;

      const transformer = node.properties.transformer as Transformer<any, any>;
      if (!transformer) continue;

      // Create node-specific context with dependencies
      const nodeContext = this.createNodeContext(
        context,
        nodeId,
        intermediates
      );

      // Extract input for this node
      const nodeInput = this.extractNodeInput(result, node);

      // Apply transformation
      const nodeOutput = transformer.transform(nodeInput, nodeContext);

      // Store intermediate result
      intermediates.set(nodeId, nodeOutput);

      // Integrate output into result
      this.integrateNodeOutput(result, node, nodeOutput);
    }

    return result as T;
  }

  /**
   * Get the topological execution order
   */
  private getExecutionOrder(): string[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: string[] = [];

    const visit = (nodeId: string) => {
      if (temp.has(nodeId)) {
        throw new Error(`Circular dependency detected at node '${nodeId}'`);
      }

      if (visited.has(nodeId)) return;

      temp.add(nodeId);

      // Visit all dependencies first
      const incomingEdges = getIncomingEdges(this.transformGraph, nodeId);
      for (const edge of incomingEdges) {
        visit(edge.source);
      }

      temp.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };

    // Visit all nodes
    for (const node of this.transformGraph.nodes) {
      if (!visited.has(node.id)) {
        visit(node.id);
      }
    }

    return order;
  }

  /**
   * Create a context for a specific node
   * This provides access to dependency outputs and metadata about the transformation graph
   */
  private createNodeContext(
    baseContext: SaraContext,
    nodeId: string,
    intermediates: Map<string, any>
  ): SaraContext {
    // Get the node
    const node = getNodeFromGraph(this.transformGraph, nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found in transformation graph`);
    }

    // Create structured dependencies object
    const dependencies: Record<
      string,
      {
        output: any;
        node: GraphNode;
        metadata?: Record<string, any>;
      }
    > = {};

    // Find direct dependencies (incoming edges)
    const incomingEdges = getIncomingEdges(this.transformGraph, nodeId);

    // Process each dependency
    for (const edge of incomingEdges) {
      const sourceId = edge.source;
      const sourceNode = getNodeFromGraph(this.transformGraph, sourceId);

      if (!sourceNode) {
        console.warn(`Dependency node ${sourceId} not found in graph`);
        continue;
      }

      // Get the output from intermediates
      const output = intermediates.get(sourceId);

      // Add to dependencies with metadata
      dependencies[sourceId] = {
        output,
        node: sourceNode,
        metadata: {
          ...edge.properties,
          type: edge.type,
          edgeId: edge.id,
          dependencyType: edge.properties?.dependencyType || "standard",
        },
      };
    }

    return {
      ...baseContext,
      // Enhanced dependency information only
      dependencies: dependencies,
      // Current node information
      currentNode: {
        id: nodeId,
        node,
        incomingEdges,
        outgoingEdges: getOutgoingEdges(this.transformGraph, nodeId),
      },
      // Graph access (read-only)
      graph: {
        getNode: (id: string) => getNodeFromGraph(this.transformGraph, id),
        getEdge: (id: string) => getEdgeFromGraph(this.transformGraph, id),
        findNodesByProperty: (key: string, filter: any) =>
          findNodesByProperty(this.transformGraph, key, filter),
      },
    };
  }

  /**
   * Extract input for a specific node
   */
  private extractNodeInput(result: any, node: GraphNode): any {
    // This can be customized based on your specific model structure
    // By default, each node operates on the whole model
    return result;
  }

  /**
   * Integrate node output into the result
   */
  private integrateNodeOutput(result: any, node: GraphNode, output: any): void {
    if (output === null || output === undefined) return;

    // Merge objects
    if (typeof output === "object" && !Array.isArray(output)) {
      Object.assign(result, output);
    } else {
      // If output is a primitive or array, assign it to a property with the node's id
      result[node.id] = output;
    }
  }

  /**
   * Get the underlying transformation graph
   */
  getGraph(): Graph {
    return this.transformGraph;
  }

  /**
   * Visualize the transformation graph (returns a text representation)
   */
  visualize(): string {
    let result = `Transformation Graph: ${this.transformGraph.name}\n\n`;

    // Find all root nodes (no incoming edges)
    const rootNodes = this.transformGraph.nodes.filter(
      (node) => getIncomingEdges(this.transformGraph, node.id).length === 0
    );

    // Process nodes level by level
    const processed = new Set<string>();

    const processLevel = (nodes: GraphNode[], level: number) => {
      if (nodes.length === 0) return;

      result += `Level ${level}:\n`;

      for (const node of nodes) {
        result += `  ${node.label || node.id} (${node.id})\n`;
        processed.add(node.id);
      }

      result += "\n";

      // Get next level (dependents of current level)
      const nextLevel: GraphNode[] = [];

      for (const node of nodes) {
        // Find outgoing edges
        const outgoing = getOutgoingEdges(this.transformGraph, node.id);

        for (const edge of outgoing) {
          const dependent = getNodeFromGraph(this.transformGraph, edge.target);

          if (dependent && !processed.has(dependent.id)) {
            // Only add if all dependencies are processed
            const allDepsProcessed = getIncomingEdges(
              this.transformGraph,
              dependent.id
            ).every((e) => processed.has(e.source));

            if (allDepsProcessed) {
              nextLevel.push(dependent);
            }
          }
        }
      }

      // Process next level
      processLevel(nextLevel, level + 1);
    };

    // Start with root nodes
    processLevel(rootNodes, 0);

    return result;
  }
}

export function transformWithResult<TIn, TOut>(
  transformer: Transformer<TIn, TOut>,
  input: TIn,
  context: SaraContext
): TransformResult<TOut> {
  const startTime = performance.now();

  try {
    const output = transformer.transform(input, context);

    const endTime = performance.now();
    return {
      data: output,
      meta: {
        duration: endTime - startTime,
        timestamp: Date.now(),
        transformations: [transformer.name || "unnamed"],
      },
    };
  } catch (error: unknown) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Check if it's already a TransformError
    if (error instanceof TransformError) {
      // Add duration if not already included
      if (!error.metadata.duration) {
        error.metadata.duration = duration;
      }
      throw error;
    }

    // Create a new TransformError with the original error as the cause
    throw new TransformError(
      `Transformation failed after ${duration}ms: ${
        error instanceof Error ? error.message : String(error)
      }`,
      {
        transformerName: transformer.name,
        duration,
        cause: error,
      }
    );
  }
}

/**
 * Serialize a transformation graph to JSON
 */
export function serializeTransformer<T>(
  transformer: GraphTransformer<T>
): string {
  const graph = transformer.getGraph();

  // We need to remove the actual transformer functions before serializing
  const cleanedGraph = {
    ...graph,
    nodes: graph.nodes.map((node) => {
      if (node.properties.transformer) {
        // Store only the transformer name
        return {
          ...node,
          properties: {
            ...node.properties,
            transformerName: node.properties.transformer.name,
            transformer: undefined, // Remove the actual function
          },
        };
      }
      return node;
    }),
  };

  return JSON.stringify(cleanedGraph);
}

/**
 * Create a graph transformer from a serialized graph
 * Note: This requires a factory function to recreate the actual transformers
 */
export function deserializeTransformer<T>(
  serialized: string,
  transformerFactory: (name: string) => Transformer<any, any>
): GraphTransformer<T> {
  const data = JSON.parse(serialized);
  const transformer = new GraphTransformer<T>(data.name);

  // Recreate the graph structure
  const graph = transformer.getGraph();

  // Add nodes (without edges first)
  for (const node of data.nodes) {
    // Recreate the transformer from the factory
    const transformerName = node.properties.transformerName;
    const actualTransformer = transformerFactory(transformerName);

    // Update node properties to include the actual transformer
    const properties = {
      ...node.properties,
      transformer: actualTransformer,
    };

    // Add the node to the graph
    transformer["transformGraph"] = addNodeToGraph(graph, {
      ...node,
      properties,
    });
  }

  // Add edges
  for (const edge of data.edges) {
    transformer["transformGraph"] = addEdgeToGraph(
      transformer["transformGraph"],
      edge
    );
  }

  return transformer;
}
