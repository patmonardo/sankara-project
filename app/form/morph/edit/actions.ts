import { createMorph } from "../../morph/core";
import { EditFormShape } from "./types";

/**
 * Generate actions for edit form
 */
export const GenerateEditActionsMorph = createMorph<EditFormShape, EditFormShape>(
  "GenerateEditActionsMorph",
  (shape, context) => {
    const { showReset } = context?.data || {};
    
    // Define standard actions
    const actions = {
      submit: {
        type: "submit",
        label: shape.submitButton?.label || "Save",
        primary: true,
        disabled: !shape.hasChanges
      },
      cancel: {
        type: "cancel",
        label: shape.cancelButton?.label || "Cancel",
        secondary: true
      }
    };
    
    // Add reset action if enabled
    if (showReset) {
      actions["reset"] = {
        type: "reset",
        label: shape.resetButton?.label || "Reset",
        secondary: true,
        disabled: !shape.hasChanges
      };
    }
    
    // Add action for reverting individual fields if tracking changes
    if (context?.data?.config?.trackChanges && shape.hasChanges) {
      actions["revertField"] = {
        type: "revertField",
        label: "Revert",
        secondary: true
      };
    }
    
    return {
      ...shape,
      actions: {
        ...(shape.actions || {}),
        ...actions
      }
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 2,
    description: "Generate standard actions for edit form"
  }
);