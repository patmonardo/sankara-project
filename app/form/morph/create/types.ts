import { FormShape, FormField, FormAction } from "../../schema/form";

/**
 * Represents a FormField tailored for the 'create' mode UI and logic.
 * Extends the base FormField with create-specific state and properties.
 */
export interface CreateField extends FormField {
  value: any; // Holds the initial value for the create form
  inputType: string; // Determined input type for UI rendering
  visible: boolean; // Resolved visibility for create mode (always true if included)
  disabled: boolean; // Resolved disabled state for create mode
  readOnly: boolean; // Resolved readOnly state for create mode
  meta: FormField["meta"] & {
    mode: "create";
    pristine: boolean; // Field hasn't been interacted with yet
    touched: boolean; // Field hasn't received focus/blur yet
  };
}

/**
 * Represents a FormShape tailored for the 'create' mode.
 * Extends the base FormShape, using CreateField[] and adding create-specific properties/metadata.
 */
export interface CreateOutput extends FormShape {
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
  };
}
