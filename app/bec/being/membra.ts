import { EntityRef, Entity } from './schema/entity';
import { Relation } from './schema/relation';
import { Context } from './schema/context';
import { OperationResult } from './schema/base';
import { BaseService } from './base';
import { SystemEvent } from '../../../core/system/property';

/**
 * The Three Syllogisms of Necessity
 *
 * Following Hegel's Logic (§191-§193), we implement the three syllogistic forms
 * that constitute the complete development of necessity:
 *
 * 1. Membership (Universality-Particularity-Individuality)
 *    - The syllogism of determinate being
 *    - Entity's membership in contexts through shared qualities
 *
 * 2. Consequence (Individuality-Universality-Particularity)
 *    - The syllogism of reflection
 *    - Causal relations between entities through universal laws
 *
 * 3. Inherence (Particularity-Individuality-Universality)
 *    - The syllogism of necessity
 *    - Type hierarchies and property inheritance
 */

// Define the fundamental logical relation types
export const LogicalRelationTypes = {
  // Membership relations (U-P-I)
  Membership: [
    'member_of',       // Basic membership
    'belongs_to',      // Stronger membership with implication of necessity
    'participates_in', // Active membership
    'composes',        // Constitutive membership
  ],

  // Consequence relations (I-U-P)
  Consequence: [
    'causes',         // Direct causation
    'leads_to',       // Indirect causation
    'results_in',     // End state causation
    'enables',        // Necessary but not sufficient condition
    'prevents',       // Negative causation
  ],

  // Inherence relations (P-I-U)
  Inherence: [
    'is_a',           // Type identity
    'instance_of',    // Instance relation
    'subclass_of',    // Hierarchical subsumption
    'exemplifies',    // Property-rich instance
    'characterizes',  // Property relation
  ],
} as const;

// Define event type for membra operations
export type MembraEvent = SystemEvent<Entity | Relation | Context> & {
  name: 'membra:membership.discovered' | 'membra:consequence.traced' |
        'membra:inherence.resolved' | 'membra:cycle.detected';
};

/**
 * MembraService - The Three Syllogistic Movements
 *
 * Implements the syllogisms of necessity from Hegelian Logic:
 * - Membership (U-P-I): Entities belonging to contexts through qualities
 * - Consequence (I-U-P): Cause and effect through universal laws
 * - Inherence (P-I-U): Type hierarchies and property inheritance
 *
 * Together, these three movements encompass the totality of logical determination.
 */
export class MembraService extends BaseService<Entity | Relation | Context, MembraEvent> {
  private static instance: MembraService;

