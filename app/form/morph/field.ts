import { SimpleMorph } from "./morph";
import { FormShape, FormField } from "../schema/form";
import { FormExecutionContext } from "../schema/context";
import { morpheus } from "../modality/morpheus";


/**
 * Create a morph that transforms specific fields
 */
export function createFieldTransformer(
  fieldTransformations: Record<
    string, 
    (field: FormField, context: FormExecutionContext) => FormField
  >,
  name: string = "FieldTransformer"
): SimpleMorph<FormShape, FormShape> {
  return new SimpleMorph<FormShape, FormShape>(
    name,
    (input, context) => {
      // Create a shallow copy of the form
      const result: FormShape = { ...input };
      
      // Transform fields using the provided transformations
      result.fields = input.fields.map(field => {
        // If we have a transformation for this field type, apply it
        if (fieldTransformations[field.type]) {
          try {
            return fieldTransformations[field.type](field, context);
          } catch (error) {
            console.error(`Field transformation failed for field '${field.id}'`, error);
            return field; // Return original on error
          }
        }
        
        // If we have a transformation for this specific field ID, apply it
        if (fieldTransformations[field.id]) {
          try {
            return fieldTransformations[field.id](field, context);
          } catch (error) {
            console.error(`Field transformation failed for field '${field.id}'`, error);
            return field; // Return original on error
          }
        }
        
        // Otherwise return the field unchanged
        return field;
      });
      
      return result;
    },
    {
      pure: true,
      fusible: true,
      cost: 1,
      memoizable: true
    }
  );
}

/**
 * Create a morph that filters fields based on criteria
 */
export function createFieldFilter(
  filterFn: (field: FormField, context: FormExecutionContext) => boolean,
  name: string = "FieldFilter"
): SimpleMorph<FormShape, FormShape> {
  return new SimpleMorph<FormShape, FormShape>(
    name,
    (input, context) => {
      // Create a shallow copy of the form
      const result: FormShape = { ...input };
      
      // Filter fields using the provided filter function
      result.fields = input.fields.filter(field => {
        try {
          return filterFn(field, context);
        } catch (error) {
          console.error(`Field filtering failed for field '${field.id}'`, error);
          return true; // Include on error for safety
        }
      });
      
      return result;
    },
    {
      pure: true,
      fusible: true,
      cost: 0.5,
      memoizable: true
    }
  );
}

/**
 * Create a morph that includes only specified fields
 */
export function includeFields(
  fieldIds: string[]
): SimpleMorph<FormShape, FormShape> {
  return createFieldFilter(
    field => fieldIds.includes(field.id) || fieldIds.includes('*'),
    `Include_${fieldIds.join('_')}`
  );
}

/**
 * Create a morph that excludes specified fields
 */
export function excludeFields(
  fieldIds: string[]
): SimpleMorph<FormShape, FormShape> {
  return createFieldFilter(
    field => !fieldIds.includes(field.id),
    `Exclude_${fieldIds.join('_')}`
  );
}

/**
 * Create a morph that shows or hides sensitive fields
 */
export function sensitiveFields(
  show: boolean
): SimpleMorph<FormShape, FormShape> {
  return createFieldFilter(
    field => show || !field.sensitive,
    show ? "ShowSensitiveFields" : "HideSensitiveFields"
  );
}

/**
 * Create a morph that reorganizes fields into logical groups
 */
export function createGroupingMorph(
  groups: Record<string, {
    label: string;
    fieldIds: string[];
    meta?: Record<string, any>;
  }>,
  name: string = "GroupingMorph"
): SimpleMorph<FormShape, FormShape> {
  return new SimpleMorph<FormShape, FormShape>(
    name,
    (input, context) => {
      // Create maps for quick lookup
      const fieldMap = new Map<string, FormField>();
      for (const field of input.fields) {
        fieldMap.set(field.id, field);
      }
      
      // Create group fields
      const groupFields: FormField[] = [];
      const remainingFields = new Set(input.fields.map(f => f.id));
      
      // Process each group
      for (const [groupId, group] of Object.entries(groups)) {
        // Find all fields for this group
        const childFields: FormField[] = [];
        
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
          groupIds: Object.keys(groups)
        }
      };
    },
    {
      pure: true,
      fusible: false, // Grouping is complex, best not to attempt fusion
      cost: 2, // Higher cost due to complexity
      memoizable: true
    }
  );
}

