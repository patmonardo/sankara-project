//@/core/system/graph.ts

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

/**
 * Graph - Fundamental Structure of Relations
 *
 * In Hegel's philosophy, the pure structure of relations forms an integral part
 * of the Doctrine of Essence, where being passes into reflection. The graph structure
 * sits at the interface between immediate being (nodes) and mediated being (edges).
 */

// Node schema - represents entities in their abstract form
export const GraphNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string().optional(),
  properties: z.record(z.any()).default({}),
  metadata: z.record(z.any()).optional()
});

export type GraphNode = z.infer<typeof GraphNodeSchema>;

// Edge schema - represents relations in their abstract form
export const GraphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(), // Source node ID
  target: z.string(), // Target node ID
  type: z.string(),
  label: z.string().optional(),
  properties: z.record(z.any()).default({}),
  metadata: z.record(z.any()).optional(),
  directed: z.boolean().default(true)
});

export type GraphEdge = z.infer<typeof GraphEdgeSchema>;

// Graph schema - the totality that unites nodes and edges
export const GraphSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(GraphNodeSchema).default([]),
  edges: z.array(GraphEdgeSchema).default([]),
  directed: z.boolean().default(true),
  multigraph: z.boolean().default(false),
  properties: z.record(z.any()).default({}),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Graph = z.infer<typeof GraphSchema>;

/**
 * Create a new graph
 *
 * The moment of creation - from abstract concept to concrete structure
 */
