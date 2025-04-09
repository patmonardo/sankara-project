import { describe, it, expect } from "vitest";
import { createNeoNode } from "./node";

describe("Neo Node System", () => {
  it("should create a node with proper structure", () => {
    const node = createNeoNode({
      id: "test-node",
      type: "test",
      being: { quality: "conceptual" },
      essence: { appearance: "Test Node" },
      concept: { purpose: "testing" }
    });
    
    expect(node).toBeDefined();
    expect(node.id).toBe("test-node");
    expect(node.type).toBe("test");
  });

  it("should contain BEC ontological structure", () => {
    const node = createNeoNode({
      id: "ontological-node",
      type: "entity",
      being: { 
        quality: "essential",
        immediacy: true 
      },
      essence: { 
        appearance: "Test Entity",
        mediation: true
      },
      concept: {
        universal: "entity",
        particular: "Test Entity",
        individual: "ontological-node",
        purpose: "representation"
      }
    });
    
    expect(node.being).toBeDefined();
    expect(node.being.quality).toBe("essential");
    expect(node.essence).toBeDefined();
    expect(node.essence.appearance).toBe("Test Entity");
    expect(node.concept).toBeDefined();
    expect(node.concept.purpose).toBe("representation");
  });

  it("should support the act method for node interaction", () => {
    const node = createNeoNode({
      id: "interactive-node",
      type: "agent",
      being: { active: true },
      essence: { interactive: true },
      concept: { purposeful: true },
      
      // Define custom act behavior
      act: (input) => {
        return {
          result: "processed",
          input,
          nodeId: "interactive-node"
        };
      }
    });
    
    const result = node.act({ command: "test" });
    
    expect(result).toBeDefined();
    expect(result.result).toBe("processed");
    expect(result.input.command).toBe("test");
    expect(result.nodeId).toBe("interactive-node");
  });

  it("should create node from form execution result", () => {
    const formResult = {
      universal: {
        being: { quality: "formative" },
        essence: { appearance: "Form Result" },
        concept: { purpose: "creation" }
      },
      particular: {
        model: { structured: true },
        view: { visible: true },
        controller: { interactive: true }
      },
      infrastructure: {
        core: { configured: true },
        events: { registered: true }
      }
    };
    
    const node = createNeoNode({
      id: "form-node",
      type: "form:result",
      ...formResult
    });
    
    expect(node.universal).toBeDefined();
    expect(node.universal.being.quality).toBe("formative");
    expect(node.particular).toBeDefined();
    expect(node.particular.model.structured).toBe(true);
    expect(node.infrastructure).toBeDefined();
    expect(node.infrastructure.core.configured).toBe(true);
  });

  it("should support hierarchical node structures", () => {
    // Create parent node
    const parentNode = createNeoNode({
      id: "parent-node",
      type: "container"
    });
    
    // Create child nodes
    const childNode1 = createNeoNode({
      id: "child-node-1",
      type: "item",
      parent: parentNode.id
    });
    
    const childNode2 = createNeoNode({
      id: "child-node-2",
      type: "item",
      parent: parentNode.id
    });
    
    // Add children to parent
    parentNode.children = [childNode1.id, childNode2.id];
    
    expect(parentNode.children).toContain(childNode1.id);
    expect(parentNode.children).toContain(childNode2.id);
    expect(childNode1.parent).toBe(parentNode.id);
    expect(childNode2.parent).toBe(parentNode.id);
  });
});