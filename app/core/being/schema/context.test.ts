import { describe, it, expect, vi } from 'vitest';
import {
  ContextSchema,
  CoreContextTypes,
  createContext,
  isContextActiveAt,
  addEntitiesToContext,
  addRelationsToContext,
  type Context
} from './context';
import { type EntityRef } from './entity';

describe('Context Schema', () => {
  describe('ContextSchema Validation', () => {
    it('should validate a complete context', () => {
      const validContext = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Project Alpha',
        type: 'project',
        description: 'A project context for Alpha initiative',
        entities: [
          { entity: 'user.Person', id: '123' },
          { entity: 'document.Article', id: '456' }
        ],
        relations: ['rel-1', 'rel-2', 'rel-3'],
        properties: {
          priority: 'high',
          department: 'engineering'
        },
        metrics: {
          entityCount: 2,
          relationCount: 3,
          density: 0.75
        },
        valid: true,
        validFrom: new Date('2023-01-01'),
        validTo: new Date('2023-12-31'),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = ContextSchema.safeParse(validContext);
      expect(result.success).toBe(true);
    });

    it('should validate a minimal context', () => {
      const minimalContext = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Simple Context',
        type: 'generic',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = ContextSchema.safeParse(minimalContext);
      expect(result.success).toBe(true);

      if (result.success) {
        // Check default values
        expect(result.data.entities).toEqual([]);
        expect(result.data.relations).toEqual([]);
        expect(result.data.valid).toBe(true);
      }
    });

    it('should reject contexts with missing required fields', () => {
      const missingName = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'project',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const missingType = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Project Alpha',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(ContextSchema.safeParse(missingName).success).toBe(false);
      expect(ContextSchema.safeParse(missingType).success).toBe(false);
    });

    it('should validate contexts with core context types', () => {
      for (const type of CoreContextTypes) {
        const context = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: `${type} Context`,
          type,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = ContextSchema.safeParse(context);
        expect(result.success).toBe(true);
      }
    });

    it('should validate contexts with custom types', () => {
      const customTypeContext = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Custom Context',
        type: 'custom.special',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = ContextSchema.safeParse(customTypeContext);
      expect(result.success).toBe(true);
    });

    it('should validate the metrics object', () => {
      const contextWithMetrics = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Project Alpha',
        type: 'project',
        metrics: {
          entityCount: 10,
          relationCount: 25,
          density: 0.5
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = ContextSchema.safeParse(contextWithMetrics);
      expect(result.success).toBe(true);

      // Test with invalid metrics
      const invalidMetrics = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Project Alpha',
        type: 'project',
        metrics: {
          entityCount: -1, // Negative count (invalid)
          relationCount: 25,
          density: 1.5 // Density > 1 (invalid)
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const invalidResult = ContextSchema.safeParse(invalidMetrics);
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('Context Helper Functions', () => {
    describe('createContext', () => {
      it('should create a valid context with minimal params', () => {
        const context = createContext({
          name: 'Test Context',
          type: 'generic'
        });

        // Verify context structure
        expect(context.id).toBeDefined();
        expect(context.name).toBe('Test Context');
        expect(context.type).toBe('generic');
        expect(context.entities).toEqual([]);
        expect(context.relations).toEqual([]);
        expect(context.properties).toEqual({});
        expect(context.metrics).toBeDefined();
        expect(context.metrics?.entityCount).toBe(0);
        expect(context.metrics?.relationCount).toBe(0);
        expect(context.metrics?.density).toBeUndefined(); // No density with 0 entities
        expect(context.valid).toBe(true);
        expect(context.createdAt).toBeInstanceOf(Date);
        expect(context.updatedAt).toBeInstanceOf(Date);

        // Verify the context passes schema validation
        const result = ContextSchema.safeParse(context);
        expect(result.success).toBe(true);
      });

      it('should create a valid context with full params', () => {
        const now = new Date();
        const validFrom = new Date(now.getTime() - 86400000); // Yesterday
        const validTo = new Date(now.getTime() + 86400000);   // Tomorrow

        const entities: EntityRef[] = [
          { entity: 'user.Person', id: '123' },
          { entity: 'document.Article', id: '456' },
          { entity: 'document.Article', id: '789' }
        ];

        const relationIds = ['rel-1', 'rel-2', 'rel-3'];

        const context = createContext({
          name: 'Comprehensive Context',
          type: 'project',
          description: 'A fully-featured context',
          entities,
          relations: relationIds,
          properties: {
            owner: 'test-user',
            status: 'active'
          },
          validFrom,
          validTo,
          valid: true
        });

        // Verify all properties were set correctly
        expect(context.id).toBeDefined();
        expect(context.name).toBe('Comprehensive Context');
        expect(context.type).toBe('project');
        expect(context.description).toBe('A fully-featured context');
        expect(context.entities).toEqual(entities);
        expect(context.relations).toEqual(relationIds);
        expect(context.properties).toEqual({
          owner: 'test-user',
          status: 'active'
        });
        expect(context.metrics?.entityCount).toBe(3);
        expect(context.metrics?.relationCount).toBe(3);
        expect(context.metrics?.density).toBeDefined(); // Should calculate density
        expect(context.valid).toBe(true);
        expect(context.validFrom).toEqual(validFrom);
        expect(context.validTo).toEqual(validTo);

        // Verify the context passes schema validation
        const result = ContextSchema.safeParse(context);
        expect(result.success).toBe(true);
      });

      it('should calculate density correctly', () => {
        // 3 entities = maximum of 6 directed relations (n * (n-1))
        // 3 relations out of 6 possible = 0.5 density
        const entities: EntityRef[] = [
          { entity: 'user.Person', id: '123' },
          { entity: 'user.Person', id: '456' },
          { entity: 'document.Article', id: '789' }
        ];

        const relationIds = ['rel-1', 'rel-2', 'rel-3'];

        const context = createContext({
          name: 'Density Test',
          type: 'generic',
          entities,
          relations: relationIds
        });

        // Verify density calculation
        expect(context.metrics?.density).toBe(0.5); // 3/6 = 0.5

        // Test with single entity (should have undefined density)
        const singleEntityContext = createContext({
          name: 'Single Entity',
          type: 'generic',
          entities: [{ entity: 'user.Person', id: '123' }]
        });

        expect(singleEntityContext.metrics?.density).toBe(0);

        // Test with no relations
        const noRelationsContext = createContext({
          name: 'No Relations',
          type: 'generic',
          entities
        });

        expect(noRelationsContext.metrics?.density).toBe(0);
      });
    });

    describe('isContextActiveAt', () => {
      it('should identify active contexts', () => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 86400000);
        const tomorrow = new Date(now.getTime() + 86400000);

        const activeContext: Context = {
          id: '123',
          name: 'Active Context',
          type: 'generic',
          entities: [],
          relations: [],
          valid: true,
          validFrom: yesterday,
          validTo: tomorrow,
          createdAt: yesterday,
          updatedAt: yesterday
        };

        // Should be active now
        expect(isContextActiveAt(activeContext, now)).toBe(true);
      });

      it('should identify inactive contexts due to valid flag', () => {
        const now = new Date();

        const invalidContext: Context = {
          id: '123',
          name: 'Invalid Context',
          type: 'generic',
          entities: [],
          relations: [],
          valid: false, // Explicitly invalid
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(isContextActiveAt(invalidContext, now)).toBe(false);
      });

      it('should identify contexts not yet active', () => {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 86400000);

        const futureContext: Context = {
          id: '123',
          name: 'Future Context',
          type: 'generic',
          entities: [],
          relations: [],
          valid: true,
          validFrom: tomorrow, // Not valid yet
          createdAt: now,
          updatedAt: now
        };

        expect(isContextActiveAt(futureContext, now)).toBe(false);
      });

      it('should identify expired contexts', () => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 86400000);

        const expiredContext: Context = {
          id: '123',
          name: 'Expired Context',
          type: 'generic',
          entities: [],
          relations: [],
          valid: true,
          validFrom: new Date(yesterday.getTime() - 86400000), // 2 days ago
          validTo: yesterday, // Expired yesterday
          createdAt: yesterday,
          updatedAt: yesterday
        };

        expect(isContextActiveAt(expiredContext, now)).toBe(false);
      });

      it('should use a custom time provider', () => {
        const fixedDate = new Date('2023-06-15T12:00:00Z');
        const mockTimeProvider = () => fixedDate;

        const validContext: Context = {
          id: '123',
          name: 'Test Context',
          type: 'generic',
          entities: [],
          relations: [],
          valid: true,
          validFrom: new Date('2023-01-01T00:00:00Z'),
          validTo: new Date('2023-12-31T23:59:59Z'),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Should be active at the fixed date
        expect(isContextActiveAt(validContext, null, mockTimeProvider)).toBe(true);

        const expiredContext: Context = {
          id: '123',
          name: 'Test Context',
          type: 'generic',
          entities: [],
          relations: [],
          valid: true,
          validFrom: new Date('2023-01-01T00:00:00Z'),
          validTo: new Date('2023-05-31T23:59:59Z'),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Should be inactive at the fixed date
        expect(isContextActiveAt(expiredContext, null, mockTimeProvider)).toBe(false);
      });

      it('should handle boundary cases correctly', () => {
        const exactStart = new Date('2023-01-01T00:00:00.000Z');
        const duringValidity = new Date('2023-01-15T00:00:00.000Z');
        const exactEnd = new Date('2023-02-01T00:00:00.000Z');

        const context: Context = {
          id: '123',
          name: 'Boundary Context',
          type: 'generic',
          entities: [],
          relations: [],
          valid: true,
          validFrom: exactStart,
          validTo: exactEnd,
          createdAt: exactStart,
          updatedAt: exactStart
        };

        // Check exactly at start time (should be valid)
        expect(isContextActiveAt(context, exactStart)).toBe(true);

        // Check during validity period
        expect(isContextActiveAt(context, duringValidity)).toBe(true);

        // Check exactly at end time (should be valid - inclusive end)
        expect(isContextActiveAt(context, exactEnd)).toBe(true);

        // Check microsecond before start (should be invalid)
        const justBeforeStart = new Date(exactStart.getTime() - 1);
        expect(isContextActiveAt(context, justBeforeStart)).toBe(false);

        // Check microsecond after end (should be invalid)
        const justAfterEnd = new Date(exactEnd.getTime() + 1);
        expect(isContextActiveAt(context, justAfterEnd)).toBe(false);
      });
    });

    describe('addEntitiesToContext', () => {
      it('should add new entities to context', () => {
        // Create initial context
        const context = createContext({
          name: 'Entity Test',
          type: 'generic',
          entities: [{ entity: 'user.Person', id: '123' }]
        });

        // New entities to add
        const newEntities: EntityRef[] = [
          { entity: 'document.Article', id: '456' },
          { entity: 'document.Comment', id: '789' }
        ];

        // Add the entities
        const updated = addEntitiesToContext(context, newEntities);

        // Verify entities were added
        expect(updated.entities.length).toBe(3);
        expect(updated.metrics?.entityCount).toBe(3);

        // Verify the specific entities exist
        const entityKeys = updated.entities.map(e => `${e.entity}:${e.id}`);
        expect(entityKeys).toContain('user.Person:123');
        expect(entityKeys).toContain('document.Article:456');
        expect(entityKeys).toContain('document.Comment:789');

        // Verify updatedAt was refreshed
        expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(context.updatedAt.getTime());
      });

      it('should not add duplicate entities', () => {
        // Create initial context
        const context = createContext({
          name: 'Duplicate Test',
          type: 'generic',
          entities: [
            { entity: 'user.Person', id: '123' },
            { entity: 'document.Article', id: '456' }
          ]
        });

        // Try to add a mix of new and duplicate entities
        const entitiesToAdd: EntityRef[] = [
          { entity: 'user.Person', id: '123' }, // Already exists
          { entity: 'document.Comment', id: '789' } // New
        ];

        // Add the entities
        const updated = addEntitiesToContext(context, entitiesToAdd);

        // Verify only non-duplicate entities were added
        expect(updated.entities.length).toBe(3);
        expect(updated.metrics?.entityCount).toBe(3);

        // Verify the specific entities
        const entityKeys = updated.entities.map(e => `${e.entity}:${e.id}`);
        expect(entityKeys).toContain('user.Person:123');
        expect(entityKeys).toContain('document.Article:456');
        expect(entityKeys).toContain('document.Comment:789');
      });

      it('should recalculate density when adding entities', () => {
        // Create initial context with relation but only one entity
        const context = createContext({
          name: 'Density Recalculation',
          type: 'generic',
          entities: [{ entity: 'user.Person', id: '123' }],
          relations: ['rel-1', 'rel-2']
        });

        // Density should be undefined with only one entity
        expect(context.metrics?.density).toBe(1.0);

        // Add second entity - now density should be calculated
        const updated = addEntitiesToContext(context, [
          { entity: 'document.Article', id: '456' }
        ]);

        // Verify density is calculated (2 relations out of 2 possible = 1.0)
        expect(updated.metrics?.density).toBe(1.0);

        // Add third entity - density should be recalculated
        const furtherUpdated = addEntitiesToContext(updated, [
          { entity: 'document.Comment', id: '789' }
        ]);

        // Verify density is recalculated (2 relations out of 6 possible = 0.333...)
        expect(furtherUpdated.metrics?.density).toBeCloseTo(0.333, 2);
      });

      it('should return unchanged context if no new entities', () => {
        // Create initial context
        const context = createContext({
          name: 'No Changes',
          type: 'generic',
          entities: [
            { entity: 'user.Person', id: '123' },
            { entity: 'document.Article', id: '456' }
          ]
        });

        // Try to add only duplicate entities
        const duplicates: EntityRef[] = [
          { entity: 'user.Person', id: '123' },
          { entity: 'document.Article', id: '456' }
        ];

        // Should return original context
        const updated = addEntitiesToContext(context, duplicates);

        // Verify no changes
        expect(updated).toBe(context); // Same reference
      });
    });

    describe('addRelationsToContext', () => {
      it('should add new relations to context', () => {
        // Create initial context
        const context = createContext({
          name: 'Relation Test',
          type: 'generic',
          relations: ['rel-1']
        });

        // New relations to add
        const newRelations = ['rel-2', 'rel-3'];

        // Add the relations
        const updated = addRelationsToContext(context, newRelations);

        // Verify relations were added
        expect(updated.relations.length).toBe(3);
        expect(updated.metrics?.relationCount).toBe(3);
        expect(updated.relations).toContain('rel-1');
        expect(updated.relations).toContain('rel-2');
        expect(updated.relations).toContain('rel-3');

        // Verify updatedAt was refreshed
        expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(context.updatedAt.getTime());
      });

      it('should not add duplicate relations', () => {
        // Create initial context
        const context = createContext({
          name: 'Duplicate Relation Test',
          type: 'generic',
          relations: ['rel-1', 'rel-2']
        });

        // Try to add a mix of new and duplicate relations
        const relationsToAdd = ['rel-1', 'rel-3']; // rel-1 already exists

        // Add the relations
        const updated = addRelationsToContext(context, relationsToAdd);

        // Verify only non-duplicate relations were added
        expect(updated.relations.length).toBe(3);
        expect(updated.metrics?.relationCount).toBe(3);
        expect(updated.relations).toContain('rel-1');
        expect(updated.relations).toContain('rel-2');
        expect(updated.relations).toContain('rel-3');
      });

      it('should recalculate density when adding relations', () => {
        // Create initial context with two entities but no relations
        const context = createContext({
          name: 'Density Recalculation',
          type: 'generic',
          entities: [
            { entity: 'user.Person', id: '123' },
            { entity: 'document.Article', id: '456' }
          ]
        });

        // Initial density should be 0 (no relations)
        expect(context.metrics?.density).toBe(0);

        // Add one relation
        const updated = addRelationsToContext(context, ['rel-1']);

        // Verify density is recalculated (1 relation out of 2 possible = 0.5)
        expect(updated.metrics?.density).toBe(0.5);

        // Add another relation
        const furtherUpdated = addRelationsToContext(updated, ['rel-2']);

        // Verify density is recalculated (2 relations out of 2 possible = 1.0)
        expect(furtherUpdated.metrics?.density).toBe(1.0);
      });

      it('should return unchanged context if no new relations', () => {
        // Create initial context
        const context = createContext({
          name: 'No Changes',
          type: 'generic',
          relations: ['rel-1', 'rel-2']
        });

        // Try to add only duplicate relations
        const duplicates = ['rel-1', 'rel-2'];

        // Should return original context
        const updated = addRelationsToContext(context, duplicates);

        // Verify no changes
        expect(updated).toBe(context); // Same reference
      });
    });
  });

  describe('Context Domain Concepts', () => {
    it('should support validity periods for temporal contexts', () => {
      // Create a context with a specific validity period
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);
      const tomorrow = new Date(now.getTime() + 86400000);

      const temporalContext = createContext({
        name: 'Q1 Project',
        type: 'project',
        validFrom: yesterday,
        validTo: tomorrow
      });

      // Check validity
      expect(isContextActiveAt(temporalContext, now)).toBe(true);

      // Create a context for a future quarter
      const nextQuarterStart = new Date(now.getFullYear(), now.getMonth() + 3, 1);
      const nextQuarterEnd = new Date(now.getFullYear(), now.getMonth() + 6, 0);

      const futureContext = createContext({
        name: 'Next Quarter Project',
        type: 'project',
        validFrom: nextQuarterStart,
        validTo: nextQuarterEnd
      });

      // Should not be valid now
      expect(isContextActiveAt(futureContext, now)).toBe(false);
      // Should be valid during next quarter
      expect(isContextActiveAt(futureContext, new Date(nextQuarterStart.getTime() + 86400000))).toBe(true);
    });

    it('should support building a context incrementally', () => {
      // Start with an empty context
      let projectContext = createContext({
        name: 'Incremental Project',
        type: 'project'
      });

      // Add some initial entities
      const personA: EntityRef = { entity: 'user.Person', id: 'A' };
      const personB: EntityRef = { entity: 'user.Person', id: 'B' };
      projectContext = addEntitiesToContext(projectContext, [personA, personB]);

      // Verify the entities were added
      expect(projectContext.entities.length).toBe(2);

      // Add a relation
      projectContext = addRelationsToContext(projectContext, ['collaboration-AB']);

      // Verify the relation was added
      expect(projectContext.relations.length).toBe(1);

      // Add more entities
      const document: EntityRef = { entity: 'document.Article', id: 'doc1' };
      projectContext = addEntitiesToContext(projectContext, [document]);

      // Add more relations
      projectContext = addRelationsToContext(projectContext, ['created-doc1']);

      // Verify final state
      expect(projectContext.entities.length).toBe(3);
      expect(projectContext.relations.length).toBe(2);

      // Verify metrics
      expect(projectContext.metrics?.entityCount).toBe(3);
      expect(projectContext.metrics?.relationCount).toBe(2);
      expect(projectContext.metrics?.density).toBeDefined();
    });

    it('should support different context types for different use cases', () => {
      // Create different types of contexts
      const collectionContext = createContext({
        name: 'Article Collection',
        type: 'collection',
        properties: { theme: 'technology' }
      });

      const projectContext = createContext({
        name: 'Project Alpha',
        type: 'project',
        properties: { deadline: new Date() }
      });

      const viewContext = createContext({
        name: 'Dashboard View',
        type: 'view',
        properties: { layout: 'grid' }
      });

      // Verify they all have the correct types
      expect(collectionContext.type).toBe('collection');
      expect(projectContext.type).toBe('project');
      expect(viewContext.type).toBe('view');

      // Verify they have the type-specific properties
      expect(collectionContext.properties?.theme).toBe('technology');
      expect(projectContext.properties?.deadline).toBeInstanceOf(Date);
      expect(viewContext.properties?.layout).toBe('grid');
    });
  });
});
