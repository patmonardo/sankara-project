import { FormShape, FormField } from "../../schema/form";
import { createMorph } from "../../morph/core";
import {
  CreateFormField,
  CreateFormShape,
  CreateFormContext,
  isCreateFormContext,
} from "./types";
import { CreateFormPipeline } from "./pipeline";

/**
 * Default field transformers for common custom field types
 */
export const defaultFieldTransformers = {
  signature: (field: CreateFormField): CreateFormField => ({
    ...field,
    component: "SignaturePad",
    props: {
      ...(field.meta?.customProps || {}),
      onChange: `{{handlers.onChange}}`,
      initialValue: field.value || null,
    },
  }),

  richtext: (field: CreateFormField): CreateFormField => ({
    ...field,
    component: "RichTextEditor",
    props: {
      toolbar: field.meta?.toolbar || ["bold", "italic"],
      initialHtml: field.meta?.initialHtml || "",
      onChange: `{{handlers.onChange}}`,
    },
  }),

  // Add more default transformers as needed
  datepicker: (field: CreateFormField): CreateFormField => ({
    ...field,
    component: "DatePicker",
    props: {
      format: field.meta?.dateFormat || "yyyy-MM-dd",
      showTimeSelect: field.meta?.showTimeSelect || false,
      onChange: `{{handlers.onChange}}`,
      value: field.value,
    },
  }),

  autocomplete: (field: CreateFormField): CreateFormField => ({
    ...field,
    component: "Autocomplete",
    props: {
      options: field.options || [],
      searchable: true,
      clearable: !field.required,
      onChange: `{{handlers.onChange}}`,
      value: field.value,
    },
  }),
};

/**
 * Apply all customizations in one go (configs and components)
 */
export const CustomizeFieldsMorph = createMorph<FormShape, FormShape>(
  "CustomizeFieldsMorph",
  (shape, context) => {
    if (!isCreateFormContext(context) || !context.data.customization) {
      return shape;
    }

    // Apply configuration first
    const configuredShape = CustomizeFieldsConfigsMorph.transform(
      shape,
      context
    );

    // Then apply components
    const customizedShape = CustomizeComponentsMorph.transform(
      configuredShape,
      context
    );

    // Apply custom metadata if present
    if (context.data.customization.metadata) {
      return {
        ...customizedShape,
        meta: {
          ...(customizedShape.meta || {}),
          ...context.data.customization.metadata,
        },
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
 * Apply field configurations (label, type, etc.) from context.data.customization.fieldConfigs
 */
export const CustomizeFieldsConfigsMorph = createMorph<FormShape, FormShape>(
  "CustomizeFieldConfigsMorph",
  (shape, context) => {
    if (!isCreateFormContext(context) || !context.data.customization?.fieldConfigs) {
      return shape;
    }

    const fieldConfigs = context.data.customization.fieldConfigs;

    // Apply customizations to fields
    const fields = shape.fields.map((field) => {
      // Skip if field is null/undefined or has no ID
      if (!field || !field.id) return field;

      // Safe access to field config
      const fieldConfig =
        field.id in fieldConfigs ? fieldConfigs[field.id] : null;
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
    if (
      !isCreateFormContext(context) ||
      !context.data.customization?.fieldTransformers
    ) {
      return shape;
    }

    // Combine default and custom field transformers
    const allTransformers = {
      ...defaultFieldTransformers,
      ...context.data.customization.fieldTransformers,
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
          return transformer(field as CreateFormField);
        } catch (error) {
          console.warn(
            `Error applying transformer to field ${field.id}:`,
            error
          );
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
      },
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 2,
    memoizable: true,
  }
);
/**
 * Helper to convert simple component mappings into field transformer functions.
 */
function convertComponentsToTransformers(components: Record<string, string>): Record<string, (field: CreateFormField) => CreateFormField> {
  const transformers: Record<string, (field: CreateFormField) => CreateFormField> = {};
  Object.entries(components).forEach(([type, componentName]) => {
    transformers[type] = (field: CreateFormField) => ({
      ...field,
      component: componentName,
      props: {
        ...(field.props || {}),
        onChange: `{{handlers.onChange}}`,
        value: field.value,
      },
    });
  });
  return transformers;
}

/**
 * Merges custom options into an existing CreateFormContext.
 * The custom options are stored under data.customization rather than as a separate context.
 *
 * @param baseContext - The original partial CreateFormContext.
 * @param customOptions - Customization options including fieldConfigs, components, transformers, metadata, and UI settings.
 * @returns A complete CreateFormContext with customizations merged into data.customization.
 */
export function createCustomContext(
  baseContext: Partial<CreateFormContext> = {},
  customOptions: {
    fieldConfigs?: Record<string, Partial<FormField>>;
    components?: Record<string, string>;
    fieldTransformers?: Record<string, (field: CreateFormField) => CreateFormField>;
    metadata?: Record<string, any>;
    title?: string;
    submitLabel?: string;
    cancelLabel?: string;
    buttonPosition?: "top" | "bottom" | "both";
    showCancel?: boolean;
    showReset?: boolean;
  } = {}
): CreateFormContext {
  // Build a merged version of field transformers,
  // converting any simple component mappings as well.
  const mergedTransformers: Record<string, (field: CreateFormField) => CreateFormField> = {
    ...(baseContext.data?.customization?.fieldTransformers || {}),
    ...(customOptions.fieldTransformers || {}),
    ...(customOptions.components ? convertComponentsToTransformers(customOptions.components) : {}),
  };

  return {
    ...baseContext,
    id: baseContext.id || "custom-create-form-context",
    timestamp: baseContext.timestamp || Date.now(),
    operation: "create",
    // Merge the UI configuration options into data.
    data: {
      ...baseContext.data,
      submitLabel: customOptions.submitLabel || baseContext.data?.submitLabel,
      cancelLabel: customOptions.cancelLabel || baseContext.data?.cancelLabel,
      buttonPosition: customOptions.buttonPosition || baseContext.data?.buttonPosition || "bottom",
      showCancel: customOptions.showCancel ?? baseContext.data?.showCancel,
      showReset: customOptions.showReset ?? baseContext.data?.showReset,
      // Merge customization options inside data.customization
      customization: {
        ...(baseContext.data?.customization || {}),
        fieldConfigs: customOptions.fieldConfigs || baseContext.data?.customization?.fieldConfigs || {},
        fieldTransformers: mergedTransformers,
        metadata: {
          ...((baseContext.data?.customization && baseContext.data.customization.metadata) || {}),
          ...(customOptions.metadata || {}),
          title: customOptions.title,
        },
      },
    },
  };
}

export function customizeForm(
  shape: FormShape,
  customOptions: {
    fieldConfigs?: Record<string, Partial<FormField>>;
    components?: Record<string, string>;
    fieldTransformers?: Record<
      string,
      (field: CreateFormField) => CreateFormField
    >;
    metadata?: Record<string, any>;
    title?: string;
    submitLabel?: string;
    cancelLabel?: string;
    buttonPosition?: "top" | "bottom" | "both";
    showCancel?: boolean;
    showReset?: boolean;
  },
  baseContext: Partial<CreateFormContext> = {}
): CreateFormShape {
  // Create the customized context
  const context = createCustomContext(baseContext, customOptions);

  // Use the core CreateFormMorph (or an alias) to generate the form with the customized context.
  return CreateFormPipeline.run(shape, context) as CreateFormShape;
}