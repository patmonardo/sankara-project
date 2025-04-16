import { FormExecutionContext } from "../../schema/context";
import { SimpleMorph, createPipeline } from "../morph";
import { FormShape, FormField } from "../../schema/form";
// Adjust context import path if needed
import { CreateContext, isCreateContext } from "../mode";
// Import the standard pipeline and its output type
import { CreateModePipeline, CreateOutput } from "./pipeline";

/**
 * Template data for form creation
 */
export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  values: Record<string, any>;
  meta?: Record<string, any>;
}

/**
 * Enhanced context with template information
 */
export interface TemplateCreateContext extends CreateContext {
  template: FormTemplate;
}

/**
 * Type guard to verify if context has template data
 */
export function isTemplateContext(context: FormExecutionContext): context is TemplateCreateContext {
  // 1. Basic context checks
  if (!context || context.prakāra !== 'sṛṣṭi') {
    return false;
  }

  // 2. Check for the 'template' property and its basic type
  if (
    !('template' in context) ||
    typeof context.template !== 'object' ||
    context.template === null
  ) {
    return false;
  }

  // 3. Now that we know context.template is a non-null object,
  //    we can safely check its nested properties.
  //    TypeScript can infer context.template is likely FormTemplate here,
  //    but explicit checks are safer for a type guard.
  const template = context.template as Partial<FormTemplate>; // Cast for checking
  if (
    typeof template.id !== 'string' ||
    typeof template.values !== 'object' ||
    template.values === null // Also check values is not null
  ) {
    return false;
  }

  // If all checks pass, it's a valid TemplateCreateContext
  return true;
}

/**
 * Process a field using a template's values
 */
function processFieldWithTemplate(field: FormField, template: FormTemplate): FormField {
  // Don't modify fields that shouldn't use templates
  if (field.meta?.excludeTemplate) {
    return field;
  }

  // Get the template value for this field, if any
  const hasTemplateValue = field.id in template.values;
  const templateValue = template.values[field.id];

  return {
    ...field,
    // Use template value as default if available
    // This will be picked up by PrepareCreateMorph
    defaultValue: hasTemplateValue ? templateValue : field.defaultValue,
    // Mark if this field can be edited from template value
    readOnly: field.readOnly || (field.meta?.templateReadOnly && hasTemplateValue) || false,
    meta: {
      ...field.meta,
      template: {
        valueProvided: hasTemplateValue,
        source: template.id,
        originalDefault: field.defaultValue // Keep track of original default
      }
    }
  };
}

/**
 * Apply template values to a form shape's defaultValue properties.
 * This prepares the shape for the standard CreateModePipeline.
 */
export const ApplyTemplateMorph = new SimpleMorph<FormShape, FormShape>(
  "ApplyTemplateMorph",
  (shape, context: FormExecutionContext) => {
    // Validate and extract template context
    if (!isTemplateContext(context)) {
      // Maybe just return shape unmodified if context is wrong? Or log warning?
      console.warn("ApplyTemplateMorph called without valid TemplateCreateContext. Skipping.");
      return shape;
      // throw new Error("Template context is required for ApplyTemplateMorph");
    }

    const template = context.template;

    // Apply template values to fields
    const fields = shape.fields.map(field =>
      processFieldWithTemplate(field, template)
    );

    // Add template info to the shape's meta
    return {
      ...shape,
      fields,
      meta: {
        ...shape.meta,
        templateApplied: { // Use a distinct key
          id: template.id,
          name: template.name,
          description: template.description,
          appliedAt: new Date().toISOString(),
          valueCount: Object.keys(template.values).length
        }
      }
    };
  },
  {
    pure: false, // Not pure due to timestamp
    fusible: true, // Can fuse with upstream shape loading
    cost: 2,
    memoizable: false // Timestamp makes it non-memoizable
  }
);


// --- Template Creation Pipeline ---

/**
 * Pipeline for creating a form from a template.
 * Applies template values then runs the standard create pipeline.
 */
export const TemplateCreatePipeline = createPipeline<FormShape>("TemplateCreatePipeline")
  // 1. Apply template values to FormShape (modifies defaultValues)
  .pipe(ApplyTemplateMorph) // Input: FormShape, Output: FormShape
  // 2. Run the standard CreateModePipeline on the modified FormShape
  .pipe(CreateModePipeline) // Input: FormShape, Output: CreateOutput
  // 3. Optional: Add post-processing specific to template creation if needed
  .map((result: CreateOutput, context: FormExecutionContext) => {
      if (!isTemplateContext(context)) {
        // Should not happen if ApplyTemplateMorph ran correctly, but good check
        return result;
      }
      const template = context.template;
      const templateName = template.name;
      const formTitle = result.meta?.title || 'Form';
      // Ensure baseTitle calculation is safe
      const baseTitle = typeof formTitle === 'string' ? formTitle.replace(/^New /, '') : 'Item';

      return {
        ...result,
        meta: {
          ...result.meta,
          // Overwrite or add template info from ApplyTemplateMorph if desired
          templateInfo: { // Use a different key to avoid conflicts?
            id: template.id,
            name: templateName,
            description: template.description,
          },
          title: context.title || `New ${baseTitle} from ${templateName}`,
          templateCreation: true // Flag indicating creation from template
        }
      };
    }
  )
  .build({
    description: "Creates a form instance from a template, applying values and preparing for UI.",
    category: "form-mode-template",
    tags: ["form", "create", "template", "pipeline"],
    inputType: "FormShape", // Overall input
    outputType: "CreateOutput" // Overall output
  });


// --- Helper Functions ---

/**
 * Creates a template context from a standard context
 */
export function withTemplate(
  baseContext: CreateContext,
  template: FormTemplate
): TemplateCreateContext {
  // Ensure baseContext has the correct prakāra if needed
  const contextWithType: CreateContext = { ...baseContext, prakāra: 'sṛṣṭi' };
  return {
    ...contextWithType,
    template
  };
}

/**
 * Apply a template to a shape and return the filled form
 * Convenience function for direct template application using the new pipeline
 */
export function applyTemplate(
  shape: FormShape,
  template: FormTemplate,
  context: CreateContext
): CreateOutput {
  // Create the full TemplateCreateContext
  const templateContext = withTemplate({ ...context, prakāra: 'sṛṣṭi' }, template);
  // Apply the dedicated template pipeline
  return TemplateCreatePipeline.apply(shape, templateContext);
}
