//@/core/being/context.ts
import { v4 as uuidv4 } from 'uuid';
import { OperationResult } from './schema/base';
import {
  Context,
  createContext as createContextSchema,
  addEntitiesToContext as addEntities,
  addRelationsToContext as addRelations,
  ContextSchema,
  isContextActiveAt,
  calculateDensity
} from './schema/context';
import { Graph, createGraph } from '@/core/system/graph';
import { EntityRef } from './schema/entity';
import { Relation } from './schema/relation';
import { relationService } from './relation';
import { entityService } from './entity';
import { SystemEvent } from '../../../core/system/property';
import { BaseService } from './base';

// Define context event type for the event system
export type ContextEvent = SystemEvent<Context> & {
  name: 'context:created' | 'context:updated' | 'context:deleted' | 'context:invalidated' |
        'context:entities.added' | 'context:entities.removed' |
        'context:relations.added' | 'context:relations.removed' |
        'context:operation.executed';
};

/**
 * ContextService - Specialized Service for Context Management
 *
 * In Hegelian terms, this service represents the "Concept" aspect of our
 * Entity-Relation-Context triad. It embodies the syllogistic movement where
 * individual entities (Universal) connect through relations (Particular)
 * to form meaningful contexts (Individual).
 *
 * Following Hegel's Logic:
 * 1. Entity - Being (immediate existence)
 * 2. Relation - Essence (mediated existence)
 * 3. Context - Concept (concrete existence)
 */
export class ContextService extends BaseService<Context, ContextEvent> {
  private static instance: ContextService;

  // Storage for contexts (the repository of concrete universals)
  private contexts: Map<string, Context> = new Map();

  // Indices for efficient lookups (the system of reflection)
  private contextTypes: Map<string, Set<string>> = new Map();  // Type -> Context IDs
  private entityContexts: Map<string, Set<string>> = new Map(); // Entity Key -> Context IDs
  private relationContexts: Map<string, Set<string>> = new Map(); // Relation ID -> Context IDs
  private validIndex: Map<string, Set<string>> = new Map(); // Valid/Invalid -> Context IDs
  private domainIndex: Map<string, Set<string>> = new Map(); // Domain -> Context IDs
  private scopeIndex: Map<string, Set<string>> = new Map(); // Scope -> Context IDs

