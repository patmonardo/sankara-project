import { SimpleMorph } from "../morph";
import { FormShape, FormField } from "../../schema/form";
import { CreateContext } from "../../schema/context";

/**
 * Create field output
 */
export interface CreateField {
  id: string;
  label: string;
  value: any;
  defaultValue: any;
  type: string;
  inputType: string;
  format?: string;
  readOnly: boolean;
  required: boolean;
  disabled: boolean;
  visible: boolean;
  placeholder?: string;
  validation?: {
    valid: boolean;
    errors?: string[];
  };
  meta?: Record<string, any>;
}

/**
 * Create form output
 */
export interface CreateOutput {
  id: string;
  fields: CreateField[];
  mode: "create";
  isNew: true;
  valid: boolean;
  complete: boolean;
  submitButton?: {
    label: string;
    position: 'top' | 'bottom' | 'both';
  };
  cancelButton?: {
    label: string;
    position: 'top' | 'bottom' | 'both';
  };
  clearOnSubmit?: boolean;
  meta?: Record<string, any>;
}

/**
 * Determine if a field should be included in create mode
 */
function shouldIncludeInCreate(field: FormField, context: CreateContext): boolean {
  if (field.meta?.excludeFromCreate) return false;
  if (field.meta?.editOnly) return false;
  if (field.meta?.createOnly) return true;
  
  if (context.excludeFields?.includes(field.id)) return false;
  if (context.includeFields?.includes(field.id)) return true;
  
  return field.visible !== false;
}

/**
 * Determine the appropriate input type for a field
 */
function determineInputType(field: FormField): string {
  const typeToInputMap: Record<string, string> = {
    string: 'text',
    number: 'number',
    boolean: 'checkbox',
    date: 'date',
    datetime: 'datetime-local',
    email: 'email',
    password: 'password',
    tel: 'tel',
    url: 'url',
    object: 'complex',
    array: 'complex',
    default: 'text'
  };
  
  return field.inputType || typeToInputMap[field.type] || typeToInputMap.default;
}

/**
 * Generate an ID for a new form
 */
function generateId(baseId: string, context: CreateContext): string {
  const prefix = context.idPrefix || 'new';
  const timestamp = Date.now();
  return `${prefix}-${baseId}-${timestamp}`;
}

/**
 * Process a field for create mode
 */
function processFieldForCreate(field: FormField, context: CreateContext): CreateField {
  const value = context.data?.[field.id] ?? field.defaultValue ?? null;
  
  return {
    id: field.id,
    label: field.label || field.id,
    value,
    defaultValue: field.defaultValue ?? null,
    type: field.type,
    inputType: determineInputType(field),
    format: field.format,
    readOnly: field.readOnly || false,
    required: field.required || false,
    disabled: field.disabled || false,
    visible: field.visible !== false,
    placeholder: field.placeholder || '',
    meta: {
      ...field.meta,
      help: field.help,
      options: field.options,
      // Add creation-specific metadata
      creation: {
        timestamp: Date.now(),
        source: context.source || 'direct'
      }
    }
  };
}

/**
 * Calculate form validity state
 */
function calculateFormValidity(fields: CreateField[]): boolean {
  return fields.every(field => !field.validation?.errors);
}

/**
 * Calculate form completion state (all required fields filled)
 */
function calculateFormCompletion(fields: CreateField[]): boolean {
  return fields
    .filter(field => field.required)
    .every(field => field.value !== undefined && field.value !== null && field.value !== '');
}

/**
 * The core create morphism
 */
export const ShapeCreateMorph = new SimpleMorph<FormShape, CreateOutput>(
  "ShapeCreateMorph",
  (shape, context: CreateContext) => {
    // Validate input
    if (!shape || !Array.isArray(shape.fields)) {
      throw new Error("Invalid form shape provided to ShapeCreateMorph");
    }
    
    // Process fields for creation
    const fields = shape.fields
      .filter(field => shouldIncludeInCreate(field, context))
      .map(field => processFieldForCreate(field, context));
    
    // Calculate form state
    const valid = calculateFormValidity(fields);
    const complete = calculateFormCompletion(fields);
    
    // Determine button labels and positions
    const submitLabel = context.submitLabel || 'Create';
    const cancelLabel = context.cancelLabel || 'Cancel';
    const buttonPosition = context.buttonPosition || 'bottom';
    
    return {
      id: generateId(shape.id, context),
      fields,
      mode: "create",
      isNew: true,
      valid,
      complete,
      submitButton: {
        label: submitLabel,
        position: buttonPosition
      },
      cancelButton: context.showCancel !== false ? {
        label: cancelLabel,
        position: buttonPosition
      } : undefined,
      clearOnSubmit: context.clearOnSubmit || false,
      meta: {
        ...shape.meta,
        title: context.title || `New ${shape.title || 'Form'}`,
        description: context.description || shape.description,
        createdAt: new Date().toISOString(),
        creator: context.userId,
        source: context.source || 'direct-creation'
      }
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 3,
    memoizable: false
  }
);