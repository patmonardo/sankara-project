import { NeoComponentId } from "./dialectic";
import { NeoProtocol, createNeoProtocol } from "./dialectic";
import { NeoDialectics, createNeoDialectics } from "./dialectic";
import { NeoGraphSystem, createNeoGraphSystem } from "./graph";
import { NeoPropertySystem, createNeoPropertySystem } from "./property";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";

/**
 * Neo Extension Interface
 *
 * Defines how an extension manifests the Neo Core into a specific domain.
 */
export interface NeoExtension {
  /**
   * Unique identifier for this extension
   */
  id: string;

  /**
   * Extension type
   */
  type: string;

  /**
   * Capabilities provided by this extension
   */
  capabilities?: string[];

  /**
   * Initialize this extension with the Neo Core
   */
  initialize(core: NeoCore): void;

  /**
   * Handle events directed to this extension
   */
  handleEvent(event: any): void;

  /**
   * Transform entities between Neo and domain formats
   */
  transformEntity?(entity: any, direction: "toDomain" | "toNeo"): any;
}

/**
 * Neo Core - The One Node Implementation
 *
 * The unified implementation of the Neo Dialectic architecture
 * that represents the One Node manifesting through different aspects.
 */
export class NeoCore {
  // Core systems - manifestations of the One Node
  readonly dialectic: NeoProtocol;
  readonly neo: NeoDialectics;
  readonly graph: NeoGraphSystem;
  readonly property: NeoPropertySystem;

  // Extension system
  private extensions: Map<string, NeoExtension> = new Map();
  private systemEmitter: EventEmitter = new EventEmitter();

