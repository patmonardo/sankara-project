import { createPipeline } from "../core";
import { FormShape } from "../../schema/form";
import {
  ViewOutput,
  ViewContext,
  isViewContext,
  GroupedViewOutput,
} from "./types";

// Import core view morphs
import { ShapeViewMorph, StyleViewMorph } from "./form";

// Import specialized morphs for different view transformations
import { TruncateTextMorph } from "./truncate";
import { DetailViewMorph } from "./expand";
import { GroupViewMorph } from "./groups";

/**
 * Complete pipeline for view form mode
 */
export const ViewPipeline = createPipeline<FormShape, GroupedViewOutput>(
  "ViewPipeline"
)
  .stage("prepare", "Transform schema to view structure")
  .pipe(ShapeViewMorph)
  .endStage()

  .stage("style", "Apply styling to view fields")
  .pipe(StyleViewMorph)
  .endStage()

  .stage("format", "Format and enhance field display")
  .pipe(TruncateTextMorph)
  .conditionally(
    (shape, context) =>
      context?.variant === "detail" || context?.showDetail === true,
    DetailViewMorph
  )
  .endStage()

  .stage("organize", "Organize fields for display")
  .pipe(GroupViewMorph)
  .endStage()

  .build({
    description:
      "Transforms a form schema into the structure needed for view mode UI",
    category: "form-mode",
    tags: ["form", "view", "ui", "pipeline"],
  });

/**
 * Generate a view from a form schema
 *
 * This is the main entry point for view generation.
 */
export function generateView(
  shape: FormShape,
  context: ViewContext
): GroupedViewOutput {
  if (!shape) {
    throw new Error("No shape provided to generateView");
  }

  if (!isViewContext(context)) {
    throw new Error("generateView requires a valid ViewContext");
  }

  try {
    // Run the pipeline
    return ViewPipeline.run(shape, context);
  } catch (error) {
    console.error("Error generating view:", error);

    if (error instanceof Error) {
      throw new Error(`View generation failed: ${error.message}`);
    } else {
      throw new Error("View generation failed with unknown error");
    }
  }
}

/**
 * Export function for programmatic usage
 */
export function viewFormFromSchema(
  schema: FormShape,
  options: Partial<ViewContext> = {}
): GroupedViewOutput {
  // Create a properly formed context
  const context: ViewContext = {
    mode: "view",
    variant: options.variant || "standard",
    includeFields: options.includeFields,
    excludeFields: options.excludeFields,
    data: options.data || {},
    title: options.title,
    description: options.description,
    showDetail: options.showDetail !== false,
    maxLength: options.maxLength || {
      short: 80,
      medium: 160,
      long: 500,
    },
    labelPosition: options.labelPosition || "top",
    sectionLayout: options.sectionLayout || "default",
    ...options,
  };

  // Run the pipeline
  return generateView(schema, context);
}
