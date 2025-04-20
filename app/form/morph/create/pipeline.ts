import { createPipeline } from "../morph";
import { FormShape } from "../../schema/form";
import { CreateMorph } from "./create";
import { GenerateCreateActionsMorph } from "./actions";
import { CustomizeFieldsMorph } from "./customize";
import { ApplyTemplateMorph } from "./template";

/**
 * Complete pipeline for create mode with all supported features.
 */
export const CreateModePipeline = createPipeline<FormShape>("CreateModePipeline")
  // Apply template if provided (before customization)
  .conditionally(
    (shape, context) => !!(context?.template),
    ApplyTemplateMorph
  )
  
  // Apply customizations if present in context
  .conditionally(
    (shape, context) => !!(context?.customization),
    CustomizeFieldsMorph
  )
  
  // Core create transformation
  .pipe(CreateMorph)
  
  // Add actions
  .pipe(GenerateCreateActionsMorph)
  
  .build({
    description: "Transforms a form schema into the structure needed for create mode UI",
    category: "form-mode",
    tags: ["form", "create", "ui", "pipeline"],
    inputType: "FormShape",
    outputType: "CreateShape",
  });