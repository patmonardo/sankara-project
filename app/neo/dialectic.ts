import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import { NeoCore } from "./neo";
import { NeoEvent } from "./event";

/**
 * Neo Dialectic - A New Nondual Dialectic
 *
 * Implements a Disjunctive Process that unifies Being (Entities/Models)
 * through a membership protocol spanning both Space and Room contexts.
 */

/**
 * Neo Component ID
 * Identifies components in the Neo ecosystem
 */
export type NeoComponentId = {
  id: string;
  type: string;
  name?: string;
  version?: string;
};

/**
 * Neo Extension Interface
 * Defines how extensions interact with the Neo Core
 */
export interface NeoExtension {
  /**
   * Extension identifier
   */
  id: NeoComponentId;
  
  /**
   * Extension type
   */
  type: string;
  
  /**
   * Capabilities provided by this extension
   */
  capabilities?: string[];
  
  /**
   * Initialize this extension with NeoCore
   */
  initialize(core: NeoCore): void;
  
  /**
   * Handle events directed to this extension
   */
  handleEvent(event: NeoEvent): void;
  
  /**
   * Transform entities between Neo and domain formats
   * Optional method for domain-specific transformations
   */
  transformEntity?(entity: any, direction: "toDomain" | "toNeo"): any;
}

/**
 * Neo Protocol Interface
 * Defines the core protocol functions
 */
export interface NeoProtocol {
  /**
   * Emit an event through the Neo system
   */
  emit(event: NeoEvent): void;
  
  /**
   * Listen for specific events
   */
  on(eventType: string, handler: (event: NeoEvent) => void): () => void;
  
  /**
   * Send a message to a specific component
   */
  send(message: NeoMessage): void;
  
  /**
   * Create an entity in the Neo ecosystem
   */
  createEntity(entity: any): string;
  
  /**
   * Update an entity in the Neo ecosystem
   */
  updateEntity(entityId: string, updates: any): void;
  
  /**
   * Delete an entity from the Neo ecosystem
   */
  deleteEntity(entityId: string): void;
}

/**
 * Neo Dialectic Interface
 * Higher level dialectical operations
 */
export interface NeoDialectic {
  /**
   * Process input through dialectical movement
   */
  process(input: any): Promise<any>;
  
  /**
   * Create a thesis from input
   */
  createThesis(input: any): Promise<any>;
  
  /**
   * Create antithesis from thesis
   */
  createAntithesis(thesis: any): Promise<any>;
  
  /**
   * Create synthesis from thesis and antithesis
   */
  createSynthesis(thesis: any, antithesis: any): Promise<any>;
}

// Core movement types (modes of dialectical movement)
export type NeoMovementType =
  | "system" // Reflection (system self-reference)
  | "dialectic" // Non-dual movement (unifying change)
  | "consensus" // Resolution (agreement process)
  | "message" // Communication (directed content)
  | "action" // Intention (request for change)
  | "entity" // Being (state of entities)
  | "relation" // Connection (links between entities)
  | "property" // Attribution (qualities of entities)
  | "transform" // Becoming (entity metamorphosis)

// Core identity types
export type NeoSpaceId = string;
export type NeoEntityId = string;

/**
 * Neo Space (Container context)
 *
 * A space is both:
 * 1. A container (for entities and events)
 * 2. An entity itself (with properties and relations)
 */
export interface NeoSpace {
  id: NeoSpaceId; // Space ID
  name: string; // Space name
  type?: string; // Space type
  members: Set<NeoComponentId>; // Space members
  state: Record<string, any>; // Unified space state
  events: NeoEvent[]; // Space movement history
  properties?: Record<string, any>; // Space properties
  metadata?: Record<string, any>; // Self-reflective data
}

/**
 * Dialectical Entity (Unified being model)
 *
 * An entity is:
 * 1. A node in the graph
 * 2. A carrier of properties
 * 3. A participant in relations
 */
