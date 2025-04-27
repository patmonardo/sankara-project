import { createMorph } from "../core";
import { FormContext } from "./types";
import { FilterShape, FilterField } from "./filter";

/**
 * Truncated view output that extends FilterShape
 */
export interface TruncatedShape extends FilterShape {
  fields: TruncatedField[];
  truncationEnabled?: boolean;
  truncatedFieldIds?: string[];
}

/**
 * Field with truncation properties directly on the field
 */
export interface TruncatedField extends FilterField {
  displayValue?: string;
  truncated?: boolean;
  originalLength?: number;
  displayedLength?: number;
  hasMore?: boolean;
  fullContent?: string;
  readMoreAction?: string;
}

/**
 * Configuration for truncation
 */
export interface TruncationConfig {
  enabled?: boolean;
  maxLength?: number;
  maxLines?: number;
  preserveWords?: boolean;
  ellipsis?: string;
  byFieldType?: Record<string, number>;
}

/**
 * Context for truncation operations
 */
export interface TruncatedContext extends FormContext {
  truncation?: TruncationConfig;
}

/**
 * Apply truncation to text fields
 */
export const TruncateTextMorph = createMorph<TruncatedShape, TruncatedShape>(
  "TruncateTextMorph",
  (shape, context: TruncatedContext) => {
    // Validate input
    if (!shape || !Array.isArray(shape.fields)) {
      throw new Error("Invalid shape provided to TruncateTextMorph");
    }

    // Get truncation configuration from context
    const config = context?.truncation || { enabled: false };

    // If truncation is disabled, just add the metadata structure
    if (!config.enabled) {
      return {
        ...shape,
        fields: shape.fields.map((field: FilterField) => ({
          ...field,
          truncated: false,
          originalLength: getContentLength(field),
          displayedLength: getContentLength(field),
          hasMore: false
        })),
        truncationEnabled: false,
        truncatedFieldIds: []
      };
    }

    // Default values
    const defaultMaxLength = config.maxLength || 200;
    const ellipsis = config.ellipsis || "…";
    const preserveWords = config.preserveWords !== false;

    // Process fields
    const truncatedFieldIds: string[] = [];
    const processedFields = shape.fields.map((field) => {
      // Skip non-text fields or fields that shouldn't be truncated
      if (!shouldTruncateField(field)) {
        return {
          ...field,
          truncated: false,
          originalLength: getContentLength(field),
          displayedLength: getContentLength(field),
          hasMore: false
        };
      }

      // Get the max length for this field type
      const maxLength = getMaxLengthForField(field, defaultMaxLength, config);

      // Get content as string
      const originalContent = String(field.value || "");
      const originalLength = originalContent.length;

      // Skip if content is already short enough
      if (originalLength <= maxLength) {
        return {
          ...field,
          truncated: false,
          originalLength,
          displayedLength: originalLength,
          hasMore: false
        };
      }

      // Truncate content
      let truncatedContent;
      if (preserveWords) {
        // Truncate at word boundary
        truncatedContent = truncateAtWordBoundary(
          originalContent,
          maxLength,
          ellipsis
        );
      } else {
        // Simple character truncation
        truncatedContent = originalContent.slice(0, maxLength) + ellipsis;
      }

      // Add to truncated fields list
      truncatedFieldIds.push(field.id);

      // Return truncated field
      return {
        ...field,
        displayValue: truncatedContent, // Use displayValue to preserve original value
        truncated: true,
        originalLength,
        displayedLength: truncatedContent.length,
        hasMore: true,
        fullContent: originalContent, // Store original content for expansion
        readMoreAction: `expandField:${field.id}`
      };
    }) as TruncatedField[];

    // Return truncated view
    return {
      ...shape,
      fields: processedFields,
      truncationEnabled: true,
      truncatedFieldIds
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 2,
    memoizable: true,
  }
);

/**
 * Helper function to determine content length
 */
function getContentLength(field: FilterField): number {
  if (field.value === null || field.value === undefined) {
    return 0;
  }

  if (typeof field.value === "string") {
    return field.value.length;
  }

  if ("displayValue" in field && typeof field.displayValue === "string") {
    return field.displayValue.length;
  }

  return String(field.value).length;
}

/**
 * Helper function to determine if a field should be truncated
 */
function shouldTruncateField(field: FilterField): boolean {
  // Skip fields without values
  if (field.value === null || field.value === undefined) {
    return false;
  }

  // Only truncate text-like fields by default
  const truncatableTypes = [
    "string",
    "text",
    "richtext",
    "markdown",
    "html",
    "code",
    "textarea",
  ];

  return truncatableTypes.includes(field.type);
}

/**
 * Get the maximum length for a field based on its type
 */
function getMaxLengthForField(
  field: FilterField,
  defaultLength: number,
  config: TruncationConfig
): number {
  if (config.byFieldType && field.type in config.byFieldType) {
    return config.byFieldType[field.type];
  }

  // Different defaults based on field type
  switch (field.type) {
    case "richtext":
    case "markdown":
    case "html":
      return config.maxLength || 500; // Longer for rich content

    case "textarea":
      return config.maxLength || 300; // Medium for multiline

    default:
      return config.maxLength || defaultLength;
  }
}

/**
 * Truncate text at a word boundary
 */
function truncateAtWordBoundary(
  text: string,
  maxLength: number,
  ellipsis: string
): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Find the last space before maxLength
  let truncatePoint = maxLength;
  while (truncatePoint > 0 && text[truncatePoint] !== " ") {
    truncatePoint--;
  }

  // If no space found, just truncate at maxLength
  if (truncatePoint === 0) {
    truncatePoint = maxLength;
  }

  return text.substring(0, truncatePoint) + ellipsis;
}