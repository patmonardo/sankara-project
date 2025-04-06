//@/core/being/relation.ts
import { OperationResult } from './schema/base';
import {
  Relation,
  EntityRef,
  createRelation,
  formatEntityKey,
  RelationSchema,
  isRelationActiveAt
} from "./schema/relation";
import { entityService } from "./entity";
import { SystemEvent } from '../../../core/system/property';
import { BaseService } from './base';

// Define relation event type
export type RelationEvent = SystemEvent<Relation> & {
  name: 'relation:created' | 'relation:updated' | 'relation:deleted' | 'relation:invalidated';
};

/**
 * RelationService
 *
 * A specialized service for managing relations between entities.
 * This represents the "Essence" aspect of our Entity-Relation-Context triad.
 * It's one of the three core services that implement the "Membership Protocol"
 * under the Registry idea.
 */
export class RelationService extends BaseService<Relation, RelationEvent> {
  private static instance: RelationService;

  // In-memory relation storage
  private relations: Map<string, Relation> = new Map();

  // Indices for efficient lookups
  private sourceIndex: Map<string, Set<string>> = new Map();
  private targetIndex: Map<string, Set<string>> = new Map();
  private typeIndex: Map<string, Set<string>> = new Map();
  private validIndex: Map<string, Set<string>> = new Map(); // For time-based queries

  // Private constructor for singleton
  private constructor() {
    super();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): RelationService {
    if (!RelationService.instance) {
      RelationService.instance = new RelationService();
    }
    return RelationService.instance;
  }

  /**
   * Add a relation to indices
   */
  private addToIndices(relation: Relation): void {
    const sourceKey = formatEntityKey(relation.source);
    const targetKey = formatEntityKey(relation.target);

    // Add to source index
    if (!this.sourceIndex.has(sourceKey)) {
      this.sourceIndex.set(sourceKey, new Set());
    }
    this.sourceIndex.get(sourceKey)!.add(relation.id);

    // Add to target index
    if (!this.targetIndex.has(targetKey)) {
      this.targetIndex.set(targetKey, new Set());
    }
    this.targetIndex.get(targetKey)!.add(relation.id);

    // Add to type index
    if (!this.typeIndex.has(relation.type)) {
      this.typeIndex.set(relation.type, new Set());
    }
    this.typeIndex.get(relation.type)!.add(relation.id);

    // Add to valid index
    const validKey = relation.valid ? "valid" : "invalid";
    if (!this.validIndex.has(validKey)) {
      this.validIndex.set(validKey, new Set());
    }
    this.validIndex.get(validKey)!.add(relation.id);
  }

  /**
   * Remove relation from indices
   */
  private removeFromIndices(relation: Relation): void {
    const sourceKey = formatEntityKey(relation.source);
    const targetKey = formatEntityKey(relation.target);

    // Remove from source index
    this.sourceIndex.get(sourceKey)?.delete(relation.id);
    if (this.sourceIndex.get(sourceKey)?.size === 0) {
      this.sourceIndex.delete(sourceKey);
    }

    // Remove from target index
    this.targetIndex.get(targetKey)?.delete(relation.id);
    if (this.targetIndex.get(targetKey)?.size === 0) {
      this.targetIndex.delete(targetKey);
    }

    // Remove from type index
    this.typeIndex.get(relation.type)?.delete(relation.id);
    if (this.typeIndex.get(relation.type)?.size === 0) {
      this.typeIndex.delete(relation.type);
    }

    // Remove from valid index
    const validKey = relation.valid ? "valid" : "invalid";
    this.validIndex.get(validKey)?.delete(relation.id);
    if (this.validIndex.get(validKey)?.size === 0) {
      this.validIndex.delete(validKey);
    }
  }

