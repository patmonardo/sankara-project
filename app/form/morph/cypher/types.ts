import { FormMeta } from "../../schema/form";
import { GraphShape } from "../graph/types";

/**
 * Represents a form that has been transformed into a Cypher query generator
 * This is the output of GraphToCypherMorph
 */
export interface CypherShape extends GraphShape {
  /** Generated Cypher queries */
  queries: CypherQuery[];
  
  /** Query parameters */
  parameters: Record<string, any>;
  
  /** Metadata specific to Cypher generation */
  meta: FormMeta & CypherMeta;
}

/**
 * Metadata specific to Cypher generation, including configuration
 */
export interface CypherMeta {
  /** When the Cypher was generated */
  generatedAt?: string;
  
  /** Source form ID that generated this Cypher */
  sourceFormId?: string;
  
  /** Number of queries generated */
  queryCount?: number;
  
  /** Cypher dialect (e.g., Neo4j 4.0, 5.0) */
  dialectVersion?: string;
  
  /** Whether to generate parameterized queries (default: true) */
  parameterized?: boolean;
  
  /** Prefix for node labels (default: none) */
  labelPrefix?: string;
  
  /** Whether to include metadata properties (default: false) */
  includeMetadata?: boolean;
  
  /** Default node label when not specified */
  defaultNodeLabel?: string;
  
  /** Operation to perform (default: create) */
  operation?: "create" | "match" | "update" | "delete";
  
  /** Property keys to use as identifiers when matching */
  identifierProperties?: string[];
  
  /** Whether to create or match target nodes */
  createTargets?: boolean;
  
  /** Other Cypher-specific options */
  [key: string]: any;
}

/**
 * Configuration for the Cypher pipeline
 */
export interface CypherConfig {
  /** Neo4j version to target */
  dialectVersion?: string;
  
  /** Whether to use parameterized queries */
  parameterized?: boolean;
  
  /** Prefix for node labels */
  labelPrefix?: string;
  
  /** Whether to include metadata properties */
  includeMetadata?: boolean;
  
  /** Default node label when not specified */
  defaultNodeLabel?: string;
  
  /** Property keys to use as identifiers when matching */
  identifierProperties?: string[];
  
  /** Whether to create or match target nodes */
  createTargets?: boolean;
}

/**
 * Represents a single Cypher query
 */
export interface CypherQuery {
  /** Unique identifier for this query */
  id: string;
  
  /** Query name/description */
  name: string;
  
  /** The actual Cypher query text */
  query: string;
  
  /** Purpose of this query (create, read, update, delete, etc) */
  purpose: "create" | "match" | "update" | "delete" | "schema" | "custom";
  
  /** Order in which this query should be executed */
  executionOrder?: number;
  
  /** IDs of queries this query depends on */
  dependencies?: string[];
}

/**
 * Represents a Neo4j node or relationship property with proper typing
 */
export type CypherProperty =
  | string
  | number
  | boolean
  | null
  | Date
  | CypherProperty[] 
  | { [key: string]: CypherProperty };

/**
 * Represents a Neo4j node structure
 */
export interface CypherEntity {
  /** Variable name in the query */
  variable: string;
  
  /** Node labels (can be multiple) */
  labels: string[];
  
  /** Node properties */
  properties?: Record<string, CypherProperty>;
  
  /** Whether this node should be created (CREATE/MERGE) or matched (MATCH) */
  operation: "CREATE" | "MERGE" | "MATCH";
}

/**
 * Represents a Neo4j relationship structure
 */
export interface CypherRelationship {
  /** Variable name in the query (optional) */
  variable?: string;
  
  /** Relationship type */
  type: string;
  
  /** Relationship direction */
  direction: "OUTGOING" | "INCOMING" | "NONE";
  
  /** Relationship properties */
  properties?: Record<string, CypherProperty>;
  
  /** Source node variable */
  from: string;
  
  /** Target node variable */
  to: string;
  
  /** Whether this relationship should be created or matched */
  operation: "CREATE" | "MERGE" | "MATCH";
}

/**
 * A pattern in a Cypher query (node or node-relationship-node)
 */
export type CypherPattern =
  | CypherEntity
  | [CypherEntity, CypherRelationship, CypherEntity];

/**
 * Represents a structured Cypher query definition
 */
export interface CypherQueryDefinition {
  /** Unique identifier for this query */
  id: string;
  
  /** Query name/description */
  name: string;
  
  /** Patterns to match or create */
  patterns: CypherPattern[];
  
  /** Conditions for WHERE clause */
  conditions?: CypherCondition[];
  
  /** Properties to SET */
  sets?: CypherSet[];
  
  /** Variables or expressions to RETURN */
  returns?: string[];
  
  /** Variables to DELETE */
  deletes?: string[];
  
  /** Whether to use DETACH DELETE */
  detachDelete?: boolean;
  
  /** Order of results */
  orderBy?: CypherOrderBy[];
  
  /** Limit results */
  limit?: number;
  
  /** Skip results */
  skip?: number;
  
  /** Parameters for the query */
  parameters?: Record<string, any>;
  
  /** Execution order hint */
  executionOrder?: number;
}

/**
 * Represents a condition for a WHERE clause
 */
export interface CypherCondition {
  left: string;
  operator:
    | "="
    | "!="
    | ">"
    | ">="
    | "<"
    | "<="
    | "IN"
    | "CONTAINS"
    | "STARTS WITH"
    | "ENDS WITH";
  right: string | number | boolean | null | string[] | number[];
  
  /** Whether the right side is a parameter reference */
  parameterized?: boolean;
  
  /** Parameter name if parameterized */
  paramName?: string;
  
  /** Logical connection to next condition */
  connector?: "AND" | "OR";
}

/**
 * Represents a property assignment in a SET clause
 */
export interface CypherSet {
  target: string;
  property?: string;
  value: any;
  
  /** Whether to use += operator for maps */
  isMap?: boolean;
  
  /** Whether value is a parameter reference */
  parameterized?: boolean;
  
  /** Parameter name if parameterized */
  paramName?: string;
}

/**
 * Represents ordering in ORDER BY clause
 */
export interface CypherOrderBy {
  expression: string;
  descending?: boolean;
}
