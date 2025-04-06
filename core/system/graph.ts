import { z } from 'zod';
import { PropertyDefinition, PropertyValue, SystemPropertyHandler, PropertyFilterValue } from './property';

/**
 * Graph node schema
 */
export const GraphNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string().optional(),
  properties: z.record(z.any()).default({}),
  metadata: z.record(z.any()).optional()
});

export type GraphNode = z.infer<typeof GraphNodeSchema>;

/**
 * Graph edge schema
 */
export const GraphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string(),
  label: z.string().optional(),
  properties: z.record(z.any()).default({}),
  metadata: z.record(z.any()).optional()
});

export type GraphEdge = z.infer<typeof GraphEdgeSchema>;

/**
 * Graph schema
 */
export const GraphSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  directed: z.boolean().default(true),
  nodes: z.array(GraphNodeSchema).default([]),
  edges: z.array(GraphEdgeSchema).default([]),
  properties: z.record(z.any()).default({}),
  metadata: z.record(z.any()).optional()
});

export type Graph = z.infer<typeof GraphSchema>;

/**
 * Create a new graph
 */
export function createGraph(params: Omit<Graph, 'nodes' | 'edges'> & { nodes?: GraphNode[], edges?: GraphEdge[] }): Graph {
  return {
    id: params.id,
    name: params.name,
    description: params.description,
    directed: params.directed ?? true,
    nodes: params.nodes ?? [],
    edges: params.edges ?? [],
    properties: params.properties ?? {},
    metadata: params.metadata
  };
}

/**
 * Add a node to a graph
 */
export function addNodeToGraph(graph: Graph, node: GraphNode): Graph {
  // Check if node already exists
  if (graph.nodes.some(n => n.id === node.id)) {
    throw new Error(`Node with id ${node.id} already exists in graph ${graph.id}`);
  }

  return {
    ...graph,
    nodes: [...graph.nodes, node]
  };
}

/**
 * Add an edge to a graph
 */
export function addEdgeToGraph(graph: Graph, edge: GraphEdge): Graph {
  // Check if edge already exists
  if (graph.edges.some(e => e.id === edge.id)) {
    throw new Error(`Edge with id ${edge.id} already exists in graph ${graph.id}`);
  }

  // Check if source and target nodes exist
  const sourceExists = graph.nodes.some(n => n.id === edge.source);
  const targetExists = graph.nodes.some(n => n.id === edge.target);

  if (!sourceExists) {
    throw new Error(`Source node ${edge.source} does not exist in graph ${graph.id}`);
  }

  if (!targetExists) {
    throw new Error(`Target node ${edge.target} does not exist in graph ${graph.id}`);
  }

  return {
    ...graph,
    edges: [...graph.edges, edge]
  };
}

/**
 * Remove a node from a graph
 */
export function removeNodeFromGraph(graph: Graph, nodeId: string): Graph {
  // Remove the node
  const newNodes = graph.nodes.filter(n => n.id !== nodeId);

  // Remove any edges connected to the node
  const newEdges = graph.edges.filter(e => e.source !== nodeId && e.target !== nodeId);

  return {
    ...graph,
    nodes: newNodes,
    edges: newEdges
  };
}

/**
 * Remove an edge from a graph
 */
export function removeEdgeFromGraph(graph: Graph, edgeId: string): Graph {
  return {
    ...graph,
    edges: graph.edges.filter(e => e.id !== edgeId)
  };
}

/**
 * Get a node from a graph
 */
export function getNodeFromGraph(graph: Graph, nodeId: string): GraphNode | undefined {
  return graph.nodes.find(n => n.id === nodeId);
}

/**
 * Get an edge from a graph
 */
export function getEdgeFromGraph(graph: Graph, edgeId: string): GraphEdge | undefined {
  return graph.edges.find(e => e.id === edgeId);
}

/**
 * Get all edges between two nodes
 */
export function getEdgesBetweenNodes(graph: Graph, sourceId: string, targetId: string): GraphEdge[] {
  return graph.edges.filter(e => e.source === sourceId && e.target === targetId);
}

/**
 * Get all outgoing edges from a node
 */
