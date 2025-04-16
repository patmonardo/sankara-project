import { SimpleMorph, createPipeline } from "../morph"; // Import createPipeline
import { FormShape, FormField } from "../../schema/form";
import { FormExecutionContext } from "../../schema/context";
import { CreateContext } from "../mode";
import { CreateModePipeline, CreateOutput } from "./pipeline";

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
 * Enhanced CreateContext with custom configuration.
 */
export interface CustomCreateContext extends CreateContext {
  customConfig: CustomCreateConfig;
}

/**
 * Type guard to check if a context has custom configuration.
 */
function isCustomContext(
  context: FormExecutionContext | any // Allow 'any' for flexibility in guards
): context is CustomCreateContext {
  // 1. Basic context checks
  if (!context || typeof context !== 'object') {
    return false;
  }
  // 2. Check for create mode prakāra
  if (context.prakāra !== 'sṛṣṭi') {
    return false;
  }
  // 3. Check for customConfig property and its type
  if (
    !('customConfig' in context) ||
    typeof context.customConfig !== 'object' ||
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
export const CustomizeShapeMorph = new SimpleMorph<FormShape, FormShape>(
  "CustomizeShapeMorph",
  (shape, context: FormExecutionContext) => {
    // Validate input shape
    if (!shape || !Array.isArray(shape.fields)) {
      throw new Error("Invalid form shape provided to CustomizeShapeMorph");
    }

    // Validate and extract custom context
    if (!isCustomContext(context)) {
      // If context isn't custom, just return the original shape
      console.warn("CustomizeShapeMorph called without valid CustomCreateContext. Skipping customization.");
      return shape;
      // Or: throw new Error("Custom configuration context is required for CustomizeShapeMorph");
    }

    const config = context.customConfig;
    // Ensure fieldConfigs exists to avoid undefined access
    const fieldConfigs = config.fieldConfigs || {};

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
        customConfigApplied: { // Add details about the applied config
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
 * Creates a CustomCreateContext from a base context and config.
 * Ensures the context has the correct prakāra for create mode.
 */
export function withCustomConfig(
  baseContext: Omit<FormExecutionContext, 'prakāra'>, // Allow any context base, but we force prakāra
  config: CustomCreateConfig
): CustomCreateContext {
  if (!baseContext) {
    throw new Error("Base context is required for withCustomConfig");
  }
  if (!config) {
    throw new Error("Custom configuration is required for withCustomConfig");
  }

  // Ensure config parts exist
  const safeConfig = {
    ...config,
    fieldConfigs: config.fieldConfigs || {},
    metadata: config.metadata || {},
  };

  // Construct the CustomCreateContext, forcing prakāra
  const customContext: CustomCreateContext = {
    ...baseContext, // Spread properties from base context
    prakāra: 'sṛṣṭi', // Force create mode prakāra
    customConfig: safeConfig,
    // Optionally override context properties from config if desired
    // title: safeConfig.title ?? baseContext.title, // Example
  };

  return customContext;
}


// --- Custom Creation Pipeline ---

/**
 * Pipeline for creating a form with custom configurations applied.
 * Applies customizations then runs the standard create pipeline.
 */
export const CustomCreatePipeline = createPipeline<FormShape>("CustomCreatePipeline")
  // 1. Apply custom field/meta overrides to FormShape
  .pipe(CustomizeShapeMorph) // Input: FormShape, Output: FormShape
  // 2. Run the standard CreateModePipeline on the customized FormShape
  .pipe(CreateModePipeline) // Input: FormShape, Output: CreateOutput
  // 3. Optional: Add post-processing specific to custom creation if needed
  .map((result: CreateOutput, context: FormExecutionContext) => {
      if (!isCustomContext(context)) {
        // Should not happen if CustomizeShapeMorph ran correctly, but good check
        return result;
      }
      const config = context.customConfig;

      // Apply overrides from config to the final CreateOutput meta/properties
      return {
        ...result,
        // Override button labels/behavior from config if present
        submitButton: {
            ...(result.submitButton || { label: 'Submit', position: 'bottom' }), // Default button if none exists
            label: config.submitLabel ?? result.submitButton?.label ?? 'Submit',
            position: config.buttonPosition ?? result.submitButton?.position ?? 'bottom',
        },
        // Conditionally include cancel button based on config
        cancelButton: config.showCancel !== false ? {
            ...(result.cancelButton || { label: 'Cancel', position: 'bottom' }), // Default button if none exists
            label: config.cancelLabel ?? result.cancelButton?.label ?? 'Cancel',
            position: config.buttonPosition ?? result.cancelButton?.position ?? 'bottom',
        } : undefined, // Remove cancel button if showCancel is explicitly false
        clearOnSubmit: config.clearOnSubmit ?? result.clearOnSubmit,
        meta: {
          ...result.meta,
          // Add final confirmation that customization was applied
          customPipelineApplied: true,
          // Optionally override title again if needed (might be redundant)
          title: config.title ?? result.meta.title,
        }
      };
    }
  )
  .build({
    description: "Applies custom configurations to a form shape and prepares it for UI rendering in create mode.",
    category: "form-mode-custom",
    tags: ["form", "create", "custom", "pipeline"],
    inputType: "FormShape", // Overall input
    outputType: "CreateOutput" // Overall output
  });


// --- Helper Function ---

/**
 * Convenience function for applying custom configuration and creating the form output.
 */
export function applyCustom(
  shape: FormShape,
  customConfig: CustomCreateConfig,
  // Allow providing partial context (excluding prakāra, which we set)
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