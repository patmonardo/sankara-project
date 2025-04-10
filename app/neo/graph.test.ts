import { describe, it, expect, beforeEach } from "vitest";
import {
  PropertyType,
  PropertyDefinition,
  SystemPropertyHandler,
} from "./property";

import {
  NeoGraph,
  createNeoGraph
} from "./graph";
import { NeoComponentId, createNeoProtocol } from "./extension";

describe("Property System", () => {
  it("should validate property types correctly", () => {
    // Define a property
    const stringProp: PropertyDefinition = {
      key: "name",
      type: PropertyType.STRING,
      required: true,
      constraints: [
        {
          type: "minLength",
          params: { value: 3 },
          message: "Name must be at least 3 characters",
        },
      ],
    };

    // Test validation
    const errors1 = SystemPropertyHandler.validateProperty("Jo", stringProp);
    expect(errors1.length).toBeGreaterThan(0);

    const errors2 = SystemPropertyHandler.validateProperty("John", stringProp);
    expect(errors2.length).toBe(0);

    const errors3 = SystemPropertyHandler.validateProperty(null, stringProp);
    expect(errors3.length).toBeGreaterThan(0);
  });

  it("should coerce values to the correct type", () => {
    // Test string coercion
    expect(SystemPropertyHandler.coerceValue(123, PropertyType.STRING)).toBe(
      "123"
    );

    // Test number coercion
    expect(SystemPropertyHandler.coerceValue("123", PropertyType.NUMBER)).toBe(
      123
    );

    // Test boolean coercion
    expect(SystemPropertyHandler.coerceValue(1, PropertyType.BOOLEAN)).toBe(
      true
    );
    expect(SystemPropertyHandler.coerceValue(0, PropertyType.BOOLEAN)).toBe(
      false
    );

    // Test date coercion
    const date = new Date("2023-01-01");
    const coercedDate = SystemPropertyHandler.coerceValue(
      "2023-01-01",
      PropertyType.DATE
    );
    expect(coercedDate instanceof Date).toBe(true);
    expect(coercedDate.getFullYear()).toBe(2022);

    // Test array coercion
    expect(
      SystemPropertyHandler.coerceValue("test", PropertyType.ARRAY)
    ).toEqual(["test"]);

    // Test object coercion
    expect(
      SystemPropertyHandler.coerceValue("test", PropertyType.OBJECT)
    ).toEqual({ value: "test" });
  });

  it("should generate default values correctly", () => {
    // Define properties with defaults
    const withDefault: PropertyDefinition = {
      key: "status",
      type: PropertyType.STRING,
      default: "active",
    };

    const withFunctionDefault: PropertyDefinition = {
      key: "createdAt",
      type: PropertyType.DATE,
      default: () => new Date(),
    };

    // Test default values
    expect(SystemPropertyHandler.getDefaultValue(withDefault)).toBe("active");

    const defaultDate =
      SystemPropertyHandler.getDefaultValue(withFunctionDefault);
    expect(defaultDate instanceof Date).toBe(true);

    // Test type-based defaults
    const stringProp: PropertyDefinition = {
      key: "name",
      type: PropertyType.STRING,
    };
    expect(SystemPropertyHandler.getDefaultValue(stringProp)).toBe("");

    const numberProp: PropertyDefinition = {
      key: "count",
      type: PropertyType.NUMBER,
    };
    expect(SystemPropertyHandler.getDefaultValue(numberProp)).toBe(0);
  });
});

