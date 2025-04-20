import { FormField, FormShape } from "../../schema/form";
import { CreateContext } from "./types";

/**
 * Determine if a field should be included in create mode based on context and field metadata.
 */
export function shouldIncludeInCreate(field: FormField, context?: CreateContext): boolean {
  // Basic checks
  if (!field || !field.id) return false;
  if (field.visible === false) return false; // Explicitly hidden

  // Metadata checks
  if (field.meta?.excludeFromCreate) return false;
  if (field.meta?.editOnly) return false;
  if (field.meta?.createOnly) return true; // Explicitly included

  // Contextual checks
  if (context?.excludeFields?.includes(field.id)) return false;
  
  // This is the key change - check if includeFields exists and has entries
  if (context?.includeFields && context.includeFields.length > 0) {
    return context.includeFields.includes(field.id);
  }

  // Default: include if not explicitly excluded/hidden
  return true;
}

/**
 * Determine the appropriate input type for a field for UI rendering.
 */
export function determineInputType(field: FormField): string {
  // 1. If explicit inputType is provided, use it
  if (field.inputType) return field.inputType;

  // 2. Check for special formats in metadata
  if (field.meta) {
    // Check for specific formats
    if (field.meta.format === "email") return "email";
    if (field.meta.format === "password") return "password";
    if (field.meta.format === "url") return "url";
    if (field.meta.format === "tel") return "tel";
    
    // Check for multiline text
    if (field.meta.multiline === true) return "textarea";
    
    // Check for custom widget/renderer
    if (field.meta.widget) return field.meta.widget;
  }

  // 3. Map based on field type
  const typeToInputMap: Record<string, string> = {
    string: 'text',
    text: 'text',
    number: 'number',
    integer: 'number',
    float: 'number',
    decimal: 'number',
    boolean: 'checkbox',
    date: 'date',
    datetime: 'datetime-local',
    time: 'time',
    email: 'email',
    password: 'password',
    tel: 'tel',
    url: 'url',
    object: 'complex',
    array: 'complex',
    select: 'select',
    multiselect: 'select',
    radio: 'radio',
    checkbox: 'checkbox',
    file: 'file',
    color: 'color',
    range: 'range',
    hidden: 'hidden',
    default: 'text'
  };

  return typeToInputMap[field.type || 'default'] || typeToInputMap.default;
}

/**
 * Get a default value based on field type.
 */
export function getDefaultForType(type?: string): any {
  switch (type) {
    case "string": case "text": case "email": case "url": case "tel": case "password": return "";
    case "number": case "integer": case "float": case "decimal": return null;
    case "boolean": return false;
    case "date": case "datetime": case "time": return null;
    case "select": case "radio": return null;
    case "multiselect": case "checkbox": return [];
    case "object": return {};
    case "array": return [];
    default: return undefined;
  }
}

/**
 * Create a form from a template
 */
export function createFromTemplate(
  shape: FormShape,
  template: {
    id: string;
    name: string;
    values: Record<string, any>;
    description?: string;
  },
  options: {
    preserveOriginalDefaults?: boolean;
    templateReadOnlyFields?: string[];
    titlePrefix?: string;
    initialValues?: Record<string, any>;
    submitLabel?: string;
    cancelLabel?: string;
  } = {}
): CreateShape {
  // Prepare context with both template and standard options
  const context: CreateContext = {
    initialValues: options.initialValues,
    submitLabel: options.submitLabel,
    cancelLabel: options.cancelLabel,
    template: template,
    templateOptions: {
      preserveOriginalDefaults: options.preserveOriginalDefaults,
      templateReadOnlyFields: options.templateReadOnlyFields,
      titlePrefix: options.titlePrefix || 'New from',
      mergeStrategy: 'override'
    }
  };
  
  // Use the standard pipeline
  return CreateModePipeline.transform(shape, context);
}