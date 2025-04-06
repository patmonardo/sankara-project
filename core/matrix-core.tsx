import { EventEmitter } from 'events';
import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createLocalMatrixServices } from './event-system';
import { ActionBridge, ActionDefinition } from '../../../action-bridge';

/**
 * MatrixCore - Central integration point for Matrix ecosystem
 * Integrates:
 * - Matrix Protocol (event system)
 * - Action Bridge (component actions)
 * - tRPC API (service management)
 */
export class MatrixCore {
  private static instance: MatrixCore;
  
  // Matrix protocol 
  public events;
  public messages;
  
  // tRPC API
  public api;
  public router;
  
  // Action bridge
  public actions: ActionBridge;
  
  // Service registry
  private registeredServices = new Map<string, RegisteredService>();
  
  // Internal emitter for local events
  private emitter = new EventEmitter();
  
  private constructor(userId?: string) {
    // Initialize Matrix services
    const matrixServices = createLocalMatrixServices(userId || 'matrix-core');
    this.events = matrixServices.events;
    this.messages = matrixServices.messages;
    
    // Initialize Action Bridge
    this.actions = new ActionBridge();
    
    // Initialize tRPC
    const t = initTRPC.create();
    this.router = t.router;
    
    // Create API router
    this.api = this.createApiRouter(t);
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(userId?: string): MatrixCore {
    if (!MatrixCore.instance) {
      MatrixCore.instance = new MatrixCore(userId);
    }
    return MatrixCore.instance;
  }
  
  /**
   * Create tRPC API router with Matrix integration
   */
  private createApiRouter(t: ReturnType<typeof initTRPC.create>) {
    const publicProcedure = t.procedure;
    
    // Create Matrix-aware procedure
    const matrixProcedure = publicProcedure.use(async (opts) => {
      // Create request room
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const roomId = `request-${requestId}`;
      
      await this.events.joinRoom(roomId);
      
      // Add Matrix context
      const context = {
        matrix: {
          events: this.events,
          messages: this.messages
        },
        requestId,
        roomId,
        actions: this.actions
      };
      
      // Emit request event
      await this.events.emit({
        type: 'api',
        subtype: 'request-start',
        roomId,
        timestamp: Date.now(),
        content: {
          requestId,
          input: opts.rawInput,
          path: opts.path
        }
      });
      
      try {
        const result = await opts.next({
          ctx: {
            ...opts.ctx,
            ...context
          }
        });
        
        // Emit success event
        await this.events.emit({
          type: 'api',
          subtype: 'request-complete',
          roomId,
          timestamp: Date.now(),
          content: {
            requestId,
            success: true
          }
        });
        
        // Clean up
        setTimeout(() => {
          this.events.leaveRoom(roomId).catch(console.error);
        }, 5000);
        
        return result;
      } catch (error) {
        // Emit error event
        await this.events.emit({
          type: 'api',
          subtype: 'request-error',
          roomId,
          timestamp: Date.now(),
          content: {
            requestId,
            error: error.message
          }
        });
        
        throw error;
      }
    });
    
    // Define API router
    return t.router({
      // Meta procedures
      meta: t.router({
        // List registered services
        listServices: publicProcedure.query(() => {
          return Array.from(this.registeredServices.values()).map(service => ({
            id: service.id,
            name: service.name,
            procedures: service.procedures
          }));
        }),
        
        // Check service health
        serviceHealth: publicProcedure
          .input(z.string())
          .query(async ({ input }) => {
            const service = this.registeredServices.get(input);
            if (!service) {
              throw new TRPCError({
                code: 'NOT_FOUND',
                message: `Service not found: ${input}`
              });
            }
            
            try {
              const healthEvent = await this.events.emit({
                type: 'service',
                subtype: 'health-check',
                roomId: service.roomId,
                timestamp: Date.now(),
                content: {
                  serviceId: service.id
                }
              });
              
              // Wait for response
              return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                  unsubscribe();
                  resolve({ status: 'unavailable', latency: null });
                }, 5000);
                
                const unsubscribe = this.events.on('service', (event) => {
                  if (
                    event.subtype === 'health-response' && 
                    event.content.originalEventId === healthEvent
                  ) {
                    clearTimeout(timeout);
                    unsubscribe();
                    resolve({
                      status: 'available',
                      latency: Date.now() - event.timestamp,
                      ...event.content.health
                    });
                  }
                });
              });
            } catch (error) {
              return { status: 'error', message: error.message };
            }
          }),
        
        // Get actions registry
        listActions: publicProcedure.query(() => {
          return this.actions.listActions().map(action => ({
            id: action.id,
            type: action.type,
            meta: action.meta
          }));
        })
      }),
      
