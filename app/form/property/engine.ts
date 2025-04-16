import { FormRelation, FormRelationId } from "@/form/relation/relation";
import { FormEntity, FormEntityId } from "@/form/entity/entity";

// --- Define Property Engine Verb Subtypes (Tokens) ---
// Central definition for the PropertyEngine
export const PropertyEngineVerbs = {
    // Property Lifecycle & Value Verbs (Requests)
    REQUEST_CREATE: 'propertyEngine:requestCreate',
    REQUEST_SET: 'propertyEngine:requestSet',
    REQUEST_GET: 'propertyEngine:requestGet',
    REQUEST_GET_ALL: 'propertyEngine:requestGetAll',
    REQUEST_DELETE: 'propertyEngine:requestDelete',
    REQUEST_GET_HISTORY: 'propertyEngine:requestGetHistory',

    // Property Lifecycle & Value Verbs (Responses)
    VALUE_SET: 'propertyEngine:valueSet',
    VALUE_RESULT: 'propertyEngine:valueResult',
    ALL_VALUES_RESULT: 'propertyEngine:allValuesResult',
    CREATED: 'propertyEngine:created',
    DELETED: 'propertyEngine:deleted',

    HISTORY_RESULT: 'propertyEngine:historyResult',

    // Derived Property Verbs (Requests)
    REQUEST_DEFINE_DERIVED: 'propertyEngine:requestDefineDerived',

    // Derived Property Verbs (Responses)
    DERIVED_DEFINED: 'propertyEngine:derivedDefined',

    // Validation & Propagation Verbs (Requests)
    REQUEST_VALIDATE: 'propertyEngine:requestValidate',
    REQUEST_PROPAGATE: 'propertyEngine:requestPropagate',

    // Validation & Propagation Verbs (Responses)
    VALIDATION_RESULT: 'propertyEngine:validationResult',
    PROPAGATION_RESULT: 'propertyEngine:propagationResult',

    // General Failure Response
    OPERATION_FAILED: 'propertyEngine:operationFailed',
};
// --- End Verb Definitions ---


// --- Data Structures for Property Storage (Example) ---
// How properties are stored is crucial. This is a simplified example.
// A more robust solution might involve dedicated classes or a database schema.

// Represents the value and metadata for a single property instance
interface PropertyInstance {
    value: any;
    timestamp: number;
    // Add source, transactionId, etc. if needed
}

// Represents the definition of a derived property
interface DerivedPropertyDefinition {
    dependencies: string[]; // Names of properties this depends on
    derivation: string; // Logic/function to calculate the value (e.g., serialized function, rule ID)
    // Add caching strategy, etc.
}

// Key for storing property data (Context + Target + PropertyName)
type PropertyKey = `${string}:${string}:${string}`; // e.g., "ctx123:ent456:name" or "ctx123:rel789:weight"

export class PropertyEngine {
    private engineEntity: FormEntity;
    private verbSubscription: { unsubscribe: () => void } | null = null;

    // --- Storage (Example In-Memory) ---
    // Stores current values: Map<PropertyKey, PropertyInstance>
    private propertyValues: Map<PropertyKey, PropertyInstance> = new Map();
    // Stores historical values: Map<PropertyKey, PropertyInstance[]>
    private propertyHistory: Map<PropertyKey, PropertyInstance[]> = new Map();
    // Stores derived property definitions: Map<PropertyKey, DerivedPropertyDefinition>
    private derivedDefinitions: Map<PropertyKey, DerivedPropertyDefinition> = new Map();
    // --- End Storage ---

    constructor(engineId: string = 'property-engine:default') {
        this.engineEntity = FormEntity.findOrCreate({ id: engineId, type: 'System::PropertyEngine' });
        console.log(`PropertyEngine (${this.engineEntity.id}) initialized.`);
    }

