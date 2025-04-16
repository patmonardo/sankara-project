import { FormService } from './service';
import { FormDefinition } from '../schema/schema';
import { FormExecutionContext } from '../schema/context';
import { FormRelation } from '../relation/relation';
import { formEngine } from './engine';
import { entityEngine, EntityEngineVerbs } from '../entity/engine';
import { contextEngine, ContextEngineVerbs } from '../context/engine';
import { relationEngine, RelationEngineVerbs } from '../relation/engine';
import { propertyEngine, PropertyEngineVerbs } from '../property/engine';
import { morphEngine, MorphEngineVerbs } from '../morph/engine'; 
import { createEntity as createEntityService } from '../entity/service';
import { createRelation as createRelationService } from '../relation/service';
import { createProperty as createPropertyService } from '../property/service';
import { MorphService } from '../morph/service';
import { SimpleMorph } from '../morph/morph';

console.log("Starting Simple Command Runner (cmd.ts)...");

// 1. Define Sample Form Definition Placeholder (Conforming to Schema)
const sampleFormDefPlaceholder: FormDefinition = {
    id: 'def:sampleUser',
    name: 'Sample User Form',
    type: 'user',
    schema: { properties: { name: { type: 'string' }, email: { type: 'string' } } },
    entities: {},
    relations: {},
    contexts: {},
    tags: [],
    created: new Date(),
    updated: new Date(),
    category: 'Test',
    abstract: false,
    template: false,
    version: "1",
};

// --- Define expected completion/failure verbs ---
const CONTEXT_COMPLETION_VERB = ContextEngineVerbs.CONTEXT_ACTIVATED;
const ENTITY_COMPLETION_VERB = EntityEngineVerbs.CREATED;
const RELATION_COMPLETION_VERB = RelationEngineVerbs.CREATED; 
const PROPERTY_COMPLETION_VERB = PropertyEngineVerbs.CREATED; 
const MORPH_COMPLETION_VERB = MorphEngineVerbs.EXECUTION_COMPLETED; 

const FORM_FAILURE_VERB = 'formEngine:instantiationFailed'; // Keep specific for now
const CONTEXT_FAILURE_VERB = ContextEngineVerbs.OPERATION_FAILED;
const ENTITY_FAILURE_VERB = EntityEngineVerbs.OPERATION_FAILED;
const RELATION_FAILURE_VERB = RelationEngineVerbs.OPERATION_FAILED; 
const PROPERTY_FAILURE_VERB = PropertyEngineVerbs.OPERATION_FAILED; 
const MORPH_FAILURE_VERB = MorphEngineVerbs.EXECUTION_FAILED;       

// --- Completion Flags ---
let contextCompleted = false;
let entityCompleted = false;
let relationCompleted = false; 
let propertyCompleted = false; 
let morphCompleted = false;    
let activeContextId: string | null = null; // To store the context ID for morph execution

// 2. Setup Verb Listener
console.log("Setting up verb listener...");
const subscription = FormRelation.subscribeToVerbs((verb) => {
    console.log(`\n--- CMD Received Verb ---`);
    console.log(`  ID: ${verb.id}`);
    console.log(`  Subtype: ${verb.subtype}`);
    console.log(`  Source: ${verb.source?.id}`);
    console.log(`  Target: ${verb.target?.id || 'Broadcast'}`);
    console.log(`  Content:`, verb.content);
    console.log(`  Metadata:`, verb.metadata);
    console.log(`-------------------------\n`);

    // --- Updated Exit Condition ---
    // Track completion of all processes
    if (verb.subtype === CONTEXT_COMPLETION_VERB) {
        contextCompleted = true;
        activeContextId = verb.content?.contextId; // Capture context ID
        console.log(`>>> Context process completed. Active Context ID: ${activeContextId}`);
    }
    if (verb.subtype === ENTITY_COMPLETION_VERB) {
        entityCompleted = true;
        console.log(">>> Entity process completed.");
    }
    if (verb.subtype === RELATION_COMPLETION_VERB) { 
        relationCompleted = true;
        console.log(">>> Relation process completed.");
    }
    if (verb.subtype === PROPERTY_COMPLETION_VERB) { 
        propertyCompleted = true;
        console.log(">>> Property process completed.");
    }
    if (verb.subtype === MORPH_COMPLETION_VERB) {    
        morphCompleted = true;
        console.log(">>> Morph process completed. Result:", verb.content?.result);
    }

    // Check for failure
    const isFailure =
        verb.subtype === FORM_FAILURE_VERB ||
        verb.subtype === CONTEXT_FAILURE_VERB ||
        verb.subtype === ENTITY_FAILURE_VERB ||
        verb.subtype === RELATION_FAILURE_VERB || 
        verb.subtype === PROPERTY_FAILURE_VERB || 
        verb.subtype === MORPH_FAILURE_VERB;      

    // Exit if ALL succeeded OR if any failed
    const allSucceeded = contextCompleted && entityCompleted && relationCompleted && propertyCompleted && morphCompleted; // Updated check

    if (allSucceeded || isFailure) {
        const exitCode = isFailure ? 1 : 0;
        const reason = isFailure ? "failed" : "succeeded";
        console.log(`All processes ${reason}. Exiting.`);
        subscription.unsubscribe();
        formEngine.stop();
        contextEngine.stop();
        entityEngine.stop();
        relationEngine.stop(); 
        propertyEngine.stop(); 
        morphEngine.stop();    
        process.exit(exitCode);
    }
    // --- End Updated Exit Condition ---
});

