import { FormFieldValidationSchema } from "../../schema/shape";
import { createMorph } from "../core";
import {
  FilterShape,
  FilterField,
  FilterContext,
} from "./filter";

/**
 * Extended shape with validation information
 */
export interface ValidationShape extends FilterShape {
  fields: ValidationField[];
  valid?: boolean;
  fieldErrorCount?: number;
}

/**
 * Field with validation properties
 */
export interface ValidationField extends FilterField {
  valid?: boolean;
  touched?: boolean;
  errors?: string[];
  dirty?: boolean;
  validationMessages?: Record<string, string>;
  validateOnChange?: boolean;
}

/**
 * Context for validation operations
 */
export interface ValidationContext extends FilterContext {
  validateOnChange?: boolean;
  validationRules?: Record<
    string,
    (field: ValidationField, shape: ValidationShape) => string[]
  >;
  validateAllFields?: boolean;
}

/**
 * Setup validation properties on fields
 */
export const SetupValidationMorph = createMorph<
  ValidationShape,
  ValidationShape
>("SetupValidationMorph", (shape, context) => {
  // Check validation setting in context
  if (!context?.validateOnChange) return shape;

  // Add validation to fields without nesting in meta
  const fieldsWithValidation = shape.fields.map((field) => ({
    ...field,
    validateOnChange: true,
    validationMessages: field.validation?.message || {},
  }));

  return {
    ...shape,
    fields: fieldsWithValidation,
  };
});

/**
 * Core validation morph
 */
export const ValidationMorph = createMorph<
  ValidationShape,
  ValidationShape
>(
  "ValidationMorph",
  (shape, context: ValidationContext) => {
    const rules = context.validationRules || {};
    const validateAll = context.validateAllFields !== false;

    const validated = shape.fields.map((field) => {
      if (!field.id) return field;

      // 1) pull in all the standard zod-driven constraints
      const parsed = FormFieldValidationSchema.parse({
        required: field.validation?.required,
        min: field.validation?.min,
        max: field.validation?.max,
        minLength: field.validation?.minLength,
        maxLength: field.validation?.maxLength,
        pattern: field.validation?.pattern,
        custom: rules[field.id], // treat rule fn as `custom`
        message: field.validation?.message, // optional override
      });

      const errors: string[] = [];

      // 2) required
      if (parsed.required && !field.value) {
        errors.push(parsed.message ?? "Field is required");
      }

      // 3) numeric range
      if (typeof field.value === "number") {
        if (parsed.min !== undefined && field.value < parsed.min) {
          errors.push(parsed.message ?? `Minimum is ${parsed.min}`);
        }
        if (parsed.max !== undefined && field.value > parsed.max) {
          errors.push(parsed.message ?? `Maximum is ${parsed.max}`);
        }
      }

      // 4) string length & pattern
      if (typeof field.value === "string") {
        if (
          parsed.minLength !== undefined &&
          field.value.length < parsed.minLength
        ) {
          errors.push(parsed.message ?? `Min length ${parsed.minLength}`);
        }
        if (
          parsed.maxLength !== undefined &&
          field.value.length > parsed.maxLength
        ) {
          errors.push(parsed.message ?? `Max length ${parsed.maxLength}`);
        }
        if (parsed.pattern && !new RegExp(parsed.pattern).test(field.value)) {
          errors.push(parsed.message ?? `Invalid format`);
        }
      }

      // 5) custom Zod-validated function
      if (parsed.custom) {
        const extra = parsed.custom(field as ValidationField, shape);
        if (Array.isArray(extra)) errors.push(...extra);
      }

      // 6) skip unchanged fields if requested
      const shouldValidate = validateAll || field.changed;
      if (!shouldValidate) return field;

      const valid = errors.length === 0;
      return {
        ...field,
        valid,
        errors,
        touched: field.changed || false,
        dirty: field.changed || false,
      };
    }) as ValidationField[];

    const fieldErrorCount = validated.filter((f) => !f.valid).length;
    const valid = fieldErrorCount === 0;

    return {
      ...shape,
      fields: validated,
      fieldErrorCount,
      valid,
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 2,
    memoizable: true,
  }
);