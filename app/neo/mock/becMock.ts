import { z } from 'zod';
import { EntityRefSchema, RelationSchema, formatEntityKey } from '../../bec/being/schema/relation';

/**
 * Mock BEC module for development while the full implementation is in progress
 * This provides just enough functionality to support the Morph work
 */

// Entity Schema Mock
export const EntitySchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  title: z.string().optional(),
  properties: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Entity = z.infer<typeof EntitySchema>;

// Context Schema Mock
export const ContextSchema = z.object({
  id: z.string(),
  entityRef: EntityRefSchema,
  type: z.string(),
  data: z.record(z.any()),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Context = z.infer<typeof ContextSchema>;

// In-memory stores for mocks
const entities = new Map<string, Entity>();
const contexts = new Map<string, Context>();
const relations = new Map<string, z.infer<typeof RelationSchema>>();

/**
 * Entity operations
 */
export const EntityOps = {
  create(params: {
    type: string;
    name: string;
    title?: string;
    properties?: Record<string, any>;
  }): Entity {
    const id = crypto.randomUUID();
    const now = new Date();
    
    const entity: Entity = {
      id,
      type: params.type,
      name: params.name,
      title: params.title,
      properties: params.properties || {},
      createdAt: now,
      updatedAt: now
    };
    
    entities.set(id, entity);
    return entity;
  },
  
  get(id: string): Entity | undefined {
    return entities.get(id);
  },
  
  update(id: string, updates: Partial<Omit<Entity, 'id' | 'createdAt'>>): Entity | undefined {
    const entity = entities.get(id);
    if (!entity) return undefined;
    
    const updated = {
      ...entity,
      ...updates,
      updatedAt: new Date()
    };
    
    entities.set(id, updated);
    return updated;
  },
  
  find(params: {
    type?: string;
    name?: string;
    title?: string;
  }): Entity[] {
    return Array.from(entities.values()).filter(entity => {
      if (params.type && entity.type !== params.type) return false;
      if (params.name && entity.name !== params.name) return false;
      if (params.title && entity.title !== params.title) return false;
      return true;
    });
  }
};

/**
 * Context operations
 */
export const ContextOps = {
  create(params: {
    entityRef: { entity: string, id: string };
    type: string;
    data: Record<string, any>;
  }): Context {
    const id = crypto.randomUUID();
    const now = new Date();
    
    const context: Context = {
      id,
      entityRef: params.entityRef,
      type: params.type,
      data: params.data,
      createdAt: now,
      updatedAt: now
    };
    
    contexts.set(id, context);
    return context;
  },
  
  get(id: string): Context | undefined {
    return contexts.get(id);
  },
  
  update(id: string, updates: Partial<{ data: Record<string, any> }>): Context | undefined {
    const context = contexts.get(id);
    if (!context) return undefined;
    
    const updated = {
      ...context,
      data: {
        ...context.data,
        ...updates.data
      },
      updatedAt: new Date()
    };
    
    contexts.set(id, updated);
    return updated;
  },
  
  findForEntity(entityRef: { entity: string, id: string }, type?: string): Context[] {
    const key = formatEntityKey(entityRef);
    return Array.from(contexts.values()).filter(context => {
      const contextKey = formatEntityKey(context.entityRef);
      if (contextKey !== key) return false;
      if (type && context.type !== type) return false;
      return true;
    });
  },
  
  isCreateAllowed(entityRef: { entity: string, id: string }, type: string): boolean {
    // Mock implementation always allows context creation
    // This is what you specifically need for now
    return true;
  }
};

/**
 * Relation operations - building on your existing implementation
 */
export const RelationOps = {
  create(params: {
    source: { entity: string, id: string };
    target: { entity: string, id: string };
    type: string;
    direction?: 'directed' | 'bidirectional';
    properties?: Record<string, any>;
  }): z.infer<typeof RelationSchema> {
    const id = crypto.randomUUID();
    const now = new Date();
    
    const relation: z.infer<typeof RelationSchema> = {
      id,
      source: params.source,
      target: params.target,
      type: params.type,
      direction: params.direction || 'directed',
      properties: params.properties || {},
      valid: true,
      validFrom: now,
      strength: 1,
      createdAt: now,
      updatedAt: now
    };
    
    relations.set(id, relation);
    return relation;
  },
  
  get(id: string): z.infer<typeof RelationSchema> | undefined {
    return relations.get(id);
  },
  
  findRelations(params: {
    source?: { entity: string, id: string };
    target?: { entity: string, id: string };
    type?: string;
  }): z.infer<typeof RelationSchema>[] {
    return Array.from(relations.values()).filter(relation => {
      if (params.source) {
        if (relation.source.entity !== params.source.entity) return false;
        if (relation.source.id !== params.source.id) return false;
      }
      
      if (params.target) {
        if (relation.target.entity !== params.target.entity) return false;
        if (relation.target.id !== params.target.id) return false;
      }
      
      if (params.type && relation.type !== params.type) return false;
      
      return true;
    });
  }
};

/**
 * Export convenience methods for the functions specifically needed for Morphs
 */
export function isCreateContext(entityRef: { entity: string, id: string }, type: string): boolean {
  return ContextOps.isCreateAllowed(entityRef, type);
}

export function createContext(params: Parameters<typeof ContextOps.create>[0]): Context {
  return ContextOps.create(params);
}

export function getContextsForEntity(entityRef: { entity: string, id: string }, type?: string): Context[] {
  return ContextOps.findForEntity(entityRef, type);
}