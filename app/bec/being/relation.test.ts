import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RelationService, relationService } from './relation';
import { entityService } from './entity';
import { EntityRef } from './schema/entity';
import { Relation } from './schema/relation';

describe('RelationService', () => {
  let service: RelationService;

  // Reset the service before each test
  beforeEach(() => {
    service = RelationService.getInstance();
    service.clearAllRelations();

    // Mock the entity service to avoid side effects
    vi.spyOn(entityService, 'entityExists').mockReturnValue(true);
    vi.spyOn(entityService, 'createEntity').mockImplementation((params) => {
      return {
        status: 'success',
        message: 'Entity created',
        data: {
          id: params.id || 'mock-id',
          type: params.type,
          name: params.name,
          properties: params.properties || {},
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1
        }
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test helpers
  const createTestRelation = (
    params: Partial<{
      source: EntityRef;
      target: EntityRef;
      type: string;
      direction: "directed" | "bidirectional";
      valid: boolean;
      properties: Record<string, any>;
    }> = {}
  ) => {
    const defaults = {
      source: { entity: 'user.Person', id: '123' },
      target: { entity: 'document.Article', id: '456' },
      type: 'created_by',
      direction: 'directed' as const,
      valid: true,
      properties: {}
    };

    const mergedParams = { ...defaults, ...params };

    return service.createRelation(mergedParams);
  };

  describe('Relation Creation', () => {
    it('should create a relation successfully', () => {
      const result = createTestRelation();

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      expect(result.data?.source.entity).toBe('user.Person');
      expect(result.data?.target.entity).toBe('document.Article');
      expect(result.data?.type).toBe('created_by');
    });

    it('should emit an event when a relation is created', () => {
      const listener = vi.fn();
      service.on('relation:created', listener);

      createTestRelation();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'relation:created',
        name: 'relation:created',
        target: expect.objectContaining({
          source: expect.objectContaining({ entity: 'user.Person' }),
          target: expect.objectContaining({ entity: 'document.Article' })
        })
      }));
    });

    it('should create a bidirectional relation', () => {
      const result = service.createBidirectionalRelation({
        source: { entity: 'user.Person', id: '123' },
        target: { entity: 'document.Article', id: '456' },
        type: 'authored'
      });

      expect(result.status).toBe('success');
      expect(result.data?.direction).toBe('bidirectional');
    });
  });

  describe('Relation Retrieval', () => {
    it('should retrieve a relation by ID', () => {
      const created = createTestRelation();
      const id = created.data!.id;

      const relation = service.getRelation(id);
      expect(relation).toBeDefined();
      expect(relation?.id).toBe(id);
    });

    it('should retrieve multiple relations by IDs', () => {
      const relation1 = createTestRelation().data!;
      const relation2 = createTestRelation({
        source: { entity: 'user.Person', id: '789' },
        type: 'edited_by'
      }).data!;

      const relations = service.getRelations([relation1.id, relation2.id]);
      expect(relations).toHaveLength(2);
      expect(relations.map(r => r.id)).toContain(relation1.id);
      expect(relations.map(r => r.id)).toContain(relation2.id);
    });

    it('should find relations by source entity', () => {
      const source = { entity: 'user.Person', id: '123' };

      createTestRelation({ source });
      createTestRelation({
        source,
        type: 'edited_by'
      });

      const relations = service.findRelationsBySource(source);
      expect(relations).toHaveLength(2);
      expect(relations.map(r => r.type)).toContain('created_by');
      expect(relations.map(r => r.type)).toContain('edited_by');
    });

    it('should find relations by target entity', () => {
      const target = { entity: 'document.Article', id: '456' };

      createTestRelation({ target });
      createTestRelation({
        target,
        source: { entity: 'user.Person', id: '789' },
        type: 'reviewed_by'
      });

      const relations = service.findRelationsByTarget(target);
      expect(relations).toHaveLength(2);
    });

    it('should find relations by type', () => {
      createTestRelation({ type: 'authored' });
      createTestRelation({ type: 'authored' });
      createTestRelation({ type: 'reviewed' });

      const authoredRelations = service.findRelationsByType('authored');
      expect(authoredRelations).toHaveLength(2);

      const reviewedRelations = service.findRelationsByType('reviewed');
      expect(reviewedRelations).toHaveLength(1);
    });

    it('should find direct relation between entities', () => {
      const source = { entity: 'user.Person', id: '123' };
      const target = { entity: 'document.Article', id: '456' };

      createTestRelation({
        source,
        target,
        type: 'authored'
      });

      const relation = service.findDirectRelation(source, target, 'authored');
      expect(relation).toBeDefined();
      expect(relation?.type).toBe('authored');

      // Should not find with wrong type
      const notFound = service.findDirectRelation(source, target, 'reviewed');
      expect(notFound).toBeUndefined();
    });

    it('should find bidirectional relation in either direction', () => {
      const source = { entity: 'user.Person', id: '123' };
      const target = { entity: 'user.Person', id: '456' };

      createTestRelation({
        source,
        target,
        type: 'friends_with',
        direction: 'bidirectional'
      });

      // Find in forward direction
      const forward = service.findDirectRelation(source, target, 'friends_with');
      expect(forward).toBeDefined();

      // Find in reverse direction
      const reverse = service.findDirectRelation(target, source, 'friends_with');
      expect(reverse).toBeDefined();
    });
  });

  describe('Advanced Traversal', () => {
    it('should find related entities with traversal', () => {
      // Create a small graph
      const person1 = { entity: 'user.Person', id: '1' };
      const person2 = { entity: 'user.Person', id: '2' };
      const person3 = { entity: 'user.Person', id: '3' };
      const doc1 = { entity: 'document.Article', id: 'doc1' };

      // Person1 knows Person2
      createTestRelation({
        source: person1,
        target: person2,
        type: 'knows'
      });

      // Person2 knows Person3
      createTestRelation({
        source: person2,
        target: person3,
        type: 'knows'
      });

      // Person1 authored Doc1
      createTestRelation({
        source: person1,
        target: doc1,
        type: 'authored'
      });

      // Find all entities related to Person1 with depth 1
      const related1 = service.findRelatedEntities(person1, { depth: 1 });
      expect(related1).toHaveLength(2); // Person2 and Doc1

      // Find all entities related to Person1 with depth 2
      const related2 = service.findRelatedEntities(person1, { depth: 2 });
      expect(related2).toHaveLength(3); // Person2, Doc1, and Person3

      // Find only entities connected by 'knows' relation
      const knows = service.findRelatedEntities(person1, {
        relationType: 'knows',
        depth: 2
      });
      expect(knows).toHaveLength(2); // Person2 and Person3

      // Find only outgoing relations
      const outgoing = service.findRelatedEntities(person1, {
        direction: 'outgoing',
        depth: 2
      });
      expect(outgoing).toHaveLength(3); // Person2, Doc1, and Person3
    });

    it('should include relation properties when requested', () => {
      const person1 = { entity: 'user.Person', id: '1' };
      const person2 = { entity: 'user.Person', id: '2' };

      createTestRelation({
        source: person1,
        target: person2,
        type: 'knows',
        properties: { since: '2020', strength: 0.8 }
      });

      const related = service.findRelatedEntities(person1, {
        includeProperties: true
      });

      expect(related).toHaveLength(1);
      expect(related[0].relationProperties).toBeDefined();
      expect(related[0].relationProperties?.since).toBe('2020');
      expect(related[0].relationProperties?.strength).toBe(0.8);
    });
  });

  describe('Relation Updates', () => {
    it('should update a relation', () => {
      const created = createTestRelation().data!;

      const updateResult = service.updateRelation(created.id, {
        type: 'edited_by',
        strength: 0.9,
        properties: { timestamp: new Date() }
      });

      expect(updateResult.status).toBe('success');
      expect(updateResult.data?.type).toBe('edited_by');
      expect(updateResult.data?.strength).toBe(0.9);
      expect(updateResult.data?.properties.timestamp).toBeDefined();
    });

    it('should emit an event when a relation is updated', () => {
      const created = createTestRelation().data!;
      const listener = vi.fn();

      service.on('relation:updated', listener);

      service.updateRelation(created.id, {
        type: 'edited_by'
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'relation:updated',
        name: 'relation:updated',
        target: expect.objectContaining({
          id: created.id,
          type: 'edited_by'
        })
      }));
    });

    it('should invalidate a relation', () => {
      const created = createTestRelation().data!;
      const listener = vi.fn();

      service.on('relation:invalidated', listener);

      const result = service.invalidateRelation(created.id, 'No longer relevant');

      expect(result.status).toBe('success');
      expect(result.data?.valid).toBe(false);
      expect(result.data?.properties.invalidationReason).toBe('No longer relevant');

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Relation Deletion', () => {
    it('should delete a relation', () => {
      const created = createTestRelation().data!;
      const listener = vi.fn();

      service.on('relation:deleted', listener);

      const result = service.deleteRelation(created.id);

      expect(result.status).toBe('success');
      expect(result.data).toBe(true);

      // Relation should no longer exist
      expect(service.getRelation(created.id)).toBeUndefined();

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Advanced Querying', () => {
    beforeEach(() => {
      // Set up test data
      // Person1 authored Doc1 and Doc2
      createTestRelation({
        source: { entity: 'user.Person', id: '1' },
        target: { entity: 'document.Article', id: 'doc1' },
        type: 'authored',
        properties: { quality: 'high', draft: false }
      });

      createTestRelation({
        source: { entity: 'user.Person', id: '1' },
        target: { entity: 'document.Article', id: 'doc2' },
        type: 'authored',
        properties: { quality: 'medium', draft: true }
      });

      // Person2 reviewed Doc1
      createTestRelation({
        source: { entity: 'user.Person', id: '2' },
        target: { entity: 'document.Article', id: 'doc1' },
        type: 'reviewed',
        properties: { rating: 4 }
      });

      // Person2 edited Doc2
      createTestRelation({
        source: { entity: 'user.Person', id: '2' },
        target: { entity: 'document.Article', id: 'doc2' },
        type: 'edited',
        properties: { rating: 3 }
      });

      // An invalid relation
      createTestRelation({
        source: { entity: 'user.Person', id: '3' },
        target: { entity: 'document.Article', id: 'doc3' },
        type: 'authored',
        valid: false
      });
    });

    it('should query relations by type', () => {
      const authored = service.queryRelations({
        types: ['authored']
      });

      expect(authored).toHaveLength(2);
      expect(authored.every(r => r.type === 'authored')).toBe(true);
    });

    it('should query relations by source entity', () => {
      const person1Relations = service.queryRelations({
        sourceEntity: { entity: 'user.Person', id: '1' }
      });

      expect(person1Relations).toHaveLength(2);
      expect(person1Relations.every(r =>
        r.source.entity === 'user.Person' && r.source.id === '1'
      )).toBe(true);
    });

    it('should query relations by property filters', () => {
      const highQuality = service.queryRelations({
        propertyFilters: { quality: 'high' }
      });

      expect(highQuality).toHaveLength(1);
      expect(highQuality[0].properties.quality).toBe('high');

      const drafts = service.queryRelations({
        propertyFilters: { draft: true }
      });

      expect(drafts).toHaveLength(1);
      expect(drafts[0].properties.draft).toBe(true);
    });

    it('should query relations by complex filters', () => {
      const result = service.queryRelations({
        types: ['authored', 'edited'],
        propertyFilters: {
          rating: { $gt: 3 }
        },
        validOnly: true
      });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('reviewed');
      expect(result[0].properties.rating).toBe(4);
    });

    it('should support pagination in queries', () => {
      // Get all relations
      const all = service.queryRelations({});
      expect(all.length).toBeGreaterThan(3);

      // Get first 2
      const page1 = service.queryRelations({
        limit: 2
      });
      expect(page1).toHaveLength(2);

      // Get next 2
      const page2 = service.queryRelations({
        offset: 2,
        limit: 2
      });
      expect(page2).toHaveLength(2);

      // Ensure no overlap between pages
      const page1Ids = page1.map(r => r.id);
      const page2Ids = page2.map(r => r.id);
      expect(page1Ids.some(id => page2Ids.includes(id))).toBe(false);
    });
  });

  describe('Temporal Relations', () => {
    it('should respect validFrom and validTo dates', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);
      const tomorrow = new Date(now.getTime() + 86400000);

      // Active relation (validFrom yesterday, validTo tomorrow)
      const activeRelation = createTestRelation({
        validFrom: yesterday,
        validTo: tomorrow
      }).data!;

      // Future relation (validFrom tomorrow)
      const futureRelation = createTestRelation({
        source: { entity: 'user.Person', id: '2' },
        validFrom: tomorrow
      }).data!;

      // Expired relation (validTo yesterday)
      const expiredRelation = createTestRelation({
        source: { entity: 'user.Person', id: '3' },
        validTo: yesterday
      }).data!;

      // Query for active relations
      const activeNow = service.queryRelations({
        activeAt: now
      });

      expect(activeNow).toHaveLength(1);
      expect(activeNow[0].id).toBe(activeRelation.id);

      // Query for relations active tomorrow
      const activeTomorrow = service.queryRelations({
        activeAt: tomorrow
      });

      expect(activeTomorrow.length).toBeGreaterThanOrEqual(1);
      expect(activeTomorrow.map(r => r.id)).toContain(futureRelation.id);
      expect(activeTomorrow.map(r => r.id)).toContain(activeRelation.id);

      // Query for relations active yesterday
      const activeYesterday = service.queryRelations({
        activeAt: yesterday
      });

      expect(activeYesterday.length).toBeGreaterThanOrEqual(1);
      expect(activeYesterday.map(r => r.id)).toContain(activeRelation.id);
      expect(activeYesterday.map(r => r.id)).toContain(expiredRelation.id);
    });
  });
});
