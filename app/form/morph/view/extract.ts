import { createMorph, morpheus } from "../morph"; // Import createMorph and morpheus
import { FormExecutionContext } from "../../schema/context"; // Import context types and guard
import { ViewContext, isViewContext } from "../core/mode"; // Import context types and guard
import { FormShape, FormField, FormOption } from "../../schema/form"; // Import form schema types
import { getDefaultFormat } from "./format";

/**
 * Represents the extracted qualities of a form or a subset of its fields.
 */
export interface ExtractedQualities {
  id: string; // ID of the original form shape
  qualities: ExtractedField[]; // Array of extracted field qualities
  meta?: Record<string, any>; // Metadata from the original shape + extraction info
}

/**
 * Represents the extracted qualities of a single field.
 */
export interface ExtractedField {
  id: string;
  label: string;
  value: any; // Raw extracted value
  type: string; // Original field type
  displayType: string; // Determined display type (e.g., 'text', 'number', 'date')
  format?: string; // Resolved format string
  meta?: Record<string, any>; // Original field metadata
}

/**
 * Determine the primary display type category for a field.
 * (Refined Mapping)
 */
export function determineDisplayType(field: FormField): string {
  switch (field.type) {
    // Textual types
    case 'string':
    case 'text':
    case 'email':
    case 'url':
    case 'password': // Still text, but might be masked
    case 'textarea':
    case 'markdown':
    case 'richtext':
    case 'code':
      return 'text';

    // Numeric types
    case 'number':
    case 'integer':
    case 'float':
    case 'currency':
    case 'percent':
    case 'range': // Range is fundamentally numeric
      return 'number';

    // Boolean types
    case 'boolean':
    case 'checkbox': // Single checkbox often represents boolean
    case 'toggle':
      return 'boolean';

    // Date/Time types
    case 'date':
    case 'datetime':
    case 'time':
      return 'date'; // Group all date/time related

    // Selection types
    case 'select':
    case 'radio':
    case 'multiselect':
    case 'checkbox-group': // Group of checkboxes for multiple selection
      return 'lookup';

    // Complex/Structured types
    case 'object':
    case 'json':
      return 'object';
    case 'array':
    case 'list':
    case 'tags':
    case 'chips':
      return 'array';

    // File types
    case 'file':
    case 'image':
      return 'file';

    // Other/Fallback
    default:
      return field.type || 'unknown'; // Use original type if known, else 'unknown'
  }
}

/**
 * Determine if a field should be included based on ViewContext rules.
 */
export function shouldIncludeField(field: FormField, context: ViewContext): boolean {
  if (!isViewContext(context)) {
      console.warn("shouldIncludeField called without ViewContext, defaulting to include based on visibility.");
      // Fallback check: Include if visible is not false AND excludeFromView is not true
      return field.visible !== false && !field.excludeFromView; // <-- Fix: Added !field.excludeFromView
  }

  // Exclude if explicitly set to not visible OR if marked excludeFromView
  if (field.visible === false || field.excludeFromView === true) {
    return false;
  }

  // Apply ViewContext include/exclude rules
  if (context.includeFields && context.includeFields.length > 0) {
    return context.includeFields.includes(field.id) || context.includeFields.includes('*');
  }
  if (context.excludeFields && context.excludeFields.length > 0) {
    return !context.excludeFields.includes(field.id);
  }

  // Default: include if visible and no specific rules exclude it
  return true;
}

/**
 * Extract the value for a field, considering context data and defaults.
 * (Uses base FormExecutionContext)
 */
export function extractFieldValue(field: FormField, context: FormExecutionContext): any {
  // Check context.data safely
  if (context?.data && typeof context.data === 'object' && context.data.hasOwnProperty(field.id)) {
    const valueFromData = context.data[field.id];
    // Return data value even if it's null or undefined, as it's explicitly set
    return valueFromData;
  }
  // Fallback to the field's default value only if not present in data
  return field.defaultValue;
}

/**
 * Get the display label for a field.
 * (Seems okay, no changes needed)
 */
export function getFieldLabel(field: FormField): string {
  return field.label || field.id;
}

// --- Morphs ---

/**
 * ExtractQualitiesMorph - Extracts key display qualities from all form fields.
 */