export interface NeoEntity {
  id: NeoEntityId; // Entity ID
  type: string; // Entity type
  spaceId?: NeoSpaceId; // Context space
  properties: Record<string, any>; // Entity properties
  relations?: Array<{
    // Entity relations
    type: string; // Relation type
    target: NeoEntityId; // Related entity
    properties?: Record<string, any>; // Relation properties
  }>;
  metadata?: Record<string, any>; // Self-reflective data
}

/**
 * Neo Message (Directed communication event)
 *
 * A message is a specialized event that:
 * 1. Has explicit direction (from/to)
 * 2. Participates in conversations (threads)
 */
export interface NeoMessage {
  id: string; // Unique message ID
  from: NeoComponentId; // Sender
  to: NeoComponentId | NeoComponentId[]; // Recipient(s)
  type: string; // Message type
  spaceId?: NeoSpaceId; // Context space
  timestamp: number; // Creation time
  content: any; // Message content
  replyTo?: string; // Message this replies to
  threadId?: string; // Thread ID
  metadata?: Record<string, any>; // Additional metadata
}

/**
 * The Neo Protocol (Core implementation)
 *
 * Implements the Disjunctive Process through:
 * 1. Entity System - Being/Model
 * 2. Event System - Movement/Action
 * 3. Relation System - Connection
 * 4. Membership System - Participation
 */
export class NeoProtocol {
  // Internal state
  private spaces: Map<NeoSpaceId, NeoSpace> = new Map();
  private entities: Map<NeoEntityId, NeoEntity> = new Map();
  private emitter = new EventEmitter();
  private componentId: NeoComponentId;

  /**
   * Create a new NeoProtocol instance
   */
  constructor(componentId: NeoComponentId) {
    this.componentId = componentId;

    // Create system space as the primordial context
    this.createSpace("system", "System Space");
    this.joinSpace("system");

    // Set maximum listeners to avoid memory leak warnings
    this.emitter.setMaxListeners(100);

    // Register self as an entity (self-reference)
    this.createEntity({
      id: componentId,
      type: "component",
      properties: {
        type: "dialectical-protocol",
        version: "1.0.0",
        created: Date.now(),
      },
    });

    // Announce protocol creation (system self-awareness)
    this.emit({
      id: uuidv4(),
      type: "system",
      subtype: "protocol-created",
      spaceId: "system",
      content: { componentId },
    });
  }

  /**
   * Create a new space (context for entities and events)
   */
  createSpace(
    spaceId: NeoSpaceId,
    name: string,
    type: string = "generic"
  ): NeoSpace {
    if (this.spaces.has(spaceId)) {
      throw new Error(`Space already exists: ${spaceId}`);
    }

    // Create the space structure
    const space: NeoSpace = {
      id: spaceId,
      name,
      type,
      members: new Set(),
      state: {},
      events: [],
      properties: {
        created: Date.now(),
        createdBy: this.componentId,
      },
    };

    // Store the space
    this.spaces.set(spaceId, space);

    // Emit space creation event (system reflection)
    this.emit({
      id: uuidv4(),
      type: "system",
      subtype: "space-created",
      spaceId: "system",
      content: {
        createdSpaceId: spaceId,
        name,
        type,
      },
    });

    return space;
  }

  /**
   * Join a space (establish membership)
   */
  joinSpace(spaceId: NeoSpaceId): void {
    const space = this.spaces.get(spaceId);
    if (!space) {
      throw new Error(`Space not found: ${spaceId}`);
    }

    // Add member to space
    space.members.add(this.componentId);

    // Emit join event (membership change)
    this.emit({
      id: uuidv4(),
      type: "system",
      subtype: "space-join",
      spaceId,
      content: { componentId: this.componentId },
    });
  }

  /**
   * Leave a space (terminate membership)
   */
  leaveSpace(spaceId: NeoSpaceId): void {
    const space = this.spaces.get(spaceId);
    if (!space) return;

    // Remove member from space
    space.members.delete(this.componentId);

    // Emit leave event (membership change)
    this.emit({
      id: uuidv4(),
      type: "system",
      subtype: "space-leave",
      spaceId,
      content: { componentId: this.componentId },
    });
  }

