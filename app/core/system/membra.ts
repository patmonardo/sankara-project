//@/core/system/algorithms.ts

import { EntityRef, Entity } from '../being/schema/entity';
import { Relation } from '../being/schema/relation';
import { Context } from '../being/schema/context';

/**
 * GraphAlgorithms - Core ontological relation algorithms
 *
 * Implements fundamental philosophical relations as graph operations
 */
export class GraphAlgorithms {
  constructor(
    private entityService: any, // Using 'any' for brevity
    private relationService: any,
    private contextService: any
  ) {}

  //------------------------
  // MEMBERSHIP ALGORITHMS
  //------------------------

  /**
   * Find all contexts an entity is a member of
   */
  getContextMembership(entityRef: EntityRef): Context[] {
    return this.contextService.queryContexts({
      containsEntity: entityRef
    });
  }

  /**
   * Find entities that share context membership
   */
  findCoMemberEntities(entityRef: EntityRef): Entity[] {
    // Get all contexts the entity belongs to
    const contexts = this.getContextMembership(entityRef);

    // Collect all entities from these contexts, excluding the original
    const coMembers = new Map<string, Entity>();

    for (const context of contexts) {
      for (const memberRef of context.entities) {
        // Skip the original entity
        if (memberRef.entity === entityRef.entity && memberRef.id === entityRef.id) {
          continue;
        }

        // Get the entity
        const entity = this.entityService.getEntity(memberRef.entity, memberRef.id);
        if (entity) {
          const key = `${entity.type}:${entity.id}`;
          coMembers.set(key, entity);
        }
      }
    }

    return Array.from(coMembers.values());
  }

  /**
   * Calculate membership overlap between two entities
   * Returns contexts they both belong to
   */
  getMembershipOverlap(entityRefA: EntityRef, entityRefB: EntityRef): Context[] {
    const contextsA = this.getContextMembership(entityRefA);
    const contextsB = this.getContextMembership(entityRefB);

    const contextIdsB = new Set(contextsB.map(c => c.id));

    return contextsA.filter(context => contextIdsB.has(context.id));
  }

  //------------------------
  // CONSEQUENCE ALGORITHMS
  //------------------------

  /**
   * Trace forward consequences (effects)
   */
  traceEffects(
    startEntityRef: EntityRef,
    relationTypes: string[] = ['causes', 'leads_to', 'results_in'],
    maxDepth: number = 10
  ): Map<string, {entity: Entity, path: Relation[]}> {
    return this.traverseRelationGraph(
      startEntityRef,
      relationTypes,
      'forward',
      maxDepth
    );
  }

  /**
   * Trace backward consequences (causes)
   */
  traceCauses(
    endEntityRef: EntityRef,
    relationTypes: string[] = ['causes', 'leads_to', 'results_in'],
    maxDepth: number = 10
  ): Map<string, {entity: Entity, path: Relation[]}> {
    return this.traverseRelationGraph(
      endEntityRef,
      relationTypes,
      'backward',
      maxDepth
    );
  }

  /**
   * Find causal loops/cycles in the relation graph
   */
  findCausalLoops(
    startEntityRef: EntityRef,
    relationTypes: string[] = ['causes', 'leads_to', 'results_in'],
    maxDepth: number = 10
  ): Relation[][] {
    const loops: Relation[][] = [];
    const visited = new Set<string>();
    const path: Relation[] = [];
    const entityPath = new Set<string>();

    const key = (ref: EntityRef) => `${ref.entity}:${ref.id}`;
    const startKey = key(startEntityRef);

    const dfs = (currentRef: EntityRef, depth: number = 0) => {
      if (depth > maxDepth) return;

      const currentKey = key(currentRef);
      entityPath.add(currentKey);

      // Get outgoing relations
      const outgoingRelations = this.relationService.queryRelations({
        sourceEntity: currentRef,
        types: relationTypes,
        validOnly: true
      });

      for (const relation of outgoingRelations) {
        const relVisitKey = relation.id;

        // Skip already visited relations in this path
        if (visited.has(relVisitKey)) continue;

        // Add to path
        visited.add(relVisitKey);
        path.push(relation);

        const targetKey = key(relation.target);

        // Check for loop back to start
        if (targetKey === startKey && path.length > 0) {
          loops.push([...path]);
        }
        // Check for other loops
        else if (entityPath.has(targetKey)) {
          // Found a loop, but not to the start entity
          // We could track these too if needed
        }
        // Continue traversal
        else {
          dfs(relation.target, depth + 1);
        }

        // Backtrack
        path.pop();
        visited.delete(relVisitKey);
      }

      entityPath.delete(currentKey);
    };

    dfs(startEntityRef);

    return loops;
  }

