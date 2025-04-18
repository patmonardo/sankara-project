import { MorphContext } from "../mode";

/**
 * Configuration for Form-to-Cypher generation
 */
export interface FormToCypherConfig {
  /** Whether to generate parameterized queries (default: true) */
  parameterized?: boolean;
  /** Prefix for node labels (default: none) */
  labelPrefix?: string;
  /** Whether to include metadata properties like _createdAt (default: false) */
  includeMetadata?: boolean;
  /** Default node label if needed */
  defaultNodeLabel?: string;
  /** Operation to perform (default: merge) */
  operation?: 'create' | 'match' | 'update' | 'delete' | 'merge';
  /** Property keys to use as identifiers when matching/merging/deleting */
  identifierProperties?: string[];
  /** Whether to include relationship generation (default: true) */
  includeRelationships?: boolean;
}

/**
 * Context specific to Neo4j operations.
 */
export interface NeoContext extends MorphContext {
  /** Configuration for Cypher generation */
  cypher: FormToCypherConfig;
  /** The actual data for the form instance */
  data: Record<string, any>;
  /** Optional: Override the operation defined in cypher config */
  operation?: 'create' | 'match' | 'update' | 'delete' | 'merge';
}

// You might also move CypherOutput, CypherQueryOutput etc. here from cypher.ts
// if you want all Neo-related types in one place.