  /**
   * Emit an event (create dialectical movement)
   */
  emit(event: NeoEvent): void {
    // Complete the event with required properties
    const fullEvent: NeoEvent = {
      ...event,
      id: uuidv4(),
      source: this.componentId,
      timestamp: Date.now(),
    };

    // Track event in appropriate space
    if (fullEvent.spaceId) {
      const space = this.spaces.get(fullEvent.spaceId);
      if (space) {
        space.events.push(fullEvent);

        // Update space state if this is a state event
        if (fullEvent.type === "system" && fullEvent.content) {
          this.updateSpaceState(fullEvent.spaceId, fullEvent.content);
        }
      }
    }

    // Track in system space if not already there (system self-awareness)
    if (fullEvent.spaceId !== "system") {
      const systemSpace = this.spaces.get("system");
      if (systemSpace) {
        // Only store references in system space to avoid duplication
        systemSpace.events.push({
          ...fullEvent,
          content: { eventRef: fullEvent.id },
          metadata: {
            ...fullEvent.metadata,
            isReference: true,
            originalSpace: fullEvent.spaceId,
          },
        });
      }
    }

    // Emit the event through all relevant channels
    this.emitter.emit("event", fullEvent);
    this.emitter.emit(`event:${event.type}`, fullEvent);
    if (event.subtype) {
      this.emitter.emit(`event:${event.type}:${event.subtype}`, fullEvent);
    }

    // Emit space-specific events
    if (fullEvent.spaceId) {
      this.emitter.emit(`space:${fullEvent.spaceId}`, fullEvent);
      this.emitter.emit(`space:${fullEvent.spaceId}:${event.type}`, fullEvent);
      if (event.subtype) {
        this.emitter.emit(
          `space:${fullEvent.spaceId}:${event.type}:${event.subtype}`,
          fullEvent
        );
      }
    }

  }

  /**
   * Send a message (directed communication)
   */
  send(message: NeoMessage): void {
    // Complete the message with required properties
    const fullMessage: NeoMessage = {
      ...message,
      id: uuidv4(),
      from: this.componentId,
      timestamp: Date.now(),
    };

    // Emit the message as an event (unify message with event)
    this.emit({
      id: fullMessage.id,
      type: "message",
      subtype: message.type,
      spaceId: message.spaceId,
      content: {
        message: fullMessage,
      },
      relations: {
        replyTo: message.replyTo,
        inThread: message.threadId,
      },
    });

    // Emit specific message events
    this.emitter.emit("message", fullMessage);
    this.emitter.emit(`message:${message.type}`, fullMessage);

    // Emit to specific recipients
    const recipients = Array.isArray(message.to) ? message.to : [message.to];
    recipients.forEach((recipient) => {
      this.emitter.emit(`message:to:${recipient}`, fullMessage);
    });

    // If it's a reply, emit a specific event
    if (message.replyTo) {
      this.emitter.emit(`reply:${message.replyTo}`, fullMessage);
    }

    // If it's in a thread, emit a thread event
    if (message.threadId) {
      this.emitter.emit(`thread:${message.threadId}`, fullMessage);
    }
  }

  /**
   * Listen for events
   */
  onEvent(pattern: string, callback: (event: NeoEvent) => void): () => void {
    this.emitter.on(pattern, callback);
    return () => {
      this.emitter.off(pattern, callback);
    };
  }

  /**
   * Listen for messages sent to this component
   */
  onMessage(
    type: string | null,
    callback: (message: NeoMessage) => void
  ): () => void {
    const messagePattern = type ? `message:${type}` : "message";
    this.emitter.on(messagePattern, callback);

    // Also listen for direct messages
    this.emitter.on(`message:to:${this.componentId}`, callback);

    return () => {
      this.emitter.off(messagePattern, callback);
      this.emitter.off(`message:to:${this.componentId}`, callback);
    };
  }

