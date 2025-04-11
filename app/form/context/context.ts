/**
 * FormContext implementation
 *
 * A FormContext represents a bounded operational environment
 * within which entities and relations operate.
 */
import { FormEntity } from "@/form/entity";
import { FormRelation } from "@/form/relation";

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
  
  // Event emitter for local events
  private eventEmitter: any = null; // Placeholder for event emitter

  // Static context registry
  private static contexts: Map<string, FormContext> = new Map();
  private static activeContextId: string | null = null;

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
  }) {
    this.id =
      options.id ||
      `context:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    this.type = options.type || "context";
    this.name = options.name;
    this.parentId = options.parentId;
    this.metadata = options.metadata || {};
    this.config = options.config;
    this.timestamp = Date.now();

    // Register in context registry
    FormContext.contexts.set(this.id, this);

    // Add as child to parent if exists
    if (this.parentId) {
      const parent = FormContext.getContext(this.parentId);
      if (parent) {
        parent.children.add(this.id);
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
   * Switch the active context to the specified context
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
      return false;
    }

    // Check if this context is already active
    if (FormContext.activeContextId === contextId) {
      return true;
    }

    // Deactivate current context if one is active
    if (FormContext.activeContextId) {
      const currentContext = FormContext.getContext(FormContext.activeContextId);
      if (currentContext) {
        currentContext.deactivate({
          silent: options.silent,
        });
      }
    }

    // Activate the new context
    return context.activate({
      preserveActiveContext: options.preserveParentContext,
      silent: options.silent,
    });
  }

  /**
   * Execute a function within a specific context
   */
  static withContext<R>(contextId: string, fn: () => R): R {
    const context = FormContext.getContext(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }

    // Store the previous active context
    const previousContextId = FormContext.activeContextId;

    try {
      // Activate this context temporarily
      FormContext.activeContextId = contextId;
      
      // Execute function
      return fn();
    } finally {
      // Restore previous context
      FormContext.activeContextId = previousContextId;
    }
  }

  /**
   * Create a new FormContext instance (static factory method)
   */
  static createContext(options: {
    id?: string;
    type?: string;
    name?: string;
    parentId?: string;
    metadata?: Record<string, any>;
    config?: any;
    autoActivate?: boolean;
  }): FormContext {
    return new FormContext(options);
  }

  /**
   * Activate this context
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
      return true;
    }

    // Check for circular context activation
    if (this.parentId && this.hasAncestor(this.id)) {
      throw new Error(`Circular context activation detected: ${this.id}`);
    }

    // Deactivate current active context if exists and we're not preserving it
    if (!options.preserveActiveContext && FormContext.activeContextId) {
      const currentContext = FormContext.getContext(FormContext.activeContextId);
      if (currentContext) {
        currentContext.deactivate({ silent: options.silent });
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
          child.activate({
            activateChildren: options.recursive,
            silent: options.silent,
            preserveActiveContext: true,
          });
        }
      }
    }

    return true;
  }

  /**
   * Deactivate this context
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
      return true;
    }

    // Save parent reference before deactivation
    const parentId = this.parentId;

    // Deactivate children first if requested
    if ((options.deactivateChildren || options.recursive) && this.children.size > 0) {
      for (const childId of this.children) {
        const child = FormContext.getContext(childId);
        if (child) {
          child.deactivate({
            deactivateChildren: options.recursive,
            silent: options.silent,
          });
        }
      }
    }

    this.active = false;

    // Clear active context reference if we're the active context
    if (FormContext.activeContextId === this.id) {
      FormContext.activeContextId = null;
    }

    // Emit context deactivated event if not silent
    if (!options.silent) {
      this.emitContextEvent("deactivated");
    }

    // Activate parent if requested
    if (options.activateParent && parentId) {
      const parent = FormContext.getContext(parentId);
      if (parent) {
        parent.activate({ silent: options.silent });
      }
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
      throw new Error(`Cannot delete active context: ${this.id}`);
    }

    // Remove from parent's children list
    if (this.parentId) {
      const parent = FormContext.getContext(this.parentId);
      if (parent) {
        parent.children.delete(this.id);
      }
    }

    // Transfer children to parent or make them root contexts
    if (this.children.size > 0) {
      for (const childId of this.children) {
        const child = FormContext.getContext(childId);
        if (child) {
          child.parentId = this.parentId;
          if (this.parentId) {
            const parent = FormContext.getContext(this.parentId);
            if (parent) {
              parent.children.add(childId);
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
    if (!entityId) {
      return false;
    }

    // Add to entities set
    this.entities.add(entityId);

    // TODO: Update entity with context if entity implementation available
    
    return true;
  }

  /**
   * Register a relation with this context
   */
  registerRelation(relationId: string): boolean {
    if (!relationId) {
      return false;
    }

    // Add to relations set
    this.relations.add(relationId);

    // TODO: Update relation with context if relation implementation available
    
    return true;
  }

  /**
   * Get all entities in this context
   */
  getEntities(): any[] {
    // Note: Reimplement with actual entity type when available
    return Array.from(this.entities)
      .map((id) => ({ id })) // Placeholder for entity retrieval
      .filter((entity) => entity !== undefined);
  }

  /**
   * Get all relations in this context
   */
  getRelations(): any[] {
    // Note: Reimplement with actual relation type when available
    return Array.from(this.relations)
      .map((id) => ({ id })) // Placeholder for relation retrieval
      .filter((relation) => relation !== undefined);
  }

  /**
   * Create a new entity in this context
   */
  createEntity(data: Record<string, any>): string {
    const entityId = `entity:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    
    // TODO: Create entity with proper implementation
    
    // Register with context
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
    const relationId = `relation:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    
    // TODO: Create relation with proper implementation
    
    // Register with context
    this.registerRelation(relationId);
    
    return relationId;
  }

  /**
   * Run a function in this context's scope
   */
  run<T>(fn: () => T): T {
    return FormContext.withContext(this.id, fn);
  }

  /**
   * Emit a context event
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
    
    // TODO: Emit event properly when event system is available
  }

  /**
   * Check if a context is an ancestor of this context
   */
  private hasAncestor(contextId: string): boolean {
    let current = this.parentId ? FormContext.getContext(this.parentId) : null;
    
    while (current) {
      if (current.id === contextId) {
        return true;
      }
      current = current.parentId ? FormContext.getContext(current.parentId) : null;
    }
    
    return false;
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
 * Run a function in the context of a specific space
 */
export function withContext<T>(contextId: string, fn: () => T): T {
  return FormContext.withContext(contextId, fn);
}