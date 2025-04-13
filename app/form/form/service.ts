import { z } from "zod";
import {
  FormDefinitionSchema,
  FormDefinition,
  FormPathSchema,
  FormPathStep,
  FormPath,
  FormCodexSchema,
  FormCodex,
} from "../schema/schema";
import { FormEntityDefinitionSchema } from "../schema/entity";
import { FormRelationDefinitionSchema } from "../schema/relation";
import { FormContextSchema } from "../schema/context";
import { Sandarbha, sandarbhaSṛṣṭi } from "../context/context";

/**
 * PrapatrāSevā - Core service for Prapatrā (Form) operations
 *
 * This service embodies the Brahmavidya principle of manifesting
 * unstructured knowledge into structured forms through various
 * transformational processes.
 */
export class PrapatrāSevā {
  /**
   * Create a form definition - vyākhyāNirmāṇa (definition creation)
   */
  static vyākhyāNirmāṇa(vinyāsa: {
    id?: string;
    nāma: string;            // name
    vivecanā?: string;       // description
    prakāra: string;         // type
    varga?: string;          // category
    vastu?: Record<string, z.infer<typeof FormEntityDefinitionSchema>>;     // entities
    sambandha?: Record<string, z.infer<typeof FormRelationDefinitionSchema>>; // relations
    sandarbha?: Record<string, z.infer<typeof FormContextSchema>>;   // contexts
    saṃracana?: Record<string, any>; // schema
    aṅkana?: string[];       // tags
  }): FormDefinition {
    // Create form definition with unique ID if not provided
    const formDefinition = FormDefinitionSchema.parse({
      id: vinyāsa.id || `prapatrā:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`,
      name: vinyāsa.nāma,
      description: vinyāsa.vivecanā,
      type: vinyāsa.prakāra,
      category: vinyāsa.varga,
      entities: vinyāsa.vastu || {},
      relations: vinyāsa.sambandha || {},
      contexts: vinyāsa.sandarbha || {},
      schema: vinyāsa.saṃracana || {},
      tags: vinyāsa.aṅkana || [],
      created: new Date(),
      updated: new Date(),
    });
    
    // Create default context if none provided
    if (Object.keys(formDefinition.contexts).length === 0) {
      const defaultContext = sandarbhaSṛṣṭi({
        nāma: `Default context for ${formDefinition.name}`,
        prakāra: formDefinition.type,
        lakṣaṇa: { isDefaultContext: true }
      });
      
      // Add to form definition
      formDefinition.contexts[defaultContext.id] = {
        id: defaultContext.id,
        name: defaultContext.nāma || '',
        type: defaultContext.prakāra,
        active: false
      };
    }
    
    return formDefinition;
  }

  /**
   * Create a form path - mārgaNirmāṇa (path creation)
   */
  static mārgaNirmāṇa(vinyāsa: {
    id?: string;
    nāma: string;          // name
    vivecanā?: string;     // description
    sopaṇa: Array<Omit<FormPathStep, "id">>; // steps
    āvarta?: boolean;      // circular
    lakṣaṇa?: Record<string, any>; // metadata
  }): FormPath {
    // Map each step to include an ID
    const sopaṇa = vinyāsa.sopaṇa.map((pada, index) => ({
      id: `pada:${index}`,  // step -> pada
      name: pada.name,
      description: pada.description,
      targetId: pada.targetId,
      targetType: pada.targetType,
      action: pada.action,
      conditions: pada.conditions,
      metadata: pada.metadata,
    }));

    // Create and return the path
    return FormPathSchema.parse({
      id: vinyāsa.id || `mārga:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`,
      name: vinyāsa.nāma,
      description: vinyāsa.vivecanā,
      steps: sopaṇa,
      circular: vinyāsa.āvarta,
      metadata: vinyāsa.lakṣaṇa,
      created: new Date(),
      updated: new Date(),
    });
  }

  /**
   * Create a form codex - saṃhitāNirmāṇa (codex creation)
   */
  static saṃhitāNirmāṇa(vinyāsa: {
    id?: string;
    nāma: string;          // name
    vivecanā?: string;     // description
    vyākhyā: Record<string, FormDefinition>;  // definitions
    mārga?: Record<string, FormPath>;        // paths
    varga?: Record<string, { 
      nāma: string; 
      vivecanā?: string; 
      janakId?: string 
    }>;  // categories
    lekhaka?: string;      // author
  }): FormCodex {
    // Create form codex
    return FormCodexSchema.parse({
      id: vinyāsa.id || `saṃhitā:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`,
      name: vinyāsa.nāma,
      description: vinyāsa.vivecanā,
      definitions: vinyāsa.vyākhyā,
      paths: vinyāsa.mārga || {},
      categories: vinyāsa.varga || {},
      version: "1.0.0",
      created: new Date(),
      updated: new Date(),
      author: vinyāsa.lekhaka,
    });
  }

