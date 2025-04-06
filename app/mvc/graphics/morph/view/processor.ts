import { ViewContext } from "../../schema/context";
import { createPipeline } from "../pipeline";
import { ViewOutput } from "./display";
import { TruncateTextMorph } from "./truncate";
import { DetailViewMorph } from "./detail";
import { GroupedViewMorph } from "./group";

/**
 * Complete view processor pipeline that combines all view transformations
 * Order matters:
 * 1. Truncate text (operates on raw field values)
 * 2. Add details (augments fields with detail information)
 * 3. Group fields (organizes fields into logical groups)
 */
export const ViewProcessorPipeline = createPipeline<ViewOutput>("ViewProcessorPipeline")
  .pipe(TruncateTextMorph)
  .pipe(DetailViewMorph)
  .pipe(GroupedViewMorph)
  .build({
    description: "Process view data with all available view transformations",
    category: "view",
    tags: ["view", "process", "pipeline"],
    inputType: "ViewOutput",
    outputType: "GroupedViewOutput" // The final output type
  });

/**
 * Process view data with all available transformations based on context configuration
 * The return type is GroupedViewOutput since that's what the pipeline produces
 */
export function processView(
  view: ViewOutput,
  context: ViewContext
): GroupedViewOutput {  
  // Simple validation
  if (!view) throw new Error("No view data provided to processView");
  if (!context) throw new Error("No context provided to processView");
  
  try {
    // Apply transformations based on context configuration
    // Fixed: Ensure no typo in pipeline name
    return ViewProcessorPipeline.apply(view, context);
  } catch (error) {
    console.error("Error processing view:", error);
    
    // Return a minimal valid GroupedViewOutput with error metadata
    return {
      ...view,
      groups: [],  // Add required groups property for GroupedViewOutput
      meta: {
        ...view.meta,
        error: {
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        },
        grouping: {  // Add required grouping metadata
          enabled: false,
          count: 0
        }
      }
    };
  }
}

// Register with Morpheus
import { morpheus } from "../../modality/morpheus";

morpheus.register(ViewProcessorPipeline, {
  description: "Complete view processor combining all view transformations",
  category: "view",
  tags: ["view", "process", "composite"],
  inputType: "ViewOutput",
  outputType: "GroupedViewOutput"
});