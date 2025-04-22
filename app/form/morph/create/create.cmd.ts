import fs from 'fs';
import path from 'path';
import { FormShape } from '../../schema/form';
import { CreateFormContext, CreateFormShape } from './types';
import { CreateFormPipeline } from './pipeline';

/**
 * Handle create mode interactive shell
 */
export async function handleCreateMode(options: any) {
  // Implementation for interactive mode
  console.log("Entering create mode...");
  
  // Load form schema
  const formData = options.file ? 
    JSON.parse(fs.readFileSync(options.file, 'utf8')) :
    { id: 'default', name: 'Default Form', fields: [] };
  
  // Generate create form
  const result = await handleCreateForm({
    ...options,
    file: options.file || null,
    data: formData
  });
  
  return result;
}

/**
 * Handle create form generation
 */
export async function handleCreateForm(options: any) {
  try {
    // Read the form schema
    const formData = options.data || 
      (options.file ? JSON.parse(fs.readFileSync(options.file, 'utf8')) : null);
    
    if (!formData) {
      throw new Error('Form schema is required. Provide it with --file or as data.');
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
    
    // Create context matching CreateFormContext type
    const context: CreateFormContext = {
      id: `create-${formData.id || 'form'}`,
      timestamp: Date.now(),
      mode: "create",
      data: {  // Note the data wrapper to match your type
        initialValues: options.initialValues ? JSON.parse(options.initialValues) : {},
        includeFields: options.includeFields?.split(','),
        excludeFields: options.excludeFields?.split(','),
        submitLabel: options.submitLabel || 'Create',
        cancelLabel: options.cancelLabel || 'Cancel',
        showCancel: options.showCancel !== false,
        showReset: options.showReset === true,
        
        // Configuration options
        config: {
          validateOnChange: options.validateOnChange !== false,
          validateOnBlur: options.validateOnBlur !== false,
          validateOnSubmit: true,
          submitOnEnter: options.submitOnEnter !== false,
          showLabels: options.showLabels !== false,
          showRequiredIndicator: options.showRequiredIndicator !== false
        },
        
        // Custom field configuration
        customization: customization,
        
        // Template support
        template: options.template ? {
          id: options.templateId || 'default-template',
          name: options.templateName || 'Default Template',
          description: options.templateDescription,
          values: options.templateValues ? JSON.parse(options.templateValues) : {}
        } : undefined
      }
    };
    
    // Run the pipeline
    const result = CreateFormPipeline.run(formData, context) as CreateFormShape;
    
    // Output result
    if (options.output) {
      const outputData = options.pretty 
        ? JSON.stringify(result, null, 2) 
        : JSON.stringify(result);
      fs.writeFileSync(options.output, outputData);
      console.log(`Create form written to ${options.output}`);
    } else {
      console.log(JSON.stringify(result, null, options.pretty ? 2 : 0));
    }
    
    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Unknown error:', error);
    }
    process.exit(1);
  }
}

/**
 * Export function for programmatic usage
 * This is what other modules will typically use
 */
export function createFormFromSchema(
  schema: FormShape, 
  options: Partial<CreateFormContext['data']> = {}
): CreateFormShape {
  // Create a properly formed context
  const context: CreateFormContext = {
    id: `create-${schema.id || 'form'}`,
    timestamp: Date.now(),
    mode: "create",
    data: {
      initialValues: options.initialValues || {},
      includeFields: options.includeFields,
      excludeFields: options.excludeFields,
      submitLabel: options.submitLabel || 'Create',
      cancelLabel: options.cancelLabel || 'Cancel',
      showCancel: options.showCancel !== false,
      showReset: options.showReset || false,
      config: options.config || {
        validateOnSubmit: true,
      },
      customization: options.customization,
      template: options.template,
      templateOptions: options.templateOptions
    }
  };
  
  // Run the pipeline
  return CreateFormPipeline.run(schema, context) as CreateFormShape;
}