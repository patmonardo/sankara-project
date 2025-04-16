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
// Remove direct Sandarbha dependency if instantiation is handled by engine
// import { sandarbhaSṛṣṭi } from "../context/context";
import { FormRelation } from "@/form/relation/relation";
import { FormEntity } from "@/form/entity/entity";

// --- Define Form Service Verb Subtypes (Tokens) ---
// These verbs are emitted by the service and likely handled by FormEngine
const FormServiceVerbs = {
    INSTANTIATE_REQUESTED: 'formEngine:requestInstantiation', // Matches FormEngine verb
    TRANSFORM_REQUESTED: 'formEngine:requestTransformation',
    COMPOSE_REQUESTED: 'formEngine:requestComposition',
    APPLY_TRANSCENDENCE_REQUESTED: 'formEngine:requestTranscendence',
    EXTRACT_ESSENCE_REQUESTED: 'formEngine:requestEssence',
    // Definition verbs might be handled differently or not involve the engine directly
    // DEFINE_FORM_REQUESTED: 'formDefinition:defineRequested',
    // DEFINE_PATH_REQUESTED: 'formPath:defineRequested',
    // DEFINE_CODEX_REQUESTED: 'formCodex:defineRequested',
};
// --- End Verb Definitions ---

// Placeholder for getting a system entity to be the source of service verbs
const getServiceSourceEntity = (): FormEntity => {
    // Find or create a generic system entity for the service
    // Assuming FormEntity.findOrCreate exists or is added
    return FormEntity.findOrCreate({ id: 'system:formService', type: 'System::Service' });
};


/**
 * FormService - API layer for Form operations.
 * Translates requests into verbs for FormEngine or manages definitions.
 */
export class FormService {
  /**
   * Create a form definition.
   * (Kept largely as is - defines structure, doesn't necessarily trigger engine)
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
      id: config.id || `formDef:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`, // Changed prefix
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

    // Note: Removed automatic default context creation here.
    // The FormEngine will handle context creation based on the definition
    // when instantiation is requested.

    // TODO: Consider if defining a form should emit a verb for persistence/registration
    // e.g., FormRelation.emit(getServiceSourceEntity(), 'formDefinition:created', { definition: formDefinition });

    return formDefinition;
  }

  /**
   * Create a form path definition.
   * (Kept largely as is - defines structure)
   */
  static definePath(config: {
    id?: string;
    name: string;
    description?: string;
    steps: Array<Omit<FormPathStep, "id">>;
    circular?: boolean;
    metadata?: Record<string, any>;
  }): FormPath {
    const steps = config.steps.map((step, index) => ({
      id: `step:${index}`, // Simple ID generation
      name: step.name,
      description: step.description,
      targetId: step.targetId,
      targetType: step.targetType,
      action: step.action,
      conditions: step.conditions,
      metadata: step.metadata,
    }));

    const pathDefinition = FormPathSchema.parse({
      id: config.id || `pathDef:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`, // Changed prefix
      name: config.name,
      description: config.description,
      steps: steps,
      circular: config.circular,
      metadata: config.metadata,
      created: new Date(),
      updated: new Date(),
    });

    // TODO: Consider emitting a verb for persistence/registration
    // e.g., FormRelation.emit(getServiceSourceEntity(), 'formPath:created', { path: pathDefinition });

    return pathDefinition;
  }