export function createGraph(params: {
  id?: string;
  name: string;
  description?: string;
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  directed?: boolean;
  multigraph?: boolean;
  properties?: Record<string, any>;
  metadata?: Record<string, any>;
}): Graph {
  const now = new Date();

  return {
    id: params.id || uuidv4(),
    name: params.name,
    description: params.description,
    nodes: params.nodes || [],
    edges: params.edges || [],
    directed: params.directed !== undefined ? params.directed : true,
    multigraph: params.multigraph || false,
    properties: params.properties || {},
    metadata: params.metadata || {},
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Add a node to a graph
 *
 * Represents the moment of determination - when an abstract entity
 * gains its place in the network of relations
 */
export function addNodeToGraph(
  graph: Graph,
  node: Omit<GraphNode, 'id'> & { id?: string }
): Graph {
  const nodeId = node.id || uuidv4();

  // Check if node already exists
  const existingNodeIndex = graph.nodes.findIndex(n => n.id === nodeId);

  const newNode: GraphNode = {
    id: nodeId,
    type: node.type,
    label: node.label,
    properties: node.properties || {},
    metadata: node.metadata
  };

  // Create updated graph
  const updatedGraph: Graph = {
    ...graph,
    nodes: existingNodeIndex >= 0
      ? [
          ...graph.nodes.slice(0, existingNodeIndex),
          newNode,
          ...graph.nodes.slice(existingNodeIndex + 1)
        ]
      : [...graph.nodes, newNode],
    updatedAt: new Date()
  };

  return updatedGraph;
}

/**
 * Add an edge to a graph
 *
 * Represents the moment of relation - when two nodes
 * enter into dialectical relationship
 */
export function addEdgeToGraph(
  graph: Graph,
  edge: Omit<GraphEdge, 'id'> & { id?: string }
): Graph {
  const edgeId = edge.id || uuidv4();

  // Validate - ensure source and target nodes exist
  const sourceExists = graph.nodes.some(n => n.id === edge.source);
  const targetExists = graph.nodes.some(n => n.id === edge.target);

  if (!sourceExists || !targetExists) {
    throw new Error(
      `Cannot add edge: ${!sourceExists ? 'source' : 'target'} node not found in graph`
    );
  }

  // Check if edge already exists
  const existingEdgeIndex = graph.edges.findIndex(e => e.id === edgeId);

  // Check for duplicate edge if not a multigraph
  if (!graph.multigraph && existingEdgeIndex === -1) {
    const duplicateEdge = graph.edges.find(
      e => e.source === edge.source && e.target === edge.target && e.type === edge.type
    );

    if (duplicateEdge) {
      throw new Error(
        `Cannot add duplicate edge in non-multigraph: ${edge.source} -> ${edge.target} (${edge.type})`
      );
    }
  }

  const newEdge: GraphEdge = {
    id: edgeId,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    label: edge.label,
    properties: edge.properties || {},
    metadata: edge.metadata,
    directed: edge.directed !== undefined ? edge.directed : graph.directed
  };

  // Create updated graph
  const updatedGraph: Graph = {
    ...graph,
    edges: existingEdgeIndex >= 0
      ? [
          ...graph.edges.slice(0, existingEdgeIndex),
          newEdge,
          ...graph.edges.slice(existingEdgeIndex + 1)
        ]
      : [...graph.edges, newEdge],
    updatedAt: new Date()
  };

  return updatedGraph;
}

/**
 * Remove a node from a graph
 *
 * The moment of negation - when an entity is removed from the totality
 */
export function removeNodeFromGraph(graph: Graph, nodeId: string): Graph {
  // Check if node exists
  const nodeExists = graph.nodes.some(n => n.id === nodeId);
  if (!nodeExists) {
    return graph; // No changes if node doesn't exist
  }

  // Remove node
  const updatedNodes = graph.nodes.filter(n => n.id !== nodeId);

  // Also remove any edges connected to this node
  const updatedEdges = graph.edges.filter(
    e => e.source !== nodeId && e.target !== nodeId
  );

  // Create updated graph
  const updatedGraph: Graph = {
    ...graph,
    nodes: updatedNodes,
    edges: updatedEdges,
    updatedAt: new Date()
  };

  return updatedGraph;
}

/**
 * Remove an edge from a graph
 *
 * The moment of disconnection - when a relation is dissolved
 */
export function removeEdgeFromGraph(graph: Graph, edgeId: string): Graph {
  // Check if edge exists
  const edgeExists = graph.edges.some(e => e.id === edgeId);
  if (!edgeExists) {
    return graph; // No changes if edge doesn't exist
  }

  // Remove edge
  const updatedEdges = graph.edges.filter(e => e.id !== edgeId);

  // Create updated graph
  const updatedGraph: Graph = {
    ...graph,
    edges: updatedEdges,
    updatedAt: new Date()
  };

  return updatedGraph;
}

/**
 * Get node by ID
 */
export function getNodeById(graph: Graph, nodeId: string): GraphNode | undefined {
  return graph.nodes.find(n => n.id === nodeId);
}

/**
 * Get edge by ID
 */
export function getEdgeById(graph: Graph, edgeId: string): GraphEdge | undefined {
  return graph.edges.find(e => e.id === edgeId);
}

/**
 * Find nodes by property value
 */
export function findNodesByProperty(
  graph: Graph,
  propertyKey: string,
  propertyValue: any
): GraphNode[] {
  return graph.nodes.filter(
    node => node.properties[propertyKey] === propertyValue
  );
}

/**
 * Find edges by property value
 */
export function findEdgesByProperty(
  graph: Graph,
  propertyKey: string,
  propertyValue: any
): GraphEdge[] {
  return graph.edges.filter(
    edge => edge.properties[propertyKey] === propertyValue
  );
}

/**
 * Get adjacent nodes (neighbors)
 */
export function getAdjacentNodes(
  graph: Graph,
  nodeId: string,
  direction: 'outgoing' | 'incoming' | 'both' = 'both'
): GraphNode[] {
  const adjacentNodeIds = new Set<string>();

  // Get outgoing connections
  if (direction === 'outgoing' || direction === 'both') {
    graph.edges
      .filter(e => e.source === nodeId)
      .forEach(e => adjacentNodeIds.add(e.target));
  }

  // Get incoming connections
  if (direction === 'incoming' || direction === 'both') {
    graph.edges
      .filter(e => e.target === nodeId)
      .forEach(e => adjacentNodeIds.add(e.source));
  }

  // Find nodes with these IDs
  return graph.nodes.filter(node => adjacentNodeIds.has(node.id));
}

/**
 * Get edges between nodes
 */
export function getEdgesBetween(
  graph: Graph,
  sourceId: string,
  targetId: string,
  direction: 'directed' | 'undirected' = 'directed'
): GraphEdge[] {
  if (direction === 'directed') {
    return graph.edges.filter(
      e => e.source === sourceId && e.target === targetId
    );
  } else {
    return graph.edges.filter(
      e => (e.source === sourceId && e.target === targetId) ||
           (e.source === targetId && e.target === sourceId)
    );
  }
}

/**
 * Merge graphs
 *
 * Represents the dialectical synthesis of multiple graphs into a higher unity
 */
export function mergeGraphs(
  graphs: Graph[],
  options: {
    name?: string;
    description?: string;
    deduplicateNodes?: boolean;
    deduplicateEdges?: boolean;
  } = {}
): Graph {
  if (graphs.length === 0) {
    throw new Error("Cannot merge empty list of graphs");
  }

  if (graphs.length === 1) {
    return graphs[0]; // Nothing to merge
  }

  const deduplicateNodes = options.deduplicateNodes !== false;
  const deduplicateEdges = options.deduplicateEdges !== false;

  // Track already added nodes and edges
  const nodeMap = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();

  // Process each graph
  for (const graph of graphs) {
    // Add nodes
    for (const node of graph.nodes) {
      if (!nodeMap.has(node.id)) {
        nodeMap.set(node.id, node);
      }
    }

    // Add edges
    for (const edge of graph.edges) {
      if (!edgeMap.has(edge.id)) {
        // Skip edges that reference nonexistent nodes
        if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
          edgeMap.set(edge.id, edge);
        }
      }
    }
  }

  // Create merged graph
  return createGraph({
    name: options.name || `Merged Graph (${graphs.map(g => g.name).join(', ')})`,
    description: options.description || `Merged from ${graphs.length} graphs`,
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
    directed: graphs[0].directed,
    multigraph: graphs.some(g => g.multigraph),
    properties: {
      merged: true,
      sourceGraphs: graphs.map(g => ({ id: g.id, name: g.name })),
      mergedAt: new Date()
    }
  });
}

/**
 * Convert graph to an adjacency list format
 *
 * This is often more useful for graph algorithms
 */
export function toAdjacencyList(
  graph: Graph,
  direction: 'outgoing' | 'incoming' | 'both' = 'outgoing'
): Map<string, string[]> {
  const adjacencyList = new Map<string, string[]>();

  // Initialize all nodes with empty adjacency lists
  for (const node of graph.nodes) {
    adjacencyList.set(node.id, []);
  }

  // Add edges to adjacency lists
  for (const edge of graph.edges) {
    // Outgoing edges
    if (direction === 'outgoing' || direction === 'both') {
      const outgoing = adjacencyList.get(edge.source) || [];
      outgoing.push(edge.target);
      adjacencyList.set(edge.source, outgoing);
    }

    // Incoming edges
    if (direction === 'incoming' || direction === 'both') {
      const incoming = adjacencyList.get(edge.target) || [];
      incoming.push(edge.source);
      adjacencyList.set(edge.target, incoming);
    }
  }

  return adjacencyList;
}

/**
 * Convert graph to an adjacency matrix format
 *
 * Useful for certain graph algorithms and mathematical operations
 */
export function toAdjacencyMatrix(graph: Graph): {
  matrix: number[][],
  nodeIds: string[]
} {
  const nodeIds = graph.nodes.map(n => n.id);
  const nodeIdToIndex = new Map<string, number>();

  // Create mapping from node IDs to matrix indices
  nodeIds.forEach((id, index) => {
    nodeIdToIndex.set(id, index);
  });

  // Initialize matrix with zeros
  const n = nodeIds.length;
  const matrix = Array(n).fill(0).map(() => Array(n).fill(0));

  // Populate matrix
  for (const edge of graph.edges) {
    const sourceIndex = nodeIdToIndex.get(edge.source);
    const targetIndex = nodeIdToIndex.get(edge.target);

    if (sourceIndex !== undefined && targetIndex !== undefined) {
      matrix[sourceIndex][targetIndex] = 1;

      // If undirected, mark the reverse edge as well
      if (!graph.directed || !edge.directed) {
        matrix[targetIndex][sourceIndex] = 1;
      }
    }
  }

  return { matrix, nodeIds };
}

/**
 * Calculate basic graph metrics
 */
export function calculateGraphMetrics(graph: Graph): {
  nodeCount: number;
  edgeCount: number;
  density: number;
  isConnected: boolean;
  averageDegree: number;
  degreeCentrality: Map<string, {in: number, out: number, total: number}>;
} {
  const nodeCount = graph.nodes.length;
  const edgeCount = graph.edges.length;

  // Initialize degree tracking
  const degrees = new Map<string, {in: number, out: number, total: number}>();

  graph.nodes.forEach(node => {
    degrees.set(node.id, { in: 0, out: 0, total: 0 });
  });

  // Calculate degrees
  graph.edges.forEach(edge => {
    // Outgoing degree
    const sourceDegree = degrees.get(edge.source);
    if (sourceDegree) {
      sourceDegree.out += 1;
      sourceDegree.total += 1;
    }

    // Incoming degree
    const targetDegree = degrees.get(edge.target);
    if (targetDegree) {
      targetDegree.in += 1;
      targetDegree.total += 1;
    }
  });

  // Calculate average degree
  let totalDegree = 0;
  degrees.forEach(degree => {
    totalDegree += degree.total;
  });
  const averageDegree = nodeCount > 0 ? totalDegree / nodeCount : 0;

  // Calculate density
  // For directed graphs: |E| / (|V| * (|V| - 1))
  // For undirected graphs: 2 * |E| / (|V| * (|V| - 1))
  let density = 0;
  if (nodeCount > 1) {
    const maxEdges = nodeCount * (nodeCount - 1);
    density = graph.directed ? edgeCount / maxEdges : (2 * edgeCount) / maxEdges;
  }

  // Check if graph is connected (simplified version using BFS)
  const isConnected = checkConnectivity(graph);

  return {
    nodeCount,
    edgeCount,
    density,
    isConnected,
    averageDegree,
    degreeCentrality: degrees
  };
}

/**
 * Traverses graph using BFS to check connectivity
 */
function checkConnectivity(graph: Graph): boolean {
  if (graph.nodes.length === 0) return true;

  // Convert to undirected adjacency list for connectivity check
  const adjacencyList = toAdjacencyList(graph, 'both');

  // Start from first node
  const startNodeId = graph.nodes[0].id;
  const visited = new Set<string>([startNodeId]);
  const queue = [startNodeId];

  // BFS traversal
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const neighbors = adjacencyList.get(nodeId) || [];

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  // Graph is connected if all nodes were visited
  return visited.size === graph.nodes.length;
}

/**
 * Serialize graph to JSON
 */
export function serializeGraph(graph: Graph): string {
  return JSON.stringify(graph, (key, value) => {
    if (key === 'createdAt' || key === 'updatedAt') {
      return value instanceof Date ? value.toISOString() : value;
    }
    return value;
  });
}

/**
 * Deserialize graph from JSON
 */
export function deserializeGraph(jsonString: string): Graph {
  const parsed = JSON.parse(jsonString, (key, value) => {
    if (key === 'createdAt' || key === 'updatedAt') {
      return value ? new Date(value) : value;
    }
    return value;
  });

  return GraphSchema.parse(parsed);
}

/**
 * Export graph to DOT format (for GraphViz)
 */
export function exportToDOT(graph: Graph): string {
  const isDirected = graph.directed;
  const graphType = isDirected ? 'digraph' : 'graph';
  const edgeSymbol = isDirected ? '->' : '--';

  let dot = `${graphType} "${graph.name}" {\n`;

  // Add graph attributes
  dot += '  // Graph attributes\n';
  dot += `  label="${graph.name}";\n`;
  if (graph.description) {
    dot += `  tooltip="${graph.description.replace(/"/g, '\\"')}";\n`;
  }

  // Add nodes
  dot += '\n  // Nodes\n';
  for (const node of graph.nodes) {
    const attributes = [];

    if (node.label) {
      attributes.push(`label="${node.label.replace(/"/g, '\\"')}"`);
    }

    // Add node type as shape if possible
    if (node.type) {
      let shape = 'ellipse'; // default

      // Map common entity types to shapes
      switch (node.type.toLowerCase()) {
        case 'person':
        case 'user':
          shape = 'box';
          break;
        case 'document':
        case 'file':
          shape = 'note';
          break;
        case 'concept':
        case 'idea':
          shape = 'polygon';
          break;
        case 'event':
          shape = 'diamond';
          break;
        default:
          // Use first letter of type as shape label
          attributes.push(`shape=circle`);
          if (!node.label) {
            attributes.push(`label="${node.type.charAt(0).toUpperCase()}"`);
          }
      }

      attributes.push(`shape="${shape}"`);
    }

    // Add other properties as tooltip
    if (Object.keys(node.properties).length > 0) {
      const tooltip = Object.entries(node.properties)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\\n');
      attributes.push(`tooltip="${tooltip.replace(/"/g, '\\"')}"`);
    }

    const attributeStr = attributes.length > 0 ? ` [${attributes.join(', ')}]` : '';
    dot += `  "${node.id}"${attributeStr};\n`;
  }

  // Add edges
  dot += '\n  // Edges\n';
  for (const edge of graph.edges) {
    const attributes = [];

    if (edge.label) {
      attributes.push(`label="${edge.label.replace(/"/g, '\\"')}"`);
    } else if (edge.type) {
      attributes.push(`label="${edge.type.replace(/"/g, '\\"')}"`);
    }

    // Handle edge direction
    if (isDirected && !edge.directed) {
      attributes.push('dir=none');
    }

    // Add other properties as tooltip
    if (Object.keys(edge.properties).length > 0) {
      const tooltip = Object.entries(edge.properties)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\\n');
      attributes.push(`tooltip="${tooltip.replace(/"/g, '\\"')}"`);
    }

    const attributeStr = attributes.length > 0 ? ` [${attributes.join(', ')}]` : '';
    dot += `  "${edge.source}" ${edgeSymbol} "${edge.target}"${attributeStr};\n`;
  }

  dot += '}\n';
  return dot;
}

/**
 * Export graph to simple CSV format
 */
export function exportToCSV(graph: Graph): {
  nodes: string; // CSV string for nodes
  edges: string; // CSV string for edges
} {
  // Generate nodes CSV
  let nodesCSV = 'id,type,label\n';
  for (const node of graph.nodes) {
    const label = node.label ? `"${node.label.replace(/"/g, '""')}"` : '';
    nodesCSV += `${node.id},${node.type},${label}\n`;
  }

  // Generate edges CSV
  let edgesCSV = 'id,source,target,type,label,directed\n';
  for (const edge of graph.edges) {
    const label = edge.label ? `"${edge.label.replace(/"/g, '""')}"` : '';
    edgesCSV += `${edge.id},${edge.source},${edge.target},${edge.type},${label},${edge.directed}\n`;
  }

  return { nodes: nodesCSV, edges: edgesCSV };
}

/**
 * Import graph from CSV format
 */
export function importFromCSV(
  nodesCSV: string,
  edgesCSV: string,
  options: {
    name?: string;
    description?: string;
    directed?: boolean;
  } = {}
): Graph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Parse nodes CSV
  const nodeLines = nodesCSV.split('\n').filter(line => line.trim());
  const nodeHeader = nodeLines[0].split(',');

  // Find columns
  const nodeIdIndex = nodeHeader.findIndex(col => col.trim().toLowerCase() === 'id');
  const nodeTypeIndex = nodeHeader.findIndex(col => col.trim().toLowerCase() === 'type');
  const nodeLabelIndex = nodeHeader.findIndex(col => col.trim().toLowerCase() === 'label');

  if (nodeIdIndex === -1 || nodeTypeIndex === -1) {
    throw new Error('Nodes CSV must have at least id and type columns');
  }

  // Parse node rows
  for (let i = 1; i < nodeLines.length; i++) {
    const columns = parseCSVLine(nodeLines[i]);

    if (columns.length <= Math.max(nodeIdIndex, nodeTypeIndex)) {
      continue; // Skip invalid rows
    }

    nodes.push({
      id: columns[nodeIdIndex],
      type: columns[nodeTypeIndex],
      label: nodeLabelIndex !== -1 ? columns[nodeLabelIndex] : undefined,
      properties: {}
    });
  }

  // Parse edges CSV
  const edgeLines = edgesCSV.split('\n').filter(line => line.trim());
  const edgeHeader = edgeLines[0].split(',');

  // Find columns
  const edgeIdIndex = edgeHeader.findIndex(col => col.trim().toLowerCase() === 'id');
  const edgeSourceIndex = edgeHeader.findIndex(col => col.trim().toLowerCase() === 'source');
  const edgeTargetIndex = edgeHeader.findIndex(col => col.trim().toLowerCase() === 'target');
  const edgeTypeIndex = edgeHeader.findIndex(col => col.trim().toLowerCase() === 'type');
  const edgeLabelIndex = edgeHeader.findIndex(col => col.trim().toLowerCase() === 'label');
  const edgeDirectedIndex = edgeHeader.findIndex(col => col.trim().toLowerCase() === 'directed');

  if (edgeSourceIndex === -1 || edgeTargetIndex === -1) {
    throw new Error('Edges CSV must have at least source and target columns');
  }

  // Parse edge rows
  for (let i = 1; i < edgeLines.length; i++) {
    const columns = parseCSVLine(edgeLines[i]);

    if (columns.length <= Math.max(edgeSourceIndex, edgeTargetIndex)) {
      continue; // Skip invalid rows
    }

    edges.push({
      id: edgeIdIndex !== -1 ? columns[edgeIdIndex] : uuidv4(),
      source: columns[edgeSourceIndex],
      target: columns[edgeTargetIndex],
      type: edgeTypeIndex !== -1 ? columns[edgeTypeIndex] : 'unknown',
      label: edgeLabelIndex !== -1 ? columns[edgeLabelIndex] : undefined,
      directed: edgeDirectedIndex !== -1
        ? columns[edgeDirectedIndex].toLowerCase() === 'true'
        : options.directed !== false,
      properties: {}
    });
  }

  // Create and return graph
  return createGraph({
    name: options.name || 'Imported Graph',
    description: options.description || 'Imported from CSV',
    nodes,
    edges,
    directed: options.directed !== false
  });
}

