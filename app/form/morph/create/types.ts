import { FormShape, FormField, FormAction } from "../../schema/form";
import { FormExecutionContext } from "../../schema/context";

/**
 * Represents a FormShape tailored for the 'create' mode.
 */
export interface CreateFormShape extends FormShape {
  fields: CreateFormField[];
  mode: "create";
  isNew: true;
  valid: boolean;
  complete: boolean;
  actions?: FormAction[];
  submitButton?: { label: string; position: "top" | "bottom" | "both" };
  cancelButton?: { label: string; position: "top" | "bottom" | "both" };
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
 * Represents a FormField tailored for the 'create' mode UI and logic.
 */
export interface CreateFormField extends FormField {
  value: any; // Holds the initial value for the create form
  inputType: string; // Determined input type for UI rendering
  visible: boolean; // Resolved visibility for create mode (always true if included)
  disabled: boolean; // Resolved disabled state for create mode
  readOnly: boolean; // Resolved readOnly state for create mode
  validationMessages?: Record<string, string[]>;
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
 * Template data for form creation
 */
export interface CreateFormTemplate {
  id: string;
  name: string;
  description?: string;
  values: Record<string, any>;
  meta?: Record<string, any>;
}

/**
 * Context for form creation operations
 */
export interface CreateFormContext extends FormExecutionContext {
  id: string;
  timestamp: number;
  operation: "create";
  data: {
    // Initial values for fields
    initialValues?: Record<string, any>;
    
    // Field filtering
    includeFields?: string[];
    excludeFields?: string[];
    
    // UI configuration
    submitLabel?: string;
    cancelLabel?: string;
    showCancel?: boolean;
    showReset?: boolean;
    buttonPosition?: "top" | "bottom" | "both";

    // Behavior configuration
    config?: {
      validateOnChange?: boolean;
      validateOnBlur?: boolean;
      validateOnSubmit?: boolean;
      submitOnEnter?: boolean;
      showLabels?: boolean;
      showRequiredIndicator?: boolean;
      showValidationErrors?: boolean;
      trackChanges?: boolean;
      confirmDiscardChanges?: boolean;
      labelPosition?: "top" | "left" | "right";
    };
    
    // Template handling
    templateData?: CreateFormTemplate;
    templateOptions?: {
      preserveOriginalDefaults?: boolean;
      readOnlyFields?: string[];
      titlePrefix?: string;
      mergeStrategy?: 'preserve-existing' | 'smart-merge' | 'override';
    };
    
    // Customization options
    customization?: Record<string, any>;
  };
  
  // Optional additional namespaces
  meta?: Record<string, any>;
  ui?: Record<string, any>;
}

/**
 * Type guard to check if a context is a CreateFormContext
 */
export function isCreateFormContext(
  context: any
): context is CreateFormContext {
  return (
    context &&
    typeof context === "object" &&
    context.operation === "create" &&
    (
      (context.data && typeof context.data === "object") ||
      (context.config && typeof context.config === "object")
    )
  );
}
