import { assert } from 'assert';
import { describe, it, expect, beforeEach } from "vitest";
import {
  NeoCore,
  createNeoExtension
} from './neo';
import { NeoComponentId } from './extension';
import { NeoEvent } from './event';

describe('NeoCore', () => {
  const testComponentId = {
    id: 'test-neo-core',
    type: 'neo:core:test',
    name: 'Test Neo Core'
  };

  let neoCore: NeoCore;

  beforeEach(() => {
    // Create a fresh NeoCore instance for each test
    neoCore = new NeoCore(testComponentId, { verbose: false });
  });

  afterEach(async () => {
    // Clean up after each test
    if (neoCore && typeof neoCore.shutdown === 'function') {
      await neoCore.shutdown().catch(() => {
        // Ignore shutdown errors in cleanup
      });
    }
  });

  describe('Initialization', () => {
    it('should create a NeoCore instance with default options', () => {
      assert(neoCore instanceof NeoCore);
      assert(neoCore.protocol);
      assert(neoCore.dialectic);
      assert(neoCore.graph);
      assert(neoCore.property);
    });

    it('should initialize core systems successfully', async () => {
      await neoCore.initialize();
      assert(neoCore.isInitialized());
    });
  });

  describe('Extension Management', () => {
    let testExtension;
    
    beforeEach(() => {
      testExtension = createNeoExtension({
        id: { id: 'test-extension', type: 'extension:test' },
        type: 'test-extension',
        capabilities: ['test']
      });
    });

    it('should register an extension successfully', () => {
      neoCore.registerExtension(testExtension);
      assert(neoCore.hasExtension('test-extension'));
      assert.strictEqual(neoCore.getExtension('test-extension'), testExtension);
    });

    it('should get extensions by type', () => {
      const extension1 = createNeoExtension({
        id: { id: 'test-extension-1', type: 'extension:test' },
        type: 'type-a',
      });
      
      const extension2 = createNeoExtension({
        id: { id: 'test-extension-2', type: 'extension:test' },
        type: 'type-b',
      });
      
      neoCore.registerExtension(extension1);
      neoCore.registerExtension(extension2);
      
      const typeAExtensions = neoCore.getExtensionsByType('type-a');
      assert.strictEqual(typeAExtensions.length, 1);
      assert.strictEqual(typeAExtensions[0], extension1);
      
      const typeBExtensions = neoCore.getExtensionsByType('type-b');
      assert.strictEqual(typeBExtensions.length, 1);
      assert.strictEqual(typeBExtensions[0], extension2);
    });
  });

  describe('Configuration Management', () => {
    it('should get and set configuration values', () => {
      // Default value
      assert.strictEqual(neoCore.getConfig('testKey', 'default'), 'default');
      
      // Set value
      neoCore.setConfig('testKey', 'testValue');
      assert.strictEqual(neoCore.getConfig('testKey'), 'testValue');
    });
  });

  describe('Entity Management', () => {
    it('should create an entity with generated ID if not provided', () => {
      const entity = { name: 'Test Entity' };
      const entityId = neoCore.createEntity(entity);
      
      assert(typeof entityId === 'string');
      assert(entityId.includes('entity:'));
    });
  });

  describe('Shutdown', () => {
    it('should properly shutdown', async () => {
      await neoCore.initialize();
      
      // Should be able to shutdown without errors
      await neoCore.shutdown();
      
      // Should be marked as not initialized
      expect(neoCore.isInitialized()).toBe(false);
    });
  });
});