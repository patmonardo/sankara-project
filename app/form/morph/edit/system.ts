import { FormShape } from "../../schema/form";
import { createPipeline } from "../morph";
import { PrepareEditMorph, EditOutput } from "./pipeline";
import { GenerateEditActionsMorph } from "./actions";
import { EditFieldsPipeline } from "./fields";
import { EditLayoutPipeline } from "./layout";
import { EditValidationPipeline } from "./validation";
import { EditStatePipeline } from "./state";

/**
 * Complete Edit System Pipeline
 * 
 * This pipeline brings together all aspects of the Edit system:
 * 1. Base preparation (PrepareEditMorph)
 * 2. Core field processing (EditCorePipeline)
 * 3. Layout optimization (EditLayoutPipeline)
 * 4. Validation processing (EditValidationPipeline)
 * 5. UI elements (EditUIElementsMorph)
 * 6. State management (EditStatePipeline)
 */
export const EditSystemPipeline = createPipeline<FormShape>("EditSystemPipeline")
  // Base preparation
  .pipe(PrepareEditMorph)
  
  // Core field processing
  .pipe(EditFieldsPipeline)
  
  // Layout optimization
  .pipe(EditLayoutPipeline)
  
  // Validation processing
  .pipe(EditValidationPipeline)
  
  // UI elements
  .pipe(GenerateEditActionsMorph)
  
  // State management
  .pipe(EditStatePipeline)
  
  .build({
    description: "Complete Edit system transformation pipeline",
    category: "form",
    tags: ["form", "edit", "system"],
    inputType: "FormShape",
    outputType: "EditOutput"
  });

/**
 * Edit System Exports
 * 
 * Export all edit-related morphisms and pipelines for external use
 */
export * from "./pipeline";
export * from "./actions";
export * from "./fields";
export * from "./layout";
export * from "./validation";
export * from "./state";