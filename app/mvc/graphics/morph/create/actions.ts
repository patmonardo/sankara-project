import { createMorph } from "../morph";
import { FormShape } from "../../schema/form";
import { MorpheusContext, isCreateContext } from "../../schema/context";
import { CreateOutput } from "./base";

/**
 * Add UI elements specific to create mode
 */
export const CreateUIElementsMorph = createMorph<CreateOutput, CreateOutput>(
  "CreateUIElementsMorph",
  (form, context) => {
    // Get create context options
    const createContext = isCreateContext(context) ? context : undefined;
    
    // Get button labels from context or use defaults
    const submitLabel = createContext?.submitLabel || "Create";
    const cancelLabel = createContext?.cancelLabel || "Cancel";
    const showReset = createContext?.showReset !== false;
    const showCancel = createContext?.showCancel !== false;
    
    // Return form with actions
    return {
      ...form,
      actions: [
        {
          id: "submit",
          type: "submit",
          label: submitLabel,
          primary: true,
          disabled: false
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
          primary: false
        }] : [])
      ],
      meta: {
        ...form.meta,
        ui: {
          ...(form.meta?.ui || {}),
          submitButton: {
            label: submitLabel,
            position: createContext?.buttonPosition || "bottom"
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

// export the create pipeline
import { createPipeline } from "../pipeline";

/**
 * Complete pipeline for create mode
 */
export const CreateModePipeline = createPipeline<FormShape>("CreateModePipeline")
  .pipe(PrepareCreateMorph)
  .pipe(CreateUIElementsMorph)
  .build({
    description: "Transform a form schema into create mode",
    category: "form",
    tags: ["form", "create", "ui"],
    inputType: "FormShape",
    outputType: "CreateOutput"
  });