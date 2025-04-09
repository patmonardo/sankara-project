import { EventEmitter } from "events";
import { NeoComponentId, NeoSpaceId } from "./dialectic";

/**
 * Core event types for the Neo event system
 */
export type NeoEventType =
  | "system" // System events
  | "extension" // Extension events
  | "space" // Space events
  | "form" // Form events
  | "entity" // Entity events (creation, updates)
  | "relation" // Relation events
  | "graph" // Graph events
  | "property" // Property events
  | "message" // Message events
  | "dialectic" // Dialectical events
  | "consensus" // Consensus events
  | "custom"; // Custom events

/**
 * Neo Event Interface
 *
 * Represents any event in the Neo system
 */
export interface NeoEvent<T = any> {
  // Identity
  id: string;

  // Timing
  timestamp?: number;

  // Classification
  type: NeoEventType;
  subtype?: string;

  // Context
  source?: NeoComponentId;
  target?: NeoComponentId;
  spaceId?: NeoSpaceId;

  // Content
  content?: T;

  // Relations to other events
  relations?: {
    requestId?: string;
    replyTo?: string;
    refersTo?: string;
    follows?: string;
    inThread?: string;
    causedBy?: string;
  };

  // Additional attributes
  metadata?: Record<string, any>;
}
/**
 * Neo event emitter interface
 */
export interface NeoEventEmitter {
  emit<T>(event: NeoEvent<T>): string;
  onEvent<T>(type: string, callback: (event: NeoEvent<T>) => void): () => void;
  offEvent(type: string, callback: Function): void;
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

  vote(consensusId: string, vote: boolean): Promise<void>; // Cast a vote

  getConsensusState(consensusId: string): Promise<{
    id: string;
    proposal: any;
    votes: { userId: string; vote: boolean }[];
    threshold: number;
    result?: boolean;
    status: "pending" | "passed" | "rejected" | "timeout";
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
  private consensusProcesses: Record<string, any> = {};
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
      id: spaceId,
      type: "space",
      subtype: "join",
      spaceId,
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
      id: spaceId,
      type: "space",
      subtype: "leave",
      spaceId,
      content: {
        componentId: this.componentId,
        action: "leave",
      },
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
      id: spaceId,
      type: "space",
      subtype: "create",
      spaceId,
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

    // Create consensus process
    this.consensusProcesses[consensusId] = {
      id: consensusId,
      spaceId,
      proposal,
      threshold: options.threshold || 0.51,
      timeout: options.timeout,
      timeoutId: options.timeout
        ? setTimeout(() => this.resolveConsensus(consensusId), options.timeout)
        : undefined,
      votes: {},
      voters: options.voters || [],
      status: "pending" as "pending" | "passed" | "rejected" | "timeout",
    };

    // Emit consensus start event
    this.emit({
      id: consensusId,
      type: "consensus",
      subtype: "start",
      spaceId,
      content: {
        consensusId,
        proposal,
        threshold: options.threshold || 0.51,
        timeout: options.timeout,
        voters: options.voters || [],
      },
    });

    return consensusId;
  }

  /**
   * Cast a vote in a consensus process
   */
  async vote(consensusId: string, vote: boolean): Promise<void> {
    const consensus = this.consensusProcesses[consensusId];
    if (!consensus) {
      throw new Error(`Consensus process ${consensusId} not found`);
    }

    if (consensus.status !== "pending") {
      throw new Error(`Consensus process ${consensusId} is not pending`);
    }

    // Record the vote
    consensus.votes[this.componentId.id] = vote;

    // Emit vote event
    this.emit({
      id: consensusId,
      type: "consensus",
      subtype: "vote",
      spaceId: consensus.spaceId,
      content: {
        consensusId,
        componentId: this.componentId,
        vote,
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
    if (!consensus || consensus.status !== "pending") return;

    const votes = Object.values(consensus.votes) as boolean[];
    const totalVotes = votes.length;
    const yesVotes = votes.filter((v) => v).length;

    // Calculate vote percentage
    const yesPercentage = totalVotes > 0 ? yesVotes / totalVotes : 0;

    // If we have enough votes to decide either way
    if (yesPercentage >= consensus.threshold) {
      this.resolveConsensus(consensusId, true);
    } else if (1 - yesPercentage > consensus.threshold) {
      this.resolveConsensus(consensusId, false);
    }
  }

  /**
   * Resolve a consensus process
   */
  private resolveConsensus(consensusId: string, result?: boolean): void {
    const consensus = this.consensusProcesses[consensusId];
    if (!consensus || consensus.status !== "pending") return;

    // Clear timeout if it exists
    if (consensus.timeoutId) {
      clearTimeout(consensus.timeoutId);
    }

    // Determine result if not provided
    if (result === undefined) {
      const votes = Object.values(consensus.votes) as boolean[];
      const totalVotes = votes.length;
      const yesVotes = votes.filter((v) => v).length;
      result = totalVotes > 0 && yesVotes / totalVotes >= consensus.threshold;

      // Update status
      consensus.status = result ? "passed" : "rejected";
    } else {
      consensus.status = result ? "passed" : "rejected";
    }

    // Emit consensus result event
    this.emit({
      id: consensusId,
      type: "consensus",
      subtype: "result",
      spaceId: consensus.spaceId,
      content: {
        consensusId,
        result,
        status: consensus.status,
        votes: Object.entries(consensus.votes).map(([componentId, vote]) => ({
          userId: componentId,
          vote,
        })),
      },
    });
  }

  /**
   * Get the current state of a consensus process
   */
  async getConsensusState(consensusId: string): Promise<{
    id: string;
    proposal: any;
    votes: { userId: string; vote: boolean }[];
    threshold: number;
    result?: boolean;
    status: "pending" | "passed" | "rejected" | "timeout";
  }> {
    const consensus = this.consensusProcesses[consensusId];
    if (!consensus) {
      throw new Error(`Consensus process ${consensusId} not found`);
    }

    return {
      id: consensusId,
      proposal: consensus.proposal,
      votes: Object.entries(consensus.votes).map(([userId, vote]) => ({
        userId,
        vote: vote as boolean,
      })),
      threshold: consensus.threshold,
      result:
        consensus.status === "pending"
          ? undefined
          : consensus.status === "passed",
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
 * Create a Neo Event Service
 */
export function createEventService(
  componentId: NeoComponentId
): NeoEventService {
  return new LocalNeoEventService(componentId);
}
