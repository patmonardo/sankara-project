import { FormAction } from "../../schema/form"; // Import FormAction type
import { createMorph } from "../morph";
import { isCreateContext } from "../core/mode";
import { CreateShape } from "././types";

/**
 * Generates the standard form actions (Submit, Cancel, Reset) for create mode
 * based on properties directly within CreateContext.
 */
export const GenerateCreateActionsMorph = createMorph<CreateShape, CreateShape>(
  "GenerateCreateActionsMorph",
  (outputShape, context) => {
    // Safely access CreateContext properties
    const createContext = isCreateContext(context) ? context : undefined;

    // Determine button properties from context or use defaults
    const submitLabel = createContext?.submitLabel || "Create";
    const cancelLabel = createContext?.cancelLabel || "Cancel";
    const buttonPosition = createContext?.buttonPosition || "bottom";
    // Default to true if showReset/showCancel is undefined or null in context
    const showReset = createContext?.showReset !== false;
    const showCancel = createContext?.showCancel !== false;

    // Build the actions array
    const actions: FormAction[] = [];

    // Add Submit action
    actions.push({
      id: "submit",
      type: "submit",
      label: submitLabel,
      primary: true,
      disabled: false, // Typically enabled by default
      position: buttonPosition,
    });

    // Add Cancel action if enabled
    if (showCancel) {
      actions.push({
        id: "cancel",
        type: "button", // Use 'button' for generic handling, or a specific 'cancel' type if defined
        label: cancelLabel,
        primary: false,
        disabled: false,
        position: buttonPosition,
      });
    }

    // Add Reset action if enabled
    if (showReset) {
      actions.push({
        id: "reset",
        type: "reset",
        label: "Reset", // Default label for reset
        primary: false,
        disabled: false,
        position: buttonPosition,
      });
    }

    // Return the output shape with the generated actions array
    return {
      ...outputShape,
      actions: actions, // Set the actions property
      // No changes to meta.ui
    };
  },
  {
    // Morph properties
    pure: true, // Deterministic based on input shape and context
    fusible: true,
    cost: 1, // Low cost operation
    memoizable: true, // Result depends only on inputs
  }
);