/**
 * Helper for parsing CSV lines with quote handling
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let currentValue = '';

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Check for escaped quotes (double quotes)
      if (i < line.length - 1 && line[i + 1] === '"') {
        currentValue += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  // Add the last field
  result.push(currentValue);

  return result;
}

/**
 * Create a subgraph from a subset of nodes
 */
export function createSubgraph(
  graph: Graph,
  nodeIds: string[],
  options: {
    includeConnectedEdges?: boolean;
    name?: string;
    description?: string;
  } = {}
): Graph {
  const nodeIdSet = new Set(nodeIds);

  // Get nodes
  const subgraphNodes = graph.nodes.filter(node => nodeIdSet.has(node.id));

  // Get edges
  let subgraphEdges: GraphEdge[] = [];

  if (options.includeConnectedEdges !== false) {
    subgraphEdges = graph.edges.filter(edge =>
      nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target)
    );
  }

  // Create subgraph
  return createGraph({
    name: options.name || `Subgraph of ${graph.name}`,
    description: options.description || `Subgraph created from ${nodeIds.length} nodes`,
    nodes: subgraphNodes,
    edges: subgraphEdges,
    directed: graph.directed,
    multigraph: graph.multigraph,
    properties: {
      ...graph.properties,
      parentGraph: graph.id,
      isSubgraph: true,
      subgraphCreatedAt: new Date()
    }
  });
}

