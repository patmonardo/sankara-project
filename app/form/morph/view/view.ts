import { createMorph } from "../core";
import { FormShape } from "../../schema/form";
import { ViewFormShape, ViewFormField } from "./types";  // Fix: removed dot, added comma

/**
 * ViewFormMorph - Transforms a FormShape into a ViewFormShape
 * 
 * This prepares a form for display-only mode with the provided data.
 * It enforces read-only access and formats values for presentation.
 */
export const ViewFormMorph = createMorph<FormShape, ViewFormShape>(
  "ViewFormMorph",
  (shape, context) => {
    // Check for required data
    if (!context?.data?.data && !shape.data) {
      throw new Error("View mode requires data. Provide it in shape.data or context.data.data");
    }

    // Use data from context or from the shape itself
    const data = context?.data?.data || shape.data;
    
    // Prepare fields for view mode
    const viewFields: ViewFormField[] = shape.fields.map(field => ({
      ...field,
      disabled: true,
      readOnly: true,
      label: field.label || field.id,
      value: data[field.id],
      displayValue: formatFieldValue(field, data[field.id]),
      meta: {
        ...(field.meta || {}),
        originalValue: data[field.id],
        mode: "view"
      }
    }));

    // Return properly typed ViewFormShape
    return {
      ...shape,
      fields: viewFields,
      mode: "view" as const,  // Use const assertion for literal type
      isNew: false,
      data: data,
      valid: true,
      complete: true,
      meta: {
        ...(shape.meta || {}),
        mode: "view",
        timestamp: new Date().toISOString(),
        title: shape.title || `View ${shape.name}`,
        formType: "ViewFormShape"
      }
    };
  },
  {
    pure: false, // Uses Date()
    fusible: true,
    cost: 3,
    description: "Transforms a FormShape into a ViewFormShape for display-only presentation"
  }
);

/**
 * Format field value for display
 */
function formatFieldValue(field: any, value: any): string {
  if (value === undefined || value === null) {
    return '';
  }
  
  switch (field.type) {
    case 'date':
      return value instanceof Date 
        ? value.toLocaleDateString() 
        : new Date(value).toLocaleDateString();
      
    case 'datetime':
      return value instanceof Date 
        ? value.toLocaleString() 
        : new Date(value).toLocaleString();
      
    case 'boolean':
      return value ? 'Yes' : 'No';
      
    case 'select':
    case 'radio':
      // Find option label if available
      if (field.options) {
        const option = field.options.find((o: any) => o.value === value);
        return option ? option.label : value;
      }
      return String(value);
      
    case 'multiselect':
    case 'checkbox':
      if (Array.isArray(value)) {
        if (field.options) {
          // Map selected values to labels
          return value.map(v => {
            const option = field.options.find((o: any) => o.value === v);
            return option ? option.label : v;
          }).join(', ');
        }
        return value.join(', ');
      }
      return String(value);
      
    case 'object':
      return JSON.stringify(value);
      
    default:
      return String(value);
  }
}