      // Actions API
      actions: t.router({
        // Execute an action
        execute: matrixProcedure
          .input(z.object({
            actionId: z.string(),
            payload: z.any()
          }))
          .mutation(async ({ input, ctx }) => {
            try {
              // Convert to Matrix action context
              const matrixContext = {
                matrix: ctx.matrix,
                roomId: ctx.roomId,
                requestId: ctx.requestId
              };
              
              // Execute via action bridge
              return await this.actions.execute(
                input.actionId, 
                input.payload, 
                matrixContext
              );
            } catch (error) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Action execution failed: ${error.message}`
              });
            }
          })
      }),
      
      // Dynamic procedure resolution
      [t.procedure]: matrixProcedure
        .use(({ path, rawInput, ctx, next }) => {
          // Let meta and actions procedures pass through
          if (path.startsWith('meta.') || path.startsWith('actions.')) {
            return next();
          }
          
          // Dynamically resolve procedure
          return this.resolveProcedure(path, rawInput, ctx);
        })
        .query(async () => {
          // This won't be reached for dynamic procedures
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Procedure should have been dynamically resolved'
          });
        })
    });
  }
  
  /**
   * Resolve a procedure to the appropriate service
   */
  private async resolveProcedure(path: string, input: any, ctx: any) {
    // Find matching services
    const matchingServices = Array.from(this.registeredServices.values())
      .filter(service => service.procedures.includes(path));
    
    if (matchingServices.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `No service found for procedure: ${path}`
      });
    }
    
    // Use first service (could implement load balancing)
    const service = matchingServices[0];
    
    // Check if consensus is needed
    const requireConsensus = path.includes('delete') || 
                            path.includes('update') || 
                            path.includes('create');
                            
    let consensusId: string | undefined;
    
    if (requireConsensus) {
      const consensus = await this.events.initiateConsensus(
        service.roomId,
        {
          type: 'procedure-execution',
          path,
          input
        },
        {
          threshold: 0.6,
          timeout: 10000
        }
      );
      
      consensusId = consensus.id;
      await this.events.vote(consensusId, true);
    }
    
    // Call the procedure
    const callEvent = await this.events.emit({
      type: 'procedure',
      subtype: 'call',
      roomId: service.roomId,
      timestamp: Date.now(),
      content: {
        path,
        input,
        requestId: ctx.requestId,
        consensusId
      }
    });
    
    // Wait for response
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        reject(new TRPCError({
          code: 'TIMEOUT',
          message: `Procedure call timed out: ${path}`
        }));
      }, 30000);
      
      const unsubscribe = this.events.on('procedure', (event) => {
        if (
          event.subtype === 'response' && 
          event.content.originalEventId === callEvent
        ) {
          clearTimeout(timeout);
          unsubscribe();
          
          if (event.content.error) {
            reject(new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: event.content.error,
              cause: event.content.details
            }));
          } else {
            resolve(event.content.result);
          }
        }
      });
    });
  }
  
  /**
   * Set up event listeners for service registration
   */
  private setupEventListeners() {
    // Service registration
    this.events.on('service', (event) => {
      if (event.subtype === 'register') {
        const service = event.content as RegisteredService;
        this.registeredServices.set(service.id, service);
        
        // Emit local event
        this.emitter.emit('service:registered', service);
        console.log(`Service registered: ${service.name}`);
      } else if (event.subtype === 'unregister') {
        const serviceId = event.content.serviceId;
        const service = this.registeredServices.get(serviceId);
        this.registeredServices.delete(serviceId);
        
        if (service) {
          // Emit local event
          this.emitter.emit('service:unregistered', service);
          console.log(`Service unregistered: ${service.name}`);
        }
      }
    });
    
    // Action bridge integration
    this.events.on('action', (event) => {
      if (event.subtype === 'register') {
        const action = event.content as ActionDefinition;
        
        // Register action with bridge
        this.actions.registerAction(action);
        
        // Emit local event
        this.emitter.emit('action:registered', action);
        console.log(`Action registered: ${action.id}`);
      } else if (event.subtype === 'execute') {
        // Handle action execution through Matrix
        const { actionId, payload, context } = event.content;
        
        // Create Matrix-aware context
        const matrixContext = {
          ...context,
          matrix: {
            events: this.events,
            messages: this.messages
          },
          roomId: event.roomId
        };
        
        // Execute action
        this.actions.execute(actionId, payload, matrixContext)
          .then(result => {
            // Send result back
            this.events.emit({
              type: 'action',
              subtype: 'result',
              roomId: event.roomId,
              timestamp: Date.now(),
              content: {
                originalEventId: event.id,
                actionId,
                result
              }
            }).catch(console.error);
          })
          .catch(error => {
            // Send error
            this.events.emit({
              type: 'action',
              subtype: 'error',
              roomId: event.roomId,
              timestamp: Date.now(),
              content: {
                originalEventId: event.id,
                actionId,
                error: error.message
              }
            }).catch(console.error);
          });
      }
    });
  }
  
  /**
   * Register a service with MatrixCore
   */
  public registerService(service: RegisteredService): void {
    this.registeredServices.set(service.id, service);
    
    // Announce service registration
    this.events.emit({
      type: 'service',
      subtype: 'register',
      roomId: 'core',
      timestamp: Date.now(),
      content: service
    }).catch(console.error);
    
    // Join service room
    this.events.joinRoom(service.roomId).catch(console.error);
  }
  
  /**
   * Register an action with MatrixCore
   */
  public registerAction(action: ActionDefinition): void {
    // Register with action bridge
    this.actions.registerAction(action);
    
    // Announce action registration
    this.events.emit({
      type: 'action',
      subtype: 'register',
      roomId: 'core',
      timestamp: Date.now(),
      content: action
    }).catch(console.error);
  }
  
  /**
   * Subscribe to MatrixCore events
   */
  public on(event: string, listener: (...args: any[]) => void): () => void {
    this.emitter.on(event, listener);
    return () => this.emitter.off(event, listener);
  }
  
  /**
   * Initialize MatrixCore
   */
  public async initialize(): Promise<void> {
    // Join core room
    await this.events.joinRoom('core');
    
    // Announce core availability
    await this.events.emit({
      type: 'system',
      subtype: 'matrix-core-ready',
      roomId: 'core',
      timestamp: Date.now(),
      content: {
        version: '0.1.0',
        features: ['actions', 'api', 'matrix-protocol']
      }
    });
    
    // Emit local ready event
    this.emitter.emit('ready');
    
    console.log('MatrixCore initialized');
  }
}

/**
 * Registered service interface
 */
interface RegisteredService {
  id: string;
  name: string;
  procedures: string[];
  roomId: string;
}

/**
 * Create and initialize MatrixCore instance
 */
export async function createMatrixCore(userId?: string): Promise<MatrixCore> {
  const core = MatrixCore.getInstance(userId);
  await core.initialize();
  return core;
}

/**
 * Create a React hook context for MatrixCore
 */
import { createContext, useContext, useEffect, useState } from 'react';

// MatrixCore context
const MatrixCoreContext = createContext<MatrixCore | null>(null);

/**
 * Matrix Core Provider component
 */
export function MatrixCoreProvider({
  children,
  userId
}: {
  children: React.ReactNode;
  userId?: string;
}) {
  const [core, setCore] = useState<MatrixCore | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      const matrixCore = await createMatrixCore(userId);
      
      if (mounted) {
        setCore(matrixCore);
        setIsReady(true);
      }
    };
    
    initialize().catch(console.error);
    
    return () => {
      mounted = false;
    };
  }, [userId]);
  
  if (!isReady) {
    return <div>Initializing MatrixCore...</div>;
  }
  
  return (
    <MatrixCoreContext.Provider value={core}>
      {children}
    </MatrixCoreContext.Provider>
  );
}

/**
 * Hook to use MatrixCore
 */
export function useMatrixCore() {
  const context = useContext(MatrixCoreContext);
  
  if (!context) {
    throw new Error('useMatrixCore must be used within a MatrixCoreProvider');
  }
  
  return context;
}