    /**
     * Start listening for relevant verbs.
     */
    start(): void {
        if (this.verbSubscription) {
            console.warn(`PropertyEngine (${this.engineEntity.id}) is already listening.`);
            return;
        }
        console.log(`PropertyEngine (${this.engineEntity.id}) starting to listen...`);

        this.verbSubscription = FormRelation.subscribeToVerbs((propertyVerb) => {
            if ((propertyVerb.type === 'event' || propertyVerb.type === 'message') &&
                propertyVerb.subtype?.startsWith('propertyEngine:'))
             {
                console.log(`PropertyEngine received verb: ${propertyVerb.subtype}`);
                switch (propertyVerb.subtype) {
                    case PropertyEngineVerbs.REQUEST_CREATE: // *** USE REQUEST_CREATE ***
                        this.handlePropertyCreateRequest(propertyVerb); // Rename handler if desired
                        break;                    case PropertyEngineVerbs.REQUEST_SET:
                        this.handleSetRequest(propertyVerb);
                        break;
                    case PropertyEngineVerbs.REQUEST_GET:
                        this.handleGetRequest(propertyVerb);
                        break;
                    case PropertyEngineVerbs.REQUEST_GET_ALL:
                        this.handleGetAllRequest(propertyVerb);
                        break;
                    case PropertyEngineVerbs.REQUEST_DELETE:
                        this.handleDeleteRequest(propertyVerb);
                        break;
                    case PropertyEngineVerbs.REQUEST_GET_HISTORY:
                        this.handleGetHistoryRequest(propertyVerb);
                        break;
                    case PropertyEngineVerbs.REQUEST_DEFINE_DERIVED:
                        this.handleDefineDerivedRequest(propertyVerb);
                        break;
                    case PropertyEngineVerbs.REQUEST_VALIDATE:
                        this.handleValidateRequest(propertyVerb);
                        break;
                    case PropertyEngineVerbs.REQUEST_PROPAGATE:
                        this.handlePropagateRequest(propertyVerb);
                        break;
                    default:
                        console.debug(`PropertyEngine ignoring verb: ${propertyVerb.subtype}`);
                        break;
                }
            }
            // TODO: Listen for relevant events from other engines?
            // e.g., ContextDeleted, EntityDeleted to clean up properties?
            // e.g., DependencyValueChanged to trigger derived property recalculation?
        });
    }

    /**
     * Stop listening for verbs.
     */
    stop(): void {
        if (this.verbSubscription) {
            console.log(`PropertyEngine (${this.engineEntity.id}) stopping listening.`);
            this.verbSubscription.unsubscribe();
            this.verbSubscription = null;
        }
    }

    // --- Property Handling Methods ---

    private generateKey(contextId: string, targetId: string, propertyName: string): PropertyKey {
        return `${contextId}:${targetId}:${propertyName}`;
    }

    // Ensure the handler function exists and emits CREATED
    private handlePropertyCreateRequest(verb: FormRelation): void {
        const originatingVerbId = verb.id;
        const propertyData = verb.content;

        try {
            // --- Validation ---
            if (!propertyData || !propertyData.id || !propertyData.name || !propertyData.propertyType) {
                throw new Error("Missing required fields (id, name, propertyType) for property creation.");
            }
            if (this.propertyValues.has(propertyData.id)) {
                 throw new Error(`Property with ID ${propertyData.id} already exists.`);
            }

            // --- Create and Store ---
            // Add timestamps (simple version)
            const now = Date.now();
            const storedData = {
                ...propertyData,
                metadata: {
                    ...(propertyData.metadata || {}),
                    created: now,
                    updated: now,
                }
            };
            this.propertyValues.set(propertyData.id, storedData);
            console.log(`PropertyEngine: Property stored: ${propertyData.id} (Name: ${propertyData.name})`);

            // --- Emit Success ---
            this.emitVerb(PropertyEngineVerbs.CREATED, { // *** EMIT CREATED ***
                originalVerbId: originatingVerbId,
                property: storedData, // Send back the stored data
            }, originatingVerbId, propertyData.contextId);

        } catch (error) {
            this.emitOperationFailed(originatingVerbId, error, propertyData?.contextId, propertyData?.id);
        }
    }

