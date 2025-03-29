/**
 * Unify Syllogism: Pure Reason within Abstract Reason
 *
 * Models the dialectical progression from Understanding (Abstract Reason)
 * to Pure Reason through the three moments of the Syllogism of Necessity:
 * - Categorical (Ground)
 * - Hypothetical (Process)
 * - Disjunctive (Totality)
 *
 * This operation synthesizes impure understanding into the pure qualitative
 * logic of Absolute Knowing.
 */
unifySyllogism(
  entityRef: EntityRef
): OperationResult<{
  registry: {
    abstractReason: { spu: { singular: Context[], particular: Context[], universal: Relation[] } },
    pureReason: {
      categorical: { genus: Context[], contingency: Record<string, any> },
      hypothetical: { condition: Context[], outcome: Relation[] },
      disjunctive: { universal: Context[], possibilities: Relation[], reciprocity: Record<string, Relation[]> }
    }
  },
  unifiedTruth: { entity: Entity, absoluteContext: Context }
}> {
  try {
    // Initialize the registry structure to hold all dialectical moments
    const registry = {
      abstractReason: {
        spu: {
          singular: [],
          particular: [],
          universal: []
        }
      },
      pureReason: {
        categorical: {
          genus: [],
          contingency: {}
        },
        hypothetical: {
          condition: [],
          outcome: []
        },
        disjunctive: {
          universal: [],
          possibilities: [],
          reciprocity: {}
        }
      }
    };

    // Retrieve the entity as the starting point
    const entity = this.entityService.getEntityByRef(entityRef);
    if (!entity) {
      throw new Error(`Entity not found: ${entityRef.entity}:${entityRef.id}`);
    }

    //----------------------------------------------
    // I. ABSTRACT REASON (Understanding's Figures)
    //----------------------------------------------

    // First Figure: S-P (Singular-Particular)
    // Entity's membership in contexts represents the immediate moment
    const spResult = this.getContextMembership(entityRef);
    if (spResult.status === 'error') {
      throw new Error(`Failed to determine S-P relation: ${spResult.message}`);
    }

    // The same contexts serve as both singular and particular moments in abstract reason
    registry.abstractReason.spu.singular = spResult.data || [];
    registry.abstractReason.spu.particular = spResult.data || [];

    // Second Figure: P-U (Particular-Universal)
    // Causal relations represent the mediating moment
    const puResult = this.traceEffects(
      entityRef,
      LogicalRelationTypes.Consequence,
      1  // Immediate consequences only
    );
    if (puResult.status === 'error') {
      throw new Error(`Failed to determine P-U relation: ${puResult.message}`);
    }

    // Extract relation paths from the results
    registry.abstractReason.spu.universal = Array.from(puResult.data?.values() || [])
      .flatMap(v => v.path);

    //---------------------------------------
    // II. PURE REASON (Syllogism of Necessity)
    //---------------------------------------

    // A. Categorical Syllogism: Essence as Ground
    // The genus-species relation represents the substantial moment
    registry.pureReason.categorical.genus = registry.abstractReason.spu.particular;

    // Properties inherited through type hierarchy represent contingent determinations
    const catContingency = this.resolveInheritedProperties(entityRef);
    if (catContingency.status === 'error') {
      throw new Error(`Failed to resolve categorical contingency: ${catContingency.message}`);
    }
    registry.pureReason.categorical.contingency = catContingency.data || {};

    // B. Hypothetical Syllogism: Mediation as Process
    // Conditions represent the necessary grounds
    const hypConditionResult = this.getContextMembership(entityRef);
    if (hypConditionResult.status === 'error') {
      throw new Error(`Failed to determine hypothetical conditions: ${hypConditionResult.message}`);
    }
    registry.pureReason.hypothetical.condition = hypConditionResult.data || [];

    // Outcomes represent the necessary consequences
    registry.pureReason.hypothetical.outcome = registry.abstractReason.spu.universal;

    // C. Disjunctive Syllogism: Totality as Culmination
    // The universal genus contains all possible determinations
    const disUniversalResult = this.getContextMembership(entityRef, { exhaustive: true });
    if (disUniversalResult.status === 'error') {
      throw new Error(`Failed to determine disjunctive universal: ${disUniversalResult.message}`);
    }
    registry.pureReason.disjunctive.universal = disUniversalResult.data || [];

    // Possibilities represent mutually exclusive determinations
    const disPossibilitiesResult = this.traceEffects(
      entityRef,
      LogicalRelationTypes.Disjunction,
      3  // Allow for more complex disjunctions
    );
    if (disPossibilitiesResult.status === 'error') {
      throw new Error(`Failed to determine disjunctive possibilities: ${disPossibilitiesResult.message}`);
    }
    registry.pureReason.disjunctive.possibilities = Array.from(disPossibilitiesResult.data?.values() || [])
      .flatMap(v => v.path);

    // Establish reciprocal determinations (mutual exclusion relations)
    registry.pureReason.disjunctive.possibilities.forEach((rel, idx) => {
      // For each possibility, the reciprocity is all other possibilities
      const excluded = registry.pureReason.disjunctive.possibilities.filter((_, i) => i !== idx);
      registry.pureReason.disjunctive.reciprocity[rel.target.id] = excluded;
    });

    //---------------------------------------
    // III. ABSOLUTE CONTEXT (Unified Truth)
    //---------------------------------------

    // Construct the absolute context that synthesizes all dialectical moments
    const absoluteContext: Context = {
      id: `unified:${entityRef.entity}:${entityRef.id}`,
      name: `Unified Truth of ${entity.name || entityRef.id}`,
      description: `Dialectical synthesis of abstract and pure reason for ${entity.name || entityRef.id}`,

      // Include the original entity and all related entities
      entities: [
        entityRef,
        ...registry.abstractReason.spu.universal.map(r => r.target),
        ...registry.pureReason.disjunctive.possibilities.map(r => r.target)
      ],

      // Include all relations that constitute the dialectical movement
      relations: [
        ...registry.abstractReason.spu.universal,
        ...registry.pureReason.hypothetical.outcome,
        ...registry.pureReason.disjunctive.possibilities
      ],

      // Properties capture the philosophical structure
      properties: {
        abstractReason: {
          figure: 'SPU',
          purity: 'impure',
          role: 'understanding'
        },
        pureReason: {
          categorical: {
            genus: registry.pureReason.categorical.genus.map(c => c.id),
            contingencyCount: Object.keys(registry.pureReason.categorical.contingency).length
          },
          hypothetical: {
            mediation: 'conditional',
            conditionCount: registry.pureReason.hypothetical.condition.length,
            outcomeCount: registry.pureReason.hypothetical.outcome.length
          },
          disjunctive: {
            universalCount: registry.pureReason.disjunctive.universal.length,
            possibilityCount: registry.pureReason.disjunctive.possibilities.length,
            reciprocity: Object.fromEntries(
              Object.entries(registry.pureReason.disjunctive.reciprocity)
                .map(([id, rels]) => [id, rels.map(r => r.id)])
            )
          }
        },
        dialectic: {
          moment: 'synthesis',
          truthOf: 'pure_reason',
          phase: 'qualitative_logic',
          ground: 'necessity'
        }
      },

      // Mark this as an absolute context (concrete universal)
      type: 'absolute',
      mediation: 'dialectical',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Return the unified result
    return this.createSuccessResult(
      {
        registry,
        unifiedTruth: {
          entity,
          absoluteContext
        }
      },
      `Unified syllogism: Pure Reason synthesizing Abstract Reason through the Syllogism of Necessity`
    );
  } catch (error) {
    return this.createErrorResult(
      `Failed to unify syllogism: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
