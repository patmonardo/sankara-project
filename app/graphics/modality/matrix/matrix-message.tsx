import { 
  MatrixMessageService, 
  MatrixMessage, 
  MessageType, 
  MessageThread
} from './core/message-service';
import { MatrixProtocolService } from './matrix-protocol';

/**
 * Implementation of MatrixMessageService using Matrix protocol
 */
export class RealMatrixMessageService implements MatrixMessageService {
  private messages: Record<string, MatrixMessage> = {};
  private threads: Record<string, MessageThread> = {};
  
  constructor(public eventService: MatrixProtocolService) {
    // Listen for message events
    this.setupListeners();
  }
  
  private setupListeners() {
    // Listen for message events
    this.eventService.on('message', this.handleMessageEvent.bind(this));
    
    // Listen for reactions
    this.eventService.on('reaction', this.handleReactionEvent.bind(this));
    
    // Listen for redactions
    this.eventService.on('redaction', this.handleRedactionEvent.bind(this));
  }
  
  private async handleMessageEvent(event: any) {
    if (!event.roomId) return;
    
    // Convert to our message format
    const message: MatrixMessage = {
      id: event.id,
      type: this.mapMatrixToMessageType(event.subtype || 'text'),
      roomId: event.roomId,
      senderId: event.senderId || 'unknown',
      content: this.extractMessageContent(event),
      timestamp: event.timestamp,
      threadId: event.relations?.threadRoot,
      replyTo: event.relations?.replyTo,
      edited: !!event.relations?.replaces,
      meta: {
        ...event.meta,
        matrix: true
      }
    };
    
    // Store message
    this.messages[message.id] = message;
    
    // Update thread if applicable
    if (message.threadId) {
      await this.updateThread(message.threadId, message);
    }
    
    // Notify subscribers
    this.emitMessage(message);
  }
  
  private extractMessageContent(event: any): any {
    const content = event.content;
    
    // Handle different message types
    switch (event.subtype) {
      case 'm.text':
      case 'text':
        return { 
          text: content.body,
          formatted: content.formatted_body,
          format: content.format
        };
        
      case 'm.image':
      case 'image':
        return {
          url: content.url,
          thumbnail: content.thumbnail_url,
          width: content.info?.w,
          height: content.info?.h,
          mimetype: content.info?.mimetype
        };
        
      case 'm.file':
      case 'file':
        return {
          url: content.url,
          filename: content.body || content.filename,
          mimetype: content.info?.mimetype,
          size: content.info?.size
        };
        
      case 'm.audio':
      case 'audio':
        return {
          url: content.url,
          duration: content.info?.duration,
          mimetype: content.info?.mimetype,
          size: content.info?.size
        };
        
      case 'm.video':
      case 'video':
        return {
          url: content.url,
          thumbnail: content.thumbnail_url,
          duration: content.info?.duration,
          width: content.info?.w,
          height: content.info?.h,
          mimetype: content.info?.mimetype
        };
        
      case 'm.location':
      case 'location':
        return {
          uri: content.geo_uri,
          description: content.body
        };
        
      default:
        // For custom types or types we don't specifically handle
        return content;
    }
  }
  
  private mapMatrixToMessageType(matrixType: string): MessageType {
    // Map Matrix message types to our internal types
    switch (matrixType) {
      case 'm.text':
      case 'text':
        return 'text';
        
      case 'm.image':
      case 'image':
        return 'media';
        
      case 'm.file':
      case 'file':
      case 'm.audio':
      case 'audio':
      case 'm.video':
      case 'video':
        return 'media';
        
      case 'm.location':
      case 'location':
        return 'media';
        
      case 'm.notice':
      case 'notice':
        return 'notification';
        
      case 'm.emote':
      case 'emote':
        return 'text';
        
      default:
        if (matrixType.startsWith('m.')) {
          return 'system';
        }
        return 'custom';
    }
  }
  
  private handleReactionEvent(event: any) {
    const relationEventId = event.content?.['m.relates_to']?.event_id;
    if (!relationEventId || !event.senderId) return;
    
    const reaction = event.content?.['m.relates_to']?.key;
    if (!reaction) return;
    
    // Update message if we have it
    const message = this.messages[relationEventId];
    if (message) {
      const reactions = message.reactions || {};
      
      if (!reactions[reaction]) {
        reactions[reaction] = [event.senderId];
      } else if (!reactions[reaction].includes(event.senderId)) {
        reactions[reaction].push(event.senderId);
      }
      
      this.messages[relationEventId] = {
        ...message,
        reactions
      };
      
      // Notify subscribers about updated message
      this.emitMessage(this.messages[relationEventId]);
    }
  }
  
