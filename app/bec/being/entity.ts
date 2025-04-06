import { OperationResult } from './schema/base';
import {
  Entity,
  EntityRef,
  EntitySchema,
  createEntity as createEntitySchema,
  createEntityRef,
  formatEntityKey,
  isSystemEntity,
  isProtectedEntity,
  EntityStatusValues
} from './schema/entity';
import { SystemEvent } from '../../../core/system/property';
import { BaseService } from './base';

// Define entity event type
export type EntityEvent = SystemEvent<Entity> & {
  name: 'entity:created' | 'entity:updated' | 'entity:deleted' | 'entity:status.changed';
};

/**
 * EntityService
 *
 * A service for managing entities in the system.
 * This represents the "Being" aspect of our Entity-Relation-Context triad.
 */
export class EntityService extends BaseService<Entity, EntityEvent> {
  private static instance: EntityService;

  // In-memory entity storage
  private entities: Map<string, Entity> = new Map();

  // Type-based index
  private typeIndex: Map<string, Set<string>> = new Map();

  // Property-based indices
  private propertyIndices: Map<string, Map<string, Set<string>>> = new Map();

  // Private constructor for singleton
  private constructor() {
    super();
  }

  // Get singleton instance
  public static getInstance(): EntityService {
    if (!EntityService.instance) {
      EntityService.instance = new EntityService();
    }
    return EntityService.instance;
  }

  /**
   * Create a new entity
   */
  createEntity(params: {
    type: string;
    id?: string;
    name: string;
    description?: string;
    properties?: Record<string, any>;
    status?: Entity['status'];
  }): OperationResult<Entity> {
    return this.executeOperation(
      () => {
        // Create the entity
        const entity = createEntitySchema(params);

        // Validate with schema
        const validationResult = EntitySchema.safeParse(entity);
        if (!validationResult.success) {
          throw new Error(`Entity validation failed: ${validationResult.error.message}`);
        }

        // Check if entity already exists
        const key = formatEntityKey(entity);
        if (this.entities.has(key)) {
          throw new Error(`Entity with type ${entity.type} and id ${entity.id} already exists`);
        }

        // Store validated entity
        const validatedEntity = validationResult.data;
        this.entities.set(key, validatedEntity);

        // Update indices
        this.addToIndices(validatedEntity);

        // Emit event
        this.emit('entity:created', {
          type: 'entity:created',
          name: 'entity:created',
          target: validatedEntity,
          timestamp: new Date()
        });

        return validatedEntity;
      },
      'Entity created successfully',
      'Failed to create entity'
    );
  }

  /**
   * Get an entity by type and ID
   */
  getEntity(type: string, id: string): Entity | undefined {
    const key = formatEntityKey({ entity: type, id });
    return this.entities.get(key);
  }

  /**
   * Get an entity by reference
   */
  getEntityByRef(ref: EntityRef): Entity | undefined {
    return this.getEntity(ref.entity, ref.id);
  }

  /**
   * Check if an entity exists
   */
  entityExists(type: string, id: string): boolean {
    const key = formatEntityKey({ entity: type, id });
    return this.entities.has(key);
  }

  /**
   * Create entity reference
   */
  createEntityRef(entity: Entity): EntityRef {
    return createEntityRef(entity);
  }

  /**
   * Get entities by type
   */
  getEntitiesByType(type: string): Entity[] {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];

