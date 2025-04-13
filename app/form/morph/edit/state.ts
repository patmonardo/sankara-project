import { createMorph } from "../morph";
import { FormShape, FormState } from "../../schema/form";
import { FormExecutionContext, isEditContext } from "../../schema/context";
import { EditOutput } from "./base";

/**
 * Update edit form state
 * 
 * This morph manages the form state for edit mode:
 * - Tracks submission status
 * - Handles error states
 * - Provides success/failure messages
 */
export const EditStateManagerMorph = createMorph<EditOutput, EditOutput>(
  "EditStateManagerMorph",
  (shape, context) => {
    // Get edit context options
    const editContext = isEditContext(context) ? context : undefined;
    
    // Get current form state or create default
    const currentState = shape.state || { status: 'idle' };
    
    // Collect field errors
    const fieldErrors: Record<string, string[]> = {};
    shape.fields.forEach(field => {
      if (field.id && field.validation?.errors && field.validation.errors.length > 0) {
        fieldErrors[field.id] = field.validation.errors;
      }
    });
    
    // Update form state
    const newState: FormState = {
      ...currentState,
      errors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined
    };
    
    // Handle explicit state from context
    if (editContext?.formState) {
      Object.assign(newState, editContext.formState);
    }
    
    // Add appropriate message if not provided
    if (newState.status === 'error' && !newState.message) {
      newState.message = 'Please correct the errors before submitting.';
    }
    
    return {
      ...shape,
      state: newState
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 1
  }
);

/**
 * Apply edit persistence tracking
 * 
 * This morph adds persistence tracking to the form:
 * - Tracks if changes have been saved
 * - Manages dirty state
 * - Provides unsaved changes warnings
 */
export const EditPersistenceTrackingMorph = createMorph<EditOutput, EditOutput>(
  "EditPersistenceTrackingMorph",
  (shape, context) => {
    // Get changed fields
    const changedFields = shape.meta?.edit?.changedFields || [];
    const hasChanges = changedFields.length > 0;
    
    // Get edit context options
    const editContext = isEditContext(context) ? context : undefined;
    const persistenceState = editContext?.persistenceState || {};
    
    return {
      ...shape,
      meta: {
        ...shape.meta,
        persistence: {
          hasUnsavedChanges: hasChanges,
          lastSaved: persistenceState.lastSaved,
          autoSaveEnabled: persistenceState.autoSaveEnabled || false,
          saveAttempts: persistenceState.saveAttempts || 0,
          saveHistory: persistenceState.saveHistory || []
        }
      }
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 1
  }
);

/**
 * Complete edit state pipeline
 */
import { createPipeline } from "../pipeline";

export const EditStatePipeline = createPipeline<EditOutput, EditOutput>("EditStatePipeline")
  .pipe(EditStateManagerMorph)
  .pipe(EditPersistenceTrackingMorph)
  .build({
    description: "Apply edit state management transformations",
    category: "form",
    tags: ["form", "edit", "state"],
    inputType: "EditOutput",
    outputType: "EditOutput"
  });