import { FormField } from "./form";
import { z } from "zod";

/**
 * Represents possible return types from custom validator functions
 */
export type ValidatorResult =
  | boolean
  | string
  | string[]
  | { errors?: string | string[]; warnings?: string | string[] };

// Define the validator result schema
const validatorResultPrimitive = z.union([
  z.boolean(),
  z.string(),
  z.array(z.string())
]);

// Define validator result object schema
const validatorResultObject = z.object({
  errors: z.union([z.string(), z.array(z.string())]).optional(),
  warnings: z.union([z.string(), z.array(z.string())]).optional()
});

// Combined validator result schema
export const ValidatorResultSchema = z.union([
  validatorResultPrimitive,
  validatorResultObject
]);

/**
 * Base interface for UI state tracking
 */
export const UIStateSchema = z.object({
  touched: z.record(z.string(), z.boolean()),
  dirty: z.record(z.string(), z.boolean()),
  focused: z.string().optional(),
  hovering: z.string().optional()
});

export type UIState = z.infer<typeof UIStateSchema>;

/**
 * Common constraints for all contexts
 */
export const ContextConstraintsSchema = z.object({
  device: z.enum(["mobile", "tablet", "desktop"]).optional().default("desktop"),
  orientation: z.enum(["portrait", "landscape"]).optional().default("portrait"),
  accessibilityLevel: z.enum(["A", "AA", "AAA"]).optional().default("AA"),
  locale: z.string().optional().default("en-US"),
  translations: z.record(z.string(), z.record(z.string(), z.string())).optional().default({}),
  maxColumns: z.number().optional(),
  maxFieldsPerSection: z.number().optional(),
  readOnly: z.boolean().optional().default(false)
});

export type ContextConstraints = z.infer<typeof ContextConstraintsSchema>;

/**
 * Base schema for all context types
 */
export const BaseContextSchema = z.object({
  type: z.string(),
  mode: z.enum(["view", "edit", "create"]),
  values: z.record(z.string(), z.any()).optional().default({}),
  data: z.record(z.string(), z.any()).optional().default({}),
  includeFields: z.array(z.string()).optional(),
  excludeFields: z.array(z.string()).optional(),
  ui: UIStateSchema.optional().default({
    touched: {},
    dirty: {}
  }),
  constraints: ContextConstraintsSchema.optional().default({
    device: "desktop",
    orientation: "portrait",
    locale: "en-US",
    translations: {},
  }),
  validationLevel: z.enum(["minimal", "standard", "strict"]).optional().default("standard"),
  validators: z.record(z.string(), z.function()).optional().default({})
});

/**
 * View context schema with support for detail, truncation and grouping
 */
export const ViewContextSchema = BaseContextSchema.extend({
  type: z.literal("view"),
  mode: z.literal("view"),
  responsive: z.boolean().optional().default(true),
  animation: z.boolean().optional().default(false),
  interaction: z.enum(["none", "hover", "expand", "full"]).optional().default("none"),
  state: z.enum(["idle", "loading", "error"]).optional().default("idle"),
  variant: z.string().optional().default("default"),
  
  // Detail configuration
  detail: z.object({
    level: z.enum(["minimal", "standard", "expanded", "complete"]).optional().default("standard"),
    expandedFields: z.array(z.string()).optional().default([])
  }).optional().default({
    level: "standard",
    expandedFields: []
  }),
  
  // Truncation configuration
  truncation: z.object({
    enabled: z.boolean().optional().default(false),
    maxLength: z.number().optional(),
    maxLines: z.number().optional(),
    preserveWords: z.boolean().optional().default(true),
    ellipsis: z.string().optional().default('…'),
    byFieldType: z.record(z.string(), z.number()).optional()
  }).optional().default({
    enabled: false
  }),
  
  // Grouping configuration
  grouping: z.object({
    defaultGroup: z.string().optional().default("general"),
    removeEmpty: z.boolean().optional().default(false),
    groupOrder: z.array(z.string()).optional(),
    groups: z.array(z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      meta: z.record(z.string(), z.any()).optional()
    })).optional().default([]),
    fieldGroups: z.record(z.string(), z.string()).optional().default({})
  }).optional().default({
    defaultGroup: "general" 
  })
});

export type ViewContext = z.infer<typeof ViewContextSchema>;

/**
 * Edit context schema
 */
export const EditContextSchema = BaseContextSchema.extend({
  type: z.literal("edit"),
  mode: z.literal("edit"),
  submitLabel: z.string().optional().default("Save"),
  cancelLabel: z.string().optional().default("Cancel"),
  clearOnSubmit: z.boolean().optional().default(false),
  buttonPosition: z.enum(["top", "bottom", "both"]).optional().default("bottom"),
  showCancel: z.boolean().optional().default(true),
  allowInlineEdit: z.boolean().optional().default(false),
  trackChanges: z.boolean().optional().default(true),
  originalValues: z.record(z.string(), z.any()).optional().default({})
});

