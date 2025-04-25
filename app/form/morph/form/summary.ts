import { createMorph } from "../core";
import { FilterShape, FilterField, FilterContext } from "./filter";

/**
 * Summary view output: extends FormShape with additional summary metadata.
 */
export interface SummaryShape extends FilterShape {
  summary?: SummaryField[];
  originalFieldCount?: number;
  includedFieldCount?: number;
}

/**
 * Extended field for reporting which adds core business properties.
 * These properties are now on the field’s main body rather than in meta.
 */
export interface SummaryField extends FilterField {
  importance?: number;
  order?: number;
}

/**
 * Configuration for summary view mode.
 */
export interface SummaryConfig {
  mode?: "include" | "exclude";
  fields?: string[];
  maxFields?: number;
  sortBy?: "importance" | "label" | "order";
  showValues?: boolean;
  defaultImportance?: number;
}

/**
 * Extended FormContext that explicitly includes summary configuration.
 */
export interface SummaryContext extends FilterContext {
  summary?: SummaryConfig;
}

/**
 * Type guard to check if context is a valid FieldContext.
 */
export function isSummaryContext(context: any): context is SummaryContext {
  return true;
}

/**
 * Create a summary view with only key fields.
 * This morph filters and sorts fields based on the SummaryConfig supplied on the context.
 */
export const SummaryMorph = createMorph<SummaryShape, SummaryShape>(
  "SummaryMorph",
  (shape, context) => {
    if (!shape || !Array.isArray(shape.fields)) {
      throw new Error("Invalid shape output provided to SummaryMorph");
    }
    if (!isSummaryContext(context)) {
      throw new Error("SummaryMorph requires a valid FormContext");
    }

    const summaryConfig = context.summary;
    const selectionMode: "include" | "exclude" =
      summaryConfig?.mode || "include";
    const fieldSelection: string[] = summaryConfig?.fields || [];
    const originalFieldCount: number = shape.fields.length;
    let selectedFields: SummaryField[];

    if (selectionMode === "include") {
      selectedFields =
        fieldSelection.length > 0
          ? shape.fields.filter((field) => fieldSelection.includes(field.id))
          : shape.fields.slice(0, summaryConfig?.maxFields || 5);
    } else {
      selectedFields = shape.fields.filter(
        (field) => !fieldSelection.includes(field.id)
      );
    }

    if (summaryConfig?.sortBy) {
      selectedFields.sort((a, b) => {
        if (summaryConfig?.sortBy === "importance") {
          // We assume fields implement SummaryField, so businessProps are directly accessible.
          const aImp =
            (a as SummaryField).importance ??
            summaryConfig?.defaultImportance ??
            0;
          const bImp =
            (b as SummaryField).importance ??
            summaryConfig?.defaultImportance ??
            0;
          return bImp - aImp;
        }
        if (summaryConfig?.sortBy === "label") {
          return a.label?.localeCompare(b.label || "") || 0;
        }
        if (summaryConfig?.sortBy === "order") {
          const aOrder = (a as SummaryField).order ?? 0;
          const bOrder = (b as SummaryField).order ?? 0;
          return aOrder - bOrder;
        }
        return 0;
      });
    }

    if (summaryConfig?.maxFields && summaryConfig.maxFields > 0) {
      selectedFields = selectedFields.slice(0, summaryConfig.maxFields);
    }

    return {
      ...shape,
      fields: selectedFields,
      originalFieldCouint: originalFieldCount,
      includedFieldCount: selectedFields.length,
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 1,
    memoizable: true,
  }
);