  /**
   * Generate a form instance from a definition - mūrtīkaraṇa (instantiation)
   */
  static mūrtīkaraṇa(
    vyākhyā: FormDefinition,
    mūrtidravya?: Record<string, any>  // instanceData
  ): FormDefinition {
    // Check if abstract template
    if (vyākhyā.abstract) {
      throw new Error(`Cannot instantiate abstract form: ${vyākhyā.id}`);
    }

    // Create instantiated form with unique ID
    const instanceId = `mūrti:${vyākhyā.id}:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    
    // Create instance context based on definition contexts
    const instanceContexts: Record<string, z.infer<typeof FormContextSchema>> = {};
    
    // Clone contexts with new instance-specific IDs
    Object.entries(vyākhyā.contexts).forEach(([key, context]) => {
      const instanceContextId = `${instanceId}:context:${key}`;
      
      // Create real context in context system
      const sandarbha = sandarbhaSṛṣṭi({
        id: instanceContextId,
        nāma: `Instance context for ${vyākhyā.name}`,
        prakāra: context.type,
        janakId: context.id, // Reference original as parent
        lakṣaṇa: {
          ...context.properties,
          isInstanceContext: true,
          originalContextId: context.id
        }
      });
      
      // Add to instance definition
      instanceContexts[instanceContextId] = {
        id: sandarbha.id,
        name: sandarbha.nāma || '',
        type: sandarbha.prakāra,
        active: false
      };
    });
    
    // Return instance
    return {
      ...vyākhyā,
      id: instanceId,
      contexts: instanceContexts,
      schema: {
        ...vyākhyā.schema,
        ...mūrtidravya,
      },
      template: false,
      created: new Date(),
      updated: new Date(),
    };
  }

  /**
   * Apply a transformation to a form - rūpāntaraṇa (transformation)
   */
  static rūpāntaraṇa(
    prapatrā: FormDefinition,
    pariṇāmaka: (prapatrā: FormDefinition) => Partial<FormDefinition>
  ): FormDefinition {
    // Apply transformation function
    const parivardhana = pariṇāmaka(prapatrā);
    
    // Create transformed form with updated timestamp
    return {
      ...prapatrā,
      ...parivardhana,
      updated: new Date(),
    };
  }

  /**
   * Compose multiple forms into a single form - samanvayakaraṇa (composition)
   */
  static samanvayakaraṇa(
    prapatrāṇi: FormDefinition[],  // forms
    samanvayaYukti?: "saṃmilana" | "vistāra" | "nirdeśa"  // "merge" | "extend" | "reference"
  ): FormDefinition {
    if (!prapatrāṇi.length) {
      throw new Error("Cannot compose empty form array");
    }
    
    const yukti = samanvayaYukti || "saṃmilana";  // strategy
    const mūlaPrapatrā = prapatrāṇi[0];  // baseForm

    // Create a new composed form with unique ID
    const composedId = `samanvita:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    
    // Create composition context
    const compositionContext = sandarbhaSṛṣṭi({
      id: `${composedId}:context:composition`,
      nāma: `Composition context for ${mūlaPrapatrā.name}`,
      prakāra: "samuccaya", // composite
      lakṣaṇa: {
        compositionType: yukti,
        sourceFormIds: prapatrāṇi.map(p => p.id)
      }
    });
    
    // Create base composed form
    const milaPrapatrā: FormDefinition = {  // composedForm
      ...mūlaPrapatrā,
      id: composedId,
      name: `Samanvita: ${mūlaPrapatrā.name}`,
      description: `Samanvaya of ${prapatrāṇi.length} prapatrā`,
      entities: { ...mūlaPrapatrā.entities },
      relations: { ...mūlaPrapatrā.relations },
      contexts: { 
        ...mūlaPrapatrā.contexts,
        [compositionContext.id]: {
          id: compositionContext.id,
          name: compositionContext.nāma || '',
          type: compositionContext.prakāra,
          active: true
        }
      },
      created: new Date(),
      updated: new Date(),
    };

    // Apply the composition strategy for each additional form
    for (let i = 1; i < prapatrāṇi.length; i++) {
      const prapatrā = prapatrāṇi[i];

      if (yukti === "saṃmilana") {  // "merge"
        // Merge entities, relations, and contexts
        milaPrapatrā.entities = { ...milaPrapatrā.entities, ...prapatrā.entities };
        milaPrapatrā.relations = { ...milaPrapatrā.relations, ...prapatrā.relations };
        milaPrapatrā.contexts = { ...milaPrapatrā.contexts, ...prapatrā.contexts };
      } 
      else if (yukti === "vistāra") {  // "extend"
        // Create extension relations to the original entities
        for (const [vastuId, vastu] of Object.entries(prapatrā.entities)) {
          const extendedEntityId = `${prapatrā.id}:${vastuId}`;
          
          // Add entity with namespace
          milaPrapatrā.entities[extendedEntityId] = vastu;

          // Create extension relation
          const relationId = `vistāra:${prapatrā.id}:${vastuId}`;
          milaPrapatrā.relations[relationId] = {  // "extends"
            id: relationId,
            name: `Vistāra of ${vastu.name}`,
            type: "vistāra",
            source: extendedEntityId,
            target: vastuId,
            directional: true,
            active: true,
            cardinality: "one-to-one",
            traversalCost: 1,
            created: new Date(),
            updated: new Date(),
          };
          
          // Record this relationship in the composition context
          compositionContext.sambandha.add(relationId);
        }
      } 
      else if (yukti === "nirdeśa") {  // "reference"
        // Create reference relations to the original forms
        const relationId = `nirdeśa:${prapatrā.id}`;
        milaPrapatrā.relations[relationId] = {  // "references"
          id: relationId,
          name: `Nirdeśa to ${prapatrā.name}`,
          type: "nirdeśa",
          source: milaPrapatrā.id,
          target: prapatrā.id,
          properties: {
            nirdeśaPrakāra: "samanvaya",  // referenceType: "composition"
          },
          directional: true,
          active: true,
          cardinality: "one-to-one",
          traversalCost: 1,
          created: new Date(),
          updated: new Date(),
        };
        
        // Record this relationship in the composition context
        compositionContext.sambandha.add(relationId);
      }
    }

    return milaPrapatrā;
  }
  
