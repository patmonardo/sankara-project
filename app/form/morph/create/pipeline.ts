import { createPipeline } from "../../morph/core";
import { FormShape } from "../../schema/form";
import { CreateFormShape } from "./types";

// Import all morphs from create.ts
import { 
  CreateFormMorph, 
  FilterFieldsMorph, 
  SetupValidationMorph 
} from "./create";

// Import other specialized morphs from their own files
import { GenerateCreateActionsMorph } from "./actions";
import { CustomizeFieldsMorph } from "./customize";
import { ApplyTemplateMorph } from "./template";

/**
 * Complete pipeline for create form mode
 */
export const CreateFormPipeline = createPipeline<FormShape, CreateFormShape>(
  "CreateFormPipeline"
)
  .stage("prepare", "Prepare the form schema")
    .conditionally(
      (shape, context) => !!(context?.data?.includeFields || context?.data?.excludeFields),
      FilterFieldsMorph
    )
  .endStage()
  
  .stage("template", "Apply template if provided")
    .conditionally(
      (shape, context) => !!(context?.data?.template),
      ApplyTemplateMorph
    )
  .endStage()
  
  .stage("customize", "Apply customizations")
    .conditionally(
      (shape, context) => !!(context?.data?.customization),
      CustomizeFieldsMorph
    )
  .endStage()
  
  .stage("transform", "Core transformation")
    .pipe(CreateFormMorph)
  .endStage()
  
  .stage("enhance", "Post-processing")
    .pipe(GenerateCreateActionsMorph)
    .conditionally(
      (shape, context) => context?.data?.config?.validateOnChange === true,
      SetupValidationMorph
    )
  .endStage()
  
  .build({
    description: "Transforms a form schema into the structure needed for create mode UI",
    category: "form-mode",
    tags: ["form", "create", "ui", "pipeline"],
  });