import fs from "fs";
import path from "path";
import { FormShape } from "../../schema/form";
import { ViewFormShape } from "./types";
import { generateViewForm } from "./generate";

/**
 * Handle view mode interactive shell
 */
export async function handleViewMode(options: any) {
  // Implementation for interactive mode
  console.log("Entering view mode...");

  // Load form schema
  const formData = options.file
    ? JSON.parse(fs.readFileSync(options.file, "utf8"))
    : { id: "default", name: "Default Form", fields: [] };

  // Load data
  const viewData = options.data
    ? JSON.parse(fs.readFileSync(options.data, "utf8"))
    : {};

  // Generate view form
  const viewForm = generateViewForm(formData, viewData, {
    config: {
      includeActions: true,
      formatValues: true,
    },
  });

  // Output or process the view form
  if (options.output) {
    fs.writeFileSync(
      options.output,
      JSON.stringify(viewForm, null, options.pretty ? 2 : undefined)
    );
    console.log(`View form written to ${options.output}`);
  } else {
    console.log(JSON.stringify(viewForm, null, options.pretty ? 2 : undefined));
  }

  return viewForm;
}

/**
 * Handle view form generation
 */
export async function handleViewForm(options: any) {
  try {
    // Read the form schema
    if (!options.file) {
      throw new Error("Form schema file is required");
    }
    const formData = JSON.parse(fs.readFileSync(options.file, "utf8"));

    // Read data - required for view mode
    if (!options.data) {
      throw new Error("Data file is required for view mode");
    }
    const data = JSON.parse(fs.readFileSync(options.data, "utf8"));

    // Create context
    const context: ViewFormContext = {
      id: `view-${formData.id || "form"}`,
      timestamp: Date.now(),
      operation: "view",
      data: {
        data,
        config: {
          includeActions: options.actions !== false,
          formatValues: options.format !== false,
          validateData: options.validate !== false,
        },
      },
    };

    // Run the pipeline
    const result = ViewFormPipeline.run(formData, context) as ViewFormShape;

    // Output result
    if (options.output) {
      const outputData = JSON.stringify(
        result,
        null,
        options.pretty ? 2 : undefined
      );
      fs.writeFileSync(options.output, outputData);
      console.log(`View form written to ${options.output}`);
    } else {
      console.log(JSON.stringify(result, null, options.pretty ? 2 : undefined));
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Error:", error);
    }
    process.exit(1);
  }
}

/**
 * Export form for direct usage from code
 */
export function exportViewForm(
  schema: FormShape,
  data: Record<string, any>,
  config?: any
): ViewFormShape {
  return generateViewForm(schema, data, config);
}
