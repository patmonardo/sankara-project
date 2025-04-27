import { FormField } from './field';
import { FormShape } from './form';

/**
 * FormRelation - Defines a relationship between form elements
 */
export interface FormRelation {
  /** Unique identifier for this relation */
  id: string;
  
  /** Type of relation (e.g., "references", "contains", "dependsOn") */
  type: string;
  
  /** Optional subtype for more specific categorization */
  subtype?: string;
  
  /** Source element of the relation */
  source: {
    /** ID of the source element */
    id: string;
    /** Type of the source element ("form" or "field") */
    type: "form" | "field";
    /** Reference to the actual form or field (optional, for in-memory operations) */
    reference?: FormShape | FormField;
  };
  
  /** Target element of the relation */
  target: {
    /** ID of the target element */
    id: string;
    /** Type of the target element ("form" or "field") */  
    type: "form" | "field";
    /** Reference to the actual form or field (optional, for in-memory operations) */
    reference?: FormShape | FormField;
  };
  
  /** Properties/attributes of this relation */
  properties?: Record<string, any>;
  
  /** Metadata about this relation */
  meta?: {
    /** When this relation was created */
    created?: string;
    /** When this relation was last updated */
    updated?: string;
    /** Who created this relation */
    createdBy?: string;
    /** Who last updated this relation */
    updatedBy?: string;
  };
}

/**
 * Collection of form relations
 */
export interface FormRelationCollection {
  /** All relations in this collection */
  relations: FormRelation[];
  
  /** Optional metadata about this collection */
  meta?: Record<string, any>;
}

/**
 * Common relation types for forms
 */
export enum FormRelationType {
  /** Field depends on another field for its value/visibility */
  DEPENDS_ON = "dependsOn",
  
  /** Field references another field or form */
  REFERENCES = "references",
  
  /** Form contains a field */
  CONTAINS = "contains",
  
  /** Field is part of a form */
  PART_OF = "partOf",
  
  /** Field controls another field (e.g., visibility) */
  CONTROLS = "controls",
  
  /** Field validates against another field */
  VALIDATES_WITH = "validatesWith",
}