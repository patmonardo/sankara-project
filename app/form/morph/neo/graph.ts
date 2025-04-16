import { SimpleMorph } from "../morph";
import { FormExecutionContext } from "../../schema/context";
import { CypherNode, CypherRelationship, CypherOutput } from "./cypher";
import { NeoContext } from "./mode";

/**
 * Core graph model representations
 */

/**
 * A graph entity (node)
 */
export interface GraphEntity {
  /** Unique identifier for this entity */
  id: string;
  /** Entity labels (types) */
  labels: string[];
  /** Entity properties */
  properties: Record<string, any>;
  /** Metadata about this entity */
  meta?: {
    /** Source of this entity */
    source?: string;
    /** When this entity was created */
    createdAt?: string;
    /** Original ID from source system */
    originalId?: string;
    /** Importance score (0-100) */
    importance?: number;
    /** Custom metadata */
    [key: string]: any;
  };
}

/**
 * A relationship between entities
 */
export interface GraphRelationship {
  /** Unique identifier for this relationship */
  id: string;
  /** Source entity ID */
  fromId: string;
  /** Target entity ID */
  toId: string;
  /** Relationship type */
  type: string;
  /** Relationship properties */
  properties: Record<string, any>;
  /** Metadata about this relationship */
  meta?: {
    /** Source of this relationship */
    source?: string;
    /** When this relationship was created */
    createdAt?: string;
    /** Strength of relationship (0-100) */
    strength?: number;
    /** Custom metadata */
    [key: string]: any;
  };
}

/**
 * A property graph model
 */
export interface PropertyGraph {
  /** Unique identifier for this graph */
  id: string;
  /** Graph name */
  name: string;
  /** Entities in the graph */
  entities: GraphEntity[];
  /** Relationships in the graph */
  relationships: GraphRelationship[];
  /** Metadata about the graph */
  meta: {
    /** When this graph was created or updated */
    timestamp: string;
    /** Source of the graph data */
    source?: string;
    /** Number of entities */
    entityCount: number;
    /** Number of relationships */
    relationshipCount: number;
    /** Graph schema information */
    schema?: GraphSchema;
    /** Custom metadata */
    [key: string]: any;
  };
}

/**
 * Graph schema information
 */
export interface GraphSchema {
  /** Entity types (labels) */
  entityTypes: {
    /** Label name */
    label: string;
    /** Properties for this entity type */
    properties: {
      /** Property name */
      name: string;
      /** Property type */
      type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
      /** Is property required */
      required?: boolean;
      /** Property description */
      description?: string;
    }[];
  }[];
  /** Relationship types */
  relationshipTypes: {
    /** Relationship type name */
    type: string;
    /** Source entity labels */
    from: string[];
    /** Target entity labels */
    to: string[];
    /** Properties for this relationship type */
    properties?: {
      /** Property name */
      name: string;
      /** Property type */
      type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
      /** Is property required */
      required?: boolean;
      /** Property description */
      description?: string;
    }[];
  }[];
}

/**
 * Graph processing output
 */
export interface GraphOutput {
  /** Unique identifier for this output */
  id: string;
  /** The generated property graph */
  graph: PropertyGraph;
  /** Cypher queries that can be used to create this graph */
  cypherQueries?: CypherOutput;
  /** Analysis results */
  analysis?: GraphAnalysis;
  /** Visualization data */
  visualization?: GraphVisualization;
}

/**
 * Graph analysis results
 */
export interface GraphAnalysis {
  /** Key metrics about the graph */
  metrics: {
    /** Number of entities by label */
    entityCounts: Record<string, number>;
    /** Number of relationships by type */
    relationshipCounts: Record<string, number>;
    /** Average relationships per entity */
    averageConnectivity: number;
    /** Most connected entities */
    mostConnectedEntities: Array<{id: string, label: string, connectionCount: number}>;
  };
  /** Detected communities */
  communities?: Array<{
    id: string;
    entityIds: string[];
    size: number;
    cohesion: number;
  }>;
  /** Centrality scores */
  centrality?: {
    /** Betweenness centrality scores by entity ID */
    betweenness?: Record<string, number>;
    /** Closeness centrality scores by entity ID */
    closeness?: Record<string, number>;
    /** Eigenvector centrality scores by entity ID */
    eigenvector?: Record<string, number>;
  };
  /** Path information */
  paths?: {
    /** Shortest paths between important entities */
    shortestPaths?: Array<{
      fromId: string;
      toId: string;
      length: number;
      pathEntityIds: string[];
      pathRelationshipIds: string[];
    }>;
  };
}