/**
 * Common field transformations as morphs
 */
export const FieldMorphs = {
  /**
   * Transform all text fields to uppercase
   */
  uppercaseTextFields: createFieldTransformer(
    Object.fromEntries(
      ["text", "string", "email", "name"].map(type => [
        type,
        (field: FormField) => ({
          ...field,
          value: typeof field.value === 'string'
            ? field.value.toUpperCase()
            : field.value
        })
      ])
    ),
    "UppercaseTextMorph"
  ),
  
  /**
   * Format date fields according to specified format
   */
  formatDates: (format: string) => createFieldTransformer(
    {
      "date": (field: FormField) => ({
        ...field,
        displayFormat: format,
        meta: { ...field.meta, dateFormat: format }
      })
    },
    `DateFormatter_${format}`
  ),
  
  /**
   * Mask sensitive data like SSN, credit card numbers, etc.
   */
  maskSensitiveData: createFieldTransformer(
    Object.fromEntries(
      ["ssn", "creditCard", "password"].map(type => [
        type,
        (field: FormField) => ({
          ...field,
          value: typeof field.value === 'string'
            ? field.value.replace(/./g, '*')
            : field.value,
          meta: { ...field.meta, masked: true }
        })
      ])
    ),
    "SensitiveDataMasker"
  ),
  
  /**
   * Group standard contact fields
   */
  contactInfoGrouping: createGroupingMorph({
    "contactGroup": {
      label: "Contact Information",
      fieldIds: ["email", "phone", "address", "city", "state", "zip"],
      meta: { icon: "contact" }
    }
  }),
  
  /**
   * Group standard personal fields 
   */
  personalInfoGrouping: createGroupingMorph({
    "personalGroup": {
      label: "Personal Information",
      fieldIds: ["firstName", "lastName", "dob", "ssn"],
      meta: { icon: "person" }
    }
  })
};

// Register all field morphs with the morpheus system
export function registerFieldMorphs(): void {
  // Register standard field morphs
  morpheus.define(FieldMorphs.uppercaseTextFields, {
    description: "Transforms text fields to uppercase",
    category: "field-transformation",
    tags: ["text", "uppercase"]
  });
  
  morpheus.define(FieldMorphs.maskSensitiveData, {
    description: "Masks sensitive data like SSN, credit card numbers, etc.",
    category: "security",
    tags: ["mask", "sensitive", "security"]
  });
  
  // Register the date formatter with common formats
  const dateFormats = ["MM/DD/YYYY", "YYYY-MM-DD", "DD-MM-YYYY", "MMMM D, YYYY"];
  for (const format of dateFormats) {
    morpheus.define(FieldMorphs.formatDates(format), {
      description: `Formats date fields as ${format}`,
      category: "field-formatting",
      tags: ["date", "format", format]
    });
  }
  
  // Register grouping morphs
  morpheus.define(FieldMorphs.contactInfoGrouping, {
    description: "Groups contact information fields",
    category: "field-grouping",
    tags: ["group", "contact"]
  });
  
  morpheus.define(FieldMorphs.personalInfoGrouping, {
    description: "Groups personal information fields",
    category: "field-grouping",
    tags: ["group", "personal"]
  });
  
  // Register factory functions for dynamic creation
  morpheus.registerFactory("includeFields", includeFields, {
    description: "Creates a morph that includes only the specified fields",
    category: "field-filter",
    tags: ["filter", "include"]
  });
  
  morpheus.registerFactory("excludeFields", excludeFields, {
    description: "Creates a morph that excludes the specified fields",
    category: "field-filter",
    tags: ["filter", "exclude"]
  });
  
  morpheus.registerFactory("sensitiveFields", sensitiveFields, {
    description: "Creates a morph that shows or hides sensitive fields",
    category: "field-filter",
    tags: ["filter", "sensitive"]
  });
  
  morpheus.registerFactory("createFieldTransformer", createFieldTransformer, {
    description: "Creates a custom field transformer",
    category: "field-transformation",
    tags: ["transform", "custom"]
  });
  
  morpheus.registerFactory("createGroupingMorph", createGroupingMorph, {
    description: "Creates a custom grouping morph",
    category: "field-grouping",
    tags: ["group", "custom"]
  });
}