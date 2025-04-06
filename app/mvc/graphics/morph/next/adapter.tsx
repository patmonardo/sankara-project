/**
 * NextFormAdapterMorph: Bridge between Next/React forms and KB forms
 * 
 * Allows KB forms to work seamlessly with Next/React paradigms
 * while preserving their rich knowledge structure.
 */
export const NextFormAdapterMorph = createMorph<EditOutput, EditOutput>(
  "NextFormAdapterMorph",
  (shape, context) => {
    // Get Next.js form configuration from context
    const { nextForm } = context.powerTools || {};
    
    if (!nextForm) return shape;
    
    // Extract Next.js specific options
    const { 
      serverAction,
      validationMode = 'onChange',
      revalidateOnFocus = true,
      shouldUnregister = false,
      criteriaMode = 'firstError',
      mode = 'onSubmit'
    } = nextForm;
    
    // Map our form to Next.js compatible structure while preserving KB richness
    return {
      ...shape,
      meta: {
        ...shape.meta,
        nextjs: {
          serverAction,
          formOptions: {
            mode,
            revalidateMode: validationMode,
            revalidateOnFocus,
            shouldUnregister,
            criteriaMode
          },
          adapter: {
            version: '1.0.0',
            timestamp: new Date().toISOString()
          }
        },
        handlers: {
          ...(shape.meta?.handlers || {}),
          onSubmit: serverAction 
            ? { type: 'serverAction', action: serverAction } 
            : shape.meta?.handlers?.onSubmit
        }
      },
      // Enhance fields with Next.js specific attributes
      fields: shape.fields.map(field => ({
        ...field,
        meta: {
          ...(field.meta || {}),
          nextjs: {
            registerOptions: buildRegisterOptions(field),
            fieldMode: field.readOnly ? 'readOnly' : 'edit'
          }
        }
      }))
    };
  },
  {
    pure: false, // Not pure due to timestamp
    fusible: true,
    cost: 2
  }
);

// Helper to build register options for Next.js/React Hook Form
function buildRegisterOptions(field: any) {
  const options: any = {};
  
  // Map validation
  if (field.required) {
    options.required = field.validation?.requiredMessage || 'This field is required';
  }
  
  // Type-specific validations
  if (field.type === 'text' || field.type === 'email' || field.type === 'password') {
    if (field.minLength !== undefined) {
      options.minLength = {
        value: field.minLength,
        message: field.validation?.minLengthMessage || 
          `Must be at least ${field.minLength} characters`
      };
    }
    
    if (field.maxLength !== undefined) {
      options.maxLength = {
        value: field.maxLength,
        message: field.validation?.maxLengthMessage || 
          `Must be at most ${field.maxLength} characters`
      };
    }
    
    if (field.pattern) {
      options.pattern = {
        value: new RegExp(field.pattern),
        message: field.validation?.patternMessage || 'Invalid format'
      };
    }
    
    if (field.type === 'email') {
      options.pattern = {
        value: /\S+@\S+\.\S+/,
        message: field.validation?.emailMessage || 'Invalid email address'
      };
    }
  }
  
  if (field.type === 'number') {
    if (field.min !== undefined) {
      options.min = {
        value: field.min,
        message: field.validation?.minMessage || `Must be at least ${field.min}`
      };
    }
    
    if (field.max !== undefined) {
      options.max = {
        value: field.max,
        message: field.validation?.maxMessage || `Must be at most ${field.max}`
      };
    }
  }
  
  return options;
}

/**
 * ClientServerInteractionMorph: Enhances forms with precise client-server interaction
 * 
 * Adds capabilities for optimistic updates, streaming responses,
 * and progressive form submission needed for modern Next.js applications.
 */
export const ClientServerInteractionMorph = createMorph<EditOutput, EditOutput>(
  "ClientServerInteractionMorph",
  (shape, context) => {
    // Get client-server config
    const { clientServer } = context.powerTools || {};
    
    if (!clientServer) return shape;
    
    // Add client-server interaction capabilities
    return {
      ...shape,
      meta: {
        ...shape.meta,
        clientServer: {
          optimisticUpdates: clientServer.optimisticUpdates !== false,
          streaming: clientServer.streaming || false,
          progressiveSubmission: clientServer.progressiveSubmission || false,
          formState: {
            persistStrategy: clientServer.persistStrategy || 'session',
            rehydrateOnLoad: clientServer.rehydrateOnLoad !== false,
            syncInterval: clientServer.syncInterval || 0
          },
          errorHandling: {
            strategy: clientServer.errorStrategy || 'fieldLevel',
            retry: clientServer.retry || false,
            fallback: clientServer.fallback || 'client'
          }
        },
        handlers: {
          ...(shape.meta?.handlers || {}),
          serverSync: clientServer.serverSync
        }
      },
      // Add client-server capabilities to specific fields
      fields: shape.fields.map(field => {
        // Skip fields that don't need special handling
        if (!field.id || !clientServer.fields?.[field.id]) return field;
        
        const fieldConfig = clientServer.fields[field.id];
        
        return {
          ...field,
          meta: {
            ...(field.meta || {}),
            clientServer: {
              liveValidation: fieldConfig.liveValidation || false,
              asyncValidation: fieldConfig.asyncValidation || false,
              debounce: fieldConfig.debounce || 0,
              serverDependencies: fieldConfig.serverDependencies || [],
              refreshOn: fieldConfig.refreshOn || [],
              updateStrategy: fieldConfig.updateStrategy || 'onChange'
            }
          }
        };
      })
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 2
  }
);