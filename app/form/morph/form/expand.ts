import { FilterShape, FilterField } from "./filter";
import { FilterContext } from "./filter";
import { createMorph } from "../core";

/**
 * Expanded view output.
 */
export interface ExpandedShape extends FilterShape {
  level: ExpandedLevel;
  fields: ExpandedField[];
}

/**
 * Extended field for detailed view.
 * Business properties for detail—like whether the field is expanded,
 * the expanded view data, and additional information—are now on the field direct.
 */
export interface ExpandedField extends FilterField {
  expandable?: boolean;
  expanded?: boolean;
  showLineNumbers?: boolean;
  language?: string;
  renderedAs?: string;
  additionalInfo?: any;
  history?: any;
  source?: any;
  constraints?: any;
}

/**
 * Expanded level for field display.
 */
export type ExpandedLevel = "minimal" | "standard" | "expanded" | "complete";

/**
 * Configuration for detail level in view mode.
 */
export interface ExpandedConfig {
  /** The level of detail to display for fields. Defaults to 'standard'. */
  level?: ExpandedLevel;
  /** Array of field IDs that should always be shown in an expanded view, regardless of level. */
  expandedFields?: string[];
}

/**
 * Extended FormContext that explicitly includes detail configuration.
 * (Assume FormContext already exists in your types collection.)
 */
export interface ExpandedContext extends FilterContext {
  detail?: ExpandedConfig;
}

export function isExpandedContext(
  context: ExpandedContext
): context is ExpandedContext {
  return true
}
/**
 * Create a detailed view with expanded field information.
 * This morph processes fields, moving detail properties to the top level,
 * and returns a new ExpandedShape.
 */
export const ExpandedMorph = createMorph<ExpandedShape, ExpandedShape>(
  "ExpandedMorph",
  (view, context) => {
    if (!view || !Array.isArray(view.fields)) {
      throw new Error("Invalid view output provided to ExpandedMorph");
    }
    if (!isExpandedContext(context)) {
      throw new Error("ExpandedMorph requires a valid FormContext");
    }

    // Extract detail configuration; default to standard level.
    const detailConfig: ExpandedConfig = context.detail || {};
    const detailLevel: ExpandedLevel = detailConfig.level || "standard";

    // Determine forced expanded fields and auto-expand flag.
    const forcedExpanded = detailConfig.expandedFields || [];
    const autoExpand = detailLevel === "expanded" || detailLevel === "complete";

    // Process each field, producing a ExpandedField.
    const processedFields: ExpandedField[] = view.fields.map((field) => {
      // Start with a shallow copy of the base field.
      const detailedField: ExpandedField = { ...field };

      // Compute expansion: either forced or auto (if field is deemed expandable).
      const shouldExpand =
        forcedExpanded.includes(field.id) ||
        (autoExpand && isExpandableField(field));

      if (shouldExpand) {
        detailedField.expanded = true;
        detailedField.expanded = createExpanded(field, detailLevel);
      }

      // For higher detail levels, attach additional info.
      if (detailLevel === "complete" || detailLevel === "expanded") {
        detailedField.additionalInfo = getAdditionalInfo(field, detailLevel);
      }

      return detailedField;
    });

    // Determine IDs of fields that have been expanded.
    const expandedIds = processedFields
      .filter((f) => f.expanded)
      .map((f) => f.id);

    return {
      ...view,
      fields: processedFields,
      meta: {
        ...view.meta,
        // Retain meta for workflow/platform details if necessary.
        detail: {
          level: detailLevel,
          expandedFields: expandedIds,
        },
      },
      level: detailLevel,
      expandedFields: expandedIds,
    } as ExpandedShape;
  },
  {
    pure: true,
    fusible: true,
    cost: 3,
    memoizable: true,
  }
);

/**
 * Determines if a field is expandable.
 */
function isExpandableField(field: ExpandedField): boolean {
  const expandableTypes = [
    "object",
    "array",
    "json",
    "richtext",
    "markdown",
    "code",
    "table",
  ];
  return (
    expandableTypes.includes(field.type) ||
    field.expandable === true ||
    (field.value && typeof field.value === "object")
  );
}

/**
 * Create an expanded view representation for a field based on its type and detail level.
 */
function createExpanded(field: ExpandedField, detailLevel: ExpandedLevel): any {
  switch (field.type) {
    case "object":
    case "json":
      return {
        type: "object-detail",
        value: field.value,
        renderedAs: detailLevel === "complete" ? "tree" : "table",
      };
    case "array":
      return {
        type: "array-detail",
        value: field.value,
        count: Array.isArray(field.value) ? field.value.length : 0,
        renderedAs: detailLevel === "complete" ? "full-list" : "summary-list",
      };
    case "richtext":
    case "markdown":
      return {
        type: "rich-content",
        renderedAs: "formatted",
        fullText: field.value,
      };
    case "code":
      return {
        type: "code-block",
        language: field.format || "plaintext",
        showLineNumbers: detailLevel === "complete",
      };
    default:
      return {
        type: "expanded-text",
        fullValue: field.value,
      };
  }
}

/**
 * Retrieves additional information for a field based on its detail level.
 */
function getAdditionalInfo(
  field: ExpandedField,
  detailLevel: ExpandedLevel
): any {
  const info: Record<string, any> = {};

  if (field.meta?.validation) {
    info.validation = field.meta.validation;
  }
  if (field.format) {
    info.format = {
      type: field.format,
      description: getFormatDescription(field.type, field.format),
    };
  }
  if (detailLevel === "complete") {
    if (field.history) {
      info.history = field.history;
    }
    if (field.source) {
      info.source = field.source;
    }
    if (field.constraints) {
      info.constraints = field.constraints;
    }
  }

  return info;
}

/**
 * Provides a formatted description based on field type and format.
 */
function getFormatDescription(type: string, format: string): string {
  const formatDescriptions: Record<string, Record<string, string>> = {
    date: {
      "YYYY-MM-DD": "ISO Date Format (Year-Month-Day)",
      "MM/DD/YYYY": "US Date Format (Month/Day/Year)",
      "DD/MM/YYYY": "European Date Format (Day/Month/Year)",
      relative: 'Relative time (e.g. "2 days ago")',
    },
    number: {
      decimal: "Decimal number",
      integer: "Integer number",
      percentage: "Percentage value",
      scientific: "Scientific notation",
    },
    currency: {
      USD: "US Dollar",
      EUR: "Euro",
      GBP: "British Pound",
      JPY: "Japanese Yen",
    },
  };

  return formatDescriptions[type]?.[format] || `${type} in ${format} format`;
}
