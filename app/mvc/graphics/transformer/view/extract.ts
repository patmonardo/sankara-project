import { FormShape } from "../../schema/form";
import { BaseTransformer } from "../../schema/transform";
import { TransformContext } from "../../schema/transform";

/**
 * ViewExtractTransformer - Extracts and prepares form data for viewing
 *
 * This transformer focuses on the context-specific extraction of data
 * for viewing purposes.
 */
export class ViewExtractTransformer extends BaseTransformer<FormShape, any> {
  constructor() {
    super("ViewExtractTransformer");
  }

  transform(input: FormShape, context: TransformContext): any {
    // Extract essential view data from form
    const fields = Object.entries(input.fields).map(([id, field]) => {
      return {
        id,
        label: field.label || id,
        value: this.formatValueForDisplay(field.value, field.type, context),
        type: field.type
      };
    });

    // Return view-specific data structure
    return {
      id: input.id,
      fields,
      // Include context-specific metadata
      contextual: {
        viewedAt: new Date().toISOString(),
        ontologicalLevel: context.ontologicalLevel,
        constraints: context.constraints
      }
    };
  }

  /**
   * Format a value for display based on type and context
   */
  private formatValueForDisplay(value: any, type: string, context: TransformContext): any {
    // No value case
    if (value === undefined || value === null) {
      return '—';
    }

    // Type-specific formatting
    switch (type) {
      case 'date':
        return this.formatDate(value, context);
      case 'number':
        return this.formatNumber(value, context);
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'array':
        return Array.isArray(value)
          ? value.join(', ')
          : String(value);
      default:
        return String(value);
    }
  }

  /**
   * Format a date value considering context
   */
  private formatDate(value: any, context: TransformContext): string {
    try {
      const date = new Date(value);
      return date.toLocaleDateString();
    } catch (e) {
      return String(value);
    }
  }

  /**
   * Format a numeric value considering context
   */
  private formatNumber(value: any, context: TransformContext): string {
    try {
      const num = Number(value);
      return num.toLocaleString(undefined, {
        maximumFractionDigits: 2
      });
    } catch (e) {
      return String(value);
    }
  }
}
