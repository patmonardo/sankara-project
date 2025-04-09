import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createNeoCore } from "./neo";
import { createNeoForm } from "./form";
import { createNeoGraph } from "./graph";
import { createBECExtension } from "./extension/bec";

describe("Neo Core Integration", () => {
  let core;
  let form;
  let graph;
  
  beforeAll(async () => {
    core = createNeoCore({ id: 'test-core' });
    const becExtension = createBECExtension();
    core.registerExtension(becExtension);
    
    graph = createNeoGraph({ core });
    form = createNeoForm({ core, graph });
    
    await core.initialize();
  });
  
  afterAll(async () => {
    await core.shutdown();
  });
  
  it("should execute form and process through BEC", async () => {
    // Register a form
    form.registerForm({
      id: 'test-form',
      type: 'entity',
      name: 'Test Form',
      schema: {
        properties: {
          name: { type: 'string', required: true }
        }
      }
    });
    
    // Execute form
    const result = await form.executeForm('test-form', { name: 'Test Entity' });
    
    // Verify form result
    expect(result.universal).toBeDefined();
    expect(result.particular).toBeDefined();
    expect(result.infrastructure).toBeDefined();
    
    // Verify BEC processing
    expect(result.universal.being).toBeDefined();
    expect(result.universal.essence).toBeDefined();
    expect(result.universal.concept).toBeDefined();
  });
  
  it("should create and store nodes in graph", async () => {
    // Register a form
    form.registerForm({
      id: 'graph-test-form',
      type: 'entity',
      name: 'Graph Test',
      schema: {
        properties: {
          name: { type: 'string' }
        }
      }
    });
    
    // Execute form with node creation
    const result = await form.executeForm(
      'graph-test-form', 
      { name: 'Graph Node' }, 
      { createNode: true, persistNode: true }
    );
    
    // Verify node was created
    expect(result.node).toBeDefined();
    expect(result.node.id).toContain('node:form:graph-test-form');
    
    // Verify node is in graph
    const node = await graph.getNode(result.node.id);
    expect(node).toBeDefined();
    expect(node.properties.name).toBe('Graph Node');
  });
  
  it("should process entities through BEC extension", async () => {
    // Create entity
    const entityId = await core.dialectic.createEntity({
      type: 'test',
      name: 'BEC Test Entity',
      properties: {
        purpose: 'testing'
      }
    });
    
    // Wait for BEC processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get entity with BEC metadata
    const entity = await core.dialectic.getEntity(entityId);
    expect(entity.metadata?.bec).toBeDefined();
    expect(entity.metadata?.bec.beingProcessed).toBe(true);
    expect(entity.metadata?.bec.essenceProcessed).toBe(true);
    expect(entity.metadata?.bec.conceptProcessed).toBe(true);
  });
});