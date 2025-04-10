import { z } from "zod";

/**
 * RelationType - Defines the fundamental types of relationships in our Form system
 * These represent the core connection types in our knowledge representation
 */
export const RelationTypeSchema = z.enum([
  "connects",       // Generic connection
  "contains",       // Hierarchical containment
  "references",     // Reference or pointer
  "transforms",     // Transformation relation
  "inherits",       // Inheritance/extension
  "associates",     // Loose/peer association
  "implements",     // Interface implementation
  "triggers",       // Causal relationship
  "describes",      // Descriptive/metadata
  "depends-on",     // Dependency relationship
]);

export type RelationType = z.infer<typeof RelationTypeSchema>;

/**
 * Relation cardinality schema
 * Defines the possible cardinalities of relationships
 */
export const RelationalCardinalitySchema = z.enum([
  "one-to-one",     // Single source to single target
  "one-to-many",    // Single source to multiple targets
  "many-to-one",    // Multiple sources to single target
  "many-to-many",   // Multiple sources to multiple targets
]);

export type RelationalCardinality = z.infer<typeof RelationalCardinalitySchema>;

/**
 * Relation storage mapping schema
 * Defines how a relation is stored in a persistent layer
 */
export const RelationStorageMappingSchema = z.object({
  storage: z.string().optional(),
  sourceKey: z.string(),
  targetKey: z.string(),
  propertiesTable: z.string().optional(),
  indices: z.array(z.string()).optional(),
});

export type RelationStorageMapping = z.infer<typeof RelationStorageMappingSchema>;

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
  
  // Connection endpoints
  source: z.string(),
  target: z.string(),
  
  // Relation properties
  properties: z.record(z.any()).optional(),
  
  // Storage mapping
  mapping: RelationStorageMappingSchema.optional(),
  
  // Metadata
  created: z.date().optional().default(() => new Date()),
  updated: z.date().optional().default(() => new Date()),
  createdBy: z.string().optional(),
  contextId: z.string().optional(),
  
  // Relation-specific attributes
  directional: z.boolean().optional().default(true),
  weight: z.number().optional(),
  active: z.boolean().optional().default(true),
});

export type FormRelation = z.infer<typeof FormRelationSchema>;

/**
 * RelationValidationRule schema
 * Defines validation rules that apply to relations
 */
export const RelationValidationRuleSchema = z.object({
  property: z.string().optional(),
  rule: z.enum(["required", "unique", "reflexive", "transitive", "symmetric", "custom"]),
  value: z.any().optional(),
  message: z.string().optional(),
  custom: z.function().optional(),
});

export type RelationValidationRule = z.infer<typeof RelationValidationRuleSchema>;

/**
 * RelationBehavior schema
 * Defines behaviors that can be attached to relations
 */
export const RelationBehaviorSchema = z.object({
  name: z.string(),
  event: z.enum(["onCreate", "onUpdate", "onDelete", "onTraverse"]),
  handler: z.function().or(z.string()),
  parameters: z.record(z.any()).optional(),
  active: z.boolean().default(true),
});

export type RelationBehavior = z.infer<typeof RelationBehaviorSchema>;

/**
 * Complete FormRelationDefinition schema
 * A comprehensive definition of a relation with validation, behaviors, and properties
 */
export const FormRelationDefinitionSchema = FormRelationSchema.extend({
  validation: z.array(RelationValidationRuleSchema).optional(),
  behaviors: z.array(RelationBehaviorSchema).optional(),
  cardinality: RelationalCardinalitySchema.optional().default("many-to-many"),
  traversalCost: z.number().optional().default(1),
  inverse: z.object({
    type: z.string(),
    name: z.string().optional(),
  }).optional(),
});

export type FormRelationDefinition = z.infer<typeof FormRelationDefinitionSchema>;

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

export type EventRelation = z.infer<typeof EventRelationSchema>;

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

export type MessageRelation = z.infer<typeof MessageRelationSchema>;

/**
 * RelationQuery schema
 * Defines a query for retrieving relations
 */
