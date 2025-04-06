import { SimpleMorph } from "../morph";
import { FormShape, FormField } from "../../schema/form";
import { ViewContext, MorpheusContext } from "../../schema/context";
import { defineFieldStyles } from "../../style/style";
import {
  determineDisplayType,
  getDefaultFormat,
  shouldIncludeField,
  extractFieldValue,
  getFieldLabel,
} from "./extract";
/**
 * Base view field interface
 */
export interface ViewField {
  // Fields we want from FormField but with custom requirements
  id: string;
  type: string;
  label: string;
  
  // New view-specific fields
  value: any;
  displayValue?: string;
  
  // Re-use appropriate FormField properties
  description?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  visible?: boolean;
  format?: string;
  
  // Options for select/radio fields
  options?: Array<{
    value: string | number | boolean;
    label: string;
    [key: string]: any;
  }>;
  
  // Metadata for the view
  meta?: {
    mode?: string;
    expanded?: boolean;
    expandedView?: any;
    validation?: {
      valid: boolean;
      messages?: string[];
    };
    [key: string]: any;
  };
  
  // Allow additional properties
  [key: string]: any;
}

/**
 * View output
 */
export interface ViewOutput {
  id: string;
  fields: ViewField[];
  mode: "view";
  meta?: Record<string, any>;
  format?: string;
}

/**
 * Determine field state based on validation status
 */
export function determineFieldState(
  field: FormField
): "idle" | "error" | "success" {
  if (field.validation?.errors) return "error";
  if (field.validation?.valid) return "success";
  return "idle";
}

/**
 * Process a single field for viewing
 */
export function processFieldForView(
  field: FormField,
  context: ViewContext
): ViewField {
  const fieldType = determineDisplayType(field);
  const value = extractFieldValue(field, context);
  const label = getFieldLabel(field);

  // Generate field styles
  const styles = defineFieldStyles(fieldType, "view", {
    state: determineFieldState(field),
    variant: context.variant,
  });

  return {
    id: field.id,
    label,
    value,
    type: fieldType,
    format: field.format || getDefaultFormat(field.type),
    readOnly: true,
    interactive: false,
    visible: field.visible !== false,
    meta: {
      ...field.meta,
      styles,
    },
  };
}

/**
 * Transform shape to view mode
 */
export const ShapeViewMorph = new SimpleMorph<FormShape, ViewOutput>(
  "ShapeViewMorph",
  (shape, context: MorpheusContext) => {
    // Validate input
    if (!shape || !Array.isArray(shape.fields)) {
      throw new Error("Invalid form shape provided to ShapeViewMorph");
    }

    // Process fields for viewing - no casting needed
    const fields = shape.fields
      .filter((field) => shouldIncludeField(field, context))
      .map((field) => processFieldForView(field, context));

    // Return view output
    return {
      id: shape.id,
      fields,
      mode: "view",
      meta: {
        ...shape.meta,
        title: shape.meta?.title || shape.title,
        description: shape.meta?.description || shape.description,
      },
      format: context.format || "jsx",
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
 * Apply styling to a view
 */
export const StyleViewMorph = new SimpleMorph<ViewOutput, ViewOutput>(
  "StyleViewMorph",
  (view, context: MorpheusContext) => {
    // Early validation
    if (!view || !Array.isArray(view.fields)) {
      throw new Error("Invalid view output provided to StyleViewMorph");
    }

    // Apply styling based on view context - no casting needed
    const variant = context.variant || "default";
    const density = context.density || "normal";

    // Deep clone to avoid mutating the input
    const result = {
      ...view,
      fields: view.fields.map((field) => ({
        ...field,
        meta: {
          ...field.meta,
          styles: {
            ...(field.meta?.styles || {}),
            // Add container styles based on variant and density
            container: {
              ...(field.meta?.styles?.container || {}),
              padding:
                density === "compact"
                  ? "4px"
                  : density === "comfortable"
                  ? "12px"
                  : "8px",
              margin: density === "compact" ? "2px 0" : "4px 0",
            },
          },
        },
      })),
      meta: {
        ...view.meta,
        styles: {
          ...(view.meta?.styles || {}),
          // Add view container styles
          container: {
            ...(view.meta?.styles?.container || {}),
            padding: context.padding || "16px",
            backgroundColor:
              variant === "card" ? "var(--card-bg, #fff)" : "transparent",
            borderRadius:
              variant === "card" ? "var(--radius-md, 4px)" : undefined,
            boxShadow:
              variant === "card"
                ? "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))"
                : undefined,
          },
        },
      },
    };

    return result;
  },
  {
    pure: true,
    fusible: true,
    cost: 1,
    memoizable: true,
  }
);
