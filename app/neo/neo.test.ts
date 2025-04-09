import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createNeoCore, NeoCore, NeoComponent, NeoExtension } from "./neo";

describe("Neo Core System", () => {
  let core: NeoCore;

  beforeEach(() => {
    core = createNeoCore({ 
      id: 'test-core', 
      name: 'Test Core', 
      type: 'neo:core' 
    });
  });

  afterEach(async () => {
    if (core) {
      await core.shutdown();
    }
  });

  it("should initialize the core system", async () => {
    await core.initialize();
    expect(core.isInitialized()).toBe(true);
  });

  it("should register and retrieve components", async () => {
    // Create a test component
    const testComponent: NeoComponent = {
      id: 'test-component',
      initialize: async () => true,
      cleanup: async () => {},
      componentId: {
        id: 'test-component',
        name: 'Test Component',
        type: 'test'
      }
    };
    
    core.registerComponent('test', testComponent);
    await core.initialize();
    
    const retrievedComponent = core.getComponent('test');
    expect(retrievedComponent).toBeDefined();
    expect(retrievedComponent.id).toBe('test-component');
  });

  it("should register and initialize extensions", async () => {
    // Create a test extension
    const testExtension: NeoExtension = {
      id: 'test-extension',
      type: 'test',
      capabilities: ['test:capability'],
      initialize: async (core) => {
        // Track that initialize was called
        (testExtension as any).initialized = true;
        return true;
      },
      cleanup: async () => {}
    };
    
    core.registerExtension(testExtension);
    await core.initialize();
    
    expect((testExtension as any).initialized).toBe(true);
    
    // Verify extension is registered
    const extensions = core.getExtensions();
    expect(extensions.length).toBe(1);
    expect(extensions[0].id).toBe('test-extension');
  });

  it("should find extensions by capability", async () => {
    // Create two test extensions with different capabilities
    const extension1: NeoExtension = {
      id: 'extension1',
      type: 'test',
      capabilities: ['cap1', 'cap2'],
      initialize: async () => true,
      cleanup: async () => {}
    };
    
    const extension2: NeoExtension = {
      id: 'extension2',
      type: 'test',
      capabilities: ['cap2', 'cap3'],
      initialize: async () => true,
      cleanup: async () => {}
    };
    
    core.registerExtension(extension1);
    core.registerExtension(extension2);
    await core.initialize();
    
    const cap1Extensions = core.findExtensionsByCapability('cap1');
    expect(cap1Extensions.length).toBe(1);
    expect(cap1Extensions[0].id).toBe('extension1');
    
    const cap2Extensions = core.findExtensionsByCapability('cap2');
    expect(cap2Extensions.length).toBe(2);
    expect(cap2Extensions.map(e => e.id).sort()).toEqual(['extension1', 'extension2']);
    
    const cap3Extensions = core.findExtensionsByCapability('cap3');
    expect(cap3Extensions.length).toBe(1);
    expect(cap3Extensions[0].id).toBe('extension2');
  });

  it("should provide access to the event system", async () => {
    await core.initialize();
    const events = [];
    
    // Register event handler
    core.on('test', (event) => {
      events.push(event);
    });
    
    // Emit event
    core.emit({
      id: 'test:1',
      type: 'test',
      source: 'test-source',
      timestamp: Date.now()
    });
    
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('test');
  });

  it("should shutdown cleanly", async () => {
    // Create component with cleanup tracking
    const testComponent: NeoComponent = {
      id: 'test-component',
      initialize: async () => true,
      cleanup: async () => {
        (testComponent as any).cleanedUp = true;
      },
      componentId: {
        id: 'test-component',
        name: 'Test Component',
        type: 'test'
      }
    };
    
    core.registerComponent('test', testComponent);
    await core.initialize();
    
    // Shutdown
    await core.shutdown();
    
    expect((testComponent as any).cleanedUp).toBe(true);
    expect(core.isInitialized()).toBe(false);
  });
});