  // Private constructor for singleton pattern
  private constructor() {
    super();
    // Initialize with a global system context - the primordial unity
    this.createSystemContext();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ContextService {
    if (!ContextService.instance) {
      ContextService.instance = new ContextService();
    }
    return ContextService.instance;
  }

  /**
   * Initialize system context - the foundational context
   */
  private createSystemContext(): Context {
    const systemContext = createContextSchema({
      name: 'System',
      type: 'system',
      description: 'Global system context',
      //scope: 'global',
      properties: {
        system: true,
        protected: true
      }
    });

    this.contexts.set(systemContext.id, systemContext);
    this.addToTypeIndex(systemContext);
    this.addToValidityIndex(systemContext);
    this.addToScopeIndex(systemContext);

    return systemContext;
  }

  /**
   * Add context to type index
   */
  private addToTypeIndex(context: Context): void {
    if (!this.contextTypes.has(context.type)) {
      this.contextTypes.set(context.type, new Set());
    }
    this.contextTypes.get(context.type)!.add(context.id);
  }

  /**
   * Remove context from type index
   */
  private removeFromTypeIndex(context: Context): void {
    this.contextTypes.get(context.type)?.delete(context.id);
    if (this.contextTypes.get(context.type)?.size === 0) {
      this.contextTypes.delete(context.type);
    }
  }

  /**
   * Add context to validity index
   */
  private addToValidityIndex(context: Context): void {
    const validKey = context.valid ? "valid" : "invalid";
    if (!this.validIndex.has(validKey)) {
      this.validIndex.set(validKey, new Set());
    }
    this.validIndex.get(validKey)!.add(context.id);
  }

  /**
   * Remove context from validity index
   */
  private removeFromValidityIndex(context: Context): void {
    const validKey = context.valid ? "valid" : "invalid";
    this.validIndex.get(validKey)?.delete(context.id);
    if (this.validIndex.get(validKey)?.size === 0) {
      this.validIndex.delete(validKey);
    }
  }

  /**
   * Add context to scope index
   */
  private addToScopeIndex(context: Context): void {
    if (!this.scopeIndex.has(context.scope)) {
      this.scopeIndex.set(context.scope, new Set());
    }
    this.scopeIndex.get(context.scope)!.add(context.id);

    // Also add to domain index if applicable
    if (context.domain) {
      if (!this.domainIndex.has(context.domain)) {
        this.domainIndex.set(context.domain, new Set());
      }
      this.domainIndex.get(context.domain)!.add(context.id);
    }
  }

  /**
   * Remove context from scope index
   */
  private removeFromScopeIndex(context: Context): void {
    this.scopeIndex.get(context.scope)?.delete(context.id);
    if (this.scopeIndex.get(context.scope)?.size === 0) {
      this.scopeIndex.delete(context.scope);
    }

    // Also remove from domain index if applicable
    if (context.domain) {
      this.domainIndex.get(context.domain)?.delete(context.id);
      if (this.domainIndex.get(context.domain)?.size === 0) {
        this.domainIndex.delete(context.domain);
      }
    }
  }

  /**
   * Update entity-context index
   */
  private updateEntityContextIndex(contextId: string, entityRefs: EntityRef[]): void {
    for (const ref of entityRefs) {
      const entityKey = `${ref.entity}:${ref.id}`;

      if (!this.entityContexts.has(entityKey)) {
        this.entityContexts.set(entityKey, new Set());
      }

      this.entityContexts.get(entityKey)!.add(contextId);
    }
  }

  /**
   * Remove from entity-context index
   */
  private removeFromEntityContextIndex(contextId: string, entityRefs: EntityRef[]): void {
    for (const ref of entityRefs) {
      const entityKey = `${ref.entity}:${ref.id}`;
      this.entityContexts.get(entityKey)?.delete(contextId);

      if (this.entityContexts.get(entityKey)?.size === 0) {
        this.entityContexts.delete(entityKey);
      }
    }
  }

  /**
   * Update relation-context index
   */
  private updateRelationContextIndex(contextId: string, relationIds: string[]): void {
    for (const relationId of relationIds) {
      if (!this.relationContexts.has(relationId)) {
        this.relationContexts.set(relationId, new Set());
      }

      this.relationContexts.get(relationId)!.add(contextId);
    }
  }

  /**
   * Remove from relation-context index
   */
  private removeFromRelationContextIndex(contextId: string, relationIds: string[]): void {
    for (const relationId of relationIds) {
      this.relationContexts.get(relationId)?.delete(contextId);

      if (this.relationContexts.get(relationId)?.size === 0) {
        this.relationContexts.delete(relationId);
      }
    }
  }

  /**
   * Create a context - the generative moment of conceptualization
   */
  createContext(params: {
    name: string;
    type: string;
    description?: string;
    scope?: 'global' | 'domain' | 'local';
    domain?: string;
    properties?: Record<string, any>;
    entities?: EntityRef[];
    relations?: string[];
    validFrom?: Date;
    validTo?: Date;
    valid?: boolean;
  }): OperationResult<Context> {
    try {
      // Create context schema
      const context = createContextSchema({
        name: params.name,
        type: params.type,
        description: params.description,
        scope: params.scope,
        domain: params.domain,
        properties: params.properties,
        entities: params.entities || [],
        relations: params.relations || [],
        validFrom: params.validFrom,
        validTo: params.validTo,
        valid: params.valid
      });

      // Store context
      this.contexts.set(context.id, context);

      // Update indices
      this.addToTypeIndex(context);
      this.addToValidityIndex(context);
      this.addToScopeIndex(context);

      if (context.entities.length > 0) {
        this.updateEntityContextIndex(context.id, context.entities);
      }

      if (context.relations.length > 0) {
        this.updateRelationContextIndex(context.id, context.relations);
      }

      // Emit creation event
      this.emit({
        name: 'context:created',
        type: 'context:created',
        target: context,
        timestamp: new Date()
      });

      return this.createSuccessResult(context, `Context '${context.name}' created successfully`);
    } catch (error) {
      return this.createErrorResult(`Failed to create context: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a context by ID - the moment of determination
   */
  getContext(id: string): Context | undefined {
    return this.contexts.get(id);
  }

  /**
   * Update a context - the moment of becoming
   */
  updateContext(id: string, updates: {
    name?: string;
    description?: string;
    properties?: Record<string, any>;
    valid?: boolean;
    validFrom?: Date;
    validTo?: Date;
    scope?: 'global' | 'domain' | 'local';
    domain?: string;
  }): OperationResult<Context> {
    const context = this.contexts.get(id);
    if (!context) {
      return this.createErrorResult(`Context with ID ${id} not found`);
    }

    try {
      // Check if this is a protected system context
      if (context.properties?.protected) {
        return this.createErrorResult(`Cannot update protected system context: ${context.name}`);
      }

      // Create updated context
      const updatedContext: Context = {
        ...context,
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        ...(updates.valid !== undefined ? { valid: updates.valid } : {}),
        ...(updates.validFrom !== undefined ? { validFrom: updates.validFrom } : {}),
        ...(updates.validTo !== undefined ? { validTo: updates.validTo } : {}),
        ...(updates.scope !== undefined ? { scope: updates.scope } : {}),
        ...(updates.domain !== undefined ? { domain: updates.domain } : {}),
        properties: {
          ...context.properties,
          ...(updates.properties || {})
        },
        updatedAt: new Date()
      };

      // Update storage
      this.contexts.set(id, updatedContext);

      // Update indices if needed
      if (updates.valid !== undefined && context.valid !== updates.valid) {
        this.removeFromValidityIndex(context);
        this.addToValidityIndex(updatedContext);
      }

      if (updates.scope !== undefined && context.scope !== updates.scope) {
        this.removeFromScopeIndex(context);
        this.addToScopeIndex(updatedContext);
      } else if (updates.domain !== undefined && context.domain !== updates.domain) {
        this.removeFromScopeIndex(context);
        this.addToScopeIndex(updatedContext);
      }

      // Emit update event
      this.emit({
        name: 'context:updated',
        type: 'context:updated',
        target: updatedContext,
        data: { previous: context },
        timestamp: new Date()
      });

      return this.createSuccessResult(updatedContext, `Context '${updatedContext.name}' updated successfully`);
    } catch (error) {
      return this.createErrorResult(`Failed to update context: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a context - the moment of negation
   */
  deleteContext(id: string): OperationResult<Context> {
    const context = this.contexts.get(id);
    if (!context) {
      return this.createErrorResult(`Context with ID ${id} not found`);
    }

    // Check if this is a protected system context
    if (context.properties?.protected) {
      return this.createErrorResult(`Cannot delete protected system context: ${context.name}`);
    }

    try {
      // Remove from storage
      this.contexts.delete(id);

      // Remove from indices
      this.removeFromTypeIndex(context);
      this.removeFromValidityIndex(context);
      this.removeFromScopeIndex(context);

      if (context.entities.length > 0) {
        this.removeFromEntityContextIndex(id, context.entities);
      }

      if (context.relations.length > 0) {
        this.removeFromRelationContextIndex(id, context.relations);
      }

      // Emit deletion event
      this.emit({
        name: 'context:deleted',
        type: 'context:deleted',
        target: context,
        timestamp: new Date()
      });

      return this.createSuccessResult(context, `Context '${context.name}' deleted successfully`);
    } catch (error) {
      return this.createErrorResult(`Failed to delete context: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add entities to context - the moment of particularization
   */
  addEntitiesToContext(
    contextId: string,
    entityRefs: EntityRef[]
  ): OperationResult<Context> {
    const context = this.contexts.get(contextId);
    if (!context) {
      return this.createErrorResult(`Context with ID ${contextId} not found`);
    }

    try {
      // Check if this is a protected system context
      if (context.properties?.protected) {
        return this.createErrorResult(`Cannot modify protected system context: ${context.name}`);
      }

      // Ensure all entities exist
      for (const ref of entityRefs) {
        const entity = entityService.getEntityByRef(ref);
        if (!entity) {
          return this.createErrorResult(`Entity ${ref.entity}:${ref.id} not found`);
        }
      }

      // Add entities to context
      const updatedContext = addEntities(context, entityRefs);

      // If no changes were made, return the original context
      if (updatedContext === context) {
        return this.createSuccessResult(context, "No new entities to add");
      }

      // Update storage
      this.contexts.set(contextId, updatedContext);

      // Update entity-context index for new entities
      const newEntityRefs = entityRefs.filter(ref =>
        !context.entities.some(e => e.entity === ref.entity && e.id === ref.id)
      );

      if (newEntityRefs.length > 0) {
        this.updateEntityContextIndex(contextId, newEntityRefs);
      }

      // Emit event
      this.emit({
        name: 'context:entities.added',
        type: 'context:entities.added',
        target: updatedContext,
        data: { addedEntities: newEntityRefs },
        timestamp: new Date()
      });

      return this.createSuccessResult(
        updatedContext,
        `Added ${newEntityRefs.length} entities to context '${updatedContext.name}'`
      );
    } catch (error) {
      return this.createErrorResult(`Failed to add entities to context: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove entities from context - the moment of exclusion
   */
  removeEntitiesFromContext(
    contextId: string,
    entityRefs: EntityRef[]
  ): OperationResult<Context> {
    const context = this.contexts.get(contextId);
    if (!context) {
      return this.createErrorResult(`Context with ID ${contextId} not found`);
    }

    try {
      // Check if this is a protected system context
      if (context.properties?.protected) {
        return this.createErrorResult(`Cannot modify protected system context: ${context.name}`);
      }

      // Find entities to remove
      const entitiesToRemove = entityRefs.filter(ref =>
        context.entities.some(e => e.entity === ref.entity && e.id === ref.id)
      );

      if (entitiesToRemove.length === 0) {
        return this.createSuccessResult(context, "No matching entities to remove");
      }

      // Create updated entities list
      const updatedEntities = context.entities.filter(e =>
        !entitiesToRemove.some(ref => ref.entity === e.entity && ref.id === e.id)
      );

      // Create updated context
      const updatedContext: Context = {
        ...context,
        entities: updatedEntities,
        metrics: {
          entityCount: updatedEntities.length,
          relationCount: context.relations.length,
          density: calculateDensity(updatedEntities.length, context.relations.length)
        },
        updatedAt: new Date()
      };

      // Update storage
      this.contexts.set(contextId, updatedContext);

      // Update entity-context index
      this.removeFromEntityContextIndex(contextId, entitiesToRemove);

      // Emit event
      this.emit({
        name: 'context:entities.removed',
        type: 'context:entities.removed',
        target: updatedContext,
        data: { removedEntities: entitiesToRemove },
        timestamp: new Date()
      });

      return this.createSuccessResult(
        updatedContext,
        `Removed ${entitiesToRemove.length} entities from context '${updatedContext.name}'`
      );
    } catch (error) {
      return this.createErrorResult(`Failed to remove entities from context: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add relations to context - the moment of connection
   */
  addRelationsToContext(
    contextId: string,
    relationIds: string[]
  ): OperationResult<Context> {
    const context = this.contexts.get(contextId);
    if (!context) {
      return this.createErrorResult(`Context with ID ${contextId} not found`);
    }

    try {
      // Check if this is a protected system context
      if (context.properties?.protected) {
        return this.createErrorResult(`Cannot modify protected system context: ${context.name}`);
      }

      // Ensure all relations exist
      for (const id of relationIds) {
        const relation = relationService.getRelation(id);
        if (!relation) {
          return this.createErrorResult(`Relation with ID ${id} not found`);
        }
      }

      // Add relations to context
      const updatedContext = addRelations(context, relationIds);

      // If no changes were made, return the original context
      if (updatedContext === context) {
        return this.createSuccessResult(context, "No new relations to add");
      }

      // Update storage
      this.contexts.set(contextId, updatedContext);

      // Update relation-context index for new relations
      const newRelationIds = relationIds.filter(id => !context.relations.includes(id));

      if (newRelationIds.length > 0) {
        this.updateRelationContextIndex(contextId, newRelationIds);
      }

      // Emit event
      this.emit({
        name: 'context:relations.added',
        type: 'context:relations.added',
        target: updatedContext,
        data: { addedRelations: newRelationIds },
        timestamp: new Date()
      });

      return this.createSuccessResult(
        updatedContext,
        `Added ${newRelationIds.length} relations to context '${updatedContext.name}'`
      );
    } catch (error) {
      return this.createErrorResult(`Failed to add relations to context: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove relations from context - the moment of disconnection
   */
  removeRelationsFromContext(
    contextId: string,
    relationIds: string[]
  ): OperationResult<Context> {
    const context = this.contexts.get(contextId);
    if (!context) {
      return this.createErrorResult(`Context with ID ${contextId} not found`);
    }

    try {
      // Check if this is a protected system context
      if (context.properties?.protected) {
        return this.createErrorResult(`Cannot modify protected system context: ${context.name}`);
      }

      // Find relations to remove
      const relationsToRemove = relationIds.filter(id => context.relations.includes(id));

      if (relationsToRemove.length === 0) {
        return this.createSuccessResult(context, "No matching relations to remove");
      }

      // Create updated relations list
      const updatedRelations = context.relations.filter(id => !relationsToRemove.includes(id));

      // Create updated context
      const updatedContext: Context = {
        ...context,
        relations: updatedRelations,
        metrics: {
          entityCount: context.entities.length,
          relationCount: updatedRelations.length,
          density: calculateDensity(context.entities.length, updatedRelations.length)
        },
        updatedAt: new Date()
      };

      // Update storage
      this.contexts.set(contextId, updatedContext);

      // Update relation-context index
      this.removeFromRelationContextIndex(contextId, relationsToRemove);

      // Emit event
      this.emit({
        name: 'context:relations.removed',
        type: 'context:relations.removed',
        target: updatedContext,
        data: { removedRelations: relationsToRemove },
        timestamp: new Date()
      });

      return this.createSuccessResult(
        updatedContext,
        `Removed ${relationsToRemove.length} relations from context '${updatedContext.name}'`
      );
    } catch (error) {
      return this.createErrorResult(`Failed to remove relations from context: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find contexts containing an entity - the moment of recognition
   */
  findContextsByEntity(entityRef: EntityRef): Context[] {
    const entityKey = `${entityRef.entity}:${entityRef.id}`;
    const contextIds = this.entityContexts.get(entityKey);

    if (!contextIds) return [];

    return Array.from(contextIds)
      .map(id => this.contexts.get(id))
      .filter((context): context is Context => !!context);
  }

  /**
   * Find contexts containing a relation - the moment of connection discovery
   */
  findContextsByRelation(relationId: string): Context[] {
    const contextIds = this.relationContexts.get(relationId);

    if (!contextIds) return [];

    return Array.from(contextIds)
      .map(id => this.contexts.get(id))
      .filter((context): context is Context => !!context);
  }

  /**
   * Find contexts by type - the moment of categorization
   */
  findContextsByType(type: string): Context[] {
    const contextIds = this.contextTypes.get(type);

    if (!contextIds) return [];

    return Array.from(contextIds)
      .map(id => this.contexts.get(id))
      .filter((context): context is Context => !!context);
  }

  /**
   * Find active contexts - the moment of actual determination
   */
  findActiveContexts(date?: Date): Context[] {
    const now = date || new Date();

    return Array.from(this.contexts.values())
      .filter(context => isContextActiveAt(context, now));
  }

  /**
   * Query contexts with filtering - the moment of selection
   */
  queryContexts(filters: {
    types?: string[];
    textSearch?: string;
    validOnly?: boolean;
    activeAt?: Date;
    propertyFilters?: Record<string, any>;
    scope?: 'global' | 'domain' | 'local';
    domain?: string;
    limit?: number;
    offset?: number;
  }): Context[] {
    // Start with candidate contexts
    let results: Context[];

    // If filtering by type
    if (filters.types && filters.types.length > 0) {
      results = [];
      for (const type of filters.types) {
        results.push(...this.findContextsByType(type));
      }
    } else {
      // Start with all contexts
      results = Array.from(this.contexts.values());
    }

    // Filter by validity
    if (filters.validOnly) {
      results = results.filter(context => context.valid);
    }

    // Filter by active at date
    if (filters.activeAt) {
      results = results.filter(context => isContextActiveAt(context, filters.activeAt));
    }

    // Filter by scope
    if (filters.scope) {
      results = results.filter(context => context.scope === filters.scope);
    }

    // Filter by domain
    if (filters.domain) {
      results = results.filter(context => context.domain === filters.domain);
    }

    // Text search
    if (filters.textSearch) {
      const searchLower = filters.textSearch.toLowerCase();
      results = results.filter(context =>
        context.name.toLowerCase().includes(searchLower) ||
        (context.description && context.description.toLowerCase().includes(searchLower))
      );
    }

    // Filter by property values using the BaseService filterByProperties method
    if (filters.propertyFilters) {
      results = this.filterByProperties(
        results,
        filters.propertyFilters,
        (context) => context.properties || {}
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
   * Get all contexts - the moment of totality
   */
  getAllContexts(): Context[] {
    return Array.from(this.contexts.values());
  }

  /**
   * Get all active contexts
   */
  getAllActiveContexts(date?: Date): Context[] {
    const now = date || new Date();
    return Array.from(this.contexts.values())
      .filter(context => isContextActiveAt(context, now));
  }

  /**
   * Export a context as a graph - the moment of visualization
   */
  exportContextAsGraph(
    contextId: string,
    options: {
      centerEntity?: EntityRef;
      includeProperties?: boolean;
      layoutType?: 'force' | 'hierarchical' | 'circular';
      styleOptions?: Record<string, any>;
    } = {}
  ): OperationResult<Graph> {
    const context = this.contexts.get(contextId);
    if (!context) {
      return this.createErrorResult(`Context with ID ${contextId} not found`);
    }

    try {
      // Create graph
      const graph = createGraph({
        id: `graph-${contextId}`,
        name: `Graph for ${context.name}`,
        description: context.description,
        metadata: {
          contextId,
          contextType: context.type,
          timestamp: new Date().toISOString(),
          layoutType: options.layoutType || 'force',
          ...options.styleOptions
        }
      });

      // If center entity is provided, use it as the focus
      if (options.centerEntity) {
        // Process entity neighborhood with the center entity as focus
        this.populateGraphWithEntityNeighborhood(graph, options.centerEntity, {
          includeProperties: options.includeProperties
        });
      } else {
        // Process all entities and relations in the context
        this.populateGraphFromContext(graph, context, {
          includeProperties: options.includeProperties
        });
      }

      return this.createSuccessResult(graph, `Graph generated for context '${context.name}'`);
    } catch (error) {
      return this.createErrorResult(`Failed to export context as graph: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Helper to populate a graph with an entity neighborhood
   */
  private populateGraphWithEntityNeighborhood(
    graph: Graph,
    entityRef: EntityRef,
    options: {
      depth?: number;
      direction?: 'outgoing' | 'incoming' | 'both';
      relationTypes?: string[];
      includeProperties?: boolean;
    } = {}
  ): void {
    const depth = options.depth || 1;
    const direction = options.direction || 'both';
    const includeProperties = options.includeProperties !== false;

    // Track processed nodes and edges
    const processedNodes = new Set<string>();
    const processedEdges = new Set<string>();

    // Helper to add a node to the graph
    const addNode = (ref: EntityRef) => {
      const nodeId = `${ref.entity}:${ref.id}`;

      // Skip if already processed
      if (processedNodes.has(nodeId)) return;

      // Get entity data
      const entity = entityService.getEntityByRef(ref);

      // Add node to graph
      graph.nodes.push({
        id: nodeId,
        type: ref.entity,
        label: entity?.name || ref.id,
        properties: includeProperties && entity?.properties ? { ...entity.properties } : {}
      });

      // Mark as processed
      processedNodes.add(nodeId);
    };

    // Add initial node
    addNode(entityRef);

    // Recursive function to process entity neighborhood
    const processNeighborhood = (ref: EntityRef, currentDepth: number) => {
      if (currentDepth > depth) return;

      // Find relations based on direction
      let relations: Relation[] = [];

      if (direction === 'outgoing' || direction === 'both') {
        relations = relations.concat(relationService.findRelationsBySource(ref));
      }

      if (direction === 'incoming' || direction === 'both') {
        relations = relations.concat(relationService.findRelationsByTarget(ref));
      }

      // Filter by relation types if specified
      if (options.relationTypes && options.relationTypes.length > 0) {
        relations = relations.filter(r => options.relationTypes!.includes(r.type));
      }

      // Process each relation
      for (const relation of relations) {
        // Skip if already processed
        if (processedEdges.has(relation.id)) continue;

        // Mark as processed
        processedEdges.add(relation.id);

        // Get related entity
        const related = relation.source.entity === ref.entity && relation.source.id === ref.id
          ? relation.target
          : relation.source;

        // Add node for related entity
        addNode(related);

        // Add edge for the relation
        graph.edges.push({
          id: relation.id,
          source: `${relation.source.entity}:${relation.source.id}`,
          target: `${relation.target.entity}:${relation.target.id}`,
          type: relation.type,
          label: relation.type,
          properties: includeProperties && relation.properties ? { ...relation.properties } : {}
        });

        // Continue processing for next depth
        if (currentDepth < depth) {
          processNeighborhood(related, currentDepth + 1);
        }
      }
    };

    // Start processing from the initial entity
    processNeighborhood(entityRef, 1);
  }

  /**
   * Helper to populate a graph from a context
   */
  private populateGraphFromContext(
    graph: Graph,
    context: Context,
    options: {
      includeProperties?: boolean;
    } = {}
  ): void {
    const includeProperties = options.includeProperties !== false;

    // Track processed nodes
    const processedNodes = new Set<string>();

    // Process entities
    if (context.entities) {
      // Add all entities as nodes
      for (const entityRef of context.entities) {
        const nodeId = `${entityRef.entity}:${entityRef.id}`;

        // Skip if already processed
        if (processedNodes.has(nodeId)) continue;

        // Get entity data
        const entity = entityService.getEntityByRef(entityRef);

        // Add node to graph
        graph.nodes.push({
          id: nodeId,
          type: entityRef.entity,
          label: entity?.name || entityRef.id,
          properties: includeProperties && entity?.properties ? { ...entity.properties } : {}
        });

        // Mark as processed
        processedNodes.add(nodeId);
      }
    }

    // Process relations
    if (context.relations) {
      for (const relationId of context.relations) {
        const relation = relationService.getRelation(relationId);

        if (relation) {
          // Add edge for the relation
          graph.edges.push({
            id: relation.id,
            source: `${relation.source.entity}:${relation.source.id}`,
            target: `${relation.target.entity}:${relation.target.id}`,
            type: relation.type,
            label: relation.type,
            properties: includeProperties && relation.properties ? { ...relation.properties } : {}
          });

          // Ensure source and target nodes are added
          const sourceNodeId = `${relation.source.entity}:${relation.source.id}`;
          const targetNodeId = `${relation.target.entity}:${relation.target.id}`;

          if (!processedNodes.has(sourceNodeId)) {
            const entity = entityService.getEntityByRef(relation.source);
            graph.nodes.push({
              id: sourceNodeId,
              type: relation.source.entity,
              label: entity?.name || relation.source.id,
              properties: includeProperties && entity?.properties ? { ...entity.properties } : {}
            });
            processedNodes.add(sourceNodeId);
          }

          if (!processedNodes.has(targetNodeId)) {
            const entity = entityService.getEntityByRef(relation.target);
            graph.nodes.push({
              id: targetNodeId,
              type: relation.target.entity,
              label: entity?.name || relation.target.id,
              properties: includeProperties && entity?.properties ? { ...entity.properties } : {}
            });
            processedNodes.add(targetNodeId);
          }
        }
      }
    }
  }

  /**
   * Create a temporary context - for ephemeral operations
   */
  createTemporaryContext(params: {
    name?: string;
    type?: string;
    entities?: EntityRef[];
    relations?: string[];
    expirySeconds?: number;
  }): OperationResult<Context> {
    const name = params.name || `Temporary Context ${new Date().toISOString()}`;
    const type = params.type || 'session';
    const expirySeconds = params.expirySeconds || 3600; // Default 1 hour

    // Calculate expiry time
    const now = new Date();
    const validTo = new Date(now.getTime() + expirySeconds * 1000);

    return this.createContext({
      name,
      type,
      description: `Temporary context created at ${now.toISOString()}`,
      entities: params.entities,
      relations: params.relations,
      properties: { temporary: true, createdAt: now },
      validFrom: now,
      validTo,
      scope: 'local'
    });
  }

  /**
   * Execute an operation within a context - contextual execution
   */
  executeInContext<T>(
    contextId: string,
    operation: (context: Context) => T
  ): OperationResult<T> {
    const context = this.contexts.get(contextId);
    if (!context) {
      return this.createErrorResult(`Context with ID ${contextId} not found`);
    }

    try {
      // Execute the operation
      const result = operation(context);

      // Emit operation event
      this.emit({
        name: 'context:operation.executed',
        type: 'context:operation.executed',
        target: context,
        data: { operation: operation.name || 'anonymous' },
        timestamp: new Date()
      });

      return this.createSuccessResult(
        result,
        `Operation executed successfully in context '${context.name}'`
      );
    } catch (error) {
      return this.createErrorResult(
        `Failed to execute operation in context: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Merge contexts - dialectical synthesis of contexts
   */
  mergeContexts(
    contextIds: string[],
    params: {
      name: string;
      type?: string;
      description?: string;
      properties?: Record<string, any>;
    }
  ): OperationResult<Context> {
    if (contextIds.length < 2) {
      return this.createErrorResult('At least two contexts are required for merging');
    }

    try {
      // Get contexts to merge
      const contextsToMerge = contextIds
        .map(id => this.contexts.get(id))
        .filter((context): context is Context => !!context);

      if (contextsToMerge.length !== contextIds.length) {
        return this.createErrorResult('One or more contexts not found');
      }

      // Collect entities and relations from all contexts
      const entityMap = new Map<string, EntityRef>();
      const relationSet = new Set<string>();

      for (const context of contextsToMerge) {
        // Add entities
        context.entities.forEach(ref => {
          const key = `${ref.entity}:${ref.id}`;
          entityMap.set(key, ref);
        });

        // Add relations
        context.relations.forEach(id => relationSet.add(id));
      }

      // Create merged context
      return this.createContext({
        name: params.name,
        type: params.type || 'merged',
        description: params.description || `Merged context from ${contextsToMerge.map(c => c.name).join(', ')}`,
        entities: Array.from(entityMap.values()),
        relations: Array.from(relationSet),
        properties: {
          ...params.properties,
          mergedFrom: contextIds,
          mergedAt: new Date()
        },
        scope: 'local'
      });
    } catch (error) {
      return this.createErrorResult(`Failed to merge contexts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export singleton instance
export const contextService = ContextService.getInstance();
