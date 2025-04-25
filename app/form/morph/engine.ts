import { FormRelation } from "@/form/relation/relation";
import { FormEntity } from "@/form/entity/entity";
import { FormMorph } from "../morph/core"; // Assuming morph definitions are based on these
import { FormExecutionContext, Sandarbha } from "../schema/context"; // Need context types
import { contextEngine } from "../context/engine"; // To get context instances

// --- Define Morph Engine Verb Subtypes (Tokens) ---
export const MorphEngineVerbs = {
  // Verbs the MorphEngine listens for
  REQUEST_EXECUTION: "morphEngine:requestExecution",
  REGISTER_DEFINITION: "morphEngine:registerDefinition", // Verb to register a morph programmatically

  // Verbs the MorphEngine emits
  EXECUTION_STARTED: "morphEngine:executionStarted",
  EXECUTION_COMPLETED: "morphEngine:executionCompleted",
  EXECUTION_FAILED: "morphEngine:executionFailed",
  DEFINITION_REGISTERED: "morphEngine:definitionRegistered",
  DEFINITION_REGISTRATION_FAILED: "morphEngine:definitionRegistrationFailed",
  // Verbs emitted for orchestration (directed at other engines)
  REQUEST_CONTEXT_CREATION: "contextEngine:requestCreation",
  REQUEST_CONTEXT_EXECUTION: "contextEngine:requestExecution",
};
// --- End Verb Definitions ---

// Placeholder for getting a system entity to be the source of engine verbs
const getEngineSourceEntity = (): FormEntity => {
  // Assuming FormEntity.findOrCreate exists or is added
  return FormEntity.findOrCreate({
    id: "system:morphEngine",
    type: "System::MorphEngine",
  });
};

/**
 * MorphEngine - Manages the registration and execution of FormMorph instances.
 */
export class MorphEngine {
  private engineEntity: FormEntity;
  private morphDefinitions: Map<string, FormMorph<any, any>> = new Map(); // Store registered morphs by name/ID
  private verbSubscription: { unsubscribe: () => void } | null = null;
  // TODO: Add tracking for active long-running executions if needed

  constructor(engineId: string = "morph-engine:default") {
    this.engineEntity = FormEntity.findOrCreate({
      id: engineId,
      type: "System::MorphEngine",
    });
    console.log(`MorphEngine (${this.engineEntity.id}) initialized.`);
  }