  /**
   * Listen for events in a specific space
   */
  onSpaceEvent(
    spaceId: NeoSpaceId,
    type?: string,
    subtype?: string
  ): (callback: (event: NeoEvent) => void) => () => void {
    // Determine appropriate pattern
    let pattern = `space:${spaceId}`;
    if (type) {
      pattern += `:${type}`;
      if (subtype) {
        pattern += `:${subtype}`;
      }
    }

    return (callback: (event: NeoEvent) => void) => {
      this.emitter.on(pattern, callback);
      return () => this.emitter.off(pattern, callback);
    };
  }

  /**
   * Get space state
   */
  getSpaceState(spaceId: NeoSpaceId): Record<string, any> | null {
    const space = this.spaces.get(spaceId);
    return space?.state || null;
  }

  /**
   * Update space state
   */
  updateSpaceState(spaceId: NeoSpaceId, update: Record<string, any>): void {
    const space = this.spaces.get(spaceId);
    if (!space) return;

    // Update state through disjunctive union
    space.state = {
      ...space.state,
      ...update,
    };

    // Emit state update event (if not already emitting)
    if (!update.__fromStateEvent) {
      this.emit({
        id: uuidv4(),
        type: "system",
        subtype: "update",
        spaceId,
        content: {
          ...update,
          __fromStateEvent: true,
        },
      });
    }
  }

