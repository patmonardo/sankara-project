import { MatrixEventService, MatrixEvent } from './core/event-system';
import { MatrixMessageService, MatrixMessage } from './core/message-service';

/**
 * Bridge Matrix events to actions and vice versa
 * 
 * This module connects the Matrix event/message system to our action/event/handler system
 */
export class MatrixActionBridge {
  constructor(
    private eventService: MatrixEventService,
    private messageService: MatrixMessageService
  ) {}
  
  /**
   * Connect an action to the Matrix system
   */
  connectAction(action: any, options: {
    distributed?: boolean;
    roomId?: string;
    emitEvent?: boolean;
  } = {}): void {
    const actionId = action.id;
    if (!actionId) return;
    
    // When an event associated with this action occurs in Matrix
    const eventNames = [
      `${options.roomId || '*'}:action`,
      `${options.roomId || '*'}:message`
    ];
    
    eventNames.forEach(eventName => {
      this.eventService.on(eventName, (event: MatrixEvent) => {
        // Check if this event relates to our action
        if (
          event.content.actionId === actionId || 
          (event.subtype === 'action' && event.content.id === actionId)
        ) {
          // Trigger the action locally via a custom event
          // In a real implementation, this would dispatch through the handler system
          document.dispatchEvent(
            new CustomEvent('matrix-action', {
              detail: {
                actionId,
                event,
                source: 'matrix'
              }
            })
          );
        }
      });
    });
    
    // Register a handler for local action execution to send to Matrix
    if (options.emitEvent !== false) {
      document.addEventListener('action-executed', (e: any) => {
        const detail = e.detail;
        if (detail.actionId !== actionId) return;
        
        // Emit as Matrix event if distributed
        if (options.distributed) {
          this.eventService.emit({
            type: 'action',
            subtype: 'execute',
            roomId: options.roomId,
            content: {
              actionId,
              payload: detail.payload,
              result: detail.result
            },
            distributed: true,
            timestamp: Date.now()
          });
        }
      });
    }
  }
  
  /**
   * Connect an event to the Matrix system
   */
  connectEvent(event: any, options: {
    distributed?: boolean;
    roomId?: string;
    bidirectional?: boolean;
  } = {}): void {
    const eventId = event.id;
    if (!eventId) return;
    
    // Local to Matrix
    if (options.bidirectional !== false) {
      document.addEventListener(`event-${eventId}`, (e: any) => {
        const detail = e.detail;
        
        // Emit as Matrix event if distributed
        if (options.distributed !== false) {
          this.eventService.emit({
            type: 'event',
            subtype: event.type || 'custom',
            roomId: options.roomId,
            content: {
              eventId,
              payload: detail.payload
            },
            distributed: true,
            timestamp: Date.now()
          });
        }
      });
    }
    
    // Matrix to local
    const matrixEventName = `${options.roomId || '*'}:event`;
    this.eventService.on(matrixEventName, (matrixEvent: MatrixEvent) => {
      if (
        matrixEvent.content.eventId === eventId ||
        (matrixEvent.subtype === eventId)
      ) {
        // Dispatch local event
        document.dispatchEvent(
          new CustomEvent(`matrix-event-${eventId}`, {
            detail: {
              eventId,
              payload: matrixEvent.content.payload,
              source: 'matrix',
              matrixEvent
            }
          })
        );
      }
    });
  }
  
  /**
   * Connect a handler to the Matrix system
   */
  connectHandler(
    handlerId: string,
    handler: Function,
    options: {
      executionMode?: 'local' | 'remote' | 'distributed' | 'consensus';
      roomId?: string;
      permission?: string;
      events?: string[];
    } = {}
  ): void {
    const executionMode = options.executionMode || 'local';
    
    // For remote/distributed execution modes, we need to listen to Matrix events
    if (executionMode !== 'local') {
      // Listen for handler execution requests
      const eventName = `${options.roomId || '*'}:handler`;
      this.eventService.on(eventName, async (event: MatrixEvent) => {
        if (event.content.handlerId !== handlerId) return;
        
        // Check permissions (in a real implementation, this would be more sophisticated)
        if (options.permission && event.senderId !== this.eventService.userId) {
          // Permission check would go here
          return;
        }
        
        try {
          // Execute the handler
          const result = await handler(event.content.payload);
          
          // Send result back to Matrix
          await this.eventService.emit({
            type: 'handler',
            subtype: 'result',
            roomId: event.roomId,
            content: {
              handlerId,
              requestId: event.content.requestId,
              result,
              success: true
            },
            timestamp: Date.now()
          });
        } catch (error) {
          // Send error back to Matrix
          await this.eventService.emit({
            type: 'handler',
            subtype: 'result',
            roomId: event.roomId,
            content: {
              handlerId,
              requestId: event.content.requestId,
              error: error instanceof Error ? error.message : String(error),
              success: false
            },
            timestamp: Date.now()
          });
        }
      });
    }
    
    // Connect events to this handler
    if (options.events && options.events.length > 0) {
      options.events.forEach(eventId => {
        document.addEventListener(`matrix-event-${eventId}`, async (e: any) => {
          const detail = e.detail;
          
          try {
            // Execute handler with event payload
            await handler(detail.payload);
          } catch (error) {
            console.error(`Error executing handler ${handlerId} for event ${eventId}:`, error);
          }
        });
      });
    }
  }
  
  /**
   * Execute a handler with distributed consensus
   */
  async executeWithConsensus(
    handlerId: string,
    payload: any,
    options: {
      roomId: string;
      threshold?: number;
      timeout?: number;
    }
  ): Promise<any> {
    // Start consensus process
    const { id: consensusId } = await this.eventService.initiateConsensus(
      options.roomId,
      {
        handlerId,
        payload,
        action: 'execute'
      },
      {
        threshold: options.threshold,
        timeout: options.timeout
      }
    );
    
    // Vote yes from this client
    await this.eventService.vote(consensusId, true);
    
    // Wait for consensus
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        try {
          const state = await this.eventService.getConsensusState(consensusId);
          
          if (state.status !== 'pending') {
            clearInterval(checkInterval);
            
            if (state.status === 'passed') {
              // Execute locally since we agreed
              const handler = window[`handler_${handlerId}`]; // This is a simplified example
              if (typeof handler === 'function') {
                try {
                  const result = await handler(payload);
                  resolve(result);
                } catch (error) {
                  reject(error);
                }
              } else {
                reject(new Error(`Handler ${handlerId} not found`));
              }
            } else {
              reject(new Error(`Consensus failed: ${state.status}`));
            }
          }
        } catch (error) {
          clearInterval(checkInterval);
          reject(error);
        }
      }, 500);
    });
  }
}

/**
 * Create a helper function to initialize the Matrix bridge in a component
 */
export function useMatrixActionBridge(
  eventService: MatrixEventService,
  messageService: MatrixMessageService
): MatrixActionBridge {
  return new MatrixActionBridge(eventService, messageService);
}