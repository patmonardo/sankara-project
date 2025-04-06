/**
 * Form handler manipulation
 * 
 * Adds, removes, or modifies form handlers
 */
export const HandlerManipulationMorph = createMorph<EditOutput, EditOutput>(
  "HandlerManipulationMorph",
  (shape, context) => {
    // Get handler operations
    const { operations } = context.powerTools?.handlers || {};
    
    // Skip if no operations defined
    if (!operations || operations.length === 0) return shape;
    
    // Start with current handlers or empty object
    let handlers = { ...(shape.handlers || {}) };
    const handlerLog: any[] = [];
    
    // Apply operations
    for (const operation of operations) {
      const operationLog = {
        type: operation.type,
        success: false,
        timestamp: new Date().toISOString()
      };
      
      try {
        switch (operation.type) {
          case 'addHandler':
            if (operation.id && operation.handler) {
              // Add the handler
              handlers = {
                ...handlers,
                [operation.id]: operation.handler
              };
              
              operationLog.success = true;
              operationLog.details = { id: operation.id };
            } else {
              operationLog.error = 'Missing handler details';
            }
            break;
            
          case 'removeHandler':
            if (operation.id) {
              // Create new handlers object without the specified handler
              const { [operation.id]: removed, ...remainingHandlers } = handlers;
              handlers = remainingHandlers;
              
              operationLog.success = !!removed;
              operationLog.details = { id: operation.id };
              
              if (!operationLog.success) {
                operationLog.error = `Handler ${operation.id} not found`;
              }
            } else {
              operationLog.error = 'Missing handler ID';
            }
            break;
            
          case 'updateHandler':
            if (operation.id && operation.updates) {
              // Check if handler exists
              if (handlers[operation.id]) {
                // Update the handler
                handlers = {
                  ...handlers,
                  [operation.id]: {
                    ...handlers[operation.id],
                    ...operation.updates
                  }
                };
                
                operationLog.success = true;
                operationLog.details = { id: operation.id };
              } else {
                operationLog.error = `Handler ${operation.id} not found`;
              }
            } else {
              operationLog.error = 'Missing handler details';
            }
            break;
            
          default:
            operationLog.error = `Unknown operation type: ${operation.type}`;
        }
      } catch (error) {
        operationLog.error = error instanceof Error ? error.message : String(error);
      }
      
      handlerLog.push(operationLog);
    }
    
    return {
      ...shape,
      handlers,
      meta: {
        ...shape.meta,
        powerTools: {
          ...(shape.meta?.powerTools || {}),
          handlers: {
            timestamp: new Date().toISOString(),
            operations: handlerLog,
            success: handlerLog.every(log => log.success)
          }
        }
      }
    };
  },
  {
    pure: false, // Not pure due to timestamp
    fusible: false, // Handler operations shouldn't be fused
    cost: 3
  }
);