import { SimpleMorph } from "../morph";
import { isViewContext } from "../mode";
import { ViewOutput } from "./pipeline";

/**
 * Apply styling to a view
 */
export const StyleViewMorph = new SimpleMorph<ViewOutput, ViewOutput>(
  "StyleViewMorph",
  (view, context) => { // Context here is FormExecutionContext initially
    if (!view || !Array.isArray(view.fields)) {
      throw new Error("Invalid view output provided to StyleViewMorph");
    }
    if (!isViewContext(context)) {
        throw new Error("StyleViewMorph requires a valid ViewContext.");
    }
    const viewContext = context; // Type narrowed

    const variant = viewContext.variant || "default";
    const density = viewContext.density || "normal";

    // Deep clone might be safer
    const result: ViewOutput = {
       ...view,
      fields: view.fields.map((field) => ({
        ...field,
        meta: {
          ...field.meta,
          styles: {
            ...(field.meta?.styles || {}),
            container: {
              ...(field.meta?.styles?.container || {}),
              padding: density === "compact" ? "4px" : density === "comfortable" ? "12px" : "8px",
              margin: density === "compact" ? "2px 0" : "4px 0",
              borderBottom: "1px solid var(--outline-color, #e0e0e0)",  // Add subtle separator
            },
            label: {  // Add label styling
              fontWeight: 'medium',
              marginBottom: '4px',
              fontSize: density === "compact" ? "0.875rem" : "1rem",
            },
            value: {  // Add value styling
              fontSize: density === "compact" ? "0.875rem" : "1rem",
              lineHeight: '1.5',
              color: "var(--text-primary-color, #212121)",
            }
          },
        },
      })),
      meta: {
        ...view.meta,
        styles: {
          ...(view.meta?.styles || {}),
          container: {
            ...(view.meta?.styles?.container || {}),
            padding: viewContext.padding || "16px",
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
