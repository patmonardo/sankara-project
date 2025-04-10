/**
 * NeoContext implementation expressing BEC · MVC · NEO unity
 *
 * A NeoContext represents a bounded operational environment
 * within which entities and relations operate.
 */
import { NeoCore } from "./neo";
import { createNeoComponentId, NeoComponentId } from "./dialectic";
import { NeoEntityService , NeoEntity} from "./entity";
import { NeoRelationService, NeoRelation } from "./relation";
import { NeoEvent } from "./event";
import { EventEmitter } from "events";

/**
 * NeoContextEvent interface for context lifecycle events
 */
export interface NeoContextEvent {
  type: "created" | "activated" | "deactivated" | "updated" | "deleted";
  contextId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * NeoContext unified interface
 * Combines context and space capabilities
 */
export interface NeoContext<T = any> {
  // Identity properties
  id: string;
  type: string;
  name?: string;

  // Hierarchical structure
  parentId?: string;
  children?: Set<string>;

  // Status
  active: boolean;
  timestamp: number;

  // Metadata
  metadata?: Record<string, any>;

  // Content/configuration
  config?: T;

  // Optional space-specific properties
  spaceId?: NeoComponentId;
  members?: Set<NeoComponentId>;
  state?: Record<string, any>;
  events?: NeoEvent[];

  // Core lifecycle methods
  activate(options?: { 
    activateChildren?: boolean; 
    recursive?: boolean;
    silent?: boolean;
    preserveActiveContext?: boolean;
  }): boolean;
  
  deactivate(options?: { 
    deactivateChildren?: boolean; 
    recursive?: boolean;
    silent?: boolean;
    activateParent?: boolean;
  }): boolean;
  
  // Hierarchical methods
  addChild?(childId: string): boolean;
  removeChild?(childId: string): boolean;
  getChildren?(): NeoContext[];
  getParent?(): NeoContext | undefined;
  getAncestors?(): NeoContext[];
  
  // Entity and relation management
  registerEntity?(entityId: string): boolean;
  registerRelation?(relationId: string): boolean;
  getEntities?(): NeoEntity[];
  getRelations?(): NeoRelation[];
  createEntity?(data: Record<string, any>): string;
  createRelation?(source: string, target: string, type: string, data?: Record<string, any>): string;
  
  // Space-specific methods
  isSpace?(): boolean;
  addMember?(componentId: NeoComponentId): boolean;
  removeMember?(componentId: string | NeoComponentId): boolean;
  isMember?(componentId: string | NeoComponentId): boolean;
  updateState?(updates: Record<string, any>): boolean;
  
  // Utility methods
  run<R>(fn: () => R): R;
  update(updates: { name?: string; metadata?: Record<string, any>; config?: T }): boolean;
  delete?(): boolean;
  on?(event: "created" | "activated" | "deactivated" | "updated" | "deleted", 
     handler: (event: NeoContextEvent) => void): () => void;
  toJSON(): any;
}

export class NeoContextService<T = any> implements NeoContext<T> {
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
  private static contexts: Map<string, NeoContext> = new Map();
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

    // Initialize space features if requested
    if (options.enableSpaceFeatures || options.spaceId) {
      this.initializeSpaceFeatures({
        spaceId:
          options.spaceId ||
          createNeoComponentId(
            this.id,
            "space"
          ),
        name: options.name,
      });
    }

    // Set core reference
    this.core = options.core!;

    // Register in context registry
    NeoContextService.contexts.set(this.id, this);

