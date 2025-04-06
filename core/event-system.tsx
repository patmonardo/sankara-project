import { EventEmitter } from 'events';

/**
 * Core event types for the Matrix event system
 */
export type MatrixEventType = 
  | 'state'        // Room state events
  | 'message'      // Message events
  | 'action'       // UI action events
  | 'edit'         // Content edit events
  | 'presence'     // User presence events
  | 'consensus'    // Consensus-related events
  | 'sync'         // Synchronization events
  | 'error'        // Error events
  | 'system'       // System events
  | 'custom';      // Custom application events

/**
 * Matrix event priority levels
 */
export type EventPriority = 
  | 'critical'     // Must be delivered and processed
  | 'high'         // Important events
  | 'normal'       // Standard events
  | 'low'          // Background events
  | 'debug';       // Debugging information

/**
 * Matrix event delivery guarantees
 */
export type EventDelivery = 
  | 'guaranteed'   // Must be delivered, with retries
  | 'atleastonce'  // Delivered at least once, may be duplicated
  | 'besteffort';  // Try to deliver but may fail

/**
 * Core event message structure
 */
export interface MatrixEvent<T = any> {
  id: string;                     // Unique event ID
  type: MatrixEventType;          // Event type
  subtype?: string;               // Application-specific subtype
  roomId?: string;                // Room ID (optional for non-room events)
  senderId?: string;              // ID of event sender
  timestamp: number;              // Creation timestamp
  content: T;                     // Event content (generic)
  priority?: EventPriority;       // Event priority
  delivery?: EventDelivery;       // Delivery guarantee
  encrypted?: boolean;            // Whether event is encrypted
  distributed?: boolean;          // Whether event is distributed
  relations?: {                   // Related events
    replyTo?: string;             // Event this is replying to
    replaces?: string;            // Event this replaces (edit)
    threadRoot?: string;          // Thread root event
    parentEvent?: string;         // Parent event
  };
  meta?: Record<string, any>;     // Metadata
}

/**
 * Matrix event service interface
 */
export interface MatrixEventService {
  // Core event methods
  emit<T>(event: MatrixEvent<T>): Promise<string>;                 // Send an event, returns event ID
  on<T>(type: string, callback: (event: MatrixEvent<T>) => void): () => void;  // Listen for events
  off(type: string, callback: Function): void;                     // Remove listener
  
  // Room-specific methods
  joinRoom(roomId: string): Promise<void>;                         // Join a room
  leaveRoom(roomId: string): Promise<void>;                        // Leave a room
  getRoomState<T = any>(roomId: string, type?: string): Promise<MatrixEvent<T>[]>;  // Get room state
  getRoomEvents<T = any>(roomId: string, options?: {
    limit?: number;
    before?: string;
    types?: string[];
  }): Promise<MatrixEvent<T>[]>;                                  // Get room events
  
  // Consensus methods
  initiateConsensus<T>(roomId: string, proposal: T, options?: {
    threshold?: number;
    timeout?: number;
    voters?: string[];
  }): Promise<{id: string}>;                                      // Start consensus process
  vote(consensusId: string, vote: boolean): Promise<void>;         // Cast a vote
  getConsensusState(consensusId: string): Promise<{
    id: string;
    proposal: any;
    votes: {userId: string; vote: boolean}[];
    threshold: number;
    result?: boolean;
    status: 'pending' | 'passed' | 'rejected' | 'timeout';
  }>;                                                             // Get consensus state
  
  // Connection state
  connectionState: 'connected' | 'connecting' | 'disconnected';
  userId?: string;
  deviceId?: string;
}

/**
 * In-memory implementation of MatrixEventService
 * (For development/testing without actual Matrix server)
 */
export class LocalMatrixEventService implements MatrixEventService {
  private emitter = new EventEmitter();
  private events: Record<string, MatrixEvent[]> = {};
  private rooms: Set<string> = new Set();
  private consensusProcesses: Record<string, any> = {};
  
  public connectionState: 'connected' | 'connecting' | 'disconnected' = 'disconnected';
  public userId?: string;
  public deviceId?: string;
  
