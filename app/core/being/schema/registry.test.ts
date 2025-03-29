import { describe, it, expect, vi } from 'vitest';
import {
  RegistrySchema,
  CoreRegistryTypes,
  createRegistry,
  updateRegistryStats,
  type Registry
} from './registry';

describe('Registry Schema', () => {
  describe('RegistrySchema', () => {
    it('should validate a valid registry', () => {
      const validRegistry = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Registry',
        description: 'A test registry',
        type: 'system',
        active: true,
        properties: {
          owner: 'test-user',
          version: 1
        },
        stats: {
          entityCount: 10,
          relationCount: 5,
          contextCount: 2,
          lastUpdated: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = RegistrySchema.safeParse(validRegistry);
      expect(result.success).toBe(true);
    });

    it('should validate a minimal registry', () => {
      const minimalRegistry = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Registry',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = RegistrySchema.safeParse(minimalRegistry);
      expect(result.success).toBe(true);

      if (result.success) {
        // Check default values
        expect(result.data.type).toBe('generic');
        expect(result.data.active).toBe(true);
      }
    });

    it('should reject registries with invalid properties', () => {
      const invalidRegistry = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        // Missing required 'name'
        type: 'unknown-type', // Invalid type
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = RegistrySchema.safeParse(invalidRegistry);
      expect(result.success).toBe(false);
    });

    it('should constrain registry types to predefined values', () => {
      for (const type of CoreRegistryTypes) {
        const registry = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test Registry',
          type,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = RegistrySchema.safeParse(registry);
        expect(result.success).toBe(true);
      }

      // Test with invalid type
      const invalidType = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Registry',
        type: 'invalid-type',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = RegistrySchema.safeParse(invalidType);
      expect(result.success).toBe(false);
    });

    it('should validate stats object', () => {
      const registryWithStats = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Registry',
        stats: {
          entityCount: 10,
          relationCount: 5,
          contextCount: 2,
          lastUpdated: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = RegistrySchema.safeParse(registryWithStats);
      expect(result.success).toBe(true);

      // Test with negative counts (should fail)
      const negativeStats = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Registry',
        stats: {
          entityCount: -1, // Negative count
          relationCount: 5,
          contextCount: 2
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const invalidResult = RegistrySchema.safeParse(negativeStats);
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('Registry Helper Functions', () => {
    describe('createRegistry', () => {
      it('should create a valid registry with minimal params', () => {
        const registry = createRegistry({
          name: 'Test Registry'
        });

        // Verify registry structure
        expect(registry.id).toBeDefined();
        expect(registry.name).toBe('Test Registry');
        expect(registry.type).toBe('generic'); // Default type
        expect(registry.active).toBe(true);    // Default active
        expect(registry.properties).toEqual({});
        expect(registry.stats).toBeDefined();
        expect(registry.stats?.entityCount).toBe(0);
        expect(registry.stats?.relationCount).toBe(0);
        expect(registry.stats?.contextCount).toBe(0);
        expect(registry.stats?.lastUpdated).toBeInstanceOf(Date);
        expect(registry.createdAt).toBeInstanceOf(Date);
        expect(registry.updatedAt).toBeInstanceOf(Date);

        // Verify the registry passes schema validation
        const result = RegistrySchema.safeParse(registry);
        expect(result.success).toBe(true);
      });

      it('should create a valid registry with full params', () => {
        const registry = createRegistry({
          name: 'Test Registry',
          description: 'A test registry',
          type: 'system',
          properties: {
            owner: 'test-user',
            version: 1
          },
          active: false
        });

        // Verify all properties were set correctly
        expect(registry.id).toBeDefined();
        expect(registry.name).toBe('Test Registry');
        expect(registry.description).toBe('A test registry');
        expect(registry.type).toBe('system');
        expect(registry.active).toBe(false);
        expect(registry.properties).toEqual({
          owner: 'test-user',
          version: 1
        });

        // Verify the registry passes schema validation
        const result = RegistrySchema.safeParse(registry);
        expect(result.success).toBe(true);
      });

      it('should set updatedAt and createdAt to the same initial value', () => {
        const registry = createRegistry({
          name: 'Test Registry'
        });

        expect(registry.createdAt).toEqual(registry.updatedAt);
      });
    });

    describe('updateRegistryStats', () => {
      it('should update registry stats', () => {
        // Set up fake timers
        vi.useFakeTimers();

        // Create initial registry
        const registry = createRegistry({
          name: 'Test Registry'
        });

        // Get the original stats for comparison
        const originalStats = { ...registry.stats! };
        const originalUpdatedAt = registry.updatedAt;

        // Advance time
        vi.advanceTimersByTime(10);

        // Update stats
        const updated = updateRegistryStats(registry, {
          entityCount: 10,
          relationCount: 5,
          contextCount: 2
        });

        // Verify stats were updated
        expect(updated.stats?.entityCount).toBe(10);
        expect(updated.stats?.relationCount).toBe(5);
        expect(updated.stats?.contextCount).toBe(2);
        expect(updated.stats?.lastUpdated).not.toEqual(originalStats.lastUpdated);

        // Verify updatedAt was refreshed
        expect(updated.updatedAt).not.toEqual(originalUpdatedAt);

        // Clean up fake timers
        vi.useRealTimers();
      });

      it('should update only specified stats', () => {
        // Create initial registry with some stats
        const registry = createRegistry({
          name: 'Test Registry'
        });

        // First update to set some values
        const firstUpdate = updateRegistryStats(registry, {
          entityCount: 10,
          relationCount: 5,
          contextCount: 2
        });

        // Now update only entity count
        const secondUpdate = updateRegistryStats(firstUpdate, {
          entityCount: 15
        });

        // Verify only entityCount was updated
        expect(secondUpdate.stats?.entityCount).toBe(15);      // Updated
        expect(secondUpdate.stats?.relationCount).toBe(5);     // Preserved
        expect(secondUpdate.stats?.contextCount).toBe(2);      // Preserved
      });

      it('should handle updating from undefined stats', () => {
        // Create a registry with manually deleted stats
        const registry: Registry = {
          id: '123',
          name: 'Test Registry',
          type: 'generic',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
          // No stats property
        };

        // Update stats
        const updated = updateRegistryStats(registry, {
          entityCount: 10
        });

        // Verify stats were created
        expect(updated.stats).toBeDefined();
        expect(updated.stats?.entityCount).toBe(10);
        expect(updated.stats?.relationCount).toBe(0);
        expect(updated.stats?.contextCount).toBe(0);
      });
    });
  });

  // Future tests for when you implement registry operations
  describe.skip('Registry Operations', () => {
    it('should store and retrieve registry entities', () => {
      // This would test a future registerEntity function
    });

    it('should maintain registry stats when entities are added/removed', () => {
      // This would test automatic stats updating
    });
  });
});
