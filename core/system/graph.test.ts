import { describe, it, expect } from "vitest";
import {
  PropertyType,
  PropertyDefinition,
  SystemPropertyHandler,
  PropertyFilterValue,
  PropertyFilterOperation,
} from "./property";

import {
  createGraph,
  addNodeToGraph,
  addEdgeToGraph,
  getNodeFromGraph,
  getEdgeFromGraph,
  getIncomingEdges,
  getOutgoingEdges,
  findNodesByProperty,
  traverseGraph,
} from "./graph";

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
    expect(coercedDate.getFullYear()).toBe(2023);

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
  it("should create a graph with nodes and edges", () => {
    // Create a graph
    const graph = createGraph({
      id: "test-graph",
      name: "Test Graph",
      description: "A test graph",
    });

    // Add nodes
    let updatedGraph = addNodeToGraph(graph, {
      id: "node1",
      type: "person",
      label: "John",
      properties: {
        age: 30,
        role: "developer",
      },
    });

    updatedGraph = addNodeToGraph(updatedGraph, {
      id: "node2",
      type: "person",
      label: "Jane",
      properties: {
        age: 28,
        role: "designer",
      },
    });

    // Add an edge
    updatedGraph = addEdgeToGraph(updatedGraph, {
      id: "edge1",
      source: "node1",
      target: "node2",
      type: "knows",
      label: "Knows",
      properties: {
        since: "2020-01-01",
      },
    });

    // Test the graph structure
    expect(updatedGraph.nodes.length).toBe(2);
    expect(updatedGraph.edges.length).toBe(1);

    // Test node retrieval
    const node1 = getNodeFromGraph(updatedGraph, "node1");
    expect(node1).toBeDefined();
    expect(node1?.label).toBe("John");
    expect(node1?.properties.age).toBe(30);

    // Test edge retrieval
    const edge1 = getEdgeFromGraph(updatedGraph, "edge1");
    expect(edge1).toBeDefined();
    expect(edge1?.source).toBe("node1");
    expect(edge1?.target).toBe("node2");
    expect(edge1?.properties.since).toBe("2020-01-01");
  });

  it("should find nodes by property", () => {
    // Create a graph with nodes
    const graph = createGraph({
      id: "test-graph",
      name: "Test Graph",
    });

    let updatedGraph = addNodeToGraph(graph, {
      id: "node1",
      type: "person",
      properties: {
        age: 30,
        role: "developer",
      },
    });

    updatedGraph = addNodeToGraph(updatedGraph, {
      id: "node2",
      type: "person",
      properties: {
        age: 28,
        role: "designer",
      },
    });

    updatedGraph = addNodeToGraph(updatedGraph, {
      id: "node3",
      type: "person",
      properties: {
        age: 30,
        role: "manager",
      },
    });

    // Find nodes by property
    const developersQuery = { operation: "eq", value: "developer" };
    const developers = findNodesByProperty(
      updatedGraph,
      "role",
      developersQuery
    );
    expect(developers.length).toBe(1);
    expect(developers[0].id).toBe("node1");

    const age30Query = {
      operation: PropertyFilterOperation.EQUALS,
      value: 30,
    };
    const age30 = findNodesByProperty(updatedGraph, "age", age30Query);
    expect(age30.length).toBe(2);
    expect(age30.map((n) => n.id).sort()).toEqual(["node1", "node3"]);
  });

  it("should traverse a graph", () => {
    // Create a graph
    const graph = createGraph({
      id: "test-graph",
      name: "Test Graph",
    });

    // Add nodes
    let updatedGraph = graph;
    updatedGraph = addNodeToGraph(updatedGraph, { id: "A", type: "node" });
    updatedGraph = addNodeToGraph(updatedGraph, { id: "B", type: "node" });
    updatedGraph = addNodeToGraph(updatedGraph, { id: "C", type: "node" });
    updatedGraph = addNodeToGraph(updatedGraph, { id: "D", type: "node" });

    // Add edges
    updatedGraph = addEdgeToGraph(updatedGraph, {
      id: "AB",
      source: "A",
      target: "B",
      type: "edge",
    });
    updatedGraph = addEdgeToGraph(updatedGraph, {
      id: "AC",
      source: "A",
      target: "C",
      type: "edge",
    });
    updatedGraph = addEdgeToGraph(updatedGraph, {
      id: "CD",
      source: "C",
      target: "D",
      type: "edge",
    });

    // Traverse and collect visited nodes
    const visited: string[] = [];
    traverseGraph(updatedGraph, "A", (node) => {
      visited.push(node.id);
    });

    // Order might vary depending on implementation details
    expect(visited.length).toBe(4);
    expect(visited).toContain("A");
    expect(visited).toContain("B");
    expect(visited).toContain("C");
    expect(visited).toContain("D");

    // Test limited depth traversal
    const limitedVisited: string[] = [];
    traverseGraph(
      updatedGraph,
      "A",
      (node) => {
        limitedVisited.push(node.id);
      },
      { maxDepth: 1 }
    );

    expect(limitedVisited.length).toBe(3);
    expect(limitedVisited).toContain("A");
    expect(limitedVisited).toContain("B");
    expect(limitedVisited).toContain("C");
    expect(limitedVisited).not.toContain("D");
  });
});
