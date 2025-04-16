import { createPipeline } from "../morph";

/**
 * Complete pipeline for edit mode
 */
export const EditModePipeline = createPipeline<FormShape, any>("EditModePipeline") // Replace 'any' with EditOutput type
  .pipe(PrepareEditMorph) // Example morph
  .pipe(EditUIElementsMorph) // Example morph
  .build({
    description: "Transforms a form schema into the structure needed for edit mode UI",
    category: "form-mode",
    tags: ["form", "edit", "ui", "pipeline"],
    inputType: "FormShape",
    outputType: "EditOutput" // Define this type
  });
