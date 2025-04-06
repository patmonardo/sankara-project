import { createMorph } from "../../../morph";
import { EditOutput } from "../../edit/base";
import { MorpheusContext } from "../../../schema/context";

/**
 * NextMatrixAdapterMorph: Connects MatrixMode to Next.js
 * 
 * This morph adapts the MatrixMode action/event/handler system to work
 * seamlessly with Next.js server actions and React patterns.
 */
export const NextMatrixAdapterMorph = createMorph<EditOutput, EditOutput>(
  "NextMatrixAdapterMorph",
  (shape, context) => {
    // Get adapter configuration
    const { nextAdapter } = context.powerTools?.matrix || {};
    
    if (!nextAdapter) return shape;
    
    // Check if MatrixMode is enabled
    const matrixEnabled = shape.meta?.matrix?.enabled || false;
    
    if (!matrixEnabled) {
      console.warn("NextMatrixAdapterMorph: MatrixMode is not enabled. Use MatrixActionBridgeMorph first.");
      return shape;
    }
    
    // Get Next.js specific options
    const {
      serverActions = {},
      formOptions = {},
      clientComponents = {}
    } = nextAdapter;
    
    // Get existing handlers
    const handlers = shape.handlers || {};
    
    // Connect server actions to Matrix handlers
    if (serverActions) {
      Object.entries(serverActions).forEach(([handlerId, serverAction]) => {
        if (handlers[handlerId]) {
          // Enhance existing handler with server action
          handlers[handlerId] = {
            ...handlers[handlerId],
            serverAction,
            meta: {
              ...handlers[handlerId].meta,
              next: {
                isServerAction: true,
                timestamp: new Date().toISOString()
              }
            }
          };
        }
      });
    }
    
    // Return adapted shape
    return {
      ...shape,
      handlers,
      meta: {
        ...shape.meta,
        next: {
          integrated: true,
          timestamp: new Date().toISOString(),
          formOptions: {
            mode: formOptions.mode || 'onSubmit',
            revalidateOnFocus: formOptions.revalidateOnFocus !== false,
            shouldUnregister: formOptions.shouldUnregister || false
          },
          clientComponents: {
            useClient: clientComponents.useClient !== false,
            clientDirective: clientComponents.clientDirective || 'use client'
          }
        },
        matrix: {
          ...shape.meta.matrix,
          nextAdapter: {
            enabled: true,
            timestamp: new Date().toISOString()
          }
        }
      }
    };
  },
  {
    pure: false,
    fusible: true,
    cost: 3
  }
);