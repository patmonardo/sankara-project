import { createMorph } from "../morph";
import { FormShape } from "../../schema/form";
import { FormExecutionContext, isEditContext } from "../../schema/context";
import { EditOutput, PrepareEditMorph } from "./base";

/**
 * Add UI elements specific to edit mode
 * 
 * This morph enhances an EditOutput shape with UI action elements
 * appropriate for editing contexts.
 */
export const EditUIElementsMorph = createMorph<EditOutput, EditOutput>(
  "EditUIElementsMorph",
  (shape, context) => {
    // Get edit context options
    const editContext = isEditContext(context) ? context : undefined;
    
    // Get button labels from context or use defaults
    const submitLabel = editContext?.submitLabel || "Save";
    const cancelLabel = editContext?.cancelLabel || "Cancel";
    const deleteLabel = editContext?.deleteLabel || "Delete";
    const showReset = editContext?.showReset !== false;
    const showCancel = editContext?.showCancel !== false;
    const showDelete = editContext?.showDelete || false;
    
    // Check if form has been changed
    const hasChanges = Array.isArray(shape.meta?.edit?.changedFields) && 
                      shape.meta.edit.changedFields.length > 0;
    
    // Return enhanced shape with actions
    return {
      ...shape,
      actions: [
        {
          id: "submit",
          type: "submit",
          label: submitLabel,
          primary: true,
          disabled: !hasChanges && editContext?.disableSaveIfUnchanged !== false
        },
        ...(showCancel ? [{
          id: "cancel",
          type: "button",
          label: cancelLabel,
          primary: false
        }] : []),
        ...(showReset ? [{
          id: "reset",
          type: "reset",
          label: "Reset",
          primary: false,
          disabled: !hasChanges
        }] : []),
        ...(showDelete ? [{
          id: "delete",
          type: "button",
          label: deleteLabel,
          primary: false,
          danger: true
        }] : [])
      ],
      meta: {
        ...shape.meta,
        ui: {
          ...(shape.meta?.ui || {}),
          hasChanges,
          submitButton: {
            label: submitLabel,
            position: editContext?.buttonPosition || "bottom",
            disabled: !hasChanges && editContext?.disableSaveIfUnchanged !== false
          }
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

// export the edit pipeline
import { createPipeline } from "../pipeline";

/**
 * Complete pipeline for edit mode
 * 
 * This pipeline transforms a FormShape into an EditOutput with
 * appropriate UI elements for editing.
 */
export const EditModePipeline = createPipeline<FormShape, EditOutput>("EditModePipeline")
  .pipe(PrepareEditMorph)
  .pipe(EditUIElementsMorph)
  .build({
    description: "Transform a form schema into edit mode with UI elements",
    category: "form",
    tags: ["form", "edit", "ui"],
    inputType: "FormShape",
    outputType: "EditOutput"
  });