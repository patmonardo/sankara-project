import fs from 'fs';
import path from 'path';
import { FormShape } from '../../schema/form';
import { EditFormContext, EditFormShape } from './types';
import { EditFormPipeline } from './pipeline';

/**
 * Handle edit mode interactive shell
 */
export async function handleEditMode(options: any) {
  // Implementation for interactive mode
  console.log("Entering edit mode...");
  
  // Load form schema
  const formData = options.file ? 
    JSON.parse(fs.readFileSync(options.file, 'utf8')) :
    { id: 'default', name: 'Default Form', fields: [] };
  
  // Generate edit form
  const result = await handleEditForm({
    ...options,
    file: options.file || null,
    data: formData
  });
  
  return result;
}

/**
 * Handle edit form generation
 */
export async function handleEditForm(options: any) {
  try {
    // Read the form schema
    const formData = options.data || 
      (options.file ? JSON.parse(fs.readFileSync(options.file, 'utf8')) : null);
    
    if (!formData) {
      throw new Error('Form schema is required. Provide it with --file or as data.');
    }
    
    // Read the current values
    let currentValues = {};
    if (options.values) {
      try {
        currentValues = JSON.parse(options.values);
      } catch (error) {
        if (error instanceof Error) {
          console.error('Invalid values JSON:', error.message);
        }
        process.exit(1);
      }
    }
    
    // Read the original values (defaults to current if not specified)
    let originalValues = {};
    if (options.originalValues) {
      try {
        originalValues = JSON.parse(options.originalValues);
      } catch (error) {
        if (error instanceof Error) {
          console.error('Invalid original values JSON:', error.message);
        }
        process.exit(1);
      }
    } else {
      // Default to current values if not specified
      originalValues = { ...currentValues };
    }
    
    // Parse customization JSON if provided
    let customization = undefined;
    if (options.customize) {
      try {
        customization = JSON.parse(options.customize);
      } catch (error) {
        if (error instanceof Error) {
          console.error('Invalid customization JSON:', error.message);
        }
        process.exit(1);
      }
    }
    
    // Create context matching EditFormContext type
    const context: EditFormContext = {
      id: `edit-${formData.id || 'form'}`,
      timestamp: Date.now(),
      operation: "edit",
      data: {
        entityId: options.entityId,
        currentValues,
        originalValues,
        includeFields: options.includeFields?.split(','),
        excludeFields: options.excludeFields?.split(','),
        submitLabel: options.submitLabel || 'Save',
        cancelLabel: options.cancelLabel || 'Cancel',
        showCancel: options.showCancel !== false,
        showReset: options.showReset === true,
        
        config: {
          validateOnChange: options.validateOnChange !== false,
          validateOnBlur: options.validateOnBlur !== false,
          validateOnSubmit: true,
          submitOnEnter: options.submitOnEnter !== false,
          showLabels: options.showLabels !== false,
          showRequiredIndicator: options.showRequiredIndicator !== false,
          showValidationErrors: options.showValidationErrors !== false,
          trackChanges: options.trackChanges !== false,
          confirmDiscardChanges: options.confirmDiscardChanges !== false,
          labelPosition: options.labelPosition || 'top'
        },
        
        customization: customization,
        template: options.template ? {
          id: options.templateId || 'default-template',
          name: options.templateName || 'Default Template',
          description: options.templateDescription,
          values: options.templateValues ? JSON.parse(options.templateValues) : {}
        } : undefined
      }
    };
    
    // Run the pipeline
    const result = EditFormPipeline.run(formData, context) as EditFormShape;
    
    // Output result
    if (options.output) {
      const outputData = options.pretty 
        ? JSON.stringify(result, null, 2) 
        : JSON.stringify(result);
      fs.writeFileSync(options.output, outputData);
      console.log(`Edit form written to ${options.output}`);
    } else {
      console.log(JSON.stringify(result, null, options.pretty ? 2 : 0));
    }
    
    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Unknown error');
    }
    process.exit(1);
  }
}

/**
 * Export function for programmatic usage
 */
export function editFormFromSchema(
  schema: FormShape, 
  options: Partial<EditFormContext['data']> = {}
): EditFormShape {
  const context: EditFormContext = {
    id: `edit-${schema.id || 'form'}`,
    timestamp: Date.now(),
    operation: "edit",
    data: {
      currentValues: options.currentValues || {},
      originalValues: options.originalValues || options.currentValues || {},
      includeFields: options.includeFields,
      excludeFields: options.excludeFields,
      submitLabel: options.submitLabel || 'Save',
      cancelLabel: options.cancelLabel || 'Cancel',
      showCancel: options.showCancel !== false,
      showReset: options.showReset || false,
      config: options.config || {
        validateOnSubmit: true,
        trackChanges: true
      },
      customization: options.customization,
      template: options.template,
      templateOptions: options.templateOptions
    }
  };
  
  return EditFormPipeline.run(schema, context) as EditFormShape;
}