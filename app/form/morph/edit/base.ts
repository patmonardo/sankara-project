import { createMorph } from "../morph";
import { FormShape } from "../../schema/form";
import { FormExecutionContext, isEditContext } from "../../schema/context";

/**
 * Edit mode output with additional metadata
 */
export interface EditOutput extends FormShape {
  meta: FormShape["meta"] & {
    edit: {
      timestamp: string;
      trackChanges?: boolean;
      originalValues?: Record<string, any>;
      changedFields?: string[];
    };
  };
}

/**
 * Initialize a form for edit mode with existing values
 */
export const PrepareEditMorph = createMorph<FormShape, EditOutput>(
  "PrepareEditMorph",
  (shape, context) => {
    if (!shape || !Array.isArray(shape.fields)) {
      throw new Error("Invalid form shape provided to PrepareEditMorph");
    }

    // Implementation details...
    
    // Return with explicit type transformation
    const editOutput: EditOutput = {
      ...shape,
      mode: "edit",
      readOnly: false,
      fields: editFields,
      meta: {
        ...(shape.meta || {}),
        edit: {
          timestamp: new Date().toISOString(),
          trackChanges,
          originalValues: trackChanges ? originalValues : undefined,
          changedFields: trackChanges ? changedFields : undefined
        }
      }
    };
    
    return editOutput;
  },
  {
    pure: false,
    fusible: true,
    cost: 2
  }
);

/**
 * Compare two values for equality (handles objects and arrays)
 */
function valuesEqual(a: any, b: any): boolean {
  // Same reference or both null/undefined
  if (a === b) return true;
  
  // One is null/undefined but not both
  if (a == null || b == null) return false;
  
  // Handle dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  
  // Different types
  if (typeof a !== typeof b) return false;
  
  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!valuesEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  // Handle objects
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!valuesEqual(a[key], b[key])) return false;
    }
    
    return true;
  }
  
  // Primitive equality
  return a === b;
}