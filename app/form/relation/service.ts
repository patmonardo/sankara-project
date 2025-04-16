import { FormRelation, FormRelationId } from "./relation"; // Keep FormRelation import
import { FormEntity } from "@/form/entity/entity";
import { RelationEngineVerbs } from "./engine"; // Import verbs from engine

// ... (getServiceSourceEntity remains the same) ...
const getServiceSourceEntity = (): FormEntity => {
    return FormEntity.findOrCreate({ id: 'system:relationService', type: 'System::Service' });
};


/**
 * RelationService - API layer for relation operations.
 * Translates requests into verbs emitted via FormRelation, targeting RelationEngine.
 */
export class RelationService {

  /**
   * Request the creation of a persistent relation between entities.
   * Emits a 'relationEngine:requestCreation' verb.
   */
  static createRelation(
    sourceId: string,
    targetId: string,
    type: string, // The subtype for the persistent relation
    content?: Record<string, any>,
    contextId?: string,
    metadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = {
      sourceId,
      targetId,
      type,
      content,
      contextId,
    };
    const verbMetadata = { ...(metadata || {}), contextId };

    FormRelation.emit(
        serviceEntity,
        RelationEngineVerbs.REQUEST_CREATE, // Use new verb
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request finding relations based on criteria.
   * Emits a 'relationEngine:requestFind' verb.
   */
  static findRelations(
    query: {
      sourceId?: string;
      targetId?: string;
      type?: string;
      contentQuery?: Record<string, any>;
      contextId?: string; // Allow filtering by contextId in query
    },
    requestMetadata?: Record<string, any> // Renamed metadata param
  ): void {
    const serviceEntity = getServiceSourceEntity();
    // contextId is now part of the query object
    const verbContent = { query };
    const verbMetadata = { ...(requestMetadata || {}), contextId: query.contextId };

    FormRelation.emit(
        serviceEntity,
        RelationEngineVerbs.REQUEST_FIND, // Use new verb
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request getting a specific relation by its ID.
   * Emits a 'relationEngine:requestGet' verb.
   */
  static getRelation(
    relationId: string, // Relation ID is usually unique, context might not be needed
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = { relationId };
    const verbMetadata = { ...(requestMetadata || {}) }; // Context might be irrelevant for get by ID

    FormRelation.emit(
        serviceEntity,
        RelationEngineVerbs.REQUEST_GET, // Use new verb
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request updating an existing relation.
   * Emits a 'relationEngine:requestUpdate' verb.
   */
  static updateRelation(
    relationId: string,
    updates: { // Renamed 'changes' to 'updates' for consistency
      targetId?: string;
      type?: string;
      content?: Record<string, any>;
      contextId?: string | null; // Allow changing/clearing context
    },
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = { relationId, updates };
    // Context might be part of updates or metadata depending on intent
    const verbMetadata = { ...(requestMetadata || {}), contextId: updates.contextId };

    FormRelation.emit(
        serviceEntity,
        RelationEngineVerbs.REQUEST_UPDATE, // Use new verb
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request deleting a relation.
   * Emits a 'relationEngine:requestDeletion' verb.
   */
  static deleteRelation(
    relationId: string,
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = { relationId };
    const verbMetadata = { ...(requestMetadata || {}) };

    FormRelation.emit(
        serviceEntity,
        RelationEngineVerbs.REQUEST_DELETION, // Use new verb
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request creating a property relation (convenience method).
   * Uses 'relationEngine:requestCreation'.
   */
  static createPropertyRelation(
    entityId: string,
    propertyId: string,
    contextId?: string,
    content?: Record<string, any>,
    metadata?: Record<string, any>
  ): void {
     // Use general creation verb with specific type
     this.createRelation(
        entityId,
        propertyId,
        'system:hasProperty', // Standard type
        content,
        contextId,
        metadata
     );
  }

  // --- Graph/Transformation Operations ---

  /**
   * Request finding entities related to a given entity.
   * Emits a 'relationEngine:requestGetRelated' verb.
   */
  static getRelatedEntities(
    entityId: string,
    relationTypes?: string[],
    options?: { depth?: number; direction?: "outgoing" | "incoming" | "both"; contextId?: string; }, // Added contextId to options
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = { entityId, relationTypes, options };
    const verbMetadata = { ...(requestMetadata || {}), contextId: options?.contextId };

    FormRelation.emit(
        serviceEntity,
        RelationEngineVerbs.REQUEST_GET_RELATED, // Use new verb
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request checking if two entities are related.
   * Emits a 'relationEngine:requestCheckRelated' verb.
   */
  static areEntitiesRelated(
    sourceId: string,
    targetId: string,
    type?: string,
    contextId?: string, // Context might be relevant here
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = { sourceId, targetId, type, contextId };
    const verbMetadata = { ...(requestMetadata || {}), contextId };

    FormRelation.emit(
        serviceEntity,
        RelationEngineVerbs.REQUEST_CHECK_RELATED, // Use new verb
        verbContent,
        verbMetadata
    );
  }

}

// Export the static method as a standalone function
export const createRelation = RelationService.createRelation;