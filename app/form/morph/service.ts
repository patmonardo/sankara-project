import { FormRelation } from "@/form/relation/relation";
import { FormEntity } from "@/form/entity/entity";
import { MorphEngineVerbs } from "@/form/morph/engine";

// Placeholder for getting a system entity to be the source of service verbs
const getServiceSourceEntity = (): FormEntity => {
  // Assuming FormEntity.findOrCreate exists or is added
  return FormEntity.findOrCreate({
    id: "system:morphService",
    type: "System::Service",
  });
};

/**
 * MorphService - API layer for morph operations.
 * Translates requests into verbs emitted for MorphEngine.
 */
export class MorphService {
  /**
   * Request the execution of a registered morph.
   * Emits 'morphEngine:requestExecution'.
   */
  static requestExecution(
    morphName: string,
    inputData: any, // Input data for the morph
    options?: {
      contextId?: string; // ID of an existing context to use for execution
      // contextOptions?: any; // TODO: Define options if requesting context creation
      // priority?: number; // Future: execution priority
    },
    requestMetadata?: Record<string, any> // Metadata for the request verb itself
  ): void {
    // Returns void, action is asynchronous via verb
    const serviceEntity = getServiceSourceEntity();
    const verbContent = {
      morphName,
      inputData,
      contextId: options?.contextId,
      // contextOptions: options?.contextOptions, // Pass if implemented
    };
    const verbMetadata = { ...(requestMetadata || {}) };
    // Add contextId to metadata if provided, for potential routing/filtering
    if (options?.contextId) {
      verbMetadata.contextId = options.contextId;
    }

    FormRelation.emit(
      serviceEntity,
      MorphEngineVerbs.REQUEST_EXECUTION,
      verbContent,
      verbMetadata
    );
  }

  /**
   * Request the registration of a morph definition.
   * Emits 'morphEngine:registerDefinition'.
   * Note: The 'definition' payload structure needs to be defined based on
   * how morphs are serialized or represented (e.g., JSON, code string).
   */
  static registerDefinition(
    name: string,
    definition: any, // The serializable representation of the morph
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = {
      name,
      definition, // The engine needs to know how to reconstruct the morph from this
    };
    const verbMetadata = { ...(requestMetadata || {}) };

    FormRelation.emit(
      serviceEntity,
      MorphEngineVerbs.REGISTER_DEFINITION,
      verbContent,
      verbMetadata
    );
  }

  // Add other methods as needed, e.g., requestMorphStatus, cancelMorphExecution, etc.
  // These would also emit corresponding verbs for the MorphEngine.
}

// Optional: Export individual functions if desired for easier use
export const requestMorphExecution = MorphService.requestExecution;
export const registerMorphDefinition = MorphService.registerDefinition;
