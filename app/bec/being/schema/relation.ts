import { z } from 'zod';
import { BaseSchema } from './base';

/**
 * Relation Schema
 *
 * Core schema for entity relations in the membership system.
 * This schema represents the "Essence" aspect of our conceptual triad.
 */

// Entity reference schema - the basic identifier for an entity
export const EntityRefSchema = z.object({
  entity: z.string(),
  id: z.string()
});

export type EntityRef = z.infer<typeof EntityRefSchema>;

// Common relation types
export const CoreRelationTypes = [
  // Structural relations
  'contains',     // Whole-part relation
  'instance_of',  // Type-instance relation
  'extends',      // Extension relation
  'implements',   // Implementation relation

  // Associative relations
  'references',   // Simple reference
  'associates',   // General association
  'depends_on',   // Dependency relation
  'equivalent_to', // Equivalence relation

  // Ownership relations
  'owned_by',     // Ownership relation
  'created_by',   // Creation relation

  // Generic relation
  'related_to'    // Generic relation
] as const;

// Relation direction types
export const RelationDirectionTypes = [
  'directed',      // One-way relation: source → target
  'bidirectional'  // Two-way relation: source ↔ target
] as const;

// The core relation schema
export const RelationSchema = BaseSchema.extend({
  // Connection endpoints
  source: EntityRefSchema,
  target: EntityRefSchema,

  // Relation characteristics
  type: z.string(),
  direction: z.enum(RelationDirectionTypes).default('directed'),

  // Metadata
  properties: z.record(z.any()).optional(),

  // Validity
  valid: z.boolean().default(true),
  validFrom: z.date().default(() => new Date()),
  validTo: z.date().optional(),

  // Relation strength (0-1)
  strength: z.number().min(0).max(1).default(1)
});

export type Relation = z.infer<typeof RelationSchema>;

/**
 * Create a relation between entities
 */
export function createRelation(params: {
  source: EntityRef;
  target: EntityRef;
  type: string;
  direction?: z.infer<typeof RelationSchema.shape.direction>;
  properties?: Record<string, any>;
  validFrom?: Date;
  validTo?: Date;
  strength?: number;
  valid?: boolean;
}): Relation {
  const id = crypto.randomUUID();
  const now = new Date();

  return {
    id,
    source: params.source,
    target: params.target,
    type: params.type,
    direction: params.direction || 'directed',
    properties: params.properties || {},
    valid: params.valid ?? true,
    validFrom: params.validFrom || now,
    validTo: params.validTo,
    strength: params.strength ?? 1,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Create a bidirectional relation between entities
 */
export function createBidirectionalRelation(params: Omit<Parameters<typeof createRelation>[0], 'direction'>): Relation {
  return createRelation({
    ...params,
    direction: 'bidirectional'
  });
}

// Export a function for getting the current time (easier to mock)
export const getCurrentTime = () => new Date();

/**
 * Helper to determine if a relation is active at a specific time
*/
  export function isRelationActiveAt(
  relation: Relation,
  date: Date | null = null,
  timeProvider = getCurrentTime
): boolean {
  if (!relation.valid) return false;

  // Use provided date or get current time
  const checkDate = date || timeProvider();

  const afterStart = !relation.validFrom || relation.validFrom <= checkDate;
  const beforeEnd = !relation.validTo || relation.validTo >= checkDate;

  return afterStart && beforeEnd;
}

/**
 * Helper to format an entity key (for indexing)
 */
export function formatEntityKey(ref: EntityRef): string {
  return `${ref.entity}:${ref.id}`;
}

/**
 * Helper for migration from old link format
 */
export function linkToRelation(link: {
  sourceEntity: string;
  sourceId: string;
  targetEntity: string;
  targetId: string;
  relation: string;
  metadata?: Record<string, any>;
  established?: Date;
  expires?: Date;
}): Relation {
  return createRelation({
    source: { entity: link.sourceEntity, id: link.sourceId },
    target: { entity: link.targetEntity, id: link.targetId },
    type: link.relation,
    properties: link.metadata,
    validFrom: link.established,
    validTo: link.expires
  });
}

/**
 * Helper to invert a relation (swap source and target)
 */
export function invertRelation(relation: Relation): Relation {
  // Can't invert a bidirectional relation (it's already bidirectional)
  if (relation.direction === 'bidirectional') {
    return relation;
  }

  return {
    ...relation,
    id: crypto.randomUUID(), // Create a new ID for the inverted relation
    source: relation.target,
    target: relation.source,
    updatedAt: new Date()
  };
}

/**
 * Helper to check if two relations connect the same entities
 */
export function relationsConnectSameEntities(a: Relation, b: Relation): boolean {
  const sameDirection =
    a.source.entity === b.source.entity &&
    a.source.id === b.source.id &&
    a.target.entity === b.target.entity &&
    a.target.id === b.target.id;

  const oppositeDirection =
    a.source.entity === b.target.entity &&
    a.source.id === b.target.id &&
    a.target.entity === b.source.entity &&
    a.target.id === b.source.id;

  return sameDirection || oppositeDirection;
}
