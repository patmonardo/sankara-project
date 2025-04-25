import { createMorph } from "../core";
import { FormShape, FormField } from "./types";
import { FormContext, isFormContext } from "./types";

/**
 * Explicit style extension for the entire shape.
 */
export interface StyleShape extends FormShape {
  fields: StyleField[];
  styles?: {
    container?: Record<string, string>;
  };
}

/**
 * Explicit style extension for fields.
 */
export interface StyleField extends FormField {
  styles?: {
    container?: Record<string, string>;
    label?: Record<string, string>;
    value?: Record<string, string>;
  };
}

/**
 * Extended context for styling that adds variant, density, 
 * and a container padding override.
 */
export interface StyleContext extends FormContext {
  variant?: "default" | "card";
  density?: "compact" | "comfortable" | "normal";
  padding?: string;
}

/**
 * Morph to apply styling to a view using explicit style interfaces.
 */
export const StyleMorph = createMorph<StyleShape, StyleShape>(
  "StyleMorph",
  (shape: StyleShape, context: StyleContext) => {
    if (!shape || !Array.isArray(shape.fields)) {
      throw new Error("Invalid shape output provided to StyleMorph");
    }
    if (!isFormContext(context)) {
      throw new Error("StyleMorph requires a valid Context.");
    }

    const variant = context.variant || "default";
    const density = context.density || "normal";
    const containerPadding = context.padding || "16px";

    // Build styled fields explicitly.
    const styledFields: StyleField[] = shape.fields.map((field): StyleField => {
      // Define field-level style overrides based on density.
      const fieldStyles = {
        container: {
          padding: density === "compact" ? "4px" : density === "comfortable" ? "12px" : "8px",
          margin: density === "compact" ? "2px 0" : "4px 0",
          borderBottom: "1px solid var(--outline-color, #e0e0e0)",
        },
        label: {
          fontWeight: "medium",
          marginBottom: "4px",
          fontSize: density === "compact" ? "0.875rem" : "1rem",
        },
        value: {
          fontSize: density === "compact" ? "0.875rem" : "1rem",
          lineHeight: "1.5",
          color: "var(--text-primary-color, #212121)",
        },
      };

      return {
        ...field,
        styles: {
          ...field.styles,
          container: {
            ...(field.styles?.container || {}),
            ...fieldStyles.container,
          },
          label: {
            ...(field.styles?.label || {}),
            ...fieldStyles.label,
          },
          value: {
            ...(field.styles?.value || {}),
            ...fieldStyles.value,
          },
        },
      };
    });

    const styledShape: StyleShape = {
      ...shape,
      fields: styledFields,
      styles: {
        container: {
          padding: containerPadding,
          backgroundColor: variant === "card" ? "var(--card-bg, #fff)" : "transparent",
          borderRadius: variant === "card" ? "var(--radius-md, 4px)" : "0",
          boxShadow: variant === "card"
            ? "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))"
            : "none",
        },
      },
    };

    return styledShape;
  },
  {
    pure: true,
    fusible: true,
    cost: 1,
    memoizable: true,
  }
);