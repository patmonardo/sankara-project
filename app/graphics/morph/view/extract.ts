import { SimpleMorph } from "../morph";
import { FormShape, FormField } from "../../schema/form";
import { MorpheusContext, DataContext } from "../../schema/context";

/**
 * Extracted field qualities
 */
export interface ExtractedField {
  id: string;
  label: string;
  value: any;
  type: string;
  displayType: string;
  format?: string;
  meta?: Record<string, any>;
}

/**
 * Extracted form qualities
 */
export interface ExtractedQualities {
  id: string;
  qualities: ExtractedField[];
  meta?: Record<string, any>;
}

/**
 * ExtractQualitiesMorph - Extracts field qualities for display
 *
 * This morphism extracts the key display qualities from form fields,
 * focusing on the aspects most relevant for viewing.
 */
export const ExtractQualitiesMorph = new SimpleMorph<FormShape, ExtractedQualities>(
  "ExtractQualitiesMorph",
  (input, context: MorpheusContext) => {
    // Extract qualities from form fields
    const qualities = input.fields.map(field => ({
      id: field.id,
      label: getFieldLabel(field),
      value: extractFieldValue(field, context),
      type: field.type,
      displayType: determineDisplayType(field),
      format: field.format || getDefaultFormat(field.type),
      meta: field.meta
    }));

    return {
      id: input.id,
      qualities,
      meta: {
        ...input.meta,
        title: input.meta?.title || input.title,
        description: input.meta?.description || input.description
      }
    };
  },
  // Optimization metadata
  {
    pure: true,
    fusible: true,
    cost: 2, // Moderate cost for field analysis
    memoizable: true
  }
);

/**
 * Determine the display type for a field
 */
export function determineDisplayType(field: FormField): string {
  // Special handling for complex types
  if (field.type === 'object' || field.type === 'json') {
    return field.format === 'table' ? 'table' : 'object';
  }
  
  if (field.type === 'array') {
    if (field.format === 'tags') return 'tags';
    if (field.format === 'chips') return 'chips';
    return 'list';
  }

  // Handle date and time related fields
  if (field.type === 'date' || field.type === 'datetime' || field.type === 'time') {
    if (field.format === 'relative') return 'relative-time';
    if (field.format === 'calendar') return 'calendar';
    return field.type;
  }
  
  // Handle text fields
  if (field.type === 'text') {
    if (field.format === 'markdown') return 'markdown';
    if (field.format === 'html') return 'html';
    if (field.format === 'code') return 'code';
    if (field.multiline) return 'textarea';
    return 'text';
  }
  
  // Handle specialized types
  if (field.type === 'email') return 'email';
  if (field.type === 'url') return 'url';
  if (field.type === 'phone') return 'phone';
  if (field.type === 'currency') return 'currency';
  if (field.type === 'percent') return 'percent';
  if (field.type === 'boolean') return field.format === 'toggle' ? 'toggle' : 'boolean';
  if (field.type === 'select') return field.format === 'dropdown' ? 'dropdown' : 'select';
  if (field.type === 'reference') return 'reference';
  
  // Default fallback
  return field.type;
}

/**
 * Get default format for a field type
 */
export function getDefaultFormat(type: string): string | undefined {
  switch (type) {
    case 'date':
      return 'YYYY-MM-DD';
    case 'datetime':
      return 'YYYY-MM-DD HH:mm';
    case 'time':
      return 'HH:mm';
    case 'number':
      return 'decimal';
    case 'currency':
      return 'USD';
    case 'percent':
      return 'percentage';
    case 'boolean':
      return 'checkbox';
    case 'object':
    case 'json':
      return 'object';
    case 'array':
      return 'list';
    default:
      return undefined;
  }
}

/**
 * Validate if a field should be included based on context
 */
