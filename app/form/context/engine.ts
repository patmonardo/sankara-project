import { v4 as uuidv4 } from "uuid";
import { FormEntity } from "../entity/entity";
import { FormRelation, FormRelationId } from "../relation/relation";

// --- Verb Definitions (Keep as is) ---
export const ContextEngineVerbs = {
  // ... requests ...
  REQUEST_CREATE: "contextEngine:requestCreation",
  REQUEST_ACTIVATION: "contextEngine:requestActivation",
  REQUEST_DEACTIVATION: "contextEngine:requestDeactivation",
  REQUEST_UPDATE: "contextEngine:requestUpdate", // Stub
  REQUEST_DELETION: "contextEngine:requestDeletion", // Stub
  REQUEST_ENTITY_REGISTRATION: "contextEngine:requestEntityRegistration", // Stub
  REQUEST_RELATION_REGISTRATION: "contextEngine:requestRelationRegistration", // Stub
  REQUEST_EXECUTION: "contextEngine:requestExecution", // Stub

  // ... responses ...
  CONTEXT_CREATED: "contextEngine:created",
  CONTEXT_ACTIVATED: "contextEngine:activated",
  CONTEXT_DEACTIVATED: "contextEngine:deactivated",
  CONTEXT_UPDATED: "contextEngine:updated", // Stub
  CONTEXT_DELETED: "contextEngine:deleted", // Stub
  ENTITY_REGISTERED: "contextEngine:entityRegistered", // Stub
  RELATION_REGISTERED: "contextEngine:relationRegistered", // Stub
  EXECUTION_COMPLETED: "contextEngine:executionCompleted", // Stub
  EXECUTION_FAILED: "contextEngine:executionFailed", // Stub
  OPERATION_FAILED: "contextEngine:operationFailed",
};
// --- End Verb Definitions ---

export class ContextEngine {
  private engineEntity: FormEntity;
  // Store basic context info, not necessarily full instances yet
  private contexts: Map<
    string,
    {
      id: string;
      name?: string;
      parentId?: string;
      formId?: string;
      isActive: boolean;
    }
  > = new Map();
  private activeContextId: string | null = null;
  private verbSubscription: { unsubscribe: () => void } | null = null;

  constructor(engineId: string = "context-engine:default") {
    this.engineEntity = FormEntity.findOrCreate({
      id: engineId,
      type: "System::ContextEngine",
    });
    console.log(`ContextEngine (${this.engineEntity.id}) initialized.`);
  }

  start(): void {
    if (this.verbSubscription) {
      console.warn(
        `ContextEngine (${this.engineEntity.id}) is already listening.`
      );
      return;
    }
    console.log(
      `ContextEngine (${this.engineEntity.id}) starting to listen...`
    );

    this.verbSubscription = FormRelation.subscribeToVerbs((relationVerb) => {
      if (relationVerb.subtype?.startsWith("contextEngine:")) {
        console.log(`ContextEngine received verb: ${relationVerb.subtype}`); // Log received verb
        switch (relationVerb.subtype) {
          case ContextEngineVerbs.REQUEST_CREATE:
            this.handleCreateContext(relationVerb);
            break;
          case ContextEngineVerbs.REQUEST_ACTIVATION:
            this.handleActivateContext(relationVerb);
            break;
          case ContextEngineVerbs.REQUEST_DEACTIVATION:
            this.handleDeactivateContext(relationVerb);
            break;
          // --- Stubbed Handlers ---
          case ContextEngineVerbs.REQUEST_UPDATE:
          case ContextEngineVerbs.REQUEST_DELETION:
          case ContextEngineVerbs.REQUEST_ENTITY_REGISTRATION:
          case ContextEngineVerbs.REQUEST_RELATION_REGISTRATION:
          case ContextEngineVerbs.REQUEST_EXECUTION:
            this.handleStubbedRequest(relationVerb);
            break;
          default:
            console.debug(
              `ContextEngine ignoring verb: ${relationVerb.subtype}`
            );
            break;
        }
      }
    });
  }

  stop(): void {
    if (this.verbSubscription) {
      console.log(
        `ContextEngine (${this.engineEntity.id}) stopping listening.`
      );
      this.verbSubscription.unsubscribe();
      this.verbSubscription = null;
    }
  }

  // --- Simplified Context Handling Methods ---

  private handleCreateContext(verb: FormRelation): void {
    const {
      id,
      name,
      type, // We ignore type for now
      parentId,
      metadata, // We ignore metadata for now
      autoActivate,
      formId,
      // Ignore execution-specific fields
    } = verb.content || {};
    const originatingVerbId = verb.id;

    try {
      const contextId = id || `ctx:${uuidv4()}`;
      if (this.contexts.has(contextId)) {
        throw new Error(`Context with ID ${contextId} already exists.`);
      }

      // Store basic info in memory
      const contextInfo = {
        id: contextId,
        name: name || `Context-${contextId}`,
        parentId,
        formId,
        isActive: false, // Will be set by activation
      };
      this.contexts.set(contextId, contextInfo);
      console.log(
        `ContextEngine: Context info stored: ${contextId} (Name: ${contextInfo.name})`
      );

      // Emit CREATED verb
      this.emitVerb(
        ContextEngineVerbs.CONTEXT_CREATED,
        {
          originalVerbId: originatingVerbId,
          context: contextInfo, // Send basic info
        },
        originatingVerbId,
        contextId
      );

      // Trigger activation if requested
      if (autoActivate) {
        console.log(`ContextEngine: Auto-activating context ${contextId}`);
        this.emitVerb(
          ContextEngineVerbs.REQUEST_ACTIVATION,
          { contextId },
          undefined, // No correlation needed for internal trigger? Or use originatingVerbId?
          contextId
        );
      }
    } catch (error) {
      this.emitOperationFailed(
        originatingVerbId,
        error,
        verb.metadata?.contextId
      );
    }
  }