  /**
   * Create a relation between entities
   */
  createRelation(params: {
    source: EntityRef;
    target: EntityRef;
    type: string;
    direction?: "directed" | "bidirectional";
    properties?: Record<string, any>;
    validFrom?: Date;
    validTo?: Date;
    strength?: number;
  }): OperationResult<Relation> {
    return this.executeOperation(
      () => {
        // Check if entities exist
        if (!entityService.entityExists(params.source.entity, params.source.id)) {
          const sourceResult = entityService.createEntity({
            type: params.source.entity,
            id: params.source.id,
            name: `${params.source.entity} ${params.source.id}`,
          });

          if (sourceResult.status === 'error') {
            throw new Error(`Failed to create source entity: ${sourceResult.message}`);
          }
        }

        if (!entityService.entityExists(params.target.entity, params.target.id)) {
          const targetResult = entityService.createEntity({
            type: params.target.entity,
            id: params.target.id,
            name: `${params.target.entity} ${params.target.id}`,
          });

          if (targetResult.status === 'error') {
            throw new Error(`Failed to create target entity: ${targetResult.message}`);
          }
        }

        // Create the relation
        const relation = createRelation(params);

        // Validate with schema
        const validationResult = RelationSchema.safeParse(relation);
        if (!validationResult.success) {
          throw new Error(`Relation validation failed: ${validationResult.error.message}`);
        }

        // Store the relation
        this.relations.set(relation.id, relation);

        // Update indices
        this.addToIndices(relation);

        // Emit creation event
        this.emit('relation:created', {
          type: 'relation:created',
          name: 'relation:created',
          target: relation,
          timestamp: new Date()
        });

        return relation;
      },
      'Relation created successfully',
      'Failed to create relation'
    );
  }

  /**
   * Create a bidirectional relation between entities
   */
  createBidirectionalRelation(params: {
    source: EntityRef;
    target: EntityRef;
    type: string;
    properties?: Record<string, any>;
    validFrom?: Date;
    validTo?: Date;
    strength?: number;
  }): OperationResult<Relation> {
    return this.createRelation({
      ...params,
      direction: "bidirectional",
    });
  }

  /**
   * Get a relation by ID
   */
  getRelation(id: string): Relation | undefined {
    return this.relations.get(id);
  }

  /**
   * Get multiple relations by IDs
   */
  getRelations(ids: string[]): Relation[] {
    const result: Relation[] = [];
    for (const id of ids) {
      const relation = this.getRelation(id);
      if (relation) {
        result.push(relation);
      }
    }
    return result;
  }

  /**
   * Find relations by source entity
   */
  findRelationsBySource(entityRef: EntityRef, activeOnly: boolean = true): Relation[] {
    const key = formatEntityKey(entityRef);
    const relationIds = this.sourceIndex.get(key);

    if (!relationIds) return [];

    // Get relations
    let relations = Array.from(relationIds)
      .map((id) => this.relations.get(id)!)
      .filter((relation) => relation.valid);

    // Filter by activity if needed
    if (activeOnly) {
      relations = relations.filter(rel => isRelationActiveAt(rel));
    }

    // Also include valid bidirectional relations where this entity is the target
    const targetIds = this.targetIndex.get(key);
    if (targetIds) {
      const bidirectionalRelations = Array.from(targetIds)
        .map((id) => this.relations.get(id)!)
        .filter(
          (relation) => relation.valid && relation.direction === "bidirectional"
        );

      // Filter by activity if needed
      const activeBidirectional = activeOnly
        ? bidirectionalRelations.filter(rel => isRelationActiveAt(rel))
        : bidirectionalRelations;

      relations.push(...activeBidirectional);
    }

    return relations;
  }

  /**
   * Find relations by target entity
   */
  findRelationsByTarget(entityRef: EntityRef, activeOnly: boolean = true): Relation[] {
    const key = formatEntityKey(entityRef);
    const relationIds = this.targetIndex.get(key);

    if (!relationIds) return [];

    // Get relations
    let relations = Array.from(relationIds)
      .map((id) => this.relations.get(id)!)
      .filter((relation) => relation.valid);

    // Filter by activity if needed
    if (activeOnly) {
      relations = relations.filter(rel => isRelationActiveAt(rel));
    }

    // Also include valid bidirectional relations where this entity is the source
    const sourceIds = this.sourceIndex.get(key);
    if (sourceIds) {
      const bidirectionalRelations = Array.from(sourceIds)
        .map((id) => this.relations.get(id)!)
        .filter(
          (relation) => relation.valid && relation.direction === "bidirectional"
        );

      // Filter by activity if needed
      const activeBidirectional = activeOnly
        ? bidirectionalRelations.filter(rel => isRelationActiveAt(rel))
        : bidirectionalRelations;

      relations.push(...activeBidirectional);
    }

    return relations;
  }

