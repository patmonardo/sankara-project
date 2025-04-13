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
import { sandarbhaSṛṣṭi } from "../context/context";

/**
 * FormService - Core service for Form operations
 *
 * This service manages the creation, transformation, and composition of forms
 * within the system, connecting the philosophical infrastructure to practical
 * business applications.
 */
export class FormService {
  /**
   * Create a form definition
   */
  static defineForm(config: {
    id?: string;
    name: string;
    description?: string;
    type: string;
    category?: string;
    entities?: Record<string, z.infer<typeof FormEntityDefinitionSchema>>;
    relations?: Record<string, z.infer<typeof FormRelationDefinitionSchema>>;
    contexts?: Record<string, z.infer<typeof FormContextSchema>>;
    schema?: Record<string, any>;
    tags?: string[];
  }): FormDefinition {
    // Create form definition with unique ID if not provided
    const formDefinition = FormDefinitionSchema.parse({
      id: config.id || `form:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`,
      name: config.name,
      description: config.description,
      type: config.type,
      category: config.category,
      entities: config.entities || {},
      relations: config.relations || {},
      contexts: config.contexts || {},
      schema: config.schema || {},
      tags: config.tags || [],
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
   * Create a form path
   */
  static definePath(config: {
    id?: string;
    name: string;
    description?: string;
    steps: Array<Omit<FormPathStep, "id">>;
    circular?: boolean;
    metadata?: Record<string, any>;
  }): FormPath {
    // Map each step to include an ID
    const steps = config.steps.map((step, index) => ({
      id: `step:${index}`,
      name: step.name,
      description: step.description,
      targetId: step.targetId,
      targetType: step.targetType,
      action: step.action,
      conditions: step.conditions,
      metadata: step.metadata,
    }));

    // Create and return the path
    return FormPathSchema.parse({
      id: config.id || `path:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`,
      name: config.name,
      description: config.description,
      steps: steps,
      circular: config.circular,
      metadata: config.metadata,
      created: new Date(),
      updated: new Date(),
    });
  }

  /**
   * Create a form codex - a collection of related forms
   */
  static defineCodex(config: {
    id?: string;
    name: string;
    description?: string;
    definitions: Record<string, FormDefinition>;
    paths?: Record<string, FormPath>;
    categories?: Record<string, { 
      name: string; 
      description?: string; 
      parentId?: string 
    }>;
    author?: string;
  }): FormCodex {
    // Create form codex
    return FormCodexSchema.parse({
      id: config.id || `codex:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`,
      name: config.name,
      description: config.description,
      definitions: config.definitions,
      paths: config.paths || {},
      categories: config.categories || {},
      version: "1.0.0",
      created: new Date(),
      updated: new Date(),
      author: config.author,
    });
  }

  /**
   * Generate a form instance from a definition
   */
  static instantiateForm(
    definition: FormDefinition,
    instanceData?: Record<string, any>
  ): FormDefinition {
    // Check if abstract template
    if (definition.abstract) {
      throw new Error(`Cannot instantiate abstract form: ${definition.id}`);
    }

    // Create instantiated form with unique ID
    const instanceId = `instance:${definition.id}:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    
    // Create instance context based on definition contexts
    const instanceContexts: Record<string, z.infer<typeof FormContextSchema>> = {};
    
    // Clone contexts with new instance-specific IDs
    Object.entries(definition.contexts).forEach(([key, context]) => {
      const instanceContextId = `${instanceId}:context:${key}`;
      
      // Create real context in context system
      const sandarbha = sandarbhaSṛṣṭi({
        id: instanceContextId,
        nāma: `Instance context for ${definition.name}`,
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
      ...definition,
      id: instanceId,
      contexts: instanceContexts,
      schema: {
        ...definition.schema,
        ...instanceData,
      },
      template: false,
      created: new Date(),
      updated: new Date(),
    };
  }

  /**
   * Apply a transformation to a form
   */
  static transformForm(
    form: FormDefinition,
    transformer: (form: FormDefinition) => Partial<FormDefinition>
  ): FormDefinition {
    // Apply transformation function
    const changes = transformer(form);
    
    // Create transformed form with updated timestamp
    return {
      ...form,
      ...changes,
      updated: new Date(),
    };
  }

  /**
   * Compose multiple forms into a single form
   */
  static composeForms(
    forms: FormDefinition[],
    strategy?: "merge" | "extend" | "reference"
  ): FormDefinition {
    if (!forms.length) {
      throw new Error("Cannot compose empty form array");
    }
    
    const compositionStrategy = strategy || "merge";
    const baseForm = forms[0];

    // Create a new composed form with unique ID
    const composedId = `composed:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    
    // Create composition context
    const compositionContext = sandarbhaSṛṣṭi({
      id: `${composedId}:context:composition`,
      nāma: `Composition context for ${baseForm.name}`,
      prakāra: "composite",
      lakṣaṇa: {
        compositionType: compositionStrategy,
        sourceFormIds: forms.map(p => p.id)
      }
    });
    
    // Create base composed form
    const composedForm: FormDefinition = {
      ...baseForm,
      id: composedId,
      name: `Composed: ${baseForm.name}`,
      description: `Composition of ${forms.length} forms`,
      entities: { ...baseForm.entities },
      relations: { ...baseForm.relations },
      contexts: { 
        ...baseForm.contexts,
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
    for (let i = 1; i < forms.length; i++) {
      const form = forms[i];

      if (compositionStrategy === "merge") {
        // Merge entities, relations, and contexts
        composedForm.entities = { ...composedForm.entities, ...form.entities };
        composedForm.relations = { ...composedForm.relations, ...form.relations };
        composedForm.contexts = { ...composedForm.contexts, ...form.contexts };
      } 
      else if (compositionStrategy === "extend") {
        // Create extension relations to the original entities
        for (const [entityId, entity] of Object.entries(form.entities)) {
          const extendedEntityId = `${form.id}:${entityId}`;
          
          // Add entity with namespace
          composedForm.entities[extendedEntityId] = entity;

          // Create extension relation
          const relationId = `extends:${form.id}:${entityId}`;
          composedForm.relations[relationId] = {
            id: relationId,
            name: `Extension of ${entity.name}`,
            type: "extends",
            source: extendedEntityId,
            target: entityId,
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
      else if (compositionStrategy === "reference") {
        // Create reference relations to the original forms
        const relationId = `references:${form.id}`;
        composedForm.relations[relationId] = {
          id: relationId,
          name: `Reference to ${form.name}`,
          type: "references",
          source: composedForm.id,
          target: form.id,
          properties: {
            referenceType: "composition",
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

    return composedForm;
  }
  
  /**
   * Apply transcendental principles to a form
   * 
   * This method enhances a form with self-referential capabilities,
   * enabling forms to represent higher-order structures
   */
  static applyTranscendence(form: FormDefinition): FormDefinition {
    // Create transcendental context
    const transcendentalContextId = `transcendental:${form.id}`;
    const transcendentalContext = sandarbhaSṛṣṭi({
      id: transcendentalContextId,
      nāma: "Transcendental View",
      prakāra: "perception",
      lakṣaṇa: {
        metaphysical: true,
        superimposition: true,
        apparentModification: true,
        particularity: true,
        indeterminableReality: true
      }
    });
    
    // Add metaphysical dimensions to the form
    const enhancedForm = {
      ...form,
      metaphysics: {
        superimposition: "The form superimposes meaning onto undifferentiated experience",
        apparentModification: "The form is an apparent modification of underlying cognition",
        particularity: "The form has particularity while participating in universality",
        selfAbiding: "The form is a point of self-reflection of consciousness",
        indeterminableReality: "The form is neither real nor unreal but indeterminable"
      },
      contexts: {
        ...form.contexts,
        [transcendentalContextId]: {
          id: transcendentalContextId,
          name: transcendentalContext.nāma || '',
          type: transcendentalContext.prakāra,
          active: false
        }
      },
      created: form.created,
      updated: new Date()
    };
    
    // Create a special self-reference relation that points back to the form itself
    // This represents the self-reflective nature of consciousness
    const selfReflectionId = `self-reflection:${form.id}`;
    
    enhancedForm.relations = {
      ...enhancedForm.relations,
      [selfReflectionId]: {
        id: selfReflectionId,
        name: "Self-reflection",
        description: "The form's reflective self-reference representing its non-dual nature",
        type: "self-reflection",
        source: form.id,
        target: form.id,
        directional: false, // Non-directional as it represents non-duality
        active: true,
        cardinality: "one-to-one",
        traversalCost: 0, // No cost to traverse to oneself
        properties: {
          transcendentalRelation: true,
          superimposition: true,
          nonDual: true
        },
        created: new Date(),
        updated: new Date()
      }
    };
    
    // Record this self-relation in the transcendental context
    transcendentalContext.sambandha.add(selfReflectionId);
    
    return enhancedForm;
  }
  
  /**
   * Extract the essential structure from multiple forms
   * 
   * This performs a reduction to identify the common patterns
   * and core elements across a set of forms
   */
  static extractEssence(forms: FormDefinition[]): FormDefinition {
    if (!forms.length) {
      throw new Error("Cannot extract essence from empty form array");
    }
    
    // Create an essence context
    const essenceId = `essence:${Date.now()}`;
    const essenceContext = sandarbhaSṛṣṭi({
      id: `${essenceId}:context`,
      nāma: "Essence Context",
      prakāra: "creation",
      lakṣaṇa: {
        isEssenceContext: true,
        sourceFormCount: forms.length,
        sourceFormIds: forms.map(p => p.id)
      }
    });
    
    // Start with an empty essence form
    const essenceForm: FormDefinition = {
      id: essenceId,
      name: "Essential Form",
      description: "The distilled essence of multiple forms",
      type: "essence",
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
    const entityTypeCount: Record<string, number> = {};
    const relationTypeCount: Record<string, number> = {};
    
    // Analyze all forms to identify essential structures
    for (const form of forms) {
      // Count entity types
      for (const entity of Object.values(form.entities)) {
        entityTypeCount[entity.type] = (entityTypeCount[entity.type] || 0) + 1;
      }
      
      // Count relation types
      for (const relation of Object.values(form.relations)) {
        relationTypeCount[relation.type] = (relationTypeCount[relation.type] || 0) + 1;
      }
    }
    
    // Calculate threshold for essentiality (present in >50% of forms)
    const threshold = Math.ceil(forms.length / 2);
    
    // Extract exemplar entity for each essential entity type
    for (const [type, count] of Object.entries(entityTypeCount)) {
      if (count >= threshold) {
        // This entity type is essential - find an exemplar
        for (const form of forms) {
          const exemplar = Object.values(form.entities)
            .find(entity => entity.type === type);
          
          if (exemplar) {
            // Add as essential entity with generalized properties
            const essentialEntityId = `essence:entity:${type}`;
            essenceForm.entities[essentialEntityId] = {
              ...exemplar,
              id: essentialEntityId,
              name: `Essential ${exemplar.name}`,
              description: `The essential nature of ${type}`,
              properties: exemplar.properties || {}, // Simplified properties
              updated: new Date()
            };
            
            // Record this entity in the essence context
            essenceContext.vastu.add(essentialEntityId);
            break;
          }
        }
      }
    }
    
    // Extract exemplar relation for each essential relation type
    for (const [type, count] of Object.entries(relationTypeCount)) {
      if (count >= threshold) {
        // This relation type is essential - find an exemplar
        for (const form of forms) {
          const exemplar = Object.values(form.relations)
            .find(relation => relation.type === type);
          
          if (exemplar) {
            // Add as essential relation with generalized properties
            const essentialRelationId = `essence:relation:${type}`;
            essenceForm.relations[essentialRelationId] = {
              ...exemplar,
              id: essentialRelationId,
              name: `Essential ${exemplar.name}`,
              description: `The essential nature of ${type} relationship`,
              properties: exemplar.properties || {}, // Simplified properties
              source: "essence:source", // Placeholder
              target: "essence:target", // Placeholder
              updated: new Date()
            };
            
            // Record this relation in the essence context
            essenceContext.sambandha.add(essentialRelationId);
            break;
          }
        }
      }
    }
    
    return essenceForm;
  }
}

// Export direct function references for convenience
export default FormService;
export const defineForm = FormService.defineForm;
export const definePath = FormService.definePath;
export const defineCodex = FormService.defineCodex;
export const instantiateForm = FormService.instantiateForm;
export const transformForm = FormService.transformForm;
export const composeForms = FormService.composeForms;
export const applyTranscendence = FormService.applyTranscendence;
export const extractEssence = FormService.extractEssence;