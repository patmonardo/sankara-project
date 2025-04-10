import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import { NeoCore } from "./neo";
import { NeoEntity } from "./entity";
import { NeoContext, NeoSpaceId } from "./context";
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
 * Neo Component Interface
 * Defines the base structure for components in the Neo system
 */
export interface NeoComponent {
  /**
   * Component identifier
   */
  id: NeoComponentId;
  
  /**
   * Component type
   */
  type: string;
  
  /**
   * Initialize this component with NeoCore
   */
  initialize(core: NeoCore): void;
  
  /**
   * Handle events directed to this component
   */
  handleEvent(event: NeoEvent): void;
}

/**
 * Neo Extension Interface
 * Defines how extensions interact with the Neo Core
 */
export interface NeoExtension extends NeoComponent {
  /**
   * Capabilities provided by this extension
   */
  capabilities?: string[];
  
  /**
   * Transform entities between Neo and domain formats
   * Optional method for domain-specific transformations
   * @param entity The entity to transform
   * @param direction The direction of transformation ("toDomain" or "toNeo")
   * @returns The transformed entity
   */
  transformEntity?<T = any, R = any>(entity: T, direction: "toDomain" | "toNeo"): R;

  shutdown?: () => void | Promise<void>;

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
}

/**
 * Neo Dialectic Interface
 * Higher level dialectical operations for meta-orchestration
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
  
  /**
   * Create a dialectical triad as a system of entities and relations
   */
  createDialecticalTriad(options: {
    thesis: { type: string; properties: Record<string, any> };
    antithesis: { type: string; properties: Record<string, any> };
    synthesis: { type: string; properties: Record<string, any> };
    contextId?: string;
  }): Promise<{ thesisId: string; antithesisId: string; synthesisId: string }>;
  
  /**
   * Create a disjunctive pair of entities
   */
  createDisjunctivePair(options: {
    entity1: { type: string; properties: Record<string, any> };
    entity2: { type: string; properties: Record<string, any> };
    relationName?: string;
    contextId?: string;
  }): Promise<{
    entity1Id: string;
    entity2Id: string;
    pairId: string;
  }>;
  
  /**
   * Create a consensus process between multiple entities
   */
  createConsensusProcess(options: {
    participants: Array<{ id: string, type: string }>;
    topic: string;
    initialPosition?: any;
    contextId?: string;
  }): Promise<{
    processId: string;
    participantIds: string[];
  }>;
  
  /**
   * Coordinate extension interaction
   */
  coordinateExtensions(options: {
    command: string;
    extensionIds: string[];
    params?: any;
    contextId?: string;
  }): Promise<any>;

  /**
   * Apply a form across multiple contexts
   */
  applyForm(options: {
    formId: string;
    inputs: Record<string, any>;
    contexts: string[];
    aggregationStrategy?: 'merge' | 'collect' | 'reduce';
    aggregationFn?: (results: any[]) => any;
  }): Promise<any>;
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
  spaceId: NeoComponentId; // Context space
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
  spaces: Map<NeoSpaceId, NeoContext> = new Map();
  componentId: NeoComponentId;
  emitter = new EventEmitter();

  /**
   * Create a new NeoProtocol instance
   */
  constructor(componentId: NeoComponentId) {
    this.componentId = componentId;

    // Set maximum listeners to avoid memory leak warnings
    this.emitter.setMaxListeners(100);

    // Register self as an entity (self-reference)
    this.emit({
      id: uuidv4(),
      type: "system",
      subtype: "protocol-created",
      spaceId: "system",
      source: this.componentId,
      content: { componentId },
    });
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
      source: message.spaceId,
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
        source: spaceId,
        content: {
          ...update,
          __fromStateEvent: true,
        },
      });
    }
  }
}

/**
 * Neo Dialectic higher-level operations
 *
 * Meta-orchestrator that coordinates between Form, Entity, Relation, and Context
 * and manages Extension integrations
 */
export class NeoDialectic {
  constructor(private protocol: NeoProtocol) {}

  /**
   * Process input through dialectical movement
   */
  async process(input: any): Promise<any> {
    // Create thesis
    const thesis = await this.createThesis(input);
    
    // Create antithesis from thesis
    const antithesis = await this.createAntithesis(thesis);
    
    // Create synthesis from thesis and antithesis
    return this.createSynthesis(thesis, antithesis);
  }
  
