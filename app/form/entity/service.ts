import { FormRelation } from "@/form/relation/relation";
import { FormEntity, FormEntityId } from "./entity"; // Import base class and ID type
// Import the verbs correctly from the engine file
import { EntityEngineVerbs } from "./engine"; // Assuming this is the exported constant name in engine.ts

// Placeholder for getting a system entity to be the source of service verbs
const getServiceSourceEntity = (): FormEntity => {
    // Assuming FormEntity.findOrCreate exists or is added
    return FormEntity.findOrCreate({ id: 'system:entityService', type: 'System::Service' });
};

/**
 * EntityService - API layer for FormEntity operations.
 * Translates requests into verbs emitted for EntityEngine.
 */
export class EntityService {

  /**
   * Request the creation of a new entity via EntityEngine.
   * Emits 'entityEngine:requestCreation'.
   */
  static createEntity(
    type: string,
    options?: {
      id?: FormEntityId;
      properties?: Record<string, any>;
      metadata?: Record<string, any>;
      contextId?: string;
    },
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = {
      id: options?.id,
      type: type,
      properties: options?.properties,
      metadata: options?.metadata,
      contextId: options?.contextId,
    };
    const verbMetadata = { ...(requestMetadata || {}) };
    if (options?.contextId) {
        verbMetadata.contextId = options.contextId;
    }

    FormRelation.emit(
        serviceEntity,
        EntityEngineVerbs.REQUEST_CREATE, // Use imported verb
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request updating an existing entity via EntityEngine.
   * Emits 'entityEngine:requestUpdate'.
   */
  static updateEntity(
    entityId: FormEntityId,
    updates: {
      type?: string;
      properties?: Record<string, any>;
      metadata?: Record<string, any>;
      contextId?: string | null;
    },
    options?: {
        mergeProperties?: boolean;
        mergeMetadata?: boolean;
    },
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = {
      entityId,
      updates,
      options,
    };
    const verbMetadata = { ...(requestMetadata || {}) };
     if (updates.contextId !== undefined) {
        verbMetadata.contextId = updates.contextId;
    } else if (requestMetadata?.contextId) {
         verbMetadata.contextId = requestMetadata.contextId;
     }

    FormRelation.emit(
        serviceEntity,
        EntityEngineVerbs.REQUEST_UPDATE, // Use imported verb
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request deletion of an entity via EntityEngine.
   * Emits 'entityEngine:requestDeletion'.
   */
  static deleteEntity(
    entityId: FormEntityId,
    options?: {
        force?: boolean;
        deleteRelations?: boolean;
    },
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = { entityId, options };
    const verbMetadata = { ...(requestMetadata || {}) };
    if (requestMetadata?.contextId) {
         verbMetadata.contextId = requestMetadata.contextId;
     }

    FormRelation.emit(
        serviceEntity,
        EntityEngineVerbs.REQUEST_DELETION, // Use imported verb
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request getting a single entity by its ID via EntityEngine.
   * Emits 'entityEngine:requestGet'.
   */
  static getEntity(
    entityId: FormEntityId,
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = { entityId };
    const verbMetadata = { ...(requestMetadata || {}) };
     if (requestMetadata?.contextId) {
         verbMetadata.contextId = requestMetadata.contextId;
     }

    FormRelation.emit(
        serviceEntity,
        EntityEngineVerbs.REQUEST_GET, // Use imported verb
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request finding entities based on criteria via EntityEngine.
   * Emits 'entityEngine:requestFind'.
   */
  static findEntities(
    query: {
      type?: string;
      contextId?: string;
      properties?: Record<string, any>;
      metadata?: Record<string, any>;
    },
    options?: {
        limit?: number;
        offset?: number;
        sortBy?: string;
        sortDirection?: 'asc' | 'desc';
    },
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = { query, options };
    const verbMetadata = { ...(requestMetadata || {}) };
     if (query.contextId) {
         verbMetadata.contextId = query.contextId;
     } else if (requestMetadata?.contextId) {
         verbMetadata.contextId = requestMetadata.contextId;
     }

    FormRelation.emit(
        serviceEntity,
        EntityEngineVerbs.REQUEST_FIND, // Use imported verb
        verbContent,
        verbMetadata
    );
  }

   /**
    * Request adding an entity to a specific context via EntityEngine.
    * Emits 'entityEngine:requestAddToContext'.
    */
   static addEntityToContext(
    entityId: FormEntityId,
    contextId: string,
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = { entityId, contextId };
    const verbMetadata = { ...(requestMetadata || {}), contextId };

    FormRelation.emit(
        serviceEntity,
        EntityEngineVerbs.REQUEST_ADD_TO_CONTEXT, // Use imported verb
        verbContent,
        verbMetadata
    );
  }

   /**
    * Request removing an entity from a specific context via EntityEngine.
    * Emits 'entityEngine:requestRemoveFromContext'.
    */
   static removeEntityFromContext(
    entityId: FormEntityId,
    contextId: string,
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = { entityId, contextId };
    const verbMetadata = { ...(requestMetadata || {}), contextId };

    FormRelation.emit(
        serviceEntity,
        EntityEngineVerbs.REQUEST_REMOVE_FROM_CONTEXT, // Use imported verb
        verbContent,
        verbMetadata
    );
  }

}

// Optional: Export individual functions if desired
export const createEntity = EntityService.createEntity;
export const updateEntity = EntityService.updateEntity;
export const deleteEntity = EntityService.deleteEntity;
export const getEntity = EntityService.getEntity;
export const findEntities = EntityService.findEntities;
export const addEntityToContext = EntityService.addEntityToContext;
export const removeEntityFromContext = EntityService.removeEntityFromContext;