/**
 * FormContext implementation expressing BEC · MVC · NEO unity
 *
 * A FormContext represents a bounded operational environment
 * within which entities and relations operate.
 */
import { NeoCore } from "@/neo/neo";
import { NeoComponentId } from "@/neo/extension";
import { FormEntity } from "../entity/entity";
import { FormRelation } from "../relation/relation";
//import { FormContext } from "../schema/context";
import { NeoEvent } from "@/neo/event";
import { EventEmitter } from "events";

/**
 * FormContextEvent interface for context lifecycle events
 */
export interface FormContextEvent {
  type: "created" | "activated" | "deactivated" | "updated" | "deleted";
  contextId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class FormContext<T = any> {
  // Identity properties
  id: string;
  type: string;
  name?: string;

  // Hierarchical structure
  parentId?: string;
  children: Set<string> = new Set();

  // Runtime tracking
  entities: Set<string> = new Set();
  relations: Set<string> = new Set();

  // Status
  active: boolean = false;
  timestamp: number;

  // Metadata
  metadata?: Record<string, any>;

  // Content/configuration
  config?: T;

  // Space-specific properties (optional)
  spaceId?: NeoComponentId;
  members?: Set<NeoComponentId>;
  state?: Record<string, any>;
  events?: NeoEvent[];

  // Event emitter for local events
  private eventEmitter: EventEmitter = new EventEmitter();

  // Static context registry
  private static contexts: Map<string, FormContext> = new Map();
  private static activeContextId: string | null = null;

  // Core reference
  protected core: NeoCore;

  /**
   * Create a new context
   */
  constructor(options: {
    id?: string;
    type?: string;
    name?: string;
    parentId?: string;
    metadata?: Record<string, any>;
    config?: T;
    autoActivate?: boolean;
    core?: NeoCore;

    // Space-specific options
    spaceId?: NeoComponentId;
    enableSpaceFeatures?: boolean;
  }) {
    this.id =
      options.id ||
      `context:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    this.type = options.type || "neo:context";
    this.name = options.name;
    this.parentId = options.parentId;
    this.metadata = options.metadata || {};
    this.config = options.config;
    this.timestamp = Date.now();

    // Set core reference
    this.core = options.core!;

    // Register in context registry
    FormContext.contexts.set(this.id, this);

    // Add as child to parent if exists
    if (this.parentId) {
      const parent = FormContext.contexts.get(this.parentId);
      if (parent && (parent as FormContext).children) {
        (parent as FormContext).children.add(this.id);
      }
    }

    // Emit context created event
    this.emitContextEvent("created");

    // Activate if specified
    if (options.autoActivate) {
      this.activate();
    }
  }

  /**
   * Get the active context or null if none is active
   */
  static getActiveContext(): FormContext | null {
    return FormContext.activeContextId
      ? FormContext.contexts.get(FormContext.activeContextId) ||
          null
      : null;
  }

  /**
   * Get a context by ID
   */
  static getContext(id: string): FormContext | undefined {
    return FormContext.contexts.get(id);
  }

  /**
   * Find contexts by type
   */
  static findContextsByType(type: string): FormContext[] {
    return Array.from(FormContext.contexts.values()).filter(
      (context) => context.type === type
    );
  }

  /**
   * Find child contexts
   */
  static findChildContexts(parentId: string): FormContext[] {
    return Array.from(FormContext.contexts.values())
      .filter((context) => context.parentId === parentId)
      .map((context) => context as FormContext);
  }
  // Add these methods to the FormContext class

  /**
   * Switch the active context to the specified context
   * This is a static method to control the active context globally
   */
  static switchContext(
    contextId: string,
    options: {
      preserveParentContext?: boolean;
      silent?: boolean;
    } = {}
  ): boolean {
    const context = FormContext.getContext(contextId);
    if (!context) {
      console.error(`Cannot switch to context: ${contextId} - not found`);
      return false;
    }

    // Check if this context is already active
    if (FormContext.activeContextId === contextId) {
      return true; // Already active
    }

    // Deactivate current context if one is active
    if (FormContext.activeContextId) {
      const currentContext = FormContext.getContext(
        FormContext.activeContextId
      );
      if (currentContext) {
        (currentContext as FormContext).deactivate({
          deactivateChildren: false,
          silent: options.silent,
          activateParent: false,
        });
      }
    }

    // Activate the new context
    return (context as FormContext).activate({
      preserveActiveContext: options.preserveParentContext,
      silent: options.silent,
    });
  }

  /**
   * Execute a function within a specific context
   * This is a static method to execute code in a context without changing the current active context
   */
  static withContext<R>(contextId: string, fn: () => R): R {
    const context = FormContext.getContext(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }

    // Store the previous active context
    const previousContextId = FormContext.activeContextId;

    try {
      // Activate the target context temporarily
      (context as FormContext).activate({
        silent: true,
        preserveActiveContext: false,
      });

      // Execute the function
      return fn();
    } finally {
      // Restore the previous context
      if (previousContextId) {
        const previousContext =
          FormContext.getContext(previousContextId);
        if (previousContext) {
          (previousContext as FormContext).activate({
            silent: true,
            preserveActiveContext: false,
          });
        }
      } else {
        // No previous context, just deactivate the current one
        (context as FormContext).deactivate({
          silent: true,
          activateParent: false,
        });
      }
    }
  }

  /**
   * Create a new FormContext instance
   * This is a static factory method for creating contexts
   */
  static createContext(options: {
    id?: string;
    type?: string;
    name?: string;
    parentId?: string;
    metadata?: Record<string, any>;
    config?: any;
    autoActivate?: boolean;
    core?: NeoCore;
    enableSpaceFeatures?: boolean;
    spaceId?: NeoComponentId;
  }): FormContext {
    return new FormContext(options);
  }
  /**
   * Activate this context
   *
   * @param options Configuration options for activation
   * @param options.activateChildren Whether to also activate child contexts
   * @param options.recursive Whether to recursively activate all descendants
   * @param options.silent Whether to suppress events
   * @param options.preserveActiveContext Whether to preserve the currently active context
   */
  activate(
    options: {
      activateChildren?: boolean;
      recursive?: boolean;
      silent?: boolean;
      preserveActiveContext?: boolean;
    } = {}
  ): boolean {
    if (this.active) {
      return false; // Already active
    }

    // Check for circular context activation
    if (this.parentId) {
      const parent = FormContext.getContext(
        this.parentId
      ) as FormContext;
      if (parent && !parent.active && !options.preserveActiveContext) {
        // Auto-activate parent first to maintain hierarchy
        parent.activate({
          activateChildren: false, // Don't activate siblings
          silent: options.silent,
          preserveActiveContext: true, // Preserve the current active context during parent activation
        });
      }
    }

    // Deactivate current active context if exists and we're not preserving it
    if (!options.preserveActiveContext && FormContext.activeContextId) {
      const activeContext = FormContext.contexts.get(
        FormContext.activeContextId
      );
      if (activeContext && activeContext.id !== this.id) {
        (activeContext as FormContext).deactivate({
          silent: options.silent,
        });
      }
    }

    // Set as active
    this.active = true;
    FormContext.activeContextId = this.id;
    this.timestamp = Date.now();

    // Emit context activated event if not silent
    if (!options.silent) {
      this.emitContextEvent("activated");
    }

    // Activate children if requested
    if (options.activateChildren && this.children.size > 0) {
      for (const childId of this.children) {
        const child = FormContext.getContext(childId);
        if (child) {
          (child as FormContext).activate({
            activateChildren: options.recursive,
            recursive: options.recursive,
            silent: options.silent,
            preserveActiveContext: true, // Preserve this context as active
          });
        }
      }
    }

    return true;
  }

  /**
   * Deactivate this context
   *
   * @param options Configuration options for deactivation
   * @param options.deactivateChildren Whether to also deactivate child contexts
   * @param options.recursive Whether to recursively deactivate all descendants
   * @param options.silent Whether to suppress events
   * @param options.activateParent Whether to activate parent context after deactivation
   */
  deactivate(
    options: {
      deactivateChildren?: boolean;
      recursive?: boolean;
      silent?: boolean;
      activateParent?: boolean;
    } = {}
  ): boolean {
    if (!this.active) {
      return false; // Not active
    }

    // Save parent reference before deactivation
    const parentId = this.parentId;

    // Deactivate children first if requested
    if (
      (options.deactivateChildren || options.recursive) &&
      this.children.size > 0
    ) {
      for (const childId of this.children) {
        const child = FormContext.getContext(childId);
        if (child && (child as FormContext).active) {
          (child as FormContext).deactivate({
            deactivateChildren: options.recursive,
            recursive: options.recursive,
            silent: options.silent,
            activateParent: false, // Don't activate this context from child
          });
        }
      }
    }

    this.active = false;

    // Clear active context reference if we're the active context
    if (FormContext.activeContextId === this.id) {
      FormContext.activeContextId = null;

      // Activate parent if requested and available
      if (options.activateParent !== false && parentId) {
        const parent = FormContext.getContext(parentId);
        if (parent) {
          (parent as FormContext).activate({ silent: options.silent });
        }
      }
    }

    // Emit context deactivated event if not silent
    if (!options.silent) {
      this.emitContextEvent("deactivated");
    }

    return true;
  }

  /**
   * Update context properties
   */
  update(updates: {
    name?: string;
    metadata?: Record<string, any>;
    config?: T;
  }): boolean {
    // Update properties
    if (updates.name !== undefined) {
      this.name = updates.name;
    }

    if (updates.metadata) {
      this.metadata = {
        ...this.metadata,
        ...updates.metadata,
        updated: Date.now(),
      };
    }

    if (updates.config) {
      this.config = {
        ...this.config,
        ...updates.config,
      };
    }

    this.timestamp = Date.now();

    // Update in registry
    FormContext.contexts.set(this.id, this);

    // Emit context updated event
    this.emitContextEvent("updated");

    return true;
  }

  /**
   * Delete this context
   */
  delete(): boolean {
    // Cannot delete active context
    if (this.active) {
      this.deactivate();
    }

    // Remove from parent's children list
    if (this.parentId) {
      const parent = FormContext.contexts.get(this.parentId);
      if (parent && (parent as FormContext).children) {
        (parent as FormContext).children.delete(this.id);
      }
    }

    // Transfer children to parent or make them root contexts
    if (this.children.size > 0) {
      for (const childId of this.children) {
        const child = FormContext.contexts.get(childId);
        if (child) {
          child.parentId = this.parentId; // Move to grandparent

          // Add as child to new parent if exists
          if (this.parentId) {
            const parent = FormContext.contexts.get(this.parentId);
            if (parent && (parent as FormContext).children) {
              (parent as FormContext).children.add(childId);
            }
          }
        }
      }
    }

    // Emit context deleted event
    this.emitContextEvent("deleted");

    // Remove from registry
    return FormContext.contexts.delete(this.id);
  }

  /**
   * Register an entity with this context
   */
  registerEntity(entityId: string): boolean {
    if (!entityId) return false;

    // Get entity to validate it exists
    const entity = FormEntity.getEntity(entityId);
    if (!entity) return false;

    // Add to entities set
    this.entities.add(entityId);

    // Update entity with context
    FormEntity.updateEntity(entityId, {
      contextId: this.id,
    });

    return true;
  }

  /**
   * Register a relation with this context
   */
  registerRelation(relationId: string): boolean {
    if (!relationId) return false;

    // Get relation to validate it exists
    const relation = FormRelation.getRelation(relationId);
    if (!relation) return false;

    // Add to relations set
    this.relations.add(relationId);

    // Update relation with context
    FormRelation.updateRelation(relationId, {});

    return true;
  }

  /**
   * Get all entities in this context
   */
  getEntities(): FormEntity[] {
    return Array.from(this.entities)
      .map((id) => FormEntity.getEntity(id))
      .filter((entity) => entity !== undefined) as FormEntity[];
  }

  /**
   * Get all relations in this context
   */
  getRelations(): FormRelation[] {
    return Array.from(this.relations)
      .map((id) => FormRelation.getRelation(id))
      .filter((relation) => relation !== undefined) as FormRelation[];
  }

  /**
   * Begin a transaction in this context
   */
  beginTransaction(): string {
    const transactionId = `tx:${this.id}:${Date.now()}`;

    // Register transaction start
    this.metadata = {
      ...this.metadata,
      currentTransaction: transactionId,
      transactionStarted: Date.now(),
    };

    // Emit transaction event through core if available
    if (this.core) {
      this.core.emit({
        id: `transaction:${Date.now()}`,
        type: "transaction",
        subtype: "begin",
        source: { id: this.id, type: "context" },
        timestamp: Date.now(),
        content: {
          transactionId,
          contextId: this.id,
        },
      });
    }

    return transactionId;
  }

  /**
   * Commit the current transaction
   */
  commitTransaction(): boolean {
    const transactionId = this.metadata?.currentTransaction;
    if (!transactionId) {
      return false; // No active transaction
    }

    // Clear transaction
    if (this.metadata) {
      const { currentTransaction, transactionStarted, ...restMetadata } =
        this.metadata;
      this.metadata = {
        ...restMetadata,
        lastTransaction: currentTransaction,
        lastTransactionEnd: Date.now(),
        lastTransactionDuration:
          Date.now() - (transactionStarted || Date.now()),
      };
    }

    // Emit transaction event through core if available
    if (this.core) {
      this.core.emit({
        id: `transaction:${Date.now()}`,
        type: "transaction",
        subtype: "commit",
        source: { id: this.id, type: "context" },
        timestamp: Date.now(),
        content: {
          transactionId,
          contextId: this.id,
        },
      });
    }

    return true;
  }

  /**
   * Rollback the current transaction
   */
  rollbackTransaction(): boolean {
    const transactionId = this.metadata?.currentTransaction;
    if (!transactionId) {
      return false; // No active transaction
    }

    // Clear transaction
    if (this.metadata) {
      const { currentTransaction, transactionStarted, ...restMetadata } =
        this.metadata;
      this.metadata = {
        ...restMetadata,
        lastTransaction: currentTransaction,
        lastTransactionEnd: Date.now(),
        lastTransactionStatus: "rolled-back",
      };
    }

    // Emit transaction event through core if available
    if (this.core) {
      this.core.emit({
        id: `transaction:${Date.now()}`,
        type: "transaction",
        subtype: "rollback",
        source: { id: this.id, type: "context" },
        timestamp: Date.now(),
        content: {
          transactionId,
          contextId: this.id,
        },
      });
    }

    return true;
  }

  /**
   * Create a new entity in this context
   */
  createEntity(data: Record<string, any>): string {
    // Create entity with FormEntity
    const entityId = FormEntity.createEntity({
      ...data,
      contextId: this.id,
    });

    // Register with this context
    this.registerEntity(entityId);

    return entityId;
  }

  /**
   * Create a new relation in this context
   */
  createRelation(
    source: string,
    target: string,
    type: string,
    data: Record<string, any> = {}
  ): string {
    // Create relation with FormRelation
    const relationId = FormRelation.createRelation({
      source: { id: source, type: "entity" },
      target: { id: target, type: "entity" },
      type,
      content: data,
      spaceId: this.id,
    });

    // Register with this context
    this.registerRelation(relationId);

    return relationId;
  }

  /**
   * Subscribe to context events
   */
  on(
    event: "created" | "activated" | "deactivated" | "updated" | "deleted",
    handler: (event: FormContextEvent) => void
  ): () => void {
    this.eventEmitter.on(event, handler);
    return () => this.eventEmitter.off(event, handler);
  }

  /**
   * Emit a context event both locally and through core
   */
  protected emitContextEvent(
    type: "created" | "activated" | "deactivated" | "updated" | "deleted"
  ): void {
    const event: FormContextEvent = {
      type,
      contextId: this.id,
      timestamp: Date.now(),
      metadata: this.metadata,
    };

    // Emit locally
    this.eventEmitter.emit(type, event);

    // Emit through core if available
    if (this.core) {
      this.core.emit({
        id: `context:${Date.now()}`,
        type: "context",
        subtype: type,
        source: { id: this.id, type: "context" },
        timestamp: Date.now(),
        content: event, // Simplified to pass the whole event object as content
      });
    }
  }

  /**
   * Run a function in this context's scope
   */
  run<T>(fn: () => T): T {
    // Store previous active context
    const previousActiveContext = FormContext.activeContextId;

    // Activate this context
    this.activate();

    try {
      // Run the function
      return fn();
    } finally {
      // Restore previous context if there was one
      if (previousActiveContext) {
        const prevContext = FormContext.contexts.get(
          previousActiveContext
        );
        if (prevContext) {
          prevContext.activate();
        }
      } else {
        // Otherwise just deactivate
        this.deactivate();
      }
    }
  }

  /**
   * Add a child context to this context
   */
  addChild(childId: string): boolean {
    if (!childId) return false;

    // Validate child exists
    const child = FormContext.getContext(childId);
    if (!child) return false;

    // Don't allow circular references
    if (this.hasAncestor(childId)) {
      return false;
    }

    // Update child's parent reference
    const childInstance = child as FormContext;
    if (childInstance.parentId && childInstance.parentId !== this.id) {
      // Remove from previous parent
      const prevParent = FormContext.getContext(childInstance.parentId);
      if (prevParent) {
        (prevParent as FormContext).children.delete(childId);
      }
    }

    // Set new parent
    childInstance.parentId = this.id;
    this.children.add(childId);

    return true;
  }

  /**
   * Remove a child context from this context
   */
  removeChild(childId: string): boolean {
    if (!this.children.has(childId)) {
      return false;
    }

    const child = FormContext.getContext(childId);
    if (child) {
      // Remove parent reference
      (child as FormContext).parentId = undefined;
    }

    // Remove from children set
    this.children.delete(childId);

    return true;
  }

  /**
   * Check if a context is an ancestor of this context
   */
  private hasAncestor(contextId: string): boolean {
    if (!this.parentId) return false;
    if (this.parentId === contextId) return true;

    const parent = FormContext.getContext(this.parentId);
    return parent
      ? (parent as FormContext).hasAncestor(contextId)
      : false;
  }

  /**
   * Get all child contexts
   */
  getChildren(): FormContext[] {
    return Array.from(this.children)
      .map((id) => FormContext.getContext(id))
      .filter((context) => context !== undefined) as FormContext[];
  }

  /**
   * Get parent context
   */
  getParent(): FormContext | undefined {
    return this.parentId
      ? FormContext.getContext(this.parentId)
      : undefined;
  }

  /**
   * Get all ancestor contexts (parents up the tree)
   */
  getAncestors(): FormContext[] {
    const ancestors: FormContext[] = [];
    let current = this.getParent();

    while (current) {
      ancestors.push(current);
      current = (current as FormContext).getParent();
    }

    return ancestors;
  }

  /**
   * Serialize context to JSON
   */
  toJSON() {
    const base = {
      id: this.id,
      type: this.type,
      name: this.name,
      parentId: this.parentId,
      active: this.active,
      timestamp: this.timestamp,
      metadata: this.metadata,
      config: this.config,
      childCount: this.children.size,
      entityCount: this.entities.size,
      relationCount: this.relations.size,
    };

    return base;
  }
}

/**
 * Create a FormContext instance
 */
export function createFormContext(config: {
  id?: string;
  type?: string;
  name?: string;
  parentId?: string;
  metadata?: Record<string, any>;
  config?: any;
  autoActivate?: boolean;
}): FormContext {
  return new FormContext(config);
}

/**
 * Get a context by ID
 * Helper function that delegates to FormContext
 */
export function getContext(id: string): FormContext | undefined {
  return FormContext.getContext(id);
}

/**
 * Get the currently active context
 */
export function getActiveContext(): FormContext | null {
  return FormContext.getActiveContext();
}
/**
 * Create a NeoSpace instance (now just a specialized FormContext)
 */
export function createNeoSpace(config: {
  id?: string;
  name?: string;
  type?: string;
  parentId?: string;
  metadata?: Record<string, any>;
  config?: any;
  autoActivate?: boolean;
  spaceId?: NeoComponentId;
}): FormContext {
  return new FormContext({
    ...config,
    enableSpaceFeatures: true,
    type: config.type || "neo:space",
  });
}

/**
 * Run a function in the context of a specific space
 */
export function withContext<T>(contextId: string, fn: () => T): T {
  const context = FormContext.getContext(contextId);
  if (!context) {
    throw new Error(`Context with ID ${contextId} not found`);
  }

  return context.run(fn);
}
