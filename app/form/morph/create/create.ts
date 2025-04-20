import { FormShape } from "../../schema/form";
import { createMorph } from "../../morph";
import { CreateShape, CreateField, CreateContext } from "./types";
import { shouldIncludeInCreate, determineInputType, getDefaultForType } from "./helpers";

/**
 * Core Modal Morph for transforming FormShape into CreateShape.
 * This handles the fundamental transformation from a schema definition
 * to a create-mode ready structure with values, input types, and state.
 */
export const CreateMorph = createMorph<FormShape, CreateShape>(
  "CreateMorph",
  (shape, context) => {
    // Validate input
    if (!shape || !Array.isArray(shape.fields)) {
      throw new Error("Invalid FormShape provided to CreateMorph");
    }

    const createContext = context as CreateContext | undefined;
    const initialValues = createContext?.initialValues || {};
    const fieldsInitialized: string[] = [];

    // Transform fields for create mode
    const createFields: CreateField[] = shape.fields
      .filter(field => shouldIncludeInCreate(field, createContext))
      .map((field): CreateField => {
        // Determine initial value
        let resolvedInitialValue: any;
        if (field.id! in initialValues) {
          resolvedInitialValue = initialValues[field.id!];
          fieldsInitialized.push(field.id!);
        } else if (field.defaultValue !== undefined) {
          resolvedInitialValue = field.defaultValue;
          fieldsInitialized.push(field.id!);
        } else {
          resolvedInitialValue = getDefaultForType(field.type);
          if (resolvedInitialValue !== undefined) {
            fieldsInitialized.push(field.id!);
          }
        }

        // Resolve field properties for create mode
        const resolvedInputType = determineInputType(field);
        const resolvedVisible = true; // If it passed filtering, it's visible in this context
        const resolvedDisabled = field.disabled || field.meta?.createDisabled || false;
        const resolvedReadOnly = field.readOnly || field.meta?.createReadOnly || false;
        const resolvedRequired = field.required || false;

        // Construct and return the CreateField
        return {
          ...field,
          value: resolvedInitialValue,
          inputType: resolvedInputType,
          visible: resolvedVisible,
          disabled: resolvedDisabled,
          readOnly: resolvedReadOnly,
          required: resolvedRequired,
          meta: {
            ...(field.meta || {}),
            mode: "create",
            pristine: true,
            touched: false,
          },
        };
      });

    // Construct the CreateShape with all necessary properties
    return {
      ...shape,
      fields: createFields,
      mode: "create",
      isNew: true,
      valid: false,
      complete: false,
      meta: {
        ...(shape.meta || {}),
        mode: "create",
        timestamp: new Date().toISOString(),
        fieldsInitialized,
        title: shape.title || `Create ${shape.name}`,
      },
    };
  },
  {
    pure: false, // Not pure due to timestamp
    fusible: true,
    cost: 5,
    description: "Core Modal Morph for transforming FormShape into CreateShape"
  }
);

/**
 * Alternative name for clearer pipeline usage
 */
export const PrepareCreateMorph = CreateMorph;