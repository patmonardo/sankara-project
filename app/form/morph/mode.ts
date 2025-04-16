import { FormMode, FormField, FormState } from "../schema/form";
import { FormExecutionContext } from "../schema/context";
import { EditField, EditOutput } from "./edit/pipeline";
import { TruncationConfig } from "./view/truncate";
import { GroupingConfig } from "./view/group";
import { DetailConfig } from "./view/detail";
import { SummaryConfig } from "./view/summary";
import { ViewFormatType } from "./view/format";

/**
 * Base interface for contexts specific to morph operations.
 * Extends the general FormExecutionContext.
 */
export interface MorphContext extends FormExecutionContext {
  // Could add common morph-related context properties here if needed
}

/**
 * Context specifically for 'sṛṣṭi' (create) morph operations.
 */
export interface CreateContext extends MorphContext {
  prakāra: "sṛṣṭi";

  // Data for creation
  initialValues?: Record<string, any>;

  // Configuration for UI/Morph behavior (optional)
  includeFields?: string[];
  excludeFields?: string[];
  idPrefix?: string;
  submitLabel?: string;
  cancelLabel?: string;
  buttonPosition?: "top" | "bottom" | "both";
  showCancel?: boolean;
  showReset?: boolean;
  clearOnSubmit?: boolean;
  title?: string;
  description?: string; // Overrides shape description if provided
  userId?: string; // ID of the user performing the creation
  source?: string; // Origin of the creation request
}

/**
 * Structure for persistence-related state passed via context.
 */
export interface PersistenceContextState {
  lastSaved?: string | Date;
  autoSaveEnabled?: boolean;
  saveAttempts?: number;
  saveHistory?: Array<{
    timestamp: string | Date;
    success: boolean;
    error?: string;
  }>;
}

type FieldValidationRule = (
  field: EditField,
  shape: EditOutput,
  context?: any
) => string[] | undefined;

/**
 * Context specifically for 'pariṇāma' (edit) morph operations.
 */
export interface EditContext extends MorphContext {
  prakāra?: "pariṇāma"; // Ensure mode is edit

  // Identifier for the entity being edited
  targetId: string;

  // Data for editing (e.g., fetched current values)
  data?: Record<string, any>;

  // Configuration for UI/Morph behavior (optional)
  includeFields?: string[];
  excludeFields?: string[];
  submitLabel?: string;
  saveLabel?: string;
  cancelLabel?: string;
  deleteLabel?: string;
  showCancel?: boolean;
  showReset?: boolean;
  showDelete?: boolean;
  buttonPosition?: "top" | "bottom" | "both";
  trackChanges?: boolean;
  disableSaveIfUnchanged?: boolean;
  title?: string;
  description?: string;
  userId?: string;
  source?: string;

  // --- Field processing inputs (optional) ---
  readOnlyFields?: string[]; // IDs of fields that should be forced read-only
  trackHistory?: boolean; // Enable/disable field change history tracking (defaults to true)
  // --- End Field processing inputs ---

  validateAllFields?: boolean; // Should all fields be validated on submit?
  validationRules?: Record<string, FieldValidationRule>;

  // State management inputs (optional)
  formState?: Partial<FormState>; // For external state updates (e.g., submitting, success)
  persistenceState?: PersistenceContextState; // For persistence tracking info

  // Tool-specific inputs (optional) - like the refactor operations
  tools?: {
    refactor?: {
      operations: any[]; // Define specific operation types later
    };
    globalTransform?: {
      fieldPattern: string | RegExp;
      transform: (
        field: FormField,
        shape: EditOutput,
        context: EditContext
      ) => FormField;
      options?: any;
    };
  };

  // Layout inputs (optional)
  expandChangedSections?: boolean;
}

/**
 * Context specifically for 'darśana' (view) morph operations.
 */

export interface ViewContext extends MorphContext {
  mode: "view";
  title?: string;
  description?: string;
  userId?: string;
  source?: string;
  format?: string;
  truncation?: TruncationConfig;
  variant?: "default" | "card" | "compact" | string; // Style variant (e.g., card view)
  density?: "normal" | "compact" | "comfortable"; // Spacing density
  padding?: string; // Overall padding for the view container
  includeFields?: string[];
  excludeFields?: string[];
  allowEditSwitch?: boolean;
  editLabel?: string;
  grouping?: GroupingConfig;
  detail?: DetailConfig;
  summary?: SummaryConfig;
  /** Specifies the desired output format (e.g., 'jsx', 'json', 'text'). */
  outputFormat?: ViewFormatType;
  /** CSS class name to apply (used by JSX formatter). */
  className?: string;
  /** Inline styles to apply (used by JSX formatter). */
  style?: Record<string, any>;
  /** Whether to stringify JSON output (used by JSON formatter). Defaults to true. */
  jsonStringify?: boolean;
  jsonPrettyPrint?: boolean;