export function shouldIncludeField(field: FormField, context: DataContext): boolean {
  // Check inclusion rules
  if (context.includeFields?.length) {
    return context.includeFields.includes(field.id) ||
           context.includeFields.includes('*');
  }
  
  // Check exclusion rules
  if (context.excludeFields?.length) {
    return !context.excludeFields.includes(field.id);
  }
  
  // Default to include
  return true;
}

/**
 * Extract actual field value considering context
 */
export function extractFieldValue(field: FormField, context: MorpheusContext): any {
  // Get from context data, default to field value
  return context.data?.[field.id] ?? field.value;
}

/**
 * Create a sanitized label from field id if none provided
 */
export function getFieldLabel(field: FormField): string {
  if (field.label) return field.label;
  
  // Convert camelCase or snake_case to Title Case
  return field.id
    .replace(/([A-Z])/g, ' $1') // camelCase to space separated
    .replace(/_/g, ' ')         // snake_case to space separated
    .replace(/^\w/, c => c.toUpperCase()) // capitalize first letter
    .trim();
}

/**
 * Extract filtered qualities from a form
 */
export const FilteredQualitiesMorph = new SimpleMorph<
  FormShape,
  ExtractedQualities
>(
  "FilteredQualitiesMorph",
  (input, context: MorpheusContext) => {
    // Filter and extract qualities
    const qualities = input.fields
      .filter(field => {
        // Skip hidden fields
        if (field.hidden || field.visible === false) {
          return false;
        }

        // Include field based on inclusion/exclusion lists
        if (context.includeFields && context.includeFields.length > 0) {
          return context.includeFields.includes(field.id) ||
                 context.includeFields.includes('*');
        }

        if (context.excludeFields && context.excludeFields.length > 0) {
          return !context.excludeFields.includes(field.id);
        }

        return true;
      })
      .map(field => ({
        id: field.id,
        label: getFieldLabel(field),
        value: extractFieldValue(field, context),
        type: field.type,
        displayType: determineDisplayType(field),
        format: field.format || getDefaultFormat(field.type),
        meta: field.meta
      }));

    return {
      id: input.id,
      qualities,
      meta: {
        ...input.meta,
        filteredBy: {
          includeFields: context.includeFields,
          excludeFields: context.excludeFields
        }
      }
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 2.5,
    memoizable: true
  }
);

/**
 * Create a field extractor for specific fields
 */
export function defineFieldExtractor(fieldIds: string[]) {
  return new SimpleMorph<FormShape, ExtractedQualities>(
    `ExtractFields_${fieldIds.join('_')}`,
    (input, context: MorpheusContext) => {
      // Filter to only the specified fields
      const selectedFields = input.fields.filter(field =>
        fieldIds.includes(field.id)
      );

      // Extract qualities
      const qualities = selectedFields.map(field => ({
        id: field.id,
        label: getFieldLabel(field),
        value: extractFieldValue(field, context),
        type: field.type,
        displayType: determineDisplayType(field),
        format: field.format || getDefaultFormat(field.type),
        meta: field.meta
      }));

      return {
        id: input.id,
        qualities,
        meta: {
          ...input.meta,
          partial: true,
          selectedFields: fieldIds
        }
      };
    },
    {
      pure: true,
      fusible: true,
      cost: 2,
      memoizable: true
    }
  );
}

/**
 * Transform field qualities into a simplified data representation
 */
export const QualitiesToDataMorph = new SimpleMorph<
  ExtractedQualities,
  Record<string, any>
>(
  "QualitiesToDataMorph",
  (input) => {
    // Convert qualities to a data object
    const data: Record<string, any> = {};
    
    input.qualities.forEach(quality => {
      data[quality.id] = quality.value;
    });
    
    return data;
  },
  {
    pure: true,
    fusible: true,
    cost: 1,
    memoizable: true
  }
);

/**
 * For backward compatibility
 * @deprecated Use defineFieldExtractor instead
 */
export const createFieldExtractor = defineFieldExtractor;