export const ExtractQualitiesMorph = createMorph<FormShape, ExtractedQualities>(
  "ExtractQualitiesMorph",
  (input, context: FormExecutionContext) => {
    if (!input || !Array.isArray(input.fields)) {
        throw new Error("Invalid FormShape provided to ExtractQualitiesMorph");
    }
    // Extract qualities using the helper functions defined above
    const qualities = input.fields.map(field => ({
      id: field.id,
      label: getFieldLabel(field), // Now defined
      value: extractFieldValue(field, context), // Now defined
      type: field.type,
      displayType: determineDisplayType(field), // Now defined
      format: field.format || getDefaultFormat(field.type), // Now defined
      meta: field.meta
    }));

    return {
      id: input.id,
      qualities,
      meta: {
        ...input.meta,
        title: input.title || input.title,
        description: input.description || input.description
      }
    };
  },
  { pure: true, fusible: true, cost: 2, memoizable: true }
);

// Register the morph
morpheus.define(ExtractQualitiesMorph, {
  description: "Extracts key display qualities from all form fields.",
  category: "view-data",
  tags: ["view", "extract", "data"],
  inputType: "FormShape",
  outputType: "ExtractedQualities",
});

/**
 * Extract filtered qualities based on ViewContext include/exclude rules.
 */
export const FilteredQualitiesMorph = createMorph<FormShape, ExtractedQualities>(
  "FilteredQualitiesMorph",
  (input, context: FormExecutionContext) => {
    let includeRules: string[] | undefined;
    let excludeRules: string[] | undefined;
    let isView = false;

    if (isViewContext(context)) {
        isView = true;
        includeRules = context.includeFields;
        excludeRules = context.excludeFields;
    }

    const qualities = input.fields
      .filter(field => {
          if (isView) {
              // Use shouldIncludeField which expects ViewContext and handles visibility correctly
              return shouldIncludeField(field, context as ViewContext);
          } else {
              // Basic filtering if not ViewContext: Check visible and excludeFromView
              return field.visible !== false && !field.excludeFromView; // <-- Fix: Added !field.excludeFromView
          }
      })
      .map(field => ({
        // ... map properties ...
        id: field.id,
        label: getFieldLabel(field),
        value: extractFieldValue(field, context),
        type: field.type,
        displayType: determineDisplayType(field),
        format: field.format || getDefaultFormat(field.type), // Accessing field.format is now safe
        meta: field.meta
      }));

    // ... return statement ...
    return {
      id: input.id,
      qualities,
      meta: {
        ...input.meta,
        filteredBy: {
          includeFields: includeRules,
          excludeFields: excludeRules
        }
      }
    };
  },
  // ... options ...
  { pure: true, fusible: true, cost: 2.5, memoizable: true }
);

// Register the morph
morpheus.define(FilteredQualitiesMorph, {
  description: "Extracts qualities from form fields based on ViewContext include/exclude rules.",
  category: "view-data",
  tags: ["view", "extract", "filter", "data"],
  inputType: "FormShape",
  outputType: "ExtractedQualities",
});


/**
 * Create a field extractor morph for specific fields.
 * Note: This creates a morph instance but doesn't automatically register it globally.
 */
export function defineFieldExtractor(fieldIds: string[]) {
  const morphName = `ExtractFields_${fieldIds.join('_')}`;
  return createMorph<FormShape, ExtractedQualities>(
    morphName,
    (input, context: FormExecutionContext) => { // Use base context
      if (!input || !Array.isArray(input.fields)) {
          throw new Error(`Invalid FormShape provided to ${morphName}`);
      }
      // Filter to only the specified fields
      const selectedFields = input.fields.filter(field =>
        fieldIds.includes(field.id)
      );

      // Extract qualities
      const qualities = selectedFields.map(field => ({
        id: field.id,
        label: getFieldLabel(field),
        value: extractFieldValue(field, context), // Pass context
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
    { pure: true, fusible: true, cost: 2, memoizable: true }
  );
}

/**
 * Transform field qualities into a simplified key-value data representation.
 */
export const QualitiesToDataMorph = createMorph<ExtractedQualities, Record<string, any>>(
  "QualitiesToDataMorph",
  (input) => { // Context not needed for this transformation
    if (!input || !Array.isArray(input.qualities)) {
        throw new Error("Invalid ExtractedQualities provided to QualitiesToDataMorph");
    }
    // Convert qualities to a data object
    const data: Record<string, any> = {};
    input.qualities.forEach(quality => {
      data[quality.id] = quality.value;
    });
    return data;
  },
  { pure: true, fusible: true, cost: 1, memoizable: true }
);

// Register the morph
morpheus.define(QualitiesToDataMorph, {
  description: "Transforms extracted field qualities into a simple key-value data object.",
  category: "data-transformation",
  tags: ["data", "extract", "simplify"],
  inputType: "ExtractedQualities",
  outputType: "Record<string, any>",
});