  /**
   * Create a new entity (node in the graph)
   */
  createEntity(entity: Omit<NeoEntity, "id"> & { id?: string }): NeoEntityId {
    const entityId =
      entity.id ||
      `ent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Check if entity exists
    if (this.entities.has(entityId)) {
      throw new Error(`Entity already exists: ${entityId}`);
    }

    // Create the entity
    const fullEntity: NeoEntity = {
      ...entity,
      id: entityId,
      properties: {
        ...entity.properties,
        created: Date.now(),
        createdBy: this.componentId,
      },
    };

    // Store the entity
    this.entities.set(entityId, fullEntity);

    // Emit entity created event
    this.emit({
      id: uuidv4(),
      type: "relation",
      subtype: "entity-created",
      spaceId: entity.spaceId || "system",
      content: {
        entityId,
        entity: fullEntity,
      },
    });

    return entityId;
  }

  /**
   * Update an entity
   */
  updateEntity(
    entityId: NeoEntityId,
    updates: Partial<Omit<NeoEntity, "id">>
  ): void {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity not found: ${entityId}`);
    }

    // Update entity through disjunctive union
    const updatedEntity: NeoEntity = {
      ...entity,
      ...updates,
      properties: {
        ...entity.properties,
        ...(updates.properties || {}),
        updated: Date.now(),
        updatedBy: this.componentId,
      },
    };

    // Store updated entity
    this.entities.set(entityId, updatedEntity);

    // Emit entity updated event
    this.emit({
      id: uuidv4(),
      type: "relation",
      subtype: "entity-updated",
      spaceId: entity.spaceId || "system",
      content: {
        entityId,
        updates,
        entity: updatedEntity,
      },
    });
  }

  /**
   * Delete an entity
   */
  deleteEntity(entityId: NeoEntityId): void {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity not found: ${entityId}`);
    }

    // Delete entity
    this.entities.delete(entityId);

    // Emit entity deleted event
    this.emit({
      id: uuidv4(),
      type: "relation",
      subtype: "entity-deleted",
      spaceId: entity.spaceId || "system",
      content: {
        entityId,
        entityType: entity.type,
      },
    });
  }

  /**
   * Get an entity
   */
  getEntity(entityId: NeoEntityId): NeoEntity | null {
    return this.entities.get(entityId) || null;
  }

  /**
   * Find entities by type and properties
   */
  findEntities(criteria: {
    type?: string;
    spaceId?: NeoSpaceId;
    properties?: Record<string, any>;
  }): NeoEntity[] {
    return Array.from(this.entities.values()).filter((entity) => {
      // Match type if specified
      if (criteria.type && entity.type !== criteria.type) {
        return false;
      }

      // Match space if specified
      if (criteria.spaceId && entity.spaceId !== criteria.spaceId) {
        return false;
      }

      // Match properties if specified
      if (criteria.properties) {
        for (const [key, value] of Object.entries(criteria.properties)) {
          if (entity.properties[key] !== value) {
            return false;
          }
        }
      }

      return true;
    });
  }

  /**
   * Create a relation between entities
   */
  createRelation(
    sourceId: NeoEntityId,
    targetId: NeoEntityId,
    type: string,
    properties: Record<string, any> = {}
  ): void {
    const sourceEntity = this.entities.get(sourceId);
    const targetEntity = this.entities.get(targetId);

    if (!sourceEntity) {
      throw new Error(`Source entity not found: ${sourceId}`);
    }

    if (!targetEntity) {
      throw new Error(`Target entity not found: ${targetId}`);
    }

    // Initialize relations array if it doesn't exist
    if (!sourceEntity.relations) {
      sourceEntity.relations = [];
    }

    // Check if relation already exists
    const existingRelationIndex = sourceEntity.relations.findIndex(
      (rel) => rel.type === type && rel.target === targetId
    );

    if (existingRelationIndex !== -1) {
      // Update existing relation through disjunctive union
      sourceEntity.relations[existingRelationIndex].properties = {
        ...sourceEntity.relations[existingRelationIndex].properties,
        ...properties,
        updated: Date.now(),
        updatedBy: this.componentId,
      };
    } else {
      // Create new relation
      sourceEntity.relations.push({
        type,
        target: targetId,
        properties: {
          ...properties,
          created: Date.now(),
          createdBy: this.componentId,
        },
      });
    }

    // Store updated entity
    this.entities.set(sourceId, sourceEntity);

    // Emit relation created/updated event
    this.emit({
      id: uuidv4(),
      type: "relation",
      subtype:
        existingRelationIndex !== -1 ? "relation-updated" : "relation-created",
      spaceId: sourceEntity.spaceId || targetEntity.spaceId || "system",
      content: {
        sourceId,
        targetId,
        relationType: type,
        properties,
      },
    });
  }

  /**
   * Delete a relation
   */
  deleteRelation(
    sourceId: NeoEntityId,
    targetId: NeoEntityId,
    type: string
  ): void {
    const sourceEntity = this.entities.get(sourceId);

    if (!sourceEntity || !sourceEntity.relations) {
      return;
    }

    // Find and remove the relation
    const initialLength = sourceEntity.relations.length;
    sourceEntity.relations = sourceEntity.relations.filter(
      (rel) => !(rel.type === type && rel.target === targetId)
    );

    // If no relation was deleted, exit
    if (sourceEntity.relations.length === initialLength) {
      return;
    }

    // Store updated entity
    this.entities.set(sourceId, sourceEntity);

    // Emit relation deleted event
    this.emit({
      id: uuidv4(),
      type: "relation",
      subtype: "relation-deleted",
      spaceId: sourceEntity.spaceId || "system",
      content: {
        sourceId,
        targetId,
        relationType: type,
      },
    });
  }

  /**
   * Find entities related to a given entity
   */
  findRelatedEntities(
    entityId: NeoEntityId,
    relationType?: string,
    direction: "outgoing" | "incoming" | "both" = "both"
  ): Array<{
    entity: NeoEntity;
    relationType: string;
    direction: "outgoing" | "incoming";
    properties: Record<string, any>;
  }> {
    const results: Array<{
      entity: NeoEntity;
      relationType: string;
      direction: "outgoing" | "incoming";
      properties: Record<string, any>;
    }> = [];

    // Get entity
    const entity = this.entities.get(entityId);
    if (!entity) return results;

    // Find outgoing relations
    if (direction === "outgoing" || direction === "both") {
      if (entity.relations) {
        for (const relation of entity.relations) {
          if (!relationType || relation.type === relationType) {
            const targetEntity = this.entities.get(relation.target);
            if (targetEntity) {
              results.push({
                entity: targetEntity,
                relationType: relation.type,
                direction: "outgoing",
                properties: relation.properties || {},
              });
            }
          }
        }
      }
    }

    // Find incoming relations
    if (direction === "incoming" || direction === "both") {
      for (const [otherEntityId, otherEntity] of this.entities.entries()) {
        if (otherEntityId !== entityId && otherEntity.relations) {
          for (const relation of otherEntity.relations) {
            if (
              relation.target === entityId &&
              (!relationType || relation.type === relationType)
            ) {
              results.push({
                entity: otherEntity,
                relationType: relation.type,
                direction: "incoming",
                properties: relation.properties || {},
              });
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Start a consensus process (dialectical resolution)
   */
  initiateConsensus<T>(
    proposal: T,
    options: {
      spaceId?: NeoSpaceId;
      threshold?: number;
      timeout?: number;
      voters?: NeoComponentId[];
    } = {}
  ): string {
    const consensusId = `consensus-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const spaceId = options.spaceId || "system";

    // Create consensus entity
    const entityId = this.createEntity({
      type: "consensus",
      spaceId,
      properties: {
        id: consensusId,
        proposal,
        threshold: options.threshold || 0.51,
        timeout: options.timeout,
        voters: options.voters || [],
        votes: {},
        status: "pending",
        initiatedBy: this.componentId,
        initiatedAt: Date.now(),
      },
    });

    // Emit consensus started event
    this.emit({
      id: uuidv4(),
      type: "consensus",
      subtype: "initiated",
      spaceId,
      content: {
        consensusId,
        entityId,
        proposal,
        threshold: options.threshold || 0.51,
        timeout: options.timeout,
        voters: options.voters || [],
      },
    });

    // Set timeout if specified
    if (options.timeout) {
      setTimeout(() => {
        this.resolveConsensus(consensusId);
      }, options.timeout);
    }

    return consensusId;
  }

  /**
   * Vote on a consensus
   */
  vote(consensusId: string, vote: boolean): void {
    // Find consensus entity
    const consensusEntities = this.findEntities({
      type: "consensus",
      properties: { id: consensusId },
    });

    if (consensusEntities.length === 0) {
      throw new Error(`Consensus not found: ${consensusId}`);
    }

    const consensusEntity = consensusEntities[0];
    const votes = { ...consensusEntity.properties.votes };

    // Record vote
    votes[this.componentId.id] = vote;

    // Update consensus entity
    this.updateEntity(consensusEntity.id, {
      properties: {
        ...consensusEntity.properties,
        votes,
      },
    });

    // Emit vote event
    this.emit({
      id: uuidv4(),
      type: "consensus",
      subtype: "vote",
      spaceId: consensusEntity.spaceId || "system",
      content: {
        consensusId,
        componentId: this.componentId,
        vote,
      },
    });

    // Check if consensus is reached
    this.checkConsensus(consensusId);
  }

  /**
   * Check if consensus has been reached
   */
  private checkConsensus(consensusId: string): void {
    // Find consensus entity
    const consensusEntities = this.findEntities({
      type: "consensus",
      properties: { id: consensusId },
    });

    if (
      consensusEntities.length === 0 ||
      consensusEntities[0].properties.status !== "pending"
    ) {
      return;
    }

    const consensusEntity = consensusEntities[0];
    const votes = consensusEntity.properties.votes;
    const threshold = consensusEntity.properties.threshold || 0.51;

    // Count votes
    const totalVotes = Object.keys(votes).length;
    const yesVotes = Object.values(votes).filter((v) => v).length;

    // Calculate ratios
    const yesRatio = totalVotes > 0 ? yesVotes / totalVotes : 0;
    const noRatio = totalVotes > 0 ? (totalVotes - yesVotes) / totalVotes : 0;

    // Check if consensus is reached
    if (yesRatio >= threshold) {
      this.resolveConsensus(consensusId, true);
    } else if (noRatio >= threshold) {
      this.resolveConsensus(consensusId, false);
    }
  }

  /**
   * Resolve a consensus (complete dialectical movement)
   */
  private resolveConsensus(consensusId: string, result?: boolean): void {
    // Find consensus entity
    const consensusEntities = this.findEntities({
      type: "consensus",
      properties: { id: consensusId },
    });

    if (
      consensusEntities.length === 0 ||
      consensusEntities[0].properties.status !== "pending"
    ) {
      return;
    }

    const consensusEntity = consensusEntities[0];

    // If result is not provided, calculate based on votes
    if (result === undefined) {
      const votes = consensusEntity.properties.votes;
      const threshold = consensusEntity.properties.threshold || 0.51;

      const totalVotes = Object.keys(votes).length;
      const yesVotes = Object.values(votes).filter((v) => v).length;

      result = totalVotes > 0 && yesVotes / totalVotes >= threshold;
    }

    // Update consensus entity
    this.updateEntity(consensusEntity.id, {
      properties: {
        ...consensusEntity.properties,
        status: result ? "passed" : "rejected",
        result,
        resolvedAt: Date.now(),
      },
    });

    // Emit consensus result event
    this.emit({
      id: uuidv4(),
      type: "consensus",
      subtype: "resolved",
      spaceId: consensusEntity.spaceId || "system",
      content: {
        consensusId,
        result,
        votes: consensusEntity.properties.votes,
      },
    });

    // If consensus passed, apply the proposal if it's a system update
    if (
      result &&
      consensusEntity.properties.proposal?.type === "system-update"
    ) {
      this.applySystemUpdate(consensusEntity.properties.proposal);
    }
  }

  /**
   * Get consensus state
   */
  getConsensusState(consensusId: string): {
    id: string;
    proposal: any;
    votes: Record<string, boolean>;
    threshold: number;
    timeout?: number;
    result?: boolean;
    status: "pending" | "passed" | "rejected";
  } | null {
    const consensusEntities = this.findEntities({
      type: "consensus",
      properties: { id: consensusId },
    });

    if (consensusEntities.length === 0) {
      return null;
    }

    const props = consensusEntities[0].properties;

    return {
      id: consensusId,
      proposal: props.proposal,
      votes: props.votes || {},
      threshold: props.threshold,
      timeout: props.timeout,
      result: props.result,
      status: props.status,
    };
  }

  /**
   * Apply system updates from consensus
   */
  private applySystemUpdate(proposal: any): void {
    // Handle different types of system updates
    switch (proposal.updateType) {
      case "space-state":
        if (proposal.spaceId && proposal.state) {
          this.updateSpaceState(proposal.spaceId, proposal.state);
        }
        break;

      case "entity-create":
        if (proposal.entity) {
          this.createEntity(proposal.entity);
        }
        break;

      case "entity-update":
        if (proposal.entityId && proposal.updates) {
          this.updateEntity(proposal.entityId, proposal.updates);
        }
        break;

      case "relation-create":
        if (proposal.sourceId && proposal.targetId && proposal.type) {
          this.createRelation(
            proposal.sourceId,
            proposal.targetId,
            proposal.type,
            proposal.properties || {}
          );
        }
        break;
    }
  }
}

