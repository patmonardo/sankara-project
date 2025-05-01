import { z } from "zod";

/**
 * FormEntityType - Defines the possible entity types in our Form system
 * These represent the fundamental ontological categories of our knowledge representation
 */
export const FormEntityTypeSchema = z.enum([
  "form", // Basic input collection
  "card", // Entity representation
  "link", // Relationship representation
  "list", // Sequence representation
  "graph", // Network representation
  "table", // Structured data representation
  "dashboard", // Composite visualization
]);

/**
 * StorageMapping schema
 * Defines how an entity is stored in a persistent layer
 */
export const FormEntityStorageSchema = z.object({
  storage: z.string(),
  primaryKey: z.string().default("id"),
  fields: z.record(z.string()),
  indices: z.array(z.string()).optional(),
  versioning: z.boolean().optional().default(false).optional(),
});

/**
 * Defines constraints that can be attached to entities
 *
 */
export const FormEntityConstraintSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
  property: z.string().optional(),
  value: z.any().optional(),
  message: z.string().optional(),
  custom: z.function().optional(),
});

/**
 * EntityBehavior schema
 * Defines behaviors that can be attached to entities
 */
export const FormEntityBehaviorSchema = z.object({
  name: z.string(),
  event: z.enum(["onCreate", "onUpdate", "onDelete", "onRead"]),
  handler: z.function().or(z.string()),
  parameters: z.record(z.any()).optional(),
  active: z.boolean().default(true),
});

/**
 * EntityQuery schema
 * Defines a query for retrieving entities
 */
export const FormEntityCriteriaSchema = z.object({
  type: z.string().optional(),
  filter: z.record(z.any()).optional(),
  sort: z
    .array(
      z.object({
        field: z.string(),
        direction: z.enum(["asc", "desc"]).default("asc"),
      })
    )
    .optional(),
  limit: z.number().int().optional(),
  offset: z.number().int().optional(),
  include: z.array(z.string()).optional(),
});

/**
 * EntityValidationRule schema
 * Defines validation rules that apply to entities
 */
export const FormEntityValidationSchema = z.object({
  field: z.string(),
  rule: z.enum(["required", "unique", "min", "max", "pattern", "custom"]),
  value: z.any().optional(),
  message: z.string().optional(),
  custom: z.function().optional(),
});

/**
 * Complete FormEntityDefinition schema
 * A comprehensive definition of an entity with validation, behaviors, and indexing
 */
export const FormEntityDefinitionSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),

  // Classification
  type: z.string(),
  tags: z.array(z.string()).optional(),

  behaviors: z.array(FormEntityBehaviorSchema).optional(),
  validation: z.array(FormEntityValidationSchema).optional(),

  indices: z
    .array(
      z.object({
        name: z.string(),
        fields: z.array(z.string()),
        unique: z.boolean().default(false),
      })
    )
    .optional(),
  relations: z
    .array(
      z.object({
        type: z.string(),
        targetId: z.string(),
        cardinality: z
          .enum(["one-to-one", "one-to-many", "many-to-many"])
          .default("many-to-many"),
        inverseName: z.string().optional(),
      })
    )
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
 * FormEntitySchema - The core entity representation in our Form system
 * Entities are first-class citizens in our Form Graph, representing nodes
 * in the knowledge representation.
 */
export const FormEntitySchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),

  // Classification
  type: z.string(),
  tags: z.array(z.string()).optional(),

  // Storage & persistence
  mapping: FormEntityStorageSchema.optional(),

  // Definition reference
  definitionId: z.string().optional(),

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
 * Helper function to create an entity definition
 */
export function defineFormEntity(config: {
  id: string;
  name: string;
  type?: string;
  description?: string;
  mapping: FormEntityStorage;
  validation?: FormEntityValidation[];
  behaviors?: FormEntityBehavior[];
  tags?: string[];
  contextId?: string;
}): FormEntityDefinition {
  return FormEntityDefinitionSchema.parse({
    id: config.id,
    name: config.name,
    description: config.description || config.name,
    type: config.type,
    mapping: config.mapping,
    validation: config.validation || [],
    behaviors: config.behaviors || [],
    tags: config.tags || [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    contextId: config.contextId,
  });
}

/**
 * Helper function to create a basic entity
 */
export function createFormEntity(config: {
  id: string;
  name: string;
  type: string;
  description?: string;
  definition?: FormEntityDefinition;
  storage?: string;
}): FormEntity {
  return FormEntitySchema.parse({
    id: config.id,
    name: config.name,
    type: config.type,
    description: config.description || config.name,
    definition: config.definition || {},
    mapping: {
      storage: config.storage || "default",
      primaryKey: "id",
      fields: {},
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export type FormEntityType = z.infer<typeof FormEntityTypeSchema>;
export type FormEntityStorage = z.infer<typeof FormEntityStorageSchema>;
export type FormEntityConstraint = z.infer<typeof FormEntityConstraintSchema>;
export type FormEntityBehavior = z.infer<typeof FormEntityBehaviorSchema>;
export type FormEntityCriteria = z.infer<typeof FormEntityCriteriaSchema>;
export type FormEntityValidation = z.infer<typeof FormEntityValidationSchema>;
export type FormEntityDefinition = z.infer<typeof FormEntityDefinitionSchema>;
export type FormEntity = z.infer<typeof FormEntitySchema>;
