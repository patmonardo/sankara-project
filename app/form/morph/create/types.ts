import { FormShape, FormField, FormAction } from "../../schema/form";

/**
 * Represents a FormField tailored for the 'create' mode UI and logic.
 */
export interface CreateField extends FormField {
  value: any; // Holds the initial value for the create form
  inputType: string; // Determined input type for UI rendering
  visible: boolean; // Resolved visibility for create mode (always true if included)
  disabled: boolean; // Resolved disabled state for create mode
  readOnly: boolean; // Resolved readOnly state for create mode
  
  // Optional custom component information
  component?: string;
  props?: Record<string, any>;
  
  meta: FormField["meta"] & {
    mode: "create";
    pristine: boolean; // Field hasn't been interacted with yet
    touched: boolean; // Field hasn't received focus/blur yet
    customized?: boolean;
    originalValues?: Partial<FormField>;
  };
}

/**
 * Represents a FormShape tailored for the 'create' mode.
 */
export interface CreateShape extends FormShape {
  fields: CreateField[];
  mode: "create";
  isNew: true;
  valid: boolean;
  complete: boolean;
  actions?: FormAction[];
  submitButton?: { label: string; position: 'top' | 'bottom' | 'both'; };
  cancelButton?: { label: string; position: 'top' | 'bottom' | 'both'; };
  clearOnSubmit?: boolean;
  meta: FormShape["meta"] & {
    mode: "create";
    timestamp: string;
    fieldsInitialized: string[];
    title?: string;
    customized?: boolean;
    customComponents?: string[];
  };
}

/**
 * Template data for form creation
 */
export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  values: Record<string, any>;
  meta?: Record<string, any>;
}

/**
 * Context for create mode operations
 */
export interface CreateContext {
  // Basic create context
  initialValues?: Record<string, any>;
  includeFields?: string[];
  excludeFields?: string[];
  submitLabel?: string;
  cancelLabel?: string;
  buttonPosition?: 'top' | 'bottom' | 'both';
  showCancel?: boolean;
  showReset?: boolean;
  
  // Custom field configuration
  customization?: {
    // Override field properties
    fieldConfigs?: Record<string, Partial<FormField>>;
    
    // Custom component mapping
    components?: Record<string, string>;
    
    // Field transformers for specific types
    fieldTransformers?: Record<string, (field: CreateField) => CreateField>;
    
    // Additional metadata
    metadata?: Record<string, any>;
  };

  // Template support
  template?: FormTemplate;
  
  // Template options
  templateOptions?: {
    preserveOriginalDefaults?: boolean;
    templateReadOnlyFields?: string[];
    mergeStrategy?: 'override' | 'preserve-existing' | 'smart-merge';
    titlePrefix?: string;
  };
}

/**
 * Type guard to check if a context is a CreateContext
 */
export function isCreateContext(context: any): context is CreateContext {
  return context && (
    context.initialValues !== undefined ||
    context.includeFields !== undefined ||
    context.excludeFields !== undefined ||
    context.submitLabel !== undefined ||
    context.cancelLabel !== undefined ||
    context.buttonPosition !== undefined ||
    context.showCancel !== undefined ||
    context.showReset !== undefined ||
    context.customization !== undefined
  );
}