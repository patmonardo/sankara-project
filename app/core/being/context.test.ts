import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContextService, contextService } from './context';
import { relationService } from './relation';
import { EntityRef } from './schema/entity';

// Mock the dependency services
vi.mock('./relation', () => ({
  relationService: {
    findRelatedEntities: vi.fn(),
    findRelationsByEntity: vi.fn().mockReturnValue([]),
    findRelationsBySource: vi.fn().mockReturnValue([]),
    findRelationsByTarget: vi.fn().mockReturnValue([]),
    getRelation: vi.fn()
  }
}));

vi.mock('../../data/service/entity', () => ({
  entityService: {
    getEntityByRef: vi.fn((ref) => ({
      id: ref.id,
      type: ref.entity,
      name: `${ref.entity} ${ref.id}`,
      properties: {},
      status: 'active',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
  }
}));

describe('ContextService', () => {
  let service: ContextService;

  // Reset the service before each test
  beforeEach(() => {
    service = ContextService.getInstance();

    // Clear all contexts except the system context
    const contexts = service.getAllContexts();
    for (const context of contexts) {
      if (context.type !== 'system') {
        service.deleteContext(context.id);
      }
    }

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Context Creation', () => {
    it('should create a basic context', () => {
      const context = service.createContext({
        name: 'Test Context',
        type: 'generic',
        description: 'A test context'
      });

      expect(context).toBeDefined();
      expect(context.name).toBe('Test Context');
      expect(context.type).toBe('generic');
      expect(context.description).toBe('A test context');
      expect(context.id).toBeDefined();
      expect(context.createdAt).toBeInstanceOf(Date);
      expect(context.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a temporary context', () => {
      const context = service.createTemporaryContext({
        name: 'Temporary Context',
        type: 'temp',
        ttl: 5000
      });

      expect(context).toBeDefined();
      expect(context.properties.temporary).toBe(true);
      expect(context.properties.validUntil).toBeInstanceOf(Date);
    });

    it('should create an evaluation context', () => {
      const context = service.createEvaluationContext({
        name: 'Evaluation Context',
        rules: { threshold: 0.5 }
      });

      expect(context).toBeDefined();
      expect(context.type).toBe('evaluation');
      expect(context.properties.rules).toEqual({ threshold: 0.5 });
      expect(context.properties.evaluationCreated).toBeInstanceOf(Date);
    });

    it('should create a visualization context', () => {
      const context = service.createVisualizationContext({
        name: 'Visualization Context',
        viewOptions: { layout: 'force-directed' }
      });

      expect(context).toBeDefined();
      expect(context.type).toBe('visualization');
      expect(context.properties.viewOptions).toEqual({ layout: 'force-directed' });
      expect(context.properties.visualizationCreated).toBeInstanceOf(Date);
    });

    it('should create a domain context', () => {
      const context = service.createDomainContext({
        name: 'Domain Context',
        domain: 'finance'
      });

      expect(context).toBeDefined();
      expect(context.type).toBe('domain');
      expect(context.scope).toBe('domain');
      expect(context.domain).toBe('finance');
      expect(context.properties.domainCreated).toBeInstanceOf(Date);
    });

    it('should create a system context during initialization', () => {
      const systemContexts = service.getContextsByType('system');

      expect(systemContexts).toHaveLength(1);
      expect(systemContexts[0].name).toBe('System');
      expect(systemContexts[0].properties.system).toBe(true);
      expect(systemContexts[0].properties.protected).toBe(true);
    });
  });

  describe('Entity Neighborhood Contexts', () => {
    beforeEach(() => {
      // Mock relationService methods for neighborhood creation
      vi.mocked(relationService.findRelatedEntities).mockReturnValue([
        { entity: 'user.Person', id: '456' },
        { entity: 'document.Article', id: '789' }
      ]);
    });

    it('should create an entity neighborhood context', async () => {
      const entityRef = { entity: 'user.Person', id: '123' };

      const context = await service.createEntityNeighborhoodContext(entityRef, {
        depth: 2,
        direction: 'both'
      });

      expect(context).toBeDefined();
      expect(context.name).toContain('Neighborhood');
      expect(context.properties.centerEntity).toEqual(entityRef);
      expect(context.properties.depth).toBe(2);

      // Verify that findRelatedEntities was called correctly
      expect(relationService.findRelatedEntities).toHaveBeenCalledWith(
        entityRef,
        expect.objectContaining({
          depth: 2,
          direction: 'both'
        })
      );

      // Verify entities were added
      expect(context.entities).toBeDefined();
      expect(context.entities!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Context Retrieval', () => {
    let testContext: any;

    beforeEach(() => {
      testContext = service.createContext({
        name: 'Retrieval Test',
        type: 'test-type'
      });
    });

    it('should retrieve a context by ID', () => {
      const retrieved = service.getContext(testContext.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(testContext.id);
      expect(retrieved!.name).toBe('Retrieval Test');
    });

    it('should retrieve contexts by type', () => {
      // Create another context of same type
      service.createContext({
        name: 'Another Test',
        type: 'test-type'
      });

      const contexts = service.getContextsByType('test-type');

      expect(contexts).toHaveLength(2);
      expect(contexts[0].type).toBe('test-type');
      expect(contexts[1].type).toBe('test-type');
    });

    it('should return empty array for nonexistent type', () => {
      const contexts = service.getContextsByType('nonexistent');
      expect(contexts).toHaveLength(0);
    });
  });

  describe('Entity and Relation Context Associations', () => {
    let testContext: any;

    beforeEach(() => {
      testContext = service.createContext({
        name: 'Association Test',
        type: 'test-type'
      });
    });

    it('should add entities to a context', () => {
      const entityRefs = [
        { entity: 'user.Person', id: '123' },
        { entity: 'document.Article', id: '456' }
      ];

      const updated = service.addEntitiesToContext(testContext.id, entityRefs);

      expect(updated).toBeDefined();
      expect(updated!.entities).toHaveLength(2);
      expect(updated!.entities![0]).toEqual(entityRefs[0]);
      expect(updated!.entities![1]).toEqual(entityRefs[1]);
    });

    it('should add relations to a context', () => {
      const relationIds = ['rel-1', 'rel-2'];

      const updated = service.addRelationsToContext(testContext.id, relationIds);

      expect(updated).toBeDefined();
      expect(updated!.relations).toHaveLength(2);
      expect(updated!.relations![0]).toBe(relationIds[0]);
      expect(updated!.relations![1]).toBe(relationIds[1]);
    });

    it('should retrieve contexts containing an entity', () => {
      const entityRef = { entity: 'user.Person', id: '123' };

      // Add entity to context
      service.addEntitiesToContext(testContext.id, [entityRef]);

      // Retrieve contexts containing entity
      const contexts = service.getContextsContainingEntity(entityRef);

      expect(contexts).toHaveLength(1);
      expect(contexts[0].id).toBe(testContext.id);
    });

    it('should retrieve contexts containing a relation', () => {
      const relationId = 'rel-1';

      // Add relation to context
      service.addRelationsToContext(testContext.id, [relationId]);

      // Retrieve contexts containing relation
      const contexts = service.getContextsContainingRelation(relationId);

      expect(contexts).toHaveLength(1);
      expect(contexts[0].id).toBe(testContext.id);
    });

    it('should remove entities from a context', () => {
      const entityRefs = [
        { entity: 'user.Person', id: '123' },
        { entity: 'document.Article', id: '456' }
      ];

      // Add entities to context
      service.addEntitiesToContext(testContext.id, entityRefs);

      // Remove one entity
      const updated = service.removeEntitiesFromContext(testContext.id, [entityRefs[0]]);

      expect(updated).toBeDefined();
      expect(updated!.entities).toHaveLength(1);
      expect(updated!.entities![0]).toEqual(entityRefs[1]);

      // Verify context-entity index is updated
      const contexts = service.getContextsContainingEntity(entityRefs[0]);
      expect(contexts).toHaveLength(0);
    });

    it('should remove relations from a context', () => {
      const relationIds = ['rel-1', 'rel-2'];

      // Add relations to context
      service.addRelationsToContext(testContext.id, relationIds);

      // Remove one relation
      const updated = service.removeRelationsFromContext(testContext.id, [relationIds[0]]);

      expect(updated).toBeDefined();
      expect(updated!.relations).toHaveLength(1);
      expect(updated!.relations![0]).toBe(relationIds[1]);

      // Verify context-relation index is updated
      const contexts = service.getContextsContainingRelation(relationIds[0]);
      expect(contexts).toHaveLength(0);
    });
  });

  describe('Context Updates and Deletion', () => {
    let testContext: any;

    beforeEach(() => {
      testContext = service.createContext({
        name: 'Update Test',
        type: 'test-type',
        properties: { key: 'value' }
      });
    });

    it('should update a context', () => {
      const updated = service.updateContext(testContext.id, {
        name: 'Updated Name',
        description: 'New description',
        properties: { newKey: 'newValue' }
      });

      expect(updated).toBeDefined();
      expect(updated!.name).toBe('Updated Name');
      expect(updated!.description).toBe('New description');
      expect(updated!.properties.key).toBe('value'); // Existing properties preserved
      expect(updated!.properties.newKey).toBe('newValue'); // New property added
    });

    it('should not update protected contexts', () => {
      const systemContext = service.getContextsByType('system')[0];

      expect(() => {
        service.updateContext(systemContext.id, {
          name: 'Try to update protected'
        });
      }).toThrow('Cannot update protected context');
    });

    it('should delete a context', () => {
      const result = service.deleteContext(testContext.id);

      expect(result).toBe(true);
      expect(service.getContext(testContext.id)).toBeUndefined();
    });

    it('should not delete protected contexts', () => {
      const systemContext = service.getContextsByType('system')[0];

      expect(() => {
        service.deleteContext(systemContext.id);
      }).toThrow('Cannot delete protected context');
    });

    it('should return false when deleting nonexistent context', () => {
      const result = service.deleteContext('nonexistent-id');
      expect(result).toBe(false);
    });
  });

  describe('Context Operations', () => {
    let testContext: any;

    beforeEach(() => {
      // Create test contexts of different types
      testContext = {
        evaluation: service.createEvaluationContext({
          name: 'Evaluation Context',
          rules: { threshold: 0.5 }
        }),
        visualization: service.createVisualizationContext({
          name: 'Visualization Context',
          viewOptions: { layout: 'force' }
        }),
        domain: service.createDomainContext({
          name: 'Domain Context',
          domain: 'finance'
        }),
        generic: service.createContext({
          name: 'Generic Context',
          type: 'generic'
        })
      };

      // Mock console.log
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should execute operations in evaluation context', async () => {
      const result = await service.executeOperation(
        testContext.evaluation.id,
        'validate',
        { data: [1, 2, 3] }
      );

      expect(result).toBeDefined();
      expect(result.operation).toBe('validate');
      expect(result.valid).toBe(true);

      // Check that operation was recorded
      const updated = service.getContext(testContext.evaluation.id);
      expect(updated!.properties.lastOperation).toBeDefined();
      expect(updated!.properties.lastOperation.operation).toBe('validate');
      expect(updated!.properties.lastOperation.success).toBe(true);
      expect(updated!.properties.operationHistory).toHaveLength(1);
    });

    it('should execute operations in visualization context', async () => {
      const result = await service.executeOperation(
        testContext.visualization.id,
        'render',
        { theme: 'dark' }
      );

      expect(result).toBeDefined();
      expect(result.operation).toBe('render');
      expect(result.renderOptions).toBeDefined();
    });

    it('should execute operations in domain context', async () => {
      const result = await service.executeOperation(
        testContext.domain.id,
        'calculate',
        { amount: 100 }
      );

      expect(result).toBeDefined();
      expect(result.operation).toBe('calculate');
      expect(result.result).toContain('domain finance');
    });

    it('should execute operations in generic context', async () => {
      const params = { key: 'value' };
      const result = await service.executeOperation(
        testContext.generic.id,
        'generic-op',
        params
      );

      expect(result).toBeDefined();
      expect(result.operation).toBe('generic-op');
      expect(result.result).toBe(params);
    });

    it('should handle operation errors and record them', async () => {
      // Override executor to throw an error
      vi.spyOn(service as any, 'getExecutorForContextType').mockReturnValue({
        execute: async () => {
          throw new Error('Operation failed');
        }
      });

      await expect(service.executeOperation(
        testContext.generic.id,
        'error-op',
        {}
      )).rejects.toThrow('Operation failed');

      // Check that error was recorded
      const updated = service.getContext(testContext.generic.id);
      expect(updated!.properties.lastOperation).toBeDefined();
      expect(updated!.properties.lastOperation.success).toBe(false);
      expect(updated!.properties.lastOperation.error).toBe('Operation failed');
    });
  });

  describe('Graph Export', () => {
    let testContext: any;

    beforeEach(() => {
      testContext = service.createContext({
        name: 'Graph Test',
        type: 'visualization'
      });

      // Add entities and relations
      service.addEntitiesToContext(testContext.id, [
        { entity: 'user.Person', id: '123' },
        { entity: 'document.Article', id: '456' }
      ]);

      service.addRelationsToContext(testContext.id, ['rel-1']);

      // Mock relation retrieval
      vi.mocked(relationService.getRelation).mockReturnValue({
        id: 'rel-1',
        source: { entity: 'user.Person', id: '123' },
        target: { entity: 'document.Article', id: '456' },
        type: 'authored',
        direction: 'directed',
        valid: true,
        properties: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    it('should export a context as a graph', () => {
      const graph = service.exportContextAsGraph(testContext.id);

      expect(graph).toBeDefined();
      expect(graph.name).toBe('Graph Test');
      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(1);

      // Check graph properties
      expect(graph.properties.contextId).toBe(testContext.id);
      expect(graph.properties.contextType).toBe('visualization');
      expect(graph.properties.exportedAt).toBeInstanceOf(Date);
    });

    it('should export a graph with a center entity', () => {
      const centerEntity = { entity: 'user.Person', id: '123' };

      // Mock entity neighborhood relations
      vi.mocked(relationService.findRelationsBySource).mockReturnValue([{
        id: 'rel-1',
        source: centerEntity,
        target: { entity: 'document.Article', id: '456' },
        type: 'authored',
        direction: 'directed',
        valid: true,
        properties: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }]);

      const graph = service.exportContextAsGraph(testContext.id, {
        centerEntity,
        layoutType: 'hierarchical'
      });

      expect(graph).toBeDefined();
      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(graph.edges.length).toBeGreaterThan(0);
      expect(graph.properties.layoutType).toBe('hierarchical');
    });

    it('should throw error for nonexistent context', () => {
      expect(() => {
        service.exportContextAsGraph('nonexistent-id');
      }).toThrow('Context not found');
    });
  });

  describe('Utility Methods', () => {
    it('should get all contexts', () => {
      // Create some test contexts
      service.createContext({ name: 'Test 1', type: 'test' });
      service.createContext({ name: 'Test 2', type: 'test' });

      const contexts = service.getAllContexts();

      // +1 for system context
      expect(contexts.length).toBeGreaterThanOrEqual(3);
    });

    it('should count contexts', () => {
      // Create some test contexts
      service.createContext({ name: 'Test 1', type: 'test' });
      service.createContext({ name: 'Test 2', type: 'test' });

      const count = service.countContexts();

      // +1 for system context
      expect(count).toBeGreaterThanOrEqual(3);
    });
  });
});