  private handleActivateContext(verb: FormRelation): void {
    const { contextId } = verb.content || {};
    const originatingVerbId = verb.id;

    const contextInfo = this.contexts.get(contextId);
    if (!contextInfo) {
      this.emitOperationFailed(
        originatingVerbId,
        `Context ${contextId} not found for activation`,
        contextId
      );
      return;
    }

    try {
      // Deactivate current active context if different
      if (this.activeContextId && this.activeContextId !== contextId) {
        const currentActiveInfo = this.contexts.get(this.activeContextId);
        if (currentActiveInfo) {
          currentActiveInfo.isActive = false; // Update state
          console.log(
            `ContextEngine: Deactivating previous context ${this.activeContextId}`
          );
          this.emitVerb(
            ContextEngineVerbs.CONTEXT_DEACTIVATED,
            {
              contextId: this.activeContextId,
              reason: "New context activated",
            },
            undefined, // No correlation needed for this side effect
            this.activeContextId
          );
        }
      }

      // Activate the new context
      contextInfo.isActive = true; // Update state
      this.activeContextId = contextId;

      console.log(`ContextEngine: Context activated: ${contextId}`);
      this.emitVerb(
        ContextEngineVerbs.CONTEXT_ACTIVATED,
        { originalVerbId: originatingVerbId, contextId: contextId },
        originatingVerbId,
        contextId
      );
    } catch (error) {
      this.emitOperationFailed(originatingVerbId, error, contextId);
    }
  }

  private handleDeactivateContext(verb: FormRelation): void {
    const { contextId, options } = verb.content || {}; // Ignore options for now
    const originatingVerbId = verb.id;

    const contextInfo = this.contexts.get(contextId);
    if (!contextInfo) {
      this.emitOperationFailed(
        originatingVerbId,
        `Context ${contextId} not found for deactivation`,
        contextId
      );
      return;
    }

    try {
      contextInfo.isActive = false; // Update state

      if (this.activeContextId === contextId) {
        this.activeContextId = null;
        // Activation of parent is ignored for now
      }

      console.log(`ContextEngine: Context deactivated: ${contextId}`);
      this.emitVerb(
        ContextEngineVerbs.CONTEXT_DEACTIVATED,
        { originalVerbId: originatingVerbId, contextId: contextId },
        originatingVerbId,
        contextId
      );
    } catch (error) {
      this.emitOperationFailed(originatingVerbId, error, contextId);
    }
  }

  // --- Stub Handler for Unimplemented Requests ---
  private handleStubbedRequest(verb: FormRelation): void {
    const { contextId } = verb.content || {};
    const originatingVerbId = verb.id;
    console.warn(
      `ContextEngine: Received request for unimplemented verb ${verb.subtype}. Emitting generic failure.`
    );
    this.emitOperationFailed(
      originatingVerbId,
      `Operation ${verb.subtype} not implemented`,
      contextId
    );

    // OR, emit a generic success if that's less disruptive?
    // const successVerb = verb.subtype.replace('request', '').toLowerCase(); // e.g., contextEngine:updated
    // this.emitVerb(successVerb, { originalVerbId: originatingVerbId, status: 'stubbed_success' }, originatingVerbId, contextId);
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

    // Use emit for broadcast, send for direct target
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
    details: Record<string, any> = {}
  ): void {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(
      `ContextEngine: Operation failed (correlation: ${originatingVerbId}):`,
      reason,
      details
    );
    this.emitVerb(
      ContextEngineVerbs.OPERATION_FAILED,
      {
        originalVerbId: originatingVerbId,
        reason: reason,
        contextId: contextId,
        ...details,
      },
      originatingVerbId,
      contextId
    );
  }

  getContextInstance(contextId: string): any | undefined {
    console.warn(
      `ContextEngine.getContextInstance is a placeholder, returning basic info for ${contextId}`
    );
    const info = this.contexts.get(contextId);
    // Return a minimal object that might satisfy FormExecutionContext for simple morphs
    return info
      ? { id: info.id, name: info.name, isActive: info.isActive }
      : undefined;
  }
  
  // --- Getters (Keep as is or simplify if Sandarbha instances aren't stored) ---
  getContextInfo(
    contextId: string
  ):
    | {
        id: string;
        name?: string;
        parentId?: string;
        formId?: string;
        isActive: boolean;
      }
    | undefined {
    return this.contexts.get(contextId);
  }

  getActiveContextId(): string | null {
    return this.activeContextId;
  }
}

// Instantiate the engine (Keep as is)
export const contextEngine = new ContextEngine();
