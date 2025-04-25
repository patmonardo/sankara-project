import { createMorph } from "../core";
import { GraphShape, GraphVisualization } from "./types";

/**
 * GraphVisualizationMorph - Adds visualization data to a graph
 * 
 * This morph calculates layout positions and styling for visualizing the graph.
 */
export const GraphVisualizationMorph = createMorph<
  GraphShape & Partial<{ analysis: any }>,
  GraphShape & Partial<{ analysis: any, visualization: GraphVisualization }>
>(
  "GraphVisualizationMorph",
  (graph, context) => {
    // Skip visualization if we're just creating or analyzing
    if (context?.data?.config?.operation === "create" || 
        context?.data?.config?.operation === "analyze") {
      return graph;
    }
    
    // Get options
    const options = context?.data?.config?.visualizationOptions || {};
    const layout = options.layout || "force";
    
    // Generate positions based on layout type
    const positions = calculatePositions(graph, layout);
    
    // Generate styling
    const style = generateStyling(graph);
    
    // Generate focus areas if we have communities from analysis
    const focusAreas = options.highlightCommunities && graph.analysis?.communities ? 
      generateFocusAreas(graph.analysis.communities) : undefined;
    
    // Create visualization object
    const visualization: GraphVisualization = {
      layout,
      positions,
      style,
      focusAreas
    };
    
    // Return graph with visualization data
    return {
      ...graph,
      visualization,
      meta: {
        ...graph.meta,
        visualizationGenerated: true,
        visualizationTimestamp: new Date().toISOString()
      }
    };
  },
  {
    pure: false, // Uses randomness and Date()
    fusible: true,
    cost: 3
  }
);

// Helper functions for visualization

function calculatePositions(
  graph: GraphShape, 
  layoutType: string
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  
  switch (layoutType) {
    case 'circular':
      return calculateCircularLayout(graph);
    case 'hierarchical':
      return calculateHierarchicalLayout(graph);
    case 'force':
    default:
      return calculateForceLayout(graph);
  }
}

function calculateCircularLayout(graph: GraphShape): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const entityCount = graph.entities.length;
  
  if (entityCount === 0) return positions;
  
  const radius = 500;
  const center = { x: 500, y: 500 };
  
  graph.entities.forEach((entity, index) => {
    const angle = (2 * Math.PI * index) / entityCount;
    positions[entity.id] = {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    };
  });
  
  return positions;
}

function calculateHierarchicalLayout(graph: GraphShape): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  
  // Find root nodes (nodes with no incoming relationships)
  const hasIncoming = new Set<string>();
  
  graph.relationships.forEach(rel => {
    hasIncoming.add(rel.toId);
  });
  
  const rootIds = graph.entities
    .map(entity => entity.id)
    .filter(id => !hasIncoming.has(id));
  
  // If no root nodes, pick the first entity
  if (rootIds.length === 0 && graph.entities.length > 0) {
    rootIds.push(graph.entities[0].id);
  }
  
  // Create an adjacency list
  const adjacencyList = new Map<string, string[]>();
  
  graph.entities.forEach(entity => {
    adjacencyList.set(entity.id, []);
  });
  
  graph.relationships.forEach(rel => {
    adjacencyList.get(rel.fromId)?.push(rel.toId);
  });
  
  // Assign levels through BFS
  const levels: Record<string, number> = {};
  const visited = new Set<string>();
  
  const queue = rootIds.map(id => ({ id, level: 0 }));
  rootIds.forEach(id => visited.add(id));
  
  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    levels[id] = level;
    
    adjacencyList.get(id)?.forEach(neighborId => {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push({ id: neighborId, level: level + 1 });
      }
    });
  }
  
  // Count nodes at each level
  const nodesAtLevel: Record<number, number> = {};
  const nodesPositionAtLevel: Record<number, number> = {};
  
  Object.values(levels).forEach(level => {
    nodesAtLevel[level] = (nodesAtLevel[level] || 0) + 1;
    nodesPositionAtLevel[level] = 0;
  });
  
  // Position nodes
  const levelHeight = 150;
  const width = 1000;
  
  graph.entities.forEach(entity => {
    const id = entity.id;
    
    if (levels[id] !== undefined) {
      const level = levels[id];
      const nodeCount = nodesAtLevel[level];
      const position = nodesPositionAtLevel[level]++;
      
      positions[id] = {
        x: (position + 0.5) * (width / nodeCount),
        y: 100 + level * levelHeight
      };
    } else {
      // Handle nodes not reachable from roots
      positions[id] = {
        x: Math.random() * width,
        y: 50
      };
    }
  });
  
  return positions;
}