    private async handleSetRequest(verb: FormRelation): Promise<void> {
        const { contextId, targetId, propertyName, value, options } = verb.content || {};
        const originatingVerbId = verb.id;

        if (!contextId || !targetId || !propertyName) {
            this.emitOperationFailed(originatingVerbId, "Missing contextId, targetId, or propertyName", contextId);
            return;
        }

        const key = this.generateKey(contextId, targetId, propertyName);

        // Check if setting a derived property directly (usually disallowed)
        if (this.derivedDefinitions.has(key)) {
            this.emitOperationFailed(originatingVerbId, `Cannot directly set derived property: ${propertyName}`, contextId, { targetId, propertyName });
            return;
        }

        try {
            const now = Date.now();
            const newInstance: PropertyInstance = { value, timestamp: now };
            const previousInstance = this.propertyValues.get(key);

            // Persistence Step 1: Update in-memory store
            this.propertyValues.set(key, newInstance);

            // Add to history
            const history = this.propertyHistory.get(key) || [];
            history.push(newInstance);
            this.propertyHistory.set(key, history);

            // Persistence Step 2: Save current value and history entry to database
            // await this.database.savePropertyValue(key, newInstance);
            // await this.database.addPropertyHistory(key, newInstance);

            console.log(`PropertyEngine: Set ${key} =`, value);

            this.emitVerb(PropertyEngineVerbs.VALUE_SET, {
                originalVerbId: originatingVerbId,
                contextId,
                targetId,
                propertyName,
                value: newInstance.value,
                timestamp: newInstance.timestamp,
                previousValue: previousInstance?.value, // Include previous value if available
            }, originatingVerbId, contextId);

            // TODO: Trigger dependent derived property updates?
            // TODO: Trigger propagation if configured?

        } catch (error) {
            this.emitOperationFailed(originatingVerbId, error, contextId, { targetId, propertyName });
        }
    }

    private async handleGetRequest(verb: FormRelation): Promise<void> {
        const { contextId, targetId, propertyName, options } = verb.content || {};
        const originatingVerbId = verb.id;

        if (!contextId || !targetId || !propertyName) {
            this.emitOperationFailed(originatingVerbId, "Missing contextId, targetId, or propertyName", contextId);
            return;
        }

        const key = this.generateKey(contextId, targetId, propertyName);

        try {
            let resultInstance: PropertyInstance | undefined;

            // Check if it's a derived property
            const derivedDef = this.derivedDefinitions.get(key);
            if (derivedDef) {
                // --- Derived Property Calculation ---
                // 1. Get dependency values (might require emitting REQUEST_GET back to self or other engines)
                const dependencyValues = {}; // Placeholder
                // for (const depName of derivedDef.dependencies) {
                //    const depKey = this.generateKey(contextId, targetId, depName);
                //    dependencyValues[depName] = await this.getPropertyValueInternal(depKey); // Internal fetch
                // }

                // 2. Execute derivation logic (placeholder)
                // const calculatedValue = executeDerivation(derivedDef.derivation, dependencyValues);
                const calculatedValue = `derived_value_for_${propertyName}`; // Placeholder

                // 3. Create a temporary instance (don't store derived values directly)
                resultInstance = { value: calculatedValue, timestamp: Date.now() }; // Timestamp reflects calculation time
                console.log(`PropertyEngine: Calculated derived ${key} =`, calculatedValue);

            } else {
                // --- Direct Property Fetch ---
                // Persistence Step: Retrieve from memory/cache or database
                resultInstance = this.propertyValues.get(key);
                // if (!resultInstance) {
                //    resultInstance = await this.database.getPropertyValue(key);
                //    if (resultInstance) this.propertyValues.set(key, resultInstance); // Cache
                // }
                console.log(`PropertyEngine: Get ${key} =`, resultInstance?.value);
            }

            this.emitVerb(PropertyEngineVerbs.VALUE_RESULT, {
                originalVerbId: originatingVerbId,
                contextId,
                targetId,
                propertyName,
                value: resultInstance?.value, // Undefined if not found/calculated
                timestamp: resultInstance?.timestamp,
            }, originatingVerbId, contextId);

        } catch (error) {
            this.emitOperationFailed(originatingVerbId, error, contextId, { targetId, propertyName });
        }
    }

