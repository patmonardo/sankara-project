import React from "react";
import { FormField } from "../schema/form";
import { getFieldStyles } from "../../theme/style-morph";

export interface FieldRendererProps {
  field: FormField;
  mode: 'view' | 'edit' | 'create';
  value?: any;
  onChange?: (value: any) => void;
}

/**
 * Render a form field based on its type and mode
 */
export function renderField({
  field,
  mode,
  value,
  onChange
}: FieldRendererProps): React.ReactNode {
  // Use field value if provided, otherwise use the props value
  const fieldValue = value !== undefined ? value : field.value;
  
  // Render based on the field type and mode
  switch (field.type) {
    case 'text':
    case 'string':
      return renderTextField(field, mode, fieldValue, onChange);
      
    case 'number':
      return renderNumberField(field, mode, fieldValue, onChange);
      
    case 'boolean':
    case 'checkbox':
      return renderBooleanField(field, mode, fieldValue, onChange);
      
    case 'date':
    case 'datetime':
      return renderDateField(field, mode, fieldValue, onChange);
      
    case 'select':
    case 'dropdown':
      return renderSelectField(field, mode, fieldValue, onChange);
      
    case 'textarea':
    case 'richtext':
      return renderTextareaField(field, mode, fieldValue, onChange);
      
    case 'file':
    case 'image':
      return renderFileField(field, mode, fieldValue, onChange);
      
    case 'group':
    case 'fieldset':
      return renderGroupField(field, mode, fieldValue, onChange);
      
    default:
      // Apply style morphism
      const styles = getFieldStyles(field.type, 
                                    mode as 'view' | 'edit' | 'create',
                                    field.error ? 'error' : 
                                    field.success ? 'success' : 'idle');
      
      // Fallback renderer
      return (
        <div className={styles.className} style={styles.style}>
          <label>{field.label}</label>
          <div className="field-value">{String(fieldValue || '')}</div>
          {field.error && <div className="field-error">{field.error}</div>}
        </div>
      );
  }
}

/**
 * Render a text field
 */
function renderTextField(field: FormField, mode: string, value: any, onChange?: (value: any) => void): React.ReactNode {
  // Apply style morphism
  const styles = getFieldStyles('text', 
                               mode as 'view' | 'edit' | 'create', 
                               field.error ? 'error' : field.success ? 'success' : 'idle');
  
  if (mode === 'view') {
    return (
      <div className={styles.className} style={styles.style}>
        <label>{field.label}</label>
        <div className="field-value">{value || ''}</div>
        {field.error && <div className="field-error">{field.error}</div>}
      </div>
    );
  } else {
    return (
      <div className={styles.className} style={styles.style}>
        <label htmlFor={field.id}>{field.label}</label>
        <input
          id={field.id}
          type="text"
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          disabled={field.disabled}
          readOnly={field.readOnly}
        />
        {field.help && <div className="field-help">{field.help}</div>}
        {field.error && <div className="field-error">{field.error}</div>}
      </div>
    );
  }
}

// Implement similar updates for other field renderers
// (I won't include all of them for brevity, but each would follow the same pattern)