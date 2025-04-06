import { MatrixEventService, MatrixEvent, LocalMatrixEventService } from './event-system';

/**
 * Core message types
 */
export type MessageType = 
  | 'text'         // Plain text
  | 'html'         // HTML content
  | 'json'         // JSON data
  | 'action'       // Action message
  | 'notification' // Notification
  | 'system'       // System message
  | 'media'        // Media content
  | 'custom';      // Custom application message

/**
 * Core message structure
 */
export interface MatrixMessage<T = any> {
  id: string;                 // Message ID
  type: MessageType;          // Message type
  roomId: string;             // Room ID 
  senderId: string;           // Sender ID
  content: T;                 // Message content (generic)
  timestamp: number;          // Send timestamp
  threadId?: string;          // Thread ID (optional)
  replyTo?: string;           // Message this is replying to
  edited?: boolean;           // Whether message has been edited
  reactions?: Record<string, string[]>; // Reactions (emoji -> [userIds])
  meta?: Record<string, any>; // Metadata
}

/**
 * Message thread
 */
export interface MessageThread {
  id: string;                 // Thread ID
  roomId: string;             // Room ID
  rootMessage: MatrixMessage; // Root message
  replyCount: number;         // Number of replies
  latestReply?: MatrixMessage; // Latest reply
  participants: string[];     // Participant IDs
}

/**
 * Matrix message service interface
 */
export interface MatrixMessageService {
  // Core message methods
  sendMessage<T>(message: Omit<MatrixMessage<T>, 'id' | 'timestamp' | 'senderId'>): Promise<string>;
  editMessage<T>(messageId: string, newContent: T): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
  replyToMessage<T>(messageId: string, content: T, type?: MessageType): Promise<string>;
  addReaction(messageId: string, reaction: string): Promise<void>;
  removeReaction(messageId: string, reaction: string): Promise<void>;
  
  // Message retrieval
  getMessages(roomId: string, options?: {
    limit?: number;
    before?: string;
    types?: MessageType[];
    threadId?: string;
  }): Promise<MatrixMessage[]>;
  
  getMessage<T>(messageId: string): Promise<MatrixMessage<T> | null>;
  
  // Thread methods
  createThread<T>(roomId: string, rootContent: T, type?: MessageType): Promise<MessageThread>;
  getThread(threadId: string): Promise<MessageThread | null>;
  getThreads(roomId: string, options?: {
    limit?: number;
    before?: string;
  }): Promise<MessageThread[]>;
  
  // Subscription
  onMessage<T>(callback: (message: MatrixMessage<T>) => void): () => void;
  onThreadUpdate(callback: (thread: MessageThread) => void): () => void;
  
  // Connection to event service
  eventService: MatrixEventService;
}

/**
 * Implementation of MatrixMessageService using MatrixEventService
 */
export class MatrixMessageServiceImpl implements MatrixMessageService {
  private messages: Record<string, MatrixMessage> = {};
  private threads: Record<string, MessageThread> = {};
  
  constructor(public eventService: MatrixEventService) {
    // Listen for message events
    this.eventService.on('message', this.handleMessageEvent.bind(this));
  }
  