export const RelationQuerySchema = z.object({
  type: z.string().optional(),
  sourceId: z.string().optional(),
  targetId: z.string().optional(),
  contextId: z.string().optional(),
  bidirectional: z.boolean().optional().default(false),
  includeInactive: z.boolean().optional().default(false),
  properties: z.record(z.any()).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type RelationQuery = z.infer<typeof RelationQuerySchema>;

/**
 * Path query schema
 * For finding paths between entities
 */
export const PathQuerySchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  relationTypes: z.array(z.string()).optional(),
  maxDepth: z.number().optional().default(10),
  algorithm: z.enum(["breadth-first", "depth-first", "shortest-path", "all-paths"]).optional().default("shortest-path"),
});

export type PathQuery = z.infer<typeof PathQuerySchema>;

/**
 * RelationService - Collection of relation-specific "verbs"
 * Implements the enhanced relation operations from NeoCore
 */
export class RelationService {
  /**
   * Create a basic relation between two entities
   */
  static relate(source: string, target: string, type: string, properties?: Record<string, any>): FormRelation {
    return FormRelationSchema.parse({
      id: `relation:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`,
      name: `${type} relation`,
      type,
      source,
      target,
      properties: properties || {},
      created: new Date(),
      updated: new Date(),
    });
  }

  /**
   * Emit an event as a relation
   */
  static emit(source: string, type: string, content: Record<string, any>, contextId?: string): EventRelation {
    return EventRelationSchema.parse({
      id: `event:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`,
      name: `${type} event`,
      type: "event",
      subtype: type,
      source,
      target: contextId || "global",
      content,
      timestamp: Date.now(),
      created: new Date(),
    });
  }

  /**
   * Send a message as a relation
   */
  static send(source: string, target: string, type: string, content: Record<string, any>): MessageRelation {
    return MessageRelationSchema.parse({
      id: `message:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`,
      name: `${type} message`,
      type: "message",
      subtype: type,
      source,
      target,
      content,
      timestamp: Date.now(),
      created: new Date(),
    });
  }

  /**
   * Broadcast a message to multiple targets
   */
  static broadcast(source: string, targets: string[], type: string, content: Record<string, any>): MessageRelation[] {
    return targets.map(target => 
      this.send(source, target, type, content)
    );
  }

  /**
   * Define a complete relation with validation and behaviors
   */
  static defineRelation(config: {
    id?: string;
    name: string;
    type: string;
    source: string;
    target: string;
    description?: string;
    properties?: Record<string, any>;
    cardinality?: RelationalCardinality;
    validation?: RelationValidationRule[];
    behaviors?: RelationBehavior[];
    mapping?: RelationStorageMapping;
    contextId?: string;
  }): FormRelationDefinition {
    return FormRelationDefinitionSchema.parse({
      id: config.id || `relation:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`,
      name: config.name,
      description: config.description,
      type: config.type,
      source: config.source,
      target: config.target,
      properties: config.properties || {},
      cardinality: config.cardinality || "many-to-many",
      validation: config.validation || [],
      behaviors: config.behaviors || [],
      mapping: config.mapping,
      created: new Date(),
      updated: new Date(),
      contextId: config.contextId,
    });
  }
}

/**
 * Helper functions for creating relations
 */

/**
 * Create a basic relation
 */
export function createRelation(source: string, target: string, type: string, properties?: Record<string, any>): FormRelation {
  return RelationService.relate(source, target, type, properties);
}

/**
 * Define a complete relation with validation and behaviors
 */
export function defineRelation(config: {
  id?: string;
  name: string;
  type: string;
  source: string;
  target: string;
  description?: string;
  properties?: Record<string, any>;
  cardinality?: RelationalCardinality;
  validation?: RelationValidationRule[];
  behaviors?: RelationBehavior[];
  mapping?: RelationStorageMapping;
  contextId?: string;
}): FormRelationDefinition {
  return RelationService.defineRelation(config);
}

/**
 * Create an event relation
 */
export function createEvent(source: string, type: string, content: Record<string, any>): EventRelation {
  return RelationService.emit(source, type, content);
}

/**
 * Create a message relation
 */
export function createMessage(source: string, target: string, type: string, content: Record<string, any>): MessageRelation {
  return RelationService.send(source, target, type, content);
}