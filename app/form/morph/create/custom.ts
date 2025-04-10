import { SimpleMorph, ComposedMorph } from "../morph";
import { FormShape, FormField } from "../../schema/form";
import { MorpheusContext, CreateContext } from "../../schema/context";
import { CreateOutput, ShapeCreateMorph } from "./display";

/**
 * Custom creation configuration
 */
export interface CustomCreateConfig {
  title?: string;
  submitLabel?: string;
  cancelLabel?: string;
  clearOnSubmit?: boolean;
  buttonPosition?: "top" | "bottom" | "both";
  showCancel?: boolean;
  fieldConfigs?: Record<string, Partial<FormField>>;
  metadata?: Record<string, any>;
}

/**
 * Context with custom configuration
 */
export interface CustomCreateContext extends CreateContext {
  customConfig: CustomCreateConfig;
}

/**
 * Type guard to check if a context has custom configuration
 */
function isCustomContext(
  context: MorpheusContext
): context is CustomCreateContext {
  return (
    context !== null &&
    typeof context === "object" &&
    context.type === "create" &&
    "customConfig" in context &&
    context.customConfig !== null &&
    typeof context.customConfig === "object"
  );
}

/**
 * Safe type casting for context - returns a default if cast isn't valid
 */
function asCreateContext(context: MorpheusContext): CreateContext {
  if (context && typeof context === "object" && context.type === "create") {
    return context as CreateContext;
  }
  return { type: "create" };
}

/**
 * Apply custom configurations to form fields
 */
