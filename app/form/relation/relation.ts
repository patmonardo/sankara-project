import { FormEntity } from "@/form/entity/entity";

export type FormRelationId = string;

export class FormRelation<T = any> {
  private static relations: Map<string, FormRelation> = new Map();
  public id: FormRelationId;
  public type: string;
  public source: FormEntity;
  public target?: FormEntity;
  public subtype?: string;
  public content?: T;
  public metadata?: Record<string, any>;
  public timestamp?: number;

  /**
   * Create a new relation
   */
  constructor(config: {
    id?: string;
    type: string;
    source: FormEntity;
    target?: FormEntity;
    subtype?: string;
    content?: T;
    metadata?: Record<string, any>;
  }) {
    this.id = config.id || `relation:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    this.type = config.type;
    this.source = config.source;
    this.target = config.target;
    this.subtype = config.subtype;
    this.content = config.content;
    this.metadata = config.metadata || { created: Date.now() };
    this.timestamp = Date.now();
  }

  /**
   * Get a relation by ID
   */
  static getRelation(id: string): FormRelation | undefined {
    return FormRelation.relations.get(id);
  }

  /**
   * Update a relation with new properties
   */
  static updateRelation(id: string, updates: Partial<FormRelation>): boolean {
    const relation = FormRelation.relations.get(id);
    if (!relation) return false;

    // Create updated relation
    const updatedRelation = {
      ...relation,
      ...updates,
      // Preserve metadata or create if not present
      metadata: {
        ...(relation.metadata || {}),
        ...(updates.metadata || {}),
        updated: Date.now(),
      },
      timestamp: Date.now(),
    };

    // Update in storage
    FormRelation.relations.set(id, updatedRelation);

    return true;
  }

  /**
   * Create a relation from configuration
   */
  static createRelation(config: {
    source: { id: string; type: string };
    target: { id: string; type: string };
    type: string;
    content?: any;
  }): string {
    const relationId = `relation:${Date.now()}:${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const relation: FormRelation = {
      id: relationId,
      type: config.type,
      source: config.source,
      target: config.target,
      subtype: config.type,
      content: config.content,
      metadata: {
        created: Date.now(),
      },
      timestamp: Date.now(),
    };

    FormRelation.relations.set(relationId, relation);
    return relationId;
  }
  /**
   * Create a basic relation between two entities
   */
  static relate(
    source: FormEntity,
    target: FormEntity,
    type: string,
    metadata?: Record<string, any>
  ): string {
    const relationId = `relation:${Date.now()}:${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const relation: FormRelation = {
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
  static emit(
    source: FormEntity,
    type: string,
    content: Record<string, any>,
    metadata?: Record<string, any>
  ): string {
    const eventId = `event:${Date.now()}:${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const event: FormRelation = {
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
  static send(
    source: FormEntity,
    target: FormEntity,
    type: string,
    content: Record<string, any>,
    metadata?: Record<string, any>
  ): string {
    const messageId = `message:${Date.now()}:${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const message: FormRelation = {
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
  static broadcast(
    source: FormEntity,
    targets: FormEntity[],
    type: string,
    content: Record<string, any>,
    metadata?: Record<string, any>
  ): string[] {
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
  static query(filter: {
    type?: string;
    sourceId?: string;
    targetId?: string;
  }): FormRelation[] {
    return Array.from(this.relations.values()).filter((relation) => {
      if (filter.type && relation.type !== filter.type) return false;
      if (filter.sourceId && relation.source.id !== filter.sourceId)
        return false;
      if (filter.targetId && relation.target?.id !== filter.targetId)
        return false;
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