describe("Graph System", () => {
  let protocol;
  let graphId: NeoComponentId;
  let neoGraph: NeoGraph;

  beforeEach(() => {
    protocol = createNeoProtocol({
      id: { id: 'test-protocol', type: 'protocol:test' },
    });
    
    graphId = {
      id: "test-graph",
      type: "graph:test",
      name: "Test Graph"
    };
    
    neoGraph = createNeoGraph(protocol, graphId);
  });

  it("should create a graph with nodes and edges", () => {
    // Create nodes
    const node1Id = neoGraph.createNode({
      type: "person",
      label: "John",
      properties: {
        age: 30,
        role: "developer",
      },
    });

    const node2Id = neoGraph.createNode({
      type: "person",
      label: "Jane",
      properties: {
        age: 28,
        role: "designer",
      },
    });

    // Create node component IDs
    const node1ComponentId: NeoComponentId = {
      id: node1Id,
      type: "node:person",
      name: "John"
    };

    const node2ComponentId: NeoComponentId = {
      id: node2Id,
      type: "node:person",
      name: "Jane"
    };

    // Add an edge
    const edgeId = neoGraph.createEdge({
      source: node1ComponentId,
      target: node2ComponentId,
      type: "knows",
      label: "Knows",
      properties: {
        since: "2020-01-01",
      },
    });

    // Test node retrieval
    const node1 = neoGraph.getNode(node1Id);
    expect(node1).toBeDefined();
    expect(node1?.label).toBe("John");
    expect(node1?.properties.age).toBe(30);

    // Test edge retrieval
    const edge1 = neoGraph.getEdge(edgeId);
    expect(edge1).toBeDefined();
    expect(edge1?.source.id).toBe(node1Id);
    expect(edge1?.target.id).toBe(node2Id);
    expect(edge1?.properties.since).toBe("2020-01-01");
  });

  it("should find nodes by property criteria", () => {
    // Add nodes
    const node1Id = neoGraph.createNode({
      type: "person",
      properties: {
        age: 30,
        role: "developer",
      },
    });

    const node2Id = neoGraph.createNode({
      type: "person",
      properties: {
        age: 28,
        role: "designer",
      },
    });

    const node3Id = neoGraph.createNode({
      type: "person",
      properties: {
        age: 30,
        role: "manager",
      },
    });

    // Find nodes by type and properties
    const developers = neoGraph.findNodes({
      type: "person",
      properties: { role: "developer" }
    });
    
    expect(developers.length).toBe(1);
    expect(developers[0].id).toBe(node1Id);

    const age30 = neoGraph.findNodes({
      properties: { age: 30 }
    });
    
    expect(age30.length).toBe(2);
    expect(age30.map(n => n.id).sort()).toEqual([node1Id, node3Id].sort());
  });

  it("should find edges connected to a node", () => {
    // Create nodes
    const nodeAId = neoGraph.createNode({ id: "A", type: "node" });
    const nodeBId = neoGraph.createNode({ id: "B", type: "node" });
    const nodeCId = neoGraph.createNode({ id: "C", type: "node" });
    const nodeDId = neoGraph.createNode({ id: "D", type: "node" });

    // Create component IDs
    const nodeA: NeoComponentId = { id: nodeAId, type: "node:test" };
    const nodeB: NeoComponentId = { id: nodeBId, type: "node:test" };
    const nodeC: NeoComponentId = { id: nodeCId, type: "node:test" };
    const nodeD: NeoComponentId = { id: nodeDId, type: "node:test" };

    // Add edges
    neoGraph.createEdge({
      id: "AB",
      source: nodeA,
      target: nodeB,
      type: "edge",
      properties: {}
    });
    
    neoGraph.createEdge({
      id: "AC",
      source: nodeA,
      target: nodeC,
      type: "edge",
      properties: {}
    });
    
    neoGraph.createEdge({
      id: "CD",
      source: nodeC,
      target: nodeD,
      type: "edge",
      properties: {}
    });

    // Find outgoing edges from A
    const outgoingEdges = neoGraph.findEdges(nodeAId, "outgoing");
    expect(outgoingEdges.length).toBe(2);
    
    // Find incoming edges to C
    const incomingEdges = neoGraph.findEdges(nodeCId, "incoming");
    expect(incomingEdges.length).toBe(1);
    expect(incomingEdges[0].source.id).toBe(nodeAId);
    
    // Find all edges connected to C
    const allCEdges = neoGraph.findEdges(nodeCId, "both");
    expect(allCEdges.length).toBe(2);
  });

  it("should handle property operations", () => {
    // Create a node
    const nodeId = neoGraph.createNode({
      type: "person",
      properties: {
        name: "John"
      }
    });

    // Set a property
    neoGraph.setProperty(nodeId, "age", 30);
    const node = neoGraph.getNode(nodeId);
    expect(node?.properties.age).toBe(30);

    // Delete a property
    neoGraph.deleteProperty(nodeId, "age");
    const updatedNode = neoGraph.getNode(nodeId);
    expect(updatedNode?.properties.age).toBeUndefined();
  });

  it("should shutdown properly", async () => {
    // Create some data
    neoGraph.createNode({ type: "test", properties: {} });
    
    // Shutdown
    await neoGraph.shutdown();
    
    // After shutdown, the graph should be empty
    expect(neoGraph.findNodes({})).toEqual([]);
  });
});
