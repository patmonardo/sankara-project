import { FormRelation } from "@/form/relation/relation";
import { FormEntity } from "@/form/entity/entity";
import { NiṣpādanaPariṇāma, KriyāPrakāra } from "@/form/schema/context"; // Import types needed for payloads
import { ContextEngineVerbs } from "./engine"; 

// Placeholder for getting a system entity to be the source of service verbs
const getServiceSourceEntity = (): FormEntity => {
    // Assuming FormEntity.findOrCreate exists or is added
    return FormEntity.findOrCreate({ id: 'system:contextService', type: 'System::Service' });
};

/**
 * ContextService - API layer for context operations.
 * Translates requests into verbs emitted for ContextEngine.
 */
export class ContextService {

  /**
   * Request the creation of a new context.
   * Emits 'contextEngine:requestCreation'.
   */
  static createContext(
    name: string,
    options?: {
      id?: string;
      type?: string; // e.g., 'standard', 'execution', 'brahmatma'
      parentId?: string;
      metadata?: Record<string, any>;
      autoActivate?: boolean;
      isExecution?: boolean; // Specific flag for execution context type
      initialMode?: NiṣpādanaPariṇāma; // For execution contexts
      formId?: string; // Optional associated form
    },
    requestMetadata?: Record<string, any> // Metadata for the request verb itself
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = {
      id: options?.id,
      name: name,
      type: options?.type,
      parentId: options?.parentId,
      metadata: options?.metadata,
      autoActivate: options?.autoActivate,
      isExecution: options?.isExecution ?? (options?.type === 'execution' || options?.type === 'brahmatma'),
      initialMode: options?.initialMode,
      formId: options?.formId,
    };
    const verbMetadata = { ...(requestMetadata || {}) };

    FormRelation.emit(
        serviceEntity,
        ContextEngineVerbs.REQUEST_CREATE,
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request activation of a context.
   * Emits 'contextEngine:requestActivation'.
   */
  static activateContext(
    contextId: string,
    options?: {
      activateChildren?: boolean;
      recursive?: boolean;
      silent?: boolean;
    },
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = { contextId, options };
    const verbMetadata = { ...(requestMetadata || {}), contextId }; // Add contextId to metadata

    FormRelation.emit(
        serviceEntity,
        ContextEngineVerbs.REQUEST_ACTIVATION,
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request deactivation of a context.
   * Emits 'contextEngine:requestDeactivation'.
   */
  static deactivateContext(
    contextId: string,
    options?: {
      deactivateChildren?: boolean;
      recursive?: boolean;
      silent?: boolean;
      activateParent?: boolean;
    },
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = { contextId, options };
    const verbMetadata = { ...(requestMetadata || {}), contextId };

    FormRelation.emit(
        serviceEntity,
        ContextEngineVerbs.REQUEST_DEACTIVATION,
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request updating a context's properties.
   * Emits 'contextEngine:requestUpdate'.
   */
  static updateContext(
    contextId: string,
    updates: { // Use English names for update payload
      name?: string;
      metadata?: Record<string, any>;
      // Add other updatable properties as needed
    },
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    // Map English names to Sanskrit names if needed by the engine/context implementation
    // Or adjust the engine handler to accept English names
    const verbContent = { contextId, data: updates }; // Pass updates directly
    const verbMetadata = { ...(requestMetadata || {}), contextId };

    FormRelation.emit(
        serviceEntity,
        ContextEngineVerbs.REQUEST_UPDATE,
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request deletion of a context.
   * Emits 'contextEngine:requestDeletion'.
   */
  static deleteContext(
    contextId: string,
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = { contextId };
    const verbMetadata = { ...(requestMetadata || {}), contextId };

    FormRelation.emit(
        serviceEntity,
        ContextEngineVerbs.REQUEST_DELETION,
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request registration of an entity within a context.
   * Emits 'contextEngine:requestEntityRegistration'.
   */
  static registerEntity(
    contextId: string,
    entityId: string,
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = { contextId, entityId };
    const verbMetadata = { ...(requestMetadata || {}), contextId };

    FormRelation.emit(
        serviceEntity,
        ContextEngineVerbs.REQUEST_ENTITY_REGISTRATION,
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request registration of a relation within a context.
   * Emits 'contextEngine:requestRelationRegistration'.
   */
  static registerRelation(
    contextId: string,
    relationId: string,
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = { contextId, relationId };
    const verbMetadata = { ...(requestMetadata || {}), contextId };

    FormRelation.emit(
        serviceEntity,
        ContextEngineVerbs.REQUEST_RELATION_REGISTRATION,
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request execution of a task within a specific context and mode.
   * Emits 'contextEngine:requestExecution'.
   */
  static executeInContext(
    contextId: string,
    mode: NiṣpādanaPariṇāma, // e.g., 'guṇātmaka', 'saṅkhyātmaka', 'māyātmaka'
    operation: KriyāPrakāra, // e.g., 'anumāna', 'gaṇana', 'vyāvartana'
    task: any, // The actual function or data needed for the operation
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = {
      contextId,
      mode,
      operation,
      task, // The engine handler will need to interpret this based on the operation
    };
    const verbMetadata = { ...(requestMetadata || {}), contextId };

    FormRelation.emit(
        serviceEntity,
        ContextEngineVerbs.REQUEST_EXECUTION,
        verbContent,
        verbMetadata
    );
  }

  // --- Convenience methods for specific execution modes ---

  static executeQualitative(contextId: string, operation: KriyāPrakāra, task: any, requestMetadata?: Record<string, any>): void {
    this.executeInContext(contextId, 'guṇātmaka', operation, task, requestMetadata);
  }

  static executeQuantitative(contextId: string, operation: KriyāPrakāra, task: any, requestMetadata?: Record<string, any>): void {
    this.executeInContext(contextId, 'saṅkhyātmaka', operation, task, requestMetadata);
  }

  static executeMeasuremental(contextId: string, operation: KriyāPrakāra, task: any, requestMetadata?: Record<string, any>): void {
    this.executeInContext(contextId, 'māyātmaka', operation, task, requestMetadata);
  }

}

// Optional: Export individual functions if desired for easier use
export const createContext = ContextService.createContext;
export const activateContext = ContextService.activateContext;
export const deactivateContext = ContextService.deactivateContext;
export const updateContext = ContextService.updateContext;
export const deleteContext = ContextService.deleteContext;
export const registerEntity = ContextService.registerEntity;
export const registerRelation = ContextService.registerRelation;
export const executeInContext = ContextService.executeInContext;
export const executeQualitative = ContextService.executeQualitative;
export const executeQuantitative = ContextService.executeQuantitative;
export const executeMeasuremental = ContextService.executeMeasuremental;