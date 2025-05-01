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
 * Defines constraints that can be attached to relations
 *
 */
export const FormRelationConstraintSchema = z.object({
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
 * RelationBehavior schema
 * Defines behaviors that can be attached to relations
 */
export const FormRelationBehaviorSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
  // Behavior properties
  event: z.enum(["onCreate", "onRead", "onUpdate", "onDelete", "onTraverse"]),
  handler: z.function().or(z.string()),
  parameters: z.record(z.any()).optional(),
  active: z.boolean().default(true).optional(),
});

export const FormRelationCriteriaSchema = z.object({
  sourceId: z.string().optional(),
  targetId: z.string().optional(),
  type: z.string().optional(),
  subtype: z.string().optional(),
  properties: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  definitionId: z.string().optional(),
  contextId: z.string().optional(),
  active: z.boolean().optional(),
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

/**
 * RelationValidationRule schema
 * Defines validation rules that apply to relations
 */
export const FormRelationValidationSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
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
 * Complete FormRelationDefinition schema
 * A comprehensive definition of a relation with validation, behaviors, and properties
 */
export const FormRelationDefinitionSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  
  // Classification
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),

  // Current fields
  cardinality: FormRelationCardinalitySchema.optional().default("many-to-many"),
  constraints: z.array(FormRelationConstraintSchema).optional(),
  behaviors: z.array(FormRelationBehaviorSchema).optional(),
  validation: z.array(FormRelationValidationSchema).optional(),
  traversalCost: z.number().optional().default(1).optional(),
  inverse: z
    .object({
      type: z.string(),
      name: z.string().optional(),
    })
    .optional(),

  // Add metadata
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
  type: z.string(),
  tags: z.array(z.string()).optional(),

  // Storage mapping
  mapping: FormRelationStorageSchema.optional(),

  // Connection endpoints
  sourceId: z.string(),
  targetId: z.string(),

  definitionId: z.string(),

  // Relation properties
  properties: z.record(z.any()).optional(),
  directional: z.boolean().optional().default(true),
  direction: z.string().optional(),
  inverseName: z.string().optional(),
  weight: z.number().optional(),
  active: z.boolean().optional().default(true),

  // Metadata
  createdAt: z
    .number()
    .default(() => Date.now())
    .optional(), // Changed from created: z.date()
  updatedAt: z
    .number()
    .default(() => Date.now())
    .optional(), // Changed from updated: z.date()
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
  content: z.record(z.any()).optional(),
  timestamp: z.number().default(() => Date.now()),
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
export type FormRelationBehavior = z.infer<typeof FormRelationBehaviorSchema>;
export type FormRelationConstraint = z.infer<
  typeof FormRelationConstraintSchema
>;
export type FormRelationCriteria = z.infer<typeof FormRelationCriteriaSchema>;
export type FormRelationValidation = z.infer<
  typeof FormRelationValidationSchema
>;
export type FormRelationDefinition = z.infer<
  typeof FormRelationDefinitionSchema
>;
export type FormRelation = z.infer<typeof FormRelationSchema>;
export type EventRelation = z.infer<typeof EventRelationSchema>;
export type MessageRelation = z.infer<typeof MessageRelationSchema>;
