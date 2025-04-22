import { FormShape, FormField } from "../../schema/form";
import { createMorph } from "../../morph/core";
import { EditFormShape, EditFormField, EditFormContext } from "./types";

/**
 * Core Modal Morph for transforming FormShape into EditFormShape
 * This handles the fundamental transformation from a schema definition
 * to an edit-mode ready structure with values, change tracking, and state.
 */
export const EditFormMorph = createMorph<FormShape, EditFormShape>(
  "EditFormMorph",
  (shape, context) => {
    // Ensure context has necessary data
    if (!context?.data) {
      throw new Error("EditFormMorph requires context with data");
    }
    
    const { 
      currentValues = {}, 
      originalValues = {},
      submitLabel = "Save",
      cancelLabel = "Cancel",
      showCancel = true,
      showReset = false
    } = context.data;
    
    // Transform fields for edit mode
    const fieldsInitialized: string[] = [];
    const editFields: EditFormField[] = shape.fields.map(field => {
      const fieldId = field.id;
      fieldsInitialized.push(fieldId);
      
      // Get current and original values with fallbacks
      const value = currentValues[fieldId] ?? field.defaultValue ?? null;
      const originalValue = originalValues[fieldId] ?? value;
      const hasChanged = JSON.stringify(value) !== JSON.stringify(originalValue);
      
      return {
        ...field,
        inputType: field.type,
        value,
        originalValue,
        visible: true,
        disabled: field.readOnly || false,
        readOnly: field.readOnly || false,
        hasChanged,
        meta: {
          ...field.meta,
          mode: "edit",
          pristine: !hasChanged,
          touched: hasChanged,
          changed: hasChanged
        }
      };
    });
    
    // Determine if any field has changes
    const hasChanges = editFields.some(field => field.hasChanged);
    
    // Track which fields have changes
    const changedFields = hasChanges ? 
      editFields.filter(field => field.hasChanged).map(field => field.id) : 
      undefined;
    
    // Return the edit form shape
    return {
      ...shape,
      mode: "edit",
      isNew: false,
      originalValues,
      hasChanges,
      valid: false, // Initial state, validation will update this
      complete: false, // Initial state, validation will update this
      fields: editFields,
      submitButton: {
        label: submitLabel,
        position: "bottom"
      },
      cancelButton: showCancel ? {
        label: cancelLabel,
        position: "bottom"
      } : undefined,
      resetButton: showReset ? {
        label: "Reset",
        position: "bottom"
      } : undefined,
      meta: {
        ...(shape.meta || {}),
        mode: "edit",
        timestamp: new Date().toISOString(),
        fieldsInitialized,
        title: shape.title || `Edit ${shape.name}`,
        changedFields
      }
    };
  },
  {
    pure: false, // Not pure due to timestamp
    fusible: true,
    cost: 5,
    description: "Core Modal Morph for transforming FormShape into EditFormShape"
  }
);

/**
 * Filter fields based on includeFields/excludeFields in context
 */
export const FilterFieldsMorph = createMorph<FormShape, FormShape>(
  "FilterFieldsMorph",
  (shape, context) => {
    if (!context?.data) return shape;
    
    const { includeFields, excludeFields } = context.data;
    
    if (!includeFields && !excludeFields) return shape;
    
    const filteredFields = shape.fields.filter(field => {
      // Include only fields in includeFields if specified
      if (includeFields && includeFields.length > 0) {
        return includeFields.includes(field.id);
      }
      
      // Exclude fields in excludeFields if specified
      if (excludeFields && excludeFields.length > 0) {
        return !excludeFields.includes(field.id);
      }
      
      return true;
    });
    
    return {
      ...shape,
      fields: filteredFields
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 2,
    description: "Filter fields based on includeFields/excludeFields in context"
  }
);

/**
 * Set up validation for edit form fields
 */
export const SetupValidationMorph = createMorph<EditFormShape, EditFormShape>(
  "SetupValidationMorph",
  (shape, context) => {
    // Skip if no validation config
    if (!context?.data?.config?.validateOnChange) return shape;
    
    // Add validation handlers to fields
    const fieldsWithValidation = shape.fields.map(field => ({
      ...field,
      meta: {
        ...field.meta,
        validateOnChange: true,
        validationMessages: field.validationMessages || {},
      }
    }));
    
    return {
      ...shape,
      fields: fieldsWithValidation,
      meta: {
        ...shape.meta,
        validateOnChange: true
      }
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 3,
    description: "Set up validation for edit form fields"
  }
);