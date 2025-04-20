import { SimpleMorph } from "../morph";
import { FormExecutionContext } from "../../schema/context";
import { ViewContext } from "../core/mode";
import { ViewOutput, ViewField } from "./pipeline";
import { FieldGroup, GroupedViewOutput } from "./group";
import { FormOption } from "../../schema/form";

/**
 * Format a raw value for display based on type, format, and options.
 * (Keep the previously corrected version of this function here)
 */
export function formatValueForDisplay(
  value: any,
  format: string | undefined,
  type: string,
  options?: Array<FormOption>
): string {
  // ... (implementation from previous step - seems okay) ...
  if (value === null || value === undefined || value === "") {
    return "—"; // Consistent empty display
  }

  // Handle lookup types (select, radio, etc.)
  if (options && options.length > 0) {
    // Handle multi-select array values first
    if (Array.isArray(value)) {
      return value
        .map(
          (val) =>
            options.find((opt) => opt.value === val)?.label || String(val)
        )
        .filter((label) => label) // Remove potential undefined labels if value not found
        .join(", ");
    }
    // Handle single value
    const selectedOption = options.find((opt) => opt.value === value);
    if (selectedOption) {
      return selectedOption.label;
    }
    // Fallback if value doesn't match any option
    return String(value);
  }

  // Handle boolean
  if (type === "boolean") {
    // Allow format to override display (e.g., format="Enabled/Disabled")
    if (format && format.includes("/")) {
      const [trueLabel, falseLabel] = format.split("/", 2);
      return value ? trueLabel : falseLabel;
    }
    return value ? "Yes" : "No"; // Default
  }

  // Handle date/time
  if (type === "date" || type === "datetime" || type === "time") {
    try {
      // Ensure value is not already a Date object, which can cause issues with new Date()
      const dateValue = value instanceof Date ? value : new Date(value);
      if (isNaN(dateValue.getTime())) return String(value); // Invalid date

      // --- Relative Time (Placeholder) ---
      if (format === "relative") {
        return dateValue.toLocaleDateString(); // Fallback placeholder
      }
      // --- Standard Date/Time Formatting ---
      const dtStyleOpts: Intl.DateTimeFormatOptions = {};
      const validDateStyles = ["short", "medium", "long", "full"];
      const validTimeStyles = ["short", "medium", "long", "full"];
      const currentFormat = format || getDefaultFormat(type); // Use default if format is undefined

      if (type === "date" || type === "datetime") {
        dtStyleOpts.dateStyle = validDateStyles.includes(
          currentFormat || "short"
        )
          ? (currentFormat as Intl.DateTimeFormatOptions["dateStyle"])
          : "short";
      }
      if (type === "time" || type === "datetime") {
        // Use a different format string or a default for time if needed
        const timeFormat = currentFormat || "short";
        dtStyleOpts.timeStyle = validTimeStyles.includes(timeFormat)
          ? (timeFormat as Intl.DateTimeFormatOptions["timeStyle"])
          : "short";
      }
      // Handle cases where only date or time is requested for datetime type
      if (type === "datetime" && !dtStyleOpts.dateStyle)
        dtStyleOpts.dateStyle = "short";
      if (type === "datetime" && !dtStyleOpts.timeStyle)
        dtStyleOpts.timeStyle = "short";

      return new Intl.DateTimeFormat(undefined, dtStyleOpts).format(dateValue);
    } catch (e) {
      console.error("Error formatting date:", value, e);
      return String(value); // Fallback on error
    }
  }

  // Handle numbers (currency, percent)
  if (type === "number" || type === "currency" || type === "percent") {
    try {
      const num = Number(value);
      if (isNaN(num)) return String(value);

      const numStyleOpts: Intl.NumberFormatOptions = {};
      let precision: number | undefined = undefined;
      // Check if format is purely numeric for precision
      if (format && /^\d+$/.test(format)) {
        precision = parseInt(format, 10);
      }

      if (type === "currency") {
        numStyleOpts.style = "currency";
        // Use format for currency code if it's a 3-letter string, otherwise default
        numStyleOpts.currency =
          format && /^[A-Z]{3}$/i.test(format) ? format.toUpperCase() : "USD";
        if (precision !== undefined) {
          numStyleOpts.minimumFractionDigits = precision;
          numStyleOpts.maximumFractionDigits = precision; // Often good to set max too
        }
      } else if (type === "percent") {
        numStyleOpts.style = "percent";
        const digits = precision ?? 0; // Default 0 for percent
        numStyleOpts.minimumFractionDigits = digits;
        numStyleOpts.maximumFractionDigits = digits;
      } else {
        // Plain number
        if (precision !== undefined) {
          numStyleOpts.minimumFractionDigits = precision;
          numStyleOpts.maximumFractionDigits = precision;
        }
      }
      return new Intl.NumberFormat(undefined, numStyleOpts).format(num);
    } catch (e) {
      console.error("Error formatting number:", value, e);
      return String(value);
    }
  }

  // Handle complex types (object, array, json)
  if (typeof value === "object") {
    if (type === "array" && (format === "tags" || format === "chips")) {
      return Array.isArray(value) ? value.join(", ") : JSON.stringify(value);
    }
    // Basic JSON stringification for others, consider truncation or specific formatting
    try {
      return JSON.stringify(value);
    } catch (e) {
      console.error("Error stringifying object:", value, e);
      return "[Object]"; // Fallback for complex objects
    }
  }

  // Default: convert to string
  return String(value);
}

