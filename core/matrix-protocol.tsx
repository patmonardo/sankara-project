import { EventEmitter } from 'events';
import { MatrixEventService, MatrixEvent, EventDelivery } from './event-system';

/**
 * Connection states for Matrix protocol
 */
export type MatrixConnectionState = 
  | 'disconnected'     // Not connected to any server
  | 'connecting'       // Connection in progress
  | 'connected'        // Connected but not authenticated
  | 'authenticating'   // Authentication in progress
  | 'authenticated'    // Fully authenticated
  | 'syncing'          // Initial sync in progress
  | 'ready'            // Ready for operations
  | 'error';           // Error state

/**
 * Matrix authentication methods
 */
export interface MatrixAuth {
  // Password login
  loginWithPassword: (username: string, password: string, deviceId?: string) => Promise<{
    userId: string;
    accessToken: string;
    deviceId: string;
    homeServer: string;
  }>;
  
  // Token login (e.g., SSO)
  loginWithToken: (token: string, deviceId?: string) => Promise<{
    userId: string;
    accessToken: string;
    deviceId: string;
    homeServer: string;
  }>;
  
  // Store credentials for future use
  storeCredentials: (credentials: {
    userId: string;
    accessToken: string;
    deviceId: string;
    homeServer: string;
  }) => Promise<void>;
  
  // Logout
  logout: () => Promise<void>;
  
  // Register new user
  register: (username: string, password: string, options?: {
    displayName?: string;
    email?: string;
  }) => Promise<{
    userId: string;
    accessToken: string;
    deviceId: string;
    homeServer: string;
  }>;
  
  // Current state
  isAuthenticated: boolean;
  userId?: string;
  deviceId?: string;
  homeServer?: string;
}

/**
 * Matrix room capabilities
 */
export interface MatrixRoom {
  id: string;
  name?: string;
  topic?: string;
  joinedMembers: string[];
  allMembers: string[];
  avatar?: string;
  encrypted: boolean;
  canSendMessages: boolean;
  canInvite: boolean;
  powers: {
    canChangeState: boolean;
    canKick: boolean;
    canBan: boolean;
    canRedactAll: boolean;
  };
}

/**
 * Matrix protocol configuration
 */
export interface MatrixProtocolConfig {
  homeServer: string;
  accessToken?: string;
  userId?: string;
  deviceId?: string;
  autoConnect?: boolean;
  autoJoinRooms?: boolean;
  encryptByDefault?: boolean;
  syncOptions?: {
    timeout?: number;
    fullState?: boolean;
  };
  storageKey?: string;
}

/**
 * Core Matrix protocol service interface
 */
export interface MatrixProtocolService extends MatrixEventService {
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;
  connectionState: MatrixConnectionState;
  
  // Authentication
  auth: MatrixAuth;
  
  // Room management
  createRoom: (options: {
    name?: string;
    topic?: string;
    invite?: string[];
    encrypted?: boolean;
    public?: boolean;
    preset?: 'private_chat' | 'public_chat' | 'trusted_private_chat';
  }) => Promise<{ roomId: string }>;
  
  getRoom: (roomId: string) => Promise<MatrixRoom | null>;
  getRooms: () => Promise<MatrixRoom[]>;
  
  joinRoom: (roomIdOrAlias: string) => Promise<{ roomId: string }>;
  leaveRoom: (roomId: string) => Promise<void>;
  inviteToRoom: (roomId: string, userId: string) => Promise<void>;
  
  // User profile
  getUserProfile: (userId: string) => Promise<{
    displayName?: string;
    avatarUrl?: string;
    presence?: 'online' | 'offline' | 'unavailable';
    lastActiveAgo?: number;
  }>;
  
  setDisplayName: (name: string) => Promise<void>;
  setAvatarUrl: (url: string) => Promise<void>;
  
  // Encryption
  enableEncryption: (roomId: string) => Promise<void>;
  isEncryptionEnabled: (roomId: string) => Promise<boolean>;
  
  // Device management
  getDevices: () => Promise<{
    deviceId: string;
    displayName?: string;
    lastSeen?: {
      timestamp: number;
      ip?: string;
    };
    verified: boolean;
  }[]>;
  
  verifyDevice: (deviceId: string) => Promise<void>;
  deleteDevice: (deviceId: string) => Promise<void>;
  
