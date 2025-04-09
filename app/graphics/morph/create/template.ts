import { SimpleMorph, ComposedMorph } from "../morph";
import { FormShape, FormField } from "../../schema/form";
import { MorpheusContext, CreateContext } from "../../schema/context";
import { CreateOutput, ShapeCreateMorph } from "./display";

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
function isTemplateContext(context: MorpheusContext): context is TemplateCreateContext {
  return (
    context.type === 'create' && 
    'template' in context && 
    context.template !== undefined && 
    typeof context.template === 'object'
  );
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
    defaultValue: hasTemplateValue ? templateValue : field.defaultValue,
    // Mark if this field can be edited from template value
    readOnly: field.readOnly || (field.meta?.templateReadOnly && hasTemplateValue) || false,
    meta: {
      ...field.meta,
      template: {
        valueProvided: hasTemplateValue,
        source: template.id,
        originalDefault: field.defaultValue
      }
    }
  };
}

/**
 * Apply template values to a form shape
 */
export const ApplyTemplateMorph = new SimpleMorph<FormShape, FormShape>(
  "ApplyTemplateMorph",
  (shape, context: MorpheusContext) => {
    // Validate and extract template context
    if (!isTemplateContext(context)) {
      throw new Error("Template context is required for ApplyTemplateMorph");
    }
    
    const template = context.template;
    
    // Apply template values to fields
    const fields = shape.fields.map(field => 
      processFieldWithTemplate(field, template)
    );
    
    return {
      ...shape,
      fields,
      meta: {
        ...shape.meta,
        template: {
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
    pure: true,
    fusible: true,
    cost: 2,
    memoizable: true
  }
);

/**
 * Create form from template through composition of morphisms
 */
export const TemplateShapeMorph = new ComposedMorph<FormShape, CreateOutput>(
  "TemplateShapeMorph",
  [
    // First apply the template to the form shape
    ApplyTemplateMorph,
    
    // Then create the form with template-enhanced values
    ShapeCreateMorph
  ],
  // Post-processing function to add template-specific metadata
  (result: CreateOutput, context: MorpheusContext) => {
    // Validate template context
    if (!isTemplateContext(context)) {
      console.warn("Template context missing for TemplateShapeMorph post-processing");
      return result;
    }
    
    const template = context.template;
    
    // Update metadata with template information
    const templateName = template.name;
    const formTitle = result.meta?.title || 'Form';
    const baseTitle = formTitle.replace(/^New /, ''); // Remove "New" prefix if present
    
    return {
      ...result,
      meta: {
        ...result.meta,
        template: {
          id: template.id,
          name: templateName,
          description: template.description,
          valueCount: Object.keys(template.values).length
        },
        title: context.title || `New ${baseTitle} from ${templateName}`,
        templateCreation: true
      }
    };
  },
  {
    pure: true,
    fusible: false,
    cost: 5,
    memoizable: false
  }
);

/**
 * Creates a template context from a standard context
 * This is a helper to make it easier to use template morphisms
 */
export function withTemplate(
  baseContext: CreateContext, 
  template: FormTemplate
): TemplateCreateContext {
  return {
    ...baseContext,
    template
  };
}

/**
 * Apply a template to a form and return the filled form
 * Convenience function for direct template application
 */
export function applyTemplate(
  form: FormShape,
  template: FormTemplate,
  context: CreateContext = { type: 'create' }
): CreateOutput {
  const templateContext = withTemplate(context, template);
  return TemplateShapeMorph.apply(form, templateContext);
}