/**
 * Get a default format string based on field type.
 * (Seems okay, no changes needed for now)
 */
export function getDefaultFormat(type: string): string | undefined {
  switch (type) {
    case "date":
      return "short";
    case "datetime":
      return "medium";
    case "time":
      return "short";
    case "currency":
      return "USD";
    case "percent":
      return "0";
    default:
      return undefined;
  }
}

/**
 * Supported output formats
 */
export type ViewFormatType =
  | "jsx"
  | "json"
  | "text"
  | "csv"
  | "html"
  | "markdown"

/**
 * Base formatted view output
 */
export interface FormattedViewOutput {
  id: string;
  format: ViewFormatType;
  content: any;
  meta?: Record<string, any>;
}

/**
 * JSX formatted view
 */
export interface JSXViewOutput extends FormattedViewOutput {
  format: "jsx";
  content: {
    component: "FormView"; // Or a more specific component name if applicable
    props: {
      id: string;
      fields?: ViewField[]; // Make fields optional
      groups?: FieldGroup[]; // Add optional groups
      meta?: Record<string, any>; // Include meta
      className?: string; // Include styling props
      style?: Record<string, any>;
      [key: string]: any; // Allow other props
    };
  };
}

/**
 * JSON formatted view
 */
export interface JSONViewOutput extends FormattedViewOutput {
  format: "json";
  content: string; // JSON string
}

/**
 * Text formatted view
 */
export interface TextViewOutput extends FormattedViewOutput {
  format: "text";
  content: string;
}

/**
 * CSV formatted view
 */
export interface CSVViewOutput extends FormattedViewOutput {
  format: "csv";
  content: string;
  headers?: string[];
}

/**
 * HTML formatted view
 */
export interface HTMLViewOutput extends FormattedViewOutput {
  format: "html";
  content: string;
}

/**
 * Markdown formatted view
 */
export interface MarkdownViewOutput extends FormattedViewOutput {
  format: "markdown";
  content: string;
}

/**
 * Union type of all formatted outputs
 */
export type AnyFormattedViewOutput =
  | JSXViewOutput
  | JSONViewOutput
  | TextViewOutput
  | CSVViewOutput
  | HTMLViewOutput
  | MarkdownViewOutput

/**
 * Convert view output to a specific format
 */
export const FormatViewMorph = new SimpleMorph<
  ViewOutput | GroupedViewOutput,
  AnyFormattedViewOutput
>(
  "ViewFormatMorph",
  (view, context) => {
    // Handle either ViewOutput or GroupedViewOutput
    if ("groups" in view) {
      // It's a GroupedViewOutput - extract fields from all groups
      const fields = view.groups.flatMap((group) => group.fields);
      return formatOutput({ ...view, fields }, context);
    } else {
      // It's a regular ViewOutput
      return formatOutput(view, context);
    }
  },
  {
    pure: true,
    fusible: true,
    cost: 2,
    memoizable: true,
  }
);