  /**
   * Find all relations involving an entity (as source or target)
   */
  findRelationsByEntity(entityRef: EntityRef, activeOnly: boolean = true): Relation[] {
    const key = formatEntityKey(entityRef);

    // Get all relations where entity is source or target
    const sourceIds = this.sourceIndex.get(key) || new Set();
    const targetIds = this.targetIndex.get(key) || new Set();

    // Combine into a unique set
    const allIds = new Set<string>([...sourceIds, ...targetIds]);

    // Convert to relations
    let relations = Array.from(allIds)
      .map((id) => this.relations.get(id)!)
      .filter((relation) => relation.valid);

    // Filter by activity if needed
    if (activeOnly) {
      relations = relations.filter(rel => isRelationActiveAt(rel));
    }

    return relations;
  }

  /**
   * Find relations by type
   */
  findRelationsByType(type: string, activeOnly: boolean = true, limit?: number): Relation[] {
    const relationIds = this.typeIndex.get(type);

    if (!relationIds) return [];

    // Get valid relations
    let relations = Array.from(relationIds)
      .map((id) => this.relations.get(id)!)
      .filter((relation) => relation.valid);

    // Filter by activity if needed
    if (activeOnly) {
      relations = relations.filter(rel => isRelationActiveAt(rel));
    }

    // Apply limit if specified
    if (limit !== undefined) {
      return relations.slice(0, limit);
    }

    return relations;
  }

  /**
   * Find relations by source and type
   */
  findRelationsBySourceAndType(entityRef: EntityRef, type: string, activeOnly: boolean = true): Relation[] {
    const sourceRelations = this.findRelationsBySource(entityRef, activeOnly);
    return sourceRelations.filter((relation) => relation.type === type);
  }

  /**
   * Find relations by target and type
   */
  findRelationsByTargetAndType(entityRef: EntityRef, type: string, activeOnly: boolean = true): Relation[] {
    const targetRelations = this.findRelationsByTarget(entityRef, activeOnly);
    return targetRelations.filter((relation) => relation.type === type);
  }

  /**
   * Find related entities
   */
  findRelatedEntities(
    entityRef: EntityRef,
    options: {
      relationType?: string;
      direction?: "outgoing" | "incoming" | "both";
      depth?: number;
      includeProperties?: boolean;
      activeOnly?: boolean;
    } = {}
  ): Array<EntityRef & { relationProperties?: Record<string, any> }> {
    const direction = options.direction || "both";
    const depth = options.depth || 1;
    const includeProperties = options.includeProperties || false;
    const activeOnly = options.activeOnly ?? true;

    const visited = new Set<string>();
    const result: Array<
      EntityRef & { relationProperties?: Record<string, any> }
    > = [];

    // Format entity key for tracking visited nodes
    const formatKey = (ref: EntityRef): string => `${ref.entity}:${ref.id}`;

    // Mark entity as visited
    visited.add(formatKey(entityRef));

    // Recursive traversal function
    const traverse = (current: EntityRef, currentDepth: number) => {
      if (currentDepth > depth) return;

      // Find relations based on direction
      let relations: Relation[] = [];

      if (direction === "outgoing" || direction === "both") {
        relations = relations.concat(this.findRelationsBySource(current, activeOnly));
      }

      if (direction === "incoming" || direction === "both") {
        relations = relations.concat(this.findRelationsByTarget(current, activeOnly));
      }

      // Filter by relation type if specified
      if (options.relationType) {
        relations = relations.filter((r) => r.type === options.relationType);
      }

      // Process relations
      for (const relation of relations) {
        // Determine the related entity
        const related =
          relation.source.entity === current.entity &&
          relation.source.id === current.id
            ? relation.target
            : relation.source;

        const relatedKey = formatKey(related);

        // Skip if already visited
        if (visited.has(relatedKey)) continue;

        // Add to results and mark as visited
        const resultEntity: EntityRef & {
          relationProperties?: Record<string, any>;
        } = {
          entity: related.entity,
          id: related.id,
        };

        // Include relation properties if requested
        if (includeProperties) {
          resultEntity.relationProperties = relation.properties;
        }

        result.push(resultEntity);
        visited.add(relatedKey);

        // Continue traversal
        traverse(related, currentDepth + 1);
      }
    };

    // Start traversal
    traverse(entityRef, 1);

    return result;
  }