export function getOutgoingEdges(graph: Graph, nodeId: string): GraphEdge[] {
  return graph.edges.filter(e => e.source === nodeId);
}

/**
 * Get all incoming edges to a node
 */
export function getIncomingEdges(graph: Graph, nodeId: string): GraphEdge[] {
  return graph.edges.filter(e => e.target === nodeId);
}

/**
 * Get all adjacent nodes
 */
export function getAdjacentNodes(graph: Graph, nodeId: string): GraphNode[] {
  const adjacentNodeIds = new Set<string>();

  // Add outgoing connections
  graph.edges
    .filter(e => e.source === nodeId)
    .forEach(e => adjacentNodeIds.add(e.target));

  // Add incoming connections (if we care about those)
  if (!graph.directed) {
    graph.edges
      .filter(e => e.target === nodeId)
      .forEach(e => adjacentNodeIds.add(e.source));
  }

  // Get the actual nodes
  return Array.from(adjacentNodeIds)
    .map(id => graph.nodes.find(n => n.id === id))
    .filter(Boolean) as GraphNode[];
}

/**
 * Find nodes by property
 */
export function findNodesByProperty(
  graph: Graph,
  propertyKey: string,
  filter: PropertyFilterValue
): GraphNode[] {
  return graph.nodes.filter(node => {
    const propValue = node.properties[propertyKey];
    return SystemPropertyHandler.matchesPropertyFilter(propValue, filter);
  });
}

/**
 * Find edges by property
 */
export function findEdgesByProperty(
  graph: Graph,
  propertyKey: string,
  filter: PropertyFilterValue
): GraphEdge[] {
  return graph.edges.filter(edge => {
    const propValue = edge.properties[propertyKey];
    return SystemPropertyHandler.matchesPropertyFilter(propValue, filter);
  });
}

/**
 * Traverse graph starting from a node
 */
export function traverseGraph(
  graph: Graph,
  startNodeId: string,
  visitor: (node: GraphNode, depth: number, path: string[]) => boolean | void,
  options: {
    maxDepth?: number;
    direction?: 'outgoing' | 'incoming' | 'both';
  } = {}
): void {
  const {
    maxDepth = Infinity,
    direction = 'outgoing'
  } = options;

  const visited = new Set<string>();

  function visit(nodeId: string, depth: number, path: string[]) {
    if (depth > maxDepth || visited.has(nodeId)) return;

    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return;

    visited.add(nodeId);

    const newPath = [...path, nodeId];

    // Visit the current node
    const continueTraversal = visitor(node, depth, newPath);

    // If visitor returns false, stop traversal
    if (continueTraversal === false) return;

    // Get connected nodes
    let connectedEdges: GraphEdge[] = [];

    if (direction === 'outgoing' || direction === 'both') {
      connectedEdges = [...connectedEdges, ...graph.edges.filter(e => e.source === nodeId)];
    }

    if (direction === 'incoming' || direction === 'both') {
      connectedEdges = [...connectedEdges, ...graph.edges.filter(e => e.target === nodeId)];
    }

    // Visit connected nodes
    for (const edge of connectedEdges) {
      const nextNodeId = edge.source === nodeId ? edge.target : edge.source;
      visit(nextNodeId, depth + 1, newPath);
    }
  }

  visit(startNodeId, 0, []);
}

/**
 * Find paths between nodes
 */
export function findPaths(
  graph: Graph,
  startNodeId: string,
  endNodeId: string,
  options: {
    maxDepth?: number;
    direction?: 'outgoing' | 'incoming' | 'both';
  } = {}
): string[][] {
  const paths: string[][] = [];

  traverseGraph(
    graph,
    startNodeId,
    (node, depth, path) => {
      if (node.id === endNodeId) {
        paths.push([...path]);
        return false; // Stop this branch of traversal
      }
      return true; // Continue traversal
    },
    options
  );

  return paths;
}

/**
 * Graph serialization
 */
export function serializeGraph(graph: Graph): string {
  return JSON.stringify(graph);
}

/**
 * Graph deserialization
 */
export function deserializeGraph(serialized: string): Graph {
  const parsed = JSON.parse(serialized);
  return GraphSchema.parse(parsed);
}
