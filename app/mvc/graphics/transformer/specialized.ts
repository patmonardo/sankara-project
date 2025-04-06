import { BaseTransformer, TransformError } from "./transformer";
import { TransformContext } from "../schema/transform";
import { FormShape, FormField } from "../schema/form";

/**
 * FieldTransformer - Applies transformations to specific fields
 */
export class FieldTransformer extends BaseTransformer<FormShape, FormShape> {
  constructor(
    private readonly fieldTransformations: Record<string, (field: Field, context: TransformContext) => Field>,
    name: string = "FieldTransformer"
  ) {
    super(name);
  }

  transform(input: FormShape, context: TransformContext): FormShape {
    // Create a shallow copy of the form
    const result: FormShape = { ...input };

    // Transform fields using the provided transformations
    result.fields = input.fields.map(field => {
      // If we have a transformation for this field, apply it
      if (this.fieldTransformations[field.id]) {
        try {
          return this.fieldTransformations[field.id](field, context);
        } catch (error) {
          throw new TransformError(
            `Field transformation failed for field '${field.id}'`,
            {
              transformerName: this.name,
              cause: error,
              context
            }
          );
        }
      }

      // Otherwise return the field unchanged
      return field;
    });

    return result;
  }
}

/**
 * FilterTransformer - Filters fields based on criteria
 */
export class FilterTransformer extends BaseTransformer<FormShape, FormShape> {
  constructor(
    private readonly filterFn: (field: FormField, context: TransformContext) => boolean,
    name: string = "FilterTransformer"
  ) {
    super(name);
  }

  transform(input: FormShape, context: TransformContext): FormShape {
    // Create a shallow copy of the form
    const result: FormShape = { ...input };

    // Filter fields using the provided filter function
    result.fields = input.fields.filter(field => {
      try {
        return this.filterFn(field, context);
      } catch (error) {
        throw new TransformError(
          `Field filtering failed for field '${field.id}'`,
          {
            transformerName: this.name,
            cause: error,
            context
          }
        );
      }
    });

    return result;
  }

  /**
   * Create a transformer that includes only the specified fields
   */
  static includeFields(fieldIds: string[]): FilterTransformer {
    return new FilterTransformer(
      field => fieldIds.includes(field.id) || fieldIds.includes('*'),
      `Include_${fieldIds.join('_')}`
    );
  }

  /**
   * Create a transformer that excludes the specified fields
   */
  static excludeFields(fieldIds: string[]): FilterTransformer {
    return new FilterTransformer(
      field => !fieldIds.includes(field.id),
      `Exclude_${fieldIds.join('_')}`
    );
  }

  /**
   * Create a transformer that shows or hides sensitive fields
   */
  static sensitiveFields(show: boolean): FilterTransformer {
    return new FilterTransformer(
      field => show || !field.sensitive,
      show ? "ShowSensitiveFields" : "HideSensitiveFields"
    );
  }
}

/**
 * GroupingTransformer - Reorganizes fields into logical groups
 */
export class GroupingTransformer extends BaseTransformer<FormShape, FormShape> {
  constructor(
    private readonly groups: Record<string, {
      label: string;
      fieldIds: string[];
      meta?: Record<string, any>;
    }>,
    name: string = "GroupingTransformer"
  ) {
    super(name);
  }

  transform(input: FormShape, context: TransformContext): FormShape {
    // Create maps for quick lookup
    const fieldMap = new Map<string, Field>();
    for (const field of input.fields) {
      fieldMap.set(field.id, field);
    }

    // Create group fields
    const groupFields: Field[] = [];
    const remainingFields = new Set(input.fields.map(f => f.id));

    // Process each group
    for (const [groupId, group] of Object.entries(this.groups)) {
      // Find all fields for this group
      const childFields: Field[] = [];

      for (const fieldId of group.fieldIds) {
        const field = fieldMap.get(fieldId);
        if (field) {
          childFields.push(field);
          remainingFields.delete(fieldId);
        }
      }

      // Create a group field
      if (childFields.length > 0) {
        groupFields.push({
          id: groupId,
          type: 'group',
          label: group.label,
          children: childFields,
          meta: {
            ...group.meta,
            isGenerated: true,
            originalIds: group.fieldIds
          }
        });
      }
    }

    // Add any remaining fields that weren't in groups
    const ungroupedFields = input.fields.filter(f => remainingFields.has(f.id));

    // Create the result form with grouped fields
    return {
      ...input,
      fields: [...groupFields, ...ungroupedFields],
      meta: {
        ...input.meta,
        grouped: true,
        groupIds: Object.keys(this.groups)
      }
    };
  }
}

/**
 * Factory for common field transformations
 */
export const FieldTransformations = {
  /**
   * Transform all text fields to uppercase
   */
  uppercaseTextFields: new FieldTransformer(
    Object.fromEntries(
      ["text", "string", "email", "name"].map(type => [
        type,
        (field: Field) => ({
          ...field,
          value: typeof field.value === 'string'
            ? field.value.toUpperCase()
            : field.value
        })
      ])
    ),
    "UppercaseTextTransformer"
  ),

  /**
   * Format date fields according to specified format
   */
  formatDates: (format: string) => new FieldTransformer(
    {
      "date": (field: Field) => ({
        ...field,
        displayFormat: format,
        // Note: actual formatting would happen in the UI layer
        meta: { ...field.meta, dateFormat: format }
      })
    },
    `DateFormatter_${format}`
  ),

  /**
   * Mask sensitive data like SSN, credit card numbers, etc.
   */
  maskSensitiveData: new FieldTransformer(
    Object.fromEntries(
      ["ssn", "creditCard", "password"].map(type => [
        type,
        (field: Field) => ({
          ...field,
          value: typeof field.value === 'string'
            ? field.value.replace(/./g, '*')
            : field.value,
          meta: { ...field.meta, masked: true }
        })
      ])
    ),
    "SensitiveDataMasker"
  )
};