  private handleRedactionEvent(event: any) {
    const redactEventId = event.content?.redacts;
    if (!redactEventId) return;
    
    // Remove message if we have it
    const message = this.messages[redactEventId];
    if (message) {
      delete this.messages[redactEventId];
      
      // Update thread if applicable
      if (message.threadId) {
        this.updateThreadAfterDeletion(message.threadId, redactEventId);
      }
    }
  }
  
  private async updateThread(threadId: string, message: MatrixMessage) {
    // Get or create thread
    let thread = this.threads[threadId];
    
    if (!thread) {
      // If this is the root message
      if (message.id === threadId) {
        thread = {
          id: threadId,
          roomId: message.roomId,
          rootMessage: message,
          replyCount: 0,
          participants: [message.senderId]
        };
        this.threads[threadId] = thread;
      } else {
        // This is a reply, but we don't have the root message
        // Try to fetch the root message first
        const rootMessage = await this.getMessage(threadId);
        if (rootMessage) {
          thread = {
            id: threadId,
            roomId: message.roomId,
            rootMessage: rootMessage,
            replyCount: 1,
            latestReply: message,
            participants: [rootMessage.senderId, message.senderId].filter((v, i, a) => a.indexOf(v) === i)
          };
          this.threads[threadId] = thread;
        } else {
          // Can't create thread without root message
          return;
        }
      }
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
    }
    
    // Notify thread subscribers
    this.emitThreadUpdate(thread);
  }
  
  private async updateThreadAfterDeletion(threadId: string, deletedMessageId: string) {
    const thread = this.threads[threadId];
    if (!thread) return;
    
    // If root message was deleted, remove thread
    if (thread.rootMessage.id === deletedMessageId) {
      delete this.threads[threadId];
      return;
    }
    
    // Update reply count
    thread.replyCount = Math.max(0, thread.replyCount - 1);
    
    // If latest reply was deleted, find new latest reply
    if (thread.latestReply?.id === deletedMessageId) {
      // Get thread replies
      const replies = await this.getMessages(thread.roomId, {
        threadId: thread.id,
        limit: 10 // Just get a few recent ones
      });
      
      // Filter out the deleted one and the root message
      const validReplies = replies.filter(m => 
        m.id !== deletedMessageId && m.id !== thread.id
      );
      
      // Sort by timestamp descending
      validReplies.sort((a, b) => b.timestamp - a.timestamp);
      
      // Set new latest reply
      thread.latestReply = validReplies[0];
    }
    
    // Notify thread subscribers
    this.emitThreadUpdate(thread);
  }
  
  // Message subscribers
  private messageCallbacks: Array<(message: MatrixMessage) => void> = [];
  private threadCallbacks: Array<(thread: MessageThread) => void> = [];
  
