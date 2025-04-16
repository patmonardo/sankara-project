import { FormRelation, FormRelationId } from "./relation"; // Keep for types if needed
import { FormEntity, FormEntityId } from "@/form/entity/entity";
import { v4 as uuidv4 } from 'uuid';

// --- Verb Definitions (Keep as is) ---
export const RelationEngineVerbs = {
    REQUEST_CREATE: 'relationEngine:requestCreation',
    REQUEST_UPDATE: 'relationEngine:requestUpdate',
    REQUEST_DELETION: 'relationEngine:requestDeletion',
    REQUEST_GET: 'relationEngine:requestGet',
    REQUEST_FIND: 'relationEngine:requestFind',
    CREATED: 'relationEngine:created',
    UPDATED: 'relationEngine:updated',
    DELETED: 'relationEngine:deleted',
    GET_RESULT: 'relationEngine:getResult',
    FIND_RESULT: 'relationEngine:findResult',
    REQUEST_GET_RELATED: 'relationEngine:requestGetRelated',
    REQUEST_CHECK_RELATED: 'relationEngine:requestCheckRelated',
    GET_RELATED_RESULT: 'relationEngine:getRelatedResult',
    CHECK_RELATED_RESULT: 'relationEngine:checkRelatedResult',
    OPERATION_FAILED: 'relationEngine:operationFailed',
};
// --- End Verb Definitions ---

// Define the structure for storing relation data in the engine
interface StoredRelationData {
    id: FormRelationId;
    sourceId: FormEntityId;
    targetId: FormEntityId;
    type: string;
    content?: any;
    metadata?: Record<string, any>;
    contextId?: string;
}

export class RelationEngine {
    private engineEntity: FormEntity;
    // Store raw relation data instead of FormRelation instances
    private relations: Map<FormRelationId, StoredRelationData> = new Map();
    private verbSubscription: { unsubscribe: () => void } | null = null;

    constructor(engineId: string = 'relation-engine:default') {
        this.engineEntity = FormEntity.findOrCreate({ id: engineId, type: 'System::RelationEngine' });
        console.log(`RelationEngine (${this.engineEntity.id}) initialized.`);
    }

    start(): void {
        if (this.verbSubscription) {
            console.warn(`RelationEngine (${this.engineEntity.id}) is already listening.`);
            return;
        }
        console.log(`RelationEngine (${this.engineEntity.id}) starting to listen...`);

        this.verbSubscription = FormRelation.subscribeToVerbs((relationVerb) => {
            if (relationVerb.subtype?.startsWith('relationEngine:')) {
                 console.log(`RelationEngine received verb: ${relationVerb.subtype}`); // Log received verb
                switch (relationVerb.subtype) {
                    case RelationEngineVerbs.REQUEST_CREATE:
                        this.handleRelationCreationRequest(relationVerb);
                        break;
                    // --- Stubbed Handlers ---
                    case RelationEngineVerbs.REQUEST_UPDATE:
                    case RelationEngineVerbs.REQUEST_DELETION:
                    case RelationEngineVerbs.REQUEST_GET:
                    case RelationEngineVerbs.REQUEST_FIND:
                    case RelationEngineVerbs.REQUEST_GET_RELATED:
                    case RelationEngineVerbs.REQUEST_CHECK_RELATED:
                        this.handleStubbedRequest(relationVerb);
                        break;
                    default:
                        console.debug(`RelationEngine ignoring verb: ${relationVerb.subtype}`);
                        break;
                }
            }
        });
    }

    stop(): void {
        if (this.verbSubscription) {
            console.log(`RelationEngine (${this.engineEntity.id}) stopping listening.`);
            this.verbSubscription.unsubscribe();
            this.verbSubscription = null;
        }
    }

    // --- Simplified Relation Creation ---

    private handleRelationCreationRequest(verb: FormRelation): void {
        // Extract data directly from verb content
        const { sourceId, targetId, type, content, contextId, id: requestedId } = verb.content || {};
        const originatingVerbId = verb.id;

        if (!sourceId || !targetId || !type) {
            this.emitOperationFailed(originatingVerbId, "Missing sourceId, targetId, or type", verb.metadata?.contextId);
            return;
        }

        try {
            const relationId = requestedId || `rel:${uuidv4()}`;
            if (this.relations.has(relationId)) {
                 throw new Error(`Relation with ID ${relationId} already exists.`);
            }

            // Create the raw data object to store
            const relationData: StoredRelationData = {
                id: relationId,
                sourceId,
                targetId,
                type,
                content: content || {},
                metadata: {
                    ...(verb.metadata || {}), // Include verb metadata
                    created: Date.now(),
                    updated: Date.now(),
                    // contextId is already in the main object if provided
                },
                contextId: contextId,
            };

            // Store the raw data
            this.relations.set(relationId, relationData);

            console.log(`RelationEngine: Relation data stored: ${relationId} (${sourceId} -> ${targetId}, Type: ${type})`);

            // Emit success verb with the stored data object
            this.emitVerb(RelationEngineVerbs.CREATED, {
                originalVerbId: originatingVerbId,
                relation: relationData, // Send the raw data back
            }, originatingVerbId, contextId);

        } catch (error) {
            this.emitOperationFailed(originatingVerbId, error, verb.metadata?.contextId);
        }
    }

    // --- Stub Handler for Unimplemented Requests ---
    private handleStubbedRequest(verb: FormRelation): void {
        const originatingVerbId = verb.id;
        console.warn(`RelationEngine: Received request for unimplemented verb ${verb.subtype}. Emitting generic failure.`);
        this.emitOperationFailed(originatingVerbId, `Operation ${verb.subtype} not implemented`, verb.metadata?.contextId);
    }


    // --- Helper Methods (Keep as is) ---

    private emitVerb(
        subtype: string,
        content: Record<string, any>,
        correlationId?: FormRelationId,
        contextId?: string,
        target?: FormEntity
    ): void {
        const metadata: Record<string, any> = {};
        if (contextId) metadata.contextId = contextId;
        if (correlationId) metadata.correlationId = correlationId;
        metadata.engineId = this.engineEntity.id;

        if (target) {
            FormRelation.send(this.engineEntity, target, subtype, content, metadata);
        } else {
            FormRelation.emit(this.engineEntity, subtype, content, metadata);
        }
    }

    private emitOperationFailed(
        originatingVerbId: FormRelationId,
        error: any,
        contextId?: string,
        relationId?: FormRelationId
    ): void {
        const reason = error instanceof Error ? error.message : String(error);
        console.error(`RelationEngine: Operation failed (correlation: ${originatingVerbId}):`, reason);
        this.emitVerb(RelationEngineVerbs.OPERATION_FAILED, {
            originalVerbId: originatingVerbId,
            reason: reason,
            relationId: relationId,
        }, originatingVerbId, contextId);
    }

     // Optional: Getter for the raw data (for debugging/internal use)
    getRelationData(relationId: FormRelationId): StoredRelationData | undefined {
        return this.relations.get(relationId);
    }
}

// Instantiate the engine
export const relationEngine = new RelationEngine();