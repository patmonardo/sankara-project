import { FormContext } from "@/form/context/context";
import { 
  FormExecutionContext, 
  ExecutionEnvironmentType,
  ExecutionOperation,
  ExecutionResult
} from "@/form/context/execution";

/**
 * ContextService - Unified service for all context operations
 * 
 * This service represents Samadhi - the unified field of consciousness
 * from which both ordinary contexts and execution contexts emerge.
 */
export class ContextService {
  /**
   * Create a basic context
   */
  static createContext(options: {
    name: string;
    type?: string;
    parentId?: string;
    metadata?: Record<string, any>;
    autoActivate?: boolean;
  }): string {
    const context = FormContext.createContext({
      id: `context:${Date.now()}`,
      name: options.name,
      type: options.type || "context",
      parentId: options.parentId,
      metadata: options.metadata,
      autoActivate: options.autoActivate
    });
    
    return context.id;
  }
  
  /**
   * Create an execution-capable context
   */
  static createExecutionContext(options: {
    name: string;
    environmentType?: ExecutionEnvironmentType;
    type?: string;
    parentId?: string;
    metadata?: Record<string, any>;
    autoActivate?: boolean;
  }): string {
    const context = FormExecutionContext.createExecutionContext({
      id: `exec:context:${Date.now()}`,
      name: options.name,
      type: options.type || "execution",
      parentId: options.parentId,
      environmentType: options.environmentType || "qualitative",
      metadata: options.metadata,
      autoActivate: options.autoActivate
    });
    
    return context.id;
  }
  
  /**
   * Core context operations
   */
  
  static activate(contextId: string, options?: {
    activateChildren?: boolean;
    recursive?: boolean;
    silent?: boolean;
  }): boolean {
    const context = FormContext.getContext(contextId);
    if (!context) return false;
    return context.activate(options);
  }
  
  static deactivate(contextId: string, options?: {
    deactivateChildren?: boolean;
    recursive?: boolean;
    silent?: boolean;
    activateParent?: boolean;
  }): boolean {
    const context = FormContext.getContext(contextId);
    if (!context) return false;
    return context.deactivate(options);
  }
  
  static update(contextId: string, updates: {
    name?: string;
    metadata?: Record<string, any>;
    config?: any;
  }): boolean {
    const context = FormContext.getContext(contextId);
    if (!context) return false;
    return context.update(updates);
  }
  
  static delete(contextId: string): boolean {
    const context = FormContext.getContext(contextId);
    if (!context) return false;
    return context.delete();
  }
  
  static registerEntity(contextId: string, entityId: string): boolean {
    const context = FormContext.getContext(contextId);
    if (!context) return false;
    return context.registerEntity(entityId);
  }
  
  static registerRelation(contextId: string, relationId: string): boolean {
    const context = FormContext.getContext(contextId);
    if (!context) return false;
    return context.registerRelation(relationId);
  }
  
  /**
   * Execution operations
   */
  
  /**
   * Execute in qualitative environment (CPU-like operations)
   */
  static qualitative<R>(contextId: string, operation: ExecutionOperation, fn: () => R): ExecutionResult {
    const context = FormContext.getContext(contextId);
    if (!context) {
      return {
        success: false,
        value: null,
        environmentType: "qualitative",
        operation,
        contextId: contextId,
        timestamp: Date.now(),
        error: {
          message: `Context not found: ${contextId}`
        }
      };
    }
    
    // If already a FormExecutionContext, use it
    if (context instanceof FormExecutionContext) {
      return context.withEnvironment("qualitative", () => {
        return context.execute(operation, fn);
      });
    }
    
    // Otherwise, wrap in withContext
    try {
      const result = FormContext.withContext(contextId, fn);
      
      return {
        success: true,
        value: result,
        environmentType: "qualitative",
        operation,
        contextId: contextId,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        value: null,
        environmentType: "qualitative",
        operation,
        contextId: contextId,
        timestamp: Date.now(),
        error: {
          message: error.message || "Error in qualitative execution",
          details: error
        }
      };
    }
  }
  
  
  /**
   * Execute in quantitative environment (GPU-like operations)
   */
  static quantitative<R>(contextId: string, operation: ExecutionOperation, fn: () => R): ExecutionResult {
    const context = FormContext.getContext(contextId);
    if (!context) {
      return {
        success: false,
        value: null,
        environmentType: "quantitative",
        operation,
        contextId: contextId,
        timestamp: Date.now(),
        error: {
          message: `Context not found: ${contextId}`
        }
      };
    }
    
    // If already a FormExecutionContext, use it
    if (context instanceof FormExecutionContext) {
      return context.withEnvironment("quantitative", () => {
        return context.execute(operation, fn);
      });
    }
    
    // Otherwise, wrap in withContext
    try {
      const result = FormContext.withContext(contextId, fn);
      
      return {
        success: true,
        value: result,
        environmentType: "quantitative",
        operation,
        contextId: contextId,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        value: null,
        environmentType: "quantitative",
        operation,
        contextId: contextId,
        timestamp: Date.now(),
        error: {
          message: error.message || "Error in quantitative execution",
          details: error
        }
      };
    }
  }
  
