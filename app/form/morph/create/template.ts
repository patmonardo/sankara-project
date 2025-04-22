import { createMorph } from "../../morph";
import { FormShape, FormField } from "../../schema/form";
import { CreateFormContext, CreateFormTemplate, isCreateFormContext } from "./types";

/**
 * Apply template values to a form
 */
export const ApplyTemplateMorph = createMorph<FormShape, FormShape>(
  "ApplyTemplateMorph",
  (shape, context) => {
    // Validate context has template data
    if (!isCreateFormContext(context) || !context.data.templateData) {
      return shape;
    }

    const templateData = context.data.templateData;
    const options = context.data.templateOptions || {};
    const mergeStrategy = context.data.templateOptions?.mergeStrategy ?? 'override';
    // Apply template to fields
    const fields = shape.fields.map(field => 
      processFieldWithTemplate(field, templateData, mergeStrategy)
    );

    // Update form title if template has a name and titlePrefix is set
    let title = shape.title || shape.name;
    if (templateData.name && options.titlePrefix) {
      title = `${options.titlePrefix} ${templateData.name}`;
    }

    // Return updated shape
    return {
      ...shape,
      fields,
      title,
      meta: {
        ...(shape.meta || {}),
        template: {
          id: templateData.id,
          name: templateData.name,
          description: templateData.description,
          appliedAt: new Date().toISOString(),
          valueCount: Object.keys(templateData.values || {}).length
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

function processFieldWithTemplate(
  field: FormField,
  templateData: CreateFormTemplate,
  mergeStrategy: 'preserve-existing' | 'smart-merge' | 'override'
): FormField {
  if (!templateData || !field.id || field.meta?.excludeTemplate) {
    return field;
  }

  const values = templateData.values || {};
  const hasTemplateValue = field.id in values;
  const templateValue = values[field.id];

  let finalDefaultValue = field.defaultValue;
  if (hasTemplateValue) {
    if (mergeStrategy === 'preserve-existing' && field.defaultValue !== undefined) {
      finalDefaultValue = field.defaultValue;
    } else if (mergeStrategy === 'smart-merge' &&
               typeof templateValue === 'object' &&
               typeof field.defaultValue === 'object') {
      finalDefaultValue = {
        ...(field.defaultValue || {}),
        ...(templateValue || {})
      };
    } else {
      finalDefaultValue = templateValue;
    }
  }

  // Use default readOnly logic
  const defaultTemplateReadOnlyFields: string[] = [];
  const isTemplateReadOnly = defaultTemplateReadOnlyFields.includes(field.id) ||
                             field.meta?.templateReadOnly;

  return {
    ...field,
    defaultValue: finalDefaultValue,
    readOnly: field.readOnly || (isTemplateReadOnly && hasTemplateValue) || false,
    meta: {
      ...(field.meta || {}),
      template: {
        valueProvided: hasTemplateValue,
        source: templateData.id,
        originalDefault: false ? field.defaultValue : undefined // adjust as needed
      }
    }
  };
}

/**
 * Helper function to attach a template to an existing CreateFormContext.
 * Renamed the parameter to templateData to avoid confusion.
 */
export function withTemplate(
  baseContext: Partial<CreateFormContext> = {},
  templateData: CreateFormTemplate
): CreateFormContext {
  return {
    ...baseContext,
    id: baseContext.id || `create-form-${Date.now()}`,
    timestamp: baseContext.timestamp || Date.now(),
    operation: "create",
    data: {
      ...baseContext.data,
      templateData
    }
  };
}

/**
 * Helper function to apply a template using the standard pipeline.
 * This creates a new context with the provided templateData and then applies the ApplyTemplateMorph.
 */
export function applyTemplate(
  shape: FormShape,
  templateData: CreateFormTemplate,
  options: Partial<CreateFormContext> = {}
): FormShape {
  const context = withTemplate(options, templateData);
  return ApplyTemplateMorph.transform(shape, context);
}