function formatOutput(
  view: ViewOutput,
  context: FormExecutionContext
): AnyFormattedViewOutput {
  const viewContext = context as ViewContext;
  const format = viewContext.outputFormat || "jsx";

  // Delegate to specific formatter based on requested format
  switch (format) {
    case "jsx":
      return formatAsJSX(view, viewContext);
    case "json":
      return formatAsJSON(view, viewContext);
    case "text":
      return formatAsText(view, viewContext);
    case "csv":
      return formatAsCSV(view, viewContext);
    case "html":
      return formatAsHTML(view, viewContext);
    case "markdown":
      return formatAsMarkdown(view, viewContext);
    default:
      throw new Error(`Unsupported view format: ${format}`);
  }
}

/**
 * Format view as JSX
 */
function formatAsJSX(view: ViewOutput, context: ViewContext): JSXViewOutput {
  // Base props common to all ViewOutput types
  const baseProps = {
    id: view.id,
    meta: view.meta,
    className: context.className || "form-view",
    style: context.style || {},
  };

  let finalProps: JSXViewOutput["content"]["props"];

  // Check if the input view has groups (likely a GroupedViewOutput)
  if ("groups" in view && Array.isArray((view as any).groups)) {
    // If it has groups, use groups instead of fields
    finalProps = {
      ...baseProps,
      groups: (view as any).groups as FieldGroup[], // Cast groups
      // fields: undefined, // Explicitly undefined if needed, or just omit
    };
  } else {
    // Otherwise, assume it has fields (standard ViewOutput)
    finalProps = {
      ...baseProps,
      fields: view.fields,
      // groups: undefined, // Explicitly undefined if needed, or just omit
    };
  }

  return {
    id: view.id,
    format: "jsx",
    content: {
      component: "FormView", // Consider if this component can handle both fields and groups
      props: finalProps,
    },
    meta: {
      ...(view.meta || {}), // Ensure meta exists
      renderTime: new Date().toISOString(),
    },
  };
}

/**
 * Format view as JSON string.
 */
function formatAsJSON(view: ViewOutput, context: ViewContext): JSONViewOutput {
  // Determine if pretty-printing is desired (default to true for readability)
  const prettyPrint = context.jsonPrettyPrint !== false; // Changed context option name

  // Create the object structure to be stringified
  const jsonObj = {
    id: view.id,
    // Include meta if it exists
    ...(view.meta && { meta: view.meta }),
    // Map fields to a simpler structure for JSON output
    fields: view.fields.reduce((acc, field) => {
      // Use field ID as the key, store relevant properties
      acc[field.id] = {
        label: field.label,
        value: field.value, // Raw value
        displayValue: field.displayValue, // Formatted value if available
        type: field.type,
        format: field.format,
        // Optionally include meta per field if needed
        // ...(field.meta && { meta: field.meta }),
      };
      return acc;
    }, {} as Record<string, any>), // Use Record for key-value structure
  };

  // Always stringify the object
  const jsonString = prettyPrint
    ? JSON.stringify(jsonObj, null, 2) // Indented, readable JSON
    : JSON.stringify(jsonObj); // Compact JSON

  return {
    id: view.id,
    format: "json",
    content: jsonString, // Assign the generated JSON string
    meta: {
      ...(view.meta || {}), // Ensure meta exists before spreading
      renderTime: new Date().toISOString(),
      prettyPrinted: prettyPrint, // Add info about formatting
    },
  };
}

/**
 * Format view as plain text
 */
function formatAsText(view: ViewOutput, context: ViewContext): TextViewOutput {
  // Create text representation
  let content = `Form: ${view.id}\n\n`;

  // Add title and description if available
  if (view.meta?.title) {
    content += `${view.meta.title}\n`;
    if (view.meta?.description) {
      content += `${view.meta.description}\n`;
    }
    content += "\n";
  }

  // Add each field
  view.fields.forEach((field) => {
    const value = formatFieldValueAsText(field);
    content += `${field.label}: ${value}\n`;
  });

  return {
    id: view.id,
    format: "text",
    content,
    meta: {
      ...view.meta,
      renderTime: new Date().toISOString(),
    },
  };
}

/**
 * Format view as CSV
 */
