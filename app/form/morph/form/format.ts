import { FormExecutionContext } from "../../schema/context";
import { FormShape, FormField, FormContext } from "./types";
import { FormOption } from "../../schema/shape";
import { createMorph } from "../core";

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
export type FormatType =
  | "jsx"
  | "json"
  | "text"
  | "csv"
  | "html"
  | "markdown"

/**
 * Base formatted view output
 */
export interface FormattedFormShape {
  id: string;
  format: FormatType;
  content: any;
  meta?: Record<string, any>;
}

/**
 * JSX formatted view
 */
export interface JSXFormShape extends FormattedFormShape {
  format: "jsx";
  content: {
    component: "Form"; // Or a more specific component name if applicable
    props: {
      id: string;
      fields?: FormField[]; // Make fields optional
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
export interface JSONFormShape extends FormattedFormShape {
  format: "json";
  content: string; // JSON string
}

/**
 * Text formatted view
 */
export interface TextFormShape extends FormattedFormShape {
  format: "text";
  content: string;
}

/**
 * CSV formatted view
 */
export interface CSVFormShape extends FormattedFormShape {
  format: "csv";
  content: string;
  headers?: string[];
}

/**
 * HTML formatted view
 */
export interface HTMLFormShape extends FormattedFormShape {
  format: "html";
  content: string;
}

/**
 * Markdown formatted view
 */
export interface MarkdownFormShape extends FormattedFormShape {
  format: "markdown";
  content: string;
}

/**
 * Union type of all formatted outputs
 */
export type AnyFormattedFormShape =
  | JSXFormShape
  | JSONFormShape
  | TextFormShape
  | CSVFormShape
  | HTMLFormShape
  | MarkdownFormShape

/**
 * Convert view output to a specific format
 */
export const FormatMorph = createMorph<
  FormShape,
  FormShape
>(
  "FormatMorph",
  (shape, context) => {
    // Handle either FormShape or GroupedFormShape
    if ("groups" in view) {
      // It's a GroupedFormShape - extract fields from all groups
      const fields = view.groups.flatMap((group) => group.fields);
      return formatOutput({ ...shape, fields }, context);
    } else {
      // It's a regular FormShape
      return formatOutput(shape, context);
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
  shape: FormShape,
  context: FormContext
): AnyFormattedFormShape {
  const format = context.data?.formatOptions.outputFormat || "jsx";

  // Delegate to specific formatter based on requested format
  switch (format) {
    case "jsx":
      return formatAsJSX(shape, context);
    case "json":
      return formatAsJSON(shape, context);
    case "text":
      return formatAsText(shape, context);
    case "csv":
      return formatAsCSV(shape, context);
    case "html":
      return formatAsHTML(shape, context);
    case "markdown":
      return formatAsMarkdown(shape, context);
    default:
      throw new Error(`Unsupported view format: ${format}`);
  }
}

/**
 * Format view as JSX
 */
function formatAsJSX(shape: FormShape, context: FormContext): JSXFormShape {
  // Base props common to all FormShape types
  const baseProps = {
    id: view.id,
    meta: view.meta,
    className: context.className || "form-view",
    style: context.style || {},
  };

  let finalProps: JSXFormShape["content"]["props"];

  // Check if the input view has groups (likely a GroupedFormShape)
  if ("groups" in view && Array.isArray((view as any).groups)) {
    // If it has groups, use groups instead of fields
    finalProps = {
      ...baseProps,
      groups: (view as any).groups as FieldGroup[], // Cast groups
      // fields: undefined, // Explicitly undefined if needed, or just omit
    };
  } else {
    // Otherwise, assume it has fields (standard FormShape)
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
      component: "Form", // Consider if this component can handle both fields and groups
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
function formatAsJSON(shape: FormShape, context: FormContext): JSONFormShape {
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
function formatAsText(shape: FormShape, context: FormContext): TextFormShape {
  // Create text representation
  let content = `Form: ${view.id}\n\n`;

  // Add title and description if available
  if (view.title) {
    content += `${view.title}\n`;
    if (view.description) {
      content += `${view.description}\n`;
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
function formatAsCSV(shape: FormShape, context: FormContext): CSVFormShape {
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
function formatAsHTML(shape: FormShape, context: FormContext): HTMLFormShape {
  // Create HTML representation
  let content = `<div class="form-view" id="form-${view.id}">\n`;

  // Add title and description if available
  if (view.title) {
    content += `  <h2>${escapeHTML(view.title)}</h2>\n`;
    if (view.description) {
      content += `  <p class="description">${escapeHTML(
        view.description
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
  shape: FormShape,
  context: FormContext
): MarkdownFormShape {
  // Create markdown representation
  let content = `# Form: ${view.id}\n\n`;

  // Add title and description if available
  if (view.title) {
    content += `## ${view.title}\n\n`;
    if (view.description) {
      content += `_${view.description}_\n\n`;
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
function formatFieldValueAsText(field: FormField): string {
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

function formatFieldValueAsHTML(field: FormField): string {
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

function formatFieldValueAsMarkdown(field: FormField): string {
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
