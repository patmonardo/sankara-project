import { FormShape, FormMeta } from "../../schema/form";

/**
 * Defines a relationship originating from this form's node,
 * based on the value of a specific form field.
 * This definition resides within FormShape.meta.relationships.
 */
export interface FormRelationship {
  /** The form field containing the identifier(s) of the target node(s) */
  field: string;
  /** The type of the relationship (e.g., 'HAS_AUTHOR', 'BELONGS_TO') */
  type: string;
  /** The label of the target node (e.g., 'User', 'Category') */
  target: string;
  /** The direction of the relationship (default: OUTGOING) */
  direction?: "OUTGOING" | "INCOMING"; // Optional, default handled by logic
  /** The property on the target node to match against the field value (default: 'id') */
  targetProperty?: string; // Optional, default handled by logic
  /** Whether to create/merge the target node if it doesn't exist (default: false) */
  createTargets?: boolean; // Optional, default handled by logic
  /** Static properties to set on the relationship itself */
  properties?: Record<string, any>; // Using any for simplicity
}

export interface NeoFormMeta extends FormMeta {
  relationships?: FormRelationship[]; // Array of relationships defined in the form
  [key: string]: any; // Allow other metadata properties
}

export interface CypherShape extends FormShape {
  id: string; // Unique identifier for the form
  name: string; // Name of the form
  description?: string; // Optional description of the form
  fields: any[]; // Array of fields in the form, type can be defined as needed
  meta: NeoFormMeta; // Metadata specific to Neo4j forms
  mode: "create" | "view" | "edit"; // Mode of the form
  isNew?: boolean; // Indicates if this is a new form instance
  valid?: boolean; // Overall validity of the form
  complete?: boolean; // Indicates if the form is complete
  /** Generated Cypher queries */
  queries: CypherQueryOutput[];
  /** Execution parameters */
  parameters: Record<string, any>;
}

/**
 * Generated query with text and metadata
 */
export interface CypherQueryOutput {
  /** Unique identifier for this query */
  id: string;
  /** Query name/description */
  name: string;
  /** The actual Cypher query text */
  query: string;
  /** Query purpose/type */
  purpose: string;
  /** Execution order */
  executionOrder: number;
  /** Dependencies on other queries */
  dependencies?: string[];
  /** Specific parameters for this query */
  parameters?: Record<string, any>;
}