/**
 * Graph visualization data
 */
export interface GraphVisualization {
  /** Layout algorithm used */
  layout: 'force' | 'hierarchical' | 'circular' | 'grid';
  /** Node positions */
  positions: Record<string, {x: number, y: number}>;
  /** Styling information */
  style: {
    /** Entity styling by label */
    entityStyles: Record<string, {
      color: string;
      size: number;
      icon?: string;
      shape?: 'circle' | 'rectangle' | 'diamond';
    }>;
    /** Relationship styling by type */
    relationshipStyles: Record<string, {
      color: string;
      width: number;
      dashed?: boolean;
      arrow?: 'none' | 'forward' | 'backward' | 'both';
    }>;
  };
  /** Focus areas in the graph */
  focusAreas?: Array<{
    name: string;
    entityIds: string[];
    highlight: boolean;
    zoom: number;
  }>;
}

/**
 * Configuration for graph generation
 */
export interface GraphConfig {
  /** Whether to include all properties or just a subset */
  includeAllProperties?: boolean;
  /** Properties to include or exclude */
  propertyFilter?: string[];
  /** Whether to analyze the graph */
  analyze?: boolean;
  /** Community detection algorithm */
  communityDetection?: 'louvain' | 'label-propagation' | 'girvan-newman';
  /** Whether to generate visualization data */
  generateVisualization?: boolean;
  /** Whether to generate Cypher queries */
  generateCypher?: boolean;
  /** Visualization layout algorithm */
  visualizationLayout?: 'force' | 'hierarchical' | 'circular' | 'grid';
  /** Layout specific settings */
  layoutSettings?: Record<string, any>;
}

/**
 * Creates a property graph from various inputs
 */
