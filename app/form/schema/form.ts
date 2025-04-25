import { z } from "zod";

/**
 * FormMatter - Defines the data access patterns for forms
 * 
 * This represents the a priori context of how forms interact with data
 * rather than just being a generic record.
 */
export const FormMatterSchema = z.object({
  // Data source configuration
  source: z.object({
    type: z.enum([
      'entity',      // BEC entity
      'context',     // BEC context
      'api',         // External API
      'function',    // Custom function
      'localStorage', // Browser localStorage
      'composite'    // Multiple sources
    ]),
    
    // Entity reference if source.type is 'entity'
    entityRef: z.object({
      entity: z.string(),
      id: z.string()
    }).optional(),
    
    // Context reference if source.type is 'context'
    contextRef: z.object({
      entityRef: z.object({
        entity: z.string(),
        id: z.string()
      }),
      type: z.string()
    }).optional(),
    
    // API configuration if source.type is 'api'
    apiConfig: z.object({
      endpoint: z.string(),
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
      headers: z.record(z.string()).optional(),
      params: z.record(z.any()).optional()
    }).optional(),
    
    // Function reference if source.type is 'function'
    functionRef: z.object({
      name: z.string(),
      args: z.array(z.any()).optional()
    }).optional(),
    
    // LocalStorage configuration if source.type is 'localStorage'
    localStorageKey: z.string().optional(),
    
    // Composite sources if source.type is 'composite'
    compositeSources: z.array(z.any()).optional(),
  }),
  
  // Data access patterns
  access: z.object({
    // Read configuration
    read: z.object({
      path: z.string().optional(),    // Path in the data structure to read from
      transform: z.function().optional(), // Transform function for the read data
      default: z.any().optional(),    // Default value if read fails
      cache: z.boolean().optional().default(false) // Whether to cache the read result
    }).optional(),
    
    // Write configuration
    write: z.object({
      path: z.string().optional(),    // Path in the data structure to write to
      transform: z.function().optional(), // Transform function for the write data
      merge: z.boolean().optional().default(true), // Whether to merge with existing data
      validation: z.function().optional() // Validation function before writing
    }).optional(),
    
    // Subscribe to changes
    subscribe: z.object({
      path: z.string().optional(),    // Path to subscribe to
      debounce: z.number().optional(), // Debounce time in ms
      throttle: z.number().optional() // Throttle time in ms
    }).optional()
  }).optional(),
  
  // Data schema
  schema: z.object({
    type: z.enum(['zod', 'json-schema', 'typescript', 'custom']).optional(),
    definition: z.any().optional() // The actual schema definition
  }).optional(),
  
  // Processing hooks for form data
  hooks: z.object({
    beforeLoad: z.function().optional(),
    afterLoad: z.function().optional(),
    beforeSubmit: z.function().optional(),
    afterSubmit: z.function().optional(),
    onValidate: z.function().optional()
  }).optional(),
  
  // Metadata about the data
  meta: z.object({
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    version: z.string().optional(),
    owner: z.string().optional(),
    permissions: z.array(z.string()).optional()
  }).optional()
}).optional();

/**
 * FormData - The actual content data for a form
 * 
 * This represents the a posteriori manifestation of form data
 */
export const FormDataSchema = z.record(z.any());

// Define FormMode type
export const FormModeSchema = z
  .enum(["create", "edit", "view"])
  .default("create");

// Define FormContent type - Fixed the comment
export const FormContentSchema = z
  .enum(["jsx", "html", "json", "xml"])
  .default("jsx");

// Form content
export const FormOptionSchema = z.object({
  value: z.any(),
  label: z.string(),
});

/**
 * Validation schema for form field validation rules
 */
export const FormFieldValidationSchema = z.object({
  required: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  custom: z.function().optional(),
  message: z.string().optional(),
});

/**
 * Field metadata schema
 */
export const FormFieldMetaSchema = z.object({
  sectionHint: z.string().optional(),
  validation: z.object({
    performed: z.boolean().optional(),
    timestamp: z.number().optional(),
    level: z.string().optional()
  }).optional(),
  accessibility: z.object({
    enhanced: z.boolean().optional(),
    level: z.string().optional(),
    guideline: z.string().optional()
  }).optional(),
  localization: z.object({
    applied: z.boolean().optional(),
    locale: z.string().optional()
  }).optional()
});

export const FormFieldSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.any().optional(),
  required: z.boolean().optional().default(false).optional(),
  disabled: z.boolean().optional().default(false).optional(),
  createOnly: z.boolean().optional(),
  editOnly: z.boolean().optional(),
  readOnly: z.boolean().optional().default(false).optional(),
  visible: z.boolean().optional().default(true).optional(),
  validation: FormFieldValidationSchema.optional(), // Using proper validation schema now
  options: z.array(FormOptionSchema).optional(),
  inputType: z.string().optional(),
  format: z.string().optional(),
  meta: FormFieldMetaSchema.optional(),
});

