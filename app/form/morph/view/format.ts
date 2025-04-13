import { SimpleMorph } from "../morph";
import { FormShape } from "../../schema/form";
import { FormExecutionContext, ViewContext } from "../../schema/context";
import { ViewOutput, ViewField } from "./display";

/**
 * Supported output formats
 */
export type ViewFormatType = 'jsx' | 'json' | 'text' | 'csv' | 'html' | 'markdown';

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
  format: 'jsx';
  content: {
    component: 'FormView';
    props: {
      id: string;
      fields: ViewField[];
      [key: string]: any;
    };
  };
}

/**
 * JSON formatted view
 */
export interface JSONViewOutput extends FormattedViewOutput {
  format: 'json';
  content: string; // JSON string or structured object based on config
}

/**
 * Text formatted view
 */
export interface TextViewOutput extends FormattedViewOutput {
  format: 'text';
  content: string;
}

/**
 * CSV formatted view
 */
export interface CSVViewOutput extends FormattedViewOutput {
  format: 'csv';
  content: string;
  headers?: string[];
}

/**
 * HTML formatted view
 */
export interface HTMLViewOutput extends FormattedViewOutput {
  format: 'html';
  content: string;
}

/**
 * Markdown formatted view
 */
export interface MarkdownViewOutput extends FormattedViewOutput {
  format: 'markdown';
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
  | MarkdownViewOutput;

/**
 * Convert view output to a specific format
 */
export const ViewFormatMorph = new SimpleMorph<ViewOutput, AnyFormattedViewOutput>(
  "ViewFormatMorph",
  (view, context: FormExecutionContext) => {
    // Validate input
    if (!view || !Array.isArray(view.fields)) {
      throw new Error("Invalid view output provided to ViewFormatMorph");
    }

    const viewContext = context as ViewContext;
    const format = viewContext.outputFormat || 'jsx';
    
    // Delegate to specific formatter based on requested format
    switch (format) {
      case 'jsx':
        return formatAsJSX(view, viewContext);
      case 'json':
        return formatAsJSON(view, viewContext);
      case 'text':
        return formatAsText(view, viewContext);
      case 'csv':
        return formatAsCSV(view, viewContext);
      case 'html':
        return formatAsHTML(view, viewContext);
      case 'markdown':
        return formatAsMarkdown(view, viewContext);
      default:
        throw new Error(`Unsupported view format: ${format}`);
    }
  },
  {
    pure: true,
    fusible: true,
    cost: 2,
    memoizable: true
  }
);

/**
 * Format view as JSX
 */
function formatAsJSX(view: ViewOutput, context: ViewContext): JSXViewOutput {
  // Create component props from view
  const props = {
    id: view.id,
    fields: view.fields,
    meta: view.meta,
    className: context.className || 'form-view',
    style: context.style || {}
  };
  
  // Add any groups if present in the view
  if ('groups' in view) {
    props.groups = (view as any).groups;
  }
  
  return {
    id: view.id,
    format: 'jsx',
    content: {
      component: 'FormView',
      props
    },
    meta: {
      ...view.meta,
      renderTime: new Date().toISOString()
    }
  };
}

/**
 * Format view as JSON
 */
function formatAsJSON(view: ViewOutput, context: ViewContext): JSONViewOutput {
  // Determine whether to stringify or keep as object
  const stringify = context.jsonStringify !== false;
  
  // Create clean object structure for JSON
  const jsonObj = {
    id: view.id,
    fields: view.fields.map(field => ({
      id: field.id,
      label: field.label,
      value: field.value,
      type: field.type,
      format: field.format
    })),
    meta: view.meta
  };
  
  return {
    id: view.id,
    format: 'json',
    content: stringify ? JSON.stringify(jsonObj, null, 2) : jsonObj,
    meta: {
      ...view.meta,
      renderTime: new Date().toISOString()
    }
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
    content += '\n';
  }
  
  // Add each field
  view.fields.forEach(field => {
    const value = formatFieldValueAsText(field);
    content += `${field.label}: ${value}\n`;
  });
  
  return {
    id: view.id,
    format: 'text',
    content,
    meta: {
      ...view.meta,
      renderTime: new Date().toISOString()
    }
  };
}

/**
 * Format view as CSV
 */
function formatAsCSV(view: ViewOutput, context: ViewContext): CSVViewOutput {
  // Determine headers
  const headers = ['id', 'label', 'value', 'type'];
  
  // Create CSV content
  let content = headers.join(',') + '\n';
  
  // Add each field as a row
  view.fields.forEach(field => {
    const value = formatFieldValueAsCSV(field.value);
    content += `${field.id},${escapeCSV(field.label)},${value},${field.type}\n`;
  });
  
  return {
    id: view.id,
    format: 'csv',
    content,
    headers,
    meta: {
      ...view.meta,
      renderTime: new Date().toISOString()
    }
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
      content += `  <p class="description">${escapeHTML(view.meta.description)}</p>\n`;
    }
  }
  
  // Add fields
  content += '  <dl class="field-list">\n';
  view.fields.forEach(field => {
    content += `    <dt>${escapeHTML(field.label)}</dt>\n`;
    content += `    <dd class="field-type-${field.type}">${formatFieldValueAsHTML(field)}</dd>\n`;
  });
  content += '  </dl>\n';
  
  // Close container
  content += '</div>';
  
  return {
    id: view.id,
    format: 'html',
    content,
    meta: {
      ...view.meta,
      renderTime: new Date().toISOString()
    }
  };
}

/**
 * Format view as Markdown
 */
function formatAsMarkdown(view: ViewOutput, context: ViewContext): MarkdownViewOutput {
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
  content += '| Field | Value | Type |\n';
  content += '| ----- | ----- | ---- |\n';
  
  view.fields.forEach(field => {
    const value = formatFieldValueAsMarkdown(field);
    content += `| **${field.label}** | ${value} | ${field.type} |\n`;
  });
  
  return {
    id: view.id,
    format: 'markdown',
    content,
    meta: {
      ...view.meta,
      renderTime: new Date().toISOString()
    }
  };
}

/**
 * Helper functions for formatting field values
 */
function formatFieldValueAsText(field: ViewField): string {
  const { value, type } = field;
  
  if (value === null || value === undefined) {
    return '(Empty)';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

function formatFieldValueAsCSV(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    return escapeCSV(JSON.stringify(value));
  }
  
  return escapeCSV(String(value));
}

function formatFieldValueAsHTML(field: ViewField): string {
  const { value, type } = field;
  
  if (value === null || value === undefined) {
    return '<em class="empty">(Empty)</em>';
  }
  
  if (type === 'boolean') {
    return value ? '✓ Yes' : '✗ No';
  }
  
  if (typeof value === 'object') {
    return `<pre class="json">${escapeHTML(JSON.stringify(value, null, 2))}</pre>`;
  }
  
  return escapeHTML(String(value));
}

function formatFieldValueAsMarkdown(field: ViewField): string {
  const { value, type } = field;
  
  if (value === null || value === undefined) {
    return '_Empty_';
  }
  
  if (type === 'boolean') {
    return value ? '✓ Yes' : '✗ No';
  }
  
  if (typeof value === 'object') {
    return '```json\n' + JSON.stringify(value, null, 2) + '\n```';
  }
  
  return String(value);
}

/**
 * Escape HTML special characters
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape CSV special characters
 */
function escapeCSV(str: string): string {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}