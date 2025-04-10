import EventEmitter from "events";
import { NeoEvent } from "./event";
import {
  NeoComponentId,
  NeoExtension,
  NeoProtocol,
  NeoMessage,
  NeoDialectic
} from "./extension";
import { NeoGraph } from "./graph";
import { NeoProperty } from "./property";
import { NeoContext, createNeoContext, getActiveContext } from "./context";

/**
 * Neo Error Classes
 */
export class NeoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NeoError';
    Object.setPrototypeOf(this, NeoError.prototype);
  }
}

export class NeoInitializationError extends NeoError {
  readonly component: string;
  readonly originalError?: Error;

  constructor(component: string, message: string, originalError?: Error) {
    super(`Initialization failed for ${component}: ${message}`);
    this.name = 'NeoInitializationError';
    this.component = component;
    this.originalError = originalError;
    Object.setPrototypeOf(this, NeoInitializationError.prototype);
  }
}

export class NeoExtensionError extends NeoError {
  readonly extensionId: string;
  readonly originalError?: Error;

  constructor(extensionId: string, message: string, originalError?: Error) {
    super(`Extension error [${extensionId}]: ${message}`);
    this.name = 'NeoExtensionError';
    this.extensionId = extensionId;
    this.originalError = originalError;
    Object.setPrototypeOf(this, NeoExtensionError.prototype);
  }
}

/**
 * Neo initialization options
 */
export interface NeoCoreOptions {
  /** Extensions to register at initialization */
  extensions?: NeoExtension[];
  /** Enable verbose logging */
  verbose?: boolean;
  /** Custom configuration */
  config?: Record<string, any>;
  /** Initial context configuration */
  context?: {
    id?: string;
    name?: string;
    type?: string;
    autoActivate?: boolean;
  };
}

/**
 * NeoCore - The unified implementation of the Neo architecture
 * 
 * Core responsibilities:
 * 1. Extension management 
 * 2. Event routing
 * 3. System lifecycle
 * 4. Core system coordination
 */
export class NeoCore {
  // Core systems - manifestations of the One Node
  readonly protocol: NeoProtocol;
  readonly dialectic: NeoDialectic;
  readonly graph: NeoGraph;
  readonly property: NeoProperty;

  // Extension system
  private extensions: Map<string, NeoExtension> = new Map();
  private systemEmitter: EventEmitter = new EventEmitter();

  // Component identity
  private componentId: NeoComponentId;

  // System state
  private initialized: boolean = false;
  private shuttingDown: boolean = false;
  private config: Record<string, any>;
  private verbose: boolean;
  
  // Reference to default context
  private defaultContext?: NeoContext;

  // Singleton instance for global access
  private static instance: NeoCore | null = null;

  /**
   * Get the global NeoCore instance
   */
  static getInstance(): NeoCore {
    if (!NeoCore.instance) {
      throw new NeoError('NeoCore instance not initialized. Call createNeoCore first.');
    }
    return NeoCore.instance;
  }

  /**
   * Create a new NeoCore instance
   * 
   * @param componentId - The unique identifier for this component
   * @param options - Configuration options
   */
  constructor(
    componentId: NeoComponentId,
    options: NeoCoreOptions = {}
  ) {
    this.componentId = componentId;
    this.verbose = options.verbose || false;
    this.config = options.config || {};

    // Initialize the Dialectical Protocol core
    this.protocol = this.createNeoProtocol(componentId);

    // Initialize Neo Dialectics higher level operations
    this.dialectic = this.createNeoDialectic(this.protocol);

    // Initialize Graph system
    this.graph = this.createNeoGraph(this.protocol);

    // Initialize Property system
    this.property = this.createNeoProperty(this.protocol);

    // Create default context if not already existing
    if (options.context) {
      this.defaultContext = createNeoContext({
        id: options.context.id || 'default',
        name: options.context.name || 'Default Context',
        type: options.context.type || 'neo:context:default',
        autoActivate: options.context.autoActivate ?? true
      });
    }

    // Initialize provided extensions
    if (options.extensions) {
      options.extensions.forEach((ext) => this.registerExtension(ext));
    }

    // Set up internal event handlers
    this.setupEventHandlers();

    // Store reference to this instance if it's the first one
    if (!NeoCore.instance) {
      NeoCore.instance = this;
    }

    this.logVerbose('NeoCore instance created');
  }

