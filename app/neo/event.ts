import { EventEmitter } from "events";
import { NeoRelation } from "@/form/relation/relation";
import { NeoComponentId } from "./extension";

/**
 * Core event types for the Neo event system
 */
export type NeoEventType =
  | "test"       // Test events
  | "system"     // System events
  | "extension"  // Extension events
  | "form"       // Form events
  | "entity"     // Entity events (creation, updates)
  | "relation"   // Relation events
  | "context"    // Space events
  | "graph"      // Graph events
  | "property"   // Property events
  | "message"    // Message events
  | "dialectic"  // Dialectical events
  | "consensus"  // Consensus events
  | "custom"     // Custom events
  | string;      // Allow for extensibility

/**
 * Type alias - A NeoEvent is just a specialized NeoRelation
 * This maintains backward compatibility while emphasizing the relation nature
 */
export type NeoEvent<T = any> = NeoRelation<T>;

// ...existing code for NeoEventEmitter interfaces and implementations...

/**
 * Consensus vote type definition
 */
export interface ConsensusVote {
  voter: NeoComponentId;
  vote: boolean;
  timestamp: number;
  reason?: string;
}

/**
 * Consensus process status
 */
export type ConsensusStatus = 'pending' | 'passed' | 'rejected' | 'timeout' | 'canceled';

/**
 * Consensus process state
 */
export interface ConsensusState<T = any> {
  id: string;
  spaceId: string;
  proposal: T;
  threshold: number;
  votes: Record<string, ConsensusVote>;
  voters?: string[];
  timeout?: number;
  timeoutId?: NodeJS.Timeout;
  startTime: number;
  endTime?: number;
  status: ConsensusStatus;
  result?: boolean;
  initiator: NeoComponentId;
}

/**
 * Neo event listener registration result
 */
export type EventListenerCleanup = () => void;

/**
 * Neo Event Service Interface
 *
 * Core event service for the Neo system.
 */
export interface NeoEventService {
  // Core event methods
  emit<T>(event: NeoEvent<T>): string; // Emit an event
  on<T>(pattern: string, callback: (event: NeoEvent<T>) => void): () => void; // Listen for events
  off(pattern: string, callback: Function): void; // Remove listener

  // Space methods
  joinSpace(spaceId: string): Promise<void>; // Join a space
  leaveSpace(spaceId: string): Promise<void>; // Leave a space
  createSpace(spaceId: string, name: string): Promise<void>; // Create a space

  // Query methods
  getEvents<T>(options: {
    spaceId?: string;
    type?: string;
    subtype?: string;
    limit?: number;
    before?: string;
    after?: string;
    filter?: (event: NeoEvent<T>) => boolean;
  }): Promise<NeoEvent<T>[]>; // Get events

  // Consensus methods
  initiateConsensus<T>(
    proposal: T,
    options?: {
      spaceId?: string;
      threshold?: number;
      timeout?: number;
      voters?: string[];
    }
  ): Promise<string>; // Start consensus process

  vote(
    consensusId: string, 
    vote: boolean, 
    options?: { reason?: string }
  ): Promise<void>; // Cast a vote

  cancelConsensus(consensusId: string): Promise<boolean>; // Cancel a consensus process

  getConsensusState<T>(consensusId: string): Promise<{
    id: string;
    proposal: T;
    votes: ConsensusVote[];
    threshold: number;
    startTime: number;
    endTime?: number;
    result?: boolean;
    status: ConsensusStatus;
  }>; // Get consensus state

  // System info
  getComponentId(): NeoComponentId; // Get this component's ID
}

/**
 * Local Neo Event Service implementation
 *
 * Simple in-memory implementation of the NeoEventService.
 */
export class LocalNeoEventService implements NeoEventService {
  private emitter = new EventEmitter();
  private events: Record<string, NeoEvent[]> = {};
  private spaces: Set<string> = new Set();
  private consensusProcesses: Record<string, ConsensusState> = {};
  private componentId: NeoComponentId;

  constructor(componentId: NeoComponentId) {
    this.componentId = componentId;
  }

  /**
   * Emit an event to the Neo system
   */
  emit<T>(event: NeoEvent<T>): string {
    // Generate a final event with defaults filled in
    const finalEvent = {
      ...event,
      id:
        event.id ||
        `neo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: event.timestamp || Date.now(),
      source: this.componentId,
    };

    // Store event if it has a spaceId
    if (finalEvent.spaceId) {
      if (!this.events[finalEvent.spaceId]) {
        this.events[finalEvent.spaceId] = [];
      }
      this.events[finalEvent.spaceId].push(finalEvent);
    }

    // Emit event patterns
    // 1. Generic "event" - catches all events
    this.emitter.emit("event", finalEvent);

    // 2. Type-specific - e.g. "event:entity"
    if (finalEvent.type) {
      this.emitter.emit(`event:${finalEvent.type}`, finalEvent);

      // 3. Type+subtype specific - e.g. "event:entity:created"
      if (finalEvent.subtype) {
        this.emitter.emit(
          `event:${finalEvent.type}:${finalEvent.subtype}`,
          finalEvent
        );
      }
    }

    // 4. Space-specific patterns
    if (finalEvent.spaceId) {
      // All events in space - e.g. "space:forms:event"
      this.emitter.emit(`space:${finalEvent.spaceId}:event`, finalEvent);

      // Type-specific in space - e.g. "space:forms:event:entity"
      if (finalEvent.type) {
        this.emitter.emit(
          `space:${finalEvent.spaceId}:event:${finalEvent.type}`,
          finalEvent
        );

        // Type+subtype in space - e.g. "space:forms:event:entity:created"
        if (finalEvent.subtype) {
          this.emitter.emit(
            `space:${finalEvent.spaceId}:event:${finalEvent.type}:${finalEvent.subtype}`,
            finalEvent
          );
        }
      }
    }

    return finalEvent.id;
  }

  /**
   * Listen for events matching a pattern
   *
   * Pattern examples:
   * - "event" - All events
   * - "event:entity" - All entity events
   * - "event:entity:created" - Entity creation events
   * - "space:forms:event" - All events in "forms" space
   * - "space:forms:event:entity" - Entity events in "forms" space
   */
  on<T>(pattern: string, callback: (event: NeoEvent<T>) => void): () => void {
    this.emitter.on(pattern, callback as any);
    return () => this.off(pattern, callback as any);
  }

  /**
   * Stop listening for events
   */
  off(pattern: string, callback: Function): void {
    this.emitter.off(pattern, callback as any);
  }

  /**
   * Join a space
   */
  async joinSpace(spaceId: string): Promise<void> {
    this.spaces.add(spaceId);

    // Create space if it doesn't exist in our event store
    if (!this.events[spaceId]) {
      this.events[spaceId] = [];
    }

    // Emit a join event
    this.emit({
      id: `join-${spaceId}-${Date.now()}`,
      type: "space",
      subtype: "join",
      spaceId,
      source: this.componentId,
      content: {
        componentId: this.componentId,
        action: "join",
      },
    });
  }

  /**
   * Leave a space
   */
  async leaveSpace(spaceId: string): Promise<void> {
    this.spaces.delete(spaceId);

    // Emit a leave event
    this.emit({
      id: `leave-${spaceId}-${Date.now()}`,
      type: "space",
      subtype: "leave",
      spaceId,
      source: this.componentId,
      content: {
        componentId: this.componentId,
        action: "leave",
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Create a new space
   */
  async createSpace(spaceId: string, name: string): Promise<void> {
    // Create space in our event store
    if (!this.events[spaceId]) {
      this.events[spaceId] = [];
    }

    // Join the space automatically
    this.spaces.add(spaceId);

    // Emit creation event
    this.emit({
      id: `create-${spaceId}-${Date.now()}`,
      type: "space",
      subtype: "create",
      spaceId,
      source: this.componentId,
      content: {
        name,
        creator: this.componentId,
      },
    });
  }

  /**
   * Get events matching certain criteria
   */
  async getEvents<T>(
    options: {
      spaceId?: string;
      type?: string;
      subtype?: string;
      limit?: number;
      before?: string;
      after?: string;
      filter?: (event: NeoEvent<T>) => boolean;
    } = {}
  ): Promise<NeoEvent<T>[]> {
    // Collect events from requested spaces or all spaces
    let events: NeoEvent[] = [];

    if (options.spaceId) {
      // Get events from specific space
      events = this.events[options.spaceId] || [];
    } else {
      // Get events from all spaces
      events = Object.values(this.events).flat();
    }

    // Apply type filter if provided
    if (options.type) {
      events = events.filter((e) => e.type === options.type);
    }

    // Apply subtype filter if provided
    if (options.subtype) {
      events = events.filter((e) => e.subtype === options.subtype);
    }

    // Apply before filter if provided
    if (options.before) {
      const beforeEvent = events.find((e) => e.id === options.before);
      if (beforeEvent) {
        const beforeTime = beforeEvent.timestamp || 0;
        events = events.filter((e) => (e.timestamp || 0) < beforeTime);
      }
    }

    // Apply after filter if provided
    if (options.after) {
      const afterEvent = events.find((e) => e.id === options.after);
      if (afterEvent) {
        const afterTime = afterEvent.timestamp || 0;
        events = events.filter((e) => (e.timestamp || 0) > afterTime);
      }
    }

    // Apply custom filter if provided
    if (options.filter) {
      events = events.filter((e) =>
        options.filter!(e as unknown as NeoEvent<T>)
      );
    }

    // Sort by timestamp (newest first)
    events = [...events].sort(
      (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
    );

    // Apply limit if provided
    if (options.limit && options.limit > 0) {
      events = events.slice(0, options.limit);
    }

    return events as unknown as NeoEvent<T>[];
  }

  /**
   * Start a new consensus process
   */
  async initiateConsensus<T>(
    proposal: T,
    options: {
      spaceId?: string;
      threshold?: number;
      timeout?: number;
      voters?: string[];
    } = {}
  ): Promise<string> {
    const consensusId = `consensus-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const spaceId = options.spaceId || "system";
    const threshold = options.threshold || 0.51;
    const timeout = options.timeout || 0; // 0 means no timeout
    
    // Create consensus process state
    const consensusState: ConsensusState<T> = {
      id: consensusId,
      spaceId,
      proposal,
      threshold,
      votes: {},
      voters: options.voters || [],
      timeout,
      startTime: Date.now(),
      status: 'pending',
      initiator: this.componentId
    };
    
    // Set timeout if specified
    if (timeout > 0) {
      consensusState.timeoutId = setTimeout(() => {
        this.resolveConsensus(consensusId, undefined, 'timeout');
      }, timeout);
    }
    
    // Store the consensus process
    this.consensusProcesses[consensusId] = consensusState;

    // Emit consensus start event
    this.emit({
      id: consensusId,
      type: "consensus",
      subtype: "start",
      spaceId,
      source: this.componentId,
      content: {
        consensusId,
        proposal,
        threshold,
        timeout,
        voters: options.voters || [],
        initiator: this.componentId
      },
    });

    return consensusId;
  }

  /**
   * Cancel an ongoing consensus process
   */
  async cancelConsensus(consensusId: string): Promise<boolean> {
    const consensus = this.consensusProcesses[consensusId];
    if (!consensus) {
      throw new Error(`Consensus process ${consensusId} not found`);
    }

    if (consensus.status !== 'pending') {
      return false; // Can't cancel a finished consensus
    }

    // Clear timeout if it exists
    if (consensus.timeoutId) {
      clearTimeout(consensus.timeoutId);
    }

    // Update status
    consensus.status = 'canceled';
    consensus.endTime = Date.now();

    // Emit cancellation event
    this.emit({
      id: `cancel-${consensusId}-${Date.now()}`,
      type: "consensus",
      subtype: "cancel",
      spaceId: consensus.spaceId,
      source: this.componentId,
      content: {
        consensusId,
        reason: "explicitly canceled",
        votes: Object.values(consensus.votes)
      },
    });

    return true;
  }

  /**
   * Cast a vote in a consensus process
   */
  async vote(
    consensusId: string, 
    vote: boolean, 
    options: { reason?: string } = {}
  ): Promise<void> {
    const consensus = this.consensusProcesses[consensusId];
    if (!consensus) {
      throw new Error(`Consensus process ${consensusId} not found`);
    }

    if (consensus.status !== 'pending') {
      throw new Error(`Consensus process ${consensusId} is not pending (current status: ${consensus.status})`);
    }

    // Create vote object
    const voteObj: ConsensusVote = {
      voter: this.componentId,
      vote,
      timestamp: Date.now(),
      reason: options.reason
    };

    // Record the vote using component ID
    consensus.votes[this.componentId.id] = voteObj;

    // Emit vote event
    this.emit({
      id: `vote-${consensusId}-${Date.now()}`,
      type: "consensus",
      subtype: "vote",
      spaceId: consensus.spaceId,
      source: this.componentId,
      content: {
        consensusId,
        vote: voteObj
      },
    });

    // Check if threshold is reached
    this.checkConsensusThreshold(consensusId);
  }

  /**
   * Check if a consensus has reached its threshold
   */
  private checkConsensusThreshold(consensusId: string): void {
    const consensus = this.consensusProcesses[consensusId];
    if (!consensus || consensus.status !== 'pending') return;

    // If specific voters are defined, check if we have votes from all of them
    const allRequiredVotesIn = consensus.voters && consensus.voters.length > 0 
      ? consensus.voters.every(voterId => 
          Object.keys(consensus.votes).includes(voterId))
      : false;

    const votes = Object.values(consensus.votes).map(v => v.vote);
    const totalVotes = votes.length;
    const yesVotes = votes.filter(v => v).length;

    // Calculate vote percentage
    const yesPercentage = totalVotes > 0 ? yesVotes / totalVotes : 0;
    const noPercentage = totalVotes > 0 ? (totalVotes - yesVotes) / totalVotes : 0;

    // If we have enough votes to decide either way
    if (yesPercentage >= consensus.threshold) {
      this.resolveConsensus(consensusId, true, 'passed');
    } else if (noPercentage > consensus.threshold) {
      this.resolveConsensus(consensusId, false, 'rejected');
    } else if (allRequiredVotesIn) {
      // If all required voters have voted but threshold not met, resolve based on majority
      this.resolveConsensus(consensusId, yesVotes > (totalVotes - yesVotes), 
        yesVotes > (totalVotes - yesVotes) ? 'passed' : 'rejected');
    }
  }

  /**
   * Resolve a consensus process
   */
  private resolveConsensus(
    consensusId: string, 
    result?: boolean, 
    status: ConsensusStatus = 'pending'
  ): void {
    const consensus = this.consensusProcesses[consensusId];
    if (!consensus || consensus.status !== 'pending') return;

    // Clear timeout if it exists
    if (consensus.timeoutId) {
      clearTimeout(consensus.timeoutId);
      consensus.timeoutId = undefined;
    }

    // Record end time
    consensus.endTime = Date.now();

    // Determine result if not provided and status is still pending
    if (result === undefined && status === 'pending') {
      const votes = Object.values(consensus.votes).map(v => v.vote);
      const totalVotes = votes.length;
      const yesVotes = votes.filter(v => v).length;
      result = totalVotes > 0 && yesVotes / totalVotes >= consensus.threshold;
      status = result ? 'passed' : 'rejected';
    } else if (status === 'timeout' && result === undefined) {
      // For timeouts, default to rejection unless specified
      result = false;
    }
    
    // Update consensus state
    consensus.status = status;
    consensus.result = result;

    // Emit consensus result event
    this.emit({
      id: `result-${consensusId}-${Date.now()}`,
      type: "consensus",
      subtype: "result",
      spaceId: consensus.spaceId,
      source: this.componentId,
      content: {
        consensusId,
        result,
        status,
        votes: Object.values(consensus.votes),
        duration: consensus.endTime - consensus.startTime
      },
    });
  }

  /**
   * Get the current state of a consensus process
   */
  async getConsensusState<T>(consensusId: string): Promise<{
    id: string;
    proposal: T;
    votes: ConsensusVote[];
    threshold: number;
    startTime: number;
    endTime?: number;
    result?: boolean;
    status: ConsensusStatus;
  }> {
    const consensus = this.consensusProcesses[consensusId] as ConsensusState<T>;
    if (!consensus) {
      throw new Error(`Consensus process ${consensusId} not found`);
    }

    return {
      id: consensusId,
      proposal: consensus.proposal,
      votes: Object.values(consensus.votes),
      threshold: consensus.threshold,
      startTime: consensus.startTime,
      endTime: consensus.endTime,
      result: consensus.result,
      status: consensus.status,
    };
  }

  /**
   * Get this component's ID
   */
  getComponentId(): NeoComponentId {
    return this.componentId;
  }
}

/**
 * Event creation function that creates an event using NeoRelation as its foundation
 */
export function createNeoEvent<T = any>(config: {
  id?: string;
  type: string;
  subtype?: string;
  source: NeoComponentId;
  target?: NeoComponentId;
  spaceId?: string;
  content?: T;
  relations?: {
    requestId?: string;
    replyTo?: string;
    refersTo?: string;
    follows?: string;
    inThread?: string;
    causedBy?: string;
  };
  metadata?: Record<string, any>;
}): NeoEvent<T> {
  // Import dynamically to avoid circular dependency
  const { createNeoRelation } = require('./relation');
  
  // Extract source ID if it exists
  const sourceId = config.source?.id;
  
  // Extract target ID if it exists
  const targetId = config.target?.id;
  
  // Create a relation first
  const relation = createNeoRelation({
    id: config.id,
    type: config.type,
    source: sourceId,
    target: targetId,
    properties: {
      subtype: config.subtype,
      spaceId: config.spaceId,
      content: config.content,
      source: config.source,
      target: config.target,
      relations: config.relations,
    },
    metadata: {
      ...config.metadata,
      timestamp: Date.now(),
      eventType: true
    },
    context: config.spaceId
  });
  
  // Create the event based on the relation
  const event: NeoEvent<any> = {
    // Core relation properties
    id: relation.id,
    type: relation.type,
    
    // Event-specific properties
    source: config.source,
    target: config.target,
    spaceId: config.spaceId,
    subtype: config.subtype,
    content: config.content,
    timestamp: Date.now(),
    relations: config.relations,
    
    // Metadata
    metadata: {
      ...config.metadata,
      timestamp: Date.now(),
      eventType: true
    }
  };
  
  return event;
}

/**
 * Create a Neo Event Service
 */
export function createEventService(
  componentId: NeoComponentId
): NeoEventService {
  return new LocalNeoEventService(componentId);
}