  /**
   * Create a thesis from input
   */
  async createThesis(input: any): Promise<any> {
    return {
      type: 'thesis',
      content: input,
      timestamp: Date.now()
    };
  }
  
  /**
   * Create antithesis from thesis
   */
  async createAntithesis(thesis: any): Promise<any> {
    return {
      type: 'antithesis',
      content: thesis.content,
      originalThesis: thesis,
      timestamp: Date.now()
    };
  }
  
  /**
   * Create synthesis from thesis and antithesis
   */
  async createSynthesis(thesis: any, antithesis: any): Promise<any> {
    return {
      type: 'synthesis',
      thesis,
      antithesis,
      timestamp: Date.now()
    };
  }

  /**
   * Create a dialectical triad (thesis-antithesis-synthesis)
   * Higher-level operation that coordinates Entity/Relation/Context
   */
  async createDialecticalTriad(options: {
    thesis: { type: string; properties: Record<string, any> };
    antithesis: { type: string; properties: Record<string, any> };
    synthesis: { type: string; properties: Record<string, any> };
    contextId?: string;
  }): Promise<{ thesisId: string; antithesisId: string; synthesisId: string }> {
    // Import needed functionality
    const { NeoEntity } = require('./entity');
    const { createNeoRelation } = require('./relation');
    const { getActiveContext } = require('./context');
    
    const contextId = options.contextId || (getActiveContext()?.id);
    const triadId = `triad:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;

    // Create the three entities using Entity class
    const thesisEntity = NeoEntity.create({
      type: options.thesis.type,
      properties: {
        ...options.thesis.properties,
        role: "thesis",
        triadId
      },
      contextId
    });
    
    const antithesisEntity = NeoEntity.create({
      type: options.antithesis.type,
      properties: {
        ...options.antithesis.properties,
        role: "antithesis",
        triadId
      },
      contextId
    });
    
    const synthesisEntity = NeoEntity.create({
      type: options.synthesis.type,
      properties: {
        ...options.synthesis.properties,
        role: "synthesis",
        triadId
      },
      contextId
    });
    
    // Persist entities
    thesisEntity.persist();
    antithesisEntity.persist();
    synthesisEntity.persist();

    // Create relationships between them using Relation functionality
    createNeoRelation({
      source: { id: thesisEntity.id, type: thesisEntity.type },
      target: { id: antithesisEntity.id, type: antithesisEntity.type },
      type: "dialectic:opposes",
      content: { triadId }
    });

    createNeoRelation({
      source: { id: antithesisEntity.id, type: antithesisEntity.type },
      target: { id: thesisEntity.id, type: thesisEntity.type },
      type: "dialectic:opposes",
      content: { triadId }
    });

    createNeoRelation({
      source: { id: thesisEntity.id, type: thesisEntity.type },
      target: { id: synthesisEntity.id, type: synthesisEntity.type },
      type: "dialectic:transcends-to",
      content: { triadId }
    });

    createNeoRelation({
      source: { id: antithesisEntity.id, type: antithesisEntity.type },
      target: { id: synthesisEntity.id, type: synthesisEntity.type },
      type: "dialectic:transcends-to",
      content: { triadId }
    });

    createNeoRelation({
      source: { id: synthesisEntity.id, type: synthesisEntity.type },
      target: { id: thesisEntity.id, type: thesisEntity.type },
      type: "dialectic:transcends-from",
      content: { triadId }
    });

    createNeoRelation({
      source: { id: synthesisEntity.id, type: synthesisEntity.type },
      target: { id: antithesisEntity.id, type: antithesisEntity.type },
      type: "dialectic:transcends-from",
      content: { triadId }
    });

    // Emit triad creation event
    if (this.protocol) {
      this.protocol.emit({
        id: uuidv4(),
        type: "dialectic",
        subtype: "triad-created",
        source: { id: "neo:dialectic", type: "system" },
        content: {
          triadId,
          thesis: {
            id: thesisEntity.id,
            type: options.thesis.type,
          },
          antithesis: {
            id: antithesisEntity.id,
            type: options.antithesis.type,
          },
          synthesis: {
            id: synthesisEntity.id,
            type: options.synthesis.type,
          },
          contextId
        }
      });
    }

    return {
      thesisId: thesisEntity.id,
      antithesisId: antithesisEntity.id,
      synthesisId: synthesisEntity.id,
    };
  }

  /**
   * Create a disjunctive pair of entities
   * Higher-level operation that coordinates Entity/Relation creation
   */
  async createDisjunctivePair(options: {
    entity1: { type: string; properties: Record<string, any> };
    entity2: { type: string; properties: Record<string, any> };
    relationName?: string;
    contextId?: string;
  }): Promise<{
    entity1Id: string;
    entity2Id: string;
    pairId: string;
  }> {
    // Import needed functionality
    const { NeoEntity } = require('./entity');
    const { createNeoRelation } = require('./relation');
    const { getActiveContext } = require('./context');
    
    const contextId = options.contextId || (getActiveContext()?.id);
    const relationName = options.relationName || "disjunctive";

    // Create the entities using Entity class
    const entity1 = NeoEntity.create({
      type: options.entity1.type,
      properties: options.entity1.properties,
      contextId
    });
    
    const entity2 = NeoEntity.create({
      type: options.entity2.type,
      properties: options.entity2.properties,
      contextId
    });
    
    // Persist entities
    entity1.persist();
    entity2.persist();

    // Create bidirectional disjunctive relations
    createNeoRelation({
      source: { id: entity1.id, type: entity1.type },
      target: { id: entity2.id, type: entity2.type },
      type: relationName,
      content: {
        description: "Disjunctively related"
      }
    });

    createNeoRelation({
      source: { id: entity2.id, type: entity2.type },
      target: { id: entity1.id, type: entity1.type },
      type: relationName,
      content: {
        description: "Disjunctively related"
      }
    });

    // Create a pair entity to represent the disjunction
    const pairEntity = NeoEntity.create({
      type: "disjunctive:pair",
      properties: {
        entity1Id: entity1.id,
        entity2Id: entity2.id,
        relationName,
        created: Date.now(),
      },
      contextId
    });
    
    // Persist pair entity
    pairEntity.persist();

    // Link the pair to its components
    createNeoRelation({
      source: { id: pairEntity.id, type: pairEntity.type },
      target: { id: entity1.id, type: entity1.type },
      type: "contains"
    });
    
    createNeoRelation({
      source: { id: pairEntity.id, type: pairEntity.type },
      target: { id: entity2.id, type: entity2.type },
      type: "contains"
    });

    return { 
      entity1Id: entity1.id, 
      entity2Id: entity2.id, 
      pairId: pairEntity.id
    };
  }

  /**
   * Create a consensus process between multiple entities
   * Complex dialectical process that facilitates agreements
   */
  async createConsensusProcess(options: {
    participants: Array<{ id: string, type: string }>;
    topic: string;
    initialPosition?: any;
    contextId?: string;
  }): Promise<{
    processId: string;
    participantIds: string[];
  }> {
    // Import needed functionality
    const { NeoEntity } = require('./entity');
    const { createNeoRelation } = require('./relation');
    const { createNeoContext, getActiveContext } = require('./context');
    
    // Get context or create a consensus-specific context
    const parentContextId = options.contextId || (getActiveContext()?.id);
    const consensusContext = createNeoContext({
      name: `Consensus: ${options.topic}`,
      type: 'neo:context:consensus',
      parentId: parentContextId
    });
    
    // Create consensus process entity
    const processEntity = NeoEntity.create({
      type: 'consensus:process',
      properties: {
        topic: options.topic,
        status: 'initiated',
        participantCount: options.participants.length,
        created: Date.now(),
        initialPosition: options.initialPosition
      },
      contextId: consensusContext.id
    });
    
    // Persist process entity
    processEntity.persist();
    
    // Create participant entities and relations
    const participantIds: string[] = [];
    
    for (const participant of options.participants) {
      // Create participant stance entity
      const stanceEntity = NeoEntity.create({
        type: 'consensus:stance',
        properties: {
          participantId: participant.id,
          participantType: participant.type,
          position: options.initialPosition || null,
          lastUpdated: Date.now()
        },
        contextId: consensusContext.id
      });
      
      stanceEntity.persist();
      participantIds.push(stanceEntity.id);
      
      // Create relations
      createNeoRelation({
        source: { id: processEntity.id, type: processEntity.type },
        target: { id: stanceEntity.id, type: stanceEntity.type },
        type: 'has-stance'
      });
      
      createNeoRelation({
        source: { id: stanceEntity.id, type: stanceEntity.type },
        target: { id: participant.id, type: participant.type },
        type: 'represents'
      });
    }
    
    // Emit process creation event
    if (this.protocol) {
      this.protocol.emit({
        id: uuidv4(),
        type: "consensus",
        subtype: "process-created",
        spaceId: consensusContext.id,
        source: this.protocol.componentId,
        timestamp: Date.now(),
        content: {
          processId: processEntity.id,
          topic: options.topic,
          contextId: consensusContext.id,
          participantIds
        }
      });
    }
    
    return {
      processId: processEntity.id,
      participantIds
    };
  }
  
  /**
   * Coordinate extension interaction
   * This is the meta-orchestration method that coordinates multiple extensions
   */
  async coordinateExtensions(options: {
    command: string;
    extensionIds: string[];
    params?: any;
    contextId?: string;
  }): Promise<any> {
    // Get core instance
    const { NeoCore } = require('./neo');
    const core = NeoCore.getInstance();
    
    // Get or create context
    const { getActiveContext, createNeoContext } = require('./context');
    const contextId = options.contextId || getActiveContext()?.id;
    
    // Create coordination context if needed
    const coordinationContext = contextId ? 
      { id: contextId } : 
      createNeoContext({
        name: `Extension Coordination: ${options.command}`,
        type: 'neo:context:coordination',
        autoActivate: true
      });
    
    // Begin transaction
    const transactionId = typeof coordinationContext.beginTransaction === 'function' ?
      coordinationContext.beginTransaction() :
      `tx:coordination:${Date.now()}`;
    
    try {
      // Emit coordination started event
      this.protocol.emit({
        id: uuidv4(),
        type: "extension",
        subtype: "coordination-started",
        source: this.protocol.componentId,
        content: {
          command: options.command,
          extensions: options.extensionIds,
          contextId: coordinationContext.id,
          transactionId
        }
      });
      
      // Get all extensions
      const extensions = options.extensionIds.map(id => core.getExtension(id)).filter(Boolean);
      
      // Check if we have all extensions
      if (extensions.length !== options.extensionIds.length) {
        const missingIds = options.extensionIds.filter(id => !core.getExtension(id));
        throw new Error(`Extensions not found: ${missingIds.join(', ')}`);
      }
      
      // Prepare the result container
      const results: Record<string, any> = {};
      
      // Process each extension based on command
      switch (options.command) {
        case 'query':
          // Execute queries on all extensions in parallel
          await Promise.all(extensions.map(async (extension) => {
            try {
              const response = await new Promise((resolve) => {
                // Create a unique request ID
                const requestId = `req:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
                
                // Create a response handler
                const responseHandler = (event: any) => {
                  if (event.content?.requestId === requestId) {
                    // Remove the listener once we get our response
                    this.protocol.on('extension', responseHandler);
                    resolve(event.content?.result);
                  }
                };
                
                // Listen for the response
                this.protocol.on('extension', responseHandler);
                
                // Send query to extension
                core.sendToExtension(
                  extension.id, 
                  'query',
                  {
                    requestId,
                    query: options.params?.query,
                    parameters: options.params?.parameters,
                    contextId: coordinationContext.id
                  }
                );
                
                // Set timeout for response
                setTimeout(() => {
                  this.protocol.on('extension', responseHandler);
                  resolve({ error: 'Timeout waiting for extension response' });
                }, 30000); // 30 second timeout
              });
              
              // Store the result
              results[extension.id.id] = response;
            } catch (error) {
              results[extension.id.id] = { error: error instanceof Error ? error.message : String(error) };
            }
          }));
          break;
          
        case 'transform':
          // Transform an entity through multiple extensions
          let currentEntity = options.params?.entity;
          
          // Sequential processing through extensions
          for (const extension of extensions) {
            if (typeof extension.transformEntity === 'function') {
              try {
                currentEntity = await extension.transformEntity(
                  currentEntity, 
                  options.params?.direction || 'toNeo'
                );
                
                results[extension.id.id] = { success: true };
              } catch (error) {
                results[extension.id.id] = { 
                  error: error instanceof Error ? error.message : String(error)
                };
                // Don't break the chain on error, continue with current entity
              }
            } else {
              results[extension.id.id] = { 
                error: 'Extension does not support transformEntity'
              };
            }
          }
          
          // Store the final transformed entity
          results.finalEntity = currentEntity;
          break;
          
        case 'execute':
          // Execute operations on extensions
          for (const extension of extensions) {
            try {
              // Create a unique request ID
              const requestId = `exec:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
              
              // Send execution command
              core.sendToExtension(
                extension.id,
                options.params?.operation || 'execute',
                {
                  requestId,
                  params: options.params?.operationParams,
                  contextId: coordinationContext.id
                }
              );
              
              results[extension.id.id] = { requestSent: true, requestId };
            } catch (error) {
              results[extension.id.id] = { 
                error: error instanceof Error ? error.message : String(error)
              };
            }
          }
          break;
          
        default:
          throw new Error(`Unknown coordination command: ${options.command}`);
      }
      
      // Create a coordination result entity
      const { createNeoEntity } = require('./entity');
      const resultEntity = createNeoEntity({
        type: 'coordination:result',
        properties: {
          command: options.command,
          extensions: options.extensionIds,
          params: options.params,
          results,
          completed: Date.now()
        },
        contextId: coordinationContext.id
      });
      
      // Commit transaction if we started one
      if (typeof coordinationContext.commitTransaction === 'function') {
        coordinationContext.commitTransaction();
      }
      
      // Emit coordination completed event
      this.protocol.emit({
        id: uuidv4(),
        type: "extension",
        subtype: "coordination-completed",
        source: this.protocol.componentId,
        content: {
          command: options.command,
          extensions: options.extensionIds,
          contextId: coordinationContext.id,
          resultId: resultEntity.id,
          transactionId
        }
      });
      
      return {
        results,
        resultEntityId: resultEntity.id,
        contextId: coordinationContext.id
      };
    } catch (error) {
      // Rollback transaction if we started one
      if (typeof coordinationContext.rollbackTransaction === 'function') {
        coordinationContext.rollbackTransaction();
      }
      
      // Emit coordination failed event
      this.protocol.emit({
        id: uuidv4(),
        type: "extension",
        subtype: "coordination-failed",
        source: this.protocol.componentId,
        content: {
          command: options.command,
          extensions: options.extensionIds,
          contextId: coordinationContext.id,
          error: error instanceof Error ? error.message : String(error),
          transactionId
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Apply a form across multiple contexts
   * Orchestrates Form processing across multiple contexts
   */
  async applyForm(options: {
    formId: string;
    inputs: Record<string, any>;
    contexts: string[];
    aggregationStrategy?: 'merge' | 'collect' | 'reduce';
    aggregationFn?: (results: any[]) => any;
  }): Promise<any> {
    // Import form and context functionality
    const { getActiveContext } = require('./context');
    
    // Create a coordination context
    const { createNeoContext } = require('./context');
    const coordinationContext = createNeoContext({
      name: `Form Coordination: ${options.formId}`,
      type: 'neo:context:form-coordination'
    });
    
    // Begin transaction
    const transactionId = coordinationContext.beginTransaction();
    
    try {
      // Emit form coordination started event
      this.protocol.emit({
        id: uuidv4(),
        type: "form",
        subtype: "coordination-started",
        source: this.protocol.componentId,
        content: {
          formId: options.formId,
          contexts: options.contexts,
          contextId: coordinationContext.id,
          transactionId
        }
      });
      
      // Get form entity
      const { NeoEntity } = require('./entity');
      const formEntity = NeoEntity.getEntity(options.formId);
      
      if (!formEntity) {
        throw new Error(`Form not found: ${options.formId}`);
      }
      
      // Get context entities
      const contextEntities = options.contexts.map(ctxId => {
        const { NeoContext } = require('./context');
        return NeoContext.getContext(ctxId);
      }).filter(Boolean);
      
      if (contextEntities.length !== options.contexts.length) {
        const missingIds = options.contexts.filter(id => {
          const { NeoContext } = require('./context');
          return !NeoContext.getContext(id);
        });
        throw new Error(`Contexts not found: ${missingIds.join(', ')}`);
      }
      
      // Results container
      const results: Record<string, any> = {};
      
      // Apply form to each context
      const formResults = await Promise.all(contextEntities.map(async context => {
        try {
          // Run form processing in context
          return await context.run(async () => {
            // Get form processing function
            const processForm = require(`./form`).processForm;
            
            // Process form with inputs
            const result = await processForm(options.formId, options.inputs);
            
            // Store result
            results[context.id] = result;
            
            return result;
          });
        } catch (error) {
          results[context.id] = { 
            error: error instanceof Error ? error.message : String(error)
          };
          return null;
        }
      }));
      
      // Aggregate results based on strategy
      let finalResult: any;
      
      switch (options.aggregationStrategy) {
        case 'merge':
          // Merge all results into a single object
          finalResult = formResults.reduce((acc, result) => {
            if (result && typeof result === 'object') {
              return { ...acc, ...result };
            }
            return acc;
          }, {});
          break;
          
        case 'collect':
          // Collect all results in an array
          finalResult = formResults.filter(result => result !== null);
          break;
          
        case 'reduce':
          // Custom reduction function
          if (typeof options.aggregationFn === 'function') {
            finalResult = options.aggregationFn(formResults.filter(result => result !== null));
          } else {
            finalResult = formResults.filter(result => result !== null);
          }
          break;
          
        default:
          // Default to collecting results by context ID
          finalResult = results;
      }
      
      // Create a coordination result entity
      const { createNeoEntity } = require('./entity');
      const resultEntity = createNeoEntity({
        type: 'form:coordination:result',
        properties: {
          formId: options.formId,
          contexts: options.contexts,
          results,
          finalResult,
          completed: Date.now()
        },
        contextId: coordinationContext.id
      });
      
      // Commit transaction
      coordinationContext.commitTransaction();
      
      // Emit form coordination completed event
      this.protocol.emit({
        id: uuidv4(),
        type: "form",
        subtype: "coordination-completed",
        source: this.protocol.componentId,
        content: {
          formId: options.formId,
          contexts: options.contexts,
          contextId: coordinationContext.id,
          resultId: resultEntity.id,
          transactionId
        }
      });
      
      return {
        results,
        finalResult,
        resultEntityId: resultEntity.id,
        contextId: coordinationContext.id
      };
    } catch (error) {
      // Rollback transaction
      coordinationContext.rollbackTransaction();
      
      // Emit form coordination failed event
      this.protocol.emit({
        id: uuidv4(),
        type: "form",
        subtype: "coordination-failed",
        source: this.protocol.componentId,
        content: {
          formId: options.formId,
          contexts: options.contexts,
          contextId: coordinationContext.id,
          error: error instanceof Error ? error.message : String(error),
          transactionId
        }
      });
      
      throw error;
    }
  }
}

/**
 * NeoEntityBuilder - Fluent API for building entities
 * Provides a chainable interface for creating Neo entities
 */
export class NeoEntityBuilder<T extends Partial<NeoEntity> = NeoEntity> {
  private entityData: Partial<NeoEntity>;
  
  constructor(private protocol: NeoProtocol, type: string) {
    this.entityData = { type, properties: {} };
  }
  
  /**
   * Set entity ID
   */
  withId(id: string): NeoEntityBuilder<T> {
    this.entityData.id = id;
    return this;
  }
  
  /**
   * Add property to entity
   */
  withProperty(key: string, value: any): NeoEntityBuilder<T> {
    if (!this.entityData.properties) {
      this.entityData.properties = {};
    }
    this.entityData.properties[key] = value;
    return this;
  }
  
  /**
   * Add multiple properties at once
   */
  withProperties(properties: Record<string, any>): NeoEntityBuilder<T> {
    if (!this.entityData.properties) {
      this.entityData.properties = properties;
    } else {
      this.entityData.properties = {
        ...this.entityData.properties,
        ...properties
      };
    }
    return this;
  }
  
  /**
   * Add metadata to entity
   */
  withMetadata(metadata: Record<string, any>): NeoEntityBuilder<T> {
    this.entityData.metadata = {
      ...(this.entityData.metadata || {}),
      ...metadata
    };
    return this;
  }
  
}

/**
 * Helper function to create a NeoComponentId
 * Makes it easier to create and use ComponentIds in the event system
 */
export function createNeoComponentId(
  id: string,
  type: string,
  name?: string,
): NeoComponentId {
  return {
    type,
    id,
    name: name || id,
  };
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

/**
 * Type guards for better type checking
 */

/**
 * Type guard to check if an entity is of a specific type
 * 
 * @param entity The entity to check
 * @param type The type to check for
 * @returns True if the entity is of the specified type
 */
export function isEntityOfType<T extends NeoEntity>(entity: NeoEntity | null, type: string): entity is T {
  return entity !== null && entity.type === type;
}