    private async handleGetAllRequest(verb: FormRelation): Promise<void> {
        const { contextId, targetId, options } = verb.content || {};
        const originatingVerbId = verb.id;

        if (!contextId || !targetId) {
            this.emitOperationFailed(originatingVerbId, "Missing contextId or targetId", contextId);
            return;
        }

        try {
            const allValues: Record<string, any> = {};
            const prefix = `${contextId}:${targetId}:`;

            // Persistence Step: Query database for all properties matching prefix
            // const dbProperties = await this.database.getAllPropertiesForTarget(contextId, targetId);
            // Merge dbProperties into allValues

            // In-memory version: Iterate through maps
            for (const [key, instance] of this.propertyValues.entries()) {
                if (key.startsWith(prefix)) {
                    const propName = key.substring(prefix.length);
                    allValues[propName] = instance.value;
                }
            }
            // Include derived properties (requires calculation)
            for (const [key, derivedDef] of this.derivedDefinitions.entries()) {
                 if (key.startsWith(prefix)) {
                    const propName = key.substring(prefix.length);
                    // TODO: Calculate derived value (similar to handleGetRequest)
                    allValues[propName] = `derived_value_for_${propName}`; // Placeholder
                 }
            }


            this.emitVerb(PropertyEngineVerbs.ALL_VALUES_RESULT, {
                originalVerbId: originatingVerbId,
                contextId,
                targetId,
                values: allValues,
            }, originatingVerbId, contextId);

        } catch (error) {
            this.emitOperationFailed(originatingVerbId, error, contextId, { targetId });
        }
    }

    private async handleDeleteRequest(verb: FormRelation): Promise<void> {
        const { contextId, targetId, propertyName, options } = verb.content || {};
        const originatingVerbId = verb.id;

        if (!contextId || !targetId || !propertyName) {
            this.emitOperationFailed(originatingVerbId, "Missing contextId, targetId, or propertyName", contextId);
            return;
        }

        const key = this.generateKey(contextId, targetId, propertyName);

        try {
            let deleted = false;
            let wasDerived = false;

            // Persistence Step 1: Delete from database (current value, definition, history?)
            // await this.database.deletePropertyValue(key);
            // if (options?.deleteAllHistory) await this.database.deletePropertyHistory(key);
            // await this.database.deleteDerivedDefinition(key);

            // Delete from memory
            if (this.propertyValues.delete(key)) {
                deleted = true;
            }
            if (this.derivedDefinitions.delete(key)) {
                 deleted = true; // Considered deleted even if only definition existed
                 wasDerived = true;
            }
            if (options?.deleteAllHistory) {
                this.propertyHistory.delete(key);
            } else if (deleted && !wasDerived) {
                // Optionally add a 'deleted' marker to history instead of removing value?
                const now = Date.now();
                const history = this.propertyHistory.get(key) || [];
                history.push({ value: undefined, timestamp: now }); // Mark deletion
                this.propertyHistory.set(key, history);
                // await this.database.addPropertyHistory(key, { value: undefined, timestamp: now });
            }


            if (deleted) {
                console.log(`PropertyEngine: Deleted ${key}`);
                this.emitVerb(PropertyEngineVerbs.DELETED, {
                    originalVerbId: originatingVerbId,
                    contextId,
                    targetId,
                    propertyName,
                    status: 'deleted',
                    wasDerived: wasDerived,
                }, originatingVerbId, contextId);
            } else {
                 console.log(`PropertyEngine: Delete requested for ${key}, but not found.`);
                 this.emitVerb(PropertyEngineVerbs.DELETED, {
                    originalVerbId: originatingVerbId,
                    contextId,
                    targetId,
                    propertyName,
                    status: 'notFound',
                }, originatingVerbId, contextId);
            }

            // TODO: Trigger dependent derived property updates?

        } catch (error) {
            this.emitOperationFailed(originatingVerbId, error, contextId, { targetId, propertyName });
        }
    }

