import { SimpleMorph } from "../morph";
import { FormShape, FormField } from "../../schema/form";
import { ViewOutput } from "../view/display";

/**
 * Edit output shape
 */
export interface EditOutput extends ViewOutput {
  mode: 'edit';
  submitButton: {
    label: string;
    position: 'bottom' | 'top' | 'both';
  };
  cancelButton?: {
    label: string;
    position: 'bottom' | 'top' | 'both';
  };
  validation?: {
    mode: 'onSubmit' | 'onChange' | 'onBlur';
    showAllErrors: boolean;
  };
}

/**
 * ShapeToEditMorph - Transform a form shape into edit mode
 */
export const ShapeToEditMorph = new SimpleMorph<FormShape, EditOutput>(
  "ShapeToEditMorph",
  (shape, context) => {
    // Transform fields to editable versions
    const fields = shape.fields.map(field => ({
      id: field.id,
      label: field.label || field.id,
      value: context.data?.[field.id] ?? field.defaultValue ?? field.value,
      type: field.type,
      required: field.required || false,
      readOnly: field.readOnly || false,
      disabled: field.disabled || false,
      placeholder: field.placeholder || '',
      help: field.help,
      validation: field.validation,
      options: field.options,
      format: field.format,
      meta: field.meta,
      visible: field.visible !== false,
    }));

    // Determine button labels from context or defaults
    const submitLabel = context.submitLabel || 'Save';
    const cancelLabel = context.cancelLabel || 'Cancel';

    return {
      id: shape.id,
      fields,
      mode: 'edit',
      meta: {
        ...shape.meta,
        title: shape.meta?.title || 'Edit',
      },
      submitButton: {
        label: submitLabel,
        position: 'bottom'
      },
      cancelButton: context.showCancel !== false ? {
        label: cancelLabel,
        position: 'bottom'
      } : undefined,
      validation: {
        mode: context.validationMode || 'onSubmit',
        showAllErrors: context.showAllErrors || false,
      },
      format: context.format || 'jsx'
    };
  },
  // Optimization metadata
  {
    pure: true,
    fusible: false,
    cost: 2 
  }
);

// For backward compatibility, maintain the old name as an alias
export const FormToEditMorph = ShapeToEditMorph;

/**
 * Create a custom edit form morph with specific configurations
 */
export function createEditMorph(config: {
  title?: string;
  submitLabel?: string;
  cancelLabel?: string;
  fieldConfigs?: Record<string, Partial<FormField>>;
}) {
  return new SimpleMorph<FormShape, EditOutput>(
    `CustomEdit_${config.title || 'Form'}`,
    (shape, context) => {
      // Transform fields with custom configurations
      const fields = shape.fields.map(field => {
        const fieldConfig = config.fieldConfigs?.[field.id] || {};
        
        return {
          id: field.id,
          label: fieldConfig.label || field.label || field.id,
          value: context.data?.[field.id] ?? field.defaultValue ?? field.value,
          type: fieldConfig.type || field.type,
          required: fieldConfig.required ?? field.required ?? false,
          readOnly: fieldConfig.readOnly ?? field.readOnly ?? false,
          disabled: fieldConfig.disabled ?? field.disabled ?? false,
          placeholder: fieldConfig.placeholder || field.placeholder || '',
          help: fieldConfig.help || field.help,
          validation: fieldConfig.validation || field.validation,
          options: fieldConfig.options || field.options,
          format: fieldConfig.format || field.format,
          meta: { ...field.meta, ...fieldConfig.meta },
          visible: fieldConfig.visible ?? field.visible ?? true,
        };
      });

      return {
        id: shape.id,
        fields,
        mode: 'edit',
        meta: {
          ...shape.meta,
          title: config.title || shape.meta?.title || 'Edit',
        },
        submitButton: {
          label: config.submitLabel || context.submitLabel || 'Save',
          position: 'bottom'
        },
        cancelButton: context.showCancel !== false ? {
          label: config.cancelLabel || context.cancelLabel || 'Cancel',
          position: 'bottom'
        } : undefined,
        validation: {
          mode: context.validationMode || 'onSubmit',
          showAllErrors: context.showAllErrors || false,
        },
        format: context.format || 'jsx'
      };
    },
    {
      pure: true,
      fusible: false,
      cost: 2.5
    }
  );
}