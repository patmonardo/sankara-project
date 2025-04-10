import { createMorph } from "../../morph";
import { EditOutput } from "../edit/base";
import { MorpheusContext } from "../../schema/context";
import { z } from "zod";
import { initTRPC } from "@trpc/server";

/**
 * A beautiful, declarative tRPC-based Action/Event/Handler bridge
 * 
 * This system:
 * 1. Uses tRPC for type-safe procedures that bridge UI and logic
 * 2. Implements an event-driven architecture with declarative connections
 * 3. Preserves the philosophical depth of our Matrix system
 */

/**
 * Core types for our declarative bridge
 */
type ActionType = 'button' | 'submit' | 'reset' | 'link' | 'custom';
type HandlerType = 'procedure' | 'serverAction' | 'clientEffect' | 'mutation' | 'query';
type EventType = 'click' | 'submit' | 'change' | 'focus' | 'blur' | 'custom';

/**
 * Zod schemas for validation
 */
const ActionSchema = z.object({
  id: z.string(),
  type: z.enum(['button', 'submit', 'reset', 'link', 'custom']),
  label: z.string().optional(),
  events: z.array(z.string()).optional(),
  meta: z.record(z.any()).optional()
});

const EventSchema = z.object({
  id: z.string(),
  type: z.enum(['click', 'submit', 'change', 'focus', 'blur', 'custom']),
  source: z.string().optional(),
  target: z.string().optional(),
  meta: z.record(z.any()).optional()
});

const HandlerSchema = z.object({
  id: z.string(),
  type: z.enum(['procedure', 'serverAction', 'clientEffect', 'mutation', 'query']),
  events: z.array(z.string()).optional(),
  procedure: z.string().optional(),
  meta: z.record(z.any()).optional()
});

/**
 * Initialize tRPC with our bridge context
 */
const t = initTRPC.context<{
  form: EditOutput;
  context: MorpheusContext;
}>().create();

/**
 * Core procedure builder that maps UI actions to handlers
 */