  /**
   * Initialize the NeoCore system and all extensions
   * 
   * @returns Promise that resolves when initialization is complete
   * @throws NeoInitializationError if initialization fails
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logVerbose('NeoCore already initialized, skipping');
      return;
    }

    if (this.shuttingDown) {
      throw new NeoError('Cannot initialize during shutdown');
    }

    this.logVerbose('Initializing NeoCore');

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
      
      this.logVerbose('NeoCore initialization complete');
    } catch (error) {
      const wrappedError = new NeoInitializationError(
        'core',
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined
      );

      // Emit initialization failed event
      this.protocol.emit({
        id: `system:${Date.now()}`,
        type: "system",
        subtype: "initialization-failed",
        source: this.componentId,
        timestamp: Date.now(),
        content: {
          componentId: this.componentId,
          error: wrappedError,
        },
      });

      this.logVerbose(`NeoCore initialization failed: ${wrappedError.message}`);
      throw wrappedError;
    }
  }

  /**
   * Initialize a core system
   * @param name - Name of the system being initialized
   * @param system - System instance to initialize
   */
  private async initializeSystem(name: string, system: any): Promise<void> {
    if (!system || typeof system.initialize !== "function") {
      this.logVerbose(`System ${name} doesn't have initialize method, skipping`);
      return;
    }
    
    try {
      this.logVerbose(`Initializing system: ${name}`);
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
      
      this.logVerbose(`System ${name} initialized successfully`);
    } catch (error) {
      const wrappedError = new NeoInitializationError(
        name,
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined
      );

      // Emit system initialization failed event
      this.protocol.emit({
        id: `system:${Date.now()}`,
        type: "system",
        subtype: `${name}-initialization-failed`,
        source: this.componentId,
        timestamp: Date.now(),
        content: {
          system: name,
          error: wrappedError,
        },
      });

      this.logVerbose(`System ${name} initialization failed: ${wrappedError.message}`);
      throw wrappedError;
    }
  }

  /**
   * Initialize an extension
   * @param extension - Extension to initialize
   */
  private async initializeExtension(extension: NeoExtension): Promise<void> {
    if (!extension) {
      throw new NeoExtensionError('unknown', 'Invalid extension object');
    }

    try {
      this.logVerbose(`Initializing extension: ${extension.id.id}`);
      
      // Initialize the extension
      await Promise.resolve(extension.initialize(this));

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
      
      this.logVerbose(`Extension ${extension.id.id} initialized successfully`);
    } catch (error) {
      const wrappedError = new NeoExtensionError(
        extension.id.id,
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined
      );

      // Emit extension initialization failed event
      this.protocol.emit({
        id: `extension:${Date.now()}`,
        type: "extension",
        subtype: "initialization-failed",
        source: this.componentId,
        timestamp: Date.now(),
        content: {
          extension: extension.id,
          error: wrappedError,
        },
      });

      this.logVerbose(`Extension ${extension.id.id} initialization failed: ${wrappedError.message}`);
      throw wrappedError;
    }
  }

