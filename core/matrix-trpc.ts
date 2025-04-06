// matrix-trpc-server.ts - Matrix-based tRPC server implementation

import { initTRPC, TRPCError } from '@trpc/server';
import { createLocalMatrixServices } from './matrix/core/event-system';
import { z } from 'zod';

// Initialize Matrix services
const matrixSystem = createLocalMatrixServices('api-server');

// Create tRPC instance
const t = initTRPC.create();
const router = t.router;
const publicProcedure = t.procedure;

// Create a procedure with Matrix context
const matrixProcedure = publicProcedure.use(async (opts) => {
  // Create a Matrix room for this request
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const roomId = `request-${requestId}`;
  
  // Join request room
  await matrixSystem.events.joinRoom(roomId);
  
  // Add Matrix context to the request
  const context = {
    matrix: matrixSystem,
    requestId,
    roomId
  };
  
  // Emit request started event
  await matrixSystem.events.emit({
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
  
  // Process the request
  try {
    const result = await opts.next({
      ctx: {
        ...opts.ctx,
        ...context
      }
    });
    
    // Emit success event
    await matrixSystem.events.emit({
      type: 'api',
      subtype: 'request-complete',
      roomId,
      timestamp: Date.now(),
      content: {
        requestId,
        success: true
      }
    });
    
    // Clean up room
    setTimeout(() => {
      matrixSystem.events.leaveRoom(roomId).catch(console.error);
    }, 5000);
    
    return result;
  } catch (error) {
    // Emit error event
    await matrixSystem.events.emit({
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

// Service registration and discovery
interface RegisteredService {
  id: string;
  name: string;
  procedures: string[];
  roomId: string;
}

const registeredServices = new Map<string, RegisteredService>();

// Matrix event listener for service registration
matrixSystem.events.on('service', (event) => {
  if (event.subtype === 'register') {
    const service = event.content as RegisteredService;
    registeredServices.set(service.id, service);
    
    console.log(`Service registered: ${service.name}`);
  } else if (event.subtype === 'unregister') {
    const serviceId = event.content.serviceId;
    registeredServices.delete(serviceId);
    
    console.log(`Service unregistered: ${serviceId}`);
  }
});

// Dynamic procedure resolution
async function resolveProcedure(path: string, input: any, ctx: any) {
  // Find service that can handle this procedure
  const servicePath = path.split('.')[0];
  
  const matchingServices = Array.from(registeredServices.values()).filter(
    service => service.procedures.includes(path)
  );
  
  if (matchingServices.length === 0) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `No service found for procedure: ${path}`
    });
  }
  
  // Use first matching service (could implement load balancing here)
  const service = matchingServices[0];
  
  // Create a Matrix consensus for critical operations
  const requireConsensus = path.includes('delete') || 
                          path.includes('update') || 
                          path.includes('create');
                          
  let consensusId: string | undefined;
  
  if (requireConsensus) {
    const consensus = await matrixSystem.events.initiateConsensus(
      service.roomId,
      {
        type: 'procedure-execution',
        path,
        input
      },
      {
        threshold: 0.6,  // 60% agreement required
        timeout: 10000   // 10 seconds timeout
      }
    );
    
    consensusId = consensus.id;
    
    // Vote yes from the API server
    await matrixSystem.events.vote(consensusId, true);
  }
  
  // Emit procedure call event
  const callEvent = await matrixSystem.events.emit({
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
    }, 30000);  // 30 second timeout
    
    const unsubscribe = matrixSystem.events.on('procedure', (event) => {
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

// Define API router with dynamic resolution
export const appRouter = router({
  // Meta procedures for introspection
  meta: router({
    listServices: publicProcedure.query(() => {
      return Array.from(registeredServices.values()).map(service => ({
        id: service.id,
        name: service.name,
        procedures: service.procedures
      }));
    }),
    
    serviceHealth: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        const service = registeredServices.get(input);
        if (!service) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Service not found: ${input}`
          });
        }
        
        try {
          const healthEvent = await matrixSystem.events.emit({
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
            
            const unsubscribe = matrixSystem.events.on('service', (event) => {
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
      })
  }),
  
  // Dynamic procedure resolver
  // This catches any procedure call not explicitly defined
  [t.procedure]: matrixProcedure
    .use(({ path, rawInput, ctx, next }) => {
      if (path.startsWith('meta.')) {
        // Let meta procedures pass through
        return next();
      }
      
      // Dynamically resolve procedure
      return resolveProcedure(path, rawInput, ctx);
    })
    .query(async () => {
      // This won't be reached for dynamic procedures
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Procedure should have been dynamically resolved'
      });
    })
});

// Export type definition of API
export type AppRouter = typeof appRouter;