/**
 * Section schema for form layout
 * - A section groups fields together visually
 */
export const FormSectionSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(z.string()).optional(), // Field IDs
  columns: z.number().optional().default(1).optional(),
  priority: z.number().optional().default(1).optional(),
  collapsible: z.boolean().optional().default(false).optional(),
  collapsed: z.boolean().optional().default(false).optional(),
  className: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

export const FormHandlerSchema = z.object({
  submit: z.function(),
  reset: z.function().optional(),
  cancel: z.function().optional(),
  delete: z.function().optional(),
});

export const FormActionSchema = z.object({
  id: z.string(),
  type: z.enum(["submit", "reset", "button"]),
  label: z.string(),
  primary: z.boolean().optional().default(false).optional(),
  disabled: z.boolean().optional().default(false).optional(),
  position: z.enum(["top", "bottom", "both"]).optional().default("bottom").optional(),
});

export const FormLayoutSchema = z.object({
  title: z.string().optional(),
  columns: z.enum(["single", "double"]).optional(),
  sections: z.array(FormSectionSchema).optional(),
  actions: z.array(FormActionSchema).optional(),
  // Add responsive hints that Tailwind can use
  responsive: z.object({
    sectionBreakpoints: z.record(z.enum(["stack", "grid", "tabs"])).optional(),
    fieldArrangement: z.enum(["natural", "importance", "groupRelated"]).optional()
  }).optional()
});

/**
 * Form state schema for tracking form submission state
 */
export const FormStateSchema = z.object({
  status: z.enum(["idle", "submitting", "success", "error"]),
  errors: z.record(z.array(z.string())).optional(),
  message: z.string().optional()
});

/**
 * Form metadata schema
 * - Contains processing information, not structural properties
 */
export const FormMetaSchema = z.object({
  // Validation metadata
  validation: z.object({
    performed: z.boolean().optional(),
    timestamp: z.number().optional(),
    fieldErrors: z.number().optional()
  }).optional(),
  
  // Layout processing metadata
  layout: z.object({
    source: z.string().optional(),
    timestamp: z.number().optional(),
    generated: z.boolean().optional()
  }).optional(),
  
  // Accessibility metadata (fixed timestamps to be numbers)
  accessibility: z.object({
    enhanced: z.boolean().optional(),
    timestamp: z.number().optional(),
    level: z.string().optional()
  }).optional(),
  
  // Localization metadata (fixed timestamps to be numbers)
  localization: z.object({
    applied: z.boolean().optional(),
    locale: z.string().optional(),
    timestamp: z.number().optional()
  }).optional(),
});

/**
 * Complete Form Shape schema
 */
export const FormShapeSchema = z.object({
  // Core properties
  id: z.string(),
  name: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  
  // Data layer - separating the a priori context from the a posteriori content
  matter: FormMatterSchema,  // How data is accessed (a priori)
  data: FormDataSchema.optional(), // Actual data content (a posteriori)
  
  
  // Form structure
  fields: z.array(FormFieldSchema),
  options: z.array(FormOptionSchema).optional(),
  isValid: z.boolean().optional(),
  // Structural layout - top level property
  layout: FormLayoutSchema.optional(),
  
  // Form submission state
  state: FormStateSchema.optional(),
  
  // Processing metadata - not structural
  meta: FormMetaSchema.optional(),
});

// Type exports
export type FormMatter = z.infer<typeof FormMatterSchema>;
export type FormMode = z.infer<typeof FormModeSchema>;
export type FormContent = z.infer<typeof FormContentSchema>;
export type FormFieldValidation = z.infer<typeof FormFieldValidationSchema>;
export type FormOption = z.infer<typeof FormOptionSchema>;
export type FormField = z.infer<typeof FormFieldSchema>;
export type FormHandler = z.infer<typeof FormHandlerSchema>;
export type FormAction = z.infer<typeof FormActionSchema>;
export type FormFieldMeta = z.infer<typeof FormFieldMetaSchema>;
export type FormSection = z.infer<typeof FormSectionSchema>;
export type FormLayout = z.infer<typeof FormLayoutSchema>;
export type FormState = z.infer<typeof FormStateSchema>;
export type FormShape = z.infer<typeof FormShapeSchema>;
export type FormMeta = z.infer<typeof FormMetaSchema>;
export type FormData = z.infer<typeof FormDataSchema>;