/**
 * Neo Dialectic higher-level operations
 *
 * Additional capabilities built on the core Dialectical Protocol
 */
export class NeoDialectic {
  constructor(private protocol: NeoProtocol) {}

  /**
   * Create a dialectical triad (thesis-antithesis-synthesis)
   */
  createTriad(options: {
    thesis: { type: string; properties: Record<string, any> };
    antithesis: { type: string; properties: Record<string, any> };
    synthesis: { type: string; properties: Record<string, any> };
    spaceId?: string;
  }): { thesisId: string; antithesisId: string; synthesisId: string } {
    const spaceId = options.spaceId || "dialectic";
    const triadId = uuidv4(); // Generate a unique ID for the triad

    // Create the three entities
    const thesisId = this.protocol.createEntity({
      type: options.thesis.type,
      spaceId,
      properties: options.thesis.properties,
      metadata: { triadId, role: "thesis" },
    });

    const antithesisId = this.protocol.createEntity({
      type: options.antithesis.type,
      spaceId,
      properties: options.antithesis.properties,
      metadata: { triadId, role: "antithesis" },
    });

    const synthesisId = this.protocol.createEntity({
      type: options.synthesis.type,
      spaceId,
      properties: options.synthesis.properties,
      metadata: { triadId, role: "synthesis" },
    });

    // Create relationships between them
    this.protocol.createRelation(thesisId, antithesisId, "dialectic:opposes", {
      triadId,
    });

    this.protocol.createRelation(antithesisId, thesisId, "dialectic:opposes", {
      triadId,
    });

    this.protocol.createRelation(
      thesisId,
      synthesisId,
      "dialectic:transcends-to",
      { triadId }
    );

    this.protocol.createRelation(
      antithesisId,
      synthesisId,
      "dialectic:transcends-to",
      { triadId }
    );

    this.protocol.createRelation(
      synthesisId,
      thesisId,
      "dialectic:transcends-from",
      { triadId }
    );

    this.protocol.createRelation(
      synthesisId,
      antithesisId,
      "dialectic:transcends-from",
      { triadId }
    );

    // Emit triad creation event
    this.protocol.emit({
      id: uuidv4(),
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
      thesisId,
      antithesisId,
      synthesisId,
    };
  }

  /**
   * Create a disjunctive pair
   */
  createDisjunctivePair(
    entity1: Omit<NeoEntity, "id">,
    entity2: Omit<NeoEntity, "id">,
    relationName: string = "disjunctive"
  ): {
    entity1Id: NeoEntityId;
    entity2Id: NeoEntityId;
    pairId: NeoEntityId;
  } {
    // Create the entities
    const entity1Id = this.protocol.createEntity(entity1);
    const entity2Id = this.protocol.createEntity(entity2);

    // Create bidirectional disjunctive relations
    this.protocol.createRelation(entity1Id, entity2Id, relationName, {
      description: "Disjunctively related",
    });

    this.protocol.createRelation(entity2Id, entity1Id, relationName, {
      description: "Disjunctively related",
    });

    // Create a pair entity to represent the disjunction
    const pairId = this.protocol.createEntity({
      type: "disjunctive:pair",
      spaceId: entity1.spaceId || "system",
      properties: {
        entity1Id,
        entity2Id,
        relationName,
        created: Date.now(),
      },
    });

    // Link the pair to its components
    this.protocol.createRelation(pairId, entity1Id, "contains", {});
    this.protocol.createRelation(pairId, entity2Id, "contains", {});

    return { entity1Id, entity2Id, pairId };
  }

  /**
   * Create a universal entity that participates in multiple spaces
   */
  createUniversalEntity(
    entity: Omit<NeoEntity, "id" | "spaceId"> & { id?: string },
    spaceIds: NeoSpaceId[]
  ): { entityId: NeoEntityId; projectionIds: Record<NeoSpaceId, NeoEntityId> } {
    // Create the universal entity in the system space
    const universalEntityId = this.protocol.createEntity({
      ...entity,
      spaceId: "system",
      properties: {
        ...entity.properties,
        isUniversal: true,
        participatesIn: spaceIds,
      },
    });

    // Create projections in each space
    const projectionIds: Record<NeoSpaceId, NeoEntityId> = {};

    for (const spaceId of spaceIds) {
      // Create projection entity
      const projectionId = this.protocol.createEntity({
        ...entity,
        spaceId,
        properties: {
          ...entity.properties,
          isProjection: true,
          universalEntityId,
        },
      });

      // Link universal to projection
      this.protocol.createRelation(
        universalEntityId,
        projectionId,
        "projects-to",
        { spaceId }
      );

      // Link projection to universal
      this.protocol.createRelation(
        projectionId,
        universalEntityId,
        "projects-from",
        { spaceId }
      );

      projectionIds[spaceId] = projectionId;
    }

    return { entityId: universalEntityId, projectionIds };
  }
}

/**
 * Create a Dialectical Protocol instance
 */
export function createNeoProtocol(componentId: NeoComponentId): NeoProtocol {
  return new NeoProtocol(componentId);
}

/**
 * Create a Neo Dialectics instance
 */
export function createNeoDialectic(protocol: NeoProtocol): NeoDialectic {
  return new NeoDialectic(protocol);
}
