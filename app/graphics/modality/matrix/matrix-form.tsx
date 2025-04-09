import React, { useState, useEffect } from 'react';
import { useDialecticalCore } from '../../../../neo/dialectic';
import { z } from 'zod';

/**
 * Matrix Form Processor
 * Utilizes the Dialectical Core to implement distributed form processing
 * 
 * This specialized processor focuses on Form as its primary domain,
 * creating a bridge between the Dialectical Core and form-specific operations
 */

// Form schema definitions
const FormFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'number', 'boolean', 'select', 'multiselect', 'date']),
  label: z.string(),
  required: z.boolean().default(false),
  defaultValue: z.any().optional(),
  placeholder: z.string().optional(),
  validations: z.array(z.object({
    type: z.string(),
    params: z.record(z.any()).optional(),
    message: z.string()
  })).optional(),
  options: z.array(z.object({
    value: z.any(),
    label: z.string()
  })).optional()
});

const FormSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(FormFieldSchema),
  submitLabel: z.string().optional(),
  clearOnSubmit: z.boolean().optional(),
  workflow: z.object({
    initialState: z.string(),
    states: z.record(z.object({
      transitions: z.array(z.object({
        to: z.string(),
        condition: z.string().optional(),
        role: z.string().optional()
      })).optional()
    }))
  }).optional()
});

// React context for Matrix Form Processor
const MatrixFormContext = React.createContext<{
  defineForm: (form: z.infer<typeof FormSchema>) => Promise<string>;
  getForm: (formId: string) => Promise<z.infer<typeof FormSchema> | null>;
  submitForm: (formId: string, values: Record<string, any>) => Promise<{ submissionId: string; status: string }>;
  getSubmissions: (formId: string) => Promise<any[]>;
} | null>(null);

/**
 * Matrix Form Provider component
 */
