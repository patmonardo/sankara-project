import { NeoComponentId } from '@/neo/extension';

export type NeoRelationId = string;

export interface NeoRelation<T = any> {
  id: NeoRelationId;
  type: string;
  source: NeoComponentId;
  target?: NeoComponentId;
  subtype?: string;
  content?: T;
  metadata?: Record<string, any>;
  timestamp?: number;
}

export class RelationService {
  private static relations: Map<string, NeoRelation> = new Map();

  /**
   * Create a basic relation between two entities
   */
  static relate(source: NeoComponentId, target: NeoComponentId, type: string, metadata?: Record<string, any>): string {
    const relationId = `relation:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    const relation: NeoRelation = {
      id: relationId,
      type,
      source,
      target,
      metadata: { ...metadata, created: Date.now() },
      timestamp: Date.now(),
    };

    this.relations.set(relationId, relation);
    return relationId;
  }

  /**
   * Emit an event as a relation
   */
  static emit(source: NeoComponentId, type: string, content: Record<string, any>, metadata?: Record<string, any>): string {
    const eventId = `event:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    const event: NeoRelation = {
      id: eventId,
      type: "event",
      source,
      subtype: type,
      content,
      metadata: { ...metadata, created: Date.now() },
      timestamp: Date.now(),
    };

    this.relations.set(eventId, event);
    return eventId;
  }

  /**
   * Send a message as a relation
   */
  static send(source: NeoComponentId, target: NeoComponentId, type: string, content: Record<string, any>, metadata?: Record<string, any>): string {
    const messageId = `message:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    const message: NeoRelation = {
      id: messageId,
      type: "message",
      source,
      target,
      subtype: type,
      content,
      metadata: { ...metadata, created: Date.now() },
      timestamp: Date.now(),
    };

    this.relations.set(messageId, message);
    return messageId;
  }

  /**
   * Broadcast a message to all targets in a context
   */
  static broadcast(source: NeoComponentId, targets: NeoComponentId[], type: string, content: Record<string, any>, metadata?: Record<string, any>): string[] {
    const messageIds: string[] = [];
    for (const target of targets) {
      const messageId = this.send(source, target, type, content, metadata);
      messageIds.push(messageId);
    }
    return messageIds;
  }

  /**
   * Query relations by type, source, or target
   */
  static query(filter: { type?: string; sourceId?: string; targetId?: string }): NeoRelation[] {
    return Array.from(this.relations.values()).filter(relation => {
      if (filter.type && relation.type !== filter.type) return false;
      if (filter.sourceId && relation.source.id !== filter.sourceId) return false;
      if (filter.targetId && relation.target?.id !== filter.targetId) return false;
      return true;
    });
  }

  /**
   * Remove a relation by ID
   */
  static remove(relationId: string): boolean {
    return this.relations.delete(relationId);
  }
}