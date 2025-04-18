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
  value: z.any(),
  label: z.string(),
});

export const FormFieldSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.any().optional(),
  required: z.boolean().optional().default(false).optional(),
  disabled: z.boolean().optional().default(false).optional(),
  readOnly: z.boolean().optional().default(false).optional(),
  visible: z.boolean().optional().default(true).optional(), // Keep visible property
  validation: z.any().optional(), // Define validation schema later
  options: z.array(FormOptionSchema).optional(),
  inputType: z.string().optional(), // Specific UI input type hint
  createOnly: z.boolean().optional(),
  editOnly: z.boolean().optional(),
  excludeFromCreate: z.boolean().optional(),
  excludeFromEdit: z.boolean().optional(),
  excludeFromView: z.boolean().optional(),
  description: z.string().optional(),
  format: z.string().optional(),
  meta: z.record(z.any()).optional(),
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
 * Section schema for form layout
 * - A section groups fields together visually
 */
export const FormSectionSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(z.string()), // Field IDs
  columns: z.number().optional().default(1).optional(),
  priority: z.number().optional().default(1).optional(),
  collapsible: z.boolean().optional().default(false).optional(),
  collapsed: z.boolean().optional().default(false).optional(),
  className: z.string().optional(),
  meta: z.record(z.any()).optional(),
  
});

export const FormLayoutSchema = z.object({
  title: z.string().optional(),
  columns: z.enum(["single", "double"]).optional(),
  actions: z.array(FormActionSchema).optional(),
  sections: z.array(FormSectionSchema).optional(),
  // Add responsive hints that Tailwind can use
  responsive: z.object({
    sectionBreakpoints: z.record(z.enum(["stack", "grid", "tabs"])).optional(),
    fieldArrangement: z.enum(["natural", "importance", "groupRelated"]).optional()
  }).optional()
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
 * Form state schema for tracking form submission state
 */
export const FormStateSchema = z.object({
  status: z.enum(["idle", "submitting", "success", "error"]),
  errors: z.record(z.array(z.string())).optional(),
  message: z.string().optional()
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
  
  // Processing metadata - not structural
  meta: FormMetaSchema.optional(),
  
  // Form submission state
  state: FormStateSchema.optional()
});

// Type exports
export type FormMatter = z.infer<typeof FormMatterSchema>;
export type FormMode = z.infer<typeof FormModeSchema>;
export type FormContent = z.infer<typeof FormContentSchema>;
export type FormOption = z.infer<typeof FormOptionSchema>;
export type FormHandler = z.infer<typeof FormHandlerSchema>;
export type FormAction = z.infer<typeof FormActionSchema>;
export type FormField = z.infer<typeof FormFieldSchema>;
export type FormSection = z.infer<typeof FormSectionSchema>;
export type FormLayout = z.infer<typeof FormLayoutSchema>;
export type FormState = z.infer<typeof FormStateSchema>;
export type FormMeta = z.infer<typeof FormMetaSchema>;
export type FormShape = z.infer<typeof FormShapeSchema>;
export type ValidationResult = z.infer<typeof ValidationSchema>;