  constructor(
    componentId: NeoComponentId,
    options: {
      extensions?: NeoExtension[];
    } = {}
  ) {
    // Initialize the Dialectical Protocol core - The One Node
    this.dialectic = createNeoProtocol(componentId);

    // Initialize Neo Dialectics higher level operations
    this.neo = createNeoDialectics(this.dialectic);

    // Initialize Graph system - Relational manifestation
    this.graph = createNeoGraphSystem(this.dialectic);

    // Initialize Property system - Attributional manifestation
    this.property = createNeoPropertySystem(this.dialectic);

    // Set up system events
    this.setupSystemEvents();

    // Register extensions
    if (options.extensions) {
      for (const extension of options.extensions) {
        this.registerExtension(extension);
      }
    }

    // Announce Neo Core initialization
    this.dialectic.emit({
      type: "system",
      subtype: "neo-core-initialized",
      spaceId: "system",
      content: {
        componentId,
        version: "1.0.0",
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Register a Neo extension
   */
  registerExtension(extension: NeoExtension): void {
    // Store extension
    this.extensions.set(extension.id, extension);

    // Initialize extension
    extension.initialize(this);

    // Announce extension registration
    this.dialectic.emit({
      type: "system",
      subtype: "extension-registered",
      spaceId: "system",
      content: {
        extensionId: extension.id,
        extensionType: extension.type,
        capabilities: extension.capabilities,
      },
    });

    // Subscribe to relevant system events
    this.dialectic.onEvent(`extension:${extension.id}:event`, (event) => {
      extension.handleEvent(event);
    });
  }

  /**
   * Get a registered extension by ID
   */
  getExtension<T extends NeoExtension>(id: string): T | undefined {
    return this.extensions.get(id) as T | undefined;
  }

  /**
   * Get all registered extensions
   */
  getExtensions(): NeoExtension[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Get extensions by capability
   */
  getExtensionsByCapability(capability: string): NeoExtension[] {
    return this.getExtensions().filter((ext) =>
      ext.capabilities?.includes(capability)
    );
  }

  /**
   * Send an event to an extension
   */
  sendToExtension(
    extensionId: string,
    eventType: string,
    content: any
  ): boolean {
    const extension = this.getExtension(extensionId);
    if (!extension) return false;

    extension.handleEvent({
      id: uuidv4(),
      type: eventType,
      timestamp: Date.now(),
      content,
      metadata: {
        targetExtension: extensionId,
      },
    });
    return true;
  }

  /**
   * Broadcast an event to all extensions with a specific capability
   */
  broadcastToExtensions(event: any, requiredCapability?: string): void {
    for (const [id, extension] of this.extensions.entries()) {
      // Skip extensions without required capability
      if (
        requiredCapability &&
        (!extension.capabilities ||
          !extension.capabilities.includes(requiredCapability))
      ) {
        continue;
      }

      // Send event to extension
      extension.handleEvent({
        ...event,
        metadata: {
          ...(event.metadata || {}),
          targetExtension: id,
        },
      });
    }
  }

  /**
   * Set up system events
   */
  private setupSystemEvents(): void {
    // Listen for core events
    this.dialectic.onEvent("event", (event) => {
      // Emit the system event
      this.systemEmitter.emit("event", event);
      this.systemEmitter.emit(`event:${event.type}`, event);

      if (event.subtype) {
        this.systemEmitter.emit(`event:${event.type}:${event.subtype}`, event);
      }

      // Delegate to relevant extensions
      if (event.type === "extension") {
        const targetExtension = event.content?.targetExtension;
        if (targetExtension && this.extensions.has(targetExtension)) {
          this.extensions.get(targetExtension)!.handleEvent(event);
        }
      }
    });
  }

  /**
   * Listen for system events
   */
  on(pattern: string, callback: (event: any) => void): () => void {
    this.systemEmitter.on(pattern, callback);
    return () => {
      this.systemEmitter.off(pattern, callback);
    };
  }

  /**
   * Create a model entity with properties in a space
   */
  createModel(options: {
    type: string;
    properties: Record<string, any>;
    spaceId?: string;
    metadata?: Record<string, any>;
  }): string {
    // Create entity in dialectical core
    const entityId = this.dialectic.createEntity({
      type: options.type,
      spaceId: options.spaceId || "default",
      properties: options.properties,
      metadata: {
        ...options.metadata,
        isModel: true,
        modelType: options.type,
      },
    });

    return entityId;
  }

  /**
   * Create a relation between two models
   */
  createRelation(options: {
    source: string;
    target: string;
    type: string;
    properties?: Record<string, any>;
    metadata?: Record<string, any>;
  }): void {
    // Create relation in dialectical core
    this.dialectic.createRelation(
      options.source,
      options.target,
      options.type,
      options.properties || {}
    );
  }

  /**
   * Set property on a model
   */
  setProperty(entityId: string, key: string, value: any): void {
    const entity = this.dialectic.getEntity(entityId);
    if (!entity) {
      throw new Error(`Entity not found: ${entityId}`);
    }

    // Delegate to PropertySystem for validation and setting
    this.property.setPropertyValue(entityId, key, value);

    // Emit additional model-specific events if needed
    this.dialectic.emit({
      type: "model",
      subtype: "property-updated",
      spaceId: entity.spaceId || "default",
      content: {
        entityId,
        modelType: entity.type,
        propertyName: key,
        value,
      },
    });
  }

  /**
   * Find models by type and properties
   */
  findModels(criteria: {
    type?: string;
    properties?: Record<string, any>;
    spaceId?: string;
  }): any[] {
    return this.dialectic.findEntities({
      type: criteria.type,
      properties: criteria.properties,
      spaceId: criteria.spaceId,
    });
  }

  /**
   * Create a universal entity that exists across multiple spaces
   */
  createUniversalEntity(options: {
    type: string;
    properties: Record<string, any>;
    spaces: string[];
    metadata?: Record<string, any>;
  }): { universal: string; projections: Record<string, string> } {
    const { entityId, projectionIds } = this.neo.createUniversalEntity(
      {
        type: options.type,
        properties: {
          ...options.properties,
          isUniversal: true,
        },
        metadata: {
          ...options.metadata,
          isUniversalEntity: true,
        },
      },
      options.spaces
    );

    return {
      universal: entityId,
      projections: projectionIds,
    };
  }

  /**
   * Create a dialectical triad (thesis-antithesis-synthesis)
   */
  createTriad(options: {
    thesis: { type: string; properties: Record<string, any> };
    antithesis: { type: string; properties: Record<string, any> };
    synthesis: { type: string; properties: Record<string, any> };
    spaceId?: string;
  }): { thesis: string; antithesis: string; synthesis: string } {
    const spaceId = options.spaceId || "dialectic";
    const triadId = uuidv4(); // Generate a unique ID for the triad

    // Create the three entities
    const thesisId = this.createModel({
      type: options.thesis.type,
      properties: options.thesis.properties,
      spaceId,
      metadata: { triadId, role: "thesis" },
    });

    const antithesisId = this.createModel({
      type: options.antithesis.type,
      properties: options.antithesis.properties,
      spaceId,
      metadata: { triadId, role: "antithesis" },
    });

    const synthesisId = this.createModel({
      type: options.synthesis.type,
      properties: options.synthesis.properties,
      spaceId,
      metadata: { triadId, role: "synthesis" },
    });

    // Create relationships between them
    this.createRelation({
      source: thesisId,
      target: antithesisId,
      type: "dialectic:opposes",
      properties: { triadId },
    });

    this.createRelation({
      source: antithesisId,
      target: thesisId,
      type: "dialectic:opposes",
      properties: { triadId },
    });

    this.createRelation({
      source: thesisId,
      target: synthesisId,
      type: "dialectic:transcends-to",
      properties: { triadId },
    });

    this.createRelation({
      source: antithesisId,
      target: synthesisId,
      type: "dialectic:transcends-to",
      properties: { triadId },
    });

    this.createRelation({
      source: synthesisId,
      target: thesisId,
      type: "dialectic:transcends-from",
      properties: { triadId },
    });

    this.createRelation({
      source: synthesisId,
      target: antithesisId,
      type: "dialectic:transcends-from",
      properties: { triadId },
    });

    // Emit triad creation event
    this.dialectic.emit({
      type: "dialectic",
      subtype: "triad-created",
      spaceId,
      content: {
        triadId,
        thesis: {
          id: thesisId,
          type: options.thesis.type,
        },
        antithesis: {
          id: antithesisId,
          type: options.antithesis.type,
        },
        synthesis: {
          id: synthesisId,
          type: options.synthesis.type,
        },
      },
    });

    return {
      thesis: thesisId,
      antithesis: antithesisId,
      synthesis: synthesisId,
    };
  }

  /**
   * Add properties to an entity
   */
  addProperties(entityId: string, properties: Record<string, any>): void {
    const entity = this.dialectic.getEntity(entityId);
    if (!entity) {
      throw new Error(`Entity not found: ${entityId}`);
    }

    // Update the entity with new properties
    this.dialectic.updateEntity(entityId, {
      properties,
    });

    // Emit property addition event
    this.dialectic.emit({
      type: "property",
      subtype: "added",
      spaceId: entity.spaceId || "default",
      content: {
        entityId,
        properties,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Remove properties from an entity
   */
  removeProperties(entityId: string, propertyKeys: string[]): void {
    const entity = this.dialectic.getEntity(entityId);
    if (!entity) {
      throw new Error(`Entity not found: ${entityId}`);
    }

    // Create null properties to remove them
    const propertiesToRemove: Record<string, null> = {};
    for (const key of propertyKeys) {
      propertiesToRemove[key] = null;
    }

    // Update entity to remove properties
    this.dialectic.updateEntity(entityId, {
      properties: propertiesToRemove,
    });

    // Emit property removal event
    this.dialectic.emit({
      type: "property",
      subtype: "removed",
      spaceId: entity.spaceId || "default",
      content: {
        entityId,
        propertyKeys,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Helper for creating one-time event listeners with cleanup
   */
  private createOneTimeListener(
    eventPattern: string,
    predicate: (event: any) => boolean,
    callback: (event: any) => void,
    timeout: number = 5000
  ): () => void {
    const handler = (event: any) => {
      if (predicate(event)) {
        // Remove the listener immediately
        this.systemEmitter.off(eventPattern, handler);
        callback(event);
      }
    };

    // Add the listener
    this.systemEmitter.on(eventPattern, handler);

    // Set timeout to clean up if no matching event arrives
    const timeoutId = setTimeout(() => {
      this.systemEmitter.off(eventPattern, handler);
    }, timeout);

    // Return cleanup function
    return () => {
      clearTimeout(timeoutId);
      this.systemEmitter.off(eventPattern, handler);
    };
  }
}

/**
 * Create a Neo Core instance
 */
export function createNeoCore(
  componentId: NeoComponentId,
  options?: {
    extensions?: NeoExtension[];
  }
): NeoCore {
  return new NeoCore(componentId, options);
}

/**
 * Utility function to import from Core module
 */
export {
  NeoDialectics,
  NeoProtocol,
  createNeoDialectics,
  createNeoProtocol,
} from "./dialectic";
