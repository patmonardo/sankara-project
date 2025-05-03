import { FormRelation, FormRelationId } from "@/form/relation/relation";
import { FormEntity, FormEntityId } from "@/form/entity/entity"; // Import FormEntityId
import { Form } from "./form";
import { FormDefinition } from "../schema/schema";
import { FormData } from "../schema/shape";
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating entity IDs

// --- Define Form Engine Verb Subtypes ---
const FormEngineVerbs = {
    // Form Lifecycle Verbs
    REQUEST_FORM_INSTANTIATION: 'formEngine:requestInstantiation',
    REQUEST_FORM_DELETION: 'formEngine:requestDeletion',
    FORM_INSTANTIATED: 'formEngine:instantiated',
    FORM_DELETED: 'formEngine:deleted',
    FORM_INSTANTIATION_FAILED: 'formEngine:instantiationFailed',

    // Orchestration Verbs (Emitted by FormEngine)
    REQUEST_CONTEXT_CREATION_FOR_FORM: 'contextEngine:requestCreation',
    REQUEST_MORPH_EXECUTION: 'morphEngine:requestExecution',
    // Potentially add verbs to notify other engines about entity changes if needed
};
// --- End Verb Definitions ---


export class FormEngine {
    private engineEntity: FormEntity; // Represents the engine itself
    private forms: Map<string, Form> = new Map(); // Manages active Form instances
    private verbSubscription: { unsubscribe: () => void } | null = null;

    constructor(engineId: string = 'form-engine:default') {
        this.engineEntity = FormEntity.findOrCreate({ id: engineId, type: 'System::FormEngine' });
        console.log(`FormEngine (${this.engineEntity.id}) initialized.`);
        // Note: The static FormEntity.findOrCreate is still a placeholder.
        // Ideally, the engine manages its own entity representation or retrieves it.
    }

    /**
     * Start listening for relevant verbs using FormRelation.subscribeToVerbs.
     */
    start(): void {
        if (this.verbSubscription) {
            console.warn(`FormEngine (${this.engineEntity.id}) is already listening.`);
            return;
        }
        console.log(`FormEngine (${this.engineEntity.id}) starting to listen for relation verbs...`);

        this.verbSubscription = FormRelation.subscribeToVerbs((relationVerb) => {
            if (relationVerb.type === 'event' || relationVerb.type === 'message') {
                // Route based on subtype
                switch (relationVerb.subtype) {
                    // Form Verbs
                    case FormEngineVerbs.REQUEST_FORM_INSTANTIATION:
                        this.handleInstantiationRequest(relationVerb);
                        break;
                    case FormEngineVerbs.REQUEST_FORM_DELETION:
                        this.handleDeletionRequest(relationVerb);
                        break;

                    default:
                        // console.debug(`FormEngine ignoring verb: ${relationVerb.subtype}`);
                        break;
                }
            }
        });
    }

    /**
     * Stop listening for verbs.
     */
    stop(): void {
        // ... (existing stop method) ...
        if (this.verbSubscription) {
            console.log(`FormEngine (${this.engineEntity.id}) stopping listening.`);
            this.verbSubscription.unsubscribe();
            this.verbSubscription = null;
        }
    }