  /**
   * Apply Vedantic principles to a form - brahmātmasaṃyojana
   * 
   * This method applies the principle of Brahmavidya to a form by integrating
   * transcendental aspects (brahman) with empirical aspects (ātman)
   */
  static brahmātmasaṃyojana(prapatrā: FormDefinition): FormDefinition {
    // Create transcendental context
    const transcendentalContextId = `ātmasthāna:${prapatrā.id}`;
    const transcendentalContext = sandarbhaSṛṣṭi({
      id: transcendentalContextId,
      nāma: "Ātmasthāna (Self-abiding)",
      prakāra: "darśana", // view/perception
      lakṣaṇa: {
        metaphysical: true,
        adhyāsa: true,     // superimposition
        vivarta: true,     // apparent modification
        viśeṣa: true,      // particularity
        mithyā: true       // indeterminable reality
      }
    });
    
    // Add metaphysical dimensions to the form
    const parivardhitaPrapatrā = {
      ...prapatrā,
      metaphysics: {
        adhyāsa: "The form superimposes meaning onto undifferentiated experience",
        vivarta: "The form is an apparent modification of underlying cognition",
        viśeṣa: "The form has particularity while participating in universality",
        ātmasthāna: "The form is a point of self-reflection of consciousness",
        mithyā: "The form is neither real nor unreal but indeterminable"
      },
      contexts: {
        ...prapatrā.contexts,
        [transcendentalContextId]: {
          id: transcendentalContextId,
          name: transcendentalContext.nāma || '',
          type: transcendentalContext.prakāra,
          active: false
        }
      },
      created: prapatrā.created,
      updated: new Date()
    };
    
    // Create a special self-reference relation that points back to the form itself
    // This represents the self-reflective nature of consciousness
    const ātmavyāvṛttiId = `ātmavyāvṛtti:${prapatrā.id}`;
    
    parivardhitaPrapatrā.relations = {
      ...parivardhitaPrapatrā.relations,
      [ātmavyāvṛttiId]: {
        id: ātmavyāvṛttiId,
        name: "Ātmavyāvṛtti (Self-reflection)",
        description: "The form's reflective self-reference representing its non-dual nature",
        type: "ātmavyāvṛtti",
        source: prapatrā.id,
        target: prapatrā.id,
        directional: false, // Non-directional as it represents non-duality
        active: true,
        cardinality: "one-to-one",
        traversalCost: 0, // No cost to traverse to oneself
        properties: {
          brahmavidyāSaṃbandha: true,
          adhyāsa: true,
          nonDual: true
        },
        created: new Date(),
        updated: new Date()
      }
    };
    
    // Record this self-relation in the transcendental context
    transcendentalContext.sambandha.add(ātmavyāvṛttiId);
    
    return parivardhitaPrapatrā;
  }
  
