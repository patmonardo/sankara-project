import { z } from 'zod';
import { BaseSchema } from './base';

/**
 * Registry Schema - The Container of Being
 *
 * Registry represents the organizing framework that contains
 * entities, relations, and contexts.
 */

// Registry types
export const CoreRegistryTypes = [
  'system',       // System registry
  'organization', // Organizational registry
  'project',      // Project registry
  'personal',     // Personal registry
  'domain',       // Domain-specific registry
  'generic'       // Generic registry
] as const;

// The core registry schema
export const RegistrySchema = BaseSchema.extend({
  // Registry characteristics
  type: z.enum(CoreRegistryTypes).default('generic'),
  name: z.string(),
  description: z.string().optional(),

  // Registry status
  active: z.boolean().default(true),

  // Registry properties
  properties: z.record(z.any()).optional(),

  // Statistics
  stats: z.object({
    entityCount: z.number().int().nonnegative().default(0),
    relationCount: z.number().int().nonnegative().default(0),
    contextCount: z.number().int().nonnegative().default(0),
    lastUpdated: z.date().optional()
  }).optional()
});

export type Registry = z.infer<typeof RegistrySchema>;

/**
 * Create a new registry
 */
export function createRegistry(params: {
  name: string;
  description?: string;
  type?: z.infer<typeof RegistrySchema.shape.type>;
  properties?: Record<string, any>;
  active?: boolean;
}): Registry {
  const now = new Date();

  return {
    id: crypto.randomUUID(),
    name: params.name,
    description: params.description,
    type: params.type || 'generic',
    active: params.active ?? true,
    properties: params.properties || {},
    stats: {
      entityCount: 0,
      relationCount: 0,
      contextCount: 0,
      lastUpdated: now
    },
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Helper to update registry statistics
 */
export function updateRegistryStats(
  registry: Registry,
  stats: {
    entityCount?: number;
    relationCount?: number;
    contextCount?: number;
  }
): Registry {
  const now = new Date();

  return {
    ...registry,
    stats: {
      entityCount: stats.entityCount ?? registry.stats?.entityCount ?? 0,
      relationCount: stats.relationCount ?? registry.stats?.relationCount ?? 0,
      contextCount: stats.contextCount ?? registry.stats?.contextCount ?? 0,
      lastUpdated: now
    },
    updatedAt: now
  };
}
