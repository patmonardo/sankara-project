import { z } from "zod";

/**
 * FormContextType - Defines the fundamental types of contexts
 */
export const FormContextTypeSchema = z.enum([
  "view",      // For viewing/perceiving entities 
  "edit",      // For transforming/modifying existing entities
  "create",    // For creating/manifesting new entities
  "list",      // For collecting/aggregating entities
  "search",    // For seeking/searching entities
  "action",    // For performing actions/operations
  "composite", // For combining/synthesizing multiple contexts
  "workflow",  // For sequential/procedural processing
]);

/**
 * FormContextScope - Defines the scope of context application
 */
export const FormContextScopeSchema = z.enum([
  "global",       // Applies everywhere
  "organization", // Applies within an organization
  "team",         // Applies within a team
  "user",         // Applies for a specific user
  "session"       // Applies for the current session only
]);

/**
 * FormContextRuleType - Types of rules that can be applied in contexts
 */
export const FormContextRuleTypeSchema = z.enum([
  "condition",  // Conditional activation
  "transform",  // Data transformation
  "validation", // Data validation
  "access",     // Access control
  "workflow"    // Process flow
]);

/**
 * FormContextRule - Defines a rule that applies within a context
 */
export const FormContextRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: FormContextRuleTypeSchema,
  description: z.string().optional(),
  // Rule-specific properties
  condition: z.function().optional().or(z.string().optional()),
  action: z.function().optional().or(z.string().optional()),
  priority: z.number().default(0),
  active: z.boolean().default(true)
});

/**
 * FormContextBase - Core properties for all context types
 */
export const FormContextBaseSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  type: FormContextTypeSchema.optional(),
  
  // Classification 
  scope: FormContextScopeSchema.default("global").optional(),
  priority: z.number().default(0).optional(),
  
  // Hierarchy
  parentId: z.string().optional(),
  
  // State
  active: z.boolean().default(false).optional(),
  
  // Timestamps (as numbers, consistent with Date.now())
  timestamp: z.number().default(() => Date.now()),
  createdAt: z.number().default(() => Date.now()),
  updatedAt: z.number().default(() => Date.now()),
  
  // Contextual data
  data: z.record(z.any()).optional().default({}).optional(),
  meta: z.record(z.any()).optional().default({}).optional(),
  
  // Associated IDs
  entities: z.array(z.string()).optional().default([]).optional(),
  relations: z.array(z.string()).optional().default([]).optional(),
  events: z.array(z.string()).optional().default([]).optional(),
  
  // Access control
  permissions: z.record(z.boolean()).optional(),
  
  // Attribution
  createdBy: z.string().optional(),
});

/**
 * FormContext - The complete context definition
 */
export const FormContextSchema = FormContextBaseSchema.extend({
  forms: z.array(z.string()).optional().default([]).optional(),
  
  // Rules for context behavior
  rules: z.array(FormContextRuleSchema).optional(),
  
  // Properties specific to this context
  properties: z.record(z.any()).optional(),
  
  // Tags for categorization
  tags: z.array(z.string()).optional(),
  
  // Transaction support
  transactionId: z.string().optional(),
  transactionState: z.enum(["none", "active", "committed", "rolledback"])
    .optional()
    .default("none"),

  // Execution environment type
  executionType: z.enum([
    "logical",    // Conceptual logic operations
    "numerical",  // Mathematical/algorithmic operations
    "quantum"     // Self-referential/paradoxical operations
  ]).default("logical").optional(),
  
  // Operation history
  executionHistory: z.array(
    z.object({
      operation: z.string(),
      type: z.string(),
      timestamp: z.number(),
      success: z.boolean(),
      initiatorId: z.string().optional(),
      details: z.any().optional()
    })
  ).optional().default([]).optional(),
  
  // Execution stats
  stats: z.object({
    operationCounts: z.record(z.number()).optional().default({}),
    successRate: z.number().optional().default(0),
    averageTime: z.number().optional().default(0)
  }).optional().default({}).optional(),
  
  // Environment settings
  environment: z.record(z.any()).optional().default({}).optional()
});

// Export types
export type FormContextType = z.infer<typeof FormContextTypeSchema>;
export type FormContextScope = z.infer<typeof FormContextScopeSchema>;
export type FormContextRule = z.infer<typeof FormContextRuleSchema>;
export type FormContextRuleType = z.infer<typeof FormContextRuleTypeSchema>;
export type FormContextBase = z.infer<typeof FormContextBaseSchema>;
export type FormContext = z.infer<typeof FormContextSchema>;
export type FormExecutionContext = FormContext;