  /**
   * Set up internal event handlers
   */
  private setupEventHandlers(): void {
    // Listen for extension-targeted events
    this.protocol.on("extension", (event) => {
      // Find the target extension
      if (event.target && typeof event.target === 'object' && 'id' in event.target) {
        const extensionId = event.target.id;
        const extension = this.extensions.get(extensionId);
        if (extension) {
          // Forward the event to the extension
          try {
            extension.handleEvent(event);
          } catch (error) {
            this.logVerbose(`Error in extension event handler [${extensionId}]: ${error}`);
          }
        }
      }
    });

    // Listen for system events
    this.protocol.on("system", (event) => {
      // Handle system-level events
      try {
        this.handleSystemEvent(event);
      } catch (error) {
        this.logVerbose(`Error in system event handler: ${error}`);
      }
    });
    
    // Listen for context events
    this.protocol.on("context", (event) => {
      // Log context events when verbose
      this.logVerbose(`Context event: ${event.subtype} for context ${event.content?.context?.id}`);
    });
    
    // Listen for transaction events
    this.protocol.on("transaction", (event) => {
      // Log transaction events when verbose
      this.logVerbose(`Transaction event: ${event.subtype} for tx ${event.content?.transactionId}`);
    });
  }

  /**
   * Handle system events
   * @param event - System event to handle
   */
  private handleSystemEvent(event: NeoEvent): void {
    switch (event.subtype) {
      case "extension-request":
        // Handle request for extension capabilities
        if (
          event.content?.extensionId &&
          typeof event.content.extensionId === 'string' &&
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
              extension: extension ? {
                id: extension.id,
                type: extension.type,
                capabilities: extension.capabilities,
              } : null,
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
      
      case "context-request":
        // Handle request for active context info
        const activeContext = getActiveContext();
        
        this.protocol.emit({
          id: `system:${Date.now()}`,
          type: "system",
          subtype: "context-info",
          source: this.componentId,
          target: event.source,
          timestamp: Date.now(),
          content: {
            requestId: event.id,
            context: activeContext ? {
              id: activeContext.id,
              type: activeContext.type,
              name: activeContext.name,
              active: activeContext.active,
            } : null,
          },
        });
        break;
    }
  }

  /**
   * Register an extension with NeoCore
   * 
   * @param extension - Extension to register
   * @throws NeoExtensionError if extension validation fails
   */
  registerExtension(extension: NeoExtension): void {
    if (!extension || !extension.id || !extension.id.id) {
      throw new NeoExtensionError('unknown', 'Invalid extension object or missing ID');
    }
    
    const extensionId = extension.id.id;
    
    if (this.extensions.has(extensionId)) {
      throw new NeoExtensionError(
        extensionId,
        `Extension with ID ${extensionId} is already registered`
      );
    }

    // Register the extension
    this.extensions.set(extensionId, extension);
    this.logVerbose(`Extension registered: ${extensionId}`);

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
        this.logVerbose(`Failed to initialize extension ${extensionId}: ${error}`);
      });
    }
  }

  /**
   * Remove an extension from NeoCore
   * 
   * @param extensionId - ID of the extension to remove
   * @returns true if extension was removed, false if it wasn't found
   */
  removeExtension(extensionId: string): boolean {
    if (!this.extensions.has(extensionId)) {
      return false;
    }

    const extension = this.extensions.get(extensionId);
    if (!extension) {
      return false;
    }

    // Call shutdown if available
    if (typeof (extension as any).shutdown === "function") {
      try {
        (extension as any).shutdown();
      } catch (error) {
        this.logVerbose(`Error shutting down extension ${extensionId}: ${error}`);
      }
    }

    // Remove the extension
    this.extensions.delete(extensionId);
    
    // Emit extension removed event
    this.protocol.emit({
      id: `extension:${Date.now()}`,
      type: "extension",
      subtype: "removed",
      source: this.componentId,
      timestamp: Date.now(),
      content: { extensionId },
    });
    
    this.logVerbose(`Extension removed: ${extensionId}`);
    return true;
  }

  /**
   * Get an extension by ID
   * 
   * @param id - ID of the extension to retrieve
   * @returns The extension if found, undefined otherwise
   */
  getExtension(id: string | NeoComponentId): NeoExtension | undefined {
    const extensionId = typeof id === 'object' ? id.id : id;
    return this.extensions.get(extensionId);
  }

  /**
   * Get all extensions of a specific type
   * 
   * @param type - Type of extensions to retrieve
   * @returns Array of extensions matching the type
   */
  getExtensionsByType(type: string): NeoExtension[] {
    return Array.from(this.extensions.values()).filter(
      (ext) => ext.type === type
    );
  }

  /**
   * Check if an extension is registered
   * 
   * @param id - ID of the extension to check
   * @returns true if extension is registered, false otherwise
   */
  hasExtension(id: string | NeoComponentId): boolean {
    const extensionId = typeof id === 'object' ? id.id : id;
    return this.extensions.has(extensionId);
  }

  /**
   * Send a message to a specific extension
   * 
   * @param extensionId - ID of the extension to message
   * @param messageType - Type of message to send
   * @param content - Message content
   */
  sendToExtension(
    extensionId: string | NeoComponentId,
    messageType: string,
    content: any
  ): void {
    const targetId = typeof extensionId === 'object' ? extensionId : { id: extensionId, type: 'unknown' };
    
    this.protocol.emit({
      id: `message:${Date.now()}`,
      type: "extension",
      subtype: messageType,
      source: this.componentId,
      target: targetId,
      timestamp: Date.now(),
      content,
    });
  }

  /**
   * Register an event listener
   * 
   * @param eventType - Type of event to listen for
   * @param handler - Function to call when event is received
   * @returns Function to remove the listener
   */
  on(eventType: string, handler: (event: NeoEvent) => void): () => void {
    return this.protocol.on(eventType, handler);
  }

  /**
   * Get the currently active context
   * 
   * @returns The active context or null if none is active
   */
  getActiveContext(): NeoContext | null {
    return getActiveContext();
  }
  
  /**
   * Get or create the default context
   * 
   * @returns The default context
   */
  getDefaultContext(): NeoContext {
    if (!this.defaultContext) {
      this.defaultContext = createNeoContext({
        id: 'default',
        name: 'Default Context',
        type: 'neo:context:default',
        autoActivate: true
      });
    }
    
    return this.defaultContext;
  }

  /**
   * Create a new context 
   * 
   * @param config - Context configuration
   * @returns The created context
   */
  createContext(config: {
    id?: string;
    name?: string;
    type?: string;
    parentId?: string;
    autoActivate?: boolean;
    metadata?: Record<string, any>;
  }): NeoContext {
    return createNeoContext(config);
  }

  /**
   * Create Neo Protocol implementation
   * 
   * @param componentId - Component ID for this protocol instance
   * @returns Implemented NeoProtocol
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
    } as NeoProtocol;
  }

  /**
   * Create Neo Dialectic implementation
   * 
   * @param protocol - Protocol to use for the dialectic
   * @returns Implemented NeoDialectic
   */
  private createNeoDialectic(protocol: NeoProtocol): NeoDialectic {
    // We'll use the NeoDialectic implementation from dialectic.ts
    return new NeoDialectic(protocol);
  }

  /**
   * Create Neo Graph implementation
   * 
   * @param protocol - Protocol to use for the graph
   * @returns Implemented NeoGraph
   */
  private createNeoGraph(protocol: NeoProtocol): NeoGraph {
    // Initialize with the protocol
    const spaceId: NeoComponentId = { id: 'default', type: 'neo:space' };
    return new NeoGraph(protocol, spaceId);
  }

  /**
   * Create Neo Property implementation
   * 
   * @param protocol - Protocol to use for the property system
   * @returns Implemented NeoProperty
   */
  private createNeoProperty(protocol: NeoProtocol): NeoProperty {
    // Initialize with the protocol
    return new NeoProperty(protocol);
  }

  /**
   * Log message if verbose mode is enabled
   * 
   * @param message - Message to log
   */
  private logVerbose(message: string): void {
    if (this.verbose) {
      console.log(`[NeoCore] ${message}`);
    }
  }

  /**
   * Get configuration value
   * 
   * @param key - Configuration key
   * @param defaultValue - Default value if key not found
   * @returns Configuration value or default
   */
  getConfig<T>(key: string, defaultValue?: T): T | undefined {
    return key in this.config ? this.config[key] : defaultValue;
  }

  /**
   * Set configuration value
   * 
   * @param key - Configuration key
   * @param value - Value to set
   */
  setConfig<T>(key: string, value: T): void {
    this.config[key] = value;
  }

  /**
   * Check if NeoCore has been initialized
   * 
   * @returns true if initialized, false otherwise
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Emit an event through the protocol
   * 
   * @param event - Event to emit
   */
  emit(event: Partial<NeoEvent>): void {
    this.protocol.emit({
      id: event.id || `event:${Date.now()}`,
      type: event.type || 'custom',
      subtype: event.subtype || 'custom',
      source: event.source || this.componentId,
      timestamp: event.timestamp || Date.now(),
      content: event.content || {},
      ...event
    });
  }

  /**
   * Shutdown the Neo Core system
   * 
   * @returns Promise that resolves when shutdown is complete
   */
  async shutdown(): Promise<void> {
    if (this.shuttingDown) {
      this.logVerbose('Shutdown already in progress, skipping');
      return;
    }
    
    this.shuttingDown = true;
    this.logVerbose('Starting NeoCore shutdown sequence');

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
          this.logVerbose(`Shutting down extension: ${extensionIds[i]}`);
          await Promise.resolve((extension as any).shutdown());
        }
      }

      // Shutdown core systems
      if (typeof (this.graph as any).shutdown === "function") {
        this.logVerbose('Shutting down graph system');
        await Promise.resolve((this.graph as any).shutdown());
      }

      if (typeof (this.property as any).shutdown === "function") {
        this.logVerbose('Shutting down property system');
        await Promise.resolve((this.property as any).shutdown());
      }

      if (typeof (this.protocol as any).shutdown === "function") {
        this.logVerbose('Shutting down protocol system');
        await Promise.resolve((this.protocol as any).shutdown());
      }

      // Clear all event listeners
      this.systemEmitter.removeAllListeners();
      
      this.logVerbose('NeoCore shutdown complete');

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
      this.initialized = false;
      
      // Clear singleton reference
      NeoCore.instance = null;
    } catch (error) {
      const wrappedError = new NeoError(
        `Shutdown error: ${error instanceof Error ? error.message : String(error)}`
      );
      
      // Emit shutdown error event
      this.protocol.emit({
        id: `system:${Date.now()}`,
        type: "system",
        subtype: "shutdown-error",
        source: this.componentId,
        timestamp: Date.now(),
        content: { error: wrappedError },
      });

      this.logVerbose(`Shutdown failed: ${wrappedError.message}`);
      this.shuttingDown = false;
      throw wrappedError;
    }
  }
}

