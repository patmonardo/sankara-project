import { z } from "zod";
import { EntityQuerySchema } from "./entity";
import { RelationQuerySchema } from "./relation";

/**
 * Context Type Schema - Defines the fundamental types of contexts in our Form system
 */
export const ContextTypeSchema = z.enum([
  "view",       // For viewing/displaying entities
  "edit",       // For modifying existing entities
  "create",     // For creating new entities
  "list",       // For displaying collections
  "search",     // For querying/searching
  "action",     // For performing operations
  "composite",  // Combines multiple contexts
  "workflow"    // Sequential/process contexts
]);

export type ContextType = z.infer<typeof ContextTypeSchema>;

/**
 * Base Context Schema - Core properties for all context types
 */
export const BaseContextSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: ContextTypeSchema,
  
  // Hierarchical structure
  parentId: z.string().optional(),
  
  // State tracking
  active: z.boolean().default(false),
  timestamp: z.number().default(() => Date.now()),
  
  // Content
  entities: z.array(z.string()).optional().default([]),
  relations: z.array(z.string()).optional().default([]),
  events: z.array(z.string()).optional().default([]),
  
  // Context-specific data
  state: z.record(z.any()).optional().default({}),
  metadata: z.record(z.any()).optional().default({}),
  
  // Access control
  permissions: z.record(z.boolean()).optional(),
  
  // Lifecycle properties
  created: z.date().optional().default(() => new Date()),
  updated: z.date().optional().default(() => new Date()),
  createdBy: z.string().optional()
});

export type BaseContext = z.infer<typeof BaseContextSchema>;

/**
 * Context Constraints Schema - Defines constraints for context operations
 */
export const ContextConstraintsSchema = z.object({
  maxEntities: z.number().optional(),
  maxRelations: z.number().optional(),
  maxEvents: z.number().optional(),
  allowedEntityTypes: z.array(z.string()).optional(),
  allowedRelationTypes: z.array(z.string()).optional(),
  readOnly: z.boolean().optional().default(false),
  validationLevel: z.enum(["none", "minimal", "standard", "strict"]).optional().default("standard")
});

export type ContextConstraints = z.infer<typeof ContextConstraintsSchema>;

/**
 * Context Behavior Schema - Defines behaviors attached to contexts
 */
export const ContextBehaviorSchema = z.object({
  name: z.string(),
  event: z.enum(["onCreate", "onActivate", "onDeactivate", "onUpdate", "onDelete", "onEntityAdded", "onEntityRemoved", "onRelationAdded", "onRelationRemoved", "onEvent"]),
  handler: z.function().or(z.string()),
  parameters: z.record(z.any()).optional(),
  active: z.boolean().default(true)
});

export type ContextBehavior = z.infer<typeof ContextBehaviorSchema>;

/**
 * FormContextSchema - The complete context definition
 */
export const FormContextSchema = BaseContextSchema.extend({
  // Enhanced properties
  constraints: ContextConstraintsSchema.optional(),
  behaviors: z.array(ContextBehaviorSchema).optional(),
  
  // Transaction support
  transactionId: z.string().optional(),
  transactionState: z.enum(["none", "active", "committed", "rolledBack"]).optional().default("none"),
  
  // Indexing and querying
  indices: z.array(z.object({
    name: z.string(),
    type: z.enum(["entity", "relation", "event"]),
    fields: z.array(z.string())
  })).optional(),
  
  // View-specific properties (simplified from previous implementation)
  viewOptions: z.object({
    layout: z.enum(["default", "card", "table", "tree", "graph"]).optional().default("default"),
    sorting: z.array(z.object({
      field: z.string(),
      direction: z.enum(["asc", "desc"]).default("asc")
    })).optional(),
    filtering: z.record(z.any()).optional(),
    pagination: z.object({
      enabled: z.boolean().default(false),
      pageSize: z.number().default(20),
      currentPage: z.number().default(1)
    }).optional().default({
      enabled: false,
      pageSize: 20,
      currentPage: 1
    })
  }).optional().default({
    layout: "default"
  })
});

export type FormContext = z.infer<typeof FormContextSchema>;

/**
 * ContextQuery Schema - For querying contexts
 */
export const ContextQuerySchema = z.object({
  type: ContextTypeSchema.optional(),
  active: z.boolean().optional(),
  parentId: z.string().optional(),
  hasEntity: z.string().optional(),
  hasRelation: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  recursive: z.boolean().optional().default(false),
  includeInactive: z.boolean().optional().default(false)
});

export type ContextQuery = z.infer<typeof ContextQuerySchema>;

/**
 * ContextService - Provides verbs for working with contexts
 */
