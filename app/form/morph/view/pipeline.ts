
/**
 * Complete pipeline for view mode
 */
export const ViewProcessorPipeline = createPipeline<FormShape, any>("ViewProcessorPipeline") // Replace 'any' with ViewOutput type
  .pipe(PrepareViewMorph) // Example morph
  .pipe(ViewProcessorMorph) // Example morph
  .build({
    description: "Transforms a form schema into the structure needed for view mode UI",
    category: "form-mode",
    tags: ["form", "view", "ui", "pipeline"],
    inputType: "FormShape",
    outputType: "ViewOutput" // Define this type
  });