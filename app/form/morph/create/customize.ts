import { createMorph } from "../morph";
import { FormShape, FormField } from "../../schema/form";
import { CreateField, CreateShape, CreateContext, isCreateContext } from "./types";

/**
 * Default field transformers for common custom field types
 */
export const defaultFieldTransformers = {
  signature: (field: CreateField): CreateField => ({
    ...field,
    component: "SignaturePad",
    props: {
      ...(field.meta?.customProps || {}),
      onChange: `{{handlers.onChange}}`,
      initialValue: field.value || null,
    },
  }),

  richtext: (field: CreateField): CreateField => ({
    ...field,
    component: "RichTextEditor",
    props: {
      toolbar: field.meta?.toolbar || ["bold", "italic"],
      initialHtml: field.meta?.initialHtml || "",
      onChange: `{{handlers.onChange}}`,
    },
  }),
  
  // Add more default transformers as needed
  datepicker: (field: CreateField): CreateField => ({
    ...field,
    component: "DatePicker",
    props: {
      format: field.meta?.dateFormat || "yyyy-MM-dd",
      showTimeSelect: field.meta?.showTimeSelect || false,
      onChange: `{{handlers.onChange}}`,
      value: field.value
    }
  }),
  
  autocomplete: (field: CreateField): CreateField => ({
    ...field,
    component: "Autocomplete",
    props: {
      options: field.options || [],
      searchable: true,
      clearable: !field.required,
      onChange: `{{handlers.onChange}}`,
      value: field.value
    }
  })
};

/**
 * Apply field configurations (label, type, etc.) from context.customization.fieldConfigs
 */
export const CustomizeFieldConfigsMorph = createMorph<FormShape, FormShape>(
  "CustomizeFieldConfigsMorph",
  (shape, context) => {
    if (!isCreateContext(context) || !context.customization?.fieldConfigs) {
      return shape;
    }
    
    const fieldConfigs = context.customization.fieldConfigs;
    
    // Apply customizations to fields
    const fields = shape.fields.map((field) => {
      // Skip if field is null/undefined or has no ID
      if (!field || !field.id) return field;

      // Safe access to field config
      const fieldConfig = field.id in fieldConfigs ? fieldConfigs[field.id] : null;
      if (!fieldConfig) return field; // No specific config for this field

      // Track original values for reference
      const originalValues = {
        label: field.label,
        type: field.type,
        required: field.required,
        readOnly: field.readOnly,
        // Add others if needed
      };

      // Apply overrides using nullish coalescing
      return {
        ...field,
        label: fieldConfig.label ?? field.label,
        type: fieldConfig.type ?? field.type,
        required: fieldConfig.required ?? field.required,
        readOnly: fieldConfig.readOnly ?? field.readOnly,
        disabled: fieldConfig.disabled ?? field.disabled,
        placeholder: fieldConfig.placeholder ?? field.placeholder,
        defaultValue: fieldConfig.defaultValue ?? field.defaultValue,
        validation: fieldConfig.validation ?? field.validation,
        meta: {
          ...(field.meta || {}), // Keep existing field meta
          ...(fieldConfig.meta || {}), // Merge field config meta
          customized: true,
          originalValues,
          customizedAt: new Date().toISOString(),
        },
      };
    });

    // Return customized shape
    return {
      ...shape,
      fields,
      meta: {
        ...(shape.meta || {}),
        customized: true,
        customConfigApplied: true,
        customizedAt: new Date().toISOString(),
      },
    };
  },
  {
    pure: false, // Not pure due to Date()
    fusible: true,
    cost: 2,
  }
);

/**
 * Apply custom components to fields based on field type or meta.customType
 */