export type EditContext = z.infer<typeof EditContextSchema>;

/**
 * Create context schema
 */
export const CreateContextSchema = BaseContextSchema.extend({
  type: z.literal("create"),
  mode: z.literal("create"),
  submitLabel: z.string().optional().default("Create"),
  cancelLabel: z.string().optional().default("Cancel"),
  clearOnSubmit: z.boolean().optional().default(true),
  buttonPosition: z.enum(["top", "bottom", "both"]).optional().default("bottom"),
  showCancel: z.boolean().optional().default(true),
  isNew: z.boolean().optional().default(true),
  defaultValues: z.record(z.string(), z.any()).optional().default({}),
  templates: z.record(z.string(), z.any()).optional().default({})
});

export type CreateContext = z.infer<typeof CreateContextSchema>;

/**
 * Data context schema
 */
export const DataContextSchema = BaseContextSchema.extend({
  type: z.literal("data"),
  mode: z.enum(["view", "edit", "create"]),
  format: z.enum(["json", "xml", "csv", "yaml"]).optional().default("json"),
  filter: z.function().optional(),
  transform: z.function().optional()
});

export type DataContext = z.infer<typeof DataContextSchema>;

/**
 * Enhanced UI state history item schema
 */
export const UIHistoryItemSchema = z.object({
  fieldId: z.string(),
  value: z.any(),
  timestamp: z.number()
});

/**
 * Advanced UI state schema with history
 */
export const AdvancedUIStateSchema = UIStateSchema.extend({
  history: z.array(UIHistoryItemSchema).optional().default([])
});

export type AdvancedUIState = z.infer<typeof AdvancedUIStateSchema>;

/**
 * Advanced constraints section defaults schema
 */
export const SectionDefaultsSchema = z.object({
  collapsible: z.boolean().default(false),
  columns: z.number().default(1)
});

/**
 * Advanced constraints schema
 */
export const AdvancedConstraintsSchema = ContextConstraintsSchema.extend({
  sectionLayout: z.enum(["auto", "manual"]).optional().default("auto"),
  maxSections: z.number().optional().default(10),
  sectionDefaults: SectionDefaultsSchema.optional().default({
    collapsible: false,
    columns: 1
  })
});

export type AdvancedConstraints = z.infer<typeof AdvancedConstraintsSchema>;

/**
 * Personalization options schema
 */
export const PersonalizationSchema = z.object({
  userId: z.string().optional(),
  userSegment: z.string().optional(),
  featureFlags: z.record(z.string(), z.boolean()).optional().default({}),
  experimentGroup: z.string().optional()
});

export type PersonalizationOptions = z.infer<typeof PersonalizationSchema>;

/**
 * Advanced context base schema
 */
export const AdvancedContextBaseSchema = z.object({
  // Required validation properties
  validationLevel: z.enum(["minimal", "standard", "strict"]).default("standard"),
  validators: z.record(z.string(), z.function()).default({}),
  
  // Enhanced UI state
  ui: AdvancedUIStateSchema.default({
    touched: {},
    dirty: {},
    history: []
  }),
  
  // Enhanced constraints
  constraints: AdvancedConstraintsSchema.default({
    device: "desktop",
    orientation: "portrait",
    locale: "en-US",
    translations: {},
    sectionLayout: "auto",
    maxSections: 10,
    sectionDefaults: {
      collapsible: false,
      columns: 1
    }
  }),
  
  // Field dependencies
  fieldDependencies: z.record(z.string(), z.array(z.string())).optional().default({}),
  
  // Personalization
  personalization: PersonalizationSchema.optional().default({
    featureFlags: {}
  })
});

/**
 * Advanced view context schema
 */
export const AdvancedViewContextSchema = ViewContextSchema.merge(AdvancedContextBaseSchema);

export type AdvancedViewContext = z.infer<typeof AdvancedViewContextSchema>;

/**
 * Advanced edit context schema
 */
export const AdvancedEditContextSchema = EditContextSchema.merge(AdvancedContextBaseSchema);

export type AdvancedEditContext = z.infer<typeof AdvancedEditContextSchema>;

/**
 * Advanced create context schema
 */
export const AdvancedCreateContextSchema = CreateContextSchema.merge(AdvancedContextBaseSchema);

export type AdvancedCreateContext = z.infer<typeof AdvancedCreateContextSchema>;

/**
 * Advanced context union schema
 */
export const AdvancedContextSchema = z.discriminatedUnion("type", [
  AdvancedViewContextSchema,
  AdvancedEditContextSchema,
  AdvancedCreateContextSchema
]);

export type AdvancedContext = z.infer<typeof AdvancedContextSchema>;

/**
 * Union schema of all possible context types
 * Note: We need to use specific schemas here rather than including AdvancedContextSchema
 * because Zod discriminated unions can't properly handle nested discriminated unions
 */
