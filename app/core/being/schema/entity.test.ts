import { describe, it, expect } from 'vitest';
import {
  EntitySchema,
  EntityRefSchema,
  SystemEntityTypes,
  CoreNamespaces,
  EntityStatusValues,
  createEntity,
  updateEntity,
  createEntityRef,
  formatEntityKey,
  parseEntityKey,
  isSystemEntity,
  isProtectedEntity,
  type Entity,
  type EntityRef
} from './entity';

describe('Entity Schema Components', () => {
  describe('EntityRefSchema', () => {
    it('should validate a valid entity reference', () => {
      const validRef = { entity: 'user.Person', id: '123' };
      const result = EntityRefSchema.safeParse(validRef);
      expect(result.success).toBe(true);
    });

    it('should reject invalid entity references', () => {
      const missingEntity = { id: '123' };
      const missingId = { entity: 'user.Person' };

      expect(EntityRefSchema.safeParse(missingEntity).success).toBe(false);
      expect(EntityRefSchema.safeParse(missingId).success).toBe(false);
    });
  });

  describe('EntitySchema', () => {
    it('should validate a complete entity', () => {
      const validEntity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'user.Person',
        name: 'John Doe',
        description: 'A person entity',
        properties: { age: 30, email: 'john@example.com' },
        status: 'active' as const,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = EntitySchema.safeParse(validEntity);
      expect(result.success).toBe(true);
    });

    it('should validate an entity with minimal required fields', () => {
      const minimalEntity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'user.Person',
        name: 'John Doe',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = EntitySchema.safeParse(minimalEntity);
      expect(result.success).toBe(true);

      if (result.success) {
        // Check default values
        expect(result.data.status).toBe('active');
        expect(result.data.version).toBe(1);
      }
    });

    it('should reject entities with missing required fields', () => {
      const missingType = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const missingName = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'user.Person',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(EntitySchema.safeParse(missingType).success).toBe(false);
      expect(EntitySchema.safeParse(missingName).success).toBe(false);
    });

    it('should validate entities with allowed status values', () => {
      for (const status of EntityStatusValues) {
        const entity = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          type: 'user.Person',
          name: 'John Doe',
          status,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(EntitySchema.safeParse(entity).success).toBe(true);
      }
    });

    it('should reject entities with invalid status values', () => {
      const invalidStatus = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'user.Person',
        name: 'John Doe',
        status: 'invalid-status',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(EntitySchema.safeParse(invalidStatus).success).toBe(false);
    });
  });

  describe('Constant Values', () => {
    it('should define correct CoreNamespaces', () => {
      expect(CoreNamespaces).toContain('system');
      expect(CoreNamespaces).toContain('user');
      expect(CoreNamespaces).toContain('finance');
      expect(CoreNamespaces).toContain('document');
      expect(CoreNamespaces).toContain('meta');
    });

    it('should define correct SystemEntityTypes', () => {
      expect(SystemEntityTypes).toContain('system.Entity');
      expect(SystemEntityTypes).toContain('system.EntityType');
      expect(SystemEntityTypes).toContain('system.Relation');
      expect(SystemEntityTypes).toContain('system.Context');
      expect(SystemEntityTypes).toContain('system.Registry');
    });

    it('should define correct EntityStatusValues', () => {
      expect(EntityStatusValues).toContain('active');
      expect(EntityStatusValues).toContain('archived');
      expect(EntityStatusValues).toContain('deleted');
      expect(EntityStatusValues).toContain('draft');
      expect(EntityStatusValues).toContain('template');
    });
  });
});

