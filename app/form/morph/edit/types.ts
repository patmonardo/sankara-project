import { FormShape, FormField } from "../../schema/form";

/**
 * Edit form shape definition
 */
export interface EditFormShape extends FormShape {
  mode: "edit";
  isNew: false;
  originalValues: Record<string, any>;
  hasChanges: boolean;
  valid: boolean;
  complete: boolean;
  
  // Actions
  submitButton?: {
    label: string;
    position: "top" | "bottom" | "both";
  };
  
  cancelButton?: {
    label: string;
    position: "top" | "bottom" | "both";
  };
  
  resetButton?: {
    label: string;
    position: "top" | "bottom" | "both";
  };
  
  // Field extensions
  fields: EditFormField[];
  
  // Meta extensions
  meta: FormShape["meta"] & {
    mode: "edit";
    timestamp: string;
    fieldsInitialized: string[];
    title: string;
    changedFields?: string[];
  };
}

/**
 * Edit form field definition
 */
export interface EditFormField extends FormField {
  inputType: string;
  value: any;
  originalValue: any;
  visible: boolean;
  disabled: boolean;
  readOnly: boolean;
  hasChanged: boolean;
  
  meta: FormField["meta"] & {
    mode: "edit";
    pristine: boolean;
    touched: boolean;
    changed: boolean;
  };
}

/**
 * Edit form context definition
 */
export interface EditFormContext {
  id: string;
  timestamp: number;
  operation: "edit";
  data: {
    // Source values
    entityId?: string;
    currentValues: Record<string, any>;
    originalValues: Record<string, any>;
    
    // Field filtering
    includeFields?: string[];
    excludeFields?: string[];
    
    // UI configuration
    submitLabel?: string;
    cancelLabel?: string;
    showCancel?: boolean;
    showReset?: boolean;
    
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
    
    // Customization options
    customization?: Record<string, any>;
    
    // Template configuration
    template?: {
      id: string;
      name: string;
      description?: string;
      values: Record<string, any>;
    };
    
    templateOptions?: Record<string, any>;
  };
}

/**
 * Type guard for EditFormContext
 */
export function isEditFormContext(context: any): context is EditFormContext {
  return (
    context &&
    typeof context === "object" &&
    context.operation === "edit" &&
    typeof context.data === "object"
  );
}