  // Advanced features
  search: (query: string, options?: {
    roomId?: string;
    limit?: number;
    beforeLimit?: number;
    afterLimit?: number;
  }) => Promise<{
    results: {
      rank: number;
      event: MatrixEvent;
    }[];
    count: number;
  }>;
}

/**
 * Implementation of MatrixProtocolService using matrix-js-sdk 
 * (or mock implementation for testing)
 */
export class MatrixProtocolServiceImpl implements MatrixProtocolService {
  private emitter: EventEmitter = new EventEmitter();
  private config: MatrixProtocolConfig;
  private matrixClient: any | null = null;  // Would be real matrix-js-sdk in production
  
  private _connectionState: MatrixConnectionState = 'disconnected';
  
  constructor(config: MatrixProtocolConfig) {
    this.config = config;
    
    // In a real implementation, we would initialize matrix-js-sdk
    // this.matrixClient = sdk.createClient({
    //   baseUrl: config.homeServer,
    //   accessToken: config.accessToken,
    //   userId: config.userId,
    //   deviceId: config.deviceId
    // });
    
    // Setup auth
    this._auth = {
      isAuthenticated: !!config.accessToken,
      userId: config.userId,
      deviceId: config.deviceId,
      homeServer: config.homeServer,
      
      loginWithPassword: this.loginWithPassword.bind(this),
      loginWithToken: this.loginWithToken.bind(this),
      storeCredentials: this.storeCredentials.bind(this),
      logout: this.logout.bind(this),
      register: this.register.bind(this)
    };
    
    // Auto-connect if configured
    if (config.autoConnect && config.accessToken) {
      this.connect().catch(err => {
        console.error("Failed to auto-connect to Matrix:", err);
        this._connectionState = 'error';
      });
    }
  }
  
  private async loginWithPassword(username: string, password: string, deviceId?: string): Promise<{
    userId: string;
    accessToken: string;
    deviceId: string;
    homeServer: string;
  }> {
    // In real implementation, this would use matrix-js-sdk's login method
    // return this.matrixClient.login('m.login.password', {
    //   user: username,
    //   password: password,
    //   device_id: deviceId
    // });
    
    // Mock implementation
    const mockUserId = `@${username}:${new URL(this.config.homeServer).hostname}`;
    const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const mockDeviceId = deviceId || `mock_device_${Date.now()}`;
    
    const credentials = {
      userId: mockUserId,
      accessToken: mockToken,
      deviceId: mockDeviceId,
      homeServer: this.config.homeServer
    };
    
    // Update internal state
    this._auth.isAuthenticated = true;
    this._auth.userId = mockUserId;
    this._auth.deviceId = mockDeviceId;
    
    return credentials;
  }
  
  private async loginWithToken(token: string, deviceId?: string): Promise<{
    userId: string;
    accessToken: string;
    deviceId: string;
    homeServer: string;
  }> {
    // Mock implementation
    const mockUserId = `@user_${Date.now()}:${new URL(this.config.homeServer).hostname}`;
    const mockDeviceId = deviceId || `mock_device_${Date.now()}`;
    
    const credentials = {
      userId: mockUserId,
      accessToken: token,
      deviceId: mockDeviceId,
      homeServer: this.config.homeServer
    };
    
    // Update internal state
    this._auth.isAuthenticated = true;
    this._auth.userId = mockUserId;
    this._auth.deviceId = mockDeviceId;
    
    return credentials;
  }
  
