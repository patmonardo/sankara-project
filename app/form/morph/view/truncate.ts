import { createMorph, morpheus } from "../morph";
import { isViewContext } from "../mode";
import { ViewOutput, ViewField } from "./pipeline";

/**
 * Truncation configuration
 */
export interface TruncationConfig {
  enabled: boolean;
  maxLength?: number;
  maxLines?: number;
  preserveWords?: boolean;
  ellipsis?: string;
  byFieldType?: Record<string, number>;
}

/**
 * Truncated view field with additional metadata
 */
export interface TruncatedViewField extends ViewField {
  meta: ViewField["meta"] & {
    truncation?: {
      isTruncated: boolean;
      originalLength: number;
      displayedLength: number;
      hasMore: boolean;
      fullContent?: string;
      readMoreAction?: string;
    };
  };
}

/**
 * Truncated view output
 */
export interface TruncatedViewOutput extends ViewOutput {
  fields: TruncatedViewField[];
  meta: ViewOutput["meta"] & {
    truncation: {
      enabled: boolean;
      truncatedFields: string[];
    };
  };
}

/**
 * Helper function to determine content length
 */
function getContentLength(field: ViewField): number {
  if (field.value === null || field.value === undefined) {
    return 0;
  }

  if (typeof field.value === "string") {
    return field.value.length;
  }

  if (field.displayValue) {
    return field.displayValue.length;
  }

  return String(field.value).length;
}

/**
 * Helper function to determine if a field should be truncated
 */
function shouldTruncateField(
  field: ViewField,
  config: TruncationConfig
): boolean {
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
  field: ViewField,
  config: TruncationConfig,
  defaultLength: number
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

/**
 * Apply truncation to text fields
 */
export const TruncateTextMorph = createMorph<ViewOutput, TruncatedViewOutput>(
  "TruncateTextMorph",
  (view, context) => {
    // Validate input
    if (!view || !Array.isArray(view.fields)) {
      throw new Error("Invalid view output provided to TruncateTextMorph");
    }

    // Use type guard instead of casting
    if (!isViewContext(context)) {
      throw new Error("TruncateTextMorph requires a ViewContext");
    }

    // Get truncation configuration
    const truncConfig = context.truncation || { enabled: false };

    // If truncation is disabled, just add the metadata structure
    if (!truncConfig.enabled) {
      return {
        ...view,
        fields: view.fields.map((field) => ({
          ...field,
          meta: {
            ...field.meta,
            truncation: {
              isTruncated: false,
              originalLength: getContentLength(field),
              displayedLength: getContentLength(field),
              hasMore: false,
            },
          },
        })) as TruncatedViewField[],
        meta: {
          ...view.meta,
          truncation: {
            enabled: false,
            truncatedFields: [],
          },
        },
      };
    }

    // Default values
    const defaultMaxLength = truncConfig.maxLength || 200;
    const ellipsis = truncConfig.ellipsis || "…";
    const preserveWords = truncConfig.preserveWords !== false;

    // Process fields
    const truncatedFields: string[] = [];
    const processedFields = view.fields.map((field) => {
      // Skip non-text fields or fields that shouldn't be truncated
      if (!shouldTruncateField(field, truncConfig)) {
        return {
          ...field,
          meta: {
            ...field.meta,
            truncation: {
              isTruncated: false,
              originalLength: getContentLength(field),
              displayedLength: getContentLength(field),
              hasMore: false,
            },
          },
        };
      }

      // Get the max length for this field type
      const maxLength = getMaxLengthForField(
        field,
        truncConfig,
        defaultMaxLength
      );

      // Get content as string
      const originalContent = String(field.value || "");
      const originalLength = originalContent.length;

      // Skip if content is already short enough
      if (originalLength <= maxLength) {
        return {
          ...field,
          meta: {
            ...field.meta,
            truncation: {
              isTruncated: false,
              originalLength,
              displayedLength: originalLength,
              hasMore: false,
            },
          },
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
      truncatedFields.push(field.id);

      // Return truncated field
      return {
        ...field,
        displayValue: truncatedContent, // Use displayValue to preserve original value
        meta: {
          ...field.meta,
          truncation: {
            isTruncated: true,
            originalLength,
            displayedLength: truncatedContent.length,
            hasMore: true,
            fullContent: originalContent, // Store original content for expansion
            readMoreAction: `expandField:${field.id}`,
          },
        },
      };
    }) as TruncatedViewField[];

    // Return truncated view
    return {
      ...view,
      fields: processedFields,
      meta: {
        ...view.meta,
        truncation: {
          enabled: true,
          truncatedFields,
        },
      },
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 2,
    memoizable: true,
  }
);

morpheus.define(TruncateTextMorph, {
  description: "Truncates text fields to a specified length",
  category: "view",
  tags: ["view", "text", "truncate", "display"],
  inputType: "ViewOutput",
  outputType: "TruncatedViewOutput",
});