/**
 * Extract connected components from graph
 */
export function extractConnectedComponents(graph: Graph): Graph[] {
  // For directed graphs, convert to undirected for component analysis
  const adjacencyList = toAdjacencyList(graph, 'both');
  const visited = new Set<string>();
  const components: string[][] = [];

  // Run BFS from each unvisited node
  for (const node of graph.nodes) {
    if (visited.has(node.id)) continue;

    // Start a new component
    const component: string[] = [];
    const queue: string[] = [node.id];
    visited.add(node.id);

    // BFS to find connected component
    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);

      // Visit neighbors
      const neighbors = adjacencyList.get(current) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    components.push(component);
  }

  // Create a subgraph for each component
  return components.map((nodeIds, index) => {
    return createSubgraph(graph, nodeIds, {
      includeConnectedEdges: true,
      name: `Component ${index + 1} of ${graph.name}`,
      description: `Connected component with ${nodeIds.length} nodes`
    });
  });
}

/**
 * Apply layout coordinates to graph
 *
 * This function computes x,y positions for visualization
 * Simple force-directed algorithm implementation
 */
export function applyForceDirectedLayout(
  graph: Graph,
  options: {
    width?: number;
    height?: number;
    iterations?: number;
    nodeCharge?: number;
  } = {}
): Graph {
  const width = options.width || 800;
  const height = options.height || 600;
  const iterations = options.iterations || 100;
  const nodeCharge = options.nodeCharge || -50;

  // Initialize positions randomly
  const positions = new Map<string, {x: number, y: number}>();

  for (const node of graph.nodes) {
    positions.set(node.id, {
      x: Math.random() * width,
      y: Math.random() * height
    });
  }

  // Run force-directed algorithm
  for (let i = 0; i < iterations; i++) {
    // Reset forces
    const forces = new Map<string, {x: number, y: number}>();
    for (const node of graph.nodes) {
      forces.set(node.id, {x: 0, y: 0});
    }

    // Repulsive forces between nodes
    for (let j = 0; j < graph.nodes.length; j++) {
      const node1 = graph.nodes[j];
      const pos1 = positions.get(node1.id)!;

      for (let k = j + 1; k < graph.nodes.length; k++) {
        const node2 = graph.nodes[k];
        const pos2 = positions.get(node2.id)!;

        // Calculate distance
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const distanceSq = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSq) || 0.1;

        // Calculate repulsive force
        const force = nodeCharge / distanceSq;
        const fx = force * dx / distance;
        const fy = force * dy / distance;

        // Apply force to both nodes
        const force1 = forces.get(node1.id)!;
        const force2 = forces.get(node2.id)!;

        force1.x -= fx;
        force1.y -= fy;
        force2.x += fx;
        force2.y += fy;

        forces.set(node1.id, force1);
        forces.set(node2.id, force2);
      }
    }

    // Attractive forces along edges
    for (const edge of graph.edges) {
      const sourcePos = positions.get(edge.source);
      const targetPos = positions.get(edge.target);

      if (!sourcePos || !targetPos) continue;

      // Calculate distance
      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 0.1;

      // Calculate attractive force
      const force = distance / 30;
      const fx = force * dx / distance;
      const fy = force * dy / distance;

      // Apply force to both nodes
      const sourceForce = forces.get(edge.source)!;
      const targetForce = forces.get(edge.target)!;

      sourceForce.x += fx;
      sourceForce.y += fy;
      targetForce.x -= fx;
      targetForce.y -= fy;

      forces.set(edge.source, sourceForce);
      forces.set(edge.target, targetForce);
    }

    // Update positions
    for (const node of graph.nodes) {
      const pos = positions.get(node.id)!;
      const force = forces.get(node.id)!;

      pos.x += Math.min(10, Math.max(-10, force.x));
      pos.y += Math.min(10, Math.max(-10, force.y));

      // Constrain to bounds
      pos.x = Math.max(0, Math.min(width, pos.x));
      pos.y = Math.max(0, Math.min(height, pos.y));

      positions.set(node.id, pos);
    }
  }

  // Apply positions to node properties
  const updatedNodes = graph.nodes.map(node => {
    const pos = positions.get(node.id);
    return {
      ...node,
      properties: {
        ...node.properties,
        x: pos?.x,
        y: pos?.y
      }
    };
  });

  // Create updated graph
  return {
    ...graph,
    nodes: updatedNodes,
    properties: {
      ...graph.properties,
      layout: {
        type: 'force-directed',
        width,
        height,
        applied: new Date()
      }
    },
    updatedAt: new Date()
  };
}