    // --- Form Handling Methods (Existing) ---
    private async handleInstantiationRequest(verb: FormRelation): Promise<void> {
        // ... (existing handleInstantiationRequest method) ...
        console.log(`FormEngine handling verb: ${verb.subtype} (ID: ${verb.id})`);
        const { definition, initialData, requestedId, contextOptions } = verb.content || {};
        const originatingVerbId = verb.id; // For correlation

        if (!definition) {
            console.error(`FormEngine: Missing form definition in ${verb.subtype} request.`);
            this.emitVerb(FormEngineVerbs.FORM_INSTANTIATION_FAILED, {
                originalVerbId: originatingVerbId,
                reason: "Missing form definition",
            }, verb.metadata?.correlationId, verb.metadata?.contextId);
            return;
        }

        try {
            const formId = requestedId || `form:${uuidv4()}`; // Use uuid

            // --- Instantiate the Form ---
            const newForm = new Form({
                id: formId,
                definitionId: definition.id, // Assuming definition has an id
                definitionName: definition.name,
                initialData: initialData as FormData,
                // initialState: undefined // Or provide a default if needed
            });            this.forms.set(formId, newForm);
            console.log(`FormEngine: Form instance created: ${formId}`);

            // --- Emit Success Verb ---
            this.emitVerb(FormEngineVerbs.FORM_INSTANTIATED, {
                originalVerbId: originatingVerbId,
                formId: formId,
                definitionName: definition.name,
            }, verb.metadata?.correlationId, verb.metadata?.contextId);

            // --- Orchestration: Request Context Creation ---
            if (contextOptions && Array.isArray(contextOptions)) {
                for (const ctxOpt of contextOptions) {
                     console.log(`FormEngine: Requesting context creation for form ${formId}`);
                     this.emitVerb(
                        FormEngineVerbs.REQUEST_CONTEXT_CREATION_FOR_FORM, // Directed at ContextEngine
                        {
                            formId: formId,
                            name: ctxOpt.name || `${definition.name} Context`,
                            type: ctxOpt.type || 'standard',
                            parentId: ctxOpt.parentId,
                            metadata: { ...(ctxOpt.metadata || {}), associatedForm: formId },
                            autoActivate: ctxOpt.autoActivate ?? true,
                            // Add other context options as needed
                        },
                        verb.metadata?.correlationId, // Pass correlation ID
                        verb.metadata?.contextId
                     );
                }
            }

        } catch (error) {
            console.error(`FormEngine: Failed to instantiate form:`, error);
            this.emitVerb(FormEngineVerbs.FORM_INSTANTIATION_FAILED, {
                originalVerbId: originatingVerbId,
                reason: error instanceof Error ? error.message : String(error),
                definitionName: definition?.name,
            }, verb.metadata?.correlationId, verb.metadata?.contextId);
        }
    }

    private async handleDeletionRequest(verb: FormRelation): Promise<void> {
        // ... (existing handleDeletionRequest method) ...
        console.log(`FormEngine handling verb: ${verb.subtype} (ID: ${verb.id})`);
        const { formId } = verb.content || {};
        const originatingVerbId = verb.id;

        if (!formId) {
             console.error(`FormEngine: Missing formId in ${verb.subtype} request.`);
             // Maybe emit failure?
             return;
        }

        if (this.forms.has(formId)) {
            // --- Perform cleanup ---
            // TODO: Emit verbs to request deletion of associated contexts, entities, etc.
            // Example:
            // this.emitVerb('contextEngine:requestDeletionForForm', { formId }, originatingVerbId, verb.metadata?.contextId);

            this.forms.delete(formId);
            console.log(`FormEngine: Form instance deleted: ${formId}`);

            // --- Emit Success Verb ---
            this.emitVerb(FormEngineVerbs.FORM_DELETED, {
                originalVerbId: originatingVerbId,
                formId: formId,
            }, originatingVerbId, verb.metadata?.contextId);

        } else {
            console.warn(`FormEngine: Form ${formId} not found for deletion.`);
            // Maybe emit failure?
        }
    }


    // --- Helper Methods ---

    /**
     * Helper to emit verbs from this engine. Includes correlationId.
     */
    private emitVerb(
        subtype: string,
        content: Record<string, any>,
        correlationId?: FormRelationId, // Use originating verb ID for correlation
        contextId?: string,
        target?: FormEntity
    ): void {
        const metadata: Record<string, any> = {};
        if (contextId) {
            metadata.contextId = contextId;
        }
        if (correlationId) {
            metadata.correlationId = correlationId; // Add correlation ID
        }

        if (target) {
            FormRelation.send(this.engineEntity, target, subtype, content, metadata);
        } else {
            FormRelation.emit(this.engineEntity, subtype, content, metadata);
        }
    }


    /**
     * Get a managed Form instance (primarily for internal use or debugging).
     */
    getFormInstance(formId: string): Form | undefined {
        return this.forms.get(formId);
    }
}

// Instantiate the engine (singleton or managed)
export const formEngine = new FormEngine();