export const FormToGraphMorph = new SimpleMorph<any, GraphOutput>(
  "FormToGraphMorph",
  (input, context) => {
    // Convert context to NeoContext
    const neoContext = context as NeoContext;
    const config = neoContext.graph || {};
    
    // Create a unique ID for this graph
    const graphId = `graph-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Default empty graph
    const graph: PropertyGraph = {
      id: graphId,
      name: neoContext.name || "Generated Graph",
      entities: [],
      relationships: [],
      meta: {
        timestamp: new Date().toISOString(),
        source: "FormToGraphMorph",
        entityCount: 0,
        relationshipCount: 0
      }
    };
    
    // Process input based on its type
    if (input) {
      if (Array.isArray(input)) {
        // Array of forms or entities
        processEntitiesArray(input, graph);
      } else if (typeof input === 'object') {
        // Single form or entity
        processEntity(input, graph);
      }
    }
    
    // Update counts
    graph.meta.entityCount = graph.entities.length;
    graph.meta.relationshipCount = graph.relationships.length;
    
    // Create result
    const result: GraphOutput = {
      id: `graph-output-${graphId}`,
      graph
    };
    
    // Generate analysis if requested
    if (config.analyze) {
      result.analysis = analyzeGraph(graph, config);
    }
    
    // Generate visualization if requested
    if (config.generateVisualization) {
      result.visualization = generateVisualization(graph, config);
    }
    
    // Generate Cypher if requested
    if (config.generateCypher) {
      result.cypherQueries = generateCypherFromGraph(graph);
    }
    
    return result;
  },
  {
    pure: false,
    fusible: true,
    cost: 5, // Higher cost due to potential complexity
    memoizable: false
  }
);

/**
 * Process an array of entities to add to the graph
 */
function processEntitiesArray(entities: any[], graph: PropertyGraph): void {
  // Process each entity
  entities.forEach(entity => {
    processEntity(entity, graph);
  });
  
  // Look for relationships between entities
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const entityA = entities[i];
      const entityB = entities[j];
      
      // Find matching properties that could indicate relationships
      const possibleRelationships = findPossibleRelationships(entityA, entityB);
      
      // Add discovered relationships
      possibleRelationships.forEach(rel => {
        const entityAId = findOrCreateEntity(entityA, graph).id;
        const entityBId = findOrCreateEntity(entityB, graph).id;
        
        // Create the relationship
        addRelationship(graph, {
          id: `rel-${entityAId}-${rel.type}-${entityBId}`,
          fromId: entityAId,
          toId: entityBId,
          type: rel.type,
          properties: rel.properties || {},
          meta: {
            createdAt: new Date().toISOString(),
            source: "auto-discovery",
            confidence: rel.confidence
          }
        });
      });
    }
  }
}

/**
 * Process a single entity to add to the graph
 */
function processEntity(entity: any, graph: PropertyGraph): GraphEntity {
  // Determine entity ID
  const entityId = entity.id || `entity-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Determine labels
  const labels = determineEntityLabels(entity);
  
  // Extract properties
  const properties = extractEntityProperties(entity);
  
  // Create graph entity
  const graphEntity: GraphEntity = {
    id: entityId,
    labels,
    properties,
    meta: {
      createdAt: new Date().toISOString(),
      source: entity._source || "FormToGraphMorph"
    }
  };
  
  // Add to graph if not already present
  const existingEntityIndex = graph.entities.findIndex(e => e.id === entityId);
  if (existingEntityIndex >= 0) {
    graph.entities[existingEntityIndex] = graphEntity;
  } else {
    graph.entities.push(graphEntity);
  }
  
  // Process embedded relationships
  processEmbeddedRelationships(entity, graphEntity, graph);
  
  return graphEntity;
}

/**
 * Find an existing entity or create a new one
 */
function findOrCreateEntity(entity: any, graph: PropertyGraph): GraphEntity {
  // Try to find by ID first
  if (entity.id) {
    const existing = graph.entities.find(e => e.id === entity.id);
    if (existing) return existing;
  }
  
  // Try to find by key properties
  const keyProps = ['id', 'name', 'key', 'identifier'].filter(k => entity[k]);
  if (keyProps.length > 0) {
    const keyProp = keyProps[0];
    const existing = graph.entities.find(e => e.properties[keyProp] === entity[keyProp]);
    if (existing) return existing;
  }
  
  // Not found, create new
  return processEntity(entity, graph);
}

/**
 * Determine appropriate labels for an entity
 */
function determineEntityLabels(entity: any): string[] {
  // Start with explicit type/label if available
  const explicitLabels = [];
  if (entity._type) explicitLabels.push(entity._type);
  if (entity._label) explicitLabels.push(entity._label);
  if (entity._labels && Array.isArray(entity._labels)) {
    explicitLabels.push(...entity._labels);
  }
  
  if (explicitLabels.length > 0) {
    return explicitLabels;
  }
  
  // Infer from form ID or object structure
  if (entity._formId) {
    return [toTitleCase(entity._formId.replace(/Form$/, ''))];
  }
  
  // Infer from property presence
  const labelMap: Record<string, string[]> = {
    'Person': ['name', 'firstName', 'lastName', 'email', 'phone'],
    'Organization': ['orgName', 'companyName', 'taxId', 'industry'],
    'Product': ['productName', 'sku', 'price', 'inventory'],
    'Location': ['address', 'city', 'state', 'country', 'postalCode'],
    'Event': ['eventName', 'startDate', 'endDate', 'venue']
  };
  
  for (const [label, properties] of Object.entries(labelMap)) {
    if (properties.some(prop => entity[prop] !== undefined)) {
      return [label];
    }
  }
  
  // Default label
  return ['Entity'];
}

/**
 * Extract properties from an entity for the graph
 */
function extractEntityProperties(entity: any): Record<string, any> {
  const properties: Record<string, any> = {};
  
  // Extract simple properties, skip complex objects and functions
  for (const [key, value] of Object.entries(entity)) {
    // Skip internal properties and functions
    if (key.startsWith('_') || typeof value === 'function') continue;
    
    // Handle simple values and dates
    if (
      value === null || 
      typeof value === 'string' || 
      typeof value === 'number' || 
      typeof value === 'boolean' ||
      value instanceof Date
    ) {
      properties[key] = value instanceof Date ? value.toISOString() : value;
    } 
    // Stringify objects if needed
    else if (typeof value === 'object' && !Array.isArray(value)) {
      // Skip relationship objects
      if (value.target && value.type) continue;
      
      try {
        // Try to convert to JSON if it's a simple object
        properties[key] = JSON.stringify(value);
      } catch (e) {
        // Skip if too complex
      }
    }
    // Handle simple arrays
    else if (Array.isArray(value) && value.every(v => 
      v === null || 
      typeof v === 'string' || 
      typeof v === 'number' || 
      typeof v === 'boolean'
    )) {
      properties[key] = value;
    }
  }
  
  return properties;
}

/**
 * Process embedded relationships in an entity
 */
function processEmbeddedRelationships(entity: any, graphEntity: GraphEntity, graph: PropertyGraph): void {
  // Check for explicit relationships array
  if (entity._relationships && Array.isArray(entity._relationships)) {
    entity._relationships.forEach((rel: any) => {
      // Skip invalid relationships
      if (!rel.target || !rel.type) return;
      
      // Process the target entity
      let targetEntity: GraphEntity;
      
      if (typeof rel.target === 'string') {
        // If target is a string, find or create a minimal entity
        const existingTarget = graph.entities.find(e => e.id === rel.target);
        if (existingTarget) {
          targetEntity = existingTarget;
        } else {
          // Create a placeholder entity
          targetEntity = {
            id: rel.target,
            labels: rel.targetLabels || ['Entity'],
            properties: { _placeholder: true }
          };
          graph.entities.push(targetEntity);
        }
      } else {
        // If target is an object, process it as an entity
        targetEntity = findOrCreateEntity(rel.target, graph);
      }
      
      // Create the relationship
      addRelationship(graph, {
        id: `rel-${graphEntity.id}-${rel.type}-${targetEntity.id}`,
        fromId: graphEntity.id,
        toId: targetEntity.id,
        type: rel.type,
        properties: rel.properties || {},
        meta: rel.meta || {
          createdAt: new Date().toISOString(),
          source: "embedded"
        }
      });
    });
  }
  
  // Look for property-based relationships
  for (const [key, value] of Object.entries(entity)) {
    // Check for object with target and type properties
    if (
      typeof value === 'object' && 
      value !== null && 
      !Array.isArray(value) && 
      value.target && 
      value.type
    ) {
      // Process as relationship
      const relObj = value;
      let targetEntity: GraphEntity;
      
      if (typeof relObj.target === 'string') {
        // Target is an ID
        const existingTarget = graph.entities.find(e => e.id === relObj.target);
        if (existingTarget) {
          targetEntity = existingTarget;
        } else {
          // Create placeholder
          targetEntity = {
            id: relObj.target,
            labels: relObj.targetLabels || ['Entity'],
            properties: { _placeholder: true }
          };
          graph.entities.push(targetEntity);
        }
      } else {
        // Target is an object
        targetEntity = findOrCreateEntity(relObj.target, graph);
      }
      
      // Create relationship
      addRelationship(graph, {
        id: `rel-${graphEntity.id}-${relObj.type}-${targetEntity.id}`,
        fromId: graphEntity.id,
        toId: targetEntity.id,
        type: relObj.type,
        properties: relObj.properties || {},
        meta: relObj.meta || {
          createdAt: new Date().toISOString(),
          source: "property",
          propertyName: key
        }
      });
    }
    
    // Check for arrays of references
    if (Array.isArray(value) && key.endsWith('Ids')) {
      // This might be an array of IDs to related entities
      const baseType = key.replace(/Ids$/, '');
      const relType = `HAS_${baseType.toUpperCase()}`;
      
      value.forEach((targetId: string) => {
        if (typeof targetId !== 'string') return;
        
        // Look for existing entity
        const existingTarget = graph.entities.find(e => e.id === targetId);
        let targetEntity: GraphEntity;
        
        if (existingTarget) {
          targetEntity = existingTarget;
        } else {
          // Create placeholder
          targetEntity = {
            id: targetId,
            labels: [toTitleCase(baseType)],
            properties: { _placeholder: true }
          };
          graph.entities.push(targetEntity);
        }
        
        // Create relationship
        addRelationship(graph, {
          id: `rel-${graphEntity.id}-${relType}-${targetEntity.id}`,
          fromId: graphEntity.id,
          toId: targetEntity.id,
          type: relType,
          properties: {},
          meta: {
            createdAt: new Date().toISOString(),
            source: "id-array",
            propertyName: key
          }
        });
      });
    }
  }
}

/**
 * Find possible relationships between two entities
 */
function findPossibleRelationships(entityA: any, entityB: any): Array<{
  type: string;
  properties: Record<string, any>;
  confidence: number;
}> {
  const relationships: Array<{
    type: string;
    properties: Record<string, any>;
    confidence: number;
  }> = [];
  
  // Check for ID references
  for (const [keyA, valueA] of Object.entries(entityA)) {
    // If property is an ID that matches entity B's ID
    if (
      (keyA.endsWith('Id') || keyA.endsWith('RefId')) && 
      valueA === entityB.id
    ) {
      const baseType = keyA.replace(/Id$|RefId$/, '');
      relationships.push({
        type: `HAS_${baseType.toUpperCase()}`,
        properties: {},
        confidence: 0.9
      });
    }
  }
  
  // Check for name references
  if (entityA.name && entityB.name) {
    // Check references in descriptions or text fields
    const descriptionFields = ['description', 'notes', 'comment', 'text'];
    
    for (const field of descriptionFields) {
      if (typeof entityA[field] === 'string' && entityA[field].includes(entityB.name)) {
        relationships.push({
          type: 'MENTIONS',
          properties: { context: field },
          confidence: 0.6
        });
      }
    }
  }
  
  // Check for common categories/tags
  if (Array.isArray(entityA.tags) && Array.isArray(entityB.tags)) {
    const commonTags = entityA.tags.filter((tag: string) => entityB.tags.includes(tag));
    if (commonTags.length > 0) {
      relationships.push({
        type: 'SHARES_TAG',
        properties: { tags: commonTags },
        confidence: 0.7
      });
    }
  }
  
  return relationships;
}

/**
 * Add a relationship to the graph
 */
function addRelationship(graph: PropertyGraph, relationship: GraphRelationship): void {
  // Check if relationship already exists
  const existingIndex = graph.relationships.findIndex(r => 
    r.id === relationship.id || 
    (r.fromId === relationship.fromId && 
     r.toId === relationship.toId && 
     r.type === relationship.type)
  );
  
  if (existingIndex >= 0) {
    // Update existing
    graph.relationships[existingIndex] = relationship;
  } else {
    // Add new
    graph.relationships.push(relationship);
  }
}

/**
 * Analyze a property graph
 */
function analyzeGraph(graph: PropertyGraph, config: GraphConfig): GraphAnalysis {
  // Basic metrics
  const entityCounts: Record<string, number> = {};
  const relationshipCounts: Record<string, number> = {};
  
  // Count entities by label
  graph.entities.forEach(entity => {
    entity.labels.forEach(label => {
      entityCounts[label] = (entityCounts[label] || 0) + 1;
    });
  });
  
  // Count relationships by type
  graph.relationships.forEach(rel => {
    relationshipCounts[rel.type] = (relationshipCounts[rel.type] || 0) + 1;
  });
  
  // Calculate connectivity
  const connectionsByEntity: Record<string, number> = {};
  graph.relationships.forEach(rel => {
    connectionsByEntity[rel.fromId] = (connectionsByEntity[rel.fromId] || 0) + 1;
    connectionsByEntity[rel.toId] = (connectionsByEntity[rel.toId] || 0) + 1;
  });
  
  const totalConnections = Object.values(connectionsByEntity).reduce((sum, count) => sum + count, 0);
  const averageConnectivity = graph.entities.length > 0 
    ? totalConnections / graph.entities.length 
    : 0;
  
  // Find most connected entities
  const mostConnectedEntities = Object.entries(connectionsByEntity)
    .map(([id, count]) => {
      const entity = graph.entities.find(e => e.id === id);
      return {
        id,
        label: entity ? entity.labels[0] : 'Unknown',
        connectionCount: count
      };
    })
    .sort((a, b) => b.connectionCount - a.connectionCount)
    .slice(0, 5);
  
  // Basic analysis result
  const analysis: GraphAnalysis = {
    metrics: {
      entityCounts,
      relationshipCounts,
      averageConnectivity,
      mostConnectedEntities
    }
  };
  
  // Add more advanced analysis if requested
  if (config.communityDetection) {
    analysis.communities = detectCommunities(graph, config.communityDetection);
  }
  
  return analysis;
}

/**
 * Detect communities in a graph
 */
function detectCommunities(
  graph: PropertyGraph, 
  algorithm: 'louvain' | 'label-propagation' | 'girvan-newman'
): Array<{id: string, entityIds: string[], size: number, cohesion: number}> {
  // Simple implementation for illustration
  // In a real implementation, this would use actual community detection algorithms
  
  // For now, create pseudo-communities based on entity labels
  const communitiesByLabel: Record<string, string[]> = {};
  
  graph.entities.forEach(entity => {
    const primaryLabel = entity.labels[0];
    if (!communitiesByLabel[primaryLabel]) {
      communitiesByLabel[primaryLabel] = [];
    }
    communitiesByLabel[primaryLabel].push(entity.id);
  });
  
  // Convert to community objects
  return Object.entries(communitiesByLabel).map(([label, entityIds], index) => {
    // Calculate a simple cohesion score
    let internalRelationships = 0;
    let externalRelationships = 0;
    
    graph.relationships.forEach(rel => {
      const fromInCommunity = entityIds.includes(rel.fromId);
      const toInCommunity = entityIds.includes(rel.toId);
      
      if (fromInCommunity && toInCommunity) {
        internalRelationships++;
      } else if (fromInCommunity || toInCommunity) {
        externalRelationships++;
      }
    });
    
    const totalRelationships = internalRelationships + externalRelationships;
    const cohesion = totalRelationships > 0 
      ? internalRelationships / totalRelationships 
      : 0;
    
    return {
      id: `community-${index + 1}`,
      entityIds,
      size: entityIds.length,
      cohesion
    };
  });
}

/**
 * Generate visualization data for a graph
 */
function generateVisualization(graph: PropertyGraph, config: GraphConfig): GraphVisualization {
  // Choose layout algorithm
  const layout = config.visualizationLayout || 'force';
  
  // Generate positions based on layout algorithm
  const positions = generateLayoutPositions(graph, layout, config.layoutSettings);
  
  // Generate default style information
  const entityStyles: Record<string, any> = {};
  const relationshipStyles: Record<string, any> = {};
  
  // Default colors for entity labels
  const colors = [
    '#4285F4', '#EA4335', '#FBBC05', '#34A853', 
    '#8E24AA', '#039BE5', '#7CB342', '#FB8C00'
  ];
  
  // Assign colors to entity labels
  const allLabels = Array.from(new Set(graph.entities.flatMap(e => e.labels)));
  allLabels.forEach((label, index) => {
    entityStyles[label] = {
      color: colors[index % colors.length],
      size: 5,
      shape: 'circle'
    };
  });
  
  // Assign styles to relationship types
  const allTypes = Array.from(new Set(graph.relationships.map(r => r.type)));
  allTypes.forEach((type, index) => {
    relationshipStyles[type] = {
      color: colors[(index + 3) % colors.length],
      width: 1,
      arrow: 'forward'
    };
  });
  
  return {
    layout,
    positions,
    style: {
      entityStyles,
      relationshipStyles
    }
  };
}

/**
 * Generate layout positions for graph visualization
 */
function generateLayoutPositions(
  graph: PropertyGraph, 
  layout: string,
  settings?: Record<string, any>
): Record<string, {x: number, y: number}> {
  const positions: Record<string, {x: number, y: number}> = {};
  
  // Simple layout implementations
  switch (layout) {
    case 'circular':
      // Place nodes in a circle
      const radius = Math.max(100, graph.entities.length * 10);
      graph.entities.forEach((entity, index) => {
        const angle = (index / graph.entities.length) * 2 * Math.PI;
        positions[entity.id] = {
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle)
        };
      });
      break;
      
    case 'grid':
      // Place nodes in a grid
      const gridSize = Math.ceil(Math.sqrt(graph.entities.length));
      const cellSize = 100;
      graph.entities.forEach((entity, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        positions[entity.id] = {
          x: col * cellSize,
          y: row * cellSize
        };
      });
      break;
      
    case 'hierarchical':
      // Simple hierarchical layout based on relationship direction
      // This is a very simplified version; real hierarchical layouts are more complex
      const levels: Record<string, number> = {};
      const processed = new Set<string>();
      
      // Find root nodes (no incoming relationships)
      const incomingRels: Record<string, number> = {};
      graph.relationships.forEach(rel => {
        incomingRels[rel.toId] = (incomingRels[rel.toId] || 0) + 1;
      });
      
      const rootNodes = graph.entities
        .filter(entity => !incomingRels[entity.id])
        .map(entity => entity.id);
      
      // Assign levels starting from roots
      let currentLevel = 0;
      let currentNodes = rootNodes;
      
      while (currentNodes.length > 0 && processed.size < graph.entities.length) {
        // Assign current level to nodes
        currentNodes.forEach(nodeId => {
          levels[nodeId] = currentLevel;
          processed.add(nodeId);
        });
        
        // Find next level of nodes
        const nextNodes: string[] = [];
        currentNodes.forEach(nodeId => {
          // Find outgoing relationships
          graph.relationships
            .filter(rel => rel.fromId === nodeId)
            .forEach(rel => {
              if (!processed.has(rel.toId)) {
                nextNodes.push(rel.toId);
              }
            });
        });
        
        currentNodes = Array.from(new Set(nextNodes)); // Deduplicate
        currentLevel++;
      }
      
      // Assign positions based on levels
      const nodesPerLevel: Record<number, number> = {};
      Object.values(levels).forEach(level => {
        nodesPerLevel[level] = (nodesPerLevel[level] || 0) + 1;
      });
      
      const levelPositions: Record<number, number> = {}; // Current position within level
      
      graph.entities.forEach(entity => {
        const level = levels[entity.id] || 0;
        levelPositions[level] = levelPositions[level] || 0;
        
        const levelWidth = (nodesPerLevel[level] || 1) * 100;
        const position = levelPositions[level]++;
        const spacing = levelWidth / (nodesPerLevel[level] || 1);
        
        positions[entity.id] = {
          x: position * spacing,
          y: level * 150
        };
      });
      break;
      
    case 'force':
    default:
      // Simplified force-directed layout (in real implementation, use a proper algorithm)
      // Just place nodes randomly for this example
      graph.entities.forEach(entity => {
        positions[entity.id] = {
          x: Math.random() * 1000 - 500,
          y: Math.random() * 1000 - 500
        };
      });
      
      // Apply a few iterations of force simulation
      const iterations = 50;
      const repulsionForce = 100;
      const attractionForce = 0.01;
      
      for (let i = 0; i < iterations; i++) {
        // Calculate repulsion between all nodes
        for (let j = 0; j < graph.entities.length; j++) {
          for (let k = j + 1; k < graph.entities.length; k++) {
            const nodeA = graph.entities[j];
            const nodeB = graph.entities[k];
            const posA = positions[nodeA.id];
            const posB = positions[nodeB.id];
            
            const dx = posB.x - posA.x;
            const dy = posB.y - posA.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            
            // Apply repulsion
            const force = repulsionForce / (distance * distance);
            const forceX = force * dx / distance;
            const forceY = force * dy / distance;
            
            positions[nodeA.id].x -= forceX;
            positions[nodeA.id].y -= forceY;
            positions[nodeB.id].x += forceX;
            positions[nodeB.id].y += forceY;
          }
        }
        
        // Apply attraction along relationships
        graph.relationships.forEach(rel => {
          const posFrom = positions[rel.fromId];
          const posTo = positions[rel.toId];
          
          if (posFrom && posTo) {
            const dx = posTo.x - posFrom.x;
            const dy = posTo.y - posFrom.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            
            // Apply attraction
            const force = distance * attractionForce;
            const forceX = force * dx / distance;
            const forceY = force * dy / distance;
            
            positions[rel.fromId].x += forceX;
            positions[rel.fromId].y += forceY;
            positions[rel.toId].x -= forceX;
            positions[rel.toId].y -= forceY;
          }
        });
      }
      break;
  }
  
  return positions;
}

/**
 * Generate Cypher queries to create the graph
 */
function generateCypherFromGraph(graph: PropertyGraph): CypherOutput {
  // Generate CREATE statements for entities
  const nodeQueries = graph.entities.map(entity => {
    const labels = entity.labels.join(':');
    
    return {
      id: `create-${entity.id}`,
      name: `Create ${labels} node`,
      query: `
        CREATE (n:${labels} {
          id: "${entity.id}",
          ${Object.entries(entity.properties)
            .map(([key, value]) => `${key}: ${formatCypherValue(value)}`)
            .join(',\n          ')}
        })
        RETURN n
      `,
      purpose: 'create',
      executionOrder: 1
    };
  });
  
  // Generate CREATE statements for relationships
  const relationshipQueries = graph.relationships.map(rel => {
    const fromEntity = graph.entities.find(e => e.id === rel.fromId);
    const toEntity = graph.entities.find(e => e.id === rel.toId);
    
    if (!fromEntity || !toEntity) return null;
    
    const fromLabels = fromEntity.labels.join(':');
    const toLabels = toEntity.labels.join(':');
    
    return {
      id: `create-rel-${rel.id}`,
      name: `Create ${rel.type} relationship`,
      query: `
        MATCH (from:${fromLabels} {id: "${rel.fromId}"})
        MATCH (to:${toLabels} {id: "${rel.toId}"})
        CREATE (from)-[:${rel.type} {
          id: "${rel.id}",
          ${Object.entries(rel.properties)
            .map(([key, value]) => `${key}: ${formatCypherValue(value)}`)
            .join(',\n          ')}
        }]->(to)
        RETURN from, to
      `,
      purpose: 'create',
      executionOrder: 2,
      dependencies: [`create-${rel.fromId}`, `create-${rel.toId}`]
    };
  }).filter(Boolean);
  
  // Generate a single query to create everything
  const fullGraphQuery = {
    id: `create-full-graph-${graph.id}`,
    name: `Create full graph ${graph.name}`,
    query: `
      // Create all nodes
      ${graph.entities.map(entity => {
        const labels = entity.labels.join(':');
        return `CREATE (n_${entity.id.replace(/[^a-zA-Z0-9]/g, '_')}:${labels} {
          id: "${entity.id}",
          ${Object.entries(entity.properties)
            .map(([key, value]) => `${key}: ${formatCypherValue(value)}`)
            .join(',\n          ')}
        })`;
      }).join('\n      ')}
      
      // Create all relationships
      ${graph.relationships.map(rel => {
        return `
        MATCH (from_${rel.fromId.replace(/[^a-zA-Z0-9]/g, '_')})
        MATCH (to_${rel.toId.replace(/[^a-zA-Z0-9]/g, '_')})
        WHERE from_${rel.fromId.replace(/[^a-zA-Z0-9]/g, '_')}.id = "${rel.fromId}"
        AND to_${rel.toId.replace(/[^a-zA-Z0-9]/g, '_')}.id = "${rel.toId}"
        CREATE (from_${rel.fromId.replace(/[^a-zA-Z0-9]/g, '_')})-[:${rel.type} {
          id: "${rel.id}",
          ${Object.entries(rel.properties)
            .map(([key, value]) => `${key}: ${formatCypherValue(value)}`)
            .join(',\n          ')}
        }]->(to_${rel.toId.replace(/[^a-zA-Z0-9]/g, '_')})`;
      }).join('\n      ')}
      
      RETURN "Graph created"
    `,
    purpose: 'create',
    executionOrder: 1
  };
  
  // Return all the queries
  return {
    id: `cypher-${graph.id}`,
    queries: [...nodeQueries, ...relationshipQueries, fullGraphQuery],
    parameters: {},
    meta: {
      graphId: graph.id,
      entityCount: graph.entities.length,
      relationshipCount: graph.relationships.length,
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * Convert a string to title case
 */
function toTitleCase(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * Format a value for Cypher
 */
function formatCypherValue(value: any): string {
  if (value === null) {
    return 'null';
  }
  
  if (typeof value === 'string') {
    // Escape quotes
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (value instanceof Date) {
    return `datetime("${value.toISOString()}")`;
  }
  
  if (Array.isArray(value)) {
    // Format array elements
    return `[${value.map(formatCypherValue).join(', ')}]`;
  }
  
  if (typeof value === 'object') {
    // Convert object to map syntax
    const entries = Object.entries(value)
      .map(([k, v]) => `${k}: ${formatCypherValue(v)}`)
      .join(', ');
      
    return `{${entries}}`;
  }
  
  // Default fallback
  return `"${String(value)}"`;
}