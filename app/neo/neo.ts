import EventEmitter from "events";
import { NeoEvent } from "./event";
import {
  NeoComponentId,
  NeoExtension,
  NeoProtocol,
  NeoMessage,
  NeoDialectic
} from "./dialectic";
import { NeoGraph } from "./graph";
import { NeoProperty } from "./property";

/**
 * NeoCore - The unified implementation of the Neo architecture
 *
 * Integrates:
 * - NeoDialectic (dialectical movement)
 * - NeoExtension (domain-specific implementations)
 * - NeoGraph (relational structure)
 * - NeoProperty (attributional structure)
 */
export class NeoCore {
  // Core systems - manifestations of the One Node
  readonly protocol: NeoProtocol;
  readonly dialectic: NeoDialectic;
  readonly graph: NeoGraph;
  readonly property: NeoProperty;

  // Extension system
  private extensions: Map<NeoComponentId, NeoExtension> = new Map();
  private systemEmitter: EventEmitter = new EventEmitter();

  // Component identity
  private componentId: NeoComponentId;

  // System state
  private initialized: boolean = false;

  /**
   * Create a new NeoCore instance
   */
  constructor(
    componentId: NeoComponentId,
    options: {
      extensions?: NeoExtension[];
    } = {}
  ) {
    this.componentId = componentId;

    // Initialize the Dialectical Protocol core
    this.protocol = this.createNeoProtocol(componentId);

    // Initialize Neo Dialectics higher level operations
    this.dialectic = this.createNeoDialectic(this.protocol);

    // Initialize Graph system
    this.graph = this.createNeoGraph(this.protocol);

    // Initialize Property system
    this.property = this.createNeoProperty(this.protocol);

    // Initialize provided extensions
    if (options.extensions) {
      options.extensions.forEach((ext) => this.registerExtension(ext));
    }

    // Set up internal event handlers
    this.setupEventHandlers();
  }

  /**
   * Initialize the NeoCore system and all extensions
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize core systems
      await Promise.all([
        this.initializeSystem("protocol", this.protocol),
        this.initializeSystem("graph", this.graph),
        this.initializeSystem("property", this.property),
      ]);

      // Initialize extensions
      const extensionPromises = Array.from(this.extensions.values()).map(
        (extension) => this.initializeExtension(extension)
      );

      await Promise.all(extensionPromises);

      // Mark as initialized
      this.initialized = true;

      // Emit initialization complete event
      this.protocol.emit({
        id: `system:${Date.now()}`,
        type: "system",
        subtype: "initialized",
        source: this.componentId,
        timestamp: Date.now(),
        content: {
          componentId: this.componentId,
          extensions: Array.from(this.extensions.keys()),
        },
      });
    } catch (error) {
      // Emit initialization failed event
      this.protocol.emit({
        id: `system:${Date.now()}`,
        type: "system",
        subtype: "initialization-failed",
        source: this.componentId,
        timestamp: Date.now(),
        content: {
          componentId: this.componentId,
          error: error,
        },
      });

      throw error;
    }
  }

  /**
   * Initialize a core system
   */
  private async initializeSystem(name: string, system: any): Promise<void> {
    if (system && typeof system.initialize === "function") {
      try {
        await system.initialize();

        // Emit system initialized event
        this.protocol.emit({
          id: `system:${Date.now()}`,
          type: "system",
          subtype: `${name}-initialized`,
          source: this.componentId,
          timestamp: Date.now(),
          content: { system: name },
        });
      } catch (error) {
        // Emit system initialization failed event
        this.protocol.emit({
          id: `system:${Date.now()}`,
          type: "system",
          subtype: `${name}-initialization-failed`,
          source: this.componentId,
          timestamp: Date.now(),
          content: {
            system: name,
            error: error,
          },
        });

        throw error;
      }
    }
  }

  /**
   * Initialize an extension
   */
  private async initializeExtension(extension: NeoExtension): Promise<void> {
    try {
      // Initialize the extension
      extension.initialize(this);

      // Emit extension initialized event
      this.protocol.emit({
        id: `extension:${Date.now()}`,
        type: "extension",
        subtype: "initialized",
        source: this.componentId,
        timestamp: Date.now(),
        content: {
          extension: extension.id,
          type: extension.type,
          capabilities: extension.capabilities,
        },
      });
    } catch (error) {
      // Emit extension initialization failed event
      this.protocol.emit({
        id: `extension:${Date.now()}`,
        type: "extension",
        subtype: "initialization-failed",
        source: this.componentId,
        timestamp: Date.now(),
        content: {
          extension: extension.id,
          error: error,
        },
      });

      throw error;
    }
  }