  constructor(userId?: string) {
    this.userId = userId || `local-user-${Date.now()}`;
    this.deviceId = `local-device-${Date.now()}`;
    this.connectionState = 'connected';
  }
  
  async emit<T>(event: MatrixEvent<T>): Promise<string> {
    const finalEvent = {
      ...event,
      id: event.id || `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: event.timestamp || Date.now(),
      senderId: event.senderId || this.userId
    };
    
    // Store event if it has a roomId
    if (finalEvent.roomId) {
      if (!this.events[finalEvent.roomId]) {
        this.events[finalEvent.roomId] = [];
      }
      this.events[finalEvent.roomId].push(finalEvent);
    }
    
    // Emit the event
    const eventKey = finalEvent.roomId 
      ? `${finalEvent.roomId}:${finalEvent.type}` 
      : finalEvent.type;
    
    this.emitter.emit(eventKey, finalEvent);
    this.emitter.emit('*', finalEvent); // Global listener
    
    return finalEvent.id;
  }
  
  on<T>(type: string, callback: (event: MatrixEvent<T>) => void): () => void {
    this.emitter.on(type, callback);
    return () => this.off(type, callback);
  }
  
  off(type: string, callback: Function): void {
    this.emitter.off(type, callback);
  }
  
  async joinRoom(roomId: string): Promise<void> {
    this.rooms.add(roomId);
    
    // Create room if it doesn't exist in our event store
    if (!this.events[roomId]) {
      this.events[roomId] = [];
    }
    
    // Emit a join event
    await this.emit({
      id: `join-${Date.now()}`,
      type: 'presence',
      subtype: 'join',
      roomId,
      timestamp: Date.now(),
      content: {
        userId: this.userId,
        membership: 'join'
      }
    });
  }
  
  async leaveRoom(roomId: string): Promise<void> {
    this.rooms.delete(roomId);
    
    // Emit a leave event
    await this.emit({
      id: `leave-${Date.now()}`,
      type: 'presence',
      subtype: 'leave',
      roomId,
      timestamp: Date.now(),
      content: {
        userId: this.userId,
        membership: 'leave'
      }
    });
  }
  
  async getRoomState<T>(roomId: string, type?: string): Promise<MatrixEvent<T>[]> {
    if (!this.events[roomId]) return [];
    
    return this.events[roomId]
      .filter(e => e.type === 'state' && (!type || e.subtype === type))
      .map(e => e as unknown as MatrixEvent<T>);
  }
  
  async getRoomEvents<T>(roomId: string, options: {
    limit?: number;
    before?: string;
    types?: string[];
  } = {}): Promise<MatrixEvent<T>[]> {
    if (!this.events[roomId]) return [];
    
    let events = this.events[roomId];
    
    // Filter by types if provided
    if (options.types && options.types.length > 0) {
      events = events.filter(e => options.types?.includes(e.type));
    }
    
    // Filter by before if provided
    if (options.before) {
      const beforeIndex = events.findIndex(e => e.id === options.before);
      if (beforeIndex !== -1) {
        events = events.slice(0, beforeIndex);
      }
    }
    
    // Sort by timestamp (newest first)
    events = [...events].sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit if provided
    if (options.limit && options.limit > 0) {
      events = events.slice(0, options.limit);
    }
    
    return events as unknown as MatrixEvent<T>[];
  }
  
  async initiateConsensus<T>(
    roomId: string, 
    proposal: T, 
    options: {
      threshold?: number;
      timeout?: number;
      voters?: string[];
    } = {}
  ): Promise<{id: string}> {
    const consensusId = `consensus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create consensus process
    this.consensusProcesses[consensusId] = {
      id: consensusId,
      roomId,
      proposal,
      threshold: options.threshold || 0.51,
      timeout: options.timeout,
      timeoutId: options.timeout ? setTimeout(() => this.resolveConsensus(consensusId), options.timeout) : undefined,
      votes: {},
      voters: options.voters || [],
      status: 'pending' as 'pending' | 'passed' | 'rejected' | 'timeout'
    };
    
    // Emit consensus start event
    await this.emit({
      id: `consensus-start-${consensusId}`,
      type: 'consensus',
      subtype: 'start',
      roomId,
      timestamp: Date.now(),
      content: {
        consensusId,
        proposal,
        threshold: options.threshold || 0.51,
        timeout: options.timeout,
        voters: options.voters || []
      }
    });
    
    return { id: consensusId };
  }
  
  async vote(consensusId: string, vote: boolean): Promise<void> {
    const consensus = this.consensusProcesses[consensusId];
    if (!consensus) {
      throw new Error(`Consensus process ${consensusId} not found`);
    }
    
    if (consensus.status !== 'pending') {
      throw new Error(`Consensus process ${consensusId} is not pending`);
    }
    
    // Record the vote
    consensus.votes[this.userId!] = vote;
    
    // Emit vote event
    await this.emit({
      id: `consensus-vote-${consensusId}-${this.userId}`,
      type: 'consensus',
      subtype: 'vote',
      roomId: consensus.roomId,
      timestamp: Date.now(),
      content: {
        consensusId,
        userId: this.userId,
        vote
      }
    });
    
    // Check if threshold is reached
    this.checkConsensusThreshold(consensusId);
  }
  
  private checkConsensusThreshold(consensusId: string): void {
    const consensus = this.consensusProcesses[consensusId];
    if (!consensus || consensus.status !== 'pending') return;
    
    const votes = Object.values(consensus.votes) as boolean[];
    const totalVotes = votes.length;
    const yesVotes = votes.filter(v => v).length;
    
    // Calculate vote percentage
    const yesPercentage = totalVotes > 0 ? yesVotes / totalVotes : 0;
    
    // If we have enough votes to decide either way
    if (yesPercentage >= consensus.threshold) {
      this.resolveConsensus(consensusId, true);
    } else if ((1 - yesPercentage) > consensus.threshold) {
      this.resolveConsensus(consensusId, false);
    }
  }
  
  private async resolveConsensus(consensusId: string, result?: boolean): Promise<void> {
    const consensus = this.consensusProcesses[consensusId];
    if (!consensus || consensus.status !== 'pending') return;
    
    // Clear timeout if it exists
    if (consensus.timeoutId) {
      clearTimeout(consensus.timeoutId);
    }
    
    // Determine result if not provided
    if (result === undefined) {
      const votes = Object.values(consensus.votes) as boolean[];
      const totalVotes = votes.length;
      const yesVotes = votes.filter(v => v).length;
      result = totalVotes > 0 && (yesVotes / totalVotes) >= consensus.threshold;
      
      // Update status
      consensus.status = result ? 'passed' : 'rejected';
    } else {
      consensus.status = result ? 'passed' : 'rejected';
    }
    
    // Emit consensus result event
    await this.emit({
      id: `consensus-result-${consensusId}`,
      type: 'consensus',
      subtype: 'result',
      roomId: consensus.roomId,
      timestamp: Date.now(),
      content: {
        consensusId,
        result,
        status: consensus.status,
        votes: Object.entries(consensus.votes).map(([userId, vote]) => ({ userId, vote }))
      }
    });
  }
  
  async getConsensusState(consensusId: string): Promise<{
    id: string;
    proposal: any;
    votes: {userId: string; vote: boolean}[];
    threshold: number;
    result?: boolean;
    status: 'pending' | 'passed' | 'rejected' | 'timeout';
  }> {
    const consensus = this.consensusProcesses[consensusId];
    if (!consensus) {
      throw new Error(`Consensus process ${consensusId} not found`);
    }
    
    return {
      id: consensusId,
      proposal: consensus.proposal,
      votes: Object.entries(consensus.votes).map(([userId, vote]) => ({ userId, vote: vote as boolean })),
      threshold: consensus.threshold,
      result: consensus.status === 'pending' ? undefined : consensus.status === 'passed',
      status: consensus.status
    };
  }
}