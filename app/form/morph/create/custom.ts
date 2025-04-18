import { SimpleMorph, createPipeline } from "../morph";
import { FormShape, FormField } from "../../schema/form";
import { FormExecutionContext } from "../../schema/context";
import { CreateContext } from "../mode";
import { CreateModePipeline, CreateOutput } from "./pipeline";

/**
 * Extended form field with custom component and props support
 */
interface CustomFormField extends FormField {
  /** Custom component to use for rendering this field */
  component?: string;
  /** Props to pass to the custom component */
  props?: Record<string, any>;
  /** Any additional custom properties */
  [key: string]: any;
}

/**
 * Custom creation configuration for overriding form shape properties.
 */
export interface CustomCreateConfig {
  title?: string;
  submitLabel?: string;
  cancelLabel?: string;
  clearOnSubmit?: boolean;
  buttonPosition?: "top" | "bottom" | "both";
  showCancel?: boolean;
  /** Field-specific overrides (label, type, required, readOnly, etc.) */
  fieldConfigs?: Record<string, Partial<FormField>>;
  /** Additional metadata to merge into the form shape's meta */
  metadata?: Record<string, any>;
}

/**
 * Extended context with custom component and transformation support
 */
interface CustomCreateContext extends CreateContext {
  /** Map of component types to component names */
  customComponents?: Record<string, string>;

  /**
   * Transformers for converting standard fields to custom component fields
   * Each transformer takes a CustomFormField and returns an enhanced version
   */
  customFieldTransformers?: Record<
    string,
    (field: CustomFormField) => CustomFormField
  >;

  /** Custom configuration for form shape customization */
  customConfig: CustomCreateConfig;
}

/**
 * Type guard to check if a context has custom configuration.
 */
function isCustomContext(
  context: FormExecutionContext | any // Allow 'any' for flexibility in guards
): context is CustomCreateContext {
  // 1. Basic context checks
  if (!context || typeof context !== "object") {
    return false;
  }
  // 2. Check for create mode mode
  if (context.mode !== "create") {
    return false;
  }
  // 3. Check for customConfig property and its type
  if (
    !("customConfig" in context) ||
    typeof context.customConfig !== "object" ||
    context.customConfig === null
  ) {
    return false;
  }
  // 4. Optional: Add checks for specific properties within customConfig if needed
  //    (e.g., typeof context.customConfig.fieldConfigs === 'object')

  return true; // All checks passed
}

/**
 * Applies field-level customizations from CustomCreateContext to a FormShape.
 */
export const CustomizeFieldRenderMorph = new SimpleMorph<FormShape, FormShape>(
  "CustomizeFieldRenderMorph",
  (shape, context: FormExecutionContext) => {
    // Validate input shape
    if (!shape || !Array.isArray(shape.fields)) {
      throw new Error("Invalid form shape provided to CustomizeFieldRenderMorph");
    }

    // Validate and extract custom context
    if (!isCustomContext(context)) {
      // If context isn't custom, just return the original shape
      console.warn(
        "CustomizeFieldRenderMorph called without valid CustomCreateContext. Skipping customization."
      );
      return shape;
      // Or: throw new Error("Custom configuration context is required for CustomizeFieldRenderMorph");
    }

    const config = context.customConfig;
    // Ensure fieldConfigs exists to avoid undefined access
    const fieldConfigs = config.fieldConfigs || {};

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
        defaultValue: fieldConfig.defaultValue ?? field.defaultValue, // Allow overriding default value
        validation: fieldConfig.validation ?? field.validation, // Allow overriding validation
        meta: {
          ...(field.meta || {}), // Keep existing field meta
          ...(fieldConfig.meta || {}), // Merge field config meta
          customized: true,
          originalValues,
          customizedAt: new Date().toISOString(), // Timestamp of customization
        },
      };
    });

    // Return customized shape with merged top-level metadata
    return {
      ...shape,
      // Allow config to override shape's title
      title: config.title ?? shape.title,
      fields,
      meta: {
        ...(shape.meta || {}), // Keep existing shape meta
        ...(config.metadata || {}), // Merge config metadata
        customized: true,
        customConfigApplied: {
          // Add details about the applied config
          titleProvided: !!config.title,
          metadataKeys: Object.keys(config.metadata || {}),
          fieldConfigKeys: Object.keys(fieldConfigs),
        },
        customizedAt: new Date().toISOString(), // Timestamp of customization
      },
    };
  },
  {
    // Updated metadata: Not pure or memoizable due to Date()
    pure: false,
    fusible: true, // Can potentially fuse with upstream shape loading/creation
    cost: 3, // Slightly higher cost due to mapping and merging
    memoizable: false,
  }
);

/**
 * Morph that transforms standard fields into custom component fields
 * based on the customFieldTransformers in the context.
 */
export const CustomFieldRenderMorph = new SimpleMorph<
  FormShape,
  FormShape