  /**
   * Find direct relation between two entities
   */
  findDirectRelation(
    sourceRef: EntityRef,
    targetRef: EntityRef,
    type?: string,
    activeOnly: boolean = true
  ): Relation | undefined {
    const sourceKey = formatEntityKey(sourceRef);
    const relationIds = this.sourceIndex.get(sourceKey);

    if (!relationIds) return undefined;

    // Find a relation that matches the target and optionally the type
    for (const id of relationIds) {
      const relation = this.relations.get(id)!;

      const targetMatches =
        relation.target.entity === targetRef.entity &&
        relation.target.id === targetRef.id;

      const typeMatches = type ? relation.type === type : true;
      const validMatches = relation.valid;

      // Check if relation is active (if required)
      const activeMatches = !activeOnly || isRelationActiveAt(relation);

      if (targetMatches && typeMatches && validMatches && activeMatches) {
        return relation;
      }
    }

    // Check for bidirectional relation in the other direction
    const targetKey = formatEntityKey(targetRef);
    const reverseIds = this.sourceIndex.get(targetKey);

    if (!reverseIds) return undefined;

    for (const id of reverseIds) {
      const relation = this.relations.get(id)!;

      const sourceMatches =
        relation.target.entity === sourceRef.entity &&
        relation.target.id === sourceRef.id;

      const typeMatches = type ? relation.type === type : true;
      const directionMatches = relation.direction === "bidirectional";
      const validMatches = relation.valid;

      // Check if relation is active (if required)
      const activeMatches = !activeOnly || isRelationActiveAt(relation);

      if (sourceMatches && typeMatches && directionMatches && validMatches && activeMatches) {
        return relation;
      }
    }

    return undefined;
  }

  /**
   * Update a relation
   */
  updateRelation(
    id: string,
    updates: {
      properties?: Record<string, any>;
      type?: string;
      direction?: "directed" | "bidirectional";
      valid?: boolean;
      validTo?: Date;
      validFrom?: Date;
      strength?: number;
    }
  ): OperationResult<Relation> {
    return this.executeOperation(
      () => {
        const relation = this.relations.get(id);

        if (!relation) {
          throw new Error(`Relation with id ${id} not found`);
        }

        // If type or direction changed, need to update indices
        const typeChanged = updates.type && updates.type !== relation.type;
        const directionChanged =
          updates.direction && updates.direction !== relation.direction;
        const validityChanged =
          updates.valid !== undefined && updates.valid !== relation.valid;

        if (typeChanged || directionChanged || validityChanged) {
          // Remove from old indices
          this.removeFromIndices(relation);
        }

        // Create updated relation
        const now = new Date();
        const updatedRelation: Relation = {
          ...relation,
          ...updates,
          properties: {
            ...relation.properties,
            ...(updates.properties || {})
          },
          updatedAt: now,
        };

        // Validate with schema
        const validationResult = RelationSchema.safeParse(updatedRelation);
        if (!validationResult.success) {
          // If we removed from indices, add back the original
          if (typeChanged || directionChanged || validityChanged) {
            this.addToIndices(relation);
          }
          throw new Error(`Relation validation failed: ${validationResult.error.message}`);
        }

        // Store updated relation
        const validatedRelation = validationResult.data;
        this.relations.set(id, validatedRelation);

        // If needed, update indices
        if (typeChanged || directionChanged || validityChanged) {
          this.addToIndices(validatedRelation);
        }

        // Emit event
        this.emit('relation:updated', {
          type: 'relation:updated',
          name: 'relation:updated',
          target: validatedRelation,
          timestamp: now
        });

        return validatedRelation;
      },
      'Relation updated successfully',
      'Failed to update relation'
    );
  }

  /**
   * Delete a relation
   */
  deleteRelation(id: string): OperationResult<boolean> {
    return this.executeOperation(
      () => {
        const relation = this.relations.get(id);

        if (!relation) {
          throw new Error(`Relation with id ${id} not found`);
        }

        // Remove from indices
        this.removeFromIndices(relation);

        // Remove from storage
        const result = this.relations.delete(id);

        // Emit event
        this.emit('relation:deleted', {
          type: 'relation:deleted',
          name: 'relation:deleted',
          target: relation,
          timestamp: new Date()
        });

        return result;
      },
      'Relation deleted successfully',
      'Failed to delete relation'
    );
  }

  /**
   * Mark a relation as invalid instead of deleting it
   */
  invalidateRelation(id: string, reason?: string): OperationResult<Relation> {
    return this.executeOperation(
      () => {
        const relation = this.relations.get(id);

        if (!relation) {
          throw new Error(`Relation with id ${id} not found`);
        }

        // Update the relation
        const updateResult = this.updateRelation(id, {
          valid: false,
          properties: {
            invalidatedAt: new Date(),
            invalidationReason: reason || "manually invalidated",
          },
        });

        if (updateResult.status === 'error') {
          throw new Error(updateResult.message);
        }

        const invalidated = updateResult.data!;

        // Emit specific invalidation event
        this.emit('relation:invalidated', {
          type: 'relation:invalidated',
          name: 'relation:invalidated',
          target: invalidated,
          timestamp: new Date()
        });

        return invalidated;
      },
      'Relation invalidated successfully',
      'Failed to invalidate relation'
    );
  }