export class ContextService {
  /**
   * Create a new context
   */
  static createContext(config: {
    id?: string;
    name: string;
    description?: string;
    type: ContextType;
    parentId?: string;
    active?: boolean;
    state?: Record<string, any>;
    metadata?: Record<string, any>;
    constraints?: ContextConstraints;
    behaviors?: ContextBehavior[];
  }): FormContext {
    return FormContextSchema.parse({
      id: config.id || `context:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`,
      name: config.name,
      description: config.description,
      type: config.type,
      parentId: config.parentId,
      active: config.active ?? false,
      state: config.state || {},
      metadata: config.metadata || {},
      constraints: config.constraints,
      behaviors: config.behaviors,
      timestamp: Date.now(),
      created: new Date(),
      updated: new Date()
    });
  }
  
  /**
   * Switch to a different context (activate one, deactivate others)
   */
  static switchContext(contextId: string, options?: { preserveParentContext?: boolean }): boolean {
    // Implementation would deactivate current context(s) and activate the specified one
    // This is a placeholder for the actual implementation that would work with your storage system
    console.log(`Switching to context: ${contextId}`);
    return true;
  }
  
  /**
   * Execute a function within a specific context scope
   */
  static withContext<T>(contextId: string, fn: () => T): T {
    // Implementation would temporarily activate the context, run the function, then restore previous state
    console.log(`Executing within context: ${contextId}`);
    return fn();
  }
  
  /**
   * Begin a transaction in a context
   */
  static beginTransaction(contextId: string): string {
    const transactionId = `tx:${contextId}:${Date.now()}`;
    console.log(`Beginning transaction: ${transactionId}`);
    return transactionId;
  }
  
  /**
   * Commit a transaction in a context
   */
  static commitTransaction(contextId: string, transactionId: string): boolean {
    console.log(`Committing transaction: ${transactionId}`);
    return true;
  }
  
  /**
   * Rollback a transaction in a context
   */
  static rollbackTransaction(contextId: string, transactionId: string): boolean {
    console.log(`Rolling back transaction: ${transactionId}`);
    return true;
  }
  
  /**
   * Query entities within a context
   */
  static queryEntities(contextId: string, query: z.infer<typeof EntityQuerySchema>): string[] {
    console.log(`Querying entities in context: ${contextId}`);
    return [];
  }
  
  /**
   * Query relations within a context
   */
  static queryRelations(contextId: string, query: z.infer<typeof RelationQuerySchema>): string[] {
    console.log(`Querying relations in context: ${contextId}`);
    return [];
  }
  
  /**
   * Route a message through a context
   */
  static routeMessage(contextId: string, message: {
    type: string;
    source: string;
    target?: string;
    content: any;
  }): boolean {
    console.log(`Routing message in context: ${contextId}`);
    return true;
  }
  
  /**
   * Broadcast an event to all entities in a context
   */
  static broadcastEvent(contextId: string, event: {
    type: string;
    source: string;
    content: any;
  }): boolean {
    console.log(`Broadcasting event in context: ${contextId}`);
    return true;
  }
}

/**
 * Helper function to create a context
 */
export function createContext(config: {
  id?: string;
  name: string;
  description?: string;
  type: ContextType;
  parentId?: string;
  active?: boolean;
  state?: Record<string, any>;
  metadata?: Record<string, any>;
}): FormContext {
  return ContextService.createContext(config);
}

/**
 * Helper function to define a view context
 */
export function defineViewContext(config: {
  id?: string;
  name: string;
  description?: string;
  parentId?: string;
  layout?: "default" | "card" | "table" | "tree" | "graph";
  filtering?: Record<string, any>;
  sorting?: Array<{field: string, direction?: "asc" | "desc"}>;
  metadata?: Record<string, any>;
}): FormContext {
  return ContextService.createContext({
    ...config,
    type: "view",
    metadata: {
      ...config.metadata,
      viewOptions: {
        layout: config.layout || "default",
        filtering: config.filtering,
        sorting: config.sorting
      }
    }
  });
}

/**
 * Helper function to define an edit context
 */
export function defineEditContext(config: {
  id?: string;
  name: string;
  description?: string;
  parentId?: string;
  entityId: string;
  metadata?: Record<string, any>;
}): FormContext {
  return ContextService.createContext({
    ...config,
    type: "edit",
    metadata: {
      ...config.metadata,
      entityId: config.entityId
    }
  });
}

/**
 * Helper function to run code in a transaction
 */
export async function withTransaction<T>(contextId: string, fn: () => Promise<T>): Promise<T> {
  const txId = ContextService.beginTransaction(contextId);
  try {
    const result = await fn();
    ContextService.commitTransaction(contextId, txId);
    return result;
  } catch (error) {
    ContextService.rollbackTransaction(contextId, txId);
    throw error;
  }
}