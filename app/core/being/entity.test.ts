import { describe, expect, it, beforeEach, vi } from 'vitest';
import { EntityService, entityService, Entity, EntityRef, EntityEvent, EntityStatusValues } from './entity';

describe('EntityService', () => {
  // Reset state before each test
  beforeEach(() => {
    // Get private entities map and clear it
    const entitiesMap = (entityService as any).entities as Map<string, Entity>;
    entitiesMap.clear();

    // Clear type index
    const typeIndex = (entityService as any).typeIndex as Map<string, Set<string>>;
    typeIndex.clear();

    // Clear property indices
    const propertyIndices = (entityService as any).propertyIndices as Map<string, Map<string, Set<string>>>;
    propertyIndices.clear();

    // Clear event listeners
    (entityService as any).eventListeners = [];
  });

  it('should create an entity and return a success result', () => {
    const result = entityService.createEntity({
      type: 'test',
      name: 'Test Entity',
      description: 'A test entity',
      properties: {
        testProp: 'test value'
      }
    });

    expect(result.status).toBe('success');
    expect(result.data).toBeDefined();

    const entity = result.data as Entity;
    expect(entity.id).toBeDefined();
    expect(entity.type).toBe('test');
    expect(entity.name).toBe('Test Entity');
    expect(entity.description).toBe('A test entity');
    expect(entity.properties?.testProp).toBe('test value');
    expect(entity.status).toBe('active');
  });

  it('should retrieve an entity by type and id', () => {
    const createResult = entityService.createEntity({
      type: 'test',
      name: 'Test Entity'
    });

    const entity = createResult.data as Entity;

    const retrieved = entityService.getEntity('test', entity.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(entity.id);
  });

  it('should retrieve entities by type', () => {
    entityService.createEntity({
      type: 'typeA',
      name: 'Entity A1'
    });

    entityService.createEntity({
      type: 'typeA',
      name: 'Entity A2'
    });

    entityService.createEntity({
      type: 'typeB',
      name: 'Entity B'
    });

    const typeAEntities = entityService.getEntitiesByType('typeA');
    expect(typeAEntities.length).toBe(2);
    expect(typeAEntities[0].type).toBe('typeA');
    expect(typeAEntities[1].type).toBe('typeA');

    const typeBEntities = entityService.getEntitiesByType('typeB');
    expect(typeBEntities.length).toBe(1);
    expect(typeBEntities[0].type).toBe('typeB');
  });

  it('should find entities by property', () => {
    entityService.createEntity({
      type: 'test',
      name: 'Entity 1',
      properties: {
        category: 'A',
        value: 10
      }
    });

    entityService.createEntity({
      type: 'test',
      name: 'Entity 2',
      properties: {
        category: 'B',
        value: 20
      }
    });

    entityService.createEntity({
      type: 'test',
      name: 'Entity 3',
      properties: {
        category: 'A',
        value: 30
      }
    });

    const categoryAEntities = entityService.findEntitiesByProperty('category', 'A');
    expect(categoryAEntities.length).toBe(2);
    expect(categoryAEntities[0].properties?.category).toBe('A');
    expect(categoryAEntities[1].properties?.category).toBe('A');

    const value20Entities = entityService.findEntitiesByProperty('value', 20);
    expect(value20Entities.length).toBe(1);
    expect(value20Entities[0].properties?.value).toBe(20);
  });

  it('should update an entity and return a success result', () => {
    const createResult = entityService.createEntity({
      type: 'test',
      name: 'Original Name',
      properties: {
        originalProp: 'original value'
      }
    });

    const entity = createResult.data as Entity;

    const updateResult = entityService.updateEntity(entity.type, entity.id, {
      name: 'Updated Name',
      properties: {
        newProp: 'new value'
      }
    });

    expect(updateResult.status).toBe('success');
    expect(updateResult.data).toBeDefined();

    const updated = updateResult.data as Entity;
    expect(updated.name).toBe('Updated Name');
    expect(updated.properties?.originalProp).toBe('original value');
    expect(updated.properties?.newProp).toBe('new value');

    // Verify the update is persisted
    const retrieved = entityService.getEntity(entity.type, entity.id);
    expect(retrieved?.name).toBe('Updated Name');
  });

  it('should delete an entity and return a success result', () => {
    const createResult = entityService.createEntity({
      type: 'test',
      name: 'To Be Deleted'
    });

    const entity = createResult.data as Entity;

    const deleteResult = entityService.deleteEntity(entity.type, entity.id);
    expect(deleteResult.status).toBe('success');
    expect(deleteResult.data).toBe(true);

    // Verify the entity is gone
    const retrieved = entityService.getEntity(entity.type, entity.id);
    expect(retrieved).toBeUndefined();
  });

  it('should change entity status', () => {
    const createResult = entityService.createEntity({
      type: 'test',
      name: 'Status Test'
    });

    const entity = createResult.data as Entity;

    const archiveResult = entityService.archiveEntity(entity.type, entity.id, 'test archiving');
    expect(archiveResult.status).toBe('success');
    expect(archiveResult.data).toBeDefined();

    const archived = archiveResult.data as Entity;
    expect(archived.status).toBe('archived');
    expect(archived.properties?.statusChangeReason).toBe('test archiving');

    // Verify the change is persisted
    const retrieved = entityService.getEntity(entity.type, entity.id);
    expect(retrieved?.status).toBe('archived');

    // Test reactivation
    const reactivateResult = entityService.reactivateEntity(entity.type, entity.id);
    expect(reactivateResult.status).toBe('success');
    expect(reactivateResult.data?.status).toBe('active');
  });

  it('should soft delete an entity', () => {
    const createResult = entityService.createEntity({
      type: 'test',
      name: 'To Be Soft Deleted'
    });

    const entity = createResult.data as Entity;

    const deleteResult = entityService.softDeleteEntity(entity.type, entity.id);
    expect(deleteResult.status).toBe('success');
    expect(deleteResult.data?.status).toBe('deleted');

    // Verify the entity is still there but marked as deleted
    const retrieved = entityService.getEntity(entity.type, entity.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.status).toBe('deleted');
  });

  it('should query entities with filters', () => {
    entityService.createEntity({
      type: 'typeA',
      name: 'Entity A1',
      properties: {
        category: 'X',
        value: 10
      }
    });

    entityService.createEntity({
      type: 'typeA',
      name: 'Entity A2',
      properties: {
        category: 'Y',
        value: 20
      }
    });

    entityService.createEntity({
      type: 'typeB',
      name: 'Entity B1',
      properties: {
        category: 'X',
        value: 30
      }
    });

    // Query by type
    const typeAEntities = entityService.queryEntities({
      types: ['typeA']
    });
    expect(typeAEntities.length).toBe(2);

    // Query by property
    const categoryXEntities = entityService.queryEntities({
      propertyFilters: {
        category: 'X'
      }
    });
    expect(categoryXEntities.length).toBe(2);

    // Combined query
    const typeAAndCategoryX = entityService.queryEntities({
      types: ['typeA'],
      propertyFilters: {
        category: 'X'
      }
    });
    expect(typeAAndCategoryX.length).toBe(1);
    expect(typeAAndCategoryX[0].type).toBe('typeA');
    expect(typeAAndCategoryX[0].properties?.category).toBe('X');
  });

  it('should emit events when entities are modified', () => {
    const eventListener = vi.fn();
    entityService.subscribeToEvents(eventListener);

    // Create an entity
    const createResult = entityService.createEntity({
      type: 'test',
      name: 'Event Test Entity'
    });

    const entity = createResult.data as Entity;

    // Update the entity
    entityService.updateEntity(entity.type, entity.id, {
      name: 'Updated Name'
    });

    // Change status
    entityService.archiveEntity(entity.type, entity.id, 'test reason');

    // Delete the entity
    entityService.deleteEntity(entity.type, entity.id);

    // Check that events were emitted
    expect(eventListener).toHaveBeenCalledTimes(4);

    // Check create event
    expect(eventListener.mock.calls[0][0].type).toBe('created');
    expect(eventListener.mock.calls[0][0].entity.name).toBe('Event Test Entity');

    // Check update event
    expect(eventListener.mock.calls[1][0].type).toBe('updated');
    expect(eventListener.mock.calls[1][0].entity.name).toBe('Updated Name');

    // Check status change event
    expect(eventListener.mock.calls[2][0].type).toBe('statusChanged');
    expect(eventListener.mock.calls[2][0].entity.status).toBe('archived');

    // Check delete event
    expect(eventListener.mock.calls[3][0].type).toBe('deleted');
  });

  it('should allow unsubscribing from events', () => {
    const eventListener = vi.fn();
    const unsubscribe = entityService.subscribeToEvents(eventListener);

    // Create an entity
    entityService.createEntity({
      type: 'test',
      name: 'Event Test Entity'
    });

    expect(eventListener).toHaveBeenCalledTimes(1);

    // Unsubscribe
    unsubscribe();

    // Create another entity
    entityService.createEntity({
      type: 'test',
      name: 'Another Entity'
    });

    // Should still be 1 call
    expect(eventListener).toHaveBeenCalledTimes(1);
  });

  it('should protect system entities from deletion', () => {
    // First, create a system entity with a type that starts with 'system.'
    const systemEntity = entityService.createEntity({
      type: 'system.test',
      name: 'System Entity'
    });

    const entity = systemEntity.data as Entity;

    // Now try to delete it
    const deleteResult = entityService.deleteEntity(entity.type, entity.id);

    // Should fail with an error
    expect(deleteResult.status).toBe('error');
    expect(deleteResult.data).toBe(false);
    expect(deleteResult.message).toContain('Cannot delete system entity');

    // Entity should still exist
    const retrieved = entityService.getEntity(entity.type, entity.id);
    expect(retrieved).toBeDefined();
  });

  it('should protect entities marked as protected from updates and deletion', () => {
    // Create an entity and mark it as protected
    const createResult = entityService.createEntity({
      type: 'test',
      name: 'Protected Entity',
      properties: {
        protected: true
      }
    });

    const entity = createResult.data as Entity;

    // Try to update it
    const updateResult = entityService.updateEntity(entity.type, entity.id, {
      name: 'Attempted Update'
    });

    // Should fail with an error
    expect(updateResult.status).toBe('error');
    expect(updateResult.message).toContain('Cannot update protected entity');

    // Try to delete it
    const deleteResult = entityService.deleteEntity(entity.type, entity.id);

    // Should fail with an error
    expect(deleteResult.status).toBe('error');
    expect(deleteResult.message).toContain('Cannot delete protected entity');
  });

  it('should allow updates to protected entities when explicitly allowed', () => {
    // Create an entity and mark it as protected
    const createResult = entityService.createEntity({
      type: 'test',
      name: 'Protected Entity',
      properties: {
        protected: true
      }
    });

    const entity = createResult.data as Entity;

    // Try to update it with the allowProtectedUpdate flag
    const updateResult = entityService.updateEntity(entity.type, entity.id, {
      name: 'Allowed Update',
      properties: {
        allowProtectedUpdate: true
      }
    });

    // Should succeed
    expect(updateResult.status).toBe('success');
    expect(updateResult.data?.name).toBe('Allowed Update');
  });
});
