import { createMorph } from "../../../morph";
import { EditOutput } from "../ui/graphics/morph/edit/base";
import { MorpheusContext } from "../ui/graphics/schema/context";
import { z } from "zod";
import { initTRPC } from "@trpc/server";

// Import our new services
import { MatrixEventService, LocalMatrixEventService } from './core/event-system';
import { MatrixMessageService, createLocalMessageService } from './core/message-service';
import { MatrixActionBridge } from './action-bridge-integration';

// Import Matrix protocol
import { 
  MatrixProtocolService, 
  MatrixProtocolConfig, 
  createMatrixProtocolService 
} from './matrix-protocol';

/**
 * MatrixMode Action/Event/Handler Bridge
 * 
 * This system forms the core of the Matrix distributed message architecture:
 * 1. Creates a unified event-driven messaging system connecting UI and logic
 * 2. Implements a fully declarative approach to action/handler relationships
 * 3. Provides the foundation for distributed execution across Matrix nodes
 */

/**
 * Core types for the Matrix messaging system
 */
type ActionType = 'button' | 'submit' | 'reset' | 'link' | 'menu' | 'custom';
type HandlerType = 'procedure' | 'serverAction' | 'clientEffect' | 'mutation' | 'query' | 'remote' | 'distributed';
type EventType = 'click' | 'submit' | 'change' | 'focus' | 'blur' | 'system' | 'matrix' | 'custom';
type ExecutionMode = 'local' | 'remote' | 'distributed' | 'consensus' | 'any';

/**
 * Enhanced Zod schemas for MatrixMode validation
 */
const ActionSchema = z.object({
  id: z.string(),
  type: z.enum(['button', 'submit', 'reset', 'link', 'menu', 'custom']),
  label: z.string().optional(),
  events: z.array(z.string()).optional(),
  permission: z.string().optional(), // Access control
  meta: z.record(z.any()).optional()
});

const EventSchema = z.object({
  id: z.string(),
  type: z.enum(['click', 'submit', 'change', 'focus', 'blur', 'system', 'matrix', 'custom']),
  source: z.string().optional(),
  target: z.string().optional(),
  distributed: z.boolean().optional(), // Whether this event is distributed across the Matrix
  persist: z.boolean().optional(),     // Whether this event should be persisted
  encrypt: z.boolean().optional(),     // Whether this event should be encrypted
  meta: z.record(z.any()).optional()
});

const HandlerSchema = z.object({
  id: z.string(),
  type: z.enum(['procedure', 'serverAction', 'clientEffect', 'mutation', 'query', 'remote', 'distributed']),
  events: z.array(z.string()).optional(),
  procedure: z.string().optional(),
  executionMode: z.enum(['local', 'remote', 'distributed', 'consensus', 'any']).optional(),
  permission: z.string().optional(), // Access control
  meta: z.record(z.any()).optional()
});

/**
 * Initialize tRPC with our MatrixMode context
 */
const t = initTRPC.context<{
  form: EditOutput;
  context: MorpheusContext;
  matrix: {
    roomId?: string;
    userId?: string;
    distributed: boolean;
  };
}>().create();

/**
 * Enhanced procedure builder for Matrix distributed operations
 */