export function MatrixFormProvider({ children }: { children: React.ReactNode }) {
  const core = useDialecticalCore();
  const [initialized, setInitialized] = useState(false);
  const [formSpace, setFormSpace] = useState<string | null>(null);
  
  // Initialize the form processor
  useEffect(() => {
    const init = async () => {
      try {
        // Create form space
        const spaceId = core.createComponentSpace('Matrix Form Processor');
        setFormSpace(spaceId);
        
        // Register form-related property definitions
        const formDefinitionPropId = await core.property.defineProperty({
          name: 'formDefinition',
          type: 'object'
        });
        
        const formSubmissionPropId = await core.property.defineProperty({
          name: 'formSubmission',
          type: 'object'
        });
        
        // Announce initialization
        await core.neo.emitEvent({
          type: 'matrix',
          subtype: 'form-processor-ready',
          source: core.neo['componentId'],
          timestamp: Date.now(),
          content: {
            spaceId,
            propertyIds: {
              formDefinition: formDefinitionPropId,
              formSubmission: formSubmissionPropId
            }
          }
        });
        
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Matrix Form Processor:', error);
      }
    };
    
    init();
  }, [core]);
  
  // Define a form
  const defineForm = async (form: z.infer<typeof FormSchema>): Promise<string> => {
    if (!initialized || !formSpace) {
      throw new Error('Matrix Form Processor not initialized');
    }
    
    try {
      // Validate form definition
      FormSchema.parse(form);
      
      // Create a form node in the graph
      const formNodeId = await core.graph.createNode({
        type: 'form',
        properties: {
          id: form.id,
          title: form.title,
          description: form.description,
          createdAt: Date.now()
        }
      });
      
      // Store form definition as a property
      await core.property.setPropertyValue(formNodeId, 'formDefinition', form);
      
      // Announce form creation
      await core.neo.emitEvent({
        type: 'matrix',
        subtype: 'form-created',
        source: core.neo['componentId'],
        timestamp: Date.now(),
        content: {
          formId: form.id,
          formNodeId,
          form
        }
      });
      
      return formNodeId;
    } catch (error) {
      console.error('Failed to define form:', error);
      throw error;
    }
  };
  
  // Get a form definition
  const getForm = async (formId: string): Promise<z.infer<typeof FormSchema> | null> => {
    if (!initialized) {
      throw new Error('Matrix Form Processor not initialized');
    }
    
    try {
      // Find form node
      const formNodes = await core.graph.findNodes({
        type: 'form',
        properties: { id: formId }
      });
      
      if (formNodes.length === 0) {
        return null;
      }
      
      const formNodeId = formNodes[0].id;
      
      // Get form definition
      const formDefinition = core.property.getPropertyValue(formNodeId, 'formDefinition');
      return formDefinition;
    } catch (error) {
      console.error('Failed to get form:', error);
      throw error;
    }
  };
  
  // Submit a form
  const submitForm = async (formId: string, values: Record<string, any>): Promise<{ submissionId: string; status: string }> => {
    if (!initialized || !formSpace) {
      throw new Error('Matrix Form Processor not initialized');
    }
    
    try {
      // Get form definition
      const form = await getForm(formId);
      
      if (!form) {
        throw new Error(`Form not found: ${formId}`);
      }
      
      // Create submission ID
      const submissionId = `submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create submission node
      const submissionNodeId = await core.graph.createNode({
        type: 'form-submission',
        properties: {
          id: submissionId,
          formId,
          status: 'submitted',
          submittedAt: Date.now()
        }
      });
      
      // Store submission values
      await core.property.setPropertyValue(submissionNodeId, 'formSubmission', {
        id: submissionId,
        formId,
        values,
        state: form.workflow?.initialState || 'submitted',
        timestamp: Date.now()
      });
      
      // Connect submission to form
      const formNodes = await core.graph.findNodes({
        type: 'form',
        properties: { id: formId }
      });
      
      if (formNodes.length > 0) {
        await core.graph.createEdge({
          source: formNodes[0].id,
          target: submissionNodeId,
          type: 'has-submission',
          properties: {}
        });
      }
      
      // Announce submission
      await core.neo.emitEvent({
        type: 'matrix',
        subtype: 'form-submitted',
        source: core.neo['componentId'],
        timestamp: Date.now(),
        content: {
          submissionId,
          formId,
          values
        }
      });
      
      return {
        submissionId,
        status: 'submitted'
      };
    } catch (error) {
      console.error('Failed to submit form:', error);
      throw error;
    }
  };
  
  // Get form submissions
  const getSubmissions = async (formId: string): Promise<any[]> => {
    if (!initialized) {
      throw new Error('Matrix Form Processor not initialized');
    }
    
    try {
      // Find form node
      const formNodes = await core.graph.findNodes({
        type: 'form',
        properties: { id: formId }
      });
      
      if (formNodes.length === 0) {
        return [];
      }
      
      const formNodeId = formNodes[0].id;
      
      // Find submission edges
      const edges = await core.graph.findEdges(formNodeId, 'outgoing');
      const submissionIds = edges
        .filter(edge => edge.type === 'has-submission')
        .map(edge => edge.target);
      
      // Get submission values
      const submissions = submissionIds.map(nodeId => {
        const submission = core.property.getPropertyValue(nodeId, 'formSubmission');
        return submission;
      }).filter(Boolean);
      
      return submissions;
    } catch (error) {
      console.error('Failed to get form submissions:', error);
      throw error;
    }
  };
  
  // Create context value
  const contextValue = {
    defineForm,
    getForm,
    submitForm,
    getSubmissions
  };
  
  if (!initialized) {
    return <div>Initializing Matrix Form Processor...</div>;
  }
  
  return (
    <MatrixFormContext.Provider value={contextValue}>
      {children}
    </MatrixFormContext.Provider>
  );
}

/**
 * Hook to use the Matrix Form Processor
 */
export function useMatrixForm() {
  const context = React.useContext(MatrixFormContext);
  
  if (!context) {
    throw new Error('useMatrixForm must be used within a MatrixFormProvider');
  }
  
  return context;
}

/**
 * Matrix Form component
 */
interface MatrixFormProps {
  formId: string;
  initialValues?: Record<string, any>;
  onSubmit?: (values: Record<string, any>, result: any) => void;
  className?: string;
}

export function MatrixForm({
  formId,
  initialValues = {},
  onSubmit,
  className
}: MatrixFormProps) {
  const matrixForm = useMatrixForm();
  const [form, setForm] = useState<z.infer<typeof FormSchema> | null>(null);
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  
  // Load form definition
  useEffect(() => {
    const loadForm = async () => {
      try {
        setLoading(true);
        const formDef = await matrixForm.getForm(formId);
        
        if (formDef) {
          setForm(formDef);
          
          // Set default values
          const defaultValues = { ...initialValues };
          formDef.fields.forEach(field => {
            if (field.defaultValue !== undefined && defaultValues[field.id] === undefined) {
              defaultValues[field.id] = field.defaultValue;
            }
          });
          
          setValues(defaultValues);
        }
      } catch (error) {
        console.error('Failed to load form:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadForm();
  }, [formId, matrixForm, initialValues]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form || submitting) return;
    
    try {
      setSubmitting(true);
      
      // Validate form
      const newErrors: Record<string, string[]> = {};
      let hasErrors = false;
      
      for (const field of form.fields) {
        const value = values[field.id];
        const fieldErrors: string[] = [];
        
        // Check required
        if (field.required && (value === undefined || value === null || value === '')) {
          fieldErrors.push(`${field.label} is required`);
        }
        
        // Apply validations
        if (field.validations && value !== undefined) {
          for (const validation of field.validations) {
            let isValid = true;
            
            switch (validation.type) {
              case 'min':
                if (field.type === 'number') {
                  isValid = value >= validation.params?.value;
                } else {
                  isValid = String(value).length >= validation.params?.value;
                }
                break;
                
              case 'max':
                if (field.type === 'number') {
                  isValid = value <= validation.params?.value;
                } else {
                  isValid = String(value).length <= validation.params?.value;
                }
                break;
                
              case 'pattern':
                isValid = new RegExp(validation.params?.pattern).test(String(value));
                break;
            }
            
            if (!isValid) {
              fieldErrors.push(validation.message);
            }
          }
        }
        
        if (fieldErrors.length > 0) {
          newErrors[field.id] = fieldErrors;
          hasErrors = true;
        }
      }
      
      if (hasErrors) {
        setErrors(newErrors);
        setSubmitting(false);
        return;
      }
      
      // Submit form
      const result = await matrixForm.submitForm(formId, values);
      
      // Call onSubmit callback
      onSubmit?.(values, result);
      
      // Clear form if needed
      if (form.clearOnSubmit !== false) {
        const defaultValues: Record<string, any> = {};
        
        form.fields.forEach(field => {
          if (field.defaultValue !== undefined) {
            defaultValues[field.id] = field.defaultValue;
          }
        });
        
        setValues(defaultValues);
      }
      
      // Clear errors
      setErrors({});
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle field change
  const handleChange = (fieldId: string, value: any) => {
    setValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear field errors
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: []
      }));
    }
  };
  
  if (loading) {
    return <div className="matrix-form-loading">Loading form...</div>;
  }
  
  if (!form) {
    return <div className="matrix-form-error">Form not found</div>;
  }
  
  return (
    <form 
      className={`matrix-form ${className || ''}`}
      onSubmit={handleSubmit}
    >
      <h2 className="matrix-form-title">{form.title}</h2>
      
      {form.description && (
        <div className="matrix-form-description">{form.description}</div>
      )}
      
      <div className="matrix-form-fields">
        {form.fields.map(field => (
          <div 
            key={field.id} 
            className={`matrix-form-field field-type-${field.type} ${
              errors[field.id]?.length ? 'has-error' : ''
            }`}
          >
            <label htmlFor={field.id} className="matrix-form-label">
              {field.label}
              {field.required && <span className="required-mark">*</span>}
            </label>
            
            {/* Render field input based on type */}
            {renderField(field, values[field.id], (value) => handleChange(field.id, value))}
            
            {/* Field errors */}
            {errors[field.id]?.length > 0 && (
              <div className="field-errors">
                {errors[field.id].map((error, i) => (
                  <div key={i} className="field-error">{error}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="matrix-form-actions">
        <button 
          type="submit" 
          className="matrix-form-submit"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : form.submitLabel || 'Submit'}
        </button>
      </div>
    </form>
  );
}

// Helper function to render field input based on type
function renderField(
  field: z.infer<typeof FormFieldSchema>, 
  value: any, 
  onChange: (value: any) => void
) {
  switch (field.type) {
    case 'text':
      return (
        <input
          type="text"
          id={field.id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
        />
      );
      
    case 'number':
      return (
        <input
          type="number"
          id={field.id}
          value={value ?? ''}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={field.placeholder}
          required={field.required}
        />
      );
      
    case 'boolean':
      return (
        <input
          type="checkbox"
          id={field.id}
          checked={value || false}
          onChange={(e) => onChange(e.target.checked)}
          required={field.required}
        />
      );
      
    case 'select':
      return (
        <select
          id={field.id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        >
          <option value="" disabled>
            {field.placeholder || 'Select an option'}
          </option>
          
          {field.options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
      
    // Additional field types can be implemented here
      
    default:
      return <div>Unsupported field type: {field.type}</div>;
  }
}