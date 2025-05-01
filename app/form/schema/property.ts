import { number, z } from "zod";

/**
 * FormPropertyType - Defines the fundamental types of properties
 *
 * Properties are contextual determinations of what entities ARE
 * within a bounded context.
 */
export const FormPropertyTypeSchema = z.enum([
  "intrinsic", // Essential qualities that define what the entity is
  "extrinsic", // Accidental qualities that describe but don't define
  "relational", // Qualities that emerge from relations to other entities
  "indexical", // Qualities that depend on position/context
  "dispositional", // Qualities that manifest under certain conditions
]);

/**
 * FormPropertyDefinitionType - Defines types of scripts that determine properties
 *
 * These describe HOW properties manifest, not what they are.
 */
export const FormPropertyDefinitionTypeSchema = z.enum([
  "validator", // Validates data against constraints
  "calculator", // Computes a value based on other properties
  "predicate", // Tests a condition about properties
  "reducer", // Aggregates multiple properties into one
]);

/**
 * FormPropertyDefinition - A script that determines a property
 *well
 * FormPropertyDefinitions are mechanisms by which properties manifest -
 * they implement the realization of properties within contexts.
 */
export const FormPropertyDefinitionSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),

  // Classification
  scriptType: FormPropertyDefinitionTypeSchema,

  // Execution
  contextId: z.string(),
  code: z.any(), // The script function

  // FormProperty this script computes
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
  caching: z
    .object({
      enabled: z.boolean().default(false),
      ttl: z.number().optional(),
    })
    .optional(),

  // Metadata
  createdAt: z
    .number()
    .optional()
    .default(() => Date.now())
    .optional(),
  updatedAt: z
    .number()
    .optional()
    .default(() => Date.now())
    .optional(),
});

/**
 * FormProperty - A contextual determination of what an entity is
 *
 * Properties operate as the Essential Being of Thingness - they
 * represent what an entity IS within a specific context.
 */
export const FormPropertySchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),

  // Classification
  propertyType: FormPropertyTypeSchema,

  // Reference to a FormPropertyDefinition
  definitionId: z.string().optional(),

  // Context dependency - Properties MUST have a context
  contextId: z.string(),

  // Entity/Relation binding
  entityId: z.string().optional(),
  relationId: z.string().optional(),

  // Value determination (multiple ways to define value)
  staticValue: z.any().optional(), // Direct static value
  derivedFrom: z.string().optional(), // Derived from another property
  scriptId: z.string().optional(), // Determined by script

  // Qualitative characteristics
  qualitative: z
    .object({
      essential: z.boolean().optional(), // Is this an essential quality?
      observable: z.boolean().optional(), // Can this be directly observed?
      mutable: z.boolean().optional(), // Can this change?
      inherent: z.boolean().optional(), // Is this inherent to the entity?
    })
    .optional(),

  // Quantitative characteristics
  quantitative: z
    .object({
      dataType: z
        .enum(["string", "number", "boolean", "date", "object", "array"])
        .optional(),
      unit: z.string().optional(), // Unit of measurement
      precision: z.number().optional(), // Precision for numeric values
      range: z
        .object({
          // Valid range
          min: z.any().optional(),
          max: z.any().optional(),
        })
        .optional(),
    })
    .optional(),

  // Metadata
  createdAt: z
    .number()
    .optional()
    .default(() => Date.now())
    .optional(),
  updatedAt: z
    .number()
    .optional()
    .default(() => Date.now())
    .optional(),
  createdBy: z.string().optional(),
});

export type FormPropertyType = z.infer<typeof FormPropertyTypeSchema>;
export type FormPropertyDefinitionType = z.infer<
  typeof FormPropertyDefinitionTypeSchema
>;
export type FormPropertyDefinition = z.infer<
  typeof FormPropertyDefinitionSchema
>;
export type FormProperty = z.infer<typeof FormPropertySchema>;
