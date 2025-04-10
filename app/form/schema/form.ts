import { z } from "zod";

// Define FormMatter type
export const FormMatterSchema = z.record(z.any()).optional();

// Define FormMode type
export const FormModeSchema = z
  .enum(["create", "edit", "view"])
  .default("create");

// Define FormMode type
export const FormContentSchema = z
  .enum(["jsx", "html", "json", "xml"])
  .default("jsx");

// Form content
export const FormOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const FormHandlerSchema = z.object({
  submit: z.function(),
  reset: z.function().optional(),
  cancel: z.function().optional(),
  delete: z.function().optional(),
});

export const FormActionSchema = z.object({
  id: z.string().default("submit"), // Link to FormHandler
  type: z.enum(["submit", "reset", "button"]).readonly(),
  label: z.string(),
  variant: z.enum(["primary", "secondary", "ghost"]),
  options: z.array(FormOptionSchema).optional(),
});

/**
 * Base field properties schema
 */
export const BaseFieldSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string().optional(),
  required: z.boolean().optional().default(false),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.any().optional(),
});

/**
 * Validation properties schema
 */
export const ValidationSchema = z.object({
  valid: z.boolean().optional(),
  errors: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
  touched: z.boolean().optional(),
  dirty: z.boolean().optional()
});

/**
 * Field metadata schema
 */
export const FieldMetaSchema = z.object({
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

/**
 * Accessibility properties schema
 */
export const AccessibilitySchema = z.object({
  ariaLabel: z.string().optional(),
  ariaDescribedBy: z.string().optional(),
  ariaErrorMessage: z.string().optional(),
  descriptionId: z.string().optional(),
  tabIndex: z.number().optional()
});

/**
 * Complete field schema
 */
export const FormFieldSchema = BaseFieldSchema.extend({
  // Type-specific validations
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  
  // Options for select/radio fields
  options: z.array(
    z.object({
      value: z.string(),
      label: z.string()
    })
  ).optional(),
  
  // Validation state
  validation: ValidationSchema.optional(),
  
  // Accessibility properties
  ...AccessibilitySchema.shape,
  
  // Metadata
  meta: FieldMetaSchema.optional()
});

/**
 * Section schema for form layout
 * - A section groups fields together visually
 */
export const FormSectionSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(z.string()), // Field IDs
  columns: z.number().optional().default(1),
  priority: z.number().optional().default(1),
  collapsible: z.boolean().optional().default(false),
  collapsed: z.boolean().optional().default(false),
  className: z.string().optional()
});

/**
 * Layout schema for the dynamically generated layout
 */
export const DynamicLayoutSchema = z.object({
  type: z.string(),
  sections: z.array(FormSectionSchema),
  device: z.string(),
  orientation: z.string(),
  generated: z.boolean()
});

/**
 * Form layout schema - used for structured layout definition
 */
export const FormLayoutSchema = z.object({
  title: z.string().optional(),
  columns: z.enum(["single", "double"]).optional(),
  actions: z.array(FormActionSchema).optional(),
  sections: z.array(FormSectionSchema).optional()
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
  
  // Accessibility metadata
  accessibility: z.object({
    enhanced: z.boolean().optional(),
    timestamp: z.string().optional(),
    level: z.string().optional()
  }).optional(),
  
  // Localization metadata
  localization: z.object({
    applied: z.boolean().optional(),
    locale: z.string().optional(),
    timestamp: z.string().optional()
  }).optional()
});

/**
 * Complete Form Shape schema
 */
export const FormShapeSchema = z.object({
  // Core properties
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(FormFieldSchema),
  isValid: z.boolean().optional(),
  
  // Structural layout - top level property
  layout: FormLayoutSchema.optional(),
  
  // Dynamic layout - used by DynamicLayoutMorph
  dynamicLayout: DynamicLayoutSchema.optional(),
  
  // Processing metadata - not structural
  meta: FormMetaSchema.optional(),
  
  // Form submission state
  state: FormStateSchema.optional()
});

// Type exports
export type FormMatter = z.infer<typeof FormMatterSchema>;
export type FormMode = z.infer<typeof FormModeSchema>;
export type FormContent = z.infer<typeof FormContentSchema>;
export type FormOptions = z.infer<typeof FormOptionSchema>;
export type FormHandler = z.infer<typeof FormHandlerSchema>;
export type FormAction = z.infer<typeof FormActionSchema>;
export type BaseField = z.infer<typeof BaseFieldSchema>;
export type FormField = z.infer<typeof FormFieldSchema>;
export type FormSection = z.infer<typeof FormSectionSchema>;
export type FormLayout = z.infer<typeof FormLayoutSchema>;
export type DynamicLayout = z.infer<typeof DynamicLayoutSchema>;
export type FormState = z.infer<typeof FormStateSchema>;
export type FormMeta = z.infer<typeof FormMetaSchema>;
export type FormShape = z.infer<typeof FormShapeSchema>;
export type ValidationResult = z.infer<typeof ValidationSchema>;