  /**
   * Set up internal event handlers
   */
  private setupEventHandlers(): void {
    // Listen for extension-targeted events
    this.protocol.on("extension", (event) => {
      // Find the target extension
      if (event.target && this.extensions.has(event.target)) {
        const extension = this.extensions.get(event.target);
        if (extension) {
          // Forward the event to the extension
          extension.handleEvent(event);
        }
      }
    });

    // Listen for system events
    this.protocol.on("system", (event) => {
      // Handle system-level events
      this.handleSystemEvent(event);
    });
  }

  /**
   * Handle system events
   */
  private handleSystemEvent(event: NeoEvent): void {
    switch (event.subtype) {
      case "extension-request":
        // Handle request for extension capabilities
        if (
          event.content?.extensionId &&
          this.extensions.has(event.content.extensionId)
        ) {
          const extension = this.extensions.get(event.content.extensionId);

          this.protocol.emit({
            id: `system:${Date.now()}`,
            type: "system",
            subtype: "extension-info",
            source: this.componentId,
            timestamp: Date.now(),
            content: {
              requestId: event.id,
              extension: {
                id: extension?.id,
                type: extension?.type,
                capabilities: extension?.capabilities,
              },
            },
          });
        }
        break;

      case "extensions-query":
        // Return list of registered extensions
        const extensionsList = Array.from(this.extensions.values()).map(
          (ext) => ({
            id: ext.id,
            type: ext.type,
            capabilities: ext.capabilities,
          })
        );

        this.protocol.emit({
          id: `system:${Date.now()}`,
          type: "system",
          subtype: "extensions-list",
          source: this.componentId,
          target: event.source,
          timestamp: Date.now(),
          content: {
            requestId: event.id,
            extensions: extensionsList,
          },
        });
        break;
    }
  }

  /**
   * Register an extension with NeoCore
   */
  registerExtension(extension: NeoExtension): void {
    if (this.extensions.has(extension.id)) {
      throw new Error(
        `Extension with ID ${extension.id} is already registered`
      );
    }

    // Register the extension
    this.extensions.set(extension.id, extension);

    // Emit extension registered event
    this.protocol.emit({
      id: `extension:${Date.now()}`,
      type: "extension",
      subtype: "registered",
      source: this.componentId,
      timestamp: Date.now(),
      content: {
        extension: extension.id,
        type: extension.type,
        capabilities: extension.capabilities,
      },
    });

    // Initialize if Core is already initialized
    if (this.initialized) {
      this.initializeExtension(extension).catch((error) => {
        console.error(`Failed to initialize extension ${extension.id}:`, error);
      });
    }
  }

  /**
   * Get an extension by ID
   */
  getExtension(id: NeoComponentId): NeoExtension | undefined {
    return this.extensions.get(id);
  }

  /**
   * Get all extensions of a specific type
   */
  getExtensionsByType(type: string): NeoExtension[] {
    return Array.from(this.extensions.values()).filter(
      (ext) => ext.type === type
    );
  }

  /**
   * Check if an extension is registered
   */
  hasExtension(id: NeoComponentId): boolean {
    return this.extensions.has(id);
  }

  /**
   * Send a message to a specific extension
   */
  sendToExtension(
    extensionId: NeoComponentId,
    messageType: string,
    content: any
  ): void {
    this.protocol.emit({
      id: `message:${Date.now()}`,
      type: "extension",
      subtype: messageType,
      source: this.componentId,
      target: extensionId,
      timestamp: Date.now(),
      content,
    });
  }

  /**
   * Register an event listener
   */
  on(eventType: string, handler: (event: NeoEvent) => void): () => void {
    return this.protocol.on(eventType, handler);
  }

  /**
   * Create entity in the Neo system
   */
  createEntity(entity: any): string {
    // Generate entity ID if not provided
    const entityId =
      entity.id ||
      `entity:${Date.now()}:${Math.random().toString(36).substring(2, 7)}`;

    // Create the entity using the graph system
    this.protocol.createEntity({
      ...entity,
      id: entityId,
      createdBy: this.componentId,
      createdAt: Date.now(),
    });

    return entityId;
  }

  /**
   * Update entity in the Neo system
   */
  updateEntity(entityId: string, updates: any): void {
    // Update the entity using the graph system
    this.protocol.updateEntity(entityId, {
      ...updates,
      updatedBy: this.componentId,
      updatedAt: Date.now(),
    });
  }

  /**
   * Delete entity from the Neo system
   */
  deleteEntity(entityId: string): void {
    // Delete the entity using the graph system
    this.protocol.deleteEntity(entityId);
  }

