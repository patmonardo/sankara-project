import { z } from "zod";

/**
 * PropertyType - Defines the fundamental types of properties
 * 
 * Properties are contextual determinations of what entities ARE
 * within a bounded context.
 */
export const PropertyTypeSchema = z.enum([
  "intrinsic",    // Essential qualities that define what the entity is
  "extrinsic",    // Accidental qualities that describe but don't define
  "relational",   // Qualities that emerge from relations to other entities
  "indexical",    // Qualities that depend on position/context
  "dispositional" // Qualities that manifest under certain conditions
]);

export type PropertyType = z.infer<typeof PropertyTypeSchema>;

/**
 * Property - A contextual determination of what an entity is
 * 
 * Properties operate as the Essential Being of Thingness - they
 * represent what an entity IS within a specific context.
 */
export const PropertySchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  
  // Classification
  propertyType: PropertyTypeSchema,
  
  // Context dependency - Properties MUST have a context
  contextId: z.string(),
  
  // Entity/Relation binding
  entityId: z.string().optional(),
  relationId: z.string().optional(),
  
  // Value determination (multiple ways to define value)
  staticValue: z.any().optional(),         // Direct static value
  derivedFrom: z.string().optional(),      // Derived from another property
  scriptId: z.string().optional(),         // Determined by script
  
  // Qualitative characteristics
  qualitative: z.object({
    essential: z.boolean().optional(),     // Is this an essential quality?
    observable: z.boolean().optional(),    // Can this be directly observed?
    mutable: z.boolean().optional(),       // Can this change?
    inherent: z.boolean().optional()       // Is this inherent to the entity?
  }).optional(),
  
  // Quantitative characteristics
  quantitative: z.object({
    dataType: z.enum(["string", "number", "boolean", "date", "object", "array"]).optional(),
    unit: z.string().optional(),           // Unit of measurement
    precision: z.number().optional(),      // Precision for numeric values
    range: z.object({                      // Valid range
      min: z.any().optional(),
      max: z.any().optional()
    }).optional()
  }).optional(),
  
  // Metadata
  created: z.date().default(() => new Date()),
  updated: z.date().default(() => new Date()),
});

export type Property = z.infer<typeof PropertySchema>;

/**
 * PropertyScriptType - Defines types of scripts that determine properties
 * 
 * These describe HOW properties manifest, not what they are.
 */
export const PropertyScriptTypeSchema = z.enum([
  "validator",   // Validates data against constraints
  "calculator",  // Computes a value based on other properties
  "predicate",   // Tests a condition about properties
  "reducer"      // Aggregates multiple properties into one
]);

export type PropertyScriptType = z.infer<typeof PropertyScriptTypeSchema>;

/**
 * PropertyScript - A script that determines a property
 * 
 * PropertyScripts are mechanisms by which properties manifest -
 * they implement the realization of properties within contexts.
 */
export const PropertyScriptSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  
  // Classification
  scriptType: PropertyScriptTypeSchema,
  
  // Execution
  contextId: z.string(),
  code: z.any(), // The script function
  
  // Property this script computes
  propertyId: z.string(),
  
  // Input/Output
  input: z.record(z.any()).optional(),
  output: z.record(z.any()).optional(),
  
  // Dependencies
  dependencies: z.array(z.string()).optional(),
  
  // Connection to Form
  formId: z.string().optional(),
  entityId: z.string().optional(),
  relationId: z.string().optional(),
  
  // Execution options
  caching: z.object({
    enabled: z.boolean().default(false),
    ttl: z.number().optional(),
  }).optional(),
  
  // Metadata
  created: z.date().default(() => new Date()),
  updated: z.date().default(() => new Date()),
});

export type PropertyScript = z.infer<typeof PropertyScriptSchema>;

/**
 * MorphismType - Defines types of context-crossing operations
 * 
 * These are distinct from properties - they transform across contexts.
 */
export const MorphismTypeSchema = z.enum([
  "getter",      // Gets a value across context boundaries  
  "setter",      // Sets a value across context boundaries
  "transformer", // Maps data between contexts
  "generator"    // Creates content in a new context
]);

export type MorphismType = z.infer<typeof MorphismTypeSchema>;

/**
 * Morphism - A transformation between contexts
 */
export const MorphismSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  
  // Classification
  morphismType: MorphismTypeSchema,
  
  // Context mapping
  sourceContextId: z.string(),
  targetContextId: z.string(),
  
  // Transformation function
  code: z.any(),
  
  // Metadata
  created: z.date().default(() => new Date()),
  updated: z.date().default(() => new Date()),
});

export type Morphism = z.infer<typeof MorphismSchema>;