    private async handleGetHistoryRequest(verb: FormRelation): Promise<void> {
        const { contextId, targetId, propertyName, options } = verb.content || {};
        const originatingVerbId = verb.id;

         if (!contextId || !targetId || !propertyName) {
            this.emitOperationFailed(originatingVerbId, "Missing contextId, targetId, or propertyName", contextId);
            return;
        }
        const key = this.generateKey(contextId, targetId, propertyName);

        try {
            // Persistence Step: Retrieve history from database, applying options
            // let history = await this.database.getPropertyHistory(key, options);

            // In-memory version:
            let history = this.propertyHistory.get(key) || [];
            // Apply basic filtering (example)
            if (options?.startTime) history = history.filter(h => h.timestamp >= options.startTime);
            if (options?.endTime) history = history.filter(h => h.timestamp <= options.endTime);
            if (options?.limit) history = history.slice(-options.limit); // Get latest N


            this.emitVerb(PropertyEngineVerbs.HISTORY_RESULT, {
                originalVerbId: originatingVerbId,
                contextId,
                targetId,
                propertyName,
                history: history,
            }, originatingVerbId, contextId);

        } catch (error) {
            this.emitOperationFailed(originatingVerbId, error, contextId, { targetId, propertyName });
        }
    }

    private async handleDefineDerivedRequest(verb: FormRelation): Promise<void> {
        const { contextId, targetId, propertyName, definition, options } = verb.content || {};
        const originatingVerbId = verb.id;

        if (!contextId || !targetId || !propertyName || !definition) {
            this.emitOperationFailed(originatingVerbId, "Missing contextId, targetId, propertyName, or definition", contextId);
            return;
        }
        const key = this.generateKey(contextId, targetId, propertyName);

        // Check if trying to define over an existing direct property
        if (this.propertyValues.has(key)) {
             this.emitOperationFailed(originatingVerbId, `Cannot define derived property over existing direct property: ${propertyName}`, contextId, { targetId, propertyName });
             return;
        }

        try {
            const derivedDef: DerivedPropertyDefinition = {
                dependencies: definition.dependencies || [],
                derivation: definition.derivation,
            };

            // Persistence Step 1: Save definition to database
            // await this.database.saveDerivedDefinition(key, derivedDef);

            // Save definition in memory
            this.derivedDefinitions.set(key, derivedDef);

            console.log(`PropertyEngine: Defined derived property ${key}`);

            this.emitVerb(PropertyEngineVerbs.DERIVED_DEFINED, {
                originalVerbId: originatingVerbId,
                contextId,
                targetId,
                propertyName,
                definition: derivedDef,
            }, originatingVerbId, contextId);

            // TODO: Set up listeners for dependency changes?

        } catch (error) {
            this.emitOperationFailed(originatingVerbId, error, contextId, { targetId, propertyName });
        }
    }

    private async handleValidateRequest(verb: FormRelation): Promise<void> {
        const { contextId, targetId, propertyName, rules, options } = verb.content || {};
        const originatingVerbId = verb.id;

        if (!contextId || !targetId || !propertyName || !rules) {
            this.emitOperationFailed(originatingVerbId, "Missing contextId, targetId, propertyName, or rules", contextId);
            return;
        }

        try {
            // 1. Get the current value (might be derived)
            // This could involve emitting REQUEST_GET internally or calling a private method
            const key = this.generateKey(contextId, targetId, propertyName);
            const instance = this.propertyValues.get(key); // Simplified: Get direct value for now
            const currentValue = instance?.value;
            // const currentValue = await this.getPropertyValueInternal(key); // More robust

            // 2. Apply validation rules (placeholder logic)
            let isValid = true;
            const errors: string[] = [];
            for (const rule of rules) {
                // const validatorFn = getValidator(rule.validator); // Lookup validator function/logic
                // if (!validatorFn(currentValue, rule.options)) {
                //    isValid = false;
                //    errors.push(`Validation failed for rule: ${rule.ruleName}`);
                // }
                if (rule.validationType === 'required' && (currentValue === undefined || currentValue === null || currentValue === '')) {
                    isValid = false;
                    errors.push(`${propertyName} is required.`);
                }
                // Add more complex rule execution
            }

            console.log(`PropertyEngine: Validation result for ${key}: ${isValid}`);

            this.emitVerb(PropertyEngineVerbs.VALIDATION_RESULT, {
                originalVerbId: originatingVerbId,
                contextId,
                targetId,
                propertyName,
                value: currentValue,
                isValid: isValid,
                errors: errors,
            }, originatingVerbId, contextId);

        } catch (error) {
            this.emitOperationFailed(originatingVerbId, error, contextId, { targetId, propertyName });
        }
    }

