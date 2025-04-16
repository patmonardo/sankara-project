import { createMorph } from "../morph";
import { isEditContext } from "../mode";
import { EditOutput, EditField } from "./pipeline";

/**
 * Apply edit-specific validation rules
 *
 * This morph validates fields according to edit-specific rules:
 * - Required fields must have values
 * - Field values must meet type constraints
 * - Custom validation rules from context
 */
export const EditValidationMorph = createMorph<EditOutput, EditOutput>(
  "EditValidationMorph",
  (shape, context) => {
    // Get edit context options
    const editContext = isEditContext(context) ? context : undefined;
    const validationRules = editContext?.validationRules || {};

    // Get changed fields
    const changedFields = shape.meta?.edit?.changedFields || [];

    // Validate fields and collect errors
    const fieldsWithValidation = shape.fields.map((field) => {
      if (!field.id) return field;

      const errors: string[] = [];
      const warnings: string[] = [];

      // Required field validation
      if (
        field.required &&
        (field.value === undefined ||
          field.value === null ||
          field.value === "")
      ) {
        errors.push("This field is required");
      }

      // Type-specific validations
      if (field.type === "number" && field.value !== undefined) {
        if (field.min !== undefined && field.value < field.min) {
          errors.push(`Value must be at least ${field.min}`);
        }
        if (field.max !== undefined && field.value > field.max) {
          errors.push(`Value must be at most ${field.max}`);
        }
      }

      if (field.type === "text" && typeof field.value === "string") {
        if (
          field.minLength !== undefined &&
          field.value.length < field.minLength
        ) {
          errors.push(`Must be at least ${field.minLength} characters`);
        }
        if (
          field.maxLength !== undefined &&
          field.value.length > field.maxLength
        ) {
          errors.push(`Must be at most ${field.maxLength} characters`);
        }
        if (field.pattern && !new RegExp(field.pattern).test(field.value)) {
          errors.push(`Does not match required format`);
        }
      }

      // Custom validation rules
      if (validationRules[field.id]) {
        const customErrors = validationRules[field.id](
          field,
          shape
        );
        if (customErrors && customErrors.length > 0) {
          errors.push(...customErrors);
        }
      }

      // Only validate changed fields if specified
      const validateAll = editContext?.validateAllFields !== false;
      const shouldValidate = validateAll || changedFields.includes(field.id);

      return {
        ...field,
        validation: shouldValidate
          ? {
              valid: errors.length === 0,
              errors,
              warnings,
              touched: changedFields.includes(field.id),
              dirty: changedFields.includes(field.id),
            }
          : field.validation,
      };
    });

    // Update form-level validation status
    const isValid = fieldsWithValidation.every(
      (field) => !field.validation || field.validation.valid !== false
    );

    return {
      ...shape,
      fields: fieldsWithValidation,
      isValid,
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 2,
  }
);

/**
 * Apply field-level validation UI
 *
 * This morph enhances fields with validation UI elements:
 * - Error messages
 * - Warning indicators
 * - Validation status indicators
 */
export const EditValidationUIMorph = createMorph<EditOutput, EditOutput>(
  "EditValidationUIMorph",
  (shape, context) => {
    // Process fields to add validation UI
    const fieldsWithValidationUI = shape.fields.map((field) => {
      if (!field.validation) return field;

      return {
        ...field,
        meta: {
          ...(field.meta || {}),
          ui: {
            ...(field.meta?.ui || {}),
            validationStatus:
              field.validation.valid === false
                ? "error"
                : field.validation.warnings?.length > 0
                ? "warning"
                : "valid",
            showErrors:
              field.validation.valid === false && field.validation.touched,
            showWarnings:
              field.validation.warnings?.length > 0 && field.validation.touched,
          },
        },
      };
    });

    return {
      ...shape,
      fields: fieldsWithValidationUI,
      meta: {
        ...shape.meta,
        validation: {
          performed: true,
          timestamp: Date.now(),
          fieldErrors: shape.fields.filter((f) => f.validation?.valid === false)
            .length,
        },
      },
    };
  },
  {
    pure: false, // Not pure due to timestamp
    fusible: true,
    cost: 1,
  }
);

/**
 * Complete edit validation pipeline
 */
import { createPipeline } from "../morph";

export const EditValidationPipeline = createPipeline<EditOutput>(
  "EditValidationPipeline"
)
  .pipe(EditValidationMorph)
  .pipe(EditValidationUIMorph)
  .build({
    description: "Apply edit-specific validation and validation UI",
    category: "form",
    tags: ["form", "edit", "validation"],
    inputType: "EditOutput",
    outputType: "EditOutput",
  });
