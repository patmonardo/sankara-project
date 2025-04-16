import { describe, expect, it, beforeEach, vi } from 'vitest';
vi.mock('@/neo/neo', () => {
  // This mock PREVENTS Vitest from trying to load the potentially broken ../neo/neo.ts file.
  // It provides a fake, working version instead.
  return {
    NeoCore: {
      getInstance: vi.fn(() => ({
        emit: vi.fn(), // Provide methods used by FormEntity
      })),
    },
  };
});

import { FormEntity } from './entity';

describe('FormEntity', () => {
  // Clear entity registry before each test
  beforeEach(() => {
    // Access private static member for testing (reset the registry)
    (FormEntity as any).entities = new Map();
  });
  
  describe('Basic Entity Creation', () => {
    it('should create an entity with default values', () => {
      const entity = new FormEntity({});
      
      expect(entity.id).toBeDefined();
      expect(entity.type).toBe('neo:entity');
      expect(entity.properties).toEqual({});
      expect(entity.metadata).toBeDefined();
      expect(entity.metadata?.created).toBeDefined();
    });
    
    it('should create an entity with provided values', () => {
      const entity = new FormEntity({
        id: 'test-entity-1',
        type: 'test-type',
        properties: { name: 'Test Entity' },
        contextId: 'test-context'
      });
      
      expect(entity.id).toBe('test-entity-1');
      expect(entity.type).toBe('test-type');
      expect(entity.properties).toEqual({ name: 'Test Entity' });
      expect(entity.contextId).toBe('test-context');
    });
  });
  
  describe('Entity Registry Operations', () => {
    it('should register an entity', () => {
      const entity = new FormEntity({
        id: 'registry-test-1'
      });
      
      FormEntity.registerEntity(entity);
      const retrieved = FormEntity.getEntity('registry-test-1');
      
      expect(retrieved).toBe(entity);
    });
    
    it('should create and register an entity with createEntity', () => {
      const id = FormEntity.createEntity({
        type: 'test-type',
        properties: { name: 'Created Entity' }
      });
      
      const entity = FormEntity.getEntity(id);
      
      expect(entity).toBeDefined();
      expect(entity?.type).toBe('test-type');
      expect(entity?.properties.name).toBe('Created Entity');
    });
    
    it('should update an existing entity', () => {
      const id = FormEntity.createEntity({
        type: 'update-test',
        properties: { name: 'Before Update' }
      });
      
      const updated = FormEntity.updateEntity(id, {
        properties: { name: 'After Update', newProp: 123 }
      });
      
      const entity = FormEntity.getEntity(id);
      
      expect(updated).toBe(true);
      expect(entity?.properties.name).toBe('After Update');
      expect(entity?.properties.newProp).toBe(123);
    });
    
    it('should remove an entity', () => {
      const id = FormEntity.createEntity({
        type: 'remove-test'
      });
      
      const removed = FormEntity.removeEntity(id);
      const entity = FormEntity.getEntity(id);
      
      expect(removed).toBe(true);
      expect(entity).toBeUndefined();
    });
  });
  
  describe('Entity Query Operations', () => {
    beforeEach(() => {
      // Create test entities
      FormEntity.createEntity({
        id: 'query-test-1',
        type: 'person',
        properties: { name: 'Alice', age: 30 },
        contextId: 'context-a'
      });
      
      FormEntity.createEntity({
        id: 'query-test-2',
        type: 'person',
        properties: { name: 'Bob', age: 25 },
        contextId: 'context-a'
      });
      
      FormEntity.createEntity({
        id: 'query-test-3',
        type: 'company',
        properties: { name: 'Acme Corp' },
        contextId: 'context-b'
      });
    });
    
    it('should query entities by type', () => {
      const people = FormEntity.queryEntities({ type: 'person' });
      
      expect(people.length).toBe(2);
      expect(people[0].properties.name).toBeDefined();
    });
    
    it('should query entities by contextId', () => {
      const contextA = FormEntity.queryEntities({ contextId: 'context-a' });
      const contextB = FormEntity.queryEntities({ contextId: 'context-b' });
      
      expect(contextA.length).toBe(2);
      expect(contextB.length).toBe(1);
      expect(contextB[0].type).toBe('company');
    });
    
    it('should query entities by property value', () => {
      const alice = FormEntity.queryEntities({
        properties: { name: 'Alice' }
      });
      
      expect(alice.length).toBe(1);
      expect(alice[0].id).toBe('query-test-1');
    });
    
    it('should combine multiple filter criteria', () => {
      const result = FormEntity.queryEntities({
        type: 'person',
        contextId: 'context-a',
        properties: { age: 25 }
      });
      
      expect(result.length).toBe(1);
      expect(result[0].properties.name).toBe('Bob');
    });
  });
  
});