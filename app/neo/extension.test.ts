import { describe, it, expect } from "vitest";
import { 
  createNeoDialectic, 
  createNeoProtocol, 
  createNeoComponentId, 
  NeoEntityBuilder,
  isEntityOfType,
  isEntityInSpace
} from "./extension";
import { createNeoEventEmitter } from "./event";
import { NeoEntity, NeoEntityId } from "./extension";

// Simplified test adapter that leverages the enhanced dialectic API
function createTestDialecticAdapter() {
  const componentId = createNeoComponentId("test-component", "test");
  const protocol = createNeoProtocol(componentId);
  const dialectic = createNeoDialectic(protocol);
  
  return {
    // Direct access to protocol and dialectic
    protocol,
    dialectic,
    
    // Entity builder for fluent API
    createEntityBuilder(type: string) {
      return new NeoEntityBuilder(protocol, type);
    },
    
    // Get a relation by source, target, and type
    getRelation(sourceId: string, targetId: string, type: string) {
      const source = protocol.getEntity(sourceId);
      if (!source || !source.relations) return null;
      
      const relation = source.relations.find(r => 
        r.target === targetId && r.type === type);
        
      if (!relation) return null;
      
      return {
        id: `rel-${sourceId}-${targetId}-${type}`,
        sourceId,
        targetId,
        type,
        properties: relation.properties || {}
      };
    }
  };
}