export const CustomizeComponentsMorph = createMorph<FormShape, FormShape>(
  "CustomizeComponentsMorph",
  (shape, context) => {
    if (!isCreateContext(context) || !context.customization?.fieldTransformers) {
      return shape;
    }
    
    // Combine default and custom field transformers
    const allTransformers = {
      ...defaultFieldTransformers,
      ...context.customization.fieldTransformers
    };
    
    // Track which components were applied
    const appliedComponents: string[] = [];
    
    // Apply transformers to fields
    const transformedFields = shape.fields.map((field) => {
      // Skip if field isn't valid
      if (!field || !field.id) return field;

      // Try to find the appropriate transformer
      let transformer = null;

      // First check meta.customType if available
      if (field.meta?.customType && allTransformers[field.meta.customType]) {
        transformer = allTransformers[field.meta.customType];
        appliedComponents.push(field.meta.customType);
      }
      // Fall back to field.type for standard custom types
      else if (allTransformers[field.type]) {
        transformer = allTransformers[field.type];
        appliedComponents.push(field.type);
      }

      // Apply transformer if found
      if (transformer && typeof transformer === "function") {
        try {
          return transformer(field as CreateField);
        } catch (error) {
          console.warn(`Error applying transformer to field ${field.id}:`, error);
          return field; // Return original on error
        }
      }

      return field; // Return unchanged if no transformer applies
    });
    
    // Return transformed shape
    return {
      ...shape,
      fields: transformedFields,
      meta: {
        ...(shape.meta || {}),
        customComponentsApplied: true,
        appliedComponentTypes: [...new Set(appliedComponents)],
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
 * Apply all customizations in one go (configs and components)
 */
export const CustomizeFieldsMorph = createMorph<FormShape, FormShape>(
  "CustomizeFieldsMorph",
  (shape, context) => {
    if (!isCreateContext(context) || !context.customization) {
      return shape;
    }
    
    // Apply configuration first
    const configuredShape = CustomizeFieldConfigsMorph.transform(shape, context);
    
    // Then apply components
    const customizedShape = CustomizeComponentsMorph.transform(configuredShape, context);
    
    // Apply custom metadata if present
    if (context.customization.metadata) {
      return {
        ...customizedShape,
        meta: {
          ...(customizedShape.meta || {}),
          ...context.customization.metadata
        }
      };
    }
    
    return customizedShape;
  },
  {
    pure: false, // Not pure due to Date in child morphs
    fusible: true,
    cost: 4,
  }
);

/**
 * Creates a CreateContext with customization options
 */
export function createCustomContext(
  baseContext: Partial<CreateContext> = {},
  customOptions: {
    fieldConfigs?: Record<string, Partial<FormField>>;
    components?: Record<string, string>;
    fieldTransformers?: Record<string, (field: CreateField) => CreateField>;
    metadata?: Record<string, any>;
    title?: string;
    submitLabel?: string;
    cancelLabel?: string;
    buttonPosition?: 'top' | 'bottom' | 'both';
    showCancel?: boolean;
    showReset?: boolean;
  } = {}
): CreateContext {
  // Convert old-style components to fieldTransformers
  const fieldTransformers: Record<string, (field: CreateField) => CreateField> = {
    ...(customOptions.fieldTransformers || {})
  };
  
  // Add simple component mappings
  if (customOptions.components) {
    Object.entries(customOptions.components).forEach(([type, componentName]) => {
      fieldTransformers[type] = (field: CreateField) => ({
        ...field,
        component: componentName,
        props: {
          ...(field.props || {}),
          onChange: `{{handlers.onChange}}`,
          value: field.value
        }
      });
    });
  }
  
  // Create the context with customization
  return {
    ...baseContext,
    submitLabel: customOptions.submitLabel || baseContext.submitLabel,
    cancelLabel: customOptions.cancelLabel || baseContext.cancelLabel,
    buttonPosition: customOptions.buttonPosition || baseContext.buttonPosition || 'bottom',
    showCancel: customOptions.showCancel ?? baseContext.showCancel,
    showReset: customOptions.showReset ?? baseContext.showReset,
    customization: {
      fieldConfigs: customOptions.fieldConfigs || {},
      fieldTransformers,
      metadata: {
        ...(customOptions.metadata || {}),
        title: customOptions.title
      }
    }
  };
}

/**
 * Helper function to customize a form - direct replacement for applyCustom 
 */
export function customizeForm(
  shape: FormShape,
  customOptions: {
    fieldConfigs?: Record<string, Partial<FormField>>;
    components?: Record<string, string>;
    fieldTransformers?: Record<string, (field: CreateField) => CreateField>;
    metadata?: Record<string, any>;
    title?: string;
    submitLabel?: string;
    cancelLabel?: string;
    buttonPosition?: 'top' | 'bottom' | 'both';
    showCancel?: boolean;
    showReset?: boolean;
  },
  baseContext: Partial<CreateContext> = {}
): CreateShape {
  // Create the customized context
  const context = createCustomContext(baseContext, customOptions);
  
  // Import here to avoid circular dependency
  const { createForm } = require('./create');
  
  // Create the form with the customized context
  return createForm(shape, context);
}