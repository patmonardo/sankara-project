import { describe, expect, it, beforeEach, vi } from "vitest";
import { FormRelation } from "./relation";
import { FormEntity } from "../entity/entity";

// Mock the FormEntity class
vi.mock("../entity/entity", () => {
  const mockEntities = new Map();

  // Create a basic entity-like object
  const createBasicEntity = (id: string, type: string) => ({
    id,
    type,
    properties: {},
    metadata: {},
    toJSON: () => ({ id, type }),
  });

  return {
    FormEntity: {
      getEntity: vi.fn((id) => mockEntities.get(id)),
      // Mock method to add test entities - ensure they have the right structure
      __addMockEntity: (entity: any) => {
        // If it's a simple object, enhance it
        if (!entity.properties) {
          const enhanced = createBasicEntity(entity.id, entity.type);
          mockEntities.set(entity.id, enhanced);
          return enhanced;
        }
        mockEntities.set(entity.id, entity);
        return entity;
      },
    },
  };
});

describe("FormRelation", () => {
  let sourceEntity: any;
  let targetEntity: any;

  beforeEach(() => {
    // Reset relations map between tests
    (FormRelation as any).relations = new Map();

    // Create mock entities with the required properties
    sourceEntity = {
      id: "source-entity-1",
      type: "source-type",
      properties: {},
      metadata: {},
      toJSON: () => ({ id: "source-entity-1", type: "source-type" }),
    };

    targetEntity = {
      id: "target-entity-1",
      type: "target-type",
      properties: {},
      metadata: {},
      toJSON: () => ({ id: "target-entity-1", type: "target-type" }),
    };

    // Add mock entities to our mocked FormEntity store
    (FormEntity as any).__addMockEntity(sourceEntity);
    (FormEntity as any).__addMockEntity(targetEntity);
  });
  
  describe("Basic Relation Creation", () => {
    it("should create a relation with constructor", () => {
      const relation = new FormRelation({
        type: "TEST_RELATION",
        source: sourceEntity,
        target: targetEntity,
        content: { data: "test-data" },
      });

      expect(relation.id).toBeDefined();
      expect(relation.type).toBe("TEST_RELATION");
      expect(relation.source).toBe(sourceEntity);
      expect(relation.target).toBe(targetEntity);
      expect(relation.content).toEqual({ data: "test-data" });
      expect(relation.metadata).toBeDefined();
      expect(relation.timestamp).toBeDefined();
    });

    it("should create a relation with createRelation", () => {
      const relationId = FormRelation.createRelation({
        source: { id: "source-entity-1", type: "source-type" },
        target: { id: "target-entity-1", type: "target-type" },
        type: "CREATE_TEST",
        content: { key: "value" },
      });

      const relation = FormRelation.getRelation(relationId);

      expect(relation).toBeDefined();
      expect(relation?.type).toBe("CREATE_TEST");
      expect(relation?.source).toBe(sourceEntity);
      expect(relation?.target).toBe(targetEntity);
      expect(relation?.content).toEqual({ key: "value" });
    });

    it("should create a relation with relate method", () => {
      const relationId = FormRelation.relate(
        sourceEntity,
        targetEntity,
        "RELATED_TO",
        { note: "Simple relation" }
      );

      const relation = FormRelation.getRelation(relationId);

      expect(relation).toBeDefined();
      expect(relation?.type).toBe("RELATED_TO");
      expect(relation?.source).toBe(sourceEntity);
      expect(relation?.target).toBe(targetEntity);
      expect(relation?.metadata?.note).toBe("Simple relation");
    });
  });

  describe("Relation Queries and Updates", () => {
    beforeEach(() => {
      // Create some test relations
      FormRelation.relate(sourceEntity, targetEntity, "OWNS", {
        priority: "high",
      });
      FormRelation.relate(sourceEntity, targetEntity, "MANAGES", {
        priority: "medium",
      });

      // Create a more complete mock entity
      const otherSource = {
        id: "other-source",
        type: "other-type",
        // Add any required properties that FormRelation.relate() might check
        properties: {},
        metadata: {},
        // Add any methods that might be called
        toJSON: () => ({ id: "other-source", type: "other-type" }),
      };

      (FormEntity as any).__addMockEntity(otherSource);

      FormRelation.relate(otherSource, targetEntity, "VIEWS", {
        priority: "low",
      });
    });

    it("should query relations by type", () => {
      const ownsRelations = FormRelation.query({ type: "OWNS" });

      expect(ownsRelations.length).toBe(1);
      expect(ownsRelations[0].type).toBe("OWNS");
    });

    it("should query relations by source ID", () => {
      const sourceRelations = FormRelation.query({
        sourceId: "source-entity-1",
      });

      expect(sourceRelations.length).toBe(2);
      expect(sourceRelations[0].source.id).toBe("source-entity-1");
      expect(sourceRelations[1].source.id).toBe("source-entity-1");
    });

    it("should query relations by target ID", () => {
      const targetRelations = FormRelation.query({
        targetId: "target-entity-1",
      });

      expect(targetRelations.length).toBe(3);
      expect(targetRelations[0].target?.id).toBe("target-entity-1");
    });

    it("should update a relation", () => {
      // Get the first relation
      const relations = FormRelation.query({ type: "OWNS" });
      const relationId = relations[0].id;

      // Update it
      const updated = FormRelation.updateRelation(relationId, {
        content: { status: "updated" },
        metadata: { priority: "critical" },
      });

      expect(updated).toBe(true);

      // Check if it was updated
      const updatedRelation = FormRelation.getRelation(relationId);
      expect(updatedRelation?.content).toEqual({ status: "updated" });
      expect(updatedRelation?.metadata?.priority).toBe("critical");
      expect(updatedRelation?.metadata?.updated).toBeDefined();
    });

    it("should remove a relation", () => {
      const relations = FormRelation.query({ type: "MANAGES" });
      const relationId = relations[0].id;

      const removed = FormRelation.remove(relationId);

      expect(removed).toBe(true);
      expect(FormRelation.getRelation(relationId)).toBeUndefined();

      // Check that only 2 relations remain
      expect(FormRelation.query({}).length).toBe(2);
    });
  });

  describe("Communication Relations", () => {
    it("should emit an event", () => {
      const eventId = FormRelation.emit(
        sourceEntity,
        "STATUS_CHANGED",
        { oldStatus: "pending", newStatus: "approved" },
        { importance: "high" }
      );

      const event = FormRelation.getRelation(eventId);

      expect(event).toBeDefined();
      expect(event?.type).toBe("event");
      expect(event?.subtype).toBe("STATUS_CHANGED");
      expect(event?.source).toBe(sourceEntity);
      expect(event?.target).toBeUndefined();
      expect(event?.content).toEqual({
        oldStatus: "pending",
        newStatus: "approved",
      });
      expect(event?.metadata?.importance).toBe("high");
    });

    it("should send a message", () => {
      const messageId = FormRelation.send(
        sourceEntity,
        targetEntity,
        "NOTIFICATION",
        { message: "Hello, target!" },
        { urgent: true }
      );

      const message = FormRelation.getRelation(messageId);

      expect(message).toBeDefined();
      expect(message?.type).toBe("message");
      expect(message?.subtype).toBe("NOTIFICATION");
      expect(message?.source).toBe(sourceEntity);
      expect(message?.target).toBe(targetEntity);
      expect(message?.content).toEqual({ message: "Hello, target!" });
      expect(message?.metadata?.urgent).toBe(true);
    });

    it("should broadcast to multiple targets", () => {
      const target2 = { id: "target-2", type: "target-type" };
      const target3 = { id: "target-3", type: "target-type" };

      (FormEntity as any).__addMockEntity(target2);
      (FormEntity as any).__addMockEntity(target3);

      const messageIds = FormRelation.broadcast(
        sourceEntity,
        [targetEntity, target2, target3],
        "BROADCAST",
        { announcement: "Attention everyone!" },
        { priority: "high" }
      );

      expect(messageIds.length).toBe(3);

      // Check all messages were created correctly
      const messages = messageIds.map((id) => FormRelation.getRelation(id));

      expect(messages.length).toBe(3);
      expect(messages[0]?.type).toBe("message");
      expect(messages[0]?.subtype).toBe("BROADCAST");
      expect(messages[1]?.content).toEqual({
        announcement: "Attention everyone!",
      });

      // Check they were sent to different targets
      const targetIds = messages.map((msg) => msg?.target?.id);
      expect(targetIds).toContain("target-entity-1");
      expect(targetIds).toContain("target-2");
      expect(targetIds).toContain("target-3");
    });
  });
});