  /**
   * Create Neo Protocol implementation
   */
  private createNeoProtocol(componentId: NeoComponentId): NeoProtocol {
    return {
      emit: (event: NeoEvent) => {
        // Ensure event has required properties
        const completeEvent = {
          ...event,
          id: event.id || `event:${Date.now()}`,
          source: event.source || componentId,
          timestamp: event.timestamp || Date.now(),
        };

        // Emit the event
        this.systemEmitter.emit(event.type, completeEvent);
        this.systemEmitter.emit("*", completeEvent);
      },

      on: (eventType: string, handler: (event: NeoEvent) => void) => {
        // Register event listener
        this.systemEmitter.on(eventType, handler);

        // Return function to remove listener
        return () => {
          this.systemEmitter.off(eventType, handler);
        };
      },

      send: (message: NeoMessage) => {
        // Create and emit a direct message event
        this.systemEmitter.emit("*", {
          id: `message:${Date.now()}:${Math.random()
            .toString(36)
            .substring(2, 7)}`,
          type: "message",
          subtype: message.type || "direct",
          source: componentId,
          target: message.to,
          timestamp: Date.now(),
          content: message,
        });
      },

      createEntity: (entity: any) => {
        return this.createEntity(entity);
      },

      updateEntity: (entityId: string, updates: any) => {
        this.updateEntity(entityId, updates);
      },

      deleteEntity: (entityId: string) => {
        this.deleteEntity(entityId);
      },
    } as NeoProtocol;
  }

  /**
   * Create Neo Dialectic implementation
   */
  private createNeoDialectic(protocol: NeoProtocol): NeoDialectic {
    // We'll use the NeoDialectic implementation from dialectic.ts
    return new NeoDialectic(protocol);
  }

  /**
   * Create Neo Graph implementation
   */
  private createNeoGraph(protocol: NeoProtocol): NeoGraph {
    // Initialize with the protocol
    return new NeoGraph(protocol);
  }

  /**
   * Create Neo Property implementation
   */
  private createNeoProperty(protocol: NeoProtocol): NeoProperty {
    // Initialize with the protocol
    return new NeoProperty(protocol);
  }

  /**
   * Shutdown the Neo Core system
   */
  async shutdown(): Promise<void> {
    // Emit shutdown event
    this.protocol.emit({
      id: `system:${Date.now()}`,
      type: "system",
      subtype: "shutdown-initiated",
      source: this.componentId,
      timestamp: Date.now(),
    });

    try {
      // Shutdown extensions in reverse registration order
      const extensionIds = Array.from(this.extensions.keys());
      for (let i = extensionIds.length - 1; i >= 0; i--) {
        const extension = this.extensions.get(extensionIds[i]);
        if (extension && typeof (extension as any).shutdown === "function") {
          await (extension as any).shutdown();
        }
      }

      // Shutdown core systems
      if (typeof (this.graph as any).shutdown === "function") {
        await (this.graph as any).shutdown();
      }

      if (typeof (this.property as any).shutdown === "function") {
        await (this.property as any).shutdown();
      }

      if (typeof (this.protocol as any).shutdown === "function") {
        await (this.protocol as any).shutdown();
      }

      // Clear all event listeners
      this.systemEmitter.removeAllListeners();

      // Emit final shutdown event
      this.protocol.emit({
        id: `system:${Date.now()}`,
        type: "system",
        subtype: "shutdown-complete",
        source: this.componentId,
        timestamp: Date.now(),
      });

      // Remove references to help garbage collection
      this.extensions.clear();
    } catch (error) {
      // Emit shutdown error event
      this.protocol.emit({
        id: `system:${Date.now()}`,
        type: "system",
        subtype: "shutdown-error",
        source: this.componentId,
        timestamp: Date.now(),
        content: { error: error},
      });

      throw error;
    }
  }
}

/**
 * Create a new NeoCore instance with standard configuration
 */
export function createNeoCore(
  componentId: string | NeoComponentId,
  options: {
    extensions?: NeoExtension[];
  } = {}
): NeoCore {
  // Convert string ID to component ID if needed
  const actualComponentId =
    typeof componentId === "string"
      ? { id: componentId, type: "neo:core", name: "Neo Core" }
      : componentId;

  // Create and return NeoCore instance
  return new NeoCore(actualComponentId, options);
}

/**
 * Create a new NeoExtension instance
 */
export function createNeoExtension(options: {
  id: NeoComponentId;
  type: string;
  capabilities?: string[];
  initialize?: (core: NeoCore) => void;
  handleEvent?: (event: NeoEvent) => void;
  transformEntity?: (entity: any, direction: "toDomain" | "toNeo") => any;
}): NeoExtension {
  return {
    id: options.id,
    type: options.type,
    capabilities: options.capabilities || [],
    initialize: options.initialize || ((core) => {}),
    handleEvent: options.handleEvent || ((event) => {}),
    transformEntity: options.transformEntity,
  };
}