function formatAsCSV(view: ViewOutput, context: ViewContext): CSVViewOutput {
  // Determine headers
  const headers = ["id", "label", "value", "type"];

  // Create CSV content
  let content = headers.join(",") + "\n";

  // Add each field as a row
  view.fields.forEach((field) => {
    const value = formatFieldValueAsCSV(field.value);
    content += `${field.id},${escapeCSV(field.label)},${value},${field.type}\n`;
  });

  return {
    id: view.id,
    format: "csv",
    content,
    headers,
    meta: {
      ...view.meta,
      renderTime: new Date().toISOString(),
    },
  };
}

/**
 * Format view as HTML
 */
function formatAsHTML(view: ViewOutput, context: ViewContext): HTMLViewOutput {
  // Create HTML representation
  let content = `<div class="form-view" id="form-${view.id}">\n`;

  // Add title and description if available
  if (view.meta?.title) {
    content += `  <h2>${escapeHTML(view.meta.title)}</h2>\n`;
    if (view.meta?.description) {
      content += `  <p class="description">${escapeHTML(
        view.meta.description
      )}</p>\n`;
    }
  }

  // Add fields
  content += '  <dl class="field-list">\n';
  view.fields.forEach((field) => {
    content += `    <dt>${escapeHTML(field.label)}</dt>\n`;
    content += `    <dd class="field-type-${
      field.type
    }">${formatFieldValueAsHTML(field)}</dd>\n`;
  });
  content += "  </dl>\n";

  // Close container
  content += "</div>";

  return {
    id: view.id,
    format: "html",
    content,
    meta: {
      ...view.meta,
      renderTime: new Date().toISOString(),
    },
  };
}

/**
 * Format view as Markdown
 */
function formatAsMarkdown(
  view: ViewOutput,
  context: ViewContext
): MarkdownViewOutput {
  // Create markdown representation
  let content = `# Form: ${view.id}\n\n`;

  // Add title and description if available
  if (view.meta?.title) {
    content += `## ${view.meta.title}\n\n`;
    if (view.meta?.description) {
      content += `_${view.meta.description}_\n\n`;
    }
  }

  // Add fields as a table
  content += "| Field | Value | Type |\n";
  content += "| ----- | ----- | ---- |\n";

  view.fields.forEach((field) => {
    const value = formatFieldValueAsMarkdown(field);
    content += `| **${field.label}** | ${value} | ${field.type} |\n`;
  });

  return {
    id: view.id,
    format: "markdown",
    content,
    meta: {
      ...view.meta,
      renderTime: new Date().toISOString(),
    },
  };
}

/**
 * Converts a string to Title Case
 * Example: "user_profile" -> "UserProfile"
 */
function toTitleCase(str: string): string {
  return str
    .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
    .replace(/\w\S*/g, (word) => {
      return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
    })
    .replace(/\s+/g, ''); // Remove spaces
}

/**
 * Helper functions for formatting field values
 */
function formatFieldValueAsText(field: ViewField): string {
  const { value, type } = field;

  if (value === null || value === undefined) {
    return "(Empty)";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatFieldValueAsCSV(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return escapeCSV(JSON.stringify(value));
  }

  return escapeCSV(String(value));
}

function formatFieldValueAsHTML(field: ViewField): string {
  const { value, type } = field;

  if (value === null || value === undefined) {
    return '<em class="empty">(Empty)</em>';
  }

  if (type === "boolean") {
    return value ? "✓ Yes" : "✗ No";
  }

  if (typeof value === "object") {
    return `<pre class="json">${escapeHTML(
      JSON.stringify(value, null, 2)
    )}</pre>`;
  }

  return escapeHTML(String(value));
}

function formatFieldValueAsMarkdown(field: ViewField): string {
  const { value, type } = field;

  if (value === null || value === undefined) {
    return "_Empty_";
  }

  if (type === "boolean") {
    return value ? "✓ Yes" : "✗ No";
  }

  if (typeof value === "object") {
    return "```json\n" + JSON.stringify(value, null, 2) + "\n```";
  }

  return String(value);
}

/**
 * Escape HTML special characters
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Escape CSV special characters
 */
function escapeCSV(str: string): string {
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
