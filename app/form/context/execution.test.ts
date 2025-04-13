import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  FormExecutionContext,
  ExecutionEnvironmentType,
  ExecutionOperation,
  ExecutionResult,
  createExecutionContext,
  withExecutionContext
} from './execution';
import { FormContext } from './context';

describe('FormExecutionContext', () => {
  // Clean up contexts after each test
  afterEach(() => {
    // Access private property for testing purposes
    const contexts = (FormContext as any).contexts;
    if (contexts && contexts instanceof Map) {
      contexts.clear();
    }
    
    // Reset active context
    const activeContextIdSetter = Object.getOwnPropertyDescriptor(
      FormContext, 
      'activeContextId'
    )?.set;
    
    if (activeContextIdSetter) {
      activeContextIdSetter.call(FormContext, null);
    }
  });

  describe('Basic Creation and Properties', () => {
    it('should create an execution context with default environment', () => {
      const context = new FormExecutionContext({
        name: 'Test Execution Context'
      });
      
      expect(context).toBeInstanceOf(FormContext);
      expect(context).toBeInstanceOf(FormExecutionContext);
      expect(context.getEnvironmentType()).toBe('qualitative');
      expect(context.metadata.executionCapable).toBe(true);
    });

    it('should create an execution context with specified environment', () => {
      const context = new FormExecutionContext({
        name: 'Quantitative Context',
        environmentType: 'quantitative'
      });
      
      expect(context.getEnvironmentType()).toBe('quantitative');
      expect(context.metadata.environmentType).toBe('quantitative');
    });

    it('should create context using static factory method', () => {
      const context = FormExecutionContext.createExecutionContext({
        name: 'Factory Created Context',
        environmentType: 'quantitative'
      });
      
      expect(context).toBeInstanceOf(FormExecutionContext);
      expect(context.getEnvironmentType()).toBe('quantitative');
    });

    it('should create context using convenience function', () => {
      const context = createExecutionContext({
        name: 'Convenience Function Context'
      });
      
      expect(context).toBeInstanceOf(FormExecutionContext);
    });
  });

  describe('Environment Switching', () => {
    it('should switch environment types', () => {
      const context = new FormExecutionContext({});
      
      // Default is qualitative
      expect(context.getEnvironmentType()).toBe('qualitative');
      
      // Switch to quantitative
      context.setEnvironmentType('quantitative');
      expect(context.getEnvironmentType()).toBe('quantitative');
      
      // Switch back
      context.setEnvironmentType('qualitative');
      expect(context.getEnvironmentType()).toBe('qualitative');
    });

    it('should update metadata when switching environments', () => {
      const context = new FormExecutionContext({});
      
      // Switch environment
      context.setEnvironmentType('quantitative');
      
      // Check metadata
      expect(context.metadata.environmentType).toBe('quantitative');
      expect(context.metadata.environmentChanged).toBeTypeOf('number');
    });

    it('should switch using dedicated mode methods', () => {
      const context = new FormExecutionContext({});
      
      // Switch to quantitative
      context.enterQuantitativeMode();
      expect(context.getEnvironmentType()).toBe('quantitative');
      
      // Switch to qualitative
      context.enterQualitativeMode();
      expect(context.getEnvironmentType()).toBe('qualitative');
    });

    it('should preserve previous environment when using withEnvironment', () => {
      const context = new FormExecutionContext({
        environmentType: 'qualitative'
      });
      
      const result = context.withEnvironment('quantitative', () => {
        expect(context.getEnvironmentType()).toBe('quantitative');
        return 'executed in quantitative';
      });
      
      // Should return to qualitative
      expect(context.getEnvironmentType()).toBe('qualitative');
      expect(result).toBe('executed in quantitative');
    });

    it('should restore previous environment even if function throws', () => {
      const context = new FormExecutionContext({
        environmentType: 'qualitative'
      });
      
      try {
        context.withEnvironment('quantitative', () => {
          throw new Error('Test error');
        });
      } catch (e) {
        // Swallow the error
      }
      
      // Should return to qualitative despite error
      expect(context.getEnvironmentType()).toBe('qualitative');
    });
  });

  describe('Operation Execution', () => {
    it('should track operations using beginOperation and completeOperation', () => {
      const context = new FormExecutionContext({});
      
      // Begin operation
      const opId = context.beginOperation('calculate');
      
      // Check metadata
      expect(context.metadata.activeOperation).toBe(opId);
      expect(context.metadata.operationStarted).toBeTypeOf('number');
      
      // Complete operation
      const result = context.completeOperation(opId, 42);
      
      // Check result
      expect(result.success).toBe(true);
      expect(result.value).toBe(42);
      expect(result.operation).toBe('calculate');
      expect(result.environmentType).toBe('qualitative');
      expect(result.contextId).toBe(context.id);
      
      // Metadata should be updated
      expect(context.metadata.activeOperation).toBeUndefined();
      expect(context.metadata.operationCompleted).toBeTypeOf('number');
    });

    it('should handle unknown operation IDs', () => {
      const context = new FormExecutionContext({});
      
      const result = context.completeOperation('non-existent', 42);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Operation not found');
    });

    it('should execute operations and return results', () => {
      const context = new FormExecutionContext({});
      
      const result = context.execute('calculate', () => 2 + 2);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe(4);
      expect(result.operation).toBe('calculate');
      expect(result.environmentType).toBe('qualitative');
    });

    it('should handle errors in operation execution', () => {
      const context = new FormExecutionContext({});
      
      const result = context.execute('calculate', () => {
        throw new Error('Test calculation error');
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Test calculation error');
      expect(result.operation).toBe('calculate');
    });
  });

  describe('Static Execution Methods', () => {
    it('should execute in context with withExecutionContext static method', () => {
      // Create a regular context
      const regularContext = new FormContext({ 
        id: 'static-test',
        name: 'Regular Context' 
      });
      
      const result = FormExecutionContext.withExecutionContext(
        'static-test',
        'quantitative',
        () => 'executed in quantitative'
      );
      
      expect(result).toBe('executed in quantitative');
    });

    it('should execute directly if already an execution context', () => {
      // Create an execution context
      const execContext = new FormExecutionContext({ 
        id: 'exec-static-test',
        name: 'Execution Context' 
      });
      
      const result = FormExecutionContext.withExecutionContext(
        'exec-static-test',
        'quantitative',
        () => 'executed in quantitative'
      );
      
      expect(result).toBe('executed in quantitative');
    });

    it('should work with the convenience function', () => {
      // Create a regular context
      const regularContext = new FormContext({ 
        id: 'convenience-test',
        name: 'Regular Context' 
      });
      
      const result = withExecutionContext(
        'convenience-test',
        'quantitative',
        () => 'executed with convenience function'
      );
      
      expect(result).toBe('executed with convenience function');
    });

    it('should throw error for non-existent contexts', () => {
      expect(() => {
        FormExecutionContext.withExecutionContext(
          'non-existent-context',
          'qualitative',
          () => 'should not execute'
        );
      }).toThrow('Context not found');
    });
  });

  describe('Integration with FormContext', () => {
    it('should inherit FormContext capabilities', () => {
      const context = new FormExecutionContext({
        name: 'Integrated Context'
      });
      
      // Register an entity (FormContext capability)
      context.registerEntity('test-entity');
      
      expect(context.entities.has('test-entity')).toBe(true);
    });

    it('should handle parent-child relationships', () => {
      const parent = new FormContext({
        id: 'parent-context',
        name: 'Parent Context'
      });
      
      const child = new FormExecutionContext({
        parentId: 'parent-context',
        name: 'Child Execution Context'
      });
      
      expect(child.parentId).toBe('parent-context');
      expect(parent.children.has(child.id)).toBe(true);
    });

    it('should work with FormContext static methods', () => {
      const context = new FormExecutionContext({
        id: 'static-integration-test',
        name: 'Static Integration Context'
      });
      
      const result = FormContext.withContext('static-integration-test', () => {
        return 'executed via FormContext';
      });
      
      expect(result).toBe('executed via FormContext');
    });
  });

  describe('Dual Execution Paradigm', () => {
    it('should execute qualitative operations', () => {
      const context = new FormExecutionContext({
        environmentType: 'qualitative'
      });
      
      const result = context.execute('syllogize', () => {
        // In a real system, this would use the qualitative engine
        return { 
          subject: 'Socrates', 
          predicate: 'mortal' 
        };
      });
      
      expect(result.success).toBe(true);
      expect(result.value.subject).toBe('Socrates');
      expect(result.value.predicate).toBe('mortal');
      expect(result.environmentType).toBe('qualitative');
    });

    it('should execute quantitative operations', () => {
      const context = new FormExecutionContext({
        environmentType: 'quantitative'
      });
      
      const result = context.execute('calculate', () => {
        // In a real system, this would use the quantitative engine
        return 3.14159 * 5 * 5;
      });
      
      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(78.54, 2);
      expect(result.environmentType).toBe('quantitative');
    });

    it('should switch environments for different operation types', () => {
      const context = new FormExecutionContext({});
      
      // Qualitative operation
      const qualResult = context.withEnvironment('qualitative', () => {
        return context.execute('classify', () => ['mammal', 'primate', 'human']);
      });
      
      // Quantitative operation
      const quantResult = context.withEnvironment('quantitative', () => {
        return context.execute('calculate', () => 299792458); // Speed of light in m/s
      });
      
      expect(qualResult.value).toContain('human');
      expect(qualResult.environmentType).toBe('qualitative');
      
      expect(quantResult.value).toBe(299792458);
      expect(quantResult.environmentType).toBe('quantitative');
    });
  });
});