export const CustomizeShapeMorph = new SimpleMorph<FormShape, FormShape>(
  "CustomizeShapeMorph", // Fixed morph name to match variable name
  (shape, context: MorpheusContext) => {
    // Validate input
    if (!shape || !Array.isArray(shape.fields)) {
      throw new Error("Invalid form shape provided to CustomizeShapeMorph");
    }

    // Validate and extract custom context
    if (!isCustomContext(context)) {
      throw new Error(
        "Custom configuration is required for CustomizeShapeMorph"
      );
    }

    const config = context.customConfig;
    // Ensure fieldConfigs exists to avoid undefined access
    const fieldConfigs = config.fieldConfigs || {};

    // Apply customizations to fields
    const fields = shape.fields.map((field) => {
      // Skip if field is null/undefined or has no ID
      if (!field || !field.id) return field;

      // Safe access to field config with null check
      const fieldConfig = field.id in fieldConfigs ? fieldConfigs[field.id] : null;
      if (!fieldConfig) return field;

      // Track original values for reference - with safe property access
      const originalValues = {
        label: field.label || '',
        type: field.type || 'string',
        required: !!field.required,
        readOnly: !!field.readOnly,
      };

      return {
        ...field,
        // Use nullish coalescing with safe fallbacks
        label: fieldConfig.label ?? field.label ?? '',
        type: fieldConfig.type ?? field.type ?? 'string',
        required: fieldConfig.required ?? field.required ?? false,
        readOnly: fieldConfig.readOnly ?? field.readOnly ?? false,
        disabled: fieldConfig.disabled ?? field.disabled ?? false,
        placeholder: fieldConfig.placeholder ?? field.placeholder ?? '',
        meta: {
          // Safe spread of meta objects with defaults
          ...(field.meta || {}),
          ...(fieldConfig.meta || {}),
          customized: true,
          originalValues,
          customizedAt: new Date().toISOString(),
        },
      };
    });

    // Return customized form
    return {
      ...shape,
      title: config.title || shape.title || '',
      fields,
      meta: {
        ...(shape.meta || {}),
        ...(config.metadata || {}),
        customized: true,
        customTitle: config.title,
        customizedAt: new Date().toISOString(),
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
 * Create a context with custom configuration
 */
export function withCustomConfig(
  baseContext: MorpheusContext,
  config: CustomCreateConfig
): CustomCreateContext {
  if (!baseContext) {
    throw new Error("Base context is required for withCustomConfig");
  }

  if (!config) {
    throw new Error("Custom configuration is required for withCustomConfig");
  }

  // Ensure we have a create context
  const createContext = asCreateContext(baseContext);

  return {
    ...createContext,
    customConfig: config,
    // Safe property access with defaults
    title: config.title ?? createContext.title,
    submitLabel: config.submitLabel ?? createContext.submitLabel,
    cancelLabel: config.cancelLabel ?? createContext.cancelLabel,
    clearOnSubmit: config.clearOnSubmit ?? createContext.clearOnSubmit,
    buttonPosition: config.buttonPosition ?? createContext.buttonPosition ?? 'bottom',
    showCancel: config.showCancel ?? createContext.showCancel ?? true,
  };
}

/**
 * Create a custom form morph with composition
 */
export const createCustomShapeMorph = (config: CustomCreateConfig) => {
  if (!config) {
    throw new Error("Custom configuration is required for createCustomShapeMorph");
  }

  // Fix missing fieldConfigs
  const safeConfig = {
    ...config,
    fieldConfigs: config.fieldConfigs || {},
    metadata: config.metadata || {}
  };

  return new ComposedMorph<FormShape, FormShape>(
    `CustomShape_${safeConfig.title || 'Form'}`,
    [CustomizeShapeMorph],
    (result, context) => {
      if (!result || !Array.isArray(result.fields)) {
        console.warn("Invalid result in CustomShapeMorph post-processing");
        return {
          id: result?.id || `fallback-${Date.now()}`,
          title: result?.title || safeConfig.title || 'Custom Form',
          fields: [],
          meta: {
            error: "Failed to process result",
            recoveryAttempted: true,
            customized: true
          }
        };
      }
      
      return result;
    },
    {
      pure: true,
      fusible: false,
      cost: 3,
      memoizable: false,
    }
  );
};

/**
 * Create a morph that applies custom configurations through composition
 */
export function createCustomFormMorph(config: CustomCreateConfig) {
  if (!config) {
    throw new Error("Custom configuration is required for createCustomFormMorph");
  }
  
  // Fix missing fieldConfigs 
  const safeConfig = {
    ...config,
    fieldConfigs: config.fieldConfigs || {},
    metadata: config.metadata || {}
  };

  return new ComposedMorph<FormShape, CreateOutput>(
    `CustomCreate_${safeConfig.title || 'Form'}`,
    [
      // First apply custom configurations to the form shape
      (shape, context) => {
        // Validate input
        if (!shape) {
          throw new Error("Form shape is required for CustomFormMorph");
        }

        if (!context) {
          throw new Error("Context is required for CustomFormMorph");
        }

        try {
          // Ensure we have a custom context
          const customContext = isCustomContext(context)
            ? context
            : withCustomConfig(context, safeConfig);

          return CustomizeShapeMorph.apply(shape, customContext);
        } catch (error) {
          // Consistent error handling with message extraction
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(
            `Error in custom form customization step: ${errorMessage}`
          );
        }
      },

      // Then create using the base morphism with modified context
      (shape, context) => {
        try {
          // Ensure we have a custom context
          const customContext = isCustomContext(context)
            ? context
            : withCustomConfig(context, safeConfig);

          return ShapeCreateMorph.apply(shape, customContext);
        } catch (error) {
          // Consistent error handling with message extraction
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(
            `Error in custom form creation step: ${errorMessage}`
          );
        }
      },
    ],
    // Post-processing to apply any final touches
    (result, context) => {
      if (!result || !Array.isArray(result.fields)) {
        console.warn("Invalid result in CustomFormMorph post-processing");
        return {
          id: result?.id || `fallback-${Date.now()}`,
          fields: [],
          mode: "create" as const,
          isNew: true,
          valid: false,
          complete: false,
          meta: {
            error: "Failed to process result",
            recoveryAttempted: true,
            customized: true
          }
        };
      }

      // Add any specific styling or custom attributes based on config
      return {
        ...result,
        meta: {
          ...(result.meta || {}),
          customForm: true,
          customConfig: {
            title: safeConfig.title,
            submitLabel: safeConfig.submitLabel,
            cancelLabel: safeConfig.cancelLabel,
            clearOnSubmit: safeConfig.clearOnSubmit,
            buttonPosition: safeConfig.buttonPosition,
            showCancel: safeConfig.showCancel,
          },
        },
      };
    },
    {
      pure: true,
      fusible: false,
      cost: 5,
      memoizable: false,
    }
  );
}

/**
 * Convenience function for direct application of custom configuration
 */
export function applyCustom(
  form: FormShape,
  customConfig: CustomCreateConfig,
  context?: MorpheusContext
): CreateOutput {
  // Validate inputs
  if (!form) {
    throw new Error("Form shape is required for applyCustom");
  }

  if (!customConfig) {
    throw new Error("Custom configuration is required for applyCustom");
  }
  
  // Fix missing fieldConfigs
  const safeConfig = {
    ...customConfig,
    fieldConfigs: customConfig.fieldConfigs || {},
    metadata: customConfig.metadata || {}
  };

  // Default context if none provided
  const baseContext = context || { type: "create" };

  try {
    // Ensure we have a create context
    const createContext = asCreateContext(baseContext);
    
    const customContext = withCustomConfig(createContext, safeConfig);
    const customMorph = createCustomFormMorph(safeConfig);
    return customMorph.apply(form, customContext);
  } catch (error) {
    // Consistent error handling with message extraction
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to apply custom configuration: ${errorMessage}`);
  }
}