>(
  "CustomFieldRenderMorph",
  (shape, context) => {
    // Skip if context doesn't have custom transformers
    if (!isCustomContext(context) || !context.customFieldTransformers) {
      return shape;
    }

    const transformers = context.customFieldTransformers;

    // Apply transformers to fields based on type or meta.customType
    const transformedFields = shape.fields.map((field) => {
      // Skip if field isn't valid
      if (!field || !field.id) return field;

      // Try to find the appropriate transformer
      let transformer = null;

      // First check meta.customType if available
      if (field.meta?.customType && transformers[field.meta.customType]) {
        transformer = transformers[field.meta.customType];
      }
      // Fall back to field.type for standard custom types (like 'richtext')
      else if (transformers[field.type]) {
        transformer = transformers[field.type];
      }

      // Apply transformer if found
      if (transformer && typeof transformer === "function") {
        try {
          // Cast field to CustomFormField to satisfy transformer's input type
          return transformer(field as CustomFormField);
        } catch (error) {
          console.error(
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
        appliedTransformers: Object.keys(transformers).filter((key) =>
          shape.fields.some((f) => f.meta?.customType === key || f.type === key)
        ),
      },
    };
  },
  {
    pure: true, // This morph should be pure as it doesn't use external state
    fusible: true,
    cost: 2,
    memoizable: true,
  }
);

/**
 * Standard field transformers for common custom field types
 */
export const standardFieldTransformers = {
  signature: (field: CustomFormField): CustomFormField => ({
    ...field,
    component: "SignaturePad",
    props: {
      ...(field.meta?.customProps || {}),
      onChange: `{{handlers.onChange}}`,
      initialValue: field.value || null,
    },
  }),

  richtext: (field: CustomFormField): CustomFormField => ({
    ...field,
    component: "RichTextEditor",
    props: {
      toolbar: field.meta?.toolbar || ["bold", "italic"],
      initialHtml: field.meta?.initialHtml || "",
      onChange: `{{handlers.onChange}}`,
    },
  }),
};

/**
 * Creates a CustomCreateContext from a base context and config.
 * Ensures the context has the correct mode for create mode.
 */
export function withCustomConfig(
  baseContext: Omit<FormExecutionContext, "mode">,
  config: CustomCreateConfig
): CustomCreateContext {
  // Validate and normalize config
  if (!config || typeof config !== "object") {
    throw new Error("Invalid custom configuration provided");
  }

  // Create a normalized safe config with defaults
  const safeConfig: CustomCreateConfig = {
    // Apply defaults for optional properties
    title: config.title || undefined,
    submitLabel: config.submitLabel || undefined,
    cancelLabel: config.cancelLabel || undefined,
    clearOnSubmit: config.clearOnSubmit ?? false,
    buttonPosition: config.buttonPosition || "bottom",
    showCancel: config.showCancel ?? true,
    // Ensure field configs is a valid object
    fieldConfigs: config.fieldConfigs || {},
    // Ensure metadata is a valid object
    metadata: config.metadata || {},
  };

  // Construct the CustomCreateContext
  const customContext: CustomCreateContext = {
    ...baseContext,
    mode: "create",
    customConfig: safeConfig,
    // Add standard transformers by default, but allow overriding
    customFieldTransformers: {
      ...standardFieldTransformers,
      ...((baseContext as any).customFieldTransformers || {}),
    },
  };

  return customContext;
}

// --- Custom Creation Pipeline ---

/**
 * Pipeline for creating a form with custom configurations applied.
 * Applies customizations then runs the standard create pipeline.
 */
export const CustomCreatePipeline = createPipeline<FormShape>(
  "CustomCreatePipeline"
)
  // 1. Apply custom field/meta overrides to FormShape
  .pipe(CustomizeFieldRenderMorph) // Input: FormShape, Output: FormShape

  // NEW STEP: Transform fields to use custom components
  .pipe(CustomFieldRenderMorph) // Input: FormShape, Output: FormShape with transformed fields

  // 2. Run the standard CreateModePipeline on the customized FormShape
  .pipe(CreateModePipeline) // Input: FormShape, Output: CreateOutput

  // 3. Optional: Add post-processing specific to custom creation if needed
  .map((result: CreateOutput, context: FormExecutionContext) => {
    // Return the result with any custom additions you want
    return {
      ...result,
      meta: {
        ...(result.meta || {}),
        customCreationComplete: true,
        // Add any additional metadata specific to the custom process
        customButtons: isCustomContext(context)
          ? {
              position: context.customConfig.buttonPosition || "bottom",
              showCancel: context.customConfig.showCancel ?? true,
              submitLabel: context.customConfig.submitLabel,
              cancelLabel: context.customConfig.cancelLabel,
            }
          : undefined,
      },
    };
  })
  .build({
    description:
      "Applies custom configurations to a form shape and prepares it for UI rendering in create mode.",
    category: "form-mode-custom",
    tags: ["form", "create", "custom", "pipeline"],
    inputType: "FormShape", // Overall input
    outputType: "CreateOutput", // Overall output
  });

// --- Helper Function ---

/**
 * Convenience function for applying custom configuration and creating the form output.
 */
export function applyCustom(
  shape: FormShape,
  customConfig: CustomCreateConfig,
  // Allow providing partial context (excluding mode, which we set)
  baseContext: CreateContext
): CreateOutput {
  // Validate inputs
  if (!shape) {
    throw new Error("Form shape is required for applyCustom");
  }
  if (!customConfig) {
    throw new Error("Custom configuration is required for applyCustom");
  }

  try {
    // Create the specific context needed for the pipeline
    const customContext = withCustomConfig(baseContext, customConfig);
    // Apply the dedicated custom pipeline
    return CustomCreatePipeline.apply(shape, customContext);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Consider how to handle errors - rethrow or return an error state?
    // Rethrowing is often cleaner for pipeline failures.
    throw new Error(`Failed to apply custom configuration: ${errorMessage}`);
    // Or return an CreateOutput with error meta:
    /* return {
        ...shape, // Problem: shape is not CreateOutput
        mode: 'create', isNew: true, valid: false, complete: false, fields: [], // Dummy fields
        meta: { ...(shape.meta || {}), error: { message: errorMessage, timestamp: new Date().toISOString() } }
    } as CreateOutput; */
  }
}