  /**
   * Reduce forms to their essential nature - sāraniṣkarṣaṇa (essence extraction)
   * 
   * This performs a phenomenological reduction similar to Husserl's epoché,
   * bracketing out contingent aspects to reveal essential structures
   */
  static sāraniṣkarṣaṇa(prapatrāṇi: FormDefinition[]): FormDefinition {
    if (!prapatrāṇi.length) {
      throw new Error("Cannot extract essence from empty form array");
    }
    
    // Create an essence context
    const essenceId = `sāra:${Date.now()}`;
    const essenceContext = sandarbhaSṛṣṭi({
      id: `${essenceId}:context`,
      nāma: "Sāra Sandarbha (Essence Context)",
      prakāra: "sṛṣṭi", // creation context
      lakṣaṇa: {
        isEssenceContext: true,
        sourceFormCount: prapatrāṇi.length,
        sourceFormIds: prapatrāṇi.map(p => p.id)
      }
    });
    
    // Start with an empty essence form
    const sāra: FormDefinition = {
      id: essenceId,
      name: "Sāra (Essential Form)",
      description: "The distilled essence of multiple forms",
      type: "sāra",
      entities: {},
      relations: {},
      contexts: {
        [essenceContext.id]: {
          id: essenceContext.id,
          name: essenceContext.nāma || '',
          type: essenceContext.prakāra,
          active: true
        }
      },
      created: new Date(),
      updated: new Date()
    };
    
    // Track occurrence frequency of each entity type
    const vastuSaṅkhyā: Record<string, number> = {};
    const sambandhaSaṅkhyā: Record<string, number> = {};
    
    // Analyze all forms to identify essential structures
    for (const prapatrā of prapatrāṇi) {
      // Count entity types
      for (const vastu of Object.values(prapatrā.entities)) {
        vastuSaṅkhyā[vastu.type] = (vastuSaṅkhyā[vastu.type] || 0) + 1;
      }
      
      // Count relation types
      for (const sambandha of Object.values(prapatrā.relations)) {
        sambandhaSaṅkhyā[sambandha.type] = (sambandhaSaṅkhyā[sambandha.type] || 0) + 1;
      }
    }
    
    // Calculate threshold for essentiality (present in >50% of forms)
    const nyūnatama = Math.ceil(prapatrāṇi.length / 2);
    
    // Extract exemplar entity for each essential entity type
    for (const [prakāra, saṅkhyā] of Object.entries(vastuSaṅkhyā)) {
      if (saṅkhyā >= nyūnatama) {
        // This entity type is essential - find an exemplar
        for (const prapatrā of prapatrāṇi) {
          const exemplar = Object.values(prapatrā.entities)
            .find(vastu => vastu.type === prakāra);
          
          if (exemplar) {
            // Add as essential entity with generalized properties
            const sāraVastuId = `sāra:vastu:${prakāra}`;
            sāra.entities[sāraVastuId] = {
              ...exemplar,
              id: sāraVastuId,
              name: `Essential ${exemplar.name}`,
              description: `The essential nature of ${prakāra}`,
              properties: exemplar.properties || {}, // Simplified properties
              updated: new Date()
            };
            
            // Record this entity in the essence context
            essenceContext.vastu.add(sāraVastuId);
            break;
          }
        }
      }
    }
    
    // Extract exemplar relation for each essential relation type
    for (const [prakāra, saṅkhyā] of Object.entries(sambandhaSaṅkhyā)) {
      if (saṅkhyā >= nyūnatama) {
        // This relation type is essential - find an exemplar
        for (const prapatrā of prapatrāṇi) {
          const exemplar = Object.values(prapatrā.relations)
            .find(sambandha => sambandha.type === prakāra);
          
          if (exemplar) {
            // Add as essential relation with generalized properties
            const sāraSambandhaId = `sāra:sambandha:${prakāra}`;
            sāra.relations[sāraSambandhaId] = {
              ...exemplar,
              id: sāraSambandhaId,
              name: `Essential ${exemplar.name}`,
              description: `The essential nature of ${prakāra} relationship`,
              properties: exemplar.properties || {}, // Simplified properties
              source: "sāra:source", // Placeholder
              target: "sāra:target", // Placeholder
              updated: new Date()
            };
            
            // Record this relation in the essence context
            essenceContext.sambandha.add(sāraSambandhaId);
            break;
          }
        }
      }
    }
    
    return sāra;
  }
}

// Export original names for backward compatibility
export { PrapatrāSevā as FormService };
export const defineForm = PrapatrāSevā.vyākhyāNirmāṇa;
export const definePath = PrapatrāSevā.mārgaNirmāṇa;
export const defineCodex = PrapatrāSevā.saṃhitāNirmāṇa;
export const instantiateForm = PrapatrāSevā.mūrtīkaraṇa;
export const transformForm = PrapatrāSevā.rūpāntaraṇa;
export const composeForms = PrapatrāSevā.samanvayakaraṇa;
export const applyVedanta = PrapatrāSevā.brahmātmasaṃyojana;
export const extractEssence = PrapatrāSevā.sāraniṣkarṣaṇa;