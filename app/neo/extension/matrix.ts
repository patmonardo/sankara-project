import { EventEmitter } from 'events';
import { NeoEvent } from '../event';
import { NeoCore, NeoExtension } from '../neo';

/**
 * Matrix Extension
 * 
 * Extends the Neo Core's manifestation into the Matrix domain.
 */
export class MatrixExtension implements NeoExtension {
  id = 'matrix';
  type = 'bridge';
  capabilities = ['matrixCommunication', 'roomSync', 'spaceMapping'];
  
  private core: NeoCore | null = null;
  private spaceRoomMappings: Map<string, string> = new Map(); // spaceId -> roomId
  
  constructor(private matrixEvents: MatrixEventService) {}
  
  initialize(core: NeoCore): void {
    this.core = core;
    this.setupBridges();
    
    // Load any existing mappings from system space
    this.loadMappings();
  }
  
  /**
   * Load existing space-to-room mappings
   */
  private loadMappings(): void {
    if (!this.core) return;
    
    // Try to load mappings from system space
    try {
      const systemSpace = this.core.dialectic.getSpaceState('system');
      const mappings = systemSpace?.matrixRoomMappings;
      
      if (mappings && typeof mappings === 'object') {
        Object.entries(mappings).forEach(([spaceId, roomId]) => {
          if (typeof roomId === 'string') {
            this.spaceRoomMappings.set(spaceId, roomId);
          }
        });
      }
    } catch (e) {
      // Mappings might not exist yet
      console.warn('Could not load Matrix room mappings', e);
    }
  }
  
  /**
   * Set up bidirectional bridges between Neo and Matrix events
   */
  private setupBridges() {
    if (!this.core) return;
    
    // Matrix → Neo Core
    this.matrixEvents.on('*', this.matrixEventToNeo.bind(this));
    
    // Neo Core → Matrix
    this.core.dialectic.onEvent('event', this.neoEventToMatrix.bind(this));
  }
  
  /**
   * Convert a Matrix event to a Neo event and send it to the core
   */
  private matrixEventToNeo(matrixEvent: MatrixEvent) {
    if (!this.core) return;
    
    // Skip events that originated from Neo to prevent loops
    if (matrixEvent.metadata?.fromNeo) return;
    
    // Determine which Neo space this room maps to
    let spaceId = 'matrix';
    for (const [space, room] of this.spaceRoomMappings.entries()) {
      if (room === matrixEvent.roomId) {
        spaceId = space;
        break;
      }
    }
    
    const neoEvent: NeoEvent = {
      id: matrixEvent.id,
      type: this.mapMatrixEventType(matrixEvent.type),
      subtype: matrixEvent.subtype || matrixEvent.type,
      spaceId,
      timestamp: matrixEvent.timestamp,
      content: matrixEvent.content,
      correlationId: matrixEvent.correlationId,
      metadata: {
        ...matrixEvent.metadata,
        fromMatrix: true,
        matrixEventId: matrixEvent.id,
        matrixSender: matrixEvent.senderId,
        viaExtension: this.id
      },
      relations: {
        replyTo: matrixEvent.relations?.replyTo,
        follows: matrixEvent.relations?.replaces,
        inThread: matrixEvent.relations?.threadRoot,
        refersTo: matrixEvent.relations?.parentEvent
      }
    };
    
    this.core.dialectic.emit(neoEvent);
  }
  
  /**
   * Convert a Neo event to a Matrix event and send it to Matrix
   */
  private neoEventToMatrix(neoEvent: NeoEvent) {
    if (!this.core) return;
    
    // Skip events that originated from Matrix to prevent loops
    if (neoEvent.metadata?.fromMatrix) return;
    
    // Skip events processed by this extension
    if (neoEvent.metadata?.viaExtension === this.id) return;
    
    // Determine which Matrix room this space maps to
    const roomId = this.spaceRoomMappings.get(neoEvent.spaceId) || neoEvent.spaceId;
    
    // Skip if this isn't a space we're mapping or if it doesn't look like a Matrix room ID
    if (!this.spaceRoomMappings.has(neoEvent.spaceId) && !roomId.startsWith('!')) return;
    
    const matrixEvent: MatrixEvent = {
      id: neoEvent.id,
      type: this.mapDialecticalEventType(neoEvent.type),
      subtype: neoEvent.subtype,
      roomId,
      senderId: this.matrixEvents.userId,
      timestamp: neoEvent.timestamp,
      content: neoEvent.content,
      metadata: {
        ...neoEvent.metadata,
        fromNeo: true,
        neoEventId: neoEvent.id,
        neoSpace: neoEvent.spaceId,
        viaExtension: this.id
      },
      relations: {
        replyTo: neoEvent.relations?.replyTo,
        replaces: neoEvent.relations?.follows,
        threadRoot: neoEvent.relations?.inThread,
        parentEvent: neoEvent.relations?.refersTo
      }
    };
    
    this.matrixEvents.emit(matrixEvent).catch(err => {
      console.error(`Error sending event to Matrix:`, err);
    });
  }
  
  /**
   * Handle events specifically targeted at this extension
   */
  handleEvent(event: any): void {
    if (!event.content) return;
    
    if (event.type === 'matrix' && event.subtype === 'join-room') {
      this.joinRoom(event.content.roomId, event.content.spaceId);
    } else if (event.type === 'matrix' && event.subtype === 'leave-room') {
      this.leaveRoom(event.content.roomId);
    } else if (event.type === 'matrix' && event.subtype === 'map-space-to-room') {
      this.mapSpaceToRoom(event.content.spaceId, event.content.roomId);
    }
  }
  