  /**
   * Generic graph traversal method
   */
  private traverseRelationGraph(
    entityRef: EntityRef,
    relationTypes: string[],
    direction: 'forward' | 'backward' = 'forward',
    maxDepth: number = 10
  ): Map<string, {entity: Entity, path: Relation[]}> {
    const results = new Map();
    const visited = new Set<string>();

    const traverse = (
      currentRef: EntityRef,
      path: Relation[] = [],
      depth: number = 0
    ) => {
      if (depth > maxDepth) return;

      const entityKey = `${currentRef.entity}:${currentRef.id}`;
      if (visited.has(entityKey)) return;
      visited.add(entityKey);

      // Get entity
      const entity = this.entityService.getEntity(currentRef.entity, currentRef.id);
      if (!entity) return;

      // Add to results if not the start entity
      if (path.length > 0) {
        results.set(entityKey, {entity, path: [...path]});
      }

      // Find relations based on direction
      const relations = this.relationService.queryRelations({
        ...(direction === 'forward'
          ? { sourceEntity: currentRef }
          : { targetEntity: currentRef }),
        types: relationTypes,
        validOnly: true
      });

      // Traverse related entities
      for (const relation of relations) {
        const nextRef = direction === 'forward' ? relation.target : relation.source;
        traverse(
          nextRef,
          [...path, relation],
          depth + 1
        );
      }
    };

    // Start traversal
    traverse(entityRef);

    return results;
  }

  //------------------------
  // INHERENCE ALGORITHMS
  //------------------------

  /**
   * Resolve inherited properties (type hierarchy)
   */
  resolveInheritedProperties(
    entityRef: EntityRef,
    inheritanceRelations: string[] = ['is_a', 'instance_of', 'subclass_of']
  ): Record<string, any> {
    // Get the entity's own properties
    const entity = this.entityService.getEntity(entityRef.entity, entityRef.id);
    if (!entity) return {};

    const ownProperties = entity.properties || {};

    // Find inheritance relations
    const inheritanceRels = this.relationService.queryRelations({
      sourceEntity: entityRef,
      types: inheritanceRelations,
      validOnly: true
    });

    if (inheritanceRels.length === 0) {
      return ownProperties;
    }

    // Collect properties from parent entities
    const visitedEntities = new Set<string>(`${entityRef.entity}:${entityRef.id}`);
    const allProperties: Record<string, any>[] = [ownProperties];

    const collectParentProperties = (parentRef: EntityRef) => {
      const parentKey = `${parentRef.entity}:${parentRef.id}`;
      if (visitedEntities.has(parentKey)) return;
      visitedEntities.add(parentKey);

      const parent = this.entityService.getEntity(parentRef.entity, parentRef.id);
      if (!parent || !parent.properties) return;

      // Add parent properties
      allProperties.push(parent.properties);

      // Recursively collect from grandparents
      const grandparentRels = this.relationService.queryRelations({
        sourceEntity: parentRef,
        types: inheritanceRelations,
        validOnly: true
      });

      for (const rel of grandparentRels) {
        collectParentProperties(rel.target);
      }
    };

    // Collect properties from all parents
    for (const rel of inheritanceRels) {
      collectParentProperties(rel.target);
    }

    // Merge properties (later entries have precedence)
    return allProperties.reduceRight((merged, properties) => ({
      ...properties,
      ...merged
    }), {});
  }

  /**
   * Build type hierarchy
   */
  buildTypeHierarchy(
    entityRef: EntityRef,
    inheritanceRelations: string[] = ['is_a', 'instance_of', 'subclass_of'],
    maxDepth: number = 10
  ): {entity: Entity, children: any[]}[] {
    // Get entity types that inherit from this entity
    const findChildTypes = (ref: EntityRef, depth: number = 0): {entity: Entity, children: any[]}[] => {
      if (depth > maxDepth) return [];

      const entity = this.entityService.getEntity(ref.entity, ref.id);
      if (!entity) return [];

      // Find entities that inherit from this entity
      const childRelations = this.relationService.queryRelations({
        targetEntity: ref,
        types: inheritanceRelations,
        validOnly: true
      });

      // Recursively process children
      const children = childRelations.map(rel => {
        return findChildTypes(rel.source, depth + 1);
      }).flat();

      return [{
        entity,
        children
      }];
    };

    return findChildTypes(entityRef);
  }

  /**
   * Find siblings (entities that share a parent)
   */
  findSiblings(
    entityRef: EntityRef,
    inheritanceRelations: string[] = ['is_a', 'instance_of', 'subclass_of']
  ): Entity[] {
    // Find parents
    const parentRelations = this.relationService.queryRelations({
      sourceEntity: entityRef,
      types: inheritanceRelations,
      validOnly: true
    });

    if (parentRelations.length === 0) return [];

    // Find other entities with the same parents
    const siblings = new Map<string, Entity>();

    for (const parentRel of parentRelations) {
      const parentRef = parentRel.target;

      // Find other children of this parent
      const siblingRelations = this.relationService.queryRelations({
        targetEntity: parentRef,
        types: inheritanceRelations,
        validOnly: true
      });

      for (const sibRel of siblingRelations) {
        const sibRef = sibRel.source;

        // Skip the original entity
        if (sibRef.entity === entityRef.entity && sibRef.id === entityRef.id) {
          continue;
        }

        // Get the entity
        const sibEntity = this.entityService.getEntity(sibRef.entity, sibRef.id);
        if (sibEntity) {
          const key = `${sibEntity.type}:${sibEntity.id}`;
          siblings.set(key, sibEntity);
        }
      }
    }

    return Array.from(siblings.values());
  }
}
