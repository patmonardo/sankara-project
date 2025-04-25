import { createMorph } from "../core";
import { FormContext, isFormContext } from "./types";
import { getDefaultFormat } from "./format";

/**
 * Represents the extracted qualities of a form or a subset of its fields.
 */
export interface ExtractedShape {
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
  visible?: boolean; // Field visibility
  excludeFrom?: boolean; // Exclude from view flag
  meta?: Record<string, any>; // Original field metadata
}

export interface ExtractedContext extends FormContext {
  fieldValues?: Record<string, any>; // Field values for extraction
  includeFields?: string[]; // Fields to include in the extraction
  excludeFields?: string[]; // Fields to exclude from the extraction
}
/**
 * Type guard to check if context is a valid SectionContext.
 */
export function isExtractedContext(context: any): context is ExtractedContext {
  return true;
}
/**
 * Extract field value considering context and falling back to defaultValue.
 */
export function extractFieldValue(
  field: ExtractedField,
  context: ExtractedContext
): any {
  if (context.fieldValues && context.fieldValues[field.id]) {
    return context.fieldValues[field.id];
  }
}

/**
 * Return a field's display label.
 */
export function getFieldLabel(field: ExtractedField): string {
  return field.label || field.id;
}

/**
 * Determine the display type for a field.
 */
export function determineDisplayType(field: ExtractedField): string {
  switch (field.type) {
    // Textual types
    case "string":
    case "text":
    case "email":
    case "url":
    case "password":
    case "textarea":
    case "markdown":
    case "richtext":
    case "code":
      return "text";
    // Numeric types
    case "number":
    case "integer":
    case "float":
    case "currency":
    case "percent":
    case "range":
      return "number";
    // Boolean types
    case "boolean":
    case "checkbox":
    case "toggle":
      return "boolean";
    // Date/Time
    case "date":
    case "datetime":
    case "time":
      return "date";
    // Selection types
    case "select":
    case "radio":
    case "multiselect":
    case "checkbox-group":
      return "lookup";
    // Complex/Structured types
    case "object":
    case "json":
      return "object";
    case "array":
    case "list":
    case "tags":
    case "chips":
      return "array";
    // File types
    case "file":
    case "image":
      return "file";
    // Fallback
    default:
      return field.type || "unknown";
  }
}

/**
 * ExtractedMorph - Extracts key display qualities from all form fields.
 */
export const ExtractedMorph = createMorph<
  ExtractedShape,
  ExtractedShape
>(
  "ExtractQualitiesMorph",
  (shape: ExtractedShape, context: ExtractedContext) => {
      if (!shape || !Array.isArray(shape.qualities)) {
      throw new Error("Invalid FormShape provided to ExtractQualitiesMorph");
    }
    // Map each field to its extracted qualities.
    const qualities: ExtractedField[] = shape.qualities.map((field) => ({
      id: field.id,
      label: getFieldLabel(field),
      value: extractFieldValue(field, context),
      type: field.type,
      displayType: determineDisplayType(field),
      format: field.format || getDefaultFormat(field.type),
      meta: field.meta,
    }));

    return {
      id: shape.id,
      qualities,
      meta: {
        ...shape.meta,
      },
    };
  },
  { pure: true, fusible: true, cost: 2, memoizable: true }
);

/**
 * FilteredQualitiesMorph - Further filters the extracted qualities based on include/exclude rules.
 */
export const FilteredQualitiesMorph = createMorph<
  ExtractedShape,
  ExtractedShape
>(
  "FilteredQualitiesMorph",
  (shape: ExtractedShape, context: ExtractedContext) => {
    let includeRules: string[] | undefined;
    let excludeRules: string[] | undefined;
    let is = false;

    if (isFormContext(context)) {
      is = true;
      includeRules = context.includeFields;
      excludeRules = context.excludeFields;
    }

    const qualities = shape.qualities
      .filter((field) => {
        if (is) {
          return shouldIncludeField(field, context as FormContext);
        }
        // Basic check if not a full FormContext:
        return field.visible !== false && !field.excludeFrom;
      })
      .map((field) => ({
        id: field.id,
        label: getFieldLabel(field),
        value: extractFieldValue(field, context),
        type: field.type,
        displayType: determineDisplayType(field),
        format: field.format || getDefaultFormat(field.type),
        meta: field.meta,
      }));

    return {
      id: shape.id,
      qualities,
      meta: {
        ...shape.meta,
        filteredBy: {
          includeFields: includeRules,
          excludeFields: excludeRules,
        },
      },
    };
  },
  { pure: true, fusible: true, cost: 2.5, memoizable: true }
);

/**
 * Determines if a field should be included based on context rules.
 */
export function shouldIncludeField(
  field: ExtractedField,
  context: ExtractedContext
): boolean {
  if (!isExtractedContext(context)) {
    console.warn(
      "shouldIncludeField called without proper FormContext, defaulting based on visibility."
    );
    return field.visible !== false && !field.excludeFrom;
  }

  if (field.visible === false || field.excludeFrom === true) {
    return false;
  }

  if (context.includeFields && context.includeFields.length > 0) {
    return (
      context.includeFields.includes(field.id) ||
      context.includeFields.includes("*")
    );
  }
  if (context.excludeFields && context.excludeFields.length > 0) {
    return !context.excludeFields.includes(field.id);
  }
  return true;
}

/**
 * Transform field qualities into a simplified key-value data representation.
 */
export const QualitiesToDataMorph = createMorph<
  ExtractedShape,
  Record<string, any>
>(
  "QualitiesToDataMorph",
  (input) => {
    if (!input || !Array.isArray(input.qualities)) {
      throw new Error(
        "Invalid ExtractedShape provided to QualitiesToDataMorph"
      );
    }
    const data: Record<string, any> = {};
    input.qualities.forEach((quality) => {
      data[quality.id] = quality.value;
    });
    return data;
  },
  { pure: true, fusible: true, cost: 1, memoizable: true }
);
