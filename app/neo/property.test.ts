import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNeoProperty, PropertyDefinition } from "./property";

describe("Neo Property System", () => {
  // Mock the protocol for isolated testing
  let mockProtocol;
  let propertySystem;
  
  // Entity storage for mock protocol
  let entityStore = {};
  let emittedEvents = [];
  
  beforeEach(() => {
    // Reset storage
    entityStore = {};
    emittedEvents = [];
    
    // Create mock protocol
    mockProtocol = {
      createEntity: vi.fn((entity) => {
        const id = `entity:${Date.now()}:${Math.floor(Math.random() * 1000)}`;
        entityStore[id] = { 
          id, 
          ...entity,
          properties: entity.properties || {}
        };
        return id;
      }),
      
      getEntity: vi.fn((id) => {
        return entityStore[id];
      }),
      
      updateEntity: vi.fn((id, updates) => {
        if (!entityStore[id]) return false;
        
        entityStore[id] = {
          ...entityStore[id],
          ...updates,
          properties: {
            ...entityStore[id].properties,
            ...(updates.properties || {})
          }
        };
        return true;
      }),
      
      findEntities: vi.fn((query) => {
        return Object.values(entityStore).filter(entity => {
          // Match type
          if (query.type && entity.type !== query.type) return false;
          
          // Match spaceId
          if (query.spaceId && entity.spaceId !== query.spaceId) return false;
          
          // Match properties
          if (query.properties) {
            for (const [key, value] of Object.entries(query.properties)) {
              if (entity.properties[key] !== value) return false;
            }
          }
          
          return true;
        });
      }),
      
      emit: vi.fn((event) => {
        emittedEvents.push(event);
      }),
      
      onEvent: vi.fn()
    };
    
    // Create property system
    propertySystem = createNeoProperty(mockProtocol, { propertySpaceId: 'test-space' });
  });
  
  it("should define properties", async () => {
    // Define string property
    const stringPropDef: PropertyDefinition = {
      name: "title",
      type: "string",
      required: true
    };
    
    const propId = await propertySystem.defineProperty(stringPropDef);
    
    // Check entity was created
    expect(mockProtocol.createEntity).toHaveBeenCalledWith(expect.objectContaining({
      type: "property:definition",
      spaceId: "test-space"
    }));
    
    // Check event was emitted
    expect(mockProtocol.emit).toHaveBeenCalledWith(expect.objectContaining({
      type: "property",
      subtype: "defined",
      content: expect.objectContaining({
        propertyId: propId,
        definition: stringPropDef
      })
    }));
  });
  
  it("should retrieve property definitions", async () => {
    // Define property
    const numberPropDef: PropertyDefinition = {
      name: "age",
      type: "number",
      required: false,
      validationRules: [
        {
          type: "min",
          params: { value: 0 },
          message: "Age must be positive"
        }
      ]
    };
    
    await propertySystem.defineProperty(numberPropDef);
    
    // Reset mock call history
    mockProtocol.createEntity.mockClear();
    mockProtocol.emit.mockClear();
    
    // Get definition
    const retrievedDef = propertySystem.getPropertyDefinition("age");
    
    // Should match original definition
    expect(retrievedDef).toBeDefined();
    expect(retrievedDef?.name).toBe("age");
    expect(retrievedDef?.type).toBe("number");
    expect(retrievedDef?.validationRules).toHaveLength(1);
    expect(retrievedDef?.validationRules?.[0].type).toBe("min");
  });
  
  it("should set property values on entities", async () => {
    // Create an entity
    const entityId = mockProtocol.createEntity({
      type: "person",
      properties: {}
    });
    
    // Define property
    await propertySystem.defineProperty({
      name: "name",
      type: "string",
      required: true
    });
    
    // Set property value
    propertySystem.setPropertyValue(entityId, "name", "John Doe");
    
    // Check entity was updated
    expect(mockProtocol.updateEntity).toHaveBeenCalledWith(
      entityId,
      expect.objectContaining({
        properties: { name: "John Doe" }
      })
    );
    
    // Check event was emitted
    expect(mockProtocol.emit).toHaveBeenCalledWith(expect.objectContaining({
      type: "property",
      subtype: "updated",
      content: expect.objectContaining({
        entityId,
        propertyName: "name",
        value: "John Doe"
      })
    }));
  });
  
  it("should retrieve property values", async () => {
    // Create an entity with properties
    const entityId = mockProtocol.createEntity({
      type: "product",
      properties: {
        price: 99.99,
        name: "Awesome Product"
      }
    });
    
    // Get properties
    const price = propertySystem.getPropertyValue(entityId, "price");
    const name = propertySystem.getPropertyValue(entityId, "name");
    const nonExistent = propertySystem.getPropertyValue(entityId, "description");
    
    expect(price).toBe(99.99);
    expect(name).toBe("Awesome Product");
    expect(nonExistent).toBeUndefined();
  });
  
  it("should delete properties", () => {
    // Create an entity with properties
    const entityId = mockProtocol.createEntity({
      type: "user",
      properties: {
        username: "jdoe",
        email: "john@example.com"
      }
    });
    
    // Delete property
    propertySystem.deleteProperty(entityId, "email");
    
    // Check entity was updated
    expect(mockProtocol.updateEntity).toHaveBeenCalled();
    
    // Check email was removed
    const entity = mockProtocol.getEntity(entityId);
    expect(entity.properties.username).toBe("jdoe");
    expect(entity.properties.email).toBeUndefined();
    
    // Check event was emitted
    expect(mockProtocol.emit).toHaveBeenCalledWith(expect.objectContaining({
      type: "property",
      subtype: "deleted",
      content: expect.objectContaining({
        entityId,
        propertyName: "email",
        previousValue: "john@example.com"
      })
    }));
  });
  
  it("should validate property values", async () => {
    // Define property with validation rules
    await propertySystem.defineProperty({
      name: "email",
      type: "string",
      required: true,
      validationRules: [
        {
          type: "pattern",
          params: { pattern: "^[^@]+@[^@]+\\.[^@]+$" },
          message: "Invalid email format"
        }
      ]
    });
    
    // Valid email
    const validResult = propertySystem.validateValue(
      "test@example.com",
      propertySystem.getPropertyDefinition("email")
    );
    
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toHaveLength(0);
    
    // Invalid email
    const invalidResult = propertySystem.validateValue(
      "not-an-email",
      propertySystem.getPropertyDefinition("email")
    );
    
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toHaveLength(1);
    expect(invalidResult.errors[0]).toBe("Invalid email format");
    
    // Missing required value
    const missingResult = propertySystem.validateValue(
      undefined,
      propertySystem.getPropertyDefinition("email")
    );
    
    expect(missingResult.valid).toBe(false);
    expect(missingResult.errors[0]).toContain("required");
  });
  
  it("should find entities by property values", async () => {
    // Create entities with properties
    const entity1 = mockProtocol.createEntity({
      type: "post",
      properties: { category: "tech", published: true }
    });
    
    const entity2 = mockProtocol.createEntity({
      type: "post",
      properties: { category: "tech", published: false }
    });
    
    const entity3 = mockProtocol.createEntity({
      type: "post",
      properties: { category: "art", published: true }
    });
    
    // Find by category
    const techEntities = propertySystem.findByProperty("category", "tech");
    expect(techEntities).toHaveLength(2);
    expect(techEntities).toContain(entity1);
    expect(techEntities).toContain(entity2);
    expect(techEntities).not.toContain(entity3);
    
    // Find by published status
    const publishedEntities = propertySystem.findByProperty("published", true);
    expect(publishedEntities).toHaveLength(2);
    expect(publishedEntities).toContain(entity1);
    expect(publishedEntities).toContain(entity3);
    expect(publishedEntities).not.toContain(entity2);
  });
  
  it("should handle property events from Neo core", () => {
    // Create system with spy methods
    const spy = vi.spyOn(propertySystem as any, 'handlePropertyAddedEvent');
    
    // Create mock NeoCore
    const mockNeoCore = {
      on: vi.fn((eventType, handler) => {
        if (eventType === 'event:property:added') {
          handler({
            content: {
              entityId: 'test-entity',
              properties: {
                name: 'Test',
                value: 123
              }
            }
          });
        }
      })
    };
    
    // Register with core
    propertySystem.registerWithNeoCore(mockNeoCore);
    
    // Check event handler was called
    expect(mockNeoCore.on).toHaveBeenCalledWith(
      'event:property:added',
      expect.any(Function)
    );
    
    expect(spy).toHaveBeenCalled();
  });
  
  it("should validate different property types", async () => {
    // Test validation for different property types
    const typeDefs = [
      { name: "strProp", type: "string" },
      { name: "numProp", type: "number" },
      { name: "boolProp", type: "boolean" },
      { name: "objProp", type: "object" },
      { name: "arrProp", type: "array" },
      { name: "dateProp", type: "date" }
    ];
    
    // Define all properties
    for (const def of typeDefs) {
      await propertySystem.defineProperty(def);
    }
    
    // Test valid values
    expect(propertySystem.validateValue("hello", { name: "strProp", type: "string" }).valid).toBe(true);
    expect(propertySystem.validateValue(42, { name: "numProp", type: "number" }).valid).toBe(true);
    expect(propertySystem.validateValue(true, { name: "boolProp", type: "boolean" }).valid).toBe(true);
    expect(propertySystem.validateValue({}, { name: "objProp", type: "object" }).valid).toBe(true);
    expect(propertySystem.validateValue([], { name: "arrProp", type: "array" }).valid).toBe(true);
    expect(propertySystem.validateValue(new Date(), { name: "dateProp", type: "date" }).valid).toBe(true);
    
    // Test invalid values
    expect(propertySystem.validateValue(42, { name: "strProp", type: "string" }).valid).toBe(false);
    expect(propertySystem.validateValue("42", { name: "numProp", type: "number" }).valid).toBe(false);
    expect(propertySystem.validateValue("true", { name: "boolProp", type: "boolean" }).valid).toBe(false);
    expect(propertySystem.validateValue([], { name: "objProp", type: "object" }).valid).toBe(false);
    expect(propertySystem.validateValue({}, { name: "arrProp", type: "array" }).valid).toBe(false);
    expect(propertySystem.validateValue(true, { name: "dateProp", type: "date" }).valid).toBe(false);
  });
  
  it("should handle validation rules correctly", async () => {
    // Define property with multiple validation rules
    await propertySystem.defineProperty({
      name: "username",
      type: "string",
      required: true,
      validationRules: [
        {
          type: "min",
          params: { value: 3 },
          message: "Username must be at least 3 characters"
        },
        {
          type: "max",
          params: { value: 20 },
          message: "Username cannot exceed 20 characters"
        },
        {
          type: "pattern",
          params: { pattern: "^[a-zA-Z0-9_]+$" },
          message: "Username can only contain letters, numbers and underscore"
        }
      ]
    });
    
    const def = propertySystem.getPropertyDefinition("username");
    
    // Valid username
    expect(propertySystem.validateValue("john_doe42", def).valid).toBe(true);
    
    // Too short
    expect(propertySystem.validateValue("jo", def).valid).toBe(false);
    
    // Too long
    expect(propertySystem.validateValue("this_username_is_way_too_long_for_the_validation", def).valid).toBe(false);
    
    // Invalid characters
    expect(propertySystem.validateValue("john@doe", def).valid).toBe(false);
    
    // Define enum validation
    await propertySystem.defineProperty({
      name: "status",
      type: "string",
      validationRules: [
        {
          type: "enum",
          params: { values: ["pending", "active", "suspended"] },
          message: "Status must be pending, active or suspended"
        }
      ]
    });
    
    const statusDef = propertySystem.getPropertyDefinition("status");
    
    // Valid status
    expect(propertySystem.validateValue("active", statusDef).valid).toBe(true);
    
    // Invalid status
    expect(propertySystem.validateValue("deleted", statusDef).valid).toBe(false);
  });
});