import { createMorph, createPipeline } from "../morph";
import { FormShape, FormField, FormAction } from "../../schema/form";
import { EditContext, isEditContext } from "../core/mode";
import { GenerateEditActionsMorph } from "./action";
import { determineInputType, getDefaultForType } from "../core/mode"; // Example import

/**
 * Represents a FormField tailored for the 'edit' mode UI and logic.
 */
export interface EditField extends FormField {
  value: any; // Holds the current value for editing
  originalValue?: any; // Holds the initial value when tracking changes
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string | RegExp;
  isChanged?: boolean; // Flag indicating if the value differs from original
  inputType: string; // Determined input type for UI rendering
  visible: boolean; // Resolved visibility for edit mode
  disabled: boolean; // Resolved disabled state for edit mode
  readOnly: boolean; // Resolved readOnly state for edit mode
  meta: FormField["meta"] & {
    mode: "edit";
    pristine?: boolean; // Field hasn't been interacted with yet in this session
    touched?: boolean; // Field hasn't received focus/blur yet in this session
  };
}

/**
 * Represents a FormShape tailored for the 'edit' mode.
 */
export interface EditOutput extends Omit<FormShape, "fields" | "actions"> {
  // Omit actions too
  fields: EditField[]; // Use the specialized EditField type
  actions: FormAction[]; // Ensure actions array is present
  mode: "edit";
  name?: string; // Name of the form, can be used for UI display
  targetId: string; // ID of the record being edited
  valid: boolean;
  complete: boolean;
  hasChanges?: boolean; // Overall flag indicating if any field changed
  values?: Record<string, any>; // Initial values for fields
  meta: FormShape["meta"] & {
    mode: "edit";
    timestamp: string;
    // Edit-specific metadata for tracking changes
    edit?: {
      trackChanges: boolean;
      originalValues?: Record<string, any>; // Store all original values here
      changedFields?: string[]; // List of IDs of fields that have changed
    };
    title?: string;
  };
}

// --- Helper Functions ---

/**
 * Determine if a field should be included in edit mode.
 */
function shouldIncludeInEdit(field: FormField, context?: EditContext): boolean {
  // Basic checks
  if (!field || !field.id) return false;
  if (field.visible === false) return false;

  // Metadata checks
  if (field.meta?.excludeFromEdit) return false;
  if (field.meta?.createOnly) return false;
  if (field.meta?.editOnly) {
    // Still respect includeFields if it exists
    if (context?.includeFields && context.includeFields.length > 0) {
      return context.includeFields.includes(field.id);
    }
    return true;
  }
  // Contextual checks
  if (context?.excludeFields?.includes(field.id)) return false;

  // Check if includeFields exists and has entries
  if (context?.includeFields && context.includeFields.length > 0) {
    return context.includeFields.includes(field.id);
  }

  // Default: include if not explicitly excluded/hidden
  return true;
}

// --- Core Preparation Morph ---

/**
 * Initializes a FormShape for edit mode, populating fields with existing data
 * and producing an EditOutput structure.
 */
export const PrepareEditMorph = createMorph<FormShape, EditOutput>(
  "PrepareEditMorph",
  (shape, context) => {
    if (!shape || !Array.isArray(shape.fields)) {
      throw new Error("Invalid FormShape provided to PrepareEditMorph");
    }
    if (!isEditContext(context)) {
      throw new Error("PrepareEditMorph requires a valid EditContext...");
    }
    const editContext = context as EditContext; // Cast to EditContext
    const existingData = editContext.data || {}; // Assume data is passed in context
    const targetId = editContext.targetId;
    const trackChanges = editContext.trackChanges !== false; // Default to true
    const originalValues: Record<string, any> = {};
    const changedFields: string[] = []; // Start empty

    // 1. Filter and map FormFields to EditFields
    const editFields: EditField[] = shape.fields
      .filter((field) => shouldIncludeInEdit(field, editContext))
      .map((field): EditField => {
        // 2. Determine properties based on the original FormField, context, and existingData
        const currentValue =
          existingData[field.id!] ??
          field.defaultValue ??
          getDefaultForType(field.type);
        const originalValue = trackChanges ? currentValue : undefined; // Store initial value if tracking
        const isChanged = false; // Initially, nothing has changed

        if (trackChanges && originalValue !== undefined) {
          originalValues[field.id!] = originalValue;
        }

        const resolvedInputType = determineInputType(field);
        const resolvedVisible = true;
        const resolvedDisabled =
          field.disabled || field.meta?.editDisabled || false;
        const resolvedReadOnly =
          field.readOnly || field.meta?.editReadOnly || false;
        const resolvedRequired = field.required || false;

        // 3. Construct the EditField
        const editField: EditField = {
          ...field,
          value: currentValue,
          originalValue: originalValue,
          isChanged: isChanged,
          inputType: resolvedInputType,
          visible: resolvedVisible,
          disabled: resolvedDisabled,
          readOnly: resolvedReadOnly,
          required: resolvedRequired,
          meta: {
            ...(field.meta || {}),
            mode: "edit",
            pristine: true, // Start as pristine for this edit session
            touched: false,
          },
        };
        return editField;
      });

    // 4. Construct the EditOutput
    const output: EditOutput = {
      ...shape,
      fields: editFields,
      actions: [], // Initialize empty, GenerateEditActionsMorph will populate
      mode: "edit",
      targetId: targetId,
      valid: false, // Initial state
      complete: false, // Initial state
      hasChanges: false, // Initial state
      meta: {
        ...(shape.meta || {}),
        mode: "edit",
        timestamp: new Date().toISOString(),
        edit: {
          trackChanges: trackChanges,
          originalValues: trackChanges ? originalValues : undefined,
          changedFields: trackChanges ? changedFields : undefined,
        },
        // Optionally set a default title
        title: shape.title || `Edit Item ${targetId}`,
      },
    };

    return output;
  },
  {
    pure: false, // Not pure due to timestamp and potential data fetching dependency
    fusible: true,
    cost: 5, // Slightly higher cost due to data mapping
    memoizable: false,
  }
);

// --- Edit Mode Pipeline Definition ---

/**
 * Complete pipeline for edit mode.
 * Transforms a FormShape into an EditOutput ready for UI rendering.
 */
export const EditModePipeline = createPipeline<FormShape>("EditModePipeline")
  .pipe(PrepareEditMorph) // Prepare the core structure and fields with data
  .pipe(GenerateEditActionsMorph) // Add action buttons based on state
  // Add other edit-specific morphs here (e.g., validation, change detection)
  .build({
    description:
      "Transforms a form schema into the structure needed for edit mode UI",
    category: "form-mode",
    tags: ["form", "edit", "ui", "pipeline"],
    inputType: "FormShape",
    outputType: "EditOutput",
  });
