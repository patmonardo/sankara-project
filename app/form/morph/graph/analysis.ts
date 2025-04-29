import { createMorph } from "../core";
import { GraphShape, GraphAnalysis } from "./types";

/**
 * GraphAnalysisMorph - Adds analysis data to a graph
 * 
 * This morph analyzes the structure of a graph and adds metrics like:
 * - Entity and relationship counts
 * - Connectivity analysis
 * - Community detection
 * - Centrality measures
 * - Path analysis
 */
export const GraphAnalysisMorph = createMorph<GraphShape, GraphShape & { analysis: GraphAnalysis }>(
  "GraphAnalysisMorph",
  (graph, context) => {
    // Skip analysis if we're just creating a graph
    if (context?.data?.config?.operation === "create") {
      return graph as GraphShape & { analysis: GraphAnalysis };
    }
    
    // Initialize analysis object
    const analysis: GraphAnalysis = {
      metrics: {
        entityCounts: countEntitiesByLabel(graph),
        relationCounts: countRelationsByType(graph),
        averageConnectivity: calculateAverageConnectivity(graph),
        mostConnectedEntities: findMostConnectedEntities(graph, 5)
      }
    };
    
    // Perform optional analyses based on context
    const options = context?.data?.config?.analysisOptions || {};
    
    if (options.includeCommunities || context?.data?.config?.operation === "full") {
      analysis.communities = detectCommunities(graph);
    }
    
    if (options.includeCentrality || context?.data?.config?.operation === "full") {
      analysis.centrality = calculateCentralityMeasures(graph);
    }
    
    if (options.includePaths || context?.data?.config?.operation === "full") {
      analysis.paths = findInterestingPaths(graph);
    }
    
    // Return the graph with analysis added
    return {
      ...graph,
      analysis,
      meta: {
        ...graph.meta,
        analysisPerformed: true,
        analysisTimestamp: new Date().toISOString()
      }
    };
  },
  {
    pure: false, // Uses Date()
    fusible: true,
    cost: 5, // More expensive due to graph algorithms
  }
);

// Helper functions for graph analysis

function countEntitiesByLabel(graph: GraphShape): Record<string, number> {
  const counts: Record<string, number> = {};
  
  graph.entities.forEach(entity => {
    entity.labels.forEach(label => {
      counts[label] = (counts[label] || 0) + 1;
    });
  });
  
  return counts;
}

function countRelationsByType(graph: GraphShape): Record<string, number> {
  const counts: Record<string, number> = {};
  
  graph.relations.forEach(rel => {
    counts[rel.type] = (counts[rel.type] || 0) + 1;
  });
  
  return counts;
}

function calculateAverageConnectivity(graph: GraphShape): number {
  if (graph.entities.length === 0) return 0;
  
  const connectionCounts = new Map<string, number>();
  
  // Count connections for each entity
  graph.relations.forEach(rel => {
    connectionCounts.set(rel.fromId, (connectionCounts.get(rel.fromId) || 0) + 1);
    connectionCounts.set(rel.toId, (connectionCounts.get(rel.toId) || 0) + 1);
  });
  
  // Calculate average
  let totalConnections = 0;
  connectionCounts.forEach(count => {
    totalConnections += count;
  });
  
  return totalConnections / graph.entities.length;
}

function findMostConnectedEntities(graph: GraphShape, limit: number): Array<{
  id: string;
  label: string;
  connectionCount: number;
}> {
  const connectionCounts = new Map<string, number>();
  
  // Count connections for each entity
  graph.relations.forEach(rel => {
    connectionCounts.set(rel.fromId, (connectionCounts.get(rel.fromId) || 0) + 1);
    connectionCounts.set(rel.toId, (connectionCounts.get(rel.toId) || 0) + 1);
  });
  
  // Convert to array and sort
  const entityConnections = Array.from(connectionCounts.entries())
    .map(([id, count]) => {
      const entity = graph.entities.find(e => e.id === id);
      return {
        id,
        label: entity ? entity.labels[0] : "Unknown",
        connectionCount: count
      };
    })
    .sort((a, b) => b.connectionCount - a.connectionCount);
  
  return entityConnections.slice(0, limit);
}

function detectCommunities(graph: GraphShape): Array<{
  id: string;
  entityIds: string[];
  size: number;
  cohesion: number;
}> {
  // Simplified community detection using a basic clustering approach
  // In a real implementation, you would use a proper community detection algorithm
  
  // For this example, we'll just create simple communities based on node connectivity
  const communities: Array<{
    id: string;
    entityIds: string[];
    size: number;
    cohesion: number;
  }> = [];
  
  // Create a simple adjacency list
  const adjacencyList = new Map<string, Set<string>>();
  
  // Initialize adjacency list
  graph.entities.forEach(entity => {
    adjacencyList.set(entity.id, new Set());
  });
  
  // Fill adjacency list
  graph.relations.forEach(rel => {
    adjacencyList.get(rel.fromId)?.add(rel.toId);
    adjacencyList.get(rel.toId)?.add(rel.fromId);
  });
  
  // Very simplified community detection (in practice, use a proper algorithm)
  const visited = new Set<string>();
  let communityId = 1;
  
  graph.entities.forEach(entity => {
    if (!visited.has(entity.id)) {
      const communityEntities: string[] = [];
      const toVisit = [entity.id];
      
      while (toVisit.length > 0) {
        const current = toVisit.pop()!;
        if (!visited.has(current)) {
          visited.add(current);
          communityEntities.push(current);
          
          adjacencyList.get(current)?.forEach(neighbor => {
            if (!visited.has(neighbor)) {
              toVisit.push(neighbor);
            }
          });
        }
      }
      
      // Only add as community if it has more than one entity
      if (communityEntities.length > 1) {
        communities.push({
          id: `community-${communityId++}`,
          entityIds: communityEntities,
          size: communityEntities.length,
          cohesion: calculateCohesion(communityEntities, graph)
        });
      }
    }
  });
  
  return communities;
}

