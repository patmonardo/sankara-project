import { z } from "zod";

/**
 * Context Type Schema - Defines the fundamental types of contexts in our Form system
 */
export const FormContextTypeSchema = z.enum([
  "view",       // For viewing/displaying entities
  "edit",       // For modifying existing entities
  "create",     // For creating new entities
  "list",       // For displaying collections
  "search",     // For querying/searching
  "action",     // For performing operations
  "composite",  // Combines multiple contexts
  "workflow"    // Sequential/process contexts
]);

/**
 * Root Context Schema - Core properties for all context types
 */
export const FormContextRootSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: FormContextTypeSchema,
  
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

/**
 * Context Constraints Schema - Defines constraints for context operations
 */
export const FormContextConstraintSchema = z.object({
  maxEntities: z.number().optional(),
  maxRelations: z.number().optional(),
  maxEvents: z.number().optional(),
  allowedEntityTypes: z.array(z.string()).optional(),
  allowedRelationTypes: z.array(z.string()).optional(),
  readOnly: z.boolean().optional().default(false),
  validationLevel: z.enum(["none", "minimal", "standard", "strict"]).optional().default("standard")
});

/**
 * Context Behavior Schema - Defines behaviors attached to contexts
 */
export const FormContextBehaviorSchema = z.object({
  name: z.string(),
  event: z.enum(["onCreate", "onActivate", "onDeactivate", "onUpdate", "onDelete", "onEntityAdded", "onEntityRemoved", "onRelationAdded", "onRelationRemoved", "onEvent"]),
  handler: z.function().or(z.string()),
  parameters: z.record(z.any()).optional(),
  active: z.boolean().default(true)
});

/**
 * ContextQuery Schema - For querying contexts
 */
export const FormContextQuerySchema = z.object({
  type: FormContextTypeSchema.optional(),
  active: z.boolean().optional(),
  parentId: z.string().optional(),
  hasEntity: z.string().optional(),
  hasRelation: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  recursive: z.boolean().optional().default(false),
  includeInactive: z.boolean().optional().default(false)
});

/**
 * FormContextSchema - The complete context definition
 */
export const FormContextSchema = FormContextRootSchema.extend({
  // Enhanced properties
  constraints: FormContextConstraintSchema.optional(),
  behaviors: z.array(FormContextBehaviorSchema).optional(),
  
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

export type FormContextType = z.infer<typeof FormContextTypeSchema>;
export type FormContextConstraints = z.infer<typeof FormContextConstraintSchema>;
export type FormContextBehavior = z.infer<typeof FormContextBehaviorSchema>;
export type FormContextQuery = z.infer<typeof FormContextQuerySchema>;
export type FornContextRoot = z.infer<typeof FormContextRootSchema>;
export type FormContext = z.infer<typeof FormContextSchema>;