  private handleMessageEvent(event: MatrixEvent): void {
    if (!event.roomId) return;
    
    // Convert event to message
    const message: MatrixMessage = {
      id: event.id,
      type: (event.subtype || 'text') as MessageType,
      roomId: event.roomId,
      senderId: event.senderId || 'unknown',
      content: event.content,
      timestamp: event.timestamp,
      threadId: event.relations?.threadRoot,
      replyTo: event.relations?.replyTo,
      edited: !!event.relations?.replaces,
      meta: event.meta
    };
    
    // Store message
    this.messages[message.id] = message;
    
    // Update thread if applicable
    if (message.threadId) {
      this.updateThread(message.threadId, message);
    }
    
    // Notify subscribers
    this.messageCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in message callback:', error);
      }
    });
  }
  
  private updateThread(threadId: string, message: MatrixMessage): void {
    const thread = this.threads[threadId];
    
    if (!thread) {
      // If this is a reply to a message we don't know about, ignore
      if (message.id !== threadId) return;
      
      // Create new thread with this message as root
      this.threads[threadId] = {
        id: threadId,
        roomId: message.roomId,
        rootMessage: message,
        replyCount: 0,
        participants: [message.senderId]
      };
    } else {
      // Update existing thread
      if (message.id !== threadId) {
        // This is a reply
        thread.replyCount++;
        thread.latestReply = message;
        
        // Add participant if new
        if (!thread.participants.includes(message.senderId)) {
          thread.participants.push(message.senderId);
        }
      }
      
      // Notify thread subscribers
      this.threadCallbacks.forEach(callback => {
        try {
          callback(this.threads[threadId]);
        } catch (error) {
          console.error('Error in thread callback:', error);
        }
      });
    }
  }
  
  private messageCallbacks: Array<(message: MatrixMessage) => void> = [];
  private threadCallbacks: Array<(thread: MessageThread) => void> = [];
  
  // Core message methods
  async sendMessage<T>(message: Omit<MatrixMessage<T>, 'id' | 'timestamp' | 'senderId'>): Promise<string> {
    // Create Matrix event
    const eventId = await this.eventService.emit({
      type: 'message',
      subtype: message.type,
      roomId: message.roomId,
      content: message.content,
      timestamp: Date.now(),
      relations: {
        threadRoot: message.threadId,
        replyTo: message.replyTo
      },
      meta: message.meta
    });
    
    return eventId;
  }
  
  async editMessage<T>(messageId: string, newContent: T): Promise<void> {
    const originalMessage = this.messages[messageId];
    if (!originalMessage) {
      throw new Error(`Message ${messageId} not found`);
    }
    
    // Create edit event
    await this.eventService.emit({
      type: 'message',
      subtype: originalMessage.type,
      roomId: originalMessage.roomId,
      content: newContent,
      relations: {
        replaces: messageId,
        threadRoot: originalMessage.threadId
      },
      meta: {
        ...(originalMessage.meta || {}),
        edited: true,
        editTimestamp: Date.now()
      }
    });
    
    // Update local cache
    this.messages[messageId] = {
      ...originalMessage,
      content: newContent,
      edited: true,
      meta: {
        ...(originalMessage.meta || {}),
        edited: true,
        editTimestamp: Date.now()
      }
    };
  }
  
  async deleteMessage(messageId: string): Promise<void> {
    const message = this.messages[messageId];
    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }
    
    // Send redaction event
    await this.eventService.emit({
      type: 'message',
      subtype: 'redaction',
      roomId: message.roomId,
      content: {
        redacts: messageId,
        reason: 'Message deleted by user'
      },
      timestamp: Date.now()
    });
    
    // Update local cache
    delete this.messages[messageId];
    
    // Update thread if applicable
    if (message.threadId) {
      const thread = this.threads[message.threadId];
      if (thread) {
        // If this was the root message, delete the thread
        if (thread.rootMessage.id === messageId) {
          delete this.threads[message.threadId];
        } else {
          // Recalculate thread
          thread.replyCount = Math.max(0, thread.replyCount - 1);
          // We'd need to query for a new latest reply, but we'll skip that for simplicity
        }
      }
    }
  }
  
  async replyToMessage<T>(messageId: string, content: T, type: MessageType = 'text'): Promise<string> {
    const originalMessage = this.messages[messageId];
    if (!originalMessage) {
      throw new Error(`Message ${messageId} not found`);
    }
    
    // Determine thread ID
    const threadId = originalMessage.threadId || messageId;
    
    // Send reply
    return this.sendMessage({
      type,
      roomId: originalMessage.roomId,
      content,
      threadId,
      replyTo: messageId
    });
  }
  
  async addReaction(messageId: string, reaction: string): Promise<void> {
    const message = this.messages[messageId];
    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }
    
    // Send reaction event
    await this.eventService.emit({
      type: 'message',
      subtype: 'reaction',
      roomId: message.roomId,
      content: {
        reaction,
        targetId: messageId
      },
      relations: {
        parentEvent: messageId
      },
      timestamp: Date.now()
    });
    
    // Update local cache
    const userId = this.eventService.userId || 'unknown';
    const reactions = message.reactions || {};
    
    if (!reactions[reaction]) {
      reactions[reaction] = [userId];
    } else if (!reactions[reaction].includes(userId)) {
      reactions[reaction].push(userId);
    }
    
    this.messages[messageId] = {
      ...message,
      reactions
    };
  }
  
  async removeReaction(messageId: string, reaction: string): Promise<void> {
    const message = this.messages[messageId];
    if (!message || !message.reactions?.[reaction]) {
      return; // Nothing to do
    }
    
    // Send redaction event for reaction
    await this.eventService.emit({
      type: 'message',
      subtype: 'unreaction',
      roomId: message.roomId,
      content: {
        reaction,
        targetId: messageId
      },
      timestamp: Date.now()
    });
    
    // Update local cache
    const userId = this.eventService.userId || 'unknown';
    const reactions = { ...message.reactions };
    
    if (reactions[reaction]) {
      reactions[reaction] = reactions[reaction].filter(id => id !== userId);
      if (reactions[reaction].length === 0) {
        delete reactions[reaction];
      }
    }
    
    this.messages[messageId] = {
      ...message,
      reactions
    };
  }
  
  async getMessages(roomId: string, options: {
    limit?: number;
    before?: string;
    types?: MessageType[];
    threadId?: string;
  } = {}): Promise<MatrixMessage[]> {
    // Get events from event service
    const events = await this.eventService.getRoomEvents(roomId, {
      limit: options.limit,
      before: options.before,
      types: options.types ? options.types.map(t => 'message') : ['message']
    });
    
    // Convert to messages
    const messages = events.map(event => {
      // Use cached message if available
      if (this.messages[event.id]) {
        return this.messages[event.id];
      }
      
      // Convert event to message
      const message: MatrixMessage = {
        id: event.id,
        type: (event.subtype || 'text') as MessageType,
        roomId: event.roomId!,
        senderId: event.senderId || 'unknown',
        content: event.content,
        timestamp: event.timestamp,
        threadId: event.relations?.threadRoot,
        replyTo: event.relations?.replyTo,
        edited: !!event.relations?.replaces,
        meta: event.meta
      };
      
      // Cache message
      this.messages[message.id] = message;
      
      return message;
    });
    
    // Filter by thread if specified
    if (options.threadId) {
      return messages.filter(m => m.threadId === options.threadId || m.id === options.threadId);
    }
    
    // Filter out threaded messages (unless they're root messages)
    return messages.filter(m => !m.threadId || m.id === m.threadId);
  }
  
  async getMessage<T>(messageId: string): Promise<MatrixMessage<T> | null> {
    // Check cache first
    if (this.messages[messageId]) {
      return this.messages[messageId] as MatrixMessage<T>;
    }
    
    // We'd need to query the event service for this specific message
    // This is a simplified implementation assuming we've already loaded the message
    return null;
  }
  
  async createThread<T>(roomId: string, rootContent: T, type: MessageType = 'text'): Promise<MessageThread> {
    // Send root message
    const messageId = await this.sendMessage({
      type,
      roomId,
      content: rootContent
    });
    
    // Thread should be auto-created when the message event is processed
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to ensure event processing
    
    const thread = this.threads[messageId];
    if (!thread) {
      throw new Error('Failed to create thread');
    }
    
    return thread;
  }
  
  async getThread(threadId: string): Promise<MessageThread | null> {
    return this.threads[threadId] || null;
  }
  
  async getThreads(roomId: string, options: {
    limit?: number;
    before?: string;
  } = {}): Promise<MessageThread[]> {
    // Get all threads for the room
    const roomThreads = Object.values(this.threads).filter(t => t.roomId === roomId);
    
    // Sort by latest activity (latest reply timestamp or root timestamp)
    roomThreads.sort((a, b) => {
      const aTimestamp = a.latestReply?.timestamp || a.rootMessage.timestamp;
      const bTimestamp = b.latestReply?.timestamp || b.rootMessage.timestamp;
      return bTimestamp - aTimestamp;
    });
    
    // Apply pagination
    if (options.before) {
      const beforeIndex = roomThreads.findIndex(t => t.id === options.before);
      if (beforeIndex !== -1) {
        return roomThreads.slice(beforeIndex + 1, beforeIndex + 1 + (options.limit || 10));
      }
    }
    
    return roomThreads.slice(0, options.limit || 10);
  }
  
  onMessage<T>(callback: (message: MatrixMessage<T>) => void): () => void {
    this.messageCallbacks.push(callback as any);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }
  
  onThreadUpdate(callback: (thread: MessageThread) => void): () => void {
    this.threadCallbacks.push(callback);
    return () => {
      this.threadCallbacks = this.threadCallbacks.filter(cb => cb !== callback);
    };
  }
}

/**
 * Create a local message service for development/testing
 */
export function createLocalMessageService(userId?: string): MatrixMessageService {
  const eventService = new LocalMatrixEventService(userId);
  return new MatrixMessageServiceImpl(eventService);
}