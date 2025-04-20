import { createMorph } from "../morph";
import { FormShape, FormField } from "../../schema/form";
import { CreateContext, isCreateContext } from "./types";

/**
 * Process a field using a template's values
 */
function processFieldWithTemplate(
  field: FormField, 
  template: FormTemplate | CreateContext['template'], 
  options?: CreateContext['templateOptions']
): FormField {
  if (!template || !field.id || field.meta?.excludeTemplate) {
    return field;
  }

  const values = template.values || {};
  const hasTemplateValue = field.id in values;
  const templateValue = values[field.id];
  
  // Check if this field should be read-only when from template
  const isTemplateReadOnly = options?.templateReadOnlyFields?.includes(field.id) || 
                            field.meta?.templateReadOnly;

  // Determine final default value
  let finalDefaultValue = field.defaultValue;
  
  if (hasTemplateValue) {
    if (options?.mergeStrategy === 'preserve-existing' && field.defaultValue !== undefined) {
      // Keep existing default if strategy is to preserve
      finalDefaultValue = field.defaultValue;
    } else if (options?.mergeStrategy === 'smart-merge' && 
               typeof templateValue === 'object' && 
               typeof field.defaultValue === 'object') {
      // Smart merge objects if both values are objects
      finalDefaultValue = {
        ...(field.defaultValue || {}),
        ...(templateValue || {})
      };
    } else {
      // Default: override with template value
      finalDefaultValue = templateValue;
    }
  }

  return {
    ...field,
    defaultValue: finalDefaultValue,
    readOnly: field.readOnly || (isTemplateReadOnly && hasTemplateValue) || false,
    meta: {
      ...(field.meta || {}),
      template: {
        valueProvided: hasTemplateValue,
        source: template.id,
        originalDefault: options?.preserveOriginalDefaults ? field.defaultValue : undefined
      }
    }
  };
}

/**
 * Apply template values to a form
 */
export const ApplyTemplateMorph = createMorph<FormShape, FormShape>(
  "ApplyTemplateMorph",
  (shape, context) => {
    // Validate context has template data
    if (!isCreateContext(context) || !context.template) {
      return shape;
    }

    const template = context.template;
    const options = context.templateOptions || {};

    // Apply template to fields
    const fields = shape.fields.map(field => 
      processFieldWithTemplate(field, template, options)
    );

    // Update form title if template has a name
    let title = shape.title || shape.name;
    if (template.name && options.titlePrefix) {
      title = `${options.titlePrefix} ${template.name}`;
    }

    // Return updated shape
    return {
      ...shape,
      fields,
      title,
      meta: {
        ...(shape.meta || {}),
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          appliedAt: new Date().toISOString(),
          valueCount: Object.keys(template.values || {}).length
        }
      }
    };
  },
  {
    pure: false, // Not pure due to timestamp
    fusible: true,
    cost: 2,
    description: "Applies template values to a form's fields"
  }
);

/**
 * Helper function to create a template context
 */
export function withTemplate(
  baseContext: Partial<CreateContext> = {},
  template: FormTemplate
): CreateContext {
  return {
    ...baseContext,
    template
  };
}

/**
 * Helper function to apply a template using the standard pipeline
 */
export function applyTemplate(
  shape: FormShape,
  template: FormTemplate,
  options: Partial<CreateContext> = {}
): FormShape {
  const context = withTemplate(options, template);
  // Only apply the template morph, not the full pipeline
  return ApplyTemplateMorph.transform(shape, context);
}