const procedureRouter = t.router({
  // Submission procedures
  submitForm: t.procedure
    .input(z.object({
      formId: z.string(),
      values: z.record(z.any())
    }))
    .mutation(async ({ input, ctx }) => {
      const { formId, values } = input;
      const { form, context } = ctx;
      
      // Implementation would dispatch to appropriate handler
      return { success: true, formId, timestamp: new Date().toISOString() };
    }),
  
  // Field validation procedures
  validateField: t.procedure
    .input(z.object({
      formId: z.string(),
      fieldId: z.string(),
      value: z.any()
    }))
    .query(async ({ input, ctx }) => {
      const { fieldId, value } = input;
      const { form, context } = ctx;
      
      // Implementation would validate using form rules
      return { valid: true, fieldId };
    }),
  
  // Custom action procedures
  executeAction: t.procedure
    .input(z.object({
      actionId: z.string(),
      formId: z.string(),
      payload: z.record(z.any()).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { actionId, formId, payload } = input;
      const { form, context } = ctx;
      
      // Implementation would execute the specific action
      return { success: true, actionId, formId };
    }),
  
  // Event dispatch procedure
  dispatchEvent: t.procedure
    .input(z.object({
      eventId: z.string(),
      source: z.string().optional(),
      payload: z.record(z.any()).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { eventId, source, payload } = input;
      const { form, context } = ctx;
      
      // Implementation would dispatch event to registered handlers
      return { dispatched: true, eventId, timestamp: new Date().toISOString() };
    })
});

/**
 * The bridge system that connects actions, events, and handlers
 */
export const ActionEventHandlerBridgeMorph = createMorph<EditOutput, EditOutput>(
  "ActionEventHandlerBridgeMorph",
  (shape, context) => {
    // Get bridge configuration
    const { bridge } = context.powerTools || {};
    
    if (!bridge) return shape;
    
    // Extract existing elements
    const existingActions = shape.actions || [];
    const existingEvents = shape.meta?.events || [];
    const existingHandlers = shape.handlers || {};
    
    // Create new bridge elements
    let bridgedActions = [...existingActions];
    let bridgedEvents = [...existingEvents];
    let bridgedHandlers = { ...existingHandlers };
    
    // Process declared actions
    if (bridge.actions && Array.isArray(bridge.actions)) {
      bridge.actions.forEach(actionDef => {
        // Validate action definition
        try {
          ActionSchema.parse(actionDef);
        } catch (error) {
          console.error(`Invalid action definition for ${actionDef.id}:`, error);
          return;
        }
        
        // Find or create action
        const existingIndex = bridgedActions.findIndex(a => a.id === actionDef.id);
        const actionObj = {
          ...actionDef,
          meta: {
            ...(existingIndex >= 0 ? bridgedActions[existingIndex].meta || {} : {}),
            ...(actionDef.meta || {}),
            bridge: {
              connected: true,
              events: actionDef.events || [],
              timestamp: new Date().toISOString()
            }
          }
        };
        
        if (existingIndex >= 0) {
          bridgedActions[existingIndex] = actionObj;
        } else {
          bridgedActions.push(actionObj);
        }
      });
    }
    
    // Process declared events
    if (bridge.events && Array.isArray(bridge.events)) {
      bridge.events.forEach(eventDef => {
        // Validate event definition
        try {
          EventSchema.parse(eventDef);
        } catch (error) {
          console.error(`Invalid event definition for ${eventDef.id}:`, error);
          return;
        }
        
        // Create event object
        const eventObj = {
          ...eventDef,
          meta: {
            ...(eventDef.meta || {}),
            bridge: {
              registered: true,
              timestamp: new Date().toISOString()
            }
          }
        };
        
        // Add to events collection
        bridgedEvents.push(eventObj);
      });
    }
    
    // Process declared handlers
    if (bridge.handlers && typeof bridge.handlers === 'object') {
      Object.entries(bridge.handlers).forEach(([handlerId, handlerDef]) => {
        // Validate handler definition
        try {
          HandlerSchema.parse({ id: handlerId, ...handlerDef });
        } catch (error) {
          console.error(`Invalid handler definition for ${handlerId}:`, error);
          return;
        }
        
        // Create handler object
        bridgedHandlers[handlerId] = {
          ...handlerDef,
          meta: {
            ...(bridgedHandlers[handlerId]?.meta || {}),
            ...(handlerDef.meta || {}),
            bridge: {
              connected: true,
              events: handlerDef.events || [],
              procedure: handlerDef.procedure,
              timestamp: new Date().toISOString()
            }
          }
        };
      });
    }
    
    // Process automatic connections based on naming conventions
    if (bridge.autoConnect !== false) {
      // For each action, create events and connect to handlers
      bridgedActions.forEach(action => {
        if (!action.id) return;
        
        // Create default event for action if none exists
        const defaultEventId = `${action.id}Event`;
        if (!bridgedEvents.some(e => e.id === defaultEventId)) {
          bridgedEvents.push({
            id: defaultEventId,
            type: action.type === 'submit' ? 'submit' : 'click',
            source: action.id,
            meta: {
              bridge: {
                autoCreated: true,
                timestamp: new Date().toISOString()
              }
            }
          });
        }
        
        // Connect to handler if one exists with matching name
        const matchingHandlerId = `on${action.id.charAt(0).toUpperCase() + action.id.slice(1)}`;
        if (bridgedHandlers[matchingHandlerId] && 
            !bridgedHandlers[matchingHandlerId].meta?.bridge?.events?.includes(defaultEventId)) {
          bridgedHandlers[matchingHandlerId] = {
            ...bridgedHandlers[matchingHandlerId],
            events: [
              ...(bridgedHandlers[matchingHandlerId].events || []),
              defaultEventId
            ],
            meta: {
              ...(bridgedHandlers[matchingHandlerId].meta || {}),
              bridge: {
                ...(bridgedHandlers[matchingHandlerId].meta?.bridge || {}),
                events: [
                  ...(bridgedHandlers[matchingHandlerId].meta?.bridge?.events || []),
                  defaultEventId
                ],
                autoConnected: true
              }
            }
          };
        }
      });
    }
    
    // Generate the event dispatcher
    const eventDispatcher = {
      dispatch: (eventId: string, payload?: Record<string, any>) => {
        // In real implementation, this would use tRPC
        return procedureRouter.executeAction({
          actionId: 'dispatchEvent',
          formId: shape.id || 'unknown',
          payload: { eventId, payload }
        });
      }
    };
    
    // Return enhanced shape with bridge components
    return {
      ...shape,
      actions: bridgedActions,
      handlers: bridgedHandlers,
      meta: {
        ...shape.meta,
        events: bridgedEvents,
        bridge: {
          enabled: true,
          timestamp: new Date().toISOString(),
          dispatcher: eventDispatcher,
          procedureRouter,
          actionCount: bridgedActions.length,
          eventCount: bridgedEvents.length,
          handlerCount: Object.keys(bridgedHandlers).length
        }
      }
    };
  },
  {
    pure: false, // Not pure due to timestamp and side effects
    fusible: false, // Should not be fused due to complexity
    cost: 4
  }
);