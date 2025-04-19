import { createMorph, createPipeline } from "../morph";
import { FormShape, FormField, FormAction } from "../../schema/form";
import { CreateContext, isCreateContext } from "../mode";
import { GenerateCreateActionsMorph } from "./actions";

// --- Mode-Specific Interfaces ---

/**
 * Represents a FormField tailored for the 'create' mode UI and logic.
 * Extends the base FormField with create-specific state and properties.
 */
export interface CreateField extends FormField {
  // Properties specific to create mode or resolved for UI:
  value: any; // Holds the initial value for the create form
  inputType: string; // Determined input type for UI rendering
  visible: boolean; // Resolved visibility for create mode (always true if included)
  disabled: boolean; // Resolved disabled state for create mode
  readOnly: boolean; // Resolved readOnly state for create mode
  meta: FormField["meta"] & {
    mode: "create";
    pristine: boolean; // Field hasn't been interacted with yet
    touched: boolean; // Field hasn't received focus/blur yet
  };
  // Inherits id, label, type, required, placeholder, validation, etc. from FormField
}

/**
 * Represents a FormShape tailored for the 'create' mode.
 * Extends the base FormShape, using CreateField[] and adding create-specific properties/metadata.
 */
export interface CreateOutput extends Omit<FormShape, 'fields'> {
  fields: CreateField[];
  mode: "create";
  isNew: true;
  valid: boolean;
  complete: boolean;
  actions?: FormAction[];
  submitButton?: { label: string; position: 'top' | 'bottom' | 'both'; };
  cancelButton?: { label: string; position: 'top' | 'bottom' | 'both'; };
  clearOnSubmit?: boolean;
  meta: FormShape["meta"] & {
    mode: "create";
    timestamp: string;
    fieldsInitialized: string[];
    title?: string;
  };
  // Inherits id, name, description, etc. from FormShape
}


// --- Helper Functions ---

/**
 * Determine if a field should be included in create mode based on context and field metadata.
 * Operates on the original FormField.
 */
function shouldIncludeInCreate(field: FormField, context?: CreateContext): boolean {
  // Basic checks
  if (!field || !field.id) return false;
  if (field.visible === false) return false; // Explicitly hidden

  // Metadata checks
  if (field.meta?.excludeFromCreate) return false;
  if (field.meta?.editOnly) return false;
  if (field.meta?.createOnly) return true; // Explicitly included

  // Contextual checks
  if (context?.excludeFields?.includes(field.id)) return false;
  
  // This is the key change - check if includeFields exists and has entries
  if (context?.includeFields && context.includeFields.length > 0) {
    return context.includeFields.includes(field.id);
  }

  // Default: include if not explicitly excluded/hidden
  return true;
}

/**
 * Determine the appropriate input type for a field for UI rendering.
 * Operates on the original FormField.
 */
function determineInputType(field: FormField): string {
  // 1. If explicit inputType is provided, use it
  if (field.inputType) return field.inputType;

  // 2. Check for special formats in metadata
  if (field.meta) {
    // Check for specific formats
    if (field.meta.format === "email") return "email";
    if (field.meta.format === "password") return "password";
    if (field.meta.format === "url") return "url";
    if (field.meta.format === "tel") return "tel";
    
    // Check for multiline text
    if (field.meta.multiline === true) return "textarea";
    
    // Check for custom widget/renderer
    if (field.meta.widget) return field.meta.widget;
  }

  // 3. Map based on field type
  const typeToInputMap: Record<string, string> = {
    string: 'text',
    text: 'text',
    number: 'number',
    integer: 'number',
    float: 'number',
    decimal: 'number',
    boolean: 'checkbox',
    date: 'date',
    datetime: 'datetime-local',
    time: 'time',
    email: 'email',
    password: 'password',
    tel: 'tel',
    url: 'url',
    object: 'complex',
    array: 'complex',
    select: 'select',
    multiselect: 'select',
    radio: 'radio',
    checkbox: 'checkbox',
    file: 'file',
    color: 'color',
    range: 'range',
    hidden: 'hidden',
    default: 'text'
  };

  return typeToInputMap[field.type || 'default'] || typeToInputMap.default;
}
/**
 * Get a default value based on field type.
 */