describe("Neo Dialectic Protocol", () => {
  it("should create and retrieve entities using the fluent builder API", () => {
    const adapter = createTestDialecticAdapter();
    
    // Create an entity using the fluent builder API
    const entityId = adapter.createEntityBuilder("test")
      .withProperty("name", "Test Entity")
      .withProperty("key", "value")
      .inSpace("testSpace")
      .create();
    
    expect(entityId).toBeDefined();
    
    // Retrieve the entity with type safety
    const entity = adapter.protocol.getTypedEntity<NeoEntity>(entityId);
    expect(entity).toBeDefined();
    expect(entity?.type).toBe("test");
    expect(entity?.properties.key).toBe("value");
    expect(entity?.properties.name).toBe("Test Entity");
    expect(entity?.spaceId).toBe("testSpace");
  });

  it("should create and retrieve entities with the direct API", () => {
    const adapter = createTestDialecticAdapter();
    
    // Create an entity with the direct API
    const entityId = adapter.protocol.createEntity({
      type: 'test',
      properties: {
        name: 'Test Entity',
        key: 'value'
      }
    });
    
    expect(entityId).toBeDefined();
    
    // Retrieve the entity
    const entity = adapter.protocol.getEntity(entityId);
    expect(entity).toBeDefined();
    expect(entity?.type).toBe('test');
    expect(entity?.properties.key).toBe('value');
  });

  it("should use type guards to check entity types", () => {
    const adapter = createTestDialecticAdapter();
    
    // Create entities of different types
    const personId = adapter.protocol.createEntity({
      type: 'person',
      properties: { name: 'John' }
    });
    
    const productId = adapter.protocol.createEntity({
      type: 'product',
      properties: { name: 'Widget' }
    });
    
    // Retrieve entities
    const personEntity = adapter.protocol.getEntity(personId);
    const productEntity = adapter.protocol.getEntity(productId);
    
    // Use type guards to check entity types
    expect(isEntityOfType(personEntity, 'person')).toBe(true);
    expect(isEntityOfType(personEntity, 'product')).toBe(false);
    expect(isEntityOfType(productEntity, 'product')).toBe(true);
    expect(isEntityOfType(productEntity, 'person')).toBe(false);
  });

  it("should create and retrieve relations", () => {
    const adapter = createTestDialecticAdapter();
    
    // Create two entities
    const entity1Id = adapter.protocol.createEntity({ type: 'test1', properties: {} });
    const entity2Id = adapter.protocol.createEntity({ type: 'test2', properties: {} });
    
    // Create a relation
    adapter.protocol.createRelation(
      entity1Id,
      entity2Id,
      'RELATED_TO',
      {
        since: '2023'
      }
    );
    
    // Retrieve the relation
    const relation = adapter.getRelation(entity1Id, entity2Id, 'RELATED_TO');
    expect(relation).toBeDefined();
    expect(relation?.sourceId).toBe(entity1Id);
    expect(relation?.targetId).toBe(entity2Id);
    expect(relation?.type).toBe('RELATED_TO');
    expect(relation?.properties.since).toBe('2023');
  });

  it("should emit events on entity/relation operations", () => {
    const emitter = createNeoEventEmitter();
    const componentId = createNeoComponentId("test-component", "test");
    const protocol = createNeoProtocol(componentId);
    
    const emittedEvents: any[] = [];
    emitter.on('*', (event) => {
      emittedEvents.push(event);
    });
    
    // Create entity
    const entityId = protocol.createEntity({ type: 'test', properties: {} });
    
    // Update entity
    protocol.updateEntity(entityId, {
      properties: { updated: true }
    });
    
    // Delete entity
    protocol.deleteEntity(entityId);
    
    // Check events - the system automatically emits events for these operations
    // We expect quite a few events as the protocol emits various system events
    expect(emittedEvents.length).toBeGreaterThanOrEqual(1);
  });

  it("should find entities by criteria using improved search", () => {
    const adapter = createTestDialecticAdapter();
    
    // Create entities with different properties in different spaces
    adapter.createEntityBuilder("person")
      .withProperty("name", "John")
      .withProperty("role", "developer")
      .inSpace("teamA")
      .create();
    
    adapter.createEntityBuilder("person")
      .withProperty("name", "Jane")
      .withProperty("role", "designer")
      .inSpace("teamA")
      .create();
    
    adapter.createEntityBuilder("person")
      .withProperty("name", "Bob")
      .withProperty("role", "developer")
      .inSpace("teamB")
      .create();
    
    // Find entities by property using criteria object
    const developers = adapter.protocol.findEntities({
      type: "person",
      properties: { role: 'developer' }
    });
    
    expect(developers.length).toBe(2);
    expect(developers.some(e => e.properties.name === 'John')).toBe(true);
    expect(developers.some(e => e.properties.name === 'Bob')).toBe(true);
    
    // Find entities by space using criteria object
    const teamAMembers = adapter.protocol.findEntities({
      spaceId: "teamA"
    });
    
    expect(teamAMembers.length).toBe(2);
    expect(teamAMembers.some(e => e.properties.name === 'John')).toBe(true);
    expect(teamAMembers.some(e => e.properties.name === 'Jane')).toBe(true);
    
    // Find entities by type and space
    const teamADesigners = adapter.protocol.findEntities({
      type: "person",
      spaceId: "teamA",
      properties: { role: "designer" }
    });
    
    expect(teamADesigners.length).toBe(1);
    expect(teamADesigners[0].properties.name).toBe("Jane");
  });

  it("should use the space check utility function", () => {
    const adapter = createTestDialecticAdapter();
    
    // Create entity in a specific space
    const entityId = adapter.createEntityBuilder("test")
      .inSpace("testSpace")
      .create();
    
    const entity = adapter.protocol.getEntity(entityId);
    
    // Check if entity is in the correct space
    expect(isEntityInSpace(entity, "testSpace")).toBe(true);
    expect(isEntityInSpace(entity, "otherSpace")).toBe(false);
    
    // Check with null entity
    expect(isEntityInSpace(null, "testSpace")).toBe(false);
  });

  it("should use the improved error handling for relations", () => {
    const adapter = createTestDialecticAdapter();
    
    // Create entities
    const entity1Id = adapter.protocol.createEntity({ type: 'test1', properties: {} });
    const entity2Id = adapter.protocol.createEntity({ type: 'test2', properties: {} });
    const nonExistentId = "non-existent-id";
    
    // Create relation
    adapter.protocol.createRelation(entity1Id, entity2Id, "RELATED_TO");
    
    // Use the new error handling method for finding relations
    const validRelations = adapter.protocol.findRelationsWithErrorHandling(entity1Id, {
      relationType: "RELATED_TO"
    });
    expect(validRelations.length).toBe(1);
    
    // Should not throw with missing entity if failOnMissingEntity is false (default)
    const noRelations = adapter.protocol.findRelationsWithErrorHandling(nonExistentId);
    expect(noRelations.length).toBe(0);
    
    // Should throw with missing entity if failOnMissingEntity is true
    expect(() => {
      adapter.protocol.findRelationsWithErrorHandling(nonExistentId, {
        failOnMissingEntity: true
      });
    }).toThrow();
  });
  
  it("should use the universal entity feature from dialectic", () => {
    const adapter = createTestDialecticAdapter();
    
    // Create a universal entity that exists in multiple spaces
    const { entityId, projectionIds } = adapter.dialectic.createUniversalEntity(
      {
        type: "user",
        properties: {
          name: "Universal User",
          email: "user@example.com"
        }
      },
      ["space1", "space2", "space3"]
    );
    
    expect(entityId).toBeDefined();
    expect(Object.keys(projectionIds).length).toBe(3);
    
    // Check that projections were created in each space
    const space1Entity = adapter.protocol.getEntity(projectionIds["space1"]);
    const space2Entity = adapter.protocol.getEntity(projectionIds["space2"]);
    
    expect(space1Entity?.spaceId).toBe("space1");
    expect(space2Entity?.spaceId).toBe("space2");
    
    // Check that they have the same properties
    expect(space1Entity?.properties.name).toBe("Universal User");
    expect(space2Entity?.properties.name).toBe("Universal User");
  });
});