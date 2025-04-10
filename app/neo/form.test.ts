import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NeoForm, createNeoForm } from './form';
import { NeoCore } from './neo';
import { NeoGraph } from './graph';
import { NeoComponentId } from './extension';
import { NeoNode } from './entity';
import EventEmitter from 'events';

// Mock dependencies
vi.mock('./neo', () => ({
  NeoCore: vi.fn().mockImplementation(() => ({
    registerExtension: vi.fn(),
    protocol: {
      emit: vi.fn()
    }
  }))
}));

vi.mock('./graph', () => ({
  NeoGraph: vi.fn().mockImplementation(() => ({
    // Basic mock implementation
  }))
}));

vi.mock('./node', () => {
  return {
    NeoNode: {
      create: vi.fn().mockImplementation((options) => ({
        id: 'test-node-id',
        type: 'test-node-type',
        data: {},
        ...options
      }))
    }
  };
});

describe('NeoForm', () => {
  let form: NeoForm;
  let mockCore: any;
  let mockGraph: any;
  let mockComponentId: NeoComponentId;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mocks
    mockCore = new NeoCore();
    mockGraph = new NeoGraph();
    mockComponentId = {
      id: 'test-form-id',
      type: 'neo:form',
      name: 'Test Form'
    };

    // Create NeoForm instance
    form = createNeoForm({
      core: mockCore,
      componentId: mockComponentId,
      graph: mockGraph
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a NeoForm instance', () => {
    expect(form).toBeInstanceOf(NeoForm);
  });

  it('should register a form definition', () => {
    // Spy on emit method
    const emitSpy = vi.spyOn(form, 'emit');
    
    const formDef = {
      id: 'test-form-1',
      type: 'test-type',
      schema: { type: 'object' }
    };

    form.registerForm(formDef);

    // Expect form to be registered
    expect(form.getForm('test-form-1')).toEqual(formDef);
    
    // Check if events were emitted
    expect(emitSpy).toHaveBeenCalledTimes(2);
    expect(emitSpy.mock.calls[0][0].type).toBe('form');
    expect(emitSpy.mock.calls[0][0].subtype).toBe('registered');
  });

  it('should throw error when registering form without id', () => {
    const formDef = {
      type: 'test-type',
      schema: { type: 'object' }
    };

    expect(() => form.registerForm(formDef)).toThrow('Form definition must have an id');
  });

  it('should get all registered forms', () => {
    const formDef1 = { id: 'test-form-1', type: 'test-type' };
    const formDef2 = { id: 'test-form-2', type: 'test-type' };

    form.registerForm(formDef1);
    form.registerForm(formDef2);

    const forms = form.getForms();
    expect(forms).toHaveLength(2);
    expect(forms).toContainEqual(formDef1);
    expect(forms).toContainEqual(formDef2);
  });

  it('should register and initialize an extension', async () => {
    const mockExtension = {
      id: { id: 'test-ext-1', type: 'test-extension', name: 'Test Extension' },
      capabilities: ['testCapability'],
      initialize: vi.fn()
    };

    form.registerExtension(mockExtension);
    await form.initialize();
    
    expect(mockExtension.initialize).toHaveBeenCalledWith(mockCore);
  });

  it('should throw error when registering extension without id', () => {
    const mockExtension = {
      capabilities: ['testCapability'],
      initialize: vi.fn()
    };

    expect(() => form.registerExtension(mockExtension)).toThrow('Extension must have an id');
  });

  it('should execute a form and process through BEC, MVC, and NEO', async () => {
    const formDef = {
      id: 'test-exec-form',
      type: 'test-type',
      schema: { type: 'object' }
    };

    // Register the form
    form.registerForm(formDef);

    // Spy on private methods using any type assertion
    const becSpy = vi.spyOn(form as any, 'processBEC').mockResolvedValue({
      being: { test: 'being' },
      essence: { test: 'essence' },
      concept: { test: 'concept' }
    });

    const mvcSpy = vi.spyOn(form as any, 'processMVC').mockResolvedValue({
      model: { test: 'model' },
      view: { test: 'view' },
      controller: { test: 'controller' }
    });

    const neoSpy = vi.spyOn(form as any, 'processNEO').mockResolvedValue({
      core: { test: 'core' },
      dialectic: { test: 'dialectic' },
      graph: { test: 'graph' }
    });

    // Execute the form
    const input = { foo: 'bar' };
    const result = await form.executeForm('test-exec-form', input);

    // Verify process functions were called
    expect(becSpy).toHaveBeenCalledWith(formDef, input, expect.anything());
    expect(mvcSpy).toHaveBeenCalledWith(formDef, expect.anything(), expect.anything());
    expect(neoSpy).toHaveBeenCalledWith(formDef, expect.anything(), expect.anything(), expect.anything());

    // Check result structure
    expect(result.formId).toBe('test-exec-form');
    expect(result.success).toBe(true);
    expect(result.universal).toBeDefined();
    expect(result.particular).toBeDefined();
    expect(result.infrastructure).toBeDefined();
  });

  it('should create a NeoNode when executing form with createNode option', async () => {
    const formDef = {
      id: 'test-node-form',
      type: 'test-type',
      nodeType: 'test-node-type'
    };

    // Register the form
    form.registerForm(formDef);

    // Spy on createNeoNode
    const nodeSpy = vi.spyOn(form as any, 'createNeoNode').mockResolvedValue({
      id: 'test-node-id',
      type: 'test-node-type',
      data: { test: 'data' }
    });

    // Execute the form with createNode option
    const result = await form.executeForm('test-node-form', { foo: 'bar' }, { createNode: true });

    // Verify node was created
    expect(nodeSpy).toHaveBeenCalled();
    expect(result.node).toBeDefined();
    expect(result.node.id).toBe('test-node-id');
    expect(result.node.type).toBe('test-node-type');
  });

  it('should throw error when executing non-existent form', async () => {
    await expect(form.executeForm('non-existent-form', {}))
      .rejects
      .toThrow('Form not found: non-existent-form');
  });

  it('should handle events with on/emit methods', () => {
    const mockHandler = vi.fn();
    const cleanup = form.on('test:event', mockHandler);

    const testEvent = {
      id: 'test-event-id',
      type: 'test',
      subtype: 'event',
      source: mockComponentId,
      timestamp: Date.now(),
      content: { test: 'data' }
    };

    form.emit(testEvent);
    
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
      type: 'test',
      subtype: 'event'
    }));

    // Test cleanup
    cleanup();
    form.emit(testEvent);
    expect(mockHandler).toHaveBeenCalledTimes(1); // Should not be called again
  });

  it('should clean up resources', async () => {
    const mockExtension = {
      id: { id: 'test-ext-1', type: 'test-extension', name: 'Test Extension' },
      capabilities: ['testCapability'],
      initialize: vi.fn(),
      cleanup: vi.fn()
    };

    form.registerExtension(mockExtension);
    await form.cleanup();
    
    expect(mockExtension.cleanup).toHaveBeenCalled();
  });
});