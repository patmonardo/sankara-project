import { createMorph } from "../morph";
import { FormShape, FormField } from "../../schema/form";
import { FormExecutionContext, isCreateContext } from "../../schema/context";

/**
 * Create mode output with additional metadata
 */
export interface CreateOutput extends FormShape {
  meta: FormShape["meta"] & {
    create: {
      timestamp: string;
      fieldsInitialized: string[];
    };
  };
}

/**
 * Initialize a form for create mode with default values
 */
export const PrepareCreateMorph = createMorph<FormShape, CreateOutput>(
  "PrepareCreateMorph",
  (form, context) => {
    if (!form || !Array.isArray(form.fields)) {
      throw new Error("Invalid form provided to PrepareCreateMorph");
    }

    // Get create context options
    const createContext = isCreateContext(context) ? context : undefined;
    const initialValues = createContext?.initialValues || {};
    
    // Initialize fields with default values
    const fieldsInitialized: string[] = [];
    const initializedFields = form.fields.map(field => {
      // Skip fields without IDs
      if (!field.id) return field;
      
      // Determine the initial value (context > default value > type default)
      let initialValue;
      if (field.id in initialValues) {
        initialValue = initialValues[field.id];
        fieldsInitialized.push(field.id);
      } else if (field.defaultValue !== undefined) {
        initialValue = field.defaultValue;
        fieldsInitialized.push(field.id);
      } else {
        initialValue = getDefaultForType(field.type);
        if (initialValue !== undefined) {
          fieldsInitialized.push(field.id);
        }
      }
      
      // Create the initialized field
      return {
        ...field,
        value: initialValue,
        readOnly: field.readOnly || false,
        required: field.required || false,
        meta: {
          ...(field.meta || {}),
          mode: "create",
          pristine: true,
          touched: false
        }
      };
    });
    
    // Return the create form
    return {
      ...form,
      mode: "create",
      readOnly: false,
      fields: initializedFields,
      meta: {
        ...(form.meta || {}),
        create: {
          timestamp: new Date().toISOString(),
          fieldsInitialized
        }
      }
    };
  },
  {
    pure: false, // Not pure due to timestamp
    fusible: true,
    cost: 2
  }
);

/**
 * Get default value for a field type
 */
function getDefaultForType(type?: string): any {
  switch (type) {
    case "string":
    case "text":
    case "email":
    case "url":
    case "tel":
    case "password":
      return "";
      
    case "number":
    case "integer":
    case "float":
    case "decimal":
      return null;
      
    case "boolean":
      return false;
      
    case "date":
    case "datetime":
    case "time":
      return null;
      
    case "select":
    case "radio":
      return null;
      
    case "multiselect":
    case "checkbox":
      return [];
      
    case "object":
      return {};
      
    case "array":
      return [];
      
    default:
      return undefined;
  }
}