function calculateCohesion(entityIds: string[], graph: GraphShape): number {
  // Calculate what percentage of possible connections within the community actually exist
  // For n entities, max possible connections is n(n-1)/2
  const n = entityIds.length;
  if (n <= 1) return 0;
  
  const maxPossibleConnections = (n * (n - 1)) / 2;
  
  // Count actual connections within community
  let actualConnections = 0;
  
  graph.relations.forEach(rel => {
    if (entityIds.includes(rel.fromId) && entityIds.includes(rel.toId)) {
      actualConnections++;
    }
  });
  
  return actualConnections / maxPossibleConnections;
}

function calculateCentralityMeasures(graph: GraphShape): {
  betweenness?: Record<string, number>;
  closeness?: Record<string, number>;
  eigenvector?: Record<string, number>;
} {
  // This would normally use proper graph algorithms
  // For this example, we'll implement a simplified closeness centrality
  
  const closeness: Record<string, number> = {};
  
  // Calculate closeness centrality
  graph.entities.forEach(entity => {
    const distances = calculateDistances(entity.id, graph);
    
    // Sum all distances
    let sum = 0;
    let count = 0;
    
    Object.values(distances).forEach(distance => {
      if (distance !== Infinity && distance > 0) {
        sum += distance;
        count++;
      }
    });
    
    // Calculate closeness (inverse of average distance)
    closeness[entity.id] = count > 0 ? count / sum : 0;
  });
  
  return { closeness };
}

function calculateDistances(startId: string, graph: GraphShape): Record<string, number> {
  const distances: Record<string, number> = {};
  
  // Initialize all distances to infinity
  graph.entities.forEach(entity => {
    distances[entity.id] = Infinity;
  });
  
  // Distance to self is 0
  distances[startId] = 0;
  
  // Create adjacency list for faster lookup
  const adjacencyList = new Map<string, string[]>();
  
  graph.entities.forEach(entity => {
    adjacencyList.set(entity.id, []);
  });
  
  graph.relations.forEach(rel => {
    adjacencyList.get(rel.fromId)?.push(rel.toId);
    adjacencyList.get(rel.toId)?.push(rel.fromId);
  });
  
  // BFS to find shortest paths
  const queue = [startId];
  const visited = new Set<string>([startId]);
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    adjacencyList.get(current)?.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        distances[neighbor] = distances[current] + 1;
        queue.push(neighbor);
      }
    });
  }
  
  return distances;
}

function findInterestingPaths(graph: GraphShape): {
  shortestPaths?: Array<{
    fromId: string;
    toId: string;
    length: number;
    pathEntityIds: string[];
    pathRelationIds: string[];
  }>;
} {
  // Find some interesting paths in the graph - for this example just a few shortest paths
  const paths: Array<{
    fromId: string;
    toId: string;
    length: number;
    pathEntityIds: string[];
    pathRelationIds: string[];
  }> = [];
  
  // Find most connected entities to use as path endpoints
  const mostConnected = findMostConnectedEntities(graph, 3);
  
  if (mostConnected.length >= 2) {
    // Find shortest path between the two most connected entities
    const path = findShortestPath(mostConnected[0].id, mostConnected[1].id, graph);
    
    if (path) {
      paths.push(path);
    }
  }
  
  return { shortestPaths: paths };
}

function findShortestPath(
  startId: string,
  endId: string,
  graph: GraphShape
): {
  fromId: string;
  toId: string;
  length: number;
  pathEntityIds: string[];
  pathRelationIds: string[];
} | null {
  // Create adjacency list with relations
  const adjacencyList = new Map<string, Array<{ id: string, relationshipId: string }>>();
  
  graph.entities.forEach(entity => {
    adjacencyList.set(entity.id, []);
  });
  
  graph.relations.forEach(rel => {
    adjacencyList.get(rel.fromId)?.push({ id: rel.toId, relationshipId: rel.id });
    adjacencyList.get(rel.toId)?.push({ id: rel.fromId, relationshipId: rel.id });
  });
  
  // BFS to find shortest path
  const queue: Array<{
    id: string;
    path: string[];
    relations: string[];
  }> = [{ id: startId, path: [startId], relations: [] }];
  
  const visited = new Set<string>([startId]);
  
  while (queue.length > 0) {
    const { id, path, relations } = queue.shift()!;
    
    if (id === endId) {
      return {
        fromId: startId,
        toId: endId,
        length: path.length - 1,
        pathEntityIds: path,
        pathRelationIds: relations
      };
    }
    
    adjacencyList.get(id)?.forEach(neighbor => {
      if (!visited.has(neighbor.id)) {
        visited.add(neighbor.id);
        queue.push({
          id: neighbor.id,
          path: [...path, neighbor.id],
          relations: [...relations, neighbor.relationshipId]
        });
      }
    });
  }
  
  return null;
}