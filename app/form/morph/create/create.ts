import { FormShape } from "../../schema/form";
import { createMorph } from "../../morph";
import { CreateFormShape, CreateFormField, CreateFormContext } from "./types";
import { shouldIncludeInCreate, determineInputType, getDefaultForType } from "./helpers";

/**
 * Core Modal Morph for transforming FormShape into CreateFormShape.
 * This handles the fundamental transformation from a schema definition
 * to a create-mode ready structure with values, input types, and state.
 */
export const CreateFormMorph = createMorph<FormShape, CreateFormShape>(
  "CreateFormMorph",
  (shape, context) => {
    // Validate input
    if (!shape || !Array.isArray(shape.fields)) {
      throw new Error("Invalid FormShape provided to CreateFormMorph");
    }

    const createContext = context as CreateFormContext | undefined;
    const initialValues = createContext?.data.initialValues || {};
    const fieldsInitialized: string[] = [];

    // Transform fields for create mode
    const createFields: CreateFormField[] = shape.fields
      .filter(field => shouldIncludeInCreate(field, createContext))
      .map((field): CreateFormField => {
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

        // Construct and return the CreateFormField
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

    // Construct the CreateFormShape with all necessary properties
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
    description: "Core Modal Morph for transforming FormShape into CreateFormShape"
  }
);

/**
 * FilterFieldsMorph - Filters fields based on includeFields/excludeFields
 * This is a placeholder until you implement the full version
 */
export const FilterFieldsMorph = createMorph<CreateFormShape, CreateFormShape>(
  "FilterFieldsMorph",
  (shape, context) => {
    if (!context?.data) return shape;
    
    const { includeFields, excludeFields } = context.data;
    
    if (!includeFields && !excludeFields) return shape;
    
    const filteredFields = shape.fields.filter(field => {
      // Include only fields in includeFields if specified
      if (includeFields && includeFields.length > 0) {
        return includeFields.includes(field.id);
      }
      
      // Exclude fields in excludeFields if specified
      if (excludeFields && excludeFields.length > 0) {
        return !excludeFields.includes(field.id);
      }
      
      return true;
    });
    
    return {
      ...shape,
      fields: filteredFields
    };
  }
);

export const SetupValidationMorph = createMorph<CreateFormShape, CreateFormShape>(
  "SetupValidationMorph",
  (shape, context) => {
    // Check validation setting in config (not data.config)
    if (!context?.data?.config?.validateOnChange) return shape;
    
    // Add validation to fields...
    const fieldsWithValidation = shape.fields.map(field => ({
      ...field,
      meta: {
        ...field.meta,
        validateOnChange: true,
        validationMessages: field.validationMessages || {},
      }
    }));
    
    return {
      ...shape,
      fields: fieldsWithValidation
    };
  }
);

/**
 * Alternative name for clearer pipeline usage
 */
export const PrepareCreateMorph = CreateFormMorph;