// 3. Start Engines
console.log("Starting FormEngine listener...");
formEngine.start();
console.log("Starting ContextEngine listener...");
contextEngine.start();
console.log("Starting EntityEngine listener...");
entityEngine.start();
console.log("Starting RelationEngine listener..."); 
relationEngine.start();                           
console.log("Starting PropertyEngine listener..."); 
propertyEngine.start();                           
console.log("Starting MorphEngine listener...");    
morphEngine.start();                              

// --- Define a Simple Morph for Testing ---
const testMorph = new SimpleMorph<any, any>(
    'cmdTestMorph', // Name for registration
    (input: any, context: FormExecutionContext) => {
        console.log(`>>> SimpleMorph executing in context ${context?.id} with input:`, input);
        return { ...input, morphed: true, timestamp: Date.now() };
    },
    { pure: true, fusible: false, cost: 1 } // Example metadata
);

// --- Register Morph Directly with Engine ---
console.log(`Registering morph '${testMorph.name}' directly with MorphEngine...`);
morphEngine.registerMorphDirectly(testMorph); // Use direct registration

// 4. Trigger Operations via Services
console.log(`Requesting instantiation for form: ${sampleFormDefPlaceholder.name}`);
try {
    // --- Form Instantiation (triggers Context creation) ---
    FormService.instantiateForm(
        sampleFormDefPlaceholder,
        { name: 'Test User CMD Form', email: 'cmd-form@example.com' },
        [{ name: 'DefaultContext', type: 'standard', autoActivate: true }] // Request context creation
    );
    console.log("Instantiation requested via FormService. Waiting for events...");

    // --- Entity Creation ---
    const entityId = 'ent:cmd-user-1';
    console.log(`Requesting creation for entity: ${entityId}...`);
    createEntityService(
        'standaloneUser',
        { id: entityId, properties: { name: 'Test User CMD Entity', email: 'cmd-entity@example.com' } }
    );
    console.log("Entity creation requested via EntityService. Waiting for events...");

    // --- Property Creation ---
    const propertyId = 'prop:cmd-user-email';
    console.log(`Requesting creation for property: ${propertyId} for entity ${entityId}...`);
    createPropertyService(
        { // Using options object signature
            id: propertyId,
            entityId: entityId, // Link to the entity
            name: 'email',
            propertyType: 'quantitative',
            quantitative: { dataType: 'string' },
            staticValue: 'initial-cmd@example.com' // Example static value
        }
    );
    console.log("Property creation requested via PropertyService. Waiting for events...");

    // --- Relation Creation ---
    const relationId = 'rel:cmd-user-owns-email';
    console.log(`Requesting creation for relation: ${relationId} (${entityId} -> ${propertyId})...`);
    createRelationService(
        entityId,           // Source
        propertyId,         // Target
        'system:hasProperty', // Type
        { id: relationId } // Pass requested ID in options/content
    );
    console.log("Relation creation requested via RelationService. Waiting for events...");

    // --- Morph Execution (Trigger AFTER context is likely active) ---
    // We rely on the listener capturing activeContextId before this runs reliably
    // In a real app, might wait for CONTEXT_ACTIVATED before triggering morph
    setTimeout(() => {
        if (activeContextId) {
            console.log(`Requesting execution for morph '${testMorph.name}' in context ${activeContextId}...`);
            MorphService.requestExecution(
                testMorph.name,
                { initialData: "some input", value: 123 }, // Sample input
                { contextId: activeContextId } // Use the captured context ID
            );
            console.log("Morph execution requested via MorphService. Waiting for events...");
        } else {
            console.warn("Cannot request morph execution: Active context ID not captured yet.");
            // In this test script, we might need to mark morph as 'completed' if we can't run it
            // Or adjust the exit condition logic if morph execution is optional for success
            // For now, let's assume the timeout is long enough for context activation
        }
    }, 50); // Small delay to increase chance context is active

} catch (error: any) {
    console.error("Error during service calls:", error.message);
    subscription.unsubscribe();
    formEngine.stop();
    contextEngine.stop();
    entityEngine.stop();
    relationEngine.stop(); 
    propertyEngine.stop(); 
    morphEngine.stop();    
    process.exit(1);
}

// 5. Keep alive is handled by the listener exit logic now
console.log("Press Ctrl+C to force exit.");