  /**
   * Start listening for relevant verbs using FormRelation.subscribeToVerbs.
   */
  start(): void {
    if (this.verbSubscription) {
      console.warn(
        `MorphEngine (${this.engineEntity.id}) is already listening.`
      );
      return;
    }
    console.log(
      `MorphEngine (${this.engineEntity.id}) starting to listen for relation verbs...`
    );

    this.verbSubscription = FormRelation.subscribeToVerbs((relationVerb) => {
      if (relationVerb.type === "event" || relationVerb.type === "message") {
        // Route based on subtype
        switch (relationVerb.subtype) {
          case MorphEngineVerbs.REQUEST_EXECUTION:
            this.handleExecutionRequest(relationVerb);
            break;
          case MorphEngineVerbs.REGISTER_DEFINITION:
            this.handleRegisterDefinition(relationVerb);
            break;
          // Add cases for other verbs this engine should handle
          // e.g., listening for context creation confirmations if needed for complex workflows
          default:
            // console.debug(`MorphEngine ignoring verb: ${relationVerb.subtype}`);
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
      console.log(`MorphEngine (${this.engineEntity.id}) stopping listening.`);
      this.verbSubscription.unsubscribe();
      this.verbSubscription = null;
    }
  }

  /**
   * Register a FormMorph definition directly with the engine.
   * Prefer using the REGISTER_DEFINITION verb for consistency.
   */
  registerMorphDirectly(morph: FormMorph<any, any>): boolean {
    if (!morph.name) {
      console.error("MorphEngine: Cannot register morph without a name.");
      return false;
    }
    if (this.morphDefinitions.has(morph.name)) {
      console.warn(
        `MorphEngine: Overwriting existing morph definition for '${morph.name}'.`
      );
    }
    this.morphDefinitions.set(morph.name, morph);
    console.log(
      `MorphEngine: Morph definition '${morph.name}' registered directly.`
    );
    return true;
  }

  /**
   * Handle requests to register a morph definition via verb.
   */
  private handleRegisterDefinition(verb: FormRelation): void {
    const {
      name,
      definition /* Assuming definition contains necessary info */,
    } = verb.content || {};
    const originatingVerbId = verb.id;

    if (!name || !definition) {
      console.error(
        `MorphEngine: Missing name or definition in ${verb.subtype} request.`
      );
      this.emitVerb(MorphEngineVerbs.DEFINITION_REGISTRATION_FAILED, {
        originalVerbId: originatingVerbId,
        reason: "Missing name or definition",
      });
      return;
    }

    try {
      // TODO: Reconstruct the FormMorph instance from the definition payload
      // This is complex and depends heavily on how morphs are serialized/defined.
      // For now, let's assume a simple case where definition IS the morph instance
      // or we have a factory. Using a placeholder:
      const morphInstance = this.reconstructMorph(name, definition); // Placeholder

      if (this.morphDefinitions.has(name)) {
        console.warn(
          `MorphEngine: Overwriting existing morph definition for '${name}' via verb.`
        );
      }
      this.morphDefinitions.set(name, morphInstance);
      console.log(
        `MorphEngine: Morph definition '${name}' registered via verb.`
      );

      this.emitVerb(MorphEngineVerbs.DEFINITION_REGISTERED, {
        name: name,
        originalVerbId: originatingVerbId,
      });
    } catch (error) {
      console.error(
        `MorphEngine: Failed to register morph definition '${name}':`,
        error
      );
      this.emitVerb(MorphEngineVerbs.DEFINITION_REGISTRATION_FAILED, {
        name: name,
        originalVerbId: originatingVerbId,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Placeholder for morph reconstruction - needs actual implementation
  private reconstructMorph(name: string, definition: any): FormMorph<any, any> {
    console.warn(
      `MorphEngine: reconstructMorph is a placeholder. Assuming definition is usable.`
    );
    // In reality, this would involve checking definition type, calling constructors, etc.
    // Example: if (definition.type === 'SimpleMorph') return new SimpleMorph(...)
    if (typeof definition?.apply === "function" && definition.name === name) {
      return definition as FormMorph<any, any>; // Simplistic assumption
    }
    throw new Error(
      `Cannot reconstruct morph '${name}' from provided definition.`
    );
  }

  /**
   * Handle requests to execute a morph.
   */
  private async handleExecutionRequest(verb: FormRelation): Promise<void> {
    console.log(`MorphEngine handling verb: ${verb.subtype} (ID: ${verb.id})`);
    const {
      morphName,
      inputData,
      contextId, // ID of an *existing* context to use
      // contextOptions, // TODO: Handle creating a context if needed
    } = verb.content || {};
    const originatingVerbId = verb.id;

    if (!morphName) {
      console.error(
        `MorphEngine: Missing morphName in ${verb.subtype} request.`
      );
      this.emitVerb(MorphEngineVerbs.EXECUTION_FAILED, {
        originalVerbId: originatingVerbId,
        reason: "Missing morphName",
      });
      return;
    }

    const morph = this.morphDefinitions.get(morphName);
    if (!morph) {
      console.error(`MorphEngine: Morph definition '${morphName}' not found.`);
      this.emitVerb(MorphEngineVerbs.EXECUTION_FAILED, {
        morphName: morphName,
        originalVerbId: originatingVerbId,
        reason: `Morph definition '${morphName}' not found`,
      });
      return;
    }

    let executionContext: FormExecutionContext | null = null;
    try {
      // --- Get Execution Context ---
      // Simple case: Use provided contextId
      if (contextId) {
        // We need access to the actual Sandarbha instance, potentially via ContextEngine
        const sandarbhaInstance = contextEngine.getContextInstance(contextId); // Assumes direct access or getter
        if (!sandarbhaInstance) {
          throw new Error(
            `Execution context with ID '${contextId}' not found.`
          );
        }
        // TODO: Adapt Sandarbha instance to FormExecutionContext interface if necessary
        executionContext = sandarbhaInstance as unknown as FormExecutionContext; // Needs proper mapping/adapter
      } else {
        // TODO: Implement context creation if contextOptions are provided
        // This would involve emitting REQUEST_CONTEXT_CREATION and waiting for the response (complex)
        // For now, throw error or use a default temporary context
        console.warn(
          `MorphEngine: No contextId provided for morph '${morphName}'. Using default/temporary context (Not Implemented).`
        );
        // executionContext = createDefaultExecutionContext(); // Placeholder
        throw new Error(
          "Context creation from options not yet implemented in MorphEngine."
        );
      }

      // --- Emit Started Verb ---
      this.emitVerb(MorphEngineVerbs.EXECUTION_STARTED, {
        morphName: morphName,
        contextId: executionContext?.id, // Use the actual context ID
        originalVerbId: originatingVerbId,
      });

      // --- Execute Morph ---
      // Note: Morph execution might be synchronous or asynchronous depending on the morph itself
      const outputData = await Promise.resolve(
        morph.apply(inputData, executionContext)
      ); // Wrap in Promise.resolve for consistency

      // --- Emit Completed Verb ---
      this.emitVerb(MorphEngineVerbs.EXECUTION_COMPLETED, {
        morphName: morphName,
        contextId: executionContext?.id,
        originalVerbId: originatingVerbId,
        result: outputData, // Include the result
      });
    } catch (error) {
      console.error(
        `MorphEngine: Failed to execute morph '${morphName}':`,
        error
      );
      this.emitVerb(MorphEngineVerbs.EXECUTION_FAILED, {
        morphName: morphName,
        contextId: executionContext?.id || contextId, // Report context ID if available
        originalVerbId: originatingVerbId,
        reason: error instanceof Error ? error.message : String(error),
        inputData: inputData, // Optionally include input data for debugging
      });
    }
  }

  /**
   * Helper to emit verbs from this engine.
   */
  private emitVerb(
    subtype: string,
    content: Record<string, any>,
    target?: FormEntity
  ): void {
    const metadata: Record<string, any> = {};
    // Add correlation ID if available
    if (content.originalVerbId) {
      metadata.correlationId = content.originalVerbId;
    }
    // Add context ID if relevant and available
    if (content.contextId) {
      metadata.contextId = content.contextId;
    }

    if (target) {
      FormRelation.send(this.engineEntity, target, subtype, content, metadata);
    } else {
      FormRelation.emit(this.engineEntity, subtype, content, metadata);
    }
  }

  /**
   * Get a registered morph definition (for internal use or debugging).
   */
  getMorphDefinition(name: string): FormMorph<any, any> | undefined {
    return this.morphDefinitions.get(name);
  }
}

// Instantiate the engine (singleton or managed)
export const morphEngine = new MorphEngine();