/**
 * Create a new NeoCore instance with standard configuration
 * 
 * @param componentId - Identifier for the NeoCore instance
 * @param options - Configuration options
 * @returns Configured NeoCore instance
 */
export function createNeoCore(
  componentId: string | NeoComponentId,
  options: NeoCoreOptions = {}
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
 * NeoExtension factory options
 */
export interface NeoExtensionOptions {
  /** Component ID for the extension */
  id: NeoComponentId;
  /** Extension type identifier */
  type: string;
  /** Capabilities provided by this extension */
  capabilities?: string[];
  /** Initialization function */
  initialize?: (core: NeoCore) => void | Promise<void>;
  /** Event handler function */
  handleEvent?: (event: NeoEvent) => void;
  /** Entity transformation function */
  transformEntity?: (entity: any, direction: "toDomain" | "toNeo") => any;
  /** Shutdown function */
  shutdown?: () => void | Promise<void>;
}

/**
 * Create a new NeoExtension instance
 * 
 * @param options - Extension configuration
 * @returns Configured NeoExtension
 */
export function createNeoExtension(options: NeoExtensionOptions): NeoExtension {
  return {
    id: options.id,
    type: options.type,
    capabilities: options.capabilities || [],
    initialize: options.initialize || ((core) => {}),
    handleEvent: options.handleEvent || ((event) => {}),
    transformEntity: options.transformEntity,
    shutdown: options.shutdown,
  };
}