  /** Prisma schema generation options */
  prisma?: {
    /** Include timestamps (createdAt, updatedAt) in schema. Defaults to true. */
    timestamps?: boolean;
    /** Database provider name. Example: 'postgresql', 'mysql', 'sqlite' */
    provider?: string;
    /** Include schema enums for select/radio fields with options. Defaults to true. */
    generateEnums?: boolean;
    /** Add soft delete column. Defaults to false. */
    softDelete?: boolean;
    /** Add specific relations to include. */
    relations?: Array<{
      name: string;
      type: "1-1" | "1-n" | "n-n";
      references: string;
      fields?: string[];
      referencesFields?: string[];
    }>;
  };
}

// --- Type Guards ---

/**
 * Type guard to check if a context is specifically a CreateContext.
 */
export function isCreateContext(
  context: FormExecutionContext | any
): context is CreateContext {
  return (
    context !== null &&
    typeof context === "object" &&
    context.prakāra === "sṛṣṭi"
  );
}

/**
 * Type guard to check if a context is specifically an EditContext.
 */
export function isEditContext(
  context: FormExecutionContext | any
): context is EditContext {
  return context !== null && typeof context === "object";
}

/**
 * Type guard for ViewContext.
 */
export function isViewContext(context: any): context is ViewContext {
  return context && context.mode === "view";
}

/**
 * Maps the public FormMode string to the internal prakāra literal type.
 */
function getPrakaraForMode(mode: FormMode): "sṛṣṭi" | "pariṇāma" | "darśana" {
  switch (mode) {
    case "create":
      return "sṛṣṭi";
    case "edit":
      return "pariṇāma";
    case "view":
      return "darśana";
    default:
      // Should not happen if FormMode is used correctly, but provides a fallback.
      console.warn(
        `Unknown FormMode "${mode}" provided. Defaulting to 'darśana' (view).`
      );
      return "darśana";
  }
}

// --- Utility Functions ---

/**
 * Determines a suitable HTML input type based on the field's defined type.
 * @param field - The FormField object.
 * @returns A string representing the HTML input type (e.g., 'text', 'number', 'checkbox').
 */
export function determineInputType(field: FormField): string {
  if (!field || !field.type) {
    return "text"; // Default fallback
  }

  // Basic type mapping (expand as needed)
  switch (field.type.toLowerCase()) {
    case "string":
    case "text":
      // Check for specific formats if available in meta or field properties
      if (field.meta?.format === "email") return "email";
      if (field.meta?.format === "password") return "password";
      if (field.meta?.format === "url") return "url";
      if (field.meta?.multiline) return "textarea"; // Example for textarea
      return "text";
    case "number":
    case "integer":
    case "float":
    case "decimal":
      return "number";
    case "boolean":
    case "bool":
      // Consider rendering preference (checkbox vs. toggle switch)
      return "checkbox";
    case "date":
      return "date";
    case "datetime":
    case "timestamp":
      return "datetime-local";
    case "time":
      return "time";
    case "select":
    case "enum":
      return "select"; // Or handle differently based on options
    // Add more mappings for custom types, file uploads, etc.
    default:
      return "text"; // Default fallback for unknown types
  }
}

/**
 * Provides a sensible default value based on the field's type.
 * @param fieldType - The type string from the FormField.
 * @returns A default value suitable for the type (e.g., '', 0, false, null).
 */
export function getDefaultForType(fieldType: string | undefined): any {
  if (!fieldType) {
    return undefined; // Or null, depending on preference
  }

  switch (fieldType.toLowerCase()) {
    case "string":
    case "text":
    case "email":
    case "password":
    case "url":
    case "textarea":
      return "";
    case "number":
    case "integer":
    case "float":
    case "decimal":
      return undefined; // Or 0, depending on requirements (often better to leave empty)
    case "boolean":
    case "bool":
    case "checkbox":
      return false;
    case "date":
    case "datetime":
    case "timestamp":
    case "time":
      return undefined; // Or null
    case "select":
    case "enum":
      return undefined; // Or the first option's value, or null
    case "array":
      return [];
    case "object":
      return {};
    default:
      return undefined; // Default for unknown types
  }
}
