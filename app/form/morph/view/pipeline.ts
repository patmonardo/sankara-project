import { FormShape, FormField } from "../../schema/form";
import { ViewContext, isViewContext } from "../mode";
import { createPipeline, createMorph } from "../morph";
import {
  determineDisplayType,
  shouldIncludeField,
  extractFieldValue,
  getFieldLabel,
} from "./extract";
import { getDefaultFormat, formatValueForDisplay } from "./format";

// --- Define Core View Interfaces ---
// (ViewField and ViewOutput interfaces remain as before)
export interface ViewField {
  id: string;
  type: string;
  label: string;
  value?: any;
  displayValue?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  visible?: boolean;
  format?: string;
  meta?: {
    mode?: "view";
    styles?: Record<string, any>;
    originalType?: string;
    validationState?: "idle" | "error" | "success";
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ViewOutput {
  id: string;
  fields: ViewField[];
  mode: "view";
  format?: string;
  meta?: {
    title?: string;
    description?: string;
    styles?: Record<string, any>;
    [key: string]: any;
  };
}

/**
 * Determine field state based on validation status.
 * Assumes field.validation might exist.
 */
export function determineFieldState(
  field: FormField | ViewField
): "idle" | "error" | "success" {
  // Check validation structure safely
  const errors = (field as any).validation?.errors; // Use any temporarily if validation structure varies
  const isValid = (field as any).validation?.valid;

  if (Array.isArray(errors) && errors.length > 0) {
    return "error";
  }
  if (isValid === true) {
    return "success";
  }
  return "idle";
}

/**
 * Process a single FormField into a ViewField for display.
 * Rewritten for clarity.
 */
export function processFieldForView(
  field: FormField,
  context: ViewContext // Requires ViewContext for view-specific settings
): ViewField {
  // 1. Extract basic info & raw value
  const fieldId = field.id;
  const originalType = field.type; // The type defined in the schema
  const rawValue = extractFieldValue(field, context); // Gets value from context.data or defaultValue
  const label = getFieldLabel(field);

  // 2. Determine display characteristics
  const displayType = determineDisplayType(field); // e.g., 'text', 'number', 'date', 'lookup'
  const format = field.format || getDefaultFormat(originalType); // Resolved format string
  const validationState = determineFieldState(field); // 'idle', 'error', 'success'

  // 3. Format the raw value into a user-friendly display string
  // Uses originalType to apply correct formatting rules (date, number, lookup etc.)
  const displayValue = formatValueForDisplay(
    rawValue,
    format,
    originalType,
    field.options
  );

  // 4. Generate styles based on display type and context
  // Requires ViewContext for properties like variant
  //const styles = defineFieldStyles(displayType, "view", {
  //  state: validationState,
  //  variant: context.variant, // Example: uses context.variant
  // });

  // 5. Construct the final ViewField object
  const viewField: ViewField = {
    // Core display properties
    id: fieldId,
    label: label,
    value: rawValue, // Keep the original value
    displayValue: displayValue, // The formatted string for display
    type: displayType, // The determined type for UI rendering hints
    format: format, // The format string used

    // Copy relevant metadata/state from FormField
    description: field.description,
    placeholder: field.placeholder,
    required: field.required,
    disabled: field.disabled, // Field might be disabled even in view mode
    options: field.options, // Pass options along for potential UI use

    // Set view-specific properties
    readOnly: true, // Always read-only in view mode
    visible: field.visible !== false, // Based on FormField visibility

    // Construct meta object for additional info
    meta: {
      ...(field.meta || {}), // Spread original field meta
      mode: "view", // Indicate the mode
      // styles: styles, // Calculated styles
      originalType: originalType, // Store the original schema type
      validationState: validationState, // Store validation state
    },
  };

  return viewField;
}

/**
 * Initializes a FormShape for view mode (Shape -> ViewOutput).
 */
export const ShapeViewMorph = createMorph<FormShape, ViewOutput>(
  "ShapeViewMorph",
  (shape, context) => {
    // Context here is FormExecutionContext initially
    if (!shape || !Array.isArray(shape.fields)) {
      throw new Error("Invalid form shape provided to ShapeViewMorph");
    }
    // Ensure context is ViewContext before proceeding
    if (!isViewContext(context)) {
      throw new Error("ShapeViewMorph requires a valid ViewContext.");
    }
    // const viewContext = context; // Type is now narrowed to ViewContext

    // Use the rewritten processFieldForView and imported shouldIncludeField
    const fields: ViewField[] = shape.fields
      .filter((field) => shouldIncludeField(field, context)) // Pass narrowed context
      .map((field) => processFieldForView(field, context)); // Pass narrowed context

    // Construct the initial ViewOutput
    const output: ViewOutput = {
      id: shape.id,
      fields,
      mode: "view",
      meta: {
        ...(shape.meta || {}), // Spread meta from FormShape
        // Use context title/desc first, fallback to shape's
        title: context.title || shape.title,
        description: context.description || shape.description,
        // Optionally add context info used
        contextUsed: {
          variant: context.variant,
          includeFields: context.includeFields,
          excludeFields: context.excludeFields,
        },
      },
      // format property on ViewOutput might be redundant if handled by ViewFormatMorph later
      // format: context.outputFormat || "default",
    };
    return output;
  },
  { pure: true, fusible: true, cost: 3, memoizable: true }
);

// --- View System Pipeline Definition ---
import { StyleViewMorph } from "./display";
import { TruncateTextMorph, TruncatedViewOutput } from "./truncate";
import { DetailViewMorph, DetailViewOutput } from "./detail";
import { GroupedViewMorph, GroupedViewOutput } from "./group";

export const ViewSystemPipeline = createPipeline<FormShape>(
  "ViewSystemPipeline"
)
  // 1. Prepare the basic ViewOutput from FormShape
  .pipe<ViewOutput>(ShapeViewMorph) // Output: ViewOutput

  // 2. Apply base styling
  .pipe<ViewOutput>(StyleViewMorph) // Input: ViewOutput, Output: ViewOutput

  // 3. Apply view-specific field transformations
  .pipe<TruncatedViewOutput>(TruncateTextMorph) // Input: ViewOutput, Output: TruncatedViewOutput
  .pipe<DetailViewOutput>(DetailViewMorph) // Input: TruncatedViewOutput, Output: DetailViewOutput

  // 4. Group fields for final presentation
  .pipe<GroupedViewOutput>(GroupedViewMorph) // Input: DetailViewOutput, Output: GroupedViewOutput

  // Build the final pipeline
  .build({
    description:
      "Complete View system transformation pipeline: Prepare, Style, Truncate, Detail, Group",
    category: "form-mode",
    tags: ["form", "view", "ui", "pipeline", "system"],
    inputType: "FormShape",
    outputType: "ViewOutput", // Final output type
  });

/**
 * Processes a FormShape into a GroupedViewOutput using the full ViewSystemPipeline.
 */
export function generateView(
  shape: FormShape,
  context: ViewContext
): GroupedViewOutput {
  if (!shape) throw new Error("No shape provided to generateView");
  if (!isViewContext(context)) {
    throw new Error("generateView requires a valid ViewContext.");
  }

  try {
    // Apply the pipeline - the return type is inferred from the last step
    return ViewSystemPipeline.apply(shape, context);
  } catch (error) {
    console.error("Error generating view:", error);
    // Consider more specific error handling or returning an error state object
    throw error; // Re-throw for now
  }
}
