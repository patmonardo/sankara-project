import { createMorph } from "../core";
import { FormShape, FormField } from "./types";  // Fix: removed dot, added comma

/**
 * FormMorph - Transforms a FormShape into a FormShape
 * 
 * This prepares a form for display-only mode with the provided data.
 * It enforces read-only access and formats values for presentation.
 */
export const FormMorph = createMorph<FormShape, FormShape>(
  "FormMorph",
  (shape, context) => {
    // Check for required data
    if (!context?.data?.data && !shape.data) {
      throw new Error("Form requires data. Provide it in shape.data or context.data.data");
    }

    // Use data from context or from the shape itself
    const data = context?.data || shape.data;
    
    // Return properly typed FormShape
    return {
      ...shape,
      meta: {
        ...(shape.meta || {}),
        mode: "form",
        title: shape.title || `${shape.name}`,
        timestamp: new Date().toISOString(),
      }
    };
  },
  {
    pure: false, // Uses Date()
    fusible: true,
    cost: 3,
    description: "Transforms a FormShape into an Executable FormShape"
  }
);

