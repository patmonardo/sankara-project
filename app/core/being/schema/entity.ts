//@/core/being/schema/entity.ts
import { z } from 'zod';
import { BaseSchema } from './base';

/**
 * Entity Schema
 *
 * Core schema for entities in the membership system.
 * This schema represents the "Being" aspect of our conceptual triad.
 */

// Basic entity reference schema
export const EntityRefSchema = z.object({
  entity: z.string(),
  id: z.string()
});

export type EntityRef = z.infer<typeof EntityRefSchema>;

// Namespaces represent categories of entities
export const CoreNamespaces = [
  'system',     // System entities
  'core',       // Core business entities
  'user',       // User-related entities
  'finance',    // Financial entities
  'document',   // Document entities
  'meta'        // Metadata entities
] as const;

// Core system entity types
export const SystemEntityTypes = [
  'system.Entity',       // Base entity definition
  'system.EntityType',   // Entity type definition
  'system.Relation',     // Relation definition
  'system.Context',      // Context definition
  'system.Registry'      // Registry definition
] as const;

// Entity status values
export const EntityStatusValues = [
  'active',     // Entity is active and usable
  'archived',   // Entity is archived but retrievable
  'deleted',    // Entity is soft-deleted
  'draft',      // Entity is in draft mode
  'template'    // Entity is a template
] as const;

// The core entity schema
export const EntitySchema = BaseSchema.extend({
  // Core identity
  type: z.string(),  // The entity type
  name: z.string(),  // Display name

  // Optional description
  description: z.string().optional(),

  // Extended data
  properties: z.record(z.any()).optional(),

  // System metadata
  status: z.enum(EntityStatusValues).default('active'),
  version: z.number().int().default(1)
});

export type Entity = z.infer<typeof EntitySchema>;

/**
 * Helper function to create a new entity
 */
export function createEntity(params: {
  type: string;
  id?: string;
  name?: string;
  description?: string;
  properties?: Record<string, any>;
  status?: z.infer<typeof EntitySchema.shape.status>;
}): Entity {
  const id = params.id || crypto.randomUUID();
  const now = new Date();

  return {
    id,
    type: params.type,
    name: params.name || id,
    description: params.description,
    properties: params.properties || {},
    status: params.status || 'active',
    version: 1,
    createdAt: now,
    updatedAt: now
  };
}

// Update this function to use 'status' instead of 'valid'
export function updateEntity(
  entity: Entity,
  updates: {
    name?: string;
    description?: string;
    properties?: Record<string, any>;
    status?: z.infer<typeof EntitySchema.shape.status>;
    version?: number;
  }
): Entity {
  return {
    ...entity,
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.description !== undefined ? { description: updates.description } : {}),
    ...(updates.status !== undefined ? { status: updates.status } : {}),
    ...(updates.version !== undefined ? { version: updates.version } : {}),
    properties: {
      ...entity.properties,
      ...(updates.properties || {})
    },
    updatedAt: new Date()
  };
}

/**
 * Helper function to create an entity reference
 */
export function createEntityRef(entity: Entity): EntityRef {
  return {
    entity: entity.type,
    id: entity.id
  };
}

/**
 * Helper function to format an entity key
 */
export function formatEntityKey(entityOrRef: Entity | EntityRef): string {
  const type = 'type' in entityOrRef ? entityOrRef.type : entityOrRef.entity;
  const id = entityOrRef.id;
  return `${type}:${id}`;
}

/**
 * Helper function to parse an entity key
 */
export function parseEntityKey(key: string): EntityRef {
  const [entity, id] = key.split(':');
  return { entity, id };
}

/**
 * Helper function to check if an entity is a system entity
 */
export function isSystemEntity(entity: Entity): boolean {
  return entity.type.startsWith('system.');
}

/**
 * Helper function to check if an entity is protected
 */
export function isProtectedEntity(entity: Entity): boolean {
  return Boolean(entity.properties?.protected);
}