  /**
   * Perform syllogistic reasoning (Qualitative - CPU-like operation)
   */
  static syllogize(
    contextId: string,
    major: { subject: string; predicate: string },
    minor: { subject: string; predicate: string }
  ): ExecutionResult {
    return this.qualitative(contextId, "syllogize", () => {
      // Check syllogism validity
      if (minor.predicate !== major.subject) {
        throw new Error("Invalid syllogism: middle term mismatch");
      }
      
      // Return conclusion
      return {
        subject: minor.subject,
        predicate: major.predicate
      };
    });
  }
  
  /**
   * Perform mathematical calculation (Quantitative - GPU-like operation)
   */
  static calculate(
    contextId: string,
    operation: string,
    values: number[]
  ): ExecutionResult {
    return this.quantitative(contextId, "calculate", () => {
      // Perform calculation
      switch (operation) {
        case "add":
          return values.reduce((a, b) => a + b, 0);
        case "multiply":
          return values.reduce((a, b) => a * b, 1);
        case "average":
          return values.reduce((a, b) => a + b, 0) / values.length;
        default:
          throw new Error(`Unsupported calculation: ${operation}`);
      }
    });
  }
  
  /**
   * Classify an entity (Qualitative - CPU-like operation)
   */
  static classify(
    contextId: string,
    entity: any,
    taxonomy: Record<string, any[]>
  ): ExecutionResult {
    return this.qualitative(contextId, "classify", () => {
      const classifications: string[] = [];
      
      // Check each taxonomy category
      for (const [category, members] of Object.entries(taxonomy)) {
        // Check if entity is a member or has the required properties
        if (Array.isArray(members)) {
          // Direct membership check
          if (members.includes(entity)) {
            classifications.push(category);
            continue;
          }
          
          // Property-based check
          if (typeof entity === 'object' && entity !== null) {
            const matches = members.some(member => {
              if (typeof member !== 'object') return false;
              
              // Check if all properties in member match entity
              return Object.entries(member).every(([key, value]) => 
                entity[key] === value
              );
            });
            
            if (matches) {
              classifications.push(category);
            }
          }
        }
      }
      
      return {
        entity,
        classifications,
        timestamp: Date.now()
      };
    });
  }
  
  /**
   * Measure a property (Quantitative - GPU-like operation)
   */
  static measure(
    contextId: string,
    entity: any,
    property: string,
    unit?: string
  ): ExecutionResult {
    return this.quantitative(contextId, "measure", () => {
      // Get property path
      const path = property.split('.');
      let value = entity;
      
      // Navigate property path
      for (const segment of path) {
        if (value === null || value === undefined) {
          throw new Error(`Cannot navigate path ${property}: null or undefined encountered`);
        }
        
        value = value[segment];
      }
      
      // Return measurement with unit if provided
      return {
        property,
        value,
        unit,
        measured: Date.now()
      };
    });
  }
  
  /**
   * Transform data (Quantitative - GPU-like operation)
   */
  static transform(
    contextId: string,
    data: any,
    transformations: Array<{
      operation: string;
      params?: Record<string, any>;
    }>
  ): ExecutionResult {
    return this.quantitative(contextId, "transform", () => {
      let result = data;
      
      // Apply each transformation in sequence
      for (const transform of transformations) {
        switch (transform.operation) {
          case "map":
            if (Array.isArray(result)) {
              result = result.map(item => {
                return transform.params?.fn ? transform.params.fn(item) : item;
              });
            }
            break;
            
          case "filter":
            if (Array.isArray(result)) {
              result = result.filter(item => {
                return transform.params?.predicate ? transform.params.predicate(item) : true;
              });
            }
            break;
            
          case "sort":
            if (Array.isArray(result)) {
              result = [...result].sort((a, b) => {
                return transform.params?.comparator ? transform.params.comparator(a, b) : 0;
              });
            }
            break;
            
          case "reduce":
            if (Array.isArray(result)) {
              result = result.reduce(
                (acc, item) => transform.params?.reducer ? transform.params.reducer(acc, item) : acc,
                transform.params?.initialValue !== undefined ? transform.params.initialValue : {}
              );
            }
            break;
            
          case "format":
            // Apply formatting to result based on params
            if (transform.params?.template && typeof transform.params.template === 'string') {
              if (typeof result === 'object' && result !== null) {
                result = transform.params.template.replace(/\{([^}]+)\}/g, (_, key) => {
                  return result[key] !== undefined ? result[key] : `{${key}}`;
                });
              }
            }
            break;
            
          default:
            throw new Error(`Unsupported transformation: ${transform.operation}`);
        }
      }
      
      return {
        originalData: data,
        transformedData: result,
        transformations: transformations.map(t => t.operation),
        timestamp: Date.now()
      };
    });
  }
}