function calculateForceLayout(graph: GraphShape): Record<string, { x: number; y: number }> {
  // In a real implementation, this would use a force-directed algorithm
  // For this example, we'll just create a simple approximation
  
  const positions: Record<string, { x: number; y: number }> = {};
  const width = 1000;
  const height = 800;
  
  // Initialize with random positions
  graph.entities.forEach(entity => {
    positions[entity.id] = {
      x: Math.random() * width,
      y: Math.random() * height
    };
  });
  
  // In a real implementation, you would run several iterations of force simulation
  // For this example, we'll just return the random positions
  return positions;
}

function generateStyling(graph: GraphShape): {
  entityStyles: Record<string, { color: string; size: number; icon?: string; shape?: string }>;
  relationshipStyles: Record<string, { color: string; width: number; dashed?: boolean; arrow?: string }>;
} {
  const entityColors = [
    "#4285F4", "#EA4335", "#FBBC05", "#34A853", 
    "#FF6D01", "#46BDC6", "#7BAAF7", "#F66DBA"
  ];
  
  const relationshipColors = [
    "#4285F4", "#EA4335", "#FBBC05", "#34A853", 
    "#FF6D01", "#46BDC6", "#7BAAF7"
  ];
  
  const entityStyles: Record<string, { color: string; size: number; icon?: string; shape?: string }> = {};
  const relationshipStyles: Record<string, { color: string; width: number; dashed?: boolean; arrow?: string }> = {};
  
  // Generate entity styles based on labels
  const uniqueLabels = new Set<string>();
  graph.entities.forEach(entity => {
    entity.labels.forEach(label => uniqueLabels.add(label));
  });
  
  Array.from(uniqueLabels).forEach((label, index) => {
    const color = entityColors[index % entityColors.length];
    
    entityStyles[label] = {
      color,
      size: 30,
      shape: getShapeForLabel(label)
    };
  });
  
  // Generate relationship styles based on types
  const uniqueTypes = new Set<string>();
  graph.relationships.forEach(rel => {
    uniqueTypes.add(rel.type);
  });
  
  Array.from(uniqueTypes).forEach((type, index) => {
    const color = relationshipColors[index % relationshipColors.length];
    
    relationshipStyles[type] = {
      color,
      width: 2,
      dashed: false,
      arrow: "forward"
    };
  });
  
  return {
    entityStyles,
    relationshipStyles
  };
}

function getShapeForLabel(label: string): string {
  // Assign different shapes based on label
  const commonLabels: Record<string, string> = {
    "Person": "circle",
    "User": "circle",
    "Product": "square",
    "Category": "triangle",
    "Order": "diamond",
    "Customer": "circle",
    "Document": "rectangle"
  };
  
  return commonLabels[label] || "circle";
}

function generateFocusAreas(communities: Array<{ id: string; entityIds: string[]; size: number; cohesion: number }>): Array<{
  name: string;
  entityIds: string[];
  highlight: boolean;
  zoom: number;
}> {
  return communities.map(community => ({
    name: `Community ${community.id.replace('community-', '')}`,
    entityIds: community.entityIds,
    highlight: true,
    zoom: getZoomLevel(community.size)
  }));
}

function getZoomLevel(communitySize: number): number {
  // Larger communities need lower zoom levels to fit in view
  if (communitySize > 20) return 0.6;
  if (communitySize > 10) return 0.8;
  if (communitySize > 5) return 1.0;
  return 1.2;
}