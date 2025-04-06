import { describe, it, expect, vi } from "vitest";
import {
  EntityRefSchema,
  RelationSchema,
  CoreRelationTypes,
  RelationDirectionTypes,
  createRelation,
  createBidirectionalRelation,
  isRelationActiveAt,
  formatEntityKey,
  linkToRelation,
  invertRelation,
  relationsConnectSameEntities,
  type EntityRef,
  type Relation,
} from "./relation";

describe("Relation Schema Components", () => {
  describe("EntityRefSchema", () => {
    it("should validate a valid entity reference", () => {
      const validRef = { entity: "user.Person", id: "123" };
      const result = EntityRefSchema.safeParse(validRef);
      expect(result.success).toBe(true);
    });

    it("should reject invalid entity references", () => {
      const missingEntity = { id: "123" };
      const missingId = { entity: "user.Person" };

      expect(EntityRefSchema.safeParse(missingEntity).success).toBe(false);
      expect(EntityRefSchema.safeParse(missingId).success).toBe(false);
    });
  });

  describe("RelationSchema", () => {
    it("should validate a complete relation", () => {
      const validRelation = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        source: { entity: "user.Person", id: "123" },
        target: { entity: "document.Article", id: "456" },
        type: "created_by",
        direction: "directed",
        properties: { timestamp: new Date() },
        valid: true,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 86400000), // tomorrow
        strength: 0.8,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = RelationSchema.safeParse(validRelation);
      expect(result.success).toBe(true);
    });

    it("should validate a relation with minimal required fields", () => {
      const minimalRelation = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        source: { entity: "user.Person", id: "123" },
        target: { entity: "document.Article", id: "456" },
        type: "created_by",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = RelationSchema.safeParse(minimalRelation);
      expect(result.success).toBe(true);

      if (result.success) {
        // Check default values
        expect(result.data.direction).toBe("directed");
        expect(result.data.valid).toBe(true);
        expect(result.data.validFrom).toBeInstanceOf(Date);
        expect(result.data.strength).toBe(1);
      }
    });

    it("should reject relations with missing required fields", () => {
      const missingSource = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        target: { entity: "document.Article", id: "456" },
        type: "created_by",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const missingTarget = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        source: { entity: "user.Person", id: "123" },
        type: "created_by",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const missingType = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        source: { entity: "user.Person", id: "123" },
        target: { entity: "document.Article", id: "456" },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(RelationSchema.safeParse(missingSource).success).toBe(false);
      expect(RelationSchema.safeParse(missingTarget).success).toBe(false);
      expect(RelationSchema.safeParse(missingType).success).toBe(false);
    });

    it("should validate relations with allowed direction values", () => {
      for (const direction of RelationDirectionTypes) {
        const relation = {
          id: "123e4567-e89b-12d3-a456-426614174000",
          source: { entity: "user.Person", id: "123" },
          target: { entity: "document.Article", id: "456" },
          type: "created_by",
          direction,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        expect(RelationSchema.safeParse(relation).success).toBe(true);
      }
    });

    it("should reject relations with invalid direction values", () => {
      const invalidDirection = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        source: { entity: "user.Person", id: "123" },
        target: { entity: "document.Article", id: "456" },
        type: "created_by",
        direction: "invalid-direction",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(RelationSchema.safeParse(invalidDirection).success).toBe(false);
    });

    it("should validate relations with strength between 0 and 1", () => {
      const strengthValues = [0, 0.3, 0.5, 0.8, 1];

      for (const strength of strengthValues) {
        const relation = {
          id: "123e4567-e89b-12d3-a456-426614174000",
          source: { entity: "user.Person", id: "123" },
          target: { entity: "document.Article", id: "456" },
          type: "created_by",
          strength,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        expect(RelationSchema.safeParse(relation).success).toBe(true);
      }
    });

    it("should reject relations with strength outside 0-1 range", () => {
      const invalidStrengthValues = [-0.1, 1.1, 2];

      for (const strength of invalidStrengthValues) {
        const relation = {
          id: "123e4567-e89b-12d3-a456-426614174000",
          source: { entity: "user.Person", id: "123" },
          target: { entity: "document.Article", id: "456" },
          type: "created_by",
          strength,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        expect(RelationSchema.safeParse(relation).success).toBe(false);
      }
    });
  });

  describe("Constant Values", () => {
    it("should define CoreRelationTypes", () => {
      // Structural relations
      expect(CoreRelationTypes).toContain("contains");
      expect(CoreRelationTypes).toContain("instance_of");
      expect(CoreRelationTypes).toContain("extends");
      expect(CoreRelationTypes).toContain("implements");

      // Associative relations
      expect(CoreRelationTypes).toContain("references");
      expect(CoreRelationTypes).toContain("associates");
      expect(CoreRelationTypes).toContain("depends_on");
      expect(CoreRelationTypes).toContain("equivalent_to");

      // Ownership relations
      expect(CoreRelationTypes).toContain("owned_by");
      expect(CoreRelationTypes).toContain("created_by");

      // Generic relation
      expect(CoreRelationTypes).toContain("related_to");
    });

    it("should define RelationDirectionTypes", () => {
      expect(RelationDirectionTypes).toContain("directed");
      expect(RelationDirectionTypes).toContain("bidirectional");
    });
  });
});

describe("Relation Helper Functions", () => {
  describe("createRelation", () => {
    it("should create a valid relation with minimal params", () => {
      const source: EntityRef = { entity: "user.Person", id: "123" };
      const target: EntityRef = { entity: "document.Article", id: "456" };

      const relation = createRelation({
        source,
        target,
        type: "created_by",
      });

      // Verify relation structure
      expect(relation.id).toBeDefined();
      expect(relation.source).toEqual(source);
      expect(relation.target).toEqual(target);
      expect(relation.type).toBe("created_by");
      expect(relation.direction).toBe("directed");
      expect(relation.properties).toEqual({});
      expect(relation.valid).toBe(true);
      expect(relation.validFrom).toBeInstanceOf(Date);
      expect(relation.validTo).toBeUndefined();
      expect(relation.strength).toBe(1);
      expect(relation.createdAt).toBeInstanceOf(Date);
      expect(relation.updatedAt).toBeInstanceOf(Date);

      // Verify the relation passes schema validation
      const result = RelationSchema.safeParse(relation);
      expect(result.success).toBe(true);
    });

    it("should create a valid relation with full params", () => {
      const source: EntityRef = { entity: "user.Person", id: "123" };
      const target: EntityRef = { entity: "document.Article", id: "456" };
      const validFrom = new Date(2023, 0, 1);
      const validTo = new Date(2023, 11, 31);

      const relation = createRelation({
        source,
        target,
        type: "created_by",
        direction: "bidirectional",
        properties: { reason: "Authored content" },
        validFrom,
        validTo,
        strength: 0.8,
        valid: true,
      });

      // Verify all properties were set correctly
      expect(relation.id).toBeDefined();
      expect(relation.source).toEqual(source);
      expect(relation.target).toEqual(target);
      expect(relation.type).toBe("created_by");
      expect(relation.direction).toBe("bidirectional");
      expect(relation.properties).toEqual({ reason: "Authored content" });
      expect(relation.valid).toBe(true);
      expect(relation.validFrom).toEqual(validFrom);
      expect(relation.validTo).toEqual(validTo);
      expect(relation.strength).toBe(0.8);

      // Verify the relation passes schema validation
      const result = RelationSchema.safeParse(relation);
      expect(result.success).toBe(true);
    });

    it("should handle explicit false for valid param", () => {
      const source: EntityRef = { entity: "user.Person", id: "123" };
      const target: EntityRef = { entity: "document.Article", id: "456" };

      const relation = createRelation({
        source,
        target,
        type: "created_by",
        valid: false,
      });

      expect(relation.valid).toBe(false);
    });
  });

  describe("createBidirectionalRelation", () => {
    it("should create a bidirectional relation", () => {
      const source: EntityRef = { entity: "user.Person", id: "123" };
      const target: EntityRef = { entity: "user.Person", id: "456" };

      const relation = createBidirectionalRelation({
        source,
        target,
        type: "associates",
      });

      expect(relation.direction).toBe("bidirectional");

      // Verify the relation passes schema validation
      const result = RelationSchema.safeParse(relation);
      expect(result.success).toBe(true);
    });
  });

  describe("isRelationActiveAt", () => {
    it("should return true for currently valid relations", () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const relation: Relation = {
        id: "123",
        source: { entity: "user.Person", id: "123" },
        target: { entity: "document.Article", id: "456" },
        type: "created_by",
        direction: "directed",
        valid: true,
        validFrom: yesterday,
        validTo: tomorrow,
        strength: 1,
        createdAt: yesterday,
        updatedAt: yesterday,
      };

      expect(isRelationActiveAt(relation, now)).toBe(true);
    });

    it("should return false for invalid relations", () => {
      const now = new Date();

      const relation: Relation = {
        id: "123",
        source: { entity: "user.Person", id: "123" },
        target: { entity: "document.Article", id: "456" },
        type: "created_by",
        direction: "directed",
        valid: false, // Explicitly invalid
        validFrom: new Date(),
        strength: 1,
        createdAt: now,
        updatedAt: now,
      };

      expect(isRelationActiveAt(relation, now)).toBe(false);
    });

    it("should return false for relations before validFrom", () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const relation: Relation = {
        id: "123",
        source: { entity: "user.Person", id: "123" },
        target: { entity: "document.Article", id: "456" },
        type: "created_by",
        direction: "directed",
        valid: true,
        validFrom: tomorrow, // Not valid yet
        strength: 1,
        createdAt: now,
        updatedAt: now,
      };

      expect(isRelationActiveAt(relation, now)).toBe(false);
    });

    it("should return false for relations after validTo", () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const relation: Relation = {
        id: "123",
        source: { entity: "user.Person", id: "123" },
        target: { entity: "document.Article", id: "456" },
        type: "created_by",
        direction: "directed",
        valid: true,
        validFrom: new Date(yesterday.getTime() - 24 * 60 * 60 * 1000), // 2 days ago
        validTo: yesterday, // Expired
        strength: 1,
        createdAt: yesterday,
        updatedAt: yesterday,
      };

      expect(isRelationActiveAt(relation, now)).toBe(false);
    });

    it("should use the current time by default", () => {
      // Create a mock time provider
      const mockTimeProvider = () => new Date("2023-01-15T12:00:00Z");

      const validFrom = new Date("2023-01-01T00:00:00Z");
      const validTo = new Date("2023-01-31T23:59:59Z");

      const activeRelation: Relation = {
        id: "123",
        source: { entity: "user.Person", id: "123" },
        target: { entity: "document.Article", id: "456" },
        type: "created_by",
        direction: "directed",
        valid: true,
        validFrom,
        validTo,
        strength: 1,
        createdAt: validFrom,
        updatedAt: validFrom,
      };

      // Pass the mock time provider
      expect(isRelationActiveAt(activeRelation, null, mockTimeProvider)).toBe(
        true
      );
    });
  });

  describe("formatEntityKey", () => {
    it("should format entity key correctly", () => {
      const ref: EntityRef = { entity: "user.Person", id: "123" };
      const key = formatEntityKey(ref);
      expect(key).toBe("user.Person:123");
    });
  });

  describe("linkToRelation", () => {
    it("should convert legacy link format to relation", () => {
      const established = new Date(2022, 0, 1);
      const expires = new Date(2023, 0, 1);

      const link = {
        sourceEntity: "user.Person",
        sourceId: "123",
        targetEntity: "document.Article",
        targetId: "456",
        relation: "created_by",
        metadata: { timestamp: established },
        established,
        expires,
      };

      const relation = linkToRelation(link);

      expect(relation.source).toEqual({ entity: "user.Person", id: "123" });
      expect(relation.target).toEqual({
        entity: "document.Article",
        id: "456",
      });
      expect(relation.type).toBe("created_by");
      expect(relation.properties).toEqual({ timestamp: established });
      expect(relation.validFrom).toEqual(established);
      expect(relation.validTo).toEqual(expires);

      // Verify the relation passes schema validation
      const result = RelationSchema.safeParse(relation);
      expect(result.success).toBe(true);
    });
  });

  describe("invertRelation", () => {
    it("should invert a directed relation", () => {
      const original: Relation = {
        id: "123",
        source: { entity: "user.Person", id: "123" },
        target: { entity: "document.Article", id: "456" },
        type: "created_by",
        direction: "directed",
        valid: true,
        validFrom: new Date(),
        strength: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const inverted = invertRelation(original);

      // Should have a new ID
      expect(inverted.id).not.toBe(original.id);

      // Source and target should be swapped
      expect(inverted.source).toEqual(original.target);
      expect(inverted.target).toEqual(original.source);

      // Other properties should remain the same
      expect(inverted.type).toBe(original.type);
      expect(inverted.direction).toBe(original.direction);
      expect(inverted.valid).toBe(original.valid);
      expect(inverted.validFrom).toEqual(original.validFrom);
      expect(inverted.strength).toBe(original.strength);

      // updatedAt should be updated
      expect(inverted.updatedAt.getTime()).toBeGreaterThanOrEqual(
        original.updatedAt.getTime()
      );

      // Verify the inverted relation passes schema validation
      const result = RelationSchema.safeParse(inverted);
      expect(result.success).toBe(true);
    });

    it("should not actually invert bidirectional relations", () => {
      const original: Relation = {
        id: "123",
        source: { entity: "user.Person", id: "123" },
        target: { entity: "user.Person", id: "456" },
        type: "associates",
        direction: "bidirectional",
        valid: true,
        validFrom: new Date(),
        strength: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = invertRelation(original);

      // For bidirectional relations, it should return the original
      expect(result).toBe(original);
    });
  });

  describe("relationsConnectSameEntities", () => {
    it("should identify relations with same source and target", () => {
      const relationA: Relation = {
        id: "123",
        source: { entity: "user.Person", id: "123" },
        target: { entity: "document.Article", id: "456" },
        type: "created_by",
        direction: "directed",
        valid: true,
        validFrom: new Date(),
        strength: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const relationB: Relation = {
        id: "789",
        source: { entity: "user.Person", id: "123" },
        target: { entity: "document.Article", id: "456" },
        type: "owns",
        direction: "directed",
        valid: true,
        validFrom: new Date(),
        strength: 0.8,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(relationsConnectSameEntities(relationA, relationB)).toBe(true);
    });

    it("should identify relations with opposite source and target", () => {
      const relationA: Relation = {
        id: "123",
        source: { entity: "user.Person", id: "123" },
        target: { entity: "document.Article", id: "456" },
        type: "created_by",
        direction: "directed",
        valid: true,
        validFrom: new Date(),
        strength: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const relationB: Relation = {
        id: "789",
        source: { entity: "document.Article", id: "456" },
        target: { entity: "user.Person", id: "123" },
        type: "created_by",
        direction: "directed",
        valid: true,
        validFrom: new Date(),
        strength: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(relationsConnectSameEntities(relationA, relationB)).toBe(true);
    });

    it("should return false for relations with different entities", () => {
      const relationA: Relation = {
        id: "123",
        source: { entity: "user.Person", id: "123" },
        target: { entity: "document.Article", id: "456" },
        type: "created_by",
        direction: "directed",
        valid: true,
        validFrom: new Date(),
        strength: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const relationB: Relation = {
        id: "789",
        source: { entity: "user.Person", id: "123" },
        target: { entity: "document.Article", id: "789" }, // Different target ID
        type: "created_by",
        direction: "directed",
        valid: true,
        validFrom: new Date(),
        strength: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(relationsConnectSameEntities(relationA, relationB)).toBe(false);
    });
  });
});

describe("Domain Logic Integration", () => {
  it("should support the full relation lifecycle", () => {
    // Create relation
    const source: EntityRef = { entity: "user.Person", id: "123" };
    const target: EntityRef = { entity: "document.Article", id: "456" };

    const relation = createRelation({
      source,
      target,
      type: "created_by",
      properties: { timestamp: new Date() },
    });

    // Verify active status
    expect(isRelationActiveAt(relation)).toBe(true);

    // Create a relation in the opposite direction
    const reverseRelation = createRelation({
      source: target,
      target: source,
      type: "created_by",
      validFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    });

    // Verify they connect the same entities
    expect(relationsConnectSameEntities(relation, reverseRelation)).toBe(true);

    // Create an inverted copy
    const invertedRelation = invertRelation(relation);
    expect(invertedRelation.source).toEqual(target);
    expect(invertedRelation.target).toEqual(source);

    // Create a bidirectional relation
    const bidirectionalRelation = createBidirectionalRelation({
      source,
      target: { entity: "user.Person", id: "789" },
      type: "associates",
    });

    expect(bidirectionalRelation.direction).toBe("bidirectional");

    // Verify that inverting a bidirectional relation returns the same relation
    const invertedBidirectional = invertRelation(bidirectionalRelation);
    expect(invertedBidirectional).toBe(bidirectionalRelation);
  });

  it("should handle temporal relations correctly", () => {
    // Set up fixed dates for testing
    const past = new Date("2022-01-01T00:00:00Z");
    const present = new Date("2023-01-01T00:00:00Z");
    const future = new Date("2024-01-01T00:00:00Z");

    // Create a relation valid from past to future
    const relation = createRelation({
      source: { entity: "user.Person", id: "123" },
      target: { entity: "document.Article", id: "456" },
      type: "created_by",
      validFrom: past,
      validTo: future,
    });

    // Check validity at different times
    expect(isRelationActiveAt(relation, new Date("2021-01-01T00:00:00Z"))).toBe(
      false
    ); // Before validFrom
    expect(isRelationActiveAt(relation, new Date("2022-06-01T00:00:00Z"))).toBe(
      true
    ); // Between validFrom and validTo
    expect(isRelationActiveAt(relation, new Date("2025-01-01T00:00:00Z"))).toBe(
      false
    ); // After validTo

    // Create an expired relation
    const expiredRelation = createRelation({
      source: { entity: "user.Person", id: "123" },
      target: { entity: "document.Article", id: "456" },
      type: "created_by",
      validFrom: past,
      validTo: past, // Expired immediately
    });

    expect(isRelationActiveAt(expiredRelation, present)).toBe(false);

    // Create a future relation
    const futureRelation = createRelation({
      source: { entity: "user.Person", id: "123" },
      target: { entity: "document.Article", id: "456" },
      type: "created_by",
      validFrom: future, // Not valid yet
    });

    expect(isRelationActiveAt(futureRelation, present)).toBe(false);
  });

  it("should handle different types of relations", () => {
    const person: EntityRef = { entity: "user.Person", id: "123" };
    const organization: EntityRef = { entity: "user.Organization", id: "456" };
    const article: EntityRef = { entity: "document.Article", id: "789" };
    const comment: EntityRef = { entity: "document.Comment", id: "012" };

    // Create different types of relations
    const membershipRelation = createRelation({
      source: person,
      target: organization,
      type: "member_of",
      properties: { role: "Editor", since: new Date() },
    });

    const contentCreationRelation = createRelation({
      source: person,
      target: article,
      type: "created_by",
      properties: { timestamp: new Date() },
    });

    const hierarchicalRelation = createRelation({
      source: comment,
      target: article,
      type: "belongs_to",
      properties: { position: "top" },
    });

    const bidirectionalAssociation = createBidirectionalRelation({
      source: person,
      target: { entity: "user.Person", id: "999" },
      type: "associates",
      properties: { relationship: "Colleague" },
    });

    // Verify all relation types are correctly created
    expect(membershipRelation.type).toBe("member_of");
    expect(contentCreationRelation.type).toBe("created_by");
    expect(hierarchicalRelation.type).toBe("belongs_to");
    expect(bidirectionalAssociation.type).toBe("associates");
    expect(bidirectionalAssociation.direction).toBe("bidirectional");

    // Verify properties are preserved
    expect(membershipRelation.properties?.role).toBe("Editor");
    expect(contentCreationRelation.properties?.timestamp).toBeInstanceOf(Date);
    expect(hierarchicalRelation.properties?.position).toBe("top");
    expect(bidirectionalAssociation.properties?.relationship).toBe("Colleague");
  });

  it("should migrate from legacy link format", () => {
    const established = new Date(2022, 0, 1);
    const expires = new Date(2023, 0, 1);

    // Legacy link format
    const legacyLink = {
      sourceEntity: "user.Person",
      sourceId: "123",
      targetEntity: "document.Article",
      targetId: "456",
      relation: "created_by",
      metadata: {
        timestamp: established,
        software: "Word Processor v1.0",
      },
      established,
      expires,
    };

    // Convert to new relation format
    const relation = linkToRelation(legacyLink);

    // Verify conversion was correct
    expect(relation.source).toEqual({ entity: "user.Person", id: "123" });
    expect(relation.target).toEqual({ entity: "document.Article", id: "456" });
    expect(relation.type).toBe("created_by");
    expect(relation.properties).toEqual({
      timestamp: established,
      software: "Word Processor v1.0",
    });
    expect(relation.validFrom).toEqual(established);
    expect(relation.validTo).toEqual(expires);

    // Check if relation is active based on dates
    const beforeEstablished = new Date(2021, 11, 31); // Dec 31, 2021
    const duringValidity = new Date(2022, 6, 1); // July 1, 2022
    const afterExpires = new Date(2023, 0, 2); // Jan 2, 2023

    expect(isRelationActiveAt(relation, beforeEstablished)).toBe(false);
    expect(isRelationActiveAt(relation, duringValidity)).toBe(true);
    expect(isRelationActiveAt(relation, afterExpires)).toBe(false);
  });
});
