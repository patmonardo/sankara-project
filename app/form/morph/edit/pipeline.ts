import { createPipeline } from "../../morph/core";
import { FormShape } from "../../schema/form";
import { EditFormShape } from "./types";
import { 
  EditFormMorph, 
  FilterFieldsMorph, 
  SetupValidationMorph 
} from "./edit";
import { GenerateEditActionsMorph } from "./actions";

/**
 * Complete pipeline for edit form mode
 */
export const EditFormPipeline = createPipeline<FormShape, EditFormShape>(
  "EditFormPipeline"
)
  .stage("prepare", "Prepare the form schema")
    .conditionally(
      (shape, context) => !!(context?.data?.includeFields || context?.data?.excludeFields),
      FilterFieldsMorph
    )
  .endStage()
  
  .stage("transform", "Core transformation")
    .pipe(EditFormMorph)
  .endStage()
  
  .stage("enhance", "Post-processing")
    .pipe(GenerateEditActionsMorph)
    .conditionally(
      (shape, context) => context?.data?.config?.validateOnChange === true,
      SetupValidationMorph
    )
  .endStage()
  
  .build({
    description: "Transforms a form schema into the structure needed for edit mode UI",
    category: "form-mode",
    tags: ["form", "edit", "ui", "pipeline"],
  });