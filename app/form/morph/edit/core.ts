import { createMorph } from "../morph";
import { FormShape } from "../../schema/form";
import { FormExecutionContext, isEditContext } from "../../schema/context";
import { EditOutput } from "./base";

/**
 * Initialize field values for edit mode
 * 
 * This morph ensures all fields have appropriate values from either:
 * 1. The context.values
 * 2. The field's existing value
 * 3. The field's defaultValue
 */
export const EditFieldValuesMorph = createMorph<EditOutput, EditOutput>(
  "EditFieldValuesMorph",
  (shape, context) => {
    // Get context values
    const currentValues = context.values || {};
    
    // Process fields to ensure they have values
    const fieldsWithValues = shape.fields.map(field => {
      if (!field.id) return field;
      
      // Determine the field value (context values take precedence)
      const value = field.id in currentValues ? 
        currentValues[field.id] : 
        (field.value !== undefined ? field.value : field.defaultValue);
      
      return {
        ...field,
        value
      };
    });
    
    return {
      ...shape,
      fields: fieldsWithValues
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 1
  }
);

/**
 * Apply field-level edit constraints
 * 
 * This morph applies edit-specific constraints to fields:
 * - Read-only fields in edit mode
 * - Required fields in edit mode
 * - Edit-specific validation rules
 */
export const EditFieldConstraintsMorph = createMorph<EditOutput, EditOutput>(
  "EditFieldConstraintsMorph",
  (shape, context) => {
    // Get edit context options
    const editContext = isEditContext(context) ? context : undefined;
    
    // Get fields that should be read-only
    const readOnlyFields = editContext?.readOnlyFields || [];
    
    // Apply constraints to fields
    const constrainedFields = shape.fields.map(field => {
      if (!field.id) return field;
      
      // Check if field should be read-only
      const isReadOnly = readOnlyFields.includes(field.id) || field.readOnly;
      
      // Apply edit-specific validation rules
      const validation = {
        ...(field.validation || {}),
        // Edit-specific validation rules can be added here
        editMode: true
      };
      
      return {
        ...field,
        readOnly: isReadOnly,
        validation
      };
    });
    
    return {
      ...shape,
      fields: constrainedFields
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 1
  }
);

/**
 * Track field edit history
 * 
 * This morph adds tracking information to fields to record:
 * - Original values
 * - Change history
 * - Modification timestamps
 */
export const EditFieldHistoryMorph = createMorph<EditOutput, EditOutput>(
  "EditFieldHistoryMorph",
  (shape, context) => {
    // Get edit context options
    const editContext = isEditContext(context) ? context : undefined;
    const trackHistory = editContext?.trackHistory !== false;
    
    // Skip if history tracking is disabled
    if (!trackHistory) return shape;
    
    // Current timestamp
    const now = new Date().toISOString();
    
    // Original values from shape.meta.edit
    const originalValues = shape.meta?.edit?.originalValues || {};
    
    // Process fields to add history
    const fieldsWithHistory = shape.fields.map(field => {
      if (!field.id) return field;
      
      // Get original value
      const originalValue = field.id in originalValues ? 
        originalValues[field.id] : field.value;
      
      // Has the field changed?
      const hasChanged = field.value !== originalValue;
      
      return {
        ...field,
        meta: {
          ...(field.meta || {}),
          history: {
            original: originalValue,
            changed: hasChanged,
            lastModified: hasChanged ? now : undefined
          }
        }
      };
    });
    
    return {
      ...shape,
      fields: fieldsWithHistory
    };
  },
  {
    pure: false, // Not pure due to timestamp
    fusible: true,
    cost: 2
  }
);

/**
 * Complete edit core pipeline
 */
import { createPipeline } from "../pipeline";

export const EditCorePipeline = createPipeline<EditOutput, EditOutput>("EditCorePipeline")
  .pipe(EditFieldValuesMorph)
  .pipe(EditFieldConstraintsMorph)
  .pipe(EditFieldHistoryMorph)
  .build({
    description: "Apply core edit mode transformations to fields",
    category: "form",
    tags: ["form", "edit", "fields"],
    inputType: "EditOutput",
    outputType: "EditOutput"
  });