    private async handlePropagateRequest(verb: FormRelation): Promise<void> {
        const { contextId, sourceEntityId, propertyName, relationType, transformer, options } = verb.content || {};
        const originatingVerbId = verb.id;

        if (!contextId || !sourceEntityId || !propertyName || !relationType) {
            this.emitOperationFailed(originatingVerbId, "Missing contextId, sourceEntityId, propertyName, or relationType", contextId);
            return;
        }

        try {
            // --- Complex Operation ---
            // 1. Get the source value
            const sourceKey = this.generateKey(contextId, sourceEntityId, propertyName);
            const sourceInstance = this.propertyValues.get(sourceKey); // Simplified
            const sourceValue = sourceInstance?.value;
            // const sourceValue = await this.getPropertyValueInternal(sourceKey); // Robust

            if (sourceValue === undefined) {
                 this.emitOperationFailed(originatingVerbId, `Source property ${propertyName} not found for propagation`, contextId, { targetId: sourceEntityId, propertyName });
                 return;
            }

            // 2. Find related entities (Requires RelationEngine interaction)
            // Emit RelationEngineVerbs.REQUEST_GET_RELATED
            // Need to await the RelationEngineVerbs.GET_RELATED_RESULT response
            console.warn("PropertyEngine: Propagation requires interaction with RelationEngine (Not Implemented)");
            const relatedEntityIds: FormEntityId[] = []; // Placeholder

            // 3. For each related entity:
            let affectedCount = 0;
            for (const targetEntityId of relatedEntityIds) {
                // a. Apply transformer (placeholder)
                // const targetValue = applyTransformer(transformer, sourceValue);
                const targetValue = sourceValue; // Placeholder

                // b. Emit REQUEST_SET for the target entity/property
                // Use emitVerb to send a *new* request, don't call handleSetRequest directly
                this.emitVerb(PropertyEngineVerbs.REQUEST_SET, {
                    contextId,
                    targetId: targetEntityId,
                    propertyName, // Assuming same property name for now
                    value: targetValue,
                    options: { targetType: 'entity' },
                    // Add metadata indicating this set is due to propagation?
                    _propagationSource: {
                        originalVerbId: originatingVerbId,
                        sourceEntityId: sourceEntityId,
                    }
                },
                undefined, // No specific correlation ID needed for the *new* set request
                contextId);
                affectedCount++;
            }

            console.log(`PropertyEngine: Propagation requested for ${propertyName} from ${sourceEntityId}. Triggered ${affectedCount} updates.`);

            // Emit a summary result
            this.emitVerb(PropertyEngineVerbs.PROPAGATION_RESULT, {
                originalVerbId: originatingVerbId,
                contextId,
                sourceEntityId,
                propertyName,
                relationType,
                status: 'triggered', // Or 'completed' if waiting for all sets? Complex.
                affectedCount: affectedCount,
            }, originatingVerbId, contextId);

        } catch (error) {
            this.emitOperationFailed(originatingVerbId, error, contextId, { targetId: sourceEntityId, propertyName });
        }
    }


    // --- Helper Methods ---

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
        details: Record<string, any> = {} // e.g., { targetId, propertyName }
    ): void {
        const reason = error instanceof Error ? error.message : String(error);
        console.error(`PropertyEngine: Operation failed (correlation: ${originatingVerbId}):`, reason, details);
        this.emitVerb(PropertyEngineVerbs.OPERATION_FAILED, {
            originalVerbId: originatingVerbId,
            reason: reason,
            contextId: contextId,
            ...details,
        }, originatingVerbId, contextId);
    }
}

// Instantiate the engine (singleton or managed)
export const propertyEngine = new PropertyEngine();