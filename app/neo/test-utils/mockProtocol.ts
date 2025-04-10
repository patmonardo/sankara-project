import { vi } from "vitest";
import { NeoProtocol, NeoEntityId, NeoSpaceId, NeoEntity } from "../extension";

/**
 * Creates a mock protocol implementation for testing
 * This can be used to test Property, Graph, Node, or any other component that depends on Protocol
 */
export function createMockProtocol() {
  // In-memory store for entities
  const entities = new Map<NeoEntityId, NeoEntity>();
  // Entity ID counter
  let entityIdCounter = 1;
  // Event listeners
  const eventListeners = new Map<string, Function[]>();
  
  // Create the mock protocol
  const mockProtocol: NeoProtocol = {
    // Entity creation
    createEntity: vi.fn((entityData) => {
      const id = `entity-${entityIdCounter++}`;
      
      const entity: NeoEntity = {
        id,
        type: entityData.type,
        spaceId: entityData.spaceId || "default",
        properties: entityData.properties || {},
        metadata: entityData.metadata || {},
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      entities.set(id, entity);
      return id;
    }),
    
    // Entity retrieval
    getEntity: vi.fn((id) => {
      return entities.get(id);
    }),
    
    // Entity update
    updateEntity: vi.fn((id, updates) => {
      const entity = entities.get(id);
      if (!entity) return false;
      
      // Update properties
      if (updates.properties) {
        entity.properties = { ...entity.properties, ...updates.properties };
      }
      
      // Update metadata
      if (updates.metadata) {
        entity.metadata = { ...entity.metadata, ...updates.metadata };
      }
      
      // Update spaceId if provided
      if (updates.spaceId) {
        entity.spaceId = updates.spaceId;
      }
      
      // Update timestamps
      entity.updatedAt = Date.now();
      
      // Store updated entity
      entities.set(id, entity);
      
      return true;
    }),
    
    // Entity deletion
    deleteEntity: vi.fn((id) => {
      return entities.delete(id);
    }),
    
    // Entity search
    findEntities: vi.fn((query) => {
      // Default to empty query if not provided
      query = query || {};
      
      // Convert entities map to array
      const entityList = Array.from(entities.values());
      
      // Filter by type if specified
      const typeFiltered = query.type 
        ? entityList.filter(e => e.type === query.type)
        : entityList;
      
      // Filter by spaceId if specified
      const spaceFiltered = query.spaceId
        ? typeFiltered.filter(e => e.spaceId === query.spaceId)
        : typeFiltered;
      
      // Filter by properties if specified
      const propFiltered = query.properties
        ? spaceFiltered.filter(entity => {
            // Check if all specified properties match
            return Object.entries(query.properties).every(([key, value]) => {
              return entity.properties[key] === value;
            });
          })
        : spaceFiltered;
      
      return propFiltered;
    }),
    
    // Event emission
    emit: vi.fn((event) => {
      // Generate event ID if not provided
      const eventId = event.id || `event-${Date.now()}`;
      
      // Notify listeners of this event type
      const listeners = eventListeners.get(event.type) || [];
      listeners.forEach(listener => listener(event));
      
      // Notify subtype listeners if applicable
      if (event.subtype) {
        const subtypeListeners = eventListeners.get(`${event.type}:${event.subtype}`) || [];
        subtypeListeners.forEach(listener => listener(event));
      }
      
      return eventId;
    }),
    
    // Event listeners
    onEvent: vi.fn((type, callback) => {
      if (!eventListeners.has(type)) {
        eventListeners.set(type, []);
      }
      
      eventListeners.get(type).push(callback);
      
      // Return unsubscribe function
      return () => {
        const listeners = eventListeners.get(type) || [];
        const index = listeners.indexOf(callback);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      };
    }),
    
    // Utility methods for testing
    _reset: () => {
      entities.clear();
      entityIdCounter = 1;
      eventListeners.clear();
      
      // Reset all mock function implementations
      mockProtocol.createEntity.mockClear();
      mockProtocol.getEntity.mockClear();
      mockProtocol.updateEntity.mockClear();
      mockProtocol.deleteEntity.mockClear();
      mockProtocol.findEntities.mockClear();
      mockProtocol.emit.mockClear();
      mockProtocol.onEvent.mockClear();
    },
    
    // Utility to inspect entities for testing
    _getAllEntities: () => {
      return Array.from(entities.values());
    }
  };
  
  return mockProtocol;
}