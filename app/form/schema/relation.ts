import { z } from "zod";

/**
 * RelationType - Defines the fundamental types of relationships in our Form system
 * These represent the core connection types in our knowledge representation
 */
export const FormRelationTypeSchema = z.enum([
  "connects", // Generic connection
  "contains", // Hierarchical containment
  "references", // Reference or pointer
  "transforms", // Transformation relation
  "inherits", // Inheritance/extension
  "associates", // Loose/peer association
  "implements", // Interface implementation
  "triggers", // Causal relationship
  "describes", // Descriptive/metadata
  "depends-on", // Dependency relationship
]);

/**
 * Relation cardinality schema
 * Defines the possible cardinalities of relationships
 */
export const FormRelationCardinalitySchema = z.enum([
  "one-to-one", // Single source to single target
  "one-to-many", // Single source to multiple targets
  "many-to-one", // Multiple sources to single target
  "many-to-many", // Multiple sources to multiple targets
]);

/**
 * Relation storage mapping schema
 * Defines how a relation is stored in a persistent layer
 */
export const FormRelationStorageSchema = z.object({
  storage: z.string().optional(),
  sourceKey: z.string(),
  targetKey: z.string(),
  propertiesTable: z.string().optional(),
  indices: z.array(z.string()).optional(),
});

export const FormRelationQuerySchema = z.object({
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
  subtype: z.string().optional(),
  properties: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  maxDepth: z.number().optional(),
  minDepth: z.number().optional(),
  maxWidth: z.number().optional(),
  minWidth: z.number().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  sort: z.array(z.string()).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  filters: z.record(z.any()).optional(),
  includeMetadata: z.boolean().optional(),
  includeProperties: z.boolean().optional(),
  includeSource: z.boolean().optional(),
  includeTarget: z.boolean().optional(),
  includeSourceMetadata: z.boolean().optional(),
  includeTargetMetadata: z.boolean().optional(),
  includeSourceProperties: z.boolean().optional(),
  includeTargetProperties: z.boolean().optional(),
});

export const FormPathQuerySchema = z.object({
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
  subtype: z.string().optional(),
  properties: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  maxDepth: z.number().optional(),
  minDepth: z.number().optional(),
  maxWidth: z.number().optional(),
  minWidth: z.number().optional(),
});

/**
 * RelationValidationRule schema
 * Defines validation rules that apply to relations
 */
export const FormRelationValidationSchema = z.object({
  property: z.string().optional(),
  rule: z.enum([
    "required",
    "unique",
    "reflexive",
    "transitive",
    "symmetric",
    "custom",
  ]),
  value: z.any().optional(),
  message: z.string().optional(),
  custom: z.function().optional(),
});

/**
 * RelationValidationRule schema
 * Defines validation rules that apply to relations
 */
export const FormRelationConstraintSchema = z.object({
  property: z.string().optional(),
  value: z.any().optional(),
  message: z.string().optional(),
  custom: z.function().optional(),
});
/**
 * RelationBehavior schema
 * Defines behaviors that can be attached to relations
 */
export const FormRelationBehaviorSchema = z.object({
  name: z.string(),
  event: z.enum(["onCreate", "onUpdate", "onDelete", "onTraverse"]),
  handler: z.function().or(z.string()),
  parameters: z.record(z.any()).optional(),
  active: z.boolean().default(true),
});

/**
 * Complete FormRelationDefinition schema
 * A comprehensive definition of a relation with validation, behaviors, and properties
 */
export const FormRelationDefinitionSchema = z.object({
  // Identity
  id: z.string(), // Add this
  name: z.string(), // Add this
  description: z.string().optional(), // Add this

  // Current fields
  cardinality: FormRelationCardinalitySchema.optional().default("many-to-many"),
  validation: z.array(FormRelationValidationSchema).optional(),
  constraints: z.array(FormRelationConstraintSchema).optional(),
  behaviors: z.array(FormRelationBehaviorSchema).optional(),
  tags: z.array(z.string()).optional(),
  traversalCost: z.number().optional().default(1).optional(),
  inverse: z
    .object({
      type: z.string(),
      name: z.string().optional(),
    })
    .optional(),

  // Add metadata
  createdAt: z.number().default(() => Date.now()),
  updatedAt: z.number().default(() => Date.now()),
  createdBy: z.string().optional(),
});

/**
 * FormRelationSchema - The core relation representation in our Form system
 * Relations are first-class citizens in our Form Graph, representing edges
 * between entities in the knowledge representation.
 */
export const FormRelationSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),

  // Classification
  definitionId: z.string(),
  type: z.string(),

  // Connection endpoints
  source: z.string(),
  target: z.string(),

  // Relation properties
  properties: z.record(z.any()).optional(),

  // Storage mapping
  mapping: FormRelationStorageSchema.optional(),

  // Rest unchanged
  directional: z.boolean().optional().default(true),
  direction: z.string().optional(),
  inverseName: z.string().optional(),
  weight: z.number().optional(),
  active: z.boolean().optional().default(true),

  // Metadata
  createdAt: z.number().default(() => Date.now()), // Changed from created: z.date()
  updatedAt: z.number().default(() => Date.now()), // Changed from updated: z.date()
  createdBy: z.string().optional(),
  contextId: z.string().optional(),
});

/**
 * Event relation schema
 * Specialized relation for event-based interactions
 */
export const EventRelationSchema = FormRelationSchema.extend({
  type: z.literal("event"),
  subtype: z.string(),
  timestamp: z.number().default(() => Date.now()),
  content: z.record(z.any()).optional(),
  processed: z.boolean().optional().default(false),
});

/**
 * Message relation schema
 * Specialized relation for directed communication
 */
export const MessageRelationSchema = FormRelationSchema.extend({
  type: z.literal("message"),
  subtype: z.string().optional(),
  content: z.record(z.any()),
  timestamp: z.number().default(() => Date.now()),
  delivered: z.boolean().optional().default(false),
  read: z.boolean().optional().default(false),
  replyTo: z.string().optional(),
  threadId: z.string().optional(),
});

export type FormRelationType = z.infer<typeof FormRelationTypeSchema>;
export type FormRelationStorage = z.infer<typeof FormRelationStorageSchema>;
export type FormRelationCardinality = z.infer<
  typeof FormRelationCardinalitySchema
>;
export type FormRelationValidation = z.infer<
  typeof FormRelationValidationSchema
>;
export type FormRelationConstraint = z.infer<
  typeof FormRelationConstraintSchema
>;
export type FormRelationBehavior = z.infer<typeof FormRelationBehaviorSchema>;
export type FormRelationQuery = z.infer<typeof FormRelationQuerySchema>;
export type FormRelationPathQuery = z.infer<typeof FormPathQuerySchema>;
export type FormRelationDefinition = z.infer<
  typeof FormRelationDefinitionSchema
>;
export type FormRelation = z.infer<typeof FormRelationSchema>;
export type EventRelation = z.infer<typeof EventRelationSchema>;
export type MessageRelation = z.infer<typeof MessageRelationSchema>;
