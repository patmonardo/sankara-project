import { FormShape, FormMode } from "../schema/form";
import { MorpheusContext } from "../schema/context";
import { ViewProcessorPipeline } from "./view/processor";
import { CreateModePipeline } from "./create/actions";
import { EditModePipeline } from "./edit/actions";
import { morpheus } from "../modality/morpheus";

/**
 * Apply the specified mode to a form
 */
export function applyFormMode(
  form: FormShape,
  mode: FormMode,
  context: MorpheusContext
): FormShape {
  // Validate inputs
  if (!form) {
    throw new Error("Invalid form provided to applyFormMode");
  }
  
  if (!mode) {
    throw new Error("Invalid mode provided to applyFormMode");
  }
  
  // Ensure mode is consistent in context
  const modeContext = {
    ...context,
    mode: mode
  };
  
  // Apply the appropriate mode
  try {
    switch (mode) {
      case "view":
        return ViewProcessorPipeline.apply(form, modeContext);
        
      case "create":
        return CreateModePipeline.apply(form, modeContext);
        
      case "edit":
        return EditModePipeline.apply(form, modeContext);
        
      default:
        console.warn(`Unknown mode: ${mode}, falling back to view mode`);
        return ViewProcessorPipeline.apply(form, { ...modeContext, mode: "view" });
    }
  } catch (error) {
    console.error(`Error applying ${mode} mode:`, error);
    
    // Return original form with error metadata
    return {
      ...form,
      meta: {
        ...(form.meta || {}),
        error: {
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
          mode: mode
        }
      }
    };
  }
}

// Register all pipelines with Morpheus
morpheus.register(ViewProcessorPipeline, {
  description: "Process view forms with all view transformations",
  category: "form-mode",
  tags: ["view", "form", "display"],
  inputType: "FormShape",
  outputType: "ViewOutput"
});

morpheus.register(CreateModePipeline, {
  description: "Transform forms into create mode",
  category: "form-mode", 
  tags: ["create", "form", "input"],
  inputType: "FormShape",
  outputType: "CreateOutput"
});

morpheus.register(EditModePipeline, {
  description: "Transform forms into edit mode",
  category: "form-mode",
  tags: ["edit", "form", "input"],
  inputType: "FormShape",
  outputType: "EditOutput"
});

// Export all mode-specific components
export * from "./view/processor";
export * from "./create/base";
export * from "./create/actions";
export * from "./edit/base";
export * from "./edit/actions";