export const MorpheusContextSchema = z.discriminatedUnion("type", [
  // Use specific advanced context schemas instead of the union
  AdvancedViewContextSchema,
  AdvancedEditContextSchema, 
  AdvancedCreateContextSchema,
  // Regular context schemas
  ViewContextSchema,
  EditContextSchema,
  CreateContextSchema,
  DataContextSchema
]);

export type MorpheusContext = z.infer<typeof MorpheusContextSchema>;

/**
 * Type guards for context types
 */
export function isViewContext(context: MorpheusContext): context is ViewContext {
  return context && context.type === "view";
}

export function isEditContext(context: MorpheusContext): context is EditContext {
  return context && context.type === "edit";
}

export function isCreateContext(context: MorpheusContext): context is CreateContext {
  return context && context.type === "create";
}

export function isDataContext(context: MorpheusContext): context is DataContext {
  return context && context.type === "data";
}

/**
 * Type guard for advanced context
 */
export function isAdvancedContext(context: MorpheusContext): context is AdvancedContext {
  try {
    // Use Zod to validate the context against the schema
    AdvancedContextSchema.parse(context);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Type guards for specific advanced contexts
 */
export function isAdvancedViewContext(context: MorpheusContext): context is AdvancedViewContext {
  try {
    AdvancedViewContextSchema.parse(context);
    return true;
  } catch (error) {
    return false;
  }
}

export function isAdvancedEditContext(context: MorpheusContext): context is AdvancedEditContext {
  try {
    AdvancedEditContextSchema.parse(context);
    return true;
  } catch (error) {
    return false;
  }
}

export function isAdvancedCreateContext(context: MorpheusContext): context is AdvancedCreateContext {
  try {
    AdvancedCreateContextSchema.parse(context);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Create a basic context with minimal structure
 */
export function createBasicContext(
  type: "view" | "edit" | "create" | "data",
  mode?: "view" | "edit" | "create"
): MorpheusContext {
  // Default mode based on type
  const resolvedMode =
    mode || (type === "edit" ? "edit" : type === "create" ? "create" : "view");

  // Create context structure with default values
  const contextData = {
    type,
    mode: resolvedMode,
    values: {},
    data: {},
    ui: {
      touched: {},
      dirty: {},
    },
    constraints: {
      device: "desktop",
      orientation: "portrait",
      locale: "en-US",
      translations: {},
    },
  };

  // Use the appropriate schema to validate and set defaults
  switch (type) {
    case "view":
      return ViewContextSchema.parse(contextData);
    case "edit":
      return EditContextSchema.parse(contextData);
    case "create":
      return CreateContextSchema.parse(contextData);
    case "data":
      return DataContextSchema.parse(contextData);
    default:
      return ViewContextSchema.parse(contextData);
  }
}

/**
 * Create an advanced context with validation
 */
export function createAdvancedContext(
  options: {
    type?: "view" | "edit" | "create";
    mode?: "view" | "edit" | "create";
    values?: Record<string, any>;
    data?: Record<string, any>;
    validators?: Record<string, (value: any, field: FormField, context: any) => ValidatorResult>;
    validationLevel?: "minimal" | "standard" | "strict";
    device?: "mobile" | "tablet" | "desktop";
    orientation?: "portrait" | "landscape";
    locale?: string;
    translations?: Record<string, Record<string, string>>;
    touched?: Record<string, boolean>;
    dirty?: Record<string, boolean>;
    includeFields?: string[];
    excludeFields?: string[];
    personalization?: {
      userId?: string;
      userSegment?: string;
      featureFlags?: Record<string, boolean>;
      experimentGroup?: string;
    };
  } = {}
): AdvancedContext {
  // Determine type based on mode or default to view
  const type = options.type || 
               (options.mode === "edit" ? "edit" :
               options.mode === "create" ? "create" : "view");

  // Select schema based on type
  let schema;
  switch (type) {
    case "edit":
      schema = AdvancedEditContextSchema;
      break;
    case "create":
      schema = AdvancedCreateContextSchema;
      break;
    case "view":
    default:
      schema = AdvancedViewContextSchema;
      break;
  }

  // Create context data with user options
  const contextData = {
    type,
    mode: options.mode || type,
    values: options.values || {},
    data: options.data || {},
    validators: options.validators || {},
    validationLevel: options.validationLevel || "standard",
    includeFields: options.includeFields,
    excludeFields: options.excludeFields,
    ui: {
      touched: options.touched || {},
      dirty: options.dirty || {},
      history: []
    },
    constraints: {
      device: options.device || "desktop",
      orientation: options.orientation || "portrait",
      locale: options.locale || "en-US",
      translations: options.translations || {},
      sectionLayout: "auto",
      maxSections: 10,
      sectionDefaults: {
        collapsible: false,
        columns: options.device === "mobile" ? 1 : 2
      }
    },
    personalization: options.personalization || {
      featureFlags: {}
    },
    fieldDependencies: {}
  };

  // Validate and return with defaults applied
  return schema.parse(contextData);
}