    return Array.from(ids)
      .map(id => this.getEntity(type, id))
      .filter(Boolean) as Entity[];
  }

  /**
   * Find entities by property value
   */
  findEntitiesByProperty(
    propertyName: string,
    propertyValue: string | number | boolean
  ): Entity[] {
    const valueMap = this.propertyIndices.get(propertyName);
    if (!valueMap) return [];

    const valueStr = String(propertyValue);
    const ids = valueMap.get(valueStr);
    if (!ids) return [];

    // We need to check the types since different types can have the same property
    const results: Entity[] = [];

    for (const id of ids) {
      // Find all entities with this ID (across types)
      for (const [key, entity] of this.entities.entries()) {
        if (entity.id === id) {
          results.push(entity);
        }
      }
    }

    return results;
  }

  /**
   * Update an entity
   */
  updateEntity(
    type: string,
    id: string,
    updates: {
      name?: string;
      description?: string;
      properties?: Record<string, any>;
      status?: Entity['status'];
      version?: number;
    }
  ): OperationResult<Entity> {
    return this.executeOperation(
      () => {
        const key = formatEntityKey({ entity: type, id });
        const entity = this.entities.get(key);

        if (!entity) {
          throw new Error(`Entity with type ${type} and id ${id} not found`);
        }

        // Check if this is a protected entity
        if (isProtectedEntity(entity) && !updates.properties?.allowProtectedUpdate) {
          throw new Error(`Cannot update protected entity: ${entity.name}`);
        }

        // Remove from indices before update
        this.removeFromIndices(entity);

        // Create updated entity
        const updatedEntity: Entity = {
          ...entity,
          name: updates.name ?? entity.name,
          description: updates.description ?? entity.description,
          status: updates.status ?? entity.status,
          version: updates.version ?? entity.version,
          properties: {
            ...entity.properties,
            ...(updates.properties || {})
          },
          updatedAt: new Date()
        };

        // Validate with schema
        const validationResult = EntitySchema.safeParse(updatedEntity);
        if (!validationResult.success) {
          // Restore original entity to indices
          this.addToIndices(entity);
          throw new Error(`Entity validation failed: ${validationResult.error.message}`);
        }

        // Store validated entity
        const validatedEntity = validationResult.data;
        this.entities.set(key, validatedEntity);

        // Update indices
        this.addToIndices(validatedEntity);

        // Emit event - check if status changed
        const eventType = entity.status !== validatedEntity.status
          ? 'entity:status.changed'
          : 'entity:updated';

        this.emit(eventType, {
          type: eventType,
          name: eventType,
          target: validatedEntity,
          timestamp: new Date()
        });

        return validatedEntity;
      },
      'Entity updated successfully',
      'Failed to update entity'
    );
  }

  /**
   * Delete an entity
   */
  deleteEntity(type: string, id: string): OperationResult<boolean> {
    return this.executeOperation(
      () => {
        const key = formatEntityKey({ entity: type, id });
        const entity = this.entities.get(key);

        if (!entity) {
          throw new Error(`Entity with type ${type} and id ${id} not found`);
        }

        // Check if this is a protected entity
        if (isProtectedEntity(entity)) {
          throw new Error(`Cannot delete protected entity: ${entity.name}`);
        }

        // Check if this is a system entity
        if (isSystemEntity(entity)) {
          throw new Error(`Cannot delete system entity: ${entity.name}`);
        }

        // Remove from indices
        this.removeFromIndices(entity);

        // Remove from storage
        const result = this.entities.delete(key);

        // Emit event
        this.emit('entity:deleted', {
          type: 'entity:deleted',
          name: 'entity:deleted',
          target: entity,
          timestamp: new Date()
        });

        return result;
      },
      'Entity deleted successfully',
      'Failed to delete entity'
    );
  }

  /**
   * Change entity status
   */
  setEntityStatus(
    type: string,
    id: string,
    status: Entity['status'],
    reason?: string
  ): OperationResult<Entity> {
    return this.executeOperation(
      () => {
        const updateResult = this.updateEntity(type, id, {
          status,
          properties: {
            statusChangedAt: new Date(),
            statusChangeReason: reason || `Status changed to ${status}`
          }
        });

        if (updateResult.status === 'error') {
          throw new Error(updateResult.message);
        }

        return updateResult.data!;
      },
      `Entity status changed to ${status} successfully`,
      'Failed to change entity status'
    );
  }

  /**
   * Archives an entity
   */
  archiveEntity(type: string, id: string, reason?: string): OperationResult<Entity> {
    return this.setEntityStatus(type, id, 'archived', reason || 'Entity archived');
  }

  /**
   * Soft-deletes an entity
   */
  softDeleteEntity(type: string, id: string, reason?: string): OperationResult<Entity> {
    return this.setEntityStatus(type, id, 'deleted', reason || 'Entity deleted');
  }

  /**
   * Reactivates an entity
   */
  reactivateEntity(type: string, id: string, reason?: string): OperationResult<Entity> {
    return this.setEntityStatus(type, id, 'active', reason || 'Entity reactivated');
  }

  /**
   * Get all entities
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get all entity types
   */
  getAllEntityTypes(): string[] {
    return Array.from(this.typeIndex.keys());
  }

  /**
   * Count entities
   */
  countEntities(): number {
    return this.entities.size;
  }

  /**
   * Count entities by type
   */
  countEntitiesByType(type: string): number {
    return this.typeIndex.get(type)?.size || 0;
  }

  /**
   * Query entities with filtering
   */
  queryEntities(filters: {
    types?: string[];
    propertyFilters?: Record<string, any>;
    textSearch?: string;
    status?: Entity['status'];
    limit?: number;
    offset?: number;
  }): Entity[] {
    // Start with all entities or filter by type if specified
    let candidates: Entity[] = [];

    if (filters.types && filters.types.length > 0) {
      // Get entities of the specified types
      for (const type of filters.types) {
        candidates.push(...this.getEntitiesByType(type));
      }
    } else {
      // Use all entities
      candidates = this.getAllEntities();
    }

    // Apply additional filters
    let results = candidates;

    // Filter by status
    if (filters.status) {
      results = results.filter(entity => entity.status === filters.status);
    }

    // Filter by property values using the utility function
    if (filters.propertyFilters) {
      results = this.filterByProperties(
        results,
        filters.propertyFilters,
        (entity) => entity.properties || {}
      );
    }

    // Text search in name or description
    if (filters.textSearch) {
      const searchLower = filters.textSearch.toLowerCase();
      results = results.filter(entity =>
        entity.name.toLowerCase().includes(searchLower) ||
        (entity.description && entity.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply pagination if specified
    if (filters.offset !== undefined || filters.limit !== undefined) {
      const offset = filters.offset || 0;
      const limit = filters.limit || results.length;
      results = results.slice(offset, offset + limit);
    }

    return results;
  }

  /**
   * Add entity to indices
   */
  private addToIndices(entity: Entity): void {
    // Add to type index
    if (!this.typeIndex.has(entity.type)) {
      this.typeIndex.set(entity.type, new Set());
    }
    this.typeIndex.get(entity.type)!.add(entity.id);

    // Add to property indices
    if (entity.properties) {
      for (const [key, value] of Object.entries(entity.properties)) {
        // Skip non-indexable properties
        if (value === null || value === undefined) continue;
        if (typeof value === 'object') continue;

        // Create property index if it doesn't exist
        if (!this.propertyIndices.has(key)) {
          this.propertyIndices.set(key, new Map());
        }

        const valueMap = this.propertyIndices.get(key)!;
        const valueStr = String(value);

        // Create set for this value if it doesn't exist
        if (!valueMap.has(valueStr)) {
          valueMap.set(valueStr, new Set());
        }

        // Add entity ID to the value set
        valueMap.get(valueStr)!.add(entity.id);
      }
    }
  }

  /**
   * Remove entity from indices
   */
  private removeFromIndices(entity: Entity): void {
    // Remove from type index
    this.typeIndex.get(entity.type)?.delete(entity.id);
    if (this.typeIndex.get(entity.type)?.size === 0) {
      this.typeIndex.delete(entity.type);
    }

    // Remove from property indices
    if (entity.properties) {
      for (const [key, value] of Object.entries(entity.properties)) {
        // Skip non-indexable properties
        if (value === null || value === undefined) continue;
        if (typeof value === 'object') continue;

        const valueMap = this.propertyIndices.get(key);
        if (!valueMap) continue;

        const valueStr = String(value);
        valueMap.get(valueStr)?.delete(entity.id);

        if (valueMap.get(valueStr)?.size === 0) {
          valueMap.delete(valueStr);
        }

        if (valueMap.size === 0) {
          this.propertyIndices.delete(key);
        }
      }
    }
  }
}

// Export singleton instance
export const entityService = EntityService.getInstance();

// Export types for use with entity service
export type { Entity, EntityRef, EntityEvent };
export { EntityStatusValues };