  constructor(
    private entityService: any, // Replace with proper type
    private relationService: any,
    private contextService: any
  ) {
    super();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(
    entityService: any,
    relationService: any,
    contextService: any
  ): MembraService {
    if (!MembraService.instance) {
      MembraService.instance = new MembraService(
        entityService,
        relationService,
        contextService
      );
    }
    return MembraService.instance;
  }

  //------------------------------------------
  // FIRST SYLLOGISM: MEMBERSHIP (U-P-I)
  // Universality-Particularity-Individuality
  //------------------------------------------

  /**
   * Find all contexts an entity is a member of
   *
   * This is the syllogism of "determinate being" where the universal (context)
   * relates to the individual (entity) through particularities (qualities).
   *
   * The formal structure: U-P-I (Universal-Particular-Individual)
   */
  getContextMembership(entityRef: EntityRef): OperationResult<Context[]> {
    try {
      const contexts = this.contextService.findContextsByEntity(entityRef);

      this.emit({
        name: 'membra:membership.discovered',
        type: 'membra:membership.discovered',
        target: {
          entityRef,
          contexts
        },
        timestamp: new Date()
      });

      return this.createSuccessResult(
        contexts,
        `Found ${contexts.length} contexts for ${entityRef.entity}:${entityRef.id}`
      );
    } catch (error) {
      return this.createErrorResult(
        `Failed to get context membership: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find entities that share context membership with the given entity
   *
   * This represents the communal aspect of the first syllogism, where
   * entities are united through their participation in common universals.
   *
   * The Latin term "commercium" in Kantian philosophy refers to the
   * community of substances that mutually determine each other.
   */
  findCoMemberEntities(entityRef: EntityRef): OperationResult<Entity[]> {
    try {
      // Get all contexts the entity belongs to
      const contextResult = this.getContextMembership(entityRef);
      if (contextResult.status === 'error') {
        return this.createErrorResult(contextResult.message);
      }

      const contexts = contextResult.data || [];

      // Collect all entities from these contexts, excluding the original
      const coMembers = new Map<string, Entity>();

      for (const context of contexts) {
        for (const memberRef of context.entities) {
          // Skip the original entity
          if (memberRef.entity === entityRef.entity && memberRef.id === entityRef.id) {
            continue;
          }

          // Get the entity
          const entity = this.entityService.getEntityByRef(memberRef);
          if (entity) {
            const key = `${entity.type}:${entity.id}`;
            coMembers.set(key, entity);
          }
        }
      }

      const result = Array.from(coMembers.values());

      return this.createSuccessResult(
        result,
        `Found ${result.length} co-member entities for ${entityRef.entity}:${entityRef.id}`
      );
    } catch (error) {
      return this.createErrorResult(
        `Failed to find co-member entities: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Calculate membership overlap between two entities
   *
   * This represents the communio (community) of the two entities through
   * their shared universals (contexts).
   *
   * The Latin term "communio" refers to the sharing of common properties or attributes.
   */
  getMembershipOverlap(entityRefA: EntityRef, entityRefB: EntityRef): OperationResult<Context[]> {
    try {
      const contextsAResult = this.getContextMembership(entityRefA);
      const contextsBResult = this.getContextMembership(entityRefB);

      if (contextsAResult.status === 'error') {
        return this.createErrorResult(contextsAResult.message);
      }

      if (contextsBResult.status === 'error') {
        return this.createErrorResult(contextsBResult.message);
      }

      const contextsA = contextsAResult.data || [];
      const contextsB = contextsBResult.data || [];

      const contextIdsB = new Set(contextsB.map(c => c.id));
      const overlap = contextsA.filter(context => contextIdsB.has(context.id));

      return this.createSuccessResult(
        overlap,
        `Found ${overlap.length} overlapping contexts between ${entityRefA.entity}:${entityRefA.id} and ${entityRefB.entity}:${entityRefB.id}`
      );
    } catch (error) {
      return this.createErrorResult(
        `Failed to get membership overlap: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  //------------------------------------------
  // SECOND SYLLOGISM: CONSEQUENCE (I-U-P)
  // Individuality-Universality-Particularity
  //------------------------------------------

  /**
   * Trace forward consequences (effects)
   *
   * This is the syllogism of "reflection" where the individual (cause)
   * connects to particulars (effects) through universality (laws of causation).
   *
   * The formal structure: I-U-P (Individual-Universal-Particular)
   *
   * Logical moment: ponens (positing, affirmation)
   */
  traceEffects(
    startEntityRef: EntityRef,
    relationTypes: string[] = LogicalRelationTypes.Consequence,
    maxDepth: number = 10
  ): OperationResult<Map<string, {entity: Entity, path: Relation[]}>> {
    try {
      const results = this.traverseRelationGraph(
        startEntityRef,
        relationTypes,
        'forward',
        maxDepth
      );

      this.emit({
        name: 'membra:consequence.traced',
        type: 'membra:consequence.traced',
        target: {
          source: startEntityRef,
          direction: 'forward',
          resultsCount: results.size
        },
        timestamp: new Date()
      });

      return this.createSuccessResult(
        results,
        `Traced ${results.size} effects from ${startEntityRef.entity}:${startEntityRef.id}`
      );
    } catch (error) {
      return this.createErrorResult(
        `Failed to trace effects: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Trace backward consequences (causes)
   *
   * The reverse movement of the second syllogism, where we move from
   * an effect back to its causes through universal laws.
   *
   * Logical moment: tollens (removing, negation)
   */
  traceCauses(
    endEntityRef: EntityRef,
    relationTypes: string[] = LogicalRelationTypes.Consequence,
    maxDepth: number = 10
  ): OperationResult<Map<string, {entity: Entity, path: Relation[]}>> {
    try {
      const results = this.traverseRelationGraph(
        endEntityRef,
        relationTypes,
        'backward',
        maxDepth
      );

      this.emit({
        name: 'membra:consequence.traced',
        type: 'membra:consequence.traced',
        target: {
          source: endEntityRef,
          direction: 'backward',
          resultsCount: results.size
        },
        timestamp: new Date()
      });

      return this.createSuccessResult(
        results,
        `Traced ${results.size} causes of ${endEntityRef.entity}:${endEntityRef.id}`
      );
    } catch (error) {
      return this.createErrorResult(
        `Failed to trace causes: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find causal loops/cycles in the relation graph
   *
   * This represents the self-referential moment of causality, where
   * an entity indirectly causes itself through a chain of mediations.
   *
   * Logical moment: circulus in probando (circular reasoning)
   */
  findCausalLoops(
    startEntityRef: EntityRef,
    relationTypes: string[] = LogicalRelationTypes.Consequence,
    maxDepth: number = 10
  ): OperationResult<Relation[][]> {
    try {
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
        const outgoingRelations = this.relationService.findRelationsBySource(
          currentRef,
          { types: relationTypes, validOnly: true }
        );

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

            this.emit({
              name: 'membra:cycle.detected',
              type: 'membra:cycle.detected',
              target: {
                source: startEntityRef,
                path: [...path],
                length: path.length
              },
              timestamp: new Date()
            });
          }
          // Continue traversal if not a loop
          else if (!entityPath.has(targetKey)) {
            dfs(relation.target, depth + 1);
          }

          // Backtrack
          path.pop();
          visited.delete(relVisitKey);
        }

        entityPath.delete(currentKey);
      };

      dfs(startEntityRef);

      return this.createSuccessResult(
        loops,
        `Found ${loops.length} causal loops from ${startEntityRef.entity}:${startEntityRef.id}`
      );
    } catch (error) {
      return this.createErrorResult(
        `Failed to find causal loops: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  //------------------------------------------
  // THIRD SYLLOGISM: INHERENCE (P-I-U)
  // Particularity-Individuality-Universality
  //------------------------------------------

  /**
   * Resolve inherited properties (type hierarchy)
   *
   * This is the syllogism of "necessity" where the particular (properties)
   * relates to the universal (types) through individuality (entity instances).
   *
   * The formal structure: P-I-U (Particular-Individual-Universal)
   *
   * Logical moment: subsumptio (subsumption under concepts)
   */
  resolveInheritedProperties(
    entityRef: EntityRef,
    inheritanceRelations: string[] = LogicalRelationTypes.Inherence
  ): OperationResult<Record<string, any>> {
    try {
      // Get the entity's own properties
      const entity = this.entityService.getEntityByRef(entityRef);
      if (!entity) {
        return this.createErrorResult(`Entity ${entityRef.entity}:${entityRef.id} not found`);
      }

      const ownProperties = entity.properties || {};

      // Find inheritance relations
      const inheritanceRels = this.relationService.findRelationsBySource(
        entityRef,
        { types: inheritanceRelations, validOnly: true }
      );

      if (inheritanceRels.length === 0) {
        return this.createSuccessResult(
          ownProperties,
          `No inheritance relations found for ${entityRef.entity}:${entityRef.id}`
        );
      }

      // Collect properties from parent entities
      const visitedEntities = new Set<string>(`${entityRef.entity}:${entityRef.id}`);
      const allProperties: Record<string, any>[] = [ownProperties];
      const inheritancePaths: Relation[][] = [];
      const currentPath: Relation[] = [];

      const collectParentProperties = (parentRef: EntityRef, path: Relation[]) => {
        const parentKey = `${parentRef.entity}:${parentRef.id}`;
        if (visitedEntities.has(parentKey)) return;
        visitedEntities.add(parentKey);

        const parent = this.entityService.getEntityByRef(parentRef);
        if (!parent || !parent.properties) return;

        // Add parent properties
        allProperties.push(parent.properties);

        // Save the inheritance path
        inheritancePaths.push([...path]);

        // Recursively collect from grandparents
        const grandparentRels = this.relationService.findRelationsBySource(
          parentRef,
          { types: inheritanceRelations, validOnly: true }
        );

        for (const rel of grandparentRels) {
          const newPath = [...path, rel];
          collectParentProperties(rel.target, newPath);
        }
      };

      // Collect properties from all parents
      for (const rel of inheritanceRels) {
        collectParentProperties(rel.target, [rel]);
      }

      // Merge properties with inheritance order (child overrides parent)
      const mergedProperties = allProperties.reduceRight((merged, properties) => ({
        ...properties,
        ...merged
      }), {});

      this.emit({
        name: 'membra:inherence.resolved',
        type: 'membra:inherence.resolved',
        target: {
          entity: entityRef,
          propertyCount: Object.keys(mergedProperties).length,
          inheritancePaths: inheritancePaths.length
        },
        timestamp: new Date()
      });

      return this.createSuccessResult(
        mergedProperties,
        `Resolved ${Object.keys(mergedProperties).length} properties through inheritance`
      );
    } catch (error) {
      return this.createErrorResult(
        `Failed to resolve inherited properties: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find siblings (entities that share a parent)
   *
   * The coordinative aspect of the third syllogism, where entities
   * are related through their common parent type.
   *
   * Logical moment: coordinatio (logical coordination)
   */
  findSiblings(
    entityRef: EntityRef,
    inheritanceRelations: string[] = LogicalRelationTypes.Inherence
  ): OperationResult<Entity[]> {
    try {
      // Find parents
      const parentRelations = this.relationService.findRelationsBySource(
        entityRef,
        { types: inheritanceRelations, validOnly: true }
      );

      if (parentRelations.length === 0) {
        return this.createSuccessResult(
          [],
          `No parent relations found for ${entityRef.entity}:${entityRef.id}`
        );
      }

      // Find other entities with the same parents
      const siblings = new Map<string, Entity>();

      for (const parentRel of parentRelations) {
        const parentRef = parentRel.target;

        // Find other children of this parent
        const siblingRelations = this.relationService.findRelationsByTarget(
          parentRef,
          { types: inheritanceRelations, validOnly: true }
        );

        for (const sibRel of siblingRelations) {
          const sibRef = sibRel.source;

          // Skip the original entity
          if (sibRef.entity === entityRef.entity && sibRef.id === entityRef.id) {
            continue;
          }

          // Get the entity
          const sibEntity = this.entityService.getEntityByRef(sibRef);
          if (sibEntity) {
            const key = `${sibEntity.type}:${sibEntity.id}`;
            siblings.set(key, sibEntity);
          }
        }
      }

      const siblingsList = Array.from(siblings.values());

      return this.createSuccessResult(
        siblingsList,
        `Found ${siblingsList.length} siblings for ${entityRef.entity}:${entityRef.id}`
      );
    } catch (error) {
      return this.createErrorResult(
        `Failed to find siblings: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  //------------------------
  // HELPER METHODS
  //------------------------

  /**
   * Generic relation graph traversal method
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
      const entity = this.entityService.getEntityByRef(currentRef);
      if (!entity) return;

      // Add to results if not the start entity
      if (path.length > 0) {
        results.set(entityKey, {entity, path: [...path]});
      }

      // Find relations based on direction
      const relations = direction === 'forward'
        ? this.relationService.findRelationsBySource(currentRef, { types: relationTypes, validOnly: true })
        : this.relationService.findRelationsByTarget(currentRef, { types: relationTypes, validOnly: true });

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

  /**
   * Create a success result
   */
  private createSuccessResult<T>(data: T, message: string): OperationResult<T> {
    return {
      status: 'success',
      data,
      message
    };
  }

  /**
   * Create an error result
   */
  private createErrorResult<T>(message: string): OperationResult<T> {
    return {
      status: 'error',
      message
    };
  }
}

// Export the singleton instance
export const membraService = MembraService.getInstance(
  null,  // These should be replaced with actual service instances
  null,  // when you initialize the application
  null
);
