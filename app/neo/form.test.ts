import { expect, test, describe, beforeAll, afterAll } from 'vitest';
import { createNeoCore } from '../../app/neo/neo';
import { createNeoForm } from '../../app/neo/form';
import { createNeoGraph } from '../../app/neo/graph';
import { NeoEvent } from '../../app/neo/event';

describe('NeoForm', () => {
  const core = createNeoCore({ id: 'test-core', name: 'Test Core', type: 'neo:core' });
  const graph = createNeoGraph({ core });
  const form = createNeoForm({ core, componentId: { id: 'test-form', name: 'Test Form', type: 'neo:form' }, graph });
  
  beforeAll(async () => {
    await core.initialize();
    await form.initialize();
  });
  
  afterAll(async () => {
    await form.cleanup();
    await core.shutdown();
  });
  
  test('Form registration', () => {
    // Register a test form
    const testForm = {
      id: 'test-entity',
      type: 'entity',
      name: 'Test Entity',
      schema: {
        properties: {
          name: { type: 'string', required: true },
          description: { type: 'string' }
        }
      }
    };
    
    form.registerForm(testForm);
    
    const retrievedForm = form.getForm('test-entity');
    expect(retrievedForm).toBeDefined();
    expect(retrievedForm.id).toBe('test-entity');
  });
  
  test('Form execution with BEC-MVC-NEO processing', async () => {
    // Register a test form
    const processingForm = {
      id: 'test-process',
      type: 'process',
      name: 'Test Process',
      schema: {
        properties: {
          input: { type: 'string', required: true }
        }
      }
    };
    
    form.registerForm(processingForm);
    
    // Execute the form
    const result = await form.executeForm('test-process', { input: 'test data' });
    
    // Verify structure of result
    expect(result).toBeDefined();
    expect(result.formId).toBe('test-process');
    expect(result.success).toBe(true);
    
    // Verify BEC result
    expect(result.universal).toBeDefined();
    expect(result.universal.being).toBeDefined();
    expect(result.universal.essence).toBeDefined();
    expect(result.universal.concept).toBeDefined();
    
    // Verify MVC result
    expect(result.particular).toBeDefined();
    expect(result.particular.model).toBeDefined();
    expect(result.particular.view).toBeDefined();
    expect(result.particular.controller).toBeDefined();
    
    // Verify NEO result
    expect(result.infrastructure).toBeDefined();
    expect(result.infrastructure.core).toBeDefined();
    expect(result.infrastructure.dialectic).toBeDefined();
    expect(result.infrastructure.graph).toBeDefined();
  });
  
  test('Form execution with node creation', async () => {
    // Register a test form
    const nodeForm = {
      id: 'test-node',
      type: 'entity',
      name: 'Node Creator',
      schema: {
        properties: {
          name: { type: 'string', required: true }
        }
      }
    };
    
    form.registerForm(nodeForm);
    
    // Execute with node creation
    const result = await form.executeForm('test-node', 
      { name: 'Test Node' }, 
      { createNode: true }
    );
    
    // Verify node was created
    expect(result.node).toBeDefined();
    expect(result.node.id).toContain('node:form:test-node');
    expect(result.node.type).toBe('form:result');
    
    // Verify node functionality
    const nodeResult = result.node.act({ test: true });
    expect(nodeResult).toBeDefined();
  });
});