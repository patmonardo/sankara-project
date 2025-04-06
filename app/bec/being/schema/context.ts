//@/core/being/schema/context.ts
import { z } from 'zod';
import { BaseSchema } from './base';
import { EntityRefSchema } from './entity';

/**
 * Context Schema - The Third Moment of Being
 *
 * In Hegelian terms, Context represents the Synthesis (Concept) that unites
 * Entity (Thesis/Being) and Relation (Antithesis/Essence) in a concrete Universal.
 *
 * It embodies the dialectical movement where individual entities and their connections
 * are brought together in a meaningful totality.
 */

// Context types representing different modes of conceptual organization
export const CoreContextTypes = [
  'collection',    // Simple gathering - immediate unity
  'organization',  // Structured arrangement - mediated unity
  'project',       // Purposive structure - teleological unity
  'domain',        // Knowledge boundary - categorical unity
  'category',      // Classification system - logical unity
  'session',       // Temporal context - processual unity
  'view',          // Perspective context - phenomenological unity
  'workflow',      // Process context - operational unity
  'scenario',      // Hypothetical context - modal unity
  'generic'        // Universal context - abstract unity
] as const;

// The core context schema - represents the concrete universal
export const ContextSchema = BaseSchema.extend({
  // Universal moment - what makes it this particular context
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),

  // Particular moment - the specific content it contains
  entities: z.array(EntityRefSchema).default([]),
  relations: z.array(z.string()).default([]), // IDs of relations

  // Individual moment - the unique properties that differentiate it
  properties: z.record(z.any()).optional(),

  // Quantitative determination - metrics of its internal structure
  metrics: z.object({
    entityCount: z.number().int().nonnegative(),
    relationCount: z.number().int().nonnegative(),
    density: z.number().min(0).max(1).optional() // Network density as a measure of completeness
  }).optional(),

  // Modal determination - its possibility and actuality
  valid: z.boolean().default(true),
  validFrom: z.date().optional(),
  validTo: z.date().optional(),

  // Scope determination - its boundaries
  scope: z.enum(['global', 'domain', 'local']).default('local'),
  domain: z.string().optional(),
});

export type Context = z.infer<typeof ContextSchema>;

/**
 * Calculate graph density from entity and relation counts
 *
 * Represents the ratio of actual to possible relations in the context.
 * This is a quantitative measure of the context's completeness.
 */
export function calculateDensity(entityCount: number, relationCount: number): number | undefined {
  if (entityCount <= 1) return entityCount === 0 ? undefined : 1.0;

  // Maximum possible relations in a directed graph = n(n-1)
  const maxRelations = entityCount * (entityCount - 1);
  return maxRelations > 0 ? relationCount / maxRelations : 0;
}

/**
 * Create a new context - the generative moment
 */
export function createContext(params: {
  name: string;
  type: string;
  description?: string;
  entities?: z.infer<typeof EntityRefSchema>[];
  relations?: string[];
  properties?: Record<string, any>;
  validFrom?: Date;
  validTo?: Date;
  valid?: boolean;
  scope?: z.infer<typeof ContextSchema.shape.scope>;
  domain?: string;
}): Context {
  const now = new Date();
  const entities = params.entities || [];
  const relations = params.relations || [];

  return {
    id: crypto.randomUUID(),
    name: params.name,
    type: params.type,
    description: params.description,
    entities: entities,
    relations: relations,
    properties: params.properties || {},
    metrics: {
      entityCount: entities.length,
      relationCount: relations.length,
      density: calculateDensity(entities.length, relations.length)
    },
    valid: params.valid ?? true,
    validFrom: params.validFrom,
    validTo: params.validTo,
    scope: params.scope || 'local',
    domain: params.domain,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Helper to determine if a context is active at a specific time
 *
 * Represents the temporal determination of the context's actuality.
 */
export function isContextActiveAt(
  context: Context,
  date?: Date | null,
  timeProvider = (): Date => new Date()
): boolean {
  // If context is not valid, it's not active regardless of time
  if (!context.valid) return false;

  // If no date specified, use current time
  const checkDate = date || timeProvider();

  // Check validFrom if specified
  if (context.validFrom && checkDate < context.validFrom) {
    return false;
  }

  // Check validTo if specified
  if (context.validTo && checkDate > context.validTo) {
    return false;
  }

  return true;
}

/**
 * Helper to add entities to a context - the augmentation moment
 */
export function addEntitiesToContext(
  context: Context,
  entities: z.infer<typeof EntityRefSchema>[]
): Context {
  // Filter out duplicates
  const existingEntityMap = new Map(
    context.entities.map(e => [`${e.entity}:${e.id}`, e])
  );

  const newEntities = entities.filter(e =>
    !existingEntityMap.has(`${e.entity}:${e.id}`)
  );

  if (newEntities.length === 0) {
    return context;
  }

  const updatedEntities = [...context.entities, ...newEntities];

  return {
    ...context,
    entities: updatedEntities,
    metrics: {
      entityCount: updatedEntities.length,
      relationCount: context.relations.length,
      density: calculateDensity(updatedEntities.length, context.relations.length)
    },
    updatedAt: new Date()
  };
}

/**
 * Helper to add relations to a context - the connection moment
 */
export function addRelationsToContext(
  context: Context,
  relationIds: string[]
): Context {
  // Filter out duplicates
  const newRelations = relationIds.filter(id => !context.relations.includes(id));

  if (newRelations.length === 0) {
    return context;
  }

  const updatedRelations = [...context.relations, ...newRelations];

  return {
    ...context,
    relations: updatedRelations,
    metrics: {
      entityCount: context.entities.length,
      relationCount: updatedRelations.length,
      density: calculateDensity(context.entities.length, updatedRelations.length)
    },
    updatedAt: new Date()
  };
}
