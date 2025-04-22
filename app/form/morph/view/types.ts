import { FormShape, FormField } from "../../schema/form";
import { FormExecutionContext } from "../../schema/context";

/**
 * ViewFormShape - Represents a form in view mode
 */
export interface ViewFormShape extends FormShape {
  /** Mode identifier */
  mode: "view";
  
  /** Data being viewed */
  data: Record<string, any>;
  
  /** Always false for view mode */
  isNew: false;
  
  /** Always true for view mode */
  valid: true;
  
  /** Always true for view mode */
  complete: true;
  
  /** Fields with view-specific properties */
  fields: ViewFormField[];
}

/**
 * Represents a field in view mode
 */
export interface ViewFormField extends FormField {
  /** Field identifier */
  id: string;
  
  /** Field label */
  label: string;
  
  /** Field type */
  type: string;
  
  /** Field is always disabled in view mode */
  disabled: true;
  
  /** Field is always readonly in view mode */
  readOnly: true;
  
  /** Raw value from data */
  value: any;
  
  /** Formatted value for display */
  displayValue: string;
  
  /** Additional field metadata */
  meta?: {
    /** Original value from data source */
    originalValue: any;
    
    /** Mode indicator */
    mode: "view";
    
    /** Any other field metadata */
    [key: string]: any;
  };
}

/**
 * ViewFormContext - Execution context for view operations
 */
export interface ViewFormContext extends FormExecutionContext {
  /** Operation data and configuration */
  data: {
    /** Data to be displayed in the view */
    data: Record<string, any>;
    
    /** Configuration options for view mode */
    config?: {
      /** Whether to include actions in the view */
      includeActions?: boolean;
      
      /** Whether to apply formatting to values */
      formatValues?: boolean;
      
      /** Whether to validate the data */
      validateData?: boolean;
      
      /** Whether to include related data */
      includeRelated?: boolean;
      
      /** Display options for view mode */
      display?: {
        /** Show field labels */
        showLabels?: boolean;
        
        /** Show field descriptions */
        showDescriptions?: boolean;
        
        /** Truncate long text values */
        truncateText?: boolean | number;
        
        /** Group fields by section */
        groupFields?: boolean;
      };
    };
    
    /** Formatting options for display values */
    formatOptions?: {
      /** Field-specific formatters */
      fieldFormatters?: Record<string, (value: any, field: ViewFormField) => string>;
      
      /** Type-specific formatters */
      typeFormatters?: Record<string, (value: any, field: ViewFormField) => string>;
      
      /** Date format string */
      dateFormat?: string;
      
      /** Number format options */
      numberFormat?: Intl.NumberFormatOptions;
    };
    
    /** Custom actions to add to the view */
    actions?: Array<{
      id: string;
      label: string;
      type: string;
      action: string;
      icon?: string;
      meta?: Record<string, any>;
    }>;
  };
}

/**
 * Type guard to check if a context is a ViewFormContext
 */
export function isViewFormContext(context: any): context is ViewFormContext {
  return (
    context &&
    context.data &&
    (typeof context.data.data === 'object' ||
     context.data.config !== undefined ||
     context.data.formatOptions !== undefined ||
     context.data.actions !== undefined)
  );
}