    // Add as child to parent if exists
    if (this.parentId) {
      const parent = NeoContextService.contexts.get(this.parentId);
      if (parent && (parent as NeoContextService).children) {
        (parent as NeoContextService).children.add(this.id);
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
   * Initialize space-specific features
   */
  private initializeSpaceFeatures(options: {
    spaceId: NeoComponentId;
    name?: string;
  }): void {
    // Set space ID
    this.spaceId = options.spaceId;

    // Initialize space collections
    this.members = new Set<NeoComponentId>();
    this.state = {};
    this.events = [];

    // Set space type if not specified
    if (this.type === "neo:context") {
      this.type = "neo:space";
    }
  }

  /**
   * Check if this context has space capabilities
   */
  isSpace(): boolean {
    return !!this.spaceId && !!this.members;
  }

  /**
   * Get the active context or null if none is active
   */
  static getActiveContext(): NeoContext | null {
    return NeoContextService.activeContextId
      ? NeoContextService.contexts.get(NeoContextService.activeContextId) || null
      : null;
  }

  /**
   * Get a context by ID
   */
  static getContext(id: string): NeoContext | undefined {
    return NeoContextService.contexts.get(id);
  }

  /**
   * Find contexts by type
   */
  static findContextsByType(type: string): NeoContext[] {
    return Array.from(NeoContextService.contexts.values()).filter(
      (context) => context.type === type
    );
  }

  /**
   * Find child contexts
   */
  static findChildContexts(parentId: string): NeoContextService[] {
    return Array.from(NeoContextService.contexts.values())
      .filter((context) => context.parentId === parentId)
      .map(context => context as NeoContextService);
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
  activate(options: { 
    activateChildren?: boolean; 
    recursive?: boolean;
    silent?: boolean;
    preserveActiveContext?: boolean;
  } = {}): boolean {
    if (this.active) {
      return false; // Already active
    }

    // Check for circular context activation
    if (this.parentId) {
      const parent = NeoContextService.getContext(this.parentId) as NeoContextService;
      if (parent && !parent.active && !options.preserveActiveContext) {
        // Auto-activate parent first to maintain hierarchy
        parent.activate({ 
          activateChildren: false, // Don't activate siblings
          silent: options.silent,
          preserveActiveContext: true // Preserve the current active context during parent activation
        });
      }
    }

    // Deactivate current active context if exists and we're not preserving it
    if (!options.preserveActiveContext && NeoContextService.activeContextId) {
      const activeContext = NeoContextService.contexts.get(NeoContextService.activeContextId);
      if (activeContext && activeContext.id !== this.id) {
        (activeContext as NeoContextService).deactivate({ silent: options.silent });
      }
    }

    // Set as active
    this.active = true;
    NeoContextService.activeContextId = this.id;
    this.timestamp = Date.now();

    // Emit context activated event if not silent
    if (!options.silent) {
      this.emitContextEvent("activated");
    }
    
    // Activate children if requested
    if (options.activateChildren && this.children.size > 0) {
      for (const childId of this.children) {
        const child = NeoContextService.getContext(childId);
        if (child) {
          (child as NeoContextService).activate({ 
            activateChildren: options.recursive,
            recursive: options.recursive,
            silent: options.silent,
            preserveActiveContext: true // Preserve this context as active
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
  deactivate(options: { 
    deactivateChildren?: boolean; 
    recursive?: boolean;
    silent?: boolean;
    activateParent?: boolean;
  } = {}): boolean {
    if (!this.active) {
      return false; // Not active
    }

    // Save parent reference before deactivation
    const parentId = this.parentId;
    
    // Deactivate children first if requested
    if ((options.deactivateChildren || options.recursive) && this.children.size > 0) {
      for (const childId of this.children) {
        const child = NeoContextService.getContext(childId);
        if (child && (child as NeoContextService).active) {
          (child as NeoContextService).deactivate({
            deactivateChildren: options.recursive,
            recursive: options.recursive,
            silent: options.silent,
            activateParent: false // Don't activate this context from child
          });
        }
      }
    }
    
    this.active = false;
    
    // Clear active context reference if we're the active context
    if (NeoContextService.activeContextId === this.id) {
      NeoContextService.activeContextId = null;
      
      // Activate parent if requested and available
      if (options.activateParent !== false && parentId) {
        const parent = NeoContextService.getContext(parentId);
        if (parent) {
          (parent as NeoContextService).activate({ silent: options.silent });
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
    NeoContextService.contexts.set(this.id, this);

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
      const parent = NeoContextService.contexts.get(this.parentId);
      if (parent && (parent as NeoContextService).children) {
        (parent as NeoContextService).children.delete(this.id);
      }
    }

    // Transfer children to parent or make them root contexts
    if (this.children.size > 0) {
      for (const childId of this.children) {
        const child = NeoContextService.contexts.get(childId);
        if (child) {
          child.parentId = this.parentId; // Move to grandparent

          // Add as child to new parent if exists
          if (this.parentId) {
            const parent = NeoContextService.contexts.get(this.parentId);
            if (parent && (parent as NeoContextService).children) {
              (parent as NeoContextService).children.add(childId);
            }
          }
        }
      }
    }

    // Emit context deleted event
    this.emitContextEvent("deleted");

    // Remove from registry
    return NeoContextService.contexts.delete(this.id);
  }

  /**
   * Register an entity with this context
   */
  registerEntity(entityId: string): boolean {
    if (!entityId) return false;

    // Get entity to validate it exists
    const entity = NeoEntityService.getEntity(entityId);
    if (!entity) return false;

    // Add to entities set
    this.entities.add(entityId);

    // Update entity with context
    NeoEntityService.updateEntity(entityId, {
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
    const relation = NeoRelationService.getRelation(relationId);
    if (!relation) return false;

    // Add to relations set
    this.relations.add(relationId);

    // Update relation with context
    NeoRelationService.updateRelation(relationId, {
      spaceId: this.id,
    });

    return true;
  }

  /**
   * Get all entities in this context
   */
  getEntities(): NeoEntity[] {
    return Array.from(this.entities)
      .map((id) => NeoEntityService.getEntity(id))
      .filter((entity) => entity !== undefined) as NeoEntity[];
  }

  /**
   * Get all relations in this context
   */
  getRelations(): NeoRelation[] {
    return Array.from(this.relations)
      .map((id) => NeoRelationService.getRelation(id))
      .filter((relation) => relation !== undefined) as NeoRelation[];
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
    // Create entity with NeoEntity
    const entityId = NeoEntityService.createEntity({
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
    // Create relation with NeoRelation
    const relationId = NeoRelationService.createRelation({
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
    handler: (event: NeoContextEvent) => void
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
    const event: NeoContextEvent = {
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
    const previousActiveContext = NeoContextService.activeContextId;

    // Activate this context
    this.activate();

    try {
      // Run the function
      return fn();
    } finally {
      // Restore previous context if there was one
      if (previousActiveContext) {
        const prevContext = NeoContextService.contexts.get(previousActiveContext);
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
   * Add a member to this space (space-specific)
   */
  addMember(componentId: NeoComponentId): boolean {
    if (!this.isSpace()) {
      return false; // Not a space
    }

    // Convert string ID to componentId if needed
    const member =
      typeof componentId === "string"
        ? { id: componentId, type: "unknown" }
        : componentId;

    // Add to members set
    this.members!.add(member);

    // Emit member added event
    this.emitSpaceEvent("member-added", {
      memberId: member.id,
      memberType: member.type,
    });

    return true;
  }

  /**
   * Remove a member from this space (space-specific)
   */
  removeMember(componentId: string | NeoComponentId): boolean {
    if (!this.isSpace()) {
      return false; // Not a space
    }

    // Get member ID
    const memberId =
      typeof componentId === "string" ? componentId : componentId.id;

    // Find member in set
    const foundMember = Array.from(this.members!).find(
      (member) => member.id === memberId
    );

    if (!foundMember) {
      return false;
    }

    // Remove from set
    this.members!.delete(foundMember);

    // Emit member removed event
    this.emitSpaceEvent("member-removed", {
      memberId,
      memberType: foundMember.type,
    });

    return true;
  }

  /**
   * Check if a component is a member of this space (space-specific)
   */
  isMember(componentId: string | NeoComponentId): boolean {
    if (!this.isSpace()) {
      return false; // Not a space
    }

    const memberId =
      typeof componentId === "string" ? componentId : componentId.id;

    return Array.from(this.members!).some((member) => member.id === memberId);
  }

  /**
   * Record an event in this space (space-specific)
   */
  recordEvent(event: NeoEvent): boolean {
    if (!this.isSpace()) {
      return false; // Not a space
    }

    // Add event to history
    this.events!.push(event);

    // Trim history if too large
    if (this.events!.length > 100) {
      this.events = this.events!.slice(-100);
    }

    return true;
  }

  /**
   * Emit a space-specific event (space-specific)
   */
  private emitSpaceEvent(subtype: string, content: any): void {
    if (!this.isSpace()) {
      return; // Not a space
    }

    // Create event with proper structure
    const event: NeoEvent = {
      id: `space:${this.id}:${Date.now()}`,
      type: "space",
      subtype,
      source: { id: this.id, type: "space" },
      timestamp: Date.now(),
      content,
    };

    // Record event in space history
    this.recordEvent(event);

    // Emit through core if available
    if (this.core) {
      this.core.emit(event);
    }
  }

  /**
   * Add a child context to this context
   */
  addChild(childId: string): boolean {
    if (!childId) return false;
    
    // Validate child exists
    const child = NeoContextService.getContext(childId);
    if (!child) return false;
    
    // Don't allow circular references
    if (this.hasAncestor(childId)) {
      return false;
    }
    
    // Update child's parent reference
    const childInstance = child as NeoContextService;
    if (childInstance.parentId && childInstance.parentId !== this.id) {
      // Remove from previous parent
      const prevParent = NeoContextService.getContext(childInstance.parentId);
      if (prevParent) {
        (prevParent as NeoContextService).children.delete(childId);
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
    
    const child = NeoContextService.getContext(childId);
    if (child) {
      // Remove parent reference
      (child as NeoContextService).parentId = undefined;
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
    
    const parent = NeoContextService.getContext(this.parentId);
    return parent ? (parent as NeoContextService).hasAncestor(contextId) : false;
  }

  /**
   * Get all child contexts
   */
  getChildren(): NeoContext[] {
    return Array.from(this.children)
      .map(id => NeoContextService.getContext(id))
      .filter(context => context !== undefined) as NeoContext[];
  }

  /**
   * Get parent context
   */
  getParent(): NeoContext | undefined {
    return this.parentId ? NeoContextService.getContext(this.parentId) : undefined;
  }

  /**
   * Get all ancestor contexts (parents up the tree)
   */
  getAncestors(): NeoContext[] {
    const ancestors: NeoContext[] = [];
    let current = this.getParent();
    
    while (current) {
      ancestors.push(current);
      current = (current as NeoContextService).getParent();
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

    // Add space properties if this is a space
    if (this.isSpace()) {
      return {
        ...base,
        spaceId: this.spaceId,
        memberCount: this.members!.size,
        eventCount: this.events!.length,
        state: this.state,
      };
    }

    return base;
  }
}

/**
 * Create a NeoContext instance
 */
export function createNeoContext(config: {
  id?: string;
  type?: string;
  name?: string;
  parentId?: string;
  metadata?: Record<string, any>;
  config?: any;
  autoActivate?: boolean;
}): NeoContext {
  return new NeoContextService(config);
}

/**
 * Create a NeoSpace instance (now just a specialized NeoContext)
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
}): NeoContext {
  return new NeoContextService({
    ...config,
    enableSpaceFeatures: true,
    type: config.type || "neo:space",
  });
}

/**
 * Get the currently active context
 */
export function getActiveContext(): NeoContext | null {
  return NeoContextService.getActiveContext();
}

/**
 * Run a function in the context of a specific space
 */
export function withContext<T>(contextId: string, fn: () => T): T {
  const context = NeoContextService.getContext(contextId);
  if (!context) {
    throw new Error(`Context with ID ${contextId} not found`);
  }

  return context.run(fn);
}
