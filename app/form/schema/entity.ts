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
 * FormEntitySchema - The core entity representation in our Form system
 * Entities are first-class citizens in our Form Graph, representing nodes
 * in the knowledge representation.
 */
export const FormEntitySchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string(),

  // Classification
  type: z.string(),
  tags: z.array(z.string()).optional(),

  // Structure
  schema: z.record(z.any()),

  // Storage & persistence
  mapping: FormEntityStorageSchema.optional(),

  // Metadata
  createdAt: z
    .number()
    .optional()
    .default(Date.now()),
  updatedAt: z
    .number()
    .optional()
    .default(Date.now()),
  createdBy: z.string().optional(),
  contextId: z.string().optional(),
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
 * Complete FormEntityDefinition schema
 * A comprehensive definition of an entity with validation, behaviors, and indexing
 */
export const FormEntityDefinitionSchema = FormEntitySchema.extend({
  validation: z.array(FormEntityValidationSchema).optional(),
  behaviors: z.array(FormEntityBehaviorSchema).optional(),
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
        target: z.string(),
        cardinality: z
          .enum(["one-to-one", "one-to-many", "many-to-many"])
          .default("many-to-many"),
        inverseName: z.string().optional(),
      })
    )
    .optional(),
});


/**
 * EntityQuery schema
 * Defines a query for retrieving entities
 */
export const FormEntityQuerySchema = z.object({
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
  limit: z.number().optional(),
  offset: z.number().optional(),
  include: z.array(z.string()).optional(),
});


/**
 * Helper function to create an entity definition
 */
export function defineFormEntity(config: {
  id: string;
  name: string;
  type: string;
  description?: string;
  schema: Record<string, any>;
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
    schema: config.schema,
    mapping: config.mapping,
    validation: config.validation || [],
    behaviors: config.behaviors || [],
    tags: config.tags || [],
    created: new Date(),
    updated: new Date(),
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
  schema?: Record<string, any>;
  storage?: string;
}): FormEntity {
  return FormEntitySchema.parse({
    id: config.id,
    name: config.name,
    description: config.description || config.name,
    type: config.type,
    schema: config.schema || {},
    mapping: {
      storage: config.storage || "default",
      primaryKey: "id",
      fields: {},
    },
    created: new Date(),
    updated: new Date(),
  });
}

export type FormEntityType = z.infer<typeof FormEntityTypeSchema>;
export type FormEntityStorage = z.infer<typeof FormEntityStorageSchema>;
export type FormEntityQuery = z.infer<typeof FormEntityQuerySchema>;
export type FormEntityDefinition = z.infer<typeof FormEntityDefinitionSchema>;
export type FormEntityValidation = z.infer<typeof FormEntityValidationSchema>;
export type FormEntityBehavior = z.infer<typeof FormEntityBehaviorSchema>;
export type FormEntity = z.infer<typeof FormEntitySchema>;