describe('Entity Helper Functions', () => {
  describe('createEntity', () => {
    it('should create a valid entity with minimal params', () => {
      const entity = createEntity({
        type: 'user.Person'
      });

      // Verify entity structure
      expect(entity.id).toBeDefined();
      expect(entity.type).toBe('user.Person');
      expect(entity.name).toBe(entity.id); // Default name is ID
      expect(entity.status).toBe('active');
      expect(entity.version).toBe(1);
      expect(entity.properties).toEqual({});
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);

      // Verify the entity passes schema validation
      const result = EntitySchema.safeParse(entity);
      expect(result.success).toBe(true);
    });

    it('should create a valid entity with full params', () => {
      const customId = '123e4567-e89b-12d3-a456-426614174000';
      const entity = createEntity({
        type: 'user.Person',
        id: customId,
        name: 'John Doe',
        description: 'A person entity',
        properties: { age: 30 },
        status: 'draft'
      });

      // Verify all properties were set correctly
      expect(entity.id).toBe(customId);
      expect(entity.type).toBe('user.Person');
      expect(entity.name).toBe('John Doe');
      expect(entity.description).toBe('A person entity');
      expect(entity.properties).toEqual({ age: 30 });
      expect(entity.status).toBe('draft');

      // Verify the entity passes schema validation
      const result = EntitySchema.safeParse(entity);
      expect(result.success).toBe(true);
    });
  });

  describe('updateEntity', () => {
    it('should update entity properties', () => {
      // Create initial entity
      const entity = createEntity({
        type: 'user.Person',
        name: 'John Doe',
        properties: { age: 30 }
      });

      // Original timestamp for comparison
      const originalUpdatedAt = entity.updatedAt;

      // Wait a tiny bit to ensure timestamp changes
      setTimeout(() => {
        // Update entity
        const updated = updateEntity(entity, {
          name: 'Jane Doe',
          description: 'Updated description',
          properties: { age: 31, email: 'jane@example.com' },
          status: 'archived',
          version: 2
        });

        // Verify base entity was preserved
        expect(updated.id).toBe(entity.id);
        expect(updated.type).toBe(entity.type);
        expect(updated.createdAt).toEqual(entity.createdAt);

        // Verify updates were applied
        expect(updated.name).toBe('Jane Doe');
        expect(updated.description).toBe('Updated description');
        expect(updated.properties).toEqual({ age: 31, email: 'jane@example.com' });
        expect(updated.status).toBe('archived');
        expect(updated.version).toBe(2);

        // Verify updatedAt was refreshed
        expect(updated.updatedAt).not.toEqual(originalUpdatedAt);

        // Verify the updated entity passes schema validation
        const result = EntitySchema.safeParse(updated);
        expect(result.success).toBe(true);
      }, 10);
    });

    it('should merge properties when updating', () => {
      // Create initial entity with properties
      const entity = createEntity({
        type: 'user.Person',
        properties: {
          age: 30,
          email: 'john@example.com',
          address: { city: 'New York', country: 'USA' }
        }
      });

      // Update with partial properties
      const updated = updateEntity(entity, {
        properties: {
          age: 31,
          address: { city: 'Boston' }
        }
      });

      // Verify properties were merged correctly
      expect(updated.properties).toEqual({
        age: 31,  // Updated
        email: 'john@example.com',  // Preserved
        address: { city: 'Boston' }  // Replaced (not deep merged)
      });
    });

    it('should only update specified fields', () => {
      // Create initial entity
      const entity = createEntity({
        type: 'user.Person',
        name: 'John Doe',
        description: 'Original description',
        status: 'active',
      });

      // Update only name
      const updated = updateEntity(entity, {
        name: 'Jane Doe'
      });

      // Verify only name was updated
      expect(updated.name).toBe('Jane Doe');
      expect(updated.description).toBe('Original description');
      expect(updated.status).toBe('active');
      expect(updated.version).toBe(1);
    });
  });

  describe('createEntityRef', () => {
    it('should create a valid entity reference', () => {
      const entity: Entity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'user.Person',
        name: 'John Doe',
        status: 'active',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const ref = createEntityRef(entity);

      expect(ref).toEqual({
        entity: 'user.Person',
        id: '123e4567-e89b-12d3-a456-426614174000'
      });

      // Verify the ref passes schema validation
      const result = EntityRefSchema.safeParse(ref);
      expect(result.success).toBe(true);
    });
  });

  describe('Entity Key Functions', () => {
    it('should format entity key from entity', () => {
      const entity: Entity = {
        id: '123',
        type: 'user.Person',
        name: 'John Doe',
        status: 'active',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const key = formatEntityKey(entity);
      expect(key).toBe('user.Person:123');
    });

    it('should format entity key from reference', () => {
      const ref: EntityRef = {
        entity: 'user.Person',
        id: '123'
      };

      const key = formatEntityKey(ref);
      expect(key).toBe('user.Person:123');
    });

    it('should parse entity key to reference', () => {
      const key = 'user.Person:123';
      const ref = parseEntityKey(key);

      expect(ref).toEqual({
        entity: 'user.Person',
        id: '123'
      });
    });

    it('should round-trip from entity to key to reference', () => {
      const entity: Entity = {
        id: '123',
        type: 'user.Person',
        name: 'John Doe',
        status: 'active',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const key = formatEntityKey(entity);
      const ref = parseEntityKey(key);

      expect(ref).toEqual({
        entity: 'user.Person',
        id: '123'
      });
    });
  });

  describe('Entity Type Checks', () => {
    it('should correctly identify system entities', () => {
      const systemEntity: Entity = {
        id: '123',
        type: 'system.Entity',
        name: 'Entity Type',
        status: 'active',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const userEntity: Entity = {
        id: '456',
        type: 'user.Person',
        name: 'John Doe',
        status: 'active',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(isSystemEntity(systemEntity)).toBe(true);
      expect(isSystemEntity(userEntity)).toBe(false);
    });

    it('should correctly identify protected entities', () => {
      const protectedEntity: Entity = {
        id: '123',
        type: 'system.Entity',
        name: 'Protected Entity',
        status: 'active',
        version: 1,
        properties: { protected: true },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const normalEntity: Entity = {
        id: '456',
        type: 'user.Person',
        name: 'John Doe',
        status: 'active',
        version: 1,
        properties: { protected: false },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const undefinedProtectionEntity: Entity = {
        id: '789',
        type: 'user.Person',
        name: 'Jane Doe',
        status: 'active',
        version: 1,
        properties: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(isProtectedEntity(protectedEntity)).toBe(true);
      expect(isProtectedEntity(normalEntity)).toBe(false);
      expect(isProtectedEntity(undefinedProtectionEntity)).toBe(false);
    });
  });
});

describe('Domain Logic Integration', () => {
  it('should support the full entity lifecycle', () => {
    // Create entity
    const entity = createEntity({
      type: 'user.Person',
      name: 'John Doe',
      properties: { age: 30 }
    });

    // Validate initial state
    expect(entity.status).toBe('active');
    expect(entity.version).toBe(1);

    // Archive the entity
    const archived = updateEntity(entity, { status: 'archived' });
    expect(archived.status).toBe('archived');

    // Update properties
    const updated = updateEntity(archived, {
      properties: { age: 31, lastUpdated: new Date() }
    });
    expect(updated.properties?.age).toBe(31);
    expect(updated.properties?.lastUpdated).toBeInstanceOf(Date);

    // Soft delete
    const deleted = updateEntity(updated, { status: 'deleted' });
    expect(deleted.status).toBe('deleted');

    // Verify entity reference
    const ref = createEntityRef(deleted);
    expect(ref.entity).toBe(deleted.type);
    expect(ref.id).toBe(deleted.id);
  });

  it('should support entity versioning', () => {
    // Create entity
    const v1 = createEntity({
      type: 'document.Article',
      name: 'My Article',
      properties: { content: 'Version 1 content' }
    });

    // Create version 2
    const v2 = updateEntity(v1, {
      version: 2,
      properties: { content: 'Version 2 content' }
    });

    // Create version 3
    const v3 = updateEntity(v2, {
      version: 3,
      properties: { content: 'Version 3 content' }
    });

    // Verify versions
    expect(v1.version).toBe(1);
    expect(v2.version).toBe(2);
    expect(v3.version).toBe(3);

    // Verify content progression
    expect(v1.properties?.content).toBe('Version 1 content');
    expect(v2.properties?.content).toBe('Version 2 content');
    expect(v3.properties?.content).toBe('Version 3 content');
  });

  it('should support entity templating', () => {
    // Create template entity
    const template = createEntity({
      type: 'document.Template',
      name: 'Article Template',
      status: 'template',
      properties: {
        fields: ['title', 'content', 'author'],
        defaultTitle: 'New Article'
      }
    });

    // Verify template status
    expect(template.status).toBe('template');

    // Create entity from template (in a real system, this would copy properties)
    const instance = createEntity({
      type: 'document.Article',
      name: template.properties?.defaultTitle,
      properties: {
        templateId: template.id,
        fields: [...template.properties?.fields]
      }
    });

    // Verify instance references template
    expect(instance.properties?.templateId).toBe(template.id);
    expect(instance.properties?.fields).toEqual(template.properties?.fields);
  });
});
