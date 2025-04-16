import { FormExecutionContext } from "../../schema/context";
import { SimpleMorph } from "../morph";
import { ViewContext } from "../mode";
import { ViewOutput, ViewField } from "./pipeline";

/**
 * Summary view output
 */
export interface SummaryViewOutput extends ViewOutput {
  meta: ViewOutput['meta'] & {
    summary: {
      originalFieldCount: number;
      includedFieldCount: number;
    };
  };
}

/**
 * Configuration for summary view mode
 */
export interface SummaryConfig {
  /** Selection mode: 'include' to show only specified fields, 'exclude' to show all except specified fields */
  mode?: 'include' | 'exclude';
  
  /** Array of field IDs to include or exclude depending on the mode */
  fields?: string[];
  
  /** Maximum number of fields to show (defaults to 5) */
  maxFields?: number;
  
  /** Sort fields by a specific criteria */
  sortBy?: 'importance' | 'label' | 'order';
  
  /** Whether to show field values in summary view */
  showValues?: boolean;
  
  /** Default importance value for fields without explicit importance */
  defaultImportance?: number;
}

/**
 * Create a summary view with only key fields
 */
export const SummaryViewMorph = new SimpleMorph<ViewOutput, SummaryViewOutput>(
  "SummaryViewMorph",
  (view, context: FormExecutionContext) => {
    // Validate input
    if (!view || !Array.isArray(view.fields)) {
      throw new Error("Invalid view output provided to SummaryViewMorph");
    }

    const viewContext = context as ViewContext;
    const summaryConfig = viewContext.summary || {};
    
    // Get field selection mode
    const selectionMode = summaryConfig.mode || 'include';
    
    // Get fields to include or exclude
    const fieldSelection = summaryConfig.fields || [];
    
    // Filter fields based on selection mode
    const originalFieldCount = view.fields.length;
    let selectedFields: ViewField[];
    
    if (selectionMode === 'include') {
      // Include only fields in the list
      selectedFields = fieldSelection.length > 0 
        ? view.fields.filter(field => fieldSelection.includes(field.id))
        : view.fields.slice(0, summaryConfig.maxFields || 5); // Default to first 5
    } else {
      // Exclude fields in the list
      selectedFields = view.fields.filter(field => !fieldSelection.includes(field.id));
    }
    
    // Apply sorting if requested
    if (summaryConfig.sortBy) {
      selectedFields.sort((a, b) => {
        if (summaryConfig.sortBy === 'importance') {
          // Sort by importance (meta.importance or default to 0)
          const aImportance = a.meta?.importance || 0;
          const bImportance = b.meta?.importance || 0;
          return bImportance - aImportance; // Higher importance first
        }
        
        if (summaryConfig.sortBy === 'label') {
          // Sort by label alphabetically
          return a.label.localeCompare(b.label);
        }
        
        // Default to original order
        return 0;
      });
    }
    
    // Limit the number of fields if specified
    if (summaryConfig.maxFields && summaryConfig.maxFields > 0) {
      selectedFields = selectedFields.slice(0, summaryConfig.maxFields);
    }
    
    // Return summary view
    return {
      ...view,
      fields: selectedFields,
      meta: {
        ...view.meta,
        summary: {
          originalFieldCount,
          includedFieldCount: selectedFields.length
        }
      }
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 1,
    memoizable: true
  }
);