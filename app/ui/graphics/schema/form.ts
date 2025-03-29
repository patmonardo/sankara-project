//@/ui/graphics/schema/form.ts
import { z } from "zod";

// Define FormMatter type
export const FormMatterSchema = z.record(z.any()).optional();

// Define FormMode type
export const FormModeSchema = z.enum(["create", "edit"]).default("create");

// Define FormMode type
export const FormContentSchema = z.enum(["jsx", "html", "json", "xml"]).default("jsx");

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

// Form elements
export const FormFieldSchema = z.object({
  id: z.string(), // Link to FormMatter
  type: z.string(),
  label: z.string(),
  required: z.boolean(),
  defaultValue: z.string().optional(),
  options: z.array(FormOptionSchema).optional(),
});

export const FormActionSchema = z.object({
  id: z.string().default("submit"),// Link to FormHandler
  type: z.enum(["submit", "reset", "button"]).readonly(),
  label: z.string(),
  variant: z.enum(["primary", "secondary", "ghost"]),
  options: z.array(FormOptionSchema).optional(),
});

// Section schema for organizing fields
export const FormSectionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(z.string()), // Field IDs
  collapsible: z.boolean().optional().default(false),
  collapsed: z.boolean().optional().default(false),
  className: z.string().optional(),
});

// Form layout
export const FormLayoutSchema = z.object({
  title: z.string(),
  columns: z.enum(["single", "double"]),
  actions: z.array(FormActionSchema),
  sections: z.array(FormSectionSchema).optional(), // Add sections
});

// Export the section type
export type FormSection = z.infer<typeof FormSectionSchema>;

// Form state
export const FormStateSchema = z.object({
  status: z.enum(["idle", "submitting", "success", "error"]),
  errors: z.record(z.array(z.string())).optional(),
  message: z.string().optional(),
});


// Form shape
export const FormShapeSchema = z.object({
  fields: z.record(FormFieldSchema),
  layout: FormLayoutSchema,
  state: FormStateSchema,
});

/**
 * FormFrame - Visual container and contextual elements surrounding a form
 * Provides supplementary information and enhances the form's presentation
 */
export const FormFrameSchema = z.object({
  main: z.union([z.string(), z.any()]).optional(),
  sidebar: z.union([z.string(), z.any()]).optional(),
  footer: z.union([z.string(), z.any()]).optional(),
  header: z.union([z.string(), z.any()]).optional(),
});

/**
 * FormRender - Complete schema for rendering a form with navigation and framing
 * Combines form schema with contextual elements for a complete UI
 */
export const FormRenderSchema = z.object({
  breadcrumbs: z.array(z.any()), // Will reference LinkSchema later
  form: FormShapeSchema,
  frame: FormFrameSchema.optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});


// Type exports
export type FormMatter = z.infer<typeof FormMatterSchema>;
export type FormMode = z.infer<typeof FormModeSchema>;
export type FormContent = z.infer<typeof FormContentSchema>;
export type FormFrame = z.infer<typeof FormFrameSchema>;
export type FormRender = z.infer<typeof FormRenderSchema>;
export type FormOptions = z.infer<typeof FormOptionSchema>;
export type FormHandler = z.infer<typeof FormHandlerSchema>;
export type FormField = z.infer<typeof FormFieldSchema>;
export type FormAction = z.infer<typeof FormActionSchema>;
export type FormLayout = z.infer<typeof FormLayoutSchema>;
export type FormState = z.infer<typeof FormStateSchema>;
export type FormShape = z.infer<typeof FormShapeSchema>;