function getDefaultForType(type?: string): any {
  switch (type) {
    case "string": case "text": case "email": case "url": case "tel": case "password": return "";
    case "number": case "integer": case "float": case "decimal": return null;
    case "boolean": return false;
    case "date": case "datetime": case "time": return null;
    case "select": case "radio": return null;
    case "multiselect": case "checkbox": return [];
    case "object": return {};
    case "array": return [];
    default: return undefined;
  }
}

// --- Core Preparation Morph ---

/**
 * Initializes a FormShape for create mode, transforming FormFields into CreateFields
 * and producing a CreateOutput structure.
 */
export const PrepareCreateMorph = createMorph<FormShape, CreateOutput>(
  "PrepareCreateMorph",
  (shape, context) => {
    if (!shape || !Array.isArray(shape.fields)) {
      throw new Error("Invalid FormShape provided to PrepareCreateMorph");
    }

    const createContext = isCreateContext(context) ? context : undefined;
    const initialValues = createContext?.initialValues || {};
    const fieldsInitialized: string[] = [];

    // 1. Filter and map FormFields to CreateFields
    const createFields: CreateField[] = shape.fields
      .filter(field => shouldIncludeInCreate(field, createContext)) // Filter using original FormField
      .map((field): CreateField => { // Process original FormField

        // 2. Determine properties based on the original FormField and context
        let resolvedInitialValue: any;
        if (field.id! in initialValues) {
          resolvedInitialValue = initialValues[field.id!];
          fieldsInitialized.push(field.id!);
        } else if (field.defaultValue !== undefined) {
          resolvedInitialValue = field.defaultValue;
          fieldsInitialized.push(field.id!);
        } else {
          resolvedInitialValue = getDefaultForType(field.type);
          // Only track if a non-undefined default was actually set
          if (resolvedInitialValue !== undefined) {
            fieldsInitialized.push(field.id!);
          }
        }

        const resolvedInputType = determineInputType(field); // Determine from original FormField
        const resolvedVisible = true; // If it passed filtering, it's visible in this context
        const resolvedDisabled = field.disabled || field.meta?.createDisabled || false;
        const resolvedReadOnly = field.readOnly || field.meta?.createReadOnly || false;
        const resolvedRequired = field.required || false;

        // 3. Construct the CreateField using resolved properties
        const createField: CreateField = {
          ...field, // Spread base FormField properties first
          // Assign resolved/specific properties for CreateField
          value: resolvedInitialValue,
          inputType: resolvedInputType,
          visible: resolvedVisible,
          disabled: resolvedDisabled,
          readOnly: resolvedReadOnly,
          required: resolvedRequired,
          // Add/overwrite metadata
          meta: {
            ...(field.meta || {}), // Keep existing meta
            mode: "create",
            pristine: true,
            touched: false,
          },
        };
        return createField;
      });

    // 4. Construct the CreateOutput
    const output: CreateOutput = {
      ...shape, // Spread base FormShape properties
      fields: createFields, // Use the transformed fields
      mode: "create",
      isNew: true,
      valid: false, // Initial state, can be updated later
      complete: false, // Initial state, can be updated later
      meta: {
        ...(shape.meta || {}), // Keep existing meta
        mode: "create",
        timestamp: new Date().toISOString(),
        fieldsInitialized,
      },
    };

    return output;
  },
  {
    pure: false, // Not pure due to timestamp
    fusible: true,
    cost: 5,
  }
);


// --- Create Mode Pipeline Definition ---

/**
 * Complete pipeline for create mode.
 * Transforms a FormShape into a CreateOutput ready for UI rendering.
 */
export const CreateModePipeline = createPipeline<FormShape>("CreateModePipeline")
  .pipe(PrepareCreateMorph) // Prepare the core structure and fields
  .pipe(GenerateCreateActionsMorph) // Add action buttons
  // Add other create-specific morphs here (e.g., validation)
  .build({
    description: "Transforms a form schema into the structure needed for create mode UI",
    category: "form-mode",
    tags: ["form", "create", "ui", "pipeline"],
    inputType: "FormShape",
    outputType: "CreateOutput",
  });