  private async storeCredentials(credentials: {
    userId: string;
    accessToken: string;
    deviceId: string;
    homeServer: string;
  }): Promise<void> {
    // In real implementation, this would store to localStorage, etc.
    const storageKey = this.config.storageKey || 'matrix_credentials';
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(credentials));
    }
    
    // Update config
    this.config.accessToken = credentials.accessToken;
    this.config.userId = credentials.userId;
    this.config.deviceId = credentials.deviceId;
    
    // Update auth state
    this._auth.isAuthenticated = true;
    this._auth.userId = credentials.userId;
    this._auth.deviceId = credentials.deviceId;
  }
  
  private async logout(): Promise<void> {
    // In real implementation, this would call matrix-js-sdk logout
    // await this.matrixClient.logout();
    
    // Clear credentials
    const storageKey = this.config.storageKey || 'matrix_credentials';
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
    
    // Update state
    this._auth.isAuthenticated = false;
    this._auth.userId = undefined;
    this._auth.deviceId = undefined;
    
    // Disconnect
    await this.disconnect();
  }
  
  private async register(username: string, password: string, options?: {
    displayName?: string;
    email?: string;
  }): Promise<{
    userId: string;
    accessToken: string;
    deviceId: string;
    homeServer: string;
  }> {
    // In real implementation, this would use matrix-js-sdk register method
    // This is a mock implementation
    const mockUserId = `@${username}:${new URL(this.config.homeServer).hostname}`;
    const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const mockDeviceId = `mock_device_${Date.now()}`;
    
    const credentials = {
      userId: mockUserId,
      accessToken: mockToken,
      deviceId: mockDeviceId,
      homeServer: this.config.homeServer
    };
    
    // Update internal state
    this._auth.isAuthenticated = true;
    this._auth.userId = mockUserId;
    this._auth.deviceId = mockDeviceId;
    
    return credentials;
  }
  
  // Auth property
  private _auth: MatrixAuth;
  get auth(): MatrixAuth {
    return this._auth;
  }
  
  // Connection state property
  get connectionState(): MatrixConnectionState {
    return this._connectionState;
  }
  
  // MatrixEventService implementation
  async emit<T>(event: MatrixEvent<T>): Promise<string> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    if (this._connectionState !== 'ready') {
      throw new Error(`Cannot emit events in state: ${this._connectionState}`);
    }
    
    // In real implementation, this would send the event via matrix-js-sdk
    // For room events:
    // if (event.roomId) {
    //   const room = this.matrixClient.getRoom(event.roomId);
    //   const content = event.content;
    //   return this.matrixClient.sendEvent(event.roomId, event.type, content);
    // }
    
    // Generate mock event ID
    const eventId = `$event_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // Fill in missing fields
    const finalEvent: MatrixEvent = {
      ...event,
      id: eventId,
      senderId: event.senderId || this._auth.userId || 'unknown',
      timestamp: event.timestamp || Date.now()
    };
    
    // Emit locally
    if (event.roomId) {
      this.emitter.emit(`${event.roomId}:${event.type}`, finalEvent);
    }
    this.emitter.emit(event.type, finalEvent);
    this.emitter.emit('*', finalEvent);
    
    return eventId;
  }
  
  on<T>(type: string, callback: (event: MatrixEvent<T>) => void): () => void {
    this.emitter.on(type, callback);
    return () => this.off(type, callback);
  }
  
  off(type: string, callback: Function): void {
    this.emitter.off(type, callback);
  }
  
  async joinRoom(roomId: string): Promise<{ roomId: string }> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    if (this._connectionState !== 'ready') {
      throw new Error(`Cannot join room in state: ${this._connectionState}`);
    }
    
    // In real implementation, this would join the room via matrix-js-sdk
    // return this.matrixClient.joinRoom(roomId);
    
    // Mock implementation
    console.log(`[Matrix] Joining room ${roomId}`);
    return { roomId };
  }
  
  async leaveRoom(roomId: string): Promise<void> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    // In real implementation, this would leave the room via matrix-js-sdk
    // return this.matrixClient.leave(roomId);
    
    // Mock implementation
    console.log(`[Matrix] Leaving room ${roomId}`);
  }
  
  async getRoomState<T>(roomId: string, type?: string): Promise<MatrixEvent<T>[]> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    // In real implementation, this would get room state via matrix-js-sdk
    // const room = this.matrixClient.getRoom(roomId);
    // return room.currentState.getStateEvents(type);
    
    // Mock implementation
    return [];
  }
  
  async getRoomEvents<T>(roomId: string, options: {
    limit?: number;
    before?: string;
    types?: string[];
  } = {}): Promise<MatrixEvent<T>[]> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    // In real implementation, this would get room events via matrix-js-sdk
    // const room = this.matrixClient.getRoom(roomId);
    // const timeline = room.getLiveTimeline().getEvents();
    // ... apply filtering, etc.
    
    // Mock implementation
    return [];
  }
  
  async initiateConsensus<T>(roomId: string, proposal: T, options: {
    threshold?: number;
    timeout?: number;
    voters?: string[];
  } = {}): Promise<{id: string}> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    const consensusId = `consensus_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // In real implementation, this would send a consensus start event
    await this.emit({
      type: 'consensus',
      subtype: 'start',
      roomId,
      content: {
        consensusId,
        proposal,
        threshold: options.threshold || 0.51,
        timeout: options.timeout,
        voters: options.voters || []
      },
      timestamp: Date.now()
    });
    
    return { id: consensusId };
  }
  
  async vote(consensusId: string, vote: boolean): Promise<void> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    // In real implementation, this would send a vote event
    // Need to lookup which room this consensus belongs to
    const roomId = "ROOM_ID"; // This would be looked up in real impl
    
    await this.emit({
      type: 'consensus',
      subtype: 'vote',
      roomId,
      content: {
        consensusId,
        vote
      },
      timestamp: Date.now()
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
    // In real implementation, this would aggregate consensus state from events
    // This is a simplified mock
    return {
      id: consensusId,
      proposal: {},
      votes: [],
      threshold: 0.51,
      status: 'pending'
    };
  }
  
  // Connection methods
  async connect(): Promise<void> {
    if (this._connectionState === 'connecting' || 
        this._connectionState === 'connected' || 
        this._connectionState === 'ready') {
      return; // Already connected or connecting
    }
    
    // Update state
    this._connectionState = 'connecting';
    
    try {
      // In real implementation, this would start the Matrix client
      // await this.matrixClient.startClient({
      //   initialSyncLimit: this.config.syncOptions?.initialSyncLimit || 30,
      //   includeArchivedRooms: false
      // });
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate connection time
      
      // If we have an access token, we're authenticated
      if (this.config.accessToken) {
        this._connectionState = 'authenticated';
        this._connectionState = 'syncing';
        
        // Simulate sync
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this._connectionState = 'ready';
      } else {
        this._connectionState = 'connected';
      }
    } catch (error) {
      this._connectionState = 'error';
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    if (this._connectionState === 'disconnected') {
      return; // Already disconnected
    }
    
    // In real implementation, this would stop the Matrix client
    // await this.matrixClient.stopClient();
    
    // Update state
    this._connectionState = 'disconnected';
  }
  
  async reconnect(): Promise<void> {
    await this.disconnect();
    await this.connect();
  }
  
  // Room management
  async createRoom(options: {
    name?: string;
    topic?: string;
    invite?: string[];
    encrypted?: boolean;
    public?: boolean;
    preset?: 'private_chat' | 'public_chat' | 'trusted_private_chat';
  }): Promise<{ roomId: string }> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    // In real implementation, this would create a room via matrix-js-sdk
    // return this.matrixClient.createRoom({
    //   name: options.name,
    //   topic: options.topic,
    //   invite: options.invite,
    //   preset: options.preset || 'private_chat',
    //   visibility: options.public ? 'public' : 'private',
    //   initial_state: options.encrypted ? [
    //     {
    //       type: 'm.room.encryption',
    //       state_key: '',
    //       content: { algorithm: 'm.megolm.v1.aes-sha2' }
    //     }
    //   ] : undefined
    // });
    
    // Mock implementation
    const roomId = `!room_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    return { roomId };
  }
  
  async getRoom(roomId: string): Promise<MatrixRoom | null> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    // In real implementation, this would get room via matrix-js-sdk
    // const room = this.matrixClient.getRoom(roomId);
    // if (!room) return null;
    // 
    // return {
    //   id: roomId,
    //   name: room.name,
    //   topic: room.currentState.getStateEvents('m.room.topic', '')?.getContent().topic,
    //   // ... other properties
    // };
    
    // Mock implementation
    return {
      id: roomId,
      name: `Room ${roomId.substring(1, 6)}`,
      joinedMembers: [this._auth.userId || 'unknown'],
      allMembers: [this._auth.userId || 'unknown'],
      encrypted: false,
      canSendMessages: true,
      canInvite: true,
      powers: {
        canChangeState: true,
        canKick: true,
        canBan: true,
        canRedactAll: true
      }
    };
  }
  
  async getRooms(): Promise<MatrixRoom[]> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    // In real implementation, this would get all rooms via matrix-js-sdk
    // return this.matrixClient.getRooms().map(room => ({
    //   id: room.roomId,
    //   name: room.name,
    //   // ... other properties
    // }));
    
    // Mock implementation
    return [{
      id: '!mockroom:example.org',
      name: 'Mock Room',
      joinedMembers: [this._auth.userId || 'unknown'],
      allMembers: [this._auth.userId || 'unknown'],
      encrypted: false,
      canSendMessages: true,
      canInvite: true,
      powers: {
        canChangeState: true,
        canKick: true,
        canBan: true,
        canRedactAll: true
      }
    }];
  }
  
  async inviteToRoom(roomId: string, userId: string): Promise<void> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    // In real implementation, this would invite via matrix-js-sdk
    // return this.matrixClient.invite(roomId, userId);
    
    // Mock implementation
    console.log(`[Matrix] Invited ${userId} to room ${roomId}`);
  }
  
  // User profile methods
  async getUserProfile(userId: string): Promise<{
    displayName?: string;
    avatarUrl?: string;
    presence?: 'online' | 'offline' | 'unavailable';
    lastActiveAgo?: number;
  }> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    // In real implementation, this would get profile via matrix-js-sdk
    // return this.matrixClient.getProfileInfo(userId);
    
    // Mock implementation
    return {
      displayName: userId.split(':')[0].substring(1),
      presence: 'online',
      lastActiveAgo: 0
    };
  }
  
  async setDisplayName(name: string): Promise<void> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    // In real implementation, this would set display name via matrix-js-sdk
    // return this.matrixClient.setDisplayName(name);
    
    // Mock implementation
    console.log(`[Matrix] Set display name to ${name}`);
  }
  
  async setAvatarUrl(url: string): Promise<void> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    // In real implementation, this would set avatar via matrix-js-sdk
    // return this.matrixClient.setAvatarUrl(url);
    
    // Mock implementation
    console.log(`[Matrix] Set avatar URL to ${url}`);
  }
  
  // Encryption methods
  async enableEncryption(roomId: string): Promise<void> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    // In real implementation, this would enable encryption via matrix-js-sdk
    // return this.matrixClient.sendStateEvent(
    //   roomId,
    //   'm.room.encryption',
    //   { algorithm: 'm.megolm.v1.aes-sha2' },
    //   ''
    // );
    
    // Mock implementation
    console.log(`[Matrix] Enabled encryption in room ${roomId}`);
  }
  
  async isEncryptionEnabled(roomId: string): Promise<boolean> {
    // In real implementation, this would check room state via matrix-js-sdk
    // const room = this.matrixClient.getRoom(roomId);
    // return !!room?.currentState.getStateEvents('m.room.encryption', '');
    
    // Mock implementation
    return false;
  }
  
  // Device management
  async getDevices(): Promise<{
    deviceId: string;
    displayName?: string;
    lastSeen?: {
      timestamp: number;
      ip?: string;
    };
    verified: boolean;
  }[]> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    // In real implementation, this would get devices via matrix-js-sdk
    // const response = await this.matrixClient.getDevices();
    // return response.devices;
    
    // Mock implementation
    return [{
      deviceId: this._auth.deviceId || 'unknown',
      displayName: 'Mock Device',
      lastSeen: {
        timestamp: Date.now(),
        ip: '127.0.0.1'
      },
      verified: true
    }];
  }
  
  async verifyDevice(deviceId: string): Promise<void> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    // In real implementation, this would verify device via matrix-js-sdk
    // This is complex and depends on the verification method
    
    // Mock implementation
    console.log(`[Matrix] Verified device ${deviceId}`);
  }
  
  async deleteDevice(deviceId: string): Promise<void> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    // In real implementation, this would delete device via matrix-js-sdk
    // return this.matrixClient.deleteDevice(deviceId);
    
    // Mock implementation
    console.log(`[Matrix] Deleted device ${deviceId}`);
  }
  
  // Search
  async search(query: string, options: {
    roomId?: string;
    limit?: number;
    beforeLimit?: number;
    afterLimit?: number;
  } = {}): Promise<{
    results: {
      rank: number;
      event: MatrixEvent;
    }[];
    count: number;
  }> {
    if (!this._auth.isAuthenticated) {
      throw new Error("Not authenticated to Matrix");
    }
    
    // In real implementation, this would search via matrix-js-sdk
    // return this.matrixClient.searchMessages({
    //   term: query,
    //   roomId: options.roomId,
    //   limit: options.limit
    // });
    
    // Mock implementation
    return {
      results: [],
      count: 0
    };
  }
}

/**
 * Create a Matrix protocol service
 */
export function createMatrixProtocolService(config: MatrixProtocolConfig): MatrixProtocolService {
  return new MatrixProtocolServiceImpl(config);
}