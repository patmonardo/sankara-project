/**
 * NeoCore - Central utility for the Neo platform
 * 
 * NeoCore serves as the foundational infrastructure for the entire
 * Neo ecosystem, providing core services, event handling, and persistence.
 */

import { EventEmitter } from 'events';
import { NeoComponentId, NeoEntity } from '../extension';
import { NeoEvent } from '../event';

export class NeoCore extends EventEmitter {
  private static instance: NeoCore;
  private entities: Map<string, NeoEntity> = new Map();
  private events: Map<string, NeoEvent> = new Map();
  
  // Configuration
  private config: {
    persistEvents: boolean;
    maxEventHistory: number;
  };
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor(config?: {
    persistEvents?: boolean;
    maxEventHistory?: number;
  }) {
    super();
    this.config = {
      persistEvents: config?.persistEvents ?? true,
      maxEventHistory: config?.maxEventHistory ?? 1000
    };
  }
  
  /**
   * Get the singleton instance of NeoCore
   */
  public static getInstance(config?: {
    persistEvents?: boolean;
    maxEventHistory?: number;
  }): NeoCore {
    if (!NeoCore.instance) {
      NeoCore.instance = new NeoCore(config);
    }
    return NeoCore.instance;
  }
  
  /**
   * Create a new entity in the system
   */
  public createEntity(data: Partial<NeoEntity>): string {
    const id = data.id || `entity:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    const newEntity: NeoEntity = {
      id,
      ...data,
      metadata: {
        created: Date.now(),
        updated: Date.now()
      }
    } as NeoEntity;
    
    this.entities.set(id, newEntity);
    
    this.emit('entity:created', { entityId: id, data });
    return id;
  }
  
  /**
   * Get entity by id
   */
  public getEntity(id: string): NeoEntity | undefined {
    return this.entities.get(id);
  }
  
  /**
   * Update an entity in the system
   */
  public updateEntity(id: string, data: Partial<NeoEntity>): boolean {
    if (!this.entities.has(id)) {
      return false;
    }
    
    const entity = this.entities.get(id);
    const updatedEntity: NeoEntity = {
      ...entity,
      ...data,
      metadata: {
        ...entity?.metadata,
        updated: Date.now()
      }
    } as NeoEntity;
    
    this.entities.set(id, updatedEntity);
    this.emit('entity:updated', { entityId: id, changes: data });
    return true;
  }
  
  /**
   * Remove an entity from the system
   */
  public removeEntity(id: string): boolean {
    if (!this.entities.has(id)) {
      return false;
    }
    
    const entity = this.entities.get(id);
    this.entities.delete(id);
    this.emit('entity:removed', { entityId: id, entity });
    return true;
  }
  
  /**
   * Process an event through the system
   * If persistEvents is true, the event will be stored
   */
  public processEvent(event: Partial<NeoEvent>): string {
    // Ensure event has required properties
    const timestamp = event.timestamp || Date.now();
    const eventId = `event:${timestamp}:${Math.random().toString(36).substring(2, 9)}`;
    
    const processedEvent: NeoEvent = {
      id: eventId,
      type: event.type || 'unknown',
      ...event,
      timestamp,
      metadata: {
        processed: Date.now()
      }
    };
    
    // Emit the event for real-time processing
    this.emit(`event:${event.type}`, processedEvent);
    if (event.subtype) {
      this.emit(`event:${event.type}:${event.subtype}`, processedEvent);
    }
    
    // Persist the event if configured to do so
    if (this.config.persistEvents) {
      this.persistEvent(eventId, processedEvent);
    }
    
    return eventId;
  }
  
  /**
   * Persist an event to storage
   */
  private persistEvent(id: string, event: NeoEvent): void {
    this.events.set(id, event);
    
    // Prune old events if we exceed the max history
    if (this.events.size > this.config.maxEventHistory) {
      // Get oldest events (sorted by timestamp)
      const oldestEvents = Array.from(this.events.entries())
        .sort((a, b) => (a[1].timestamp ?? 0) - (b[1].timestamp ?? 0))
        .slice(0, this.events.size - this.config.maxEventHistory);
      
      // Remove oldest events
      for (const [eventId] of oldestEvents) {
        this.events.delete(eventId);
      }
    }
  }
  
  /**
   * Get an event by ID
   */
  public getEvent(id: string): NeoEvent | undefined {
    return this.events.get(id);
  }
  
  /**
   * Query events by filter criteria
   */
  public queryEvents(filter: Partial<{
    type: string;
    subtype: string;
    source: NeoComponentId;
    target: NeoComponentId;
    fromTimestamp: number;
    toTimestamp: number;
    limit: number;
    offset: number;
  }> = {}): NeoEvent[] {
    let results = Array.from(this.events.values()).filter(event => {
      if (filter.type && event.type !== filter.type) return false;
      if (filter.subtype && event.subtype !== filter.subtype) return false;
      if (filter.source && event.source !== filter.source) return false;
      if (filter.target && event.target !== filter.target) return false;
      
      // Safely handle timestamp comparisons by ensuring event.timestamp is defined
      const eventTime = event.timestamp || 0; // Default to 0 if timestamp is undefined
      if (filter.fromTimestamp && eventTime < filter.fromTimestamp) return false;
      if (filter.toTimestamp && eventTime > filter.toTimestamp) return false;
      
      return true;
    });
    
    // Sort by timestamp descending (newest first)
    // Safely handle timestamp comparison with nullish coalescing
    results = results.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    
    // Apply pagination if specified
    if (filter.offset) {
      results = results.slice(filter.offset);
    }
    
    if (filter.limit) {
      results = results.slice(0, filter.limit);
    }
    
    return results;
  }
}

/**
 * Create and return a NeoCore instance
 */
export function createNeoCore(config?: {
  persistEvents?: boolean;
  maxEventHistory?: number;
}): NeoCore {
  return NeoCore.getInstance(config);
}