  /**
   * Get all relations
   */
  getAllRelations(): Relation[] {
    return Array.from(this.relations.values());
  }

  /**
   * Get all valid relations
   */
  getAllValidRelations(activeOnly: boolean = true): Relation[] {
    const validIds = this.validIndex.get("valid");
    if (!validIds) return [];

    let relations = Array.from(validIds)
      .map((id) => this.relations.get(id)!)
      .filter((relation) => relation !== undefined);

    // Filter by activity if needed
    if (activeOnly) {
      relations = relations.filter(rel => isRelationActiveAt(rel));
    }

    return relations;
  }

  /**
   * Get all relation types
   */
  getAllRelationTypes(): string[] {
    return Array.from(this.typeIndex.keys());
  }

  /**
   * Count relations
   */
  countRelations(): number {
    return this.relations.size;
  }

  /**
   * Count relations by type
   */
  countRelationsByType(type: string): number {
    return this.typeIndex.get(type)?.size || 0;
  }

  /**
   * Count relations by entity
   */
  countRelationsByEntity(entityRef: EntityRef, activeOnly: boolean = true): number {
    const allRelations = this.findRelationsByEntity(entityRef, activeOnly);
    return allRelations.length;
  }

  /**
   * Checks if specific relation exists between entities
   */
  relationExists(
    sourceRef: EntityRef,
    targetRef: EntityRef,
    type?: string,
    activeOnly: boolean = true
  ): boolean {
    return this.findDirectRelation(sourceRef, targetRef, type, activeOnly) !== undefined;
  }

  /**
   * Advanced querying of relations with filtering
   */
  queryRelations(filters: {
    types?: string[];
    sourceEntity?: EntityRef;
    targetEntity?: EntityRef;
    validOnly?: boolean;
    activeAt?: Date;
    minStrength?: number;
    propertyFilters?: Record<string, any>;
    limit?: number;
    offset?: number;
  }): Relation[] {
    // Start with all relations or a subset if we have source/target/type filters
    let candidates: Relation[] = [];

    if (filters.sourceEntity) {
      // Start with source-based relations
      candidates = this.findRelationsBySource(filters.sourceEntity, false);

      // Further filter by target if specified
      if (filters.targetEntity) {
        candidates = candidates.filter(
          (rel) =>
            rel.target.entity === filters.targetEntity!.entity &&
            rel.target.id === filters.targetEntity!.id
        );
      }
    } else if (filters.targetEntity) {
      // Start with target-based relations
      candidates = this.findRelationsByTarget(filters.targetEntity, false);
    } else if (filters.types && filters.types.length === 1) {
      // If exactly one type, use the type index
      candidates = this.findRelationsByType(filters.types[0], false);
    } else {
      // Otherwise, start with all relations
      candidates = this.getAllRelations();
    }

    // Apply additional filters
    let results = candidates;

    // Filter by types if needed
    if (filters.types && filters.types.length > 0) {
      results = results.filter((rel) => filters.types!.includes(rel.type));
    }

    // Filter by validity
    if (filters.validOnly !== false) { // Default to true
      results = results.filter((rel) => rel.valid);
    }

    // Filter by active at a specific time
    if (filters.activeAt) {
      results = results.filter(rel => isRelationActiveAt(rel, filters.activeAt));
    }

    // Filter by minimum strength
    if (filters.minStrength !== undefined) {
      results = results.filter(
        (rel) =>
          rel.strength !== undefined && rel.strength >= filters.minStrength!
      );
    }

    // Filter by property values using the BaseService filterByProperties method
    if (filters.propertyFilters) {
      results = this.filterByProperties(
        results,
        filters.propertyFilters,
        (relation) => relation.properties || {}
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
   * For testing purposes only: Clear all relations
   */
  clearAllRelations(): void {
    this.relations.clear();
    this.sourceIndex.clear();
    this.targetIndex.clear();
    this.typeIndex.clear();
    this.validIndex.clear();
  }
}

// Export singleton instance
export const relationService = RelationService.getInstance();

// Export types for use with relation service
export type { Relation, EntityRef, RelationEvent };