const matrixProcedureRouter = t.router({
  // Standard procedures (same as before but with Matrix context)
  submitForm: t.procedure
    .input(z.object({
      formId: z.string(),
      values: z.record(z.any()),
      executionMode: z.enum(['local', 'remote', 'distributed', 'consensus', 'any']).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { formId, values, executionMode = 'local' } = input;
      const { form, context, matrix } = ctx;
      
      // Implementation would handle distributed execution based on executionMode
      return { 
        success: true, 
        formId, 
        distributed: executionMode !== 'local', 
        executedBy: executionMode === 'local' ? 'local' : matrix.userId || 'unknown',
        timestamp: new Date().toISOString() 
      };
    }),
  
  // Matrix-specific procedures
  dispatchMatrixEvent: t.procedure
    .input(z.object({
      eventId: z.string(),
      roomId: z.string().optional(),
      payload: z.record(z.any()).optional(),
      distributed: z.boolean().optional(),
      persist: z.boolean().optional(),
      encrypt: z.boolean().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { eventId, roomId, payload, distributed = true, persist = false, encrypt = false } = input;
      const { matrix } = ctx;
      
      // In a real implementation, this would dispatch to Matrix
      return { 
        dispatched: true, 
        eventId, 
        roomId: roomId || matrix.roomId || 'default',
        distributed,
        persisted: persist,
        encrypted: encrypt,
        timestamp: new Date().toISOString() 
      };
    }),
  
  // Distributed consensus procedures
  executeConsensusAction: t.procedure
    .input(z.object({
      actionId: z.string(),
      formId: z.string(),
      payload: z.record(z.any()).optional(),
      requiredConsensus: z.number().optional() // e.g., 0.67 for 2/3 majority
    }))
    .mutation(async ({ input, ctx }) => {
      const { actionId, formId, payload, requiredConsensus = 0.51 } = input;
      const { matrix } = ctx;
      
      // In a real implementation, this would initiate a consensus process
      return { 
        initiated: true, 
        actionId, 
        formId,
        consensusRequired: requiredConsensus,
        consensusId: `consensus_${Date.now()}`,
        initiatedBy: matrix.userId || 'unknown',
        timestamp: new Date().toISOString() 
      };
    })
});

/**
 * The MatrixMode bridge system
 */
export const MatrixActionBridgeMorph = createMorph<EditOutput, EditOutput>(
  "MatrixActionBridgeMorph",
  (shape, context) => {
    // Get MatrixMode configuration
    const { matrix } = context.powerTools || {};
    
    if (!matrix) return shape;
    
    // Extract existing elements
    const existingActions = shape.actions || [];
    const existingEvents = shape.meta?.events || [];
    const existingHandlers = shape.handlers || {};
    
    // Create new Matrix-enabled elements
    let matrixActions = [...existingActions];
    let matrixEvents = [...existingEvents];
    let matrixHandlers = { ...existingHandlers };
    
    // Process declared actions with MatrixMode enhancements
    if (matrix.actions && Array.isArray(matrix.actions)) {
      matrix.actions.forEach(actionDef => {
        try {
          ActionSchema.parse(actionDef);
        } catch (error) {
          console.error(`Invalid action definition for ${actionDef.id}:`, error);
          return;
        }
        
        const existingIndex = matrixActions.findIndex(a => a.id === actionDef.id);
        const actionObj = {
          ...actionDef,
          meta: {
            ...(existingIndex >= 0 ? matrixActions[existingIndex].meta || {} : {}),
            ...(actionDef.meta || {}),
            matrix: {
              enabled: true,
              distributed: actionDef.meta?.matrix?.distributed !== false,
              permission: actionDef.permission || 'default',
              events: actionDef.events || [],
              timestamp: new Date().toISOString()
            }
          }
        };
        
        if (existingIndex >= 0) {
          matrixActions[existingIndex] = actionObj;
        } else {
          matrixActions.push(actionObj);
        }
      });
    }
    
    // Process declared events with MatrixMode enhancements
    if (matrix.events && Array.isArray(matrix.events)) {
      matrix.events.forEach(eventDef => {
        try {
          EventSchema.parse(eventDef);
        } catch (error) {
          console.error(`Invalid event definition for ${eventDef.id}:`, error);
          return;
        }
        
        const eventObj = {
          ...eventDef,
          meta: {
            ...(eventDef.meta || {}),
            matrix: {
              registered: true,
              distributed: eventDef.distributed !== false,
              persist: eventDef.persist || false,
              encrypt: eventDef.encrypt || false,
              timestamp: new Date().toISOString()
            }
          }
        };
        
        matrixEvents.push(eventObj);
      });
    }
    
    // Process declared handlers with MatrixMode enhancements
    if (matrix.handlers && typeof matrix.handlers === 'object') {
      Object.entries(matrix.handlers).forEach(([handlerId, handlerDef]) => {
        try {
          HandlerSchema.parse({ id: handlerId, ...handlerDef });
        } catch (error) {
          console.error(`Invalid handler definition for ${handlerId}:`, error);
          return;
        }
        
        matrixHandlers[handlerId] = {
          ...handlerDef,
          meta: {
            ...(matrixHandlers[handlerId]?.meta || {}),
            ...(handlerDef.meta || {}),
            matrix: {
              connected: true,
              distributed: handlerDef.executionMode !== 'local',
              executionMode: handlerDef.executionMode || 'local',
              permission: handlerDef.permission || 'default',
              events: handlerDef.events || [],
              timestamp: new Date().toISOString()
            }
          }
        };
      });
    }
    
    // Enhanced automatic connections with MatrixMode awareness
    if (matrix.autoConnect !== false) {
      // Create standard action-event-handler connections
      matrixActions.forEach(action => {
        if (!action.id) return;
        
        // Create Matrix-aware default event
        const defaultEventId = `${action.id}Event`;
        if (!matrixEvents.some(e => e.id === defaultEventId)) {
          matrixEvents.push({
            id: defaultEventId,
            type: action.type === 'submit' ? 'submit' : 'click',
            source: action.id,
            distributed: action.meta?.matrix?.distributed !== false,
            meta: {
              matrix: {
                autoCreated: true,
                distributed: action.meta?.matrix?.distributed !== false,
                timestamp: new Date().toISOString()
              }
            }
          });
        }
        
        // Connect to Matrix-aware handler
        const matchingHandlerId = `on${action.id.charAt(0).toUpperCase() + action.id.slice(1)}`;
        if (matrixHandlers[matchingHandlerId]) {
          matrixHandlers[matchingHandlerId] = {
            ...matrixHandlers[matchingHandlerId],
            events: [
              ...(matrixHandlers[matchingHandlerId].events || []),
              defaultEventId
            ],
            meta: {
              ...(matrixHandlers[matchingHandlerId].meta || {}),
              matrix: {
                ...(matrixHandlers[matchingHandlerId].meta?.matrix || {}),
                events: [
                  ...(matrixHandlers[matchingHandlerId].meta?.matrix?.events || []),
                  defaultEventId
                ],
                autoConnected: true,
                distributed: matrixHandlers[matchingHandlerId].meta?.matrix?.distributed !== false
              }
            }
          };
        }
      });
    }
    
    // Generate the enhanced Matrix event dispatcher
    const matrixDispatcher = {
      dispatch: (eventId: string, payload?: Record<string, any>, options?: {
        distributed?: boolean;
        persist?: boolean;
        encrypt?: boolean;
        roomId?: string;
      }) => {
        // Find event to determine default options
        const event = matrixEvents.find(e => e.id === eventId);
        const distributed = options?.distributed ?? event?.meta?.matrix?.distributed ?? false;
        const persist = options?.persist ?? event?.meta?.matrix?.persist ?? false;
        const encrypt = options?.encrypt ?? event?.meta?.matrix?.encrypt ?? false;
        
        // In real implementation, this would use Matrix protocol
        return matrixProcedureRouter.dispatchMatrixEvent({
          eventId,
          roomId: options?.roomId,
          payload,
          distributed,
          persist,
          encrypt
        });
      },
      
      consensus: (actionId: string, payload?: Record<string, any>, requiredConsensus: number = 0.51) => {
        // In real implementation, this would initiate Matrix consensus
        return matrixProcedureRouter.executeConsensusAction({
          actionId,
          formId: shape.id || 'unknown',
          payload,
          requiredConsensus
        });
      }
    };
    
    // Return Matrix-enhanced shape
    return {
      ...shape,
      actions: matrixActions,
      handlers: matrixHandlers,
      meta: {
        ...shape.meta,
        events: matrixEvents,
        matrix: {
          enabled: true,
          timestamp: new Date().toISOString(),
          dispatcher: matrixDispatcher,
          procedureRouter: matrixProcedureRouter,
          actionCount: matrixActions.length,
          eventCount: matrixEvents.length,
          handlerCount: Object.keys(matrixHandlers).length,
          distributed: matrix.distributed !== false,
          roomId: matrix.roomId,
          serverId: matrix.serverId
        }
      }
    };
  },
  {
    pure: false,
    fusible: false,
    cost: 5
  }
);