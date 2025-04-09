import { describe, it, expect } from "vitest";
import { createNeoDialectic } from "./dialectic";
import { createNeoEventEmitter } from "./event";

describe("Neo Dialectic Protocol", () => {
  it("should create and retrieve entities", async () => {
    const events = createNeoEventEmitter();
    const dialectic = createNeoDialectic({ events });
    
    // Create an entity
    const entityId = await dialectic.createEntity({
      type: 'test',
      name: 'Test Entity',
      properties: {
        key: 'value'
      }
    });
    
    expect(entityId).toBeDefined();
    
    // Retrieve the entity
    const entity = await dialectic.getEntity(entityId);
    expect(entity).toBeDefined();
    expect(entity.type).toBe('test');
    expect(entity.properties.key).toBe('value');
  });

  it("should create and retrieve relations", async () => {
    const events = createNeoEventEmitter();
    const dialectic = createNeoDialectic({ events });
    
    // Create two entities
    const entity1Id = await dialectic.createEntity({ type: 'test1' });
    const entity2Id = await dialectic.createEntity({ type: 'test2' });
    
    // Create a relation
    const relationId = await dialectic.createRelation(
      entity1Id,
      entity2Id,
      'RELATED_TO',
      {
        since: '2023'
      }
    );
    
    expect(relationId).toBeDefined();
    
    // Retrieve the relation
    const relation = await dialectic.getRelation(relationId);
    expect(relation).toBeDefined();
    expect(relation.sourceId).toBe(entity1Id);
    expect(relation.targetId).toBe(entity2Id);
    expect(relation.type).toBe('RELATED_TO');
    expect(relation.properties.since).toBe('2023');
  });

  it("should emit events on entity/relation operations", async () => {
    const events = createNeoEventEmitter();
    const dialectic = createNeoDialectic({ events });
    
    const emittedEvents: any[] = [];
    events.on('*', (event) => {
      emittedEvents.push(event);
    });
    
    // Create entity
    const entityId = await dialectic.createEntity({ type: 'test' });
    
    // Update entity
    await dialectic.updateEntity(entityId, {
      properties: { updated: true }
    });
    
    // Delete entity
    await dialectic.deleteEntity(entityId);
    
    // Check events
    expect(emittedEvents.length).toBe(3);
    expect(emittedEvents[0].type).toBe('entity');
    expect(emittedEvents[0].subtype).toBe('created');
    expect(emittedEvents[1].type).toBe('entity');
    expect(emittedEvents[1].subtype).toBe('updated');
    expect(emittedEvents[2].type).toBe('entity');
    expect(emittedEvents[2].subtype).toBe('deleted');
  });

  it("should find entities by properties", async () => {
    const events = createNeoEventEmitter();
    const dialectic = createNeoDialectic({ events });
    
    // Create entities with different properties
    await dialectic.createEntity({
      type: 'person',
      properties: { name: 'John', role: 'developer' }
    });
    
    await dialectic.createEntity({
      type: 'person',
      properties: { name: 'Jane', role: 'designer' }
    });
    
    await dialectic.createEntity({
      type: 'person',
      properties: { name: 'Bob', role: 'developer' }
    });
    
    // Find entities by property
    const developers = await dialectic.findEntities({
      properties: { role: 'developer' }
    });
    
    expect(developers.length).toBe(2);
    expect(developers.some(e => e.properties.name === 'John')).toBe(true);
    expect(developers.some(e => e.properties.name === 'Bob')).toBe(true);
  });

  it("should find relations between entities", async () => {
    const events = createNeoEventEmitter();
    const dialectic = createNeoDialectic({ events });
    
    // Create entities
    const person1Id = await dialectic.createEntity({ type: 'person' });
    const person2Id = await dialectic.createEntity({ type: 'person' });
    const person3Id = await dialectic.createEntity({ type: 'person' });
    
    // Create relations
    await dialectic.createRelation(person1Id, person2Id, 'KNOWS');
    await dialectic.createRelation(person2Id, person3Id, 'KNOWS');
    await dialectic.createRelation(person1Id, person3Id, 'WORKS_WITH');
    
    // Find relations by type
    const knowsRelations = await dialectic.findRelations({ type: 'KNOWS' });
    expect(knowsRelations.length).toBe(2);
    
    // Find relations by source
    const person1Relations = await dialectic.findRelations({ sourceId: person1Id });
    expect(person1Relations.length).toBe(2);
    
    // Find specific relation
    const specificRelations = await dialectic.findRelations({
      sourceId: person1Id,
      targetId: person3Id
    });
    expect(specificRelations.length).toBe(1);
    expect(specificRelations[0].type).toBe('WORKS_WITH');
  });
});