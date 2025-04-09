import { SimpleMorph } from "../morph";
import { MorpheusContext, ViewContext } from "../../schema/context";
import { ViewOutput, ViewField } from "./display";

/**
 * Detail level for field display
 */
export type DetailLevel = 'minimal' | 'standard' | 'expanded' | 'complete';

/**
 * Detail view output
 */
export interface DetailViewOutput extends ViewOutput {
  meta: ViewOutput['meta'] & {
    detail: {
      level: DetailLevel;
      expandedFields: string[];
    };
  };
}

/**
 * Create a detailed view with expanded field information
 */
export const DetailViewMorph = new SimpleMorph<ViewOutput, DetailViewOutput>(
  "DetailViewMorph",
  (view, context: MorpheusContext) => {
    // Validate input
    if (!view || !Array.isArray(view.fields)) {
      throw new Error("Invalid view output provided to DetailViewMorph");
    }

    const viewContext = context as ViewContext;
    const detailConfig = viewContext.detail || {};
    
    // Get detail level
    const detailLevel = detailConfig.level || 'standard';
    
    // Get fields to expand
    const expandedFields = detailConfig.expandedFields || [];
    const autoExpand = detailLevel === 'expanded' || detailLevel === 'complete';
    
    // Process fields based on detail level
    const processedFields = view.fields.map(field => {
      // Base field copy
      const detailedField = { ...field };
      
      // Handle field expansion
      const shouldExpand = expandedFields.includes(field.id) || 
                          (autoExpand && isExpandableField(field));
      
      if (shouldExpand) {
        // Add expanded view data
        detailedField.meta = {
          ...detailedField.meta,
          expanded: true,
          expandedView: createExpandedView(field, detailLevel)
        };
      }
      
      // Add additional display information based on detail level
      if (detailLevel === 'complete' || detailLevel === 'expanded') {
        detailedField.meta = {
          ...detailedField.meta,
          additionalInfo: getAdditionalInfo(field, detailLevel)
        };
      }
      
      return detailedField;
    });
    
    // Return detailed view
    return {
      ...view,
      fields: processedFields,
      meta: {
        ...view.meta,
        detail: {
          level: detailLevel,
          expandedFields: processedFields
            .filter(field => field.meta?.expanded)
            .map(field => field.id)
        }
      }
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 3,
    memoizable: true
  }
);

/**
 * Check if a field is expandable
 */
function isExpandableField(field: ViewField): boolean {
  // Fields that typically contain complex or rich data
  const expandableTypes = [
    'object', 
    'array', 
    'json', 
    'richtext', 
    'markdown',
    'code',
    'table'
  ];
  
  return expandableTypes.includes(field.type) || 
         field.meta?.expandable === true || 
         (field.value && typeof field.value === 'object');
}

/**
 * Create expanded view for a field
 */
function createExpandedView(field: ViewField, detailLevel: DetailLevel): any {
  switch (field.type) {
    case 'object':
    case 'json':
      return {
        type: 'object-detail',
        value: field.value,
        renderedAs: detailLevel === 'complete' ? 'tree' : 'table'
      };
      
    case 'array':
      return {
        type: 'array-detail',
        value: field.value,
        count: Array.isArray(field.value) ? field.value.length : 0,
        renderedAs: detailLevel === 'complete' ? 'full-list' : 'summary-list'
      };
      
    case 'richtext':
    case 'markdown':
      return {
        type: 'rich-content',
        renderedAs: 'formatted',
        fullText: field.value
      };
      
    case 'code':
      return {
        type: 'code-block',
        language: field.format || 'plaintext',
        showLineNumbers: detailLevel === 'complete'
      };
      
    default:
      return {
        type: 'expanded-text',
        fullValue: field.value
      };
  }
}

/**
 * Get additional information for a field
 */
function getAdditionalInfo(field: ViewField, detailLevel: DetailLevel): any {
  const info: Record<string, any> = {};
  
  // Include validation information if available
  if (field.meta?.validation) {
    info.validation = field.meta.validation;
  }
  
  // Include format details
  if (field.format) {
    info.format = {
      type: field.format,
      description: getFormatDescription(field.type, field.format)
    };
  }
  
  // Include field metadata for complete level
  if (detailLevel === 'complete') {
    // Include field history if available
    if (field.meta?.history) {
      info.history = field.meta.history;
    }
    
    // Include data source information
    if (field.meta?.source) {
      info.source = field.meta.source;
    }
    
    // Include constraints
    if (field.meta?.constraints) {
      info.constraints = field.meta.constraints;
    }
  }
  
  return info;
}

/**
 * Get description for a field format
 */
function getFormatDescription(type: string, format: string): string {
  const formatDescriptions: Record<string, Record<string, string>> = {
    date: {
      'YYYY-MM-DD': 'ISO Date Format (Year-Month-Day)',
      'MM/DD/YYYY': 'US Date Format (Month/Day/Year)',
      'DD/MM/YYYY': 'European Date Format (Day/Month/Year)',
      'relative': 'Relative time (e.g. "2 days ago")'
    },
    number: {
      'decimal': 'Decimal number',
      'integer': 'Integer number',
      'percentage': 'Percentage value',
      'scientific': 'Scientific notation'
    },
    currency: {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound',
      'JPY': 'Japanese Yen'
    }
  };
  
  return formatDescriptions[type]?.[format] || `${type} in ${format} format`;
}