  private emitMessage(message: MatrixMessage) {
    this.messageCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in message callback:', error);
      }
    });
  }
  
  private emitThreadUpdate(thread: MessageThread) {
    this.threadCallbacks.forEach(callback => {
      try {
        callback(thread);
      } catch (error) {
        console.error('Error in thread callback:', error);
      }
    });
  }
  
  // MatrixMessageService implementation
  
  async sendMessage<T>(message: Omit<MatrixMessage<T>, 'id' | 'timestamp' | 'senderId'>): Promise<string> {
    // Determine Matrix message type based on our message type
    let matrixContent: any;
    let matrixType = 'm.room.message';
    
    switch (message.type) {
      case 'text':
        matrixContent = {
          msgtype: 'm.text',
          body: typeof message.content === 'string' ? message.content : message.content.text || '',
          format: message.content.format || undefined,
          formatted_body: message.content.formatted || undefined
        };
        break;
        
      case 'html':
        matrixContent = {
          msgtype: 'm.text',
          body: this.stripHtml(message.content as string || ''),
          format: 'org.matrix.custom.html',
          formatted_body: message.content as string || ''
        };
        break;
        
      case 'json':
        matrixContent = {
          msgtype: 'org.sankara.json',
          body: JSON.stringify(message.content),
          json: message.content
        };
        break;
        
      case 'action':
        matrixContent = {
          msgtype: 'org.sankara.action',
          body: `Action: ${(message.content as any).actionId || 'unknown'}`,
          action: message.content
        };
        break;
        
      case 'notification':
        matrixContent = {
          msgtype: 'm.notice',
          body: typeof message.content === 'string' ? message.content : message.content.text || '',
        };
        break;
        
      case 'media':
        // Handle media (this would need additional processing in a real implementation)
        matrixContent = {
          msgtype: 'm.file',
          body: message.content.filename || 'File',
          url: message.content.url,
          info: {
            mimetype: message.content.mimetype,
            size: message.content.size
          }
        };
        break;
        
      case 'custom':
      default:
        matrixContent = {
          msgtype: 'org.sankara.custom',
          body: message.content.toString?.() || 'Custom message',
          content: message.content
        };
    }
    
    // Add thread relation if needed
    if (message.threadId) {
      matrixContent['m.relates_to'] = matrixContent['m.relates_to'] || {};
      matrixContent['m.relates_to'].rel_type = 'm.thread';
      matrixContent['m.relates_to'].event_id = message.threadId;
    }
    
    // Add reply relation if needed
    if (message.replyTo) {
      matrixContent['m.relates_to'] = matrixContent['m.relates_to'] || {};
      matrixContent['m.relates_to'].rel_type = 'm.reference';
      matrixContent['m.relates_to'].event_id = message.replyTo;
    }
    
    // Send message through protocol service
    const eventId = await this.eventService.emit({
      type: 'message',
      subtype: matrixContent.msgtype,
      roomId: message.roomId,
      content: matrixContent,
      timestamp: Date.now(),
      relations: {
        threadRoot: message.threadId,
        replyTo: message.replyTo
      },
      meta: message.meta
    });
    
    return eventId;
  }
  
  private stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }
  
  async editMessage<T>(messageId: string, newContent: T): Promise<void> {
    const originalMessage = this.messages[messageId];
    if (!originalMessage) {
      throw new Error(`Message ${messageId} not found`);
    }
    
    // Create a temporary message object to get proper formatting
    const tempMsg: Partial<MatrixMessage> = {
      type: originalMessage.type,
      content: newContent
    };
    
    // Get Matrix content for this type
    let matrixContent: any;
    
    switch (originalMessage.type) {
      case 'text':
        matrixContent = {
          msgtype: 'm.text',
          body: typeof newContent === 'string' ? newContent : (newContent as any).text || '',
          format: (newContent as any).format || undefined,
          formatted_body: (newContent as any).formatted || undefined
        };
        break;
        
      case 'html':
        matrixContent = {
          msgtype: 'm.text',
          body: this.stripHtml(newContent as string || ''),
          format: 'org.matrix.custom.html',
          formatted_body: newContent as string || ''
        };
        break;
        
      // ...similar cases for other types...
        
      default:
        matrixContent = {
          msgtype: 'org.sankara.custom',
          body: (newContent as any).toString?.() || 'Custom message',
          content: newContent
        };
    }
    
    // Add the edit relation
    matrixContent['m.relates_to'] = {
      rel_type: 'm.replace',
      event_id: messageId
    };
    
    // Send the edit
    await this.eventService.emit({
      type: 'message',
      subtype: matrixContent.msgtype,
      roomId: originalMessage.roomId,
      content: matrixContent,
      relations: {
        replaces: messageId,
        threadRoot: originalMessage.threadId
      },
      meta: {
        ...(originalMessage.meta || {}),
        edited: true
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
    
    // Send redaction
    await this.eventService.getClient().redactEvent(message.roomId, messageId);
    
    // Update local cache
    delete this.messages[messageId];
    
    // Update thread if applicable
    if (message.threadId) {
      this.updateThreadAfterDeletion(message.threadId, messageId);
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
    
    // Send reaction
    await this.eventService.getClient().sendEvent(
      message.roomId,
      'm.reaction',
      {
        'm.relates_to': {
          rel_type: 'm.annotation',
          event_id: messageId,
          key: reaction
        }
      }
    );
    
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
    
    const userId = this.eventService.userId || 'unknown';
    
    // Find the reaction event to redact
    // This is complex in Matrix as we need to find the actual reaction event
    // In a real implementation, we'd need to search room history
    // For now, we'll just update our local state
    
    // Update local cache
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
    // Get events from protocol service
    const events = await this.eventService.getRoomEvents(roomId, {
      limit: options.limit,
      before: options.before,
      types: ['message']
    });
    
    // Convert to messages and cache them
    events.forEach(event => {
      if (!this.messages[event.id]) {
        const message: MatrixMessage = {
          id: event.id,
          type: this.mapMatrixToMessageType(event.subtype || 'text'),
          roomId: event.roomId!,
          senderId: event.senderId || 'unknown',
          content: this.extractMessageContent(event),
          timestamp: event.timestamp,
          threadId: event.relations?.threadRoot,
          replyTo: event.relations?.replyTo,
          edited: !!event.relations?.replaces,
          meta: {
            ...event.meta,
            matrix: true
          }
        };
        
        this.messages[event.id] = message;
        
        // Update thread tracking
        if (message.threadId) {
          this.updateThread(message.threadId, message);
        }
      }
    });
    
    // Get all relevant messages from our cache
    let messages = Object.values(this.messages)
      .filter(m => m.roomId === roomId);
    
    // Filter by thread
    if (options.threadId) {
      messages = messages.filter(m => m.threadId === options.threadId || m.id === options.threadId);
    } else {
      // Filter out threaded messages unless they're root messages
      messages = messages.filter(m => !m.threadId || m.id === m.threadId);
    }
    
    // Filter by types
    if (options.types && options.types.length > 0) {
      messages = messages.filter(m => options.types!.includes(m.type));
    }
    
    // Sort by timestamp (newest first)
    messages.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit
    if (options.limit && options.limit > 0) {
      messages = messages.slice(0, options.limit);
    }
    
    return messages;
  }
  
  async getMessage<T>(messageId: string): Promise<MatrixMessage<T> | null> {
    // Check cache first
    if (this.messages[messageId]) {
      return this.messages[messageId] as MatrixMessage<T>;
    }
    
    // If not in cache, try to get from room history
    const client = this.eventService.getClient();
    try {
      const event = await client.fetchRoomEvent(messageId);
      
      if (event) {
        // Convert to our format
        const matrixEvent = {
          id: event.event_id,
          type: 'message',
          subtype: event.type === 'm.room.message' ? event.content?.msgtype : event.type,
          roomId: event.room_id,
          senderId: event.sender,
          timestamp: event.origin_server_ts,
          content: event.content,
          relations: this.extractRelations(event)
        };
        
        // Process and cache the message
        await this.handleMessageEvent(matrixEvent);
        
        // Return from cache
        return this.messages[messageId] as MatrixMessage<T>;
      }
    } catch (error) {
      console.error(`Error fetching message ${messageId}:`, error);
    }
    
    return null;
  }
  
  private extractRelations(event: any): any {
    const relations: any = {};
    
    if (event.content && event.content['m.relates_to']) {
      const rel = event.content['m.relates_to'];
      
      if (rel.rel_type === 'm.replace') {
        relations.replaces = rel.event_id;
      }
      
      if (rel.rel_type === 'm.reference') {
        relations.replyTo = rel.event_id;
      }
      
      if (rel.rel_type === 'm.thread') {
        relations.threadRoot = rel.event_id;
      }
    }
    
    return Object.keys(relations).length > 0 ? relations : undefined;
  }
  
  async createThread<T>(roomId: string, rootContent: T, type: MessageType = 'text'): Promise<MessageThread> {
    // Send root message
    const messageId = await this.sendMessage({
      type,
      roomId,
      content: rootContent
    });
    
    // Thread should be auto-created when the message event is processed
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure event processing
    
    const thread = this.threads[messageId];
    if (!thread) {
      throw new Error('Failed to create thread');
    }
    
    return thread;
  }
  
  async getThread(threadId: string): Promise<MessageThread | null> {
    const thread = this.threads[threadId];
    
    if (!thread) {
      // Try to load the thread if we don't have it
      const rootMessage = await this.getMessage(threadId);
      if (!rootMessage) return null;
      
      // Get thread replies
      const replies = await this.getMessages(rootMessage.roomId, {
        threadId
      });
      
      // Create thread object
      if (replies.length > 0) {
        // Sort by timestamp
        replies.sort((a, b) => b.timestamp - a.timestamp);
        
        const participants = Array.from(
          new Set([rootMessage.senderId, ...replies.map(r => r.senderId)])
        );
        
        this.threads[threadId] = {
          id: threadId,
          roomId: rootMessage.roomId,
          rootMessage,
          replyCount: replies.length,
          latestReply: replies[0],
          participants
        };
        
        return this.threads[threadId];
      }
      
      // Just root message, no replies
      this.threads[threadId] = {
        id: threadId,
        roomId: rootMessage.roomId,
        rootMessage,
        replyCount: 0,
        participants: [rootMessage.senderId]
      };
      
      return this.threads[threadId];
    }
    
    return thread;
  }
  
  async getThreads(roomId: string, options: {
    limit?: number;
    before?: string;
  } = {}): Promise<MessageThread[]> {
    // Get all threads for the room from cache
    const roomThreads = Object.values(this.threads).filter(t => t.roomId === roomId);
    
    // Sort by latest activity
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
 * Create a Matrix message service using the real Matrix protocol
 */
export async function createRealMatrixMessageService(config: {
  homeserverUrl: string;
  accessToken?: string;
  userId?: string;
  deviceId?: string;
  roomIds?: string[];
  autoJoin?: boolean;
  encryption?: {
    enabled: boolean;
    keyBackupEnabled?: boolean;
  };
}): Promise<MatrixMessageService> {
  const protocolService = await createMatrixProtocolService(config);
  return new RealMatrixMessageService(protocolService);
}