  /**
   * Create a form codex definition.
   * (Kept largely as is - defines structure)
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
    const codexDefinition = FormCodexSchema.parse({
      id: config.id || `codexDef:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`, // Changed prefix
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

    // TODO: Consider emitting a verb for persistence/registration
    // e.g., FormRelation.emit(getServiceSourceEntity(), 'formCodex:created', { codex: codexDefinition });

    return codexDefinition;
  }

  // --- Methods Refactored to Emit Verbs for FormEngine ---

  /**
   * Request instantiation of a form instance from a definition.
   * Emits a 'formEngine:requestInstantiation' verb.
   */
  static instantiateForm(
    definition: FormDefinition, // Or definitionId: string if definitions are stored/retrieved
    initialData?: Record<string, any>,
    contextOptions?: any[], // Options for context creation during instantiation
    metadata?: Record<string, any>
  ): void { // Returns void, action is asynchronous via verb
    if (definition.abstract) {
      console.error(`Cannot request instantiation of abstract form definition: ${definition.id}`);
      // Optionally emit a failure event here if needed immediately
      return;
    }

    const serviceEntity = getServiceSourceEntity();
    const verbContent = {
      definition: definition, // Pass the full definition or just ID
      // definitionId: definition.id, // Alternative: Pass ID if engine can retrieve definition
      initialData: initialData,
      contextOptions: contextOptions, // Let engine handle context setup
    };
    const verbMetadata = {
        ...(metadata || {}),
        // Add any relevant context for the request itself
    };

    FormRelation.emit(
        serviceEntity,
        FormServiceVerbs.INSTANTIATE_REQUESTED,
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request applying a transformation to a form instance.
   * Emits a 'formEngine:requestTransformation' verb.
   */
  static transformForm(
    formInstanceId: string, // Target the instance ID
    transformerId: string, // ID or name of the transformation logic/morph
    params?: Record<string, any>, // Parameters for the transformer
    metadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = {
      formInstanceId,
      transformerId,
      params,
    };
    const verbMetadata = { ...(metadata || {}) };

    FormRelation.emit(
        serviceEntity,
        FormServiceVerbs.TRANSFORM_REQUESTED,
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request composing multiple forms into a single form instance.
   * Emits a 'formEngine:requestComposition' verb.
   */
  static composeForms(
    formInstanceIds: string[], // IDs of instances to compose
    strategy?: "merge" | "extend" | "reference",
    compositionName?: string, // Optional name for the new composed form
    metadata?: Record<string, any>
  ): void {
    if (!formInstanceIds || formInstanceIds.length < 2) {
      console.error("Composition requires at least two form instance IDs.");
      return;
    }

    const serviceEntity = getServiceSourceEntity();
    const verbContent = {
      formInstanceIds,
      strategy: strategy || "merge",
      compositionName: compositionName || `Composed Form ${Date.now()}`
    };
    const verbMetadata = { ...(metadata || {}) };

    FormRelation.emit(
        serviceEntity,
        FormServiceVerbs.COMPOSE_REQUESTED,
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request applying transcendental principles to a form instance.
   * Emits a 'formEngine:requestTranscendence' verb.
   */
  static applyTranscendence(
    formInstanceId: string,
    metadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = { formInstanceId };
    const verbMetadata = { ...(metadata || {}) };

    FormRelation.emit(
        serviceEntity,
        FormServiceVerbs.APPLY_TRANSCENDENCE_REQUESTED,
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request extracting the essential structure from multiple form instances.
   * Emits a 'formEngine:requestEssence' verb.
   */
  static extractEssence(
    formInstanceIds: string[],
    essenceName?: string, // Optional name for the new essence form
    metadata?: Record<string, any>
  ): void {
    if (!formInstanceIds || formInstanceIds.length === 0) {
      console.error("Essence extraction requires at least one form instance ID.");
      return;
    }

    const serviceEntity = getServiceSourceEntity();
    const verbContent = {
        formInstanceIds,
        essenceName: essenceName || `Essence ${Date.now()}`
    };
    const verbMetadata = { ...(metadata || {}) };

    FormRelation.emit(
        serviceEntity,
        FormServiceVerbs.EXTRACT_ESSENCE_REQUESTED,
        verbContent,
        verbMetadata
    );
  }
}

// Keep direct function exports if desired, but note they now emit verbs
export default FormService;
export const defineForm = FormService.defineForm;
export const definePath = FormService.definePath;
export const defineCodex = FormService.defineCodex;
export const instantiateForm = FormService.instantiateForm;
export const transformForm = FormService.transformForm;
export const composeForms = FormService.composeForms;
export const applyTranscendence = FormService.applyTranscendence;
export const extractEssence = FormService.extractEssence;