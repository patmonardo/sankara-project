import { createMorph } from "../morph";
// Assuming context/schema paths are correct
import { FormAction, FormShape } from "../../schema/form";
import { EditContext, isEditContext } from "../core/mode"; // Adjust path if needed
import { EditOutput } from "./pipeline"; // Assuming EditOutput is defined

/**
 * Generates the standard form actions (Save, Cancel, Reset, Delete) for edit mode
 * based on properties within EditContext and the form's changed state.
 */
// RENAME THE MORPH
export const GenerateEditActionsMorph = createMorph<EditOutput, EditOutput>(
  "GenerateEditActionsMorph", // Updated name
  (outputShape, context) => { // Input is EditOutput
    // Safely access EditContext properties
    const editContext = isEditContext(context) ? context : undefined;

    // Determine button properties from context or use defaults
    const saveLabel = editContext?.saveLabel || "Save";
    const cancelLabel = editContext?.cancelLabel || "Cancel";
    const deleteLabel = editContext?.deleteLabel || "Delete";
    const buttonPosition = editContext?.buttonPosition || "bottom";
    const showReset = editContext?.showReset !== false; // Default true
    const showCancel = editContext?.showCancel !== false; // Default true
    const showDelete = editContext?.showDelete === true; // Default false
    const disableSaveIfUnchanged = editContext?.disableSaveIfUnchanged !== false; // Default true

    // Check if form has changes (assuming meta.edit.changedFields is populated earlier)
    // Ensure safe access to potentially nested/optional properties
    const changedFields = outputShape.meta?.edit?.changedFields;
    const hasChanges = Array.isArray(changedFields) && changedFields.length > 0;

    // Determine disabled state for Save button
    const saveDisabled = disableSaveIfUnchanged && !hasChanges;
    // Determine disabled state for Reset button (only enabled if there are changes)
    const resetDisabled = !hasChanges;

    // Build the actions array
    const actions: FormAction[] = [];

    // Add Save action (maps to submit type)
    actions.push({
      id: "submit", // Or "save"
      type: "submit",
      label: saveLabel,
      primary: true,
      disabled: saveDisabled, // Set disabled state directly
      position: buttonPosition,
    });

    // Add Cancel action if enabled
    if (showCancel) {
      actions.push({
        id: "cancel",
        type: "button",
        label: cancelLabel,
        primary: false,
        disabled: false, // Cancel is usually always enabled
        position: buttonPosition,
      });
    }

    // Add Reset action if enabled
    if (showReset) {
      actions.push({
        id: "reset",
        type: "reset",
        label: "Reset",
        primary: false,
        disabled: resetDisabled, // Set disabled state directly
        position: buttonPosition,
      });
    }

    // Add Delete action if enabled
    if (showDelete) {
      actions.push({
        id: "delete",
        type: "button", // Needs custom handler
        label: deleteLabel,
        primary: false, // Style as destructive?
        disabled: false, // Delete is usually always enabled (confirmation happens elsewhere)
        position: buttonPosition,
        // Consider adding a 'danger: true' property to FormActionSchema if needed for styling
      });
    }

    // Return the output shape with the generated actions array
    return {
      ...outputShape,
      actions: actions, // Replace actions array
    };
  },
  {
    // Morph properties - might not be pure if meta.edit changes affect output
    pure: false, // Depends on meta.edit.changedFields which might come from impure source
    fusible: true,
    cost: 1, // Still low cost
    memoizable: false, // Cannot memoize reliably due to potential meta dependency
  }
);