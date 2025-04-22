// Add these imports if needed
import { FormShape, FormMeta } from "../../schema/form";


// Complete GraphShape interface with ALL meta properties
export interface GraphShape extends FormShape {
  /** Entities in the graph */
  entities: GraphEntity[];

  /** Relationships in the graph */
  relationships: GraphRelationship[];

  /** Optional graph analysis results */
  analysis?: GraphAnalysis;
  
  /** Optional graph visualization data */
  visualization?: GraphVisualization;

  /** Metadata specific to the graph - COMPLETE with NO omissions */
  meta: FormMeta & {
    
    /** Generation timestamp */
    generatedAt?: string;
    
    /** Source morph that created this graph */
    sourceMorph?: string;
    
    /** Count of entities in the graph */
    entityCount?: number;
    
    /** Count of relationships in the graph */
    relationshipCount?: number;
    
    /** Label prefix for graph entities */
    labelPrefix?: string;
    
    /** Whether to include metadata in graph entities */
    includeMetadata?: boolean;
    
    /** Fields to exclude from graph representation */
    excludeFromGraph?: string[];
    
    /** When analysis was performed */
    analysisPerformed?: boolean;
    analysisTimestamp?: string;
    
    /** When visualization was generated */
    visualizationGenerated?: boolean;
    visualizationTimestamp?: string;
    
    /** Analysis configuration */
    analysisConfig?: {
      includeCommunities?: boolean;
      includeCentrality?: boolean;
      includePaths?: boolean;
    };
    
    /** Visualization configuration */
    visualizationConfig?: {
      layout?: string;
      highlightCommunities?: boolean;
      theme?: string;
    };

    /** Whether test data was generated */
    testDataGenerated?: boolean;
    
    /** When test data was generated */
    testDataTimestamp?: string;
    
    /** Count of test data entities */
    testDataEntityCount?: number;
  };
}

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
 * Configuration options for graph operations
 */
export interface GraphConfig {
  /** Include test data in the graph */
  includeTestData?: boolean;
  
  /** Label prefix for graph entities */
  labelPrefix?: string;
  
  /** Whether to include metadata in graph entities */
  includeMetadata?: boolean;
  
  /** Fields to exclude from graph representation */
  excludeFromGraph?: string[];
  
  /** Analysis configuration */
  analysis?: {
    /** Whether to perform analysis */
    perform?: boolean;
    /** Include community detection */
    includeCommunities?: boolean;
    /** Include centrality measures */
    includeCentrality?: boolean;
    /** Include path analysis */
    includePaths?: boolean;
  };
  
  /** Visualization configuration */
  visualization?: {
    /** Whether to generate visualization */
    perform?: boolean;
    /** Layout algorithm to use */
    layout?: 'force' | 'circular' | 'hierarchical';
    /** Highlight communities in visualization */
    highlightCommunities?: boolean;
    /** Visual theme */
    theme?: string;
  };
}

/**
 * Graph analysis results (Output of a GraphAnalysisMorph)
 */
export interface GraphAnalysis {
  metrics: {
    entityCounts: Record<string, number>;
    relationshipCounts: Record<string, number>;
    averageConnectivity: number;
    mostConnectedEntities: Array<{
      id: string;
      label: string;
      connectionCount: number;
    }>;
  };
  communities?: Array<{
    id: string;
    entityIds: string[];
    size: number;
    cohesion: number;
  }>;
  centrality?: {
    betweenness?: Record<string, number>;
    closeness?: Record<string, number>;
    eigenvector?: Record<string, number>;
  };
  paths?: {
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
 * Graph visualization data (Output of a GraphVisualizationMorph)
 */
export interface GraphVisualization {
  layout: string; // 'force', 'hierarchical', etc.
  positions: Record<string, { x: number; y: number }>;
  style: {
    entityStyles: Record<
      string,
      { color: string; size: number; icon?: string; shape?: string }
    >;
    relationshipStyles: Record<
      string,
      { color: string; width: number; dashed?: boolean; arrow?: string }
    >;
  };
  focusAreas?: Array<{
    name: string;
    entityIds: string[];
    highlight: boolean;
    zoom: number;
  }>;
}