  /**
   * Map a Neo space to a Matrix room
   */
  mapSpaceToRoom(spaceId: string, roomId: string): void {
    if (!this.core) return;
    
    // Store the mapping
    this.spaceRoomMappings.set(spaceId, roomId);
    
    // Save to system space
    try {
      const mappings: Record<string, string> = {};
      for (const [space, room] of this.spaceRoomMappings.entries()) {
        mappings[space] = room;
      }
      
      this.core.dialectic.updateSpaceState('system', {
        matrixRoomMappings: mappings
      });
    } catch (e) {
      console.error('Error updating matrix room mappings', e);
    }
    
    // Join the Matrix room if not already joined
    this.matrixEvents.joinRoom(roomId).catch(err => {
      console.error(`Error joining room ${roomId}:`, err);
    });
  }
  
  /**
   * Join a Matrix room and map it to a Neo space
   */
  async joinRoom(roomId: string, spaceId?: string): Promise<void> {
    if (!this.core) return;
    
    const actualSpaceId = spaceId || roomId;
    
    // Join Matrix room
    await this.matrixEvents.joinRoom(roomId);
    
    // Create and join corresponding Neo space if it doesn't exist
    try {
      this.core.dialectic.createSpace(actualSpaceId, `Matrix Room ${roomId}`);
    } catch (e) {
      // Space might already exist
    }
    
    this.core.dialectic.joinSpace(actualSpaceId);
    
    // Map the space to the room
    this.mapSpaceToRoom(actualSpaceId, roomId);
  }
  
  /**
   * Leave a Matrix room
   */
  async leaveRoom(roomId: string): Promise<void> {
    if (!this.core) return;
    
    // Find the space mapping for this room
    let spaceToRemove: string | undefined;
    for (const [space, room] of this.spaceRoomMappings.entries()) {
      if (room === roomId) {
        spaceToRemove = space;
        break;
      }
    }
    
    // Leave Matrix room
    await this.matrixEvents.leaveRoom(roomId);
    
    // Remove the mapping
    if (spaceToRemove) {
      this.spaceRoomMappings.delete(spaceToRemove);
      
      // Update system space
      try {
        const mappings: Record<string, string> = {};
        for (const [space, room] of this.spaceRoomMappings.entries()) {
          mappings[space] = room;
        }
        
        this.core.dialectic.updateSpaceState('system', {
          matrixRoomMappings: mappings
        });
      } catch (e) {
        console.error('Error updating matrix room mappings', e);
      }
    }
  }
  
  // Type mapping methods
  private mapMatrixEventType(matrixType: string): string {
    const typeMap: Record<string, string> = {
      'state': 'state',
      'message': 'message',
      'action': 'action',
      'edit': 'transform',
      'presence': 'system',
      'consensus': 'consensus',
      'sync': 'system',
      'error': 'system',
      'custom': 'custom'
    };
    
    return typeMap[matrixType] || 'system';
  }
  
  private mapDialecticalEventType(dialecticalType: string): string {
    const typeMap: Record<string, string> = {
      'state': 'state',
      'message': 'message',
      'action': 'action',
      'transform': 'edit',
      'system': 'system',
      'consensus': 'consensus',
      'entity': 'state',
      'relation': 'state',
      'property': 'state',
      'model': 'state',
      'dialectic': 'custom'
    };
    
    return typeMap[dialecticalType] || 'custom';
  }
  
  /**
   * Transform an entity between Neo and Matrix domains
   */
  transformEntity(entity: any, direction: 'toDomain' | 'toNeo'): any {
    if (direction === 'toDomain') {
      // Transform Neo entity to Matrix format
      return {
        id: entity.id,
        type: entity.type,
        state_key: entity.id,
        content: entity.properties,
        room_id: this.spaceRoomMappings.get(entity.spaceId) || entity.spaceId,
        sender: entity.metadata?.createdBy,
        origin_server_ts: entity.metadata?.created
      };
    } else {
      // Transform Matrix entity to Neo format
      let spaceId = entity.room_id;
      
      // Check if this room maps to a specific space
      for (const [space, room] of this.spaceRoomMappings.entries()) {
        if (room === entity.room_id) {
          spaceId = space;
          break;
        }
      }
      
      return {
        type: entity.type,
        spaceId,
        properties: entity.content,
        metadata: {
          matrixStateKey: entity.state_key,
          matrixSender: entity.sender,
          matrixTimestamp: entity.origin_server_ts,
          fromMatrix: true
        }
      };
    }
  }
}

/**
 * Create a Matrix Bridge Extension
 */
export function createMatrixExtension(
  matrixEvents: MatrixEventService
): MatrixExtension {
  return new MatrixExtension(matrixEvents);
}

/**
 * Matrix-specific event types
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
 * Matrix event structure
 */
export interface MatrixEvent<T = any> {
  id: string;                     // Unique event ID
  type: MatrixEventType | string; // Event type  
  subtype?: string;               // Specific event subtype
  roomId?: string;                // Room ID (optional for non-room events) 
  senderId?: string;              // ID of event sender
  timestamp: number;              // Creation timestamp  
  content: T;                     // Event content (generic)
  correlationId?: string;         // For tracking related events
  metadata?: Record<string, any>; // Additional metadata
  relations?: {                   // Related events
    replyTo?: string;             // Event this is replying to
    replaces?: string;            // Event this replaces (edit)
    threadRoot?: string;          // Thread root event
    parentEvent?: string;         // Parent event
  };
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