import { FormRelation, FormRelationId } from "@/form/relation/relation";
import { FormEntity, FormEntityId } from "./entity";
import { v4 as uuidv4 } from 'uuid';

// --- Define Entity Engine Verb Subtypes ---
export const EntityEngineVerbs = {
    // Entity Lifecycle Verbs (Requests handled by EntityEngine)
    REQUEST_CREATE: 'entityEngine:requestCreation',
    REQUEST_UPDATE: 'entityEngine:requestUpdate',
    REQUEST_DELETION: 'entityEngine:requestDeletion',
    REQUEST_GET: 'entityEngine:requestGet',
    REQUEST_FIND: 'entityEngine:requestFind',
    REQUEST_ADD_TO_CONTEXT: 'entityEngine:requestAddToContext',
    REQUEST_REMOVE_FROM_CONTEXT: 'entityEngine:requestRemoveFromContext',

    // Entity Lifecycle Verbs (Responses emitted by EntityEngine)
    CREATED: 'entityEngine:created',
    UPDATED: 'entityEngine:updated',
    DELETED: 'entityEngine:deleted',
    GET_RESULT: 'entityEngine:getResult',
    FIND_RESULT: 'entityEngine:findResult',
    OPERATION_FAILED: 'entityEngine:operationFailed', // General failure response

    // Potential future verbs:
    // REQUEST_VALIDATION: 'entityEngine:requestValidation',
    // VALIDATION_RESULT: 'entityEngine:validationResult',
};
// --- End Verb Definitions ---


export class EntityEngine {
    private engineEntity: FormEntity; // Represents the engine itself
    private entities: Map<FormEntityId, FormEntity> = new Map(); // Manages active Entity instances
    private verbSubscription: { unsubscribe: () => void } | null = null;

    constructor(engineId: string = 'entity-engine:default') {
        // Placeholder: Ideally, the engine manages its own entity representation or retrieves it.
        // Using findOrCreate assumes it exists or can be created.
        this.engineEntity = FormEntity.findOrCreate({ id: engineId, type: 'System::EntityEngine' });
        console.log(`EntityEngine (${this.engineEntity.id}) initialized.`);
    }

    /**
     * Start listening for relevant verbs using FormRelation.subscribeToVerbs.
     */
    start(): void {
        if (this.verbSubscription) {
            console.warn(`EntityEngine (${this.engineEntity.id}) is already listening.`);
            return;
        }
        console.log(`EntityEngine (${this.engineEntity.id}) starting to listen for relation verbs...`);

        this.verbSubscription = FormRelation.subscribeToVerbs((relationVerb) => {
            // Only process verbs directed at this engine (based on subtype prefix)
            if ((relationVerb.type === 'event' || relationVerb.type === 'message') &&
                relationVerb.subtype && relationVerb.subtype.startsWith('entityEngine:'))
             {
                // Route based on subtype
                switch (relationVerb.subtype) {
                    case EntityEngineVerbs.REQUEST_CREATE:
                        this.handleEntityCreationRequest(relationVerb);
                        break;
                    case EntityEngineVerbs.REQUEST_UPDATE:
                        this.handleEntityUpdateRequest(relationVerb);
                        break;
                    case EntityEngineVerbs.REQUEST_DELETION:
                        this.handleEntityDeletionRequest(relationVerb);
                        break;
                    case EntityEngineVerbs.REQUEST_GET:
                        this.handleEntityGetRequest(relationVerb);
                        break;
                    case EntityEngineVerbs.REQUEST_FIND:
                        this.handleEntityFindRequest(relationVerb);
                        break;
                    case EntityEngineVerbs.REQUEST_ADD_TO_CONTEXT:
                    case EntityEngineVerbs.REQUEST_REMOVE_FROM_CONTEXT:
                        this.handleEntityContextChangeRequest(relationVerb);
                        break;

                    default:
                        console.debug(`EntityEngine ignoring verb: ${relationVerb.subtype}`);
                        break;
                }
            }
        });
    }

    /**
     * Stop listening for verbs.
     */
    stop(): void {
        if (this.verbSubscription) {
            console.log(`EntityEngine (${this.engineEntity.id}) stopping listening.`);
            this.verbSubscription.unsubscribe();
            this.verbSubscription = null;
        }
    }

    private async handleEntityCreationRequest(verb: FormRelation): Promise<void> {
        const { id, type, properties, metadata, contextId } = verb.content || {};
        const originatingVerbId = verb.id;

        if (!type) {
            this.emitEntityOperationFailed(originatingVerbId, "Missing entity type", verb.metadata?.contextId);
            return;
        }

        try {
            const entityId = id || `ent:${uuidv4()}`; // Generate ID if not provided

            if (this.entities.has(entityId)) {
                 this.emitEntityOperationFailed(originatingVerbId, `Entity with ID ${entityId} already exists`, verb.metadata?.contextId, entityId);
                 return;
            }

            const now = Date.now();
            // Persistence Step 1: Create instance in memory
            const newEntity = new FormEntity({
                id: entityId,
                type: type,
                properties: properties || {},
                metadata: {
                    ...(metadata || {}),
                    created: now,
                    updated: now,
                },
                contextId: contextId,
            });

            // Persistence Step 2: Save to database (await this if async)
            // await this.database.saveEntity(newEntity.toJSON()); // Example persistence call

            this.entities.set(entityId, newEntity);
            console.log(`EntityEngine: Entity created: ${entityId} (Type: ${type})`);

            // Emit success *after* persistence
            this.emitVerb(EntityEngineVerbs.CREATED, {
                originalVerbId: originatingVerbId,
                entity: newEntity.toJSON(), // Send serialized entity data
            }, originatingVerbId, contextId);

        } catch (error) {
            this.emitEntityOperationFailed(originatingVerbId, error, verb.metadata?.contextId);
        }
    }

    private async handleEntityUpdateRequest(verb: FormRelation): Promise<void> {
        const { entityId, updates, options } = verb.content || {};
        const originatingVerbId = verb.id;

        if (!entityId) {
            this.emitEntityOperationFailed(originatingVerbId, "Missing entityId", verb.metadata?.contextId);
            return;
        }

        // Persistence Step 1: Retrieve from memory/cache or database
        // let entity = this.entities.get(entityId);
        // if (!entity) {
        //    entity = await this.database.getEntity(entityId); // Example persistence call
        //    if (entity) this.entities.set(entityId, entity); // Cache if found
        // }
        const entity = this.entities.get(entityId); // Using in-memory for now

        if (!entity) {
            this.emitEntityOperationFailed(originatingVerbId, `Entity ${entityId} not found`, verb.metadata?.contextId, entityId);
            return;
        }

        try {
            let changed = false;
            const mergeProperties = options?.mergeProperties ?? true;
            const mergeMetadata = options?.mergeMetadata ?? true;

            // Apply updates (same logic as before)
            if (updates.type && updates.type !== entity.type) {
                console.warn(`EntityEngine: Changing entity type for ${entityId} from ${entity.type} to ${updates.type}.`);
                entity.type = updates.type;
                changed = true;
            }
            if (updates.properties) {
                entity.properties = mergeProperties
                    ? { ...entity.properties, ...updates.properties }
                    : updates.properties;
                changed = true;
            }
            if (updates.metadata) {
                 entity.metadata = mergeMetadata
                    ? { ...entity.metadata, ...updates.metadata }
                    : updates.metadata;
                 if (mergeMetadata && entity.metadata.created && !updates.metadata.created) {
                     updates.metadata.created = entity.metadata.created;
                 }
                 changed = true;
            }
            if (updates.contextId !== undefined && updates.contextId !== entity.contextId) {
                entity.contextId = updates.contextId === null ? undefined : updates.contextId;
                changed = true;
            }


            if (changed) {
                entity.metadata.updated = Date.now();

                // Persistence Step 2: Save updated entity to database (await this if async)
                // await this.database.saveEntity(entity.toJSON()); // Example persistence call

                console.log(`EntityEngine: Entity updated: ${entityId}`);
                this.emitVerb(EntityEngineVerbs.UPDATED, {
                    originalVerbId: originatingVerbId,
                    entity: entity.toJSON(),
                }, originatingVerbId, entity.contextId || verb.metadata?.contextId);
            } else {
                 console.log(`EntityEngine: Entity update requested for ${entityId}, but no changes applied.`);
                 this.emitVerb(EntityEngineVerbs.UPDATED, {
                    originalVerbId: originatingVerbId,
                    entity: entity.toJSON(),
                    status: 'unchanged'
                }, originatingVerbId, entity.contextId || verb.metadata?.contextId);
            }

        } catch (error) {
             this.emitEntityOperationFailed(originatingVerbId, error, verb.metadata?.contextId, entityId);
        }
    }

    private async handleEntityDeletionRequest(verb: FormRelation): Promise<void> {
        const { entityId, options } = verb.content || {};
        const originatingVerbId = verb.id;

        if (!entityId) {
            this.emitEntityOperationFailed(originatingVerbId, "Missing entityId", verb.metadata?.contextId);
            return;
        }

        // Persistence Step 1: Check existence (in memory or DB)
        const existsInMemory = this.entities.has(entityId);
        // const existsInDb = await this.database.checkEntityExists(entityId); // Example persistence call
        // if (!existsInMemory && !existsInDb) { ... }
        if (!existsInMemory) { // Using in-memory for now
            console.warn(`EntityEngine: Entity ${entityId} not found for deletion.`);
             this.emitVerb(EntityEngineVerbs.DELETED, {
                originalVerbId: originatingVerbId,
                entityId: entityId,
                status: 'notFound'
            }, originatingVerbId, verb.metadata?.contextId);
            return;
        }

        try {
            // TODO: Add logic based on options (force, deleteRelations)
            // This might involve emitting verbs to other engines (e.g., RelationEngine)

            // Persistence Step 2: Delete from database (await this if async)
            // await this.database.deleteEntity(entityId); // Example persistence call

            this.entities.delete(entityId); // Remove from memory
            console.log(`EntityEngine: Entity deleted: ${entityId}`);

            this.emitVerb(EntityEngineVerbs.DELETED, {
                originalVerbId: originatingVerbId,
                entityId: entityId,
                status: 'deleted'
            }, originatingVerbId, verb.metadata?.contextId);

        } catch (error) {
             this.emitEntityOperationFailed(originatingVerbId, error, verb.metadata?.contextId, entityId);
        }
    }

    private async handleEntityGetRequest(verb: FormRelation): Promise<void> {
        const { entityId } = verb.content || {};
        const originatingVerbId = verb.id;

        if (!entityId) {
            this.emitEntityOperationFailed(originatingVerbId, "Missing entityId", verb.metadata?.contextId);
            return;
        }

        // Persistence Step: Retrieve from memory/cache or database
        // let entity = this.entities.get(entityId);
        // if (!entity) {
        //    entity = await this.database.getEntity(entityId); // Example persistence call
        //    if (entity) this.entities.set(entityId, entity); // Cache if found
        // }
        const entity = this.entities.get(entityId); // Using in-memory for now

        this.emitVerb(EntityEngineVerbs.GET_RESULT, {
            originalVerbId: originatingVerbId,
            entity: entity ? entity.toJSON() : null, // Send null if not found
        }, originatingVerbId, verb.metadata?.contextId);
    }

    private async handleEntityFindRequest(verb: FormRelation): Promise<void> {
        const { query, options } = verb.content || {};
        const originatingVerbId = verb.id;

        try {
            // Persistence Step: Query the database instead of in-memory map
            // const results = await this.database.findEntities(query, options); // Example persistence call
            // For now, using basic in-memory filtering:
            let results = Array.from(this.entities.values());
            if (query) {
                if (query.type) {
                    results = results.filter(e => e.type === query.type);
                }
                if (query.contextId) {
                     results = results.filter(e => e.contextId === query.contextId);
                }
                if (query.properties) {
                    results = results.filter(e =>
                        Object.entries(query.properties).every(([key, value]) => e.properties[key] === value)
                    );
                }
                if (query.metadata) {
                    results = results.filter(e =>
                        Object.entries(query.metadata).every(([key, value]) => e.metadata[key] === value)
                    );
                }
            }
            // TODO: Apply options (sorting, limit, offset) if using in-memory

            this.emitVerb(EntityEngineVerbs.FIND_RESULT, {
                originalVerbId: originatingVerbId,
                entities: results.map(e => e.toJSON()),
            }, originatingVerbId, verb.metadata?.contextId);

        } catch (error) {
             this.emitEntityOperationFailed(originatingVerbId, error, verb.metadata?.contextId);
        }
    }

     private async handleEntityContextChangeRequest(verb: FormRelation): Promise<void> {
        // This logic is essentially an update, so we can reuse handleEntityUpdateRequest
        // or keep it separate if context changes need special handling/validation.
        // For simplicity, let's reuse the update logic by transforming the verb content.

        const { entityId, contextId } = verb.content || {};
        const originatingVerbId = verb.id;
        const isAdding = verb.subtype === EntityEngineVerbs.REQUEST_ADD_TO_CONTEXT;

        if (!entityId) {
            this.emitEntityOperationFailed(originatingVerbId, "Missing entityId", verb.metadata?.contextId);
            return;
        }
         if (isAdding && contextId === undefined) {
             this.emitEntityOperationFailed(originatingVerbId, "Missing contextId for adding entity to context", verb.metadata?.contextId, entityId);
             return;
         }

        // Create an update verb structure
        const updateVerbContent = {
            entityId: entityId,
            updates: {
                contextId: isAdding ? contextId : null // Set to null for removal
            },
            options: { mergeProperties: false, mergeMetadata: true } // Don't merge props, keep existing metadata
        };

        // Create a minimal FormRelation-like object to pass to the update handler
        const pseudoVerb: FormRelation = {
            id: verb.id, // Keep original ID for correlation
            source: verb.source,
            target: this.engineEntity, // Target is this engine
            subtype: EntityEngineVerbs.REQUEST_UPDATE, // Pretend it's an update request
            content: updateVerbContent,
            metadata: {
                ...(verb.metadata || {}),
                // Add flag indicating original intent?
                originalSubtype: verb.subtype
            },
            // Add other required FormRelation properties if necessary
            type: 'message', // Or 'event'?
            timestamp: verb.timestamp || Date.now(),
        };

        // Call the update handler
        await this.handleEntityUpdateRequest(pseudoVerb);

        // Note: The response (ENTITY_UPDATED) will be emitted by handleEntityUpdateRequest.
        // We might want to adjust the response content based on the originalSubtype metadata
        // if the caller needs to distinguish between a general update and a context change.
    }


    // --- Helper Methods ---

    /**
     * Helper to emit verbs from this engine. Includes correlationId.
     */
    private emitVerb(
        subtype: string,
        content: Record<string, any>,
        correlationId?: FormRelationId, // Use originating verb ID for correlation
        contextId?: string, // Optional context for metadata
        target?: FormEntity
    ): void {
        const metadata: Record<string, any> = {};
        if (contextId) {
            metadata.contextId = contextId;
        }
        if (correlationId) {
            metadata.correlationId = correlationId; // Add correlation ID
        }

        // Add engine ID to metadata?
        metadata.engineId = this.engineEntity.id;

        if (target) {
            FormRelation.send(this.engineEntity, target, subtype, content, metadata);
        } else {
            FormRelation.emit(this.engineEntity, subtype, content, metadata);
        }
    }

    /** Helper to emit entity operation failure verbs */
    private emitEntityOperationFailed(
        originatingVerbId: FormRelationId,
        error: any,
        contextId?: string,
        entityId?: FormEntityId
    ): void {
        const reason = error instanceof Error ? error.message : String(error);
        console.error(`EntityEngine: Operation failed (correlation: ${originatingVerbId}):`, reason);
        this.emitVerb(EntityEngineVerbs.OPERATION_FAILED, {
            originalVerbId: originatingVerbId,
            reason: reason,
            entityId: entityId, // Include entityId if available
        }, originatingVerbId, contextId); // Pass correlationId and contextId to emitVerb
    }

    /**
     * Get a managed Entity instance (primarily for internal use or debugging).
     */
    getEntityInstance(entityId: FormEntityId): FormEntity | undefined {
        // In a persistence scenario, this might fetch from DB if not in memory
        return this.entities.get(entityId);
    }
}

// Instantiate the engine (singleton or managed)
export const entityEngine = new EntityEngine();