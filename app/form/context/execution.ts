import { FormContext } from "@/context/context";
import { z } from "zod";

/**
 * ExecutionEnvironmentType - The two primary types of logical operations
 */
export const ExecutionEnvironmentTypeSchema = z.enum([
  "qualitative", // Syllogistic/conceptual logic - CPU-like operations
  "quantitative"  // Mathematical/algorithmic logic - GPU-like operations
]);

export type ExecutionEnvironmentType = z.infer<typeof ExecutionEnvironmentTypeSchema>;

/**
 * ExecutionOperationType - Operations supported in execution environments
 */
export const ExecutionOperationSchema = z.enum([
  // Qualitative operations (CPU-like)
  "identify",    // Categorical judgment - "A is B"
  "classify",    // Classification of concepts
  "syllogize",   // Syllogistic reasoning
  "abstract",    // Abstraction of qualities
  "instantiate", // Instantiation of concepts
  
  // Quantitative operations (GPU-like)
  "calculate",   // Mathematical calculation
  "measure",     // Measurement
  "transform",   // Data transformation
  "analyze",     // Analysis of data
  "optimize"     // Optimization calculation
]);

export type ExecutionOperation = z.infer<typeof ExecutionOperationSchema>;

/**
 * ExecutionResult - Result of operation execution
 */
export const ExecutionResultSchema = z.object({
  success: z.boolean(),
  value: z.any(),
  environmentType: ExecutionEnvironmentTypeSchema,
  operation: ExecutionOperationSchema,
  contextId: z.string(),
  timestamp: z.number().default(() => Date.now()),
  metadata: z.record(z.any()).optional(),
  error: z.object({
    message: z.string(),
    details: z.any().optional()
  }).optional()
});

export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;

/**
 * FormExecutionContext extends FormContext to support dual execution environments
 * 
 * This represents a form context that can operate in both qualitative (CPU-like)
 * and quantitative (GPU-like) modes of logical processing.
 */
export class FormExecutionContext extends FormContext {
  // Current environment type
  private environmentType: ExecutionEnvironmentType = "qualitative";
  
  // Active operations
  private activeOperations: Map<string, ExecutionOperation> = new Map();
  
  constructor(options: {
    id?: string;
    type?: string;
    name?: string;
    parentId?: string;
    metadata?: Record<string, any>;
    config?: any;
    autoActivate?: boolean;
    environmentType?: ExecutionEnvironmentType;
  }) {
    super(options);
    
    // Set initial environment type
    this.environmentType = options.environmentType || "qualitative";
    
    // Add environment type to metadata
    this.metadata = {
      ...this.metadata,
      environmentType: this.environmentType,
      executionCapable: true
    };
  }
  
  /**
   * Create an execution-capable context
   */
  static createExecutionContext(options: {
    id?: string;
    type?: string;
    name?: string;
    parentId?: string;
    metadata?: Record<string, any>;
    config?: any;
    autoActivate?: boolean;
    environmentType?: ExecutionEnvironmentType;
  }): FormExecutionContext {
    return new FormExecutionContext(options);
  }
  
  /**
   * Get current environment type
   */
  getEnvironmentType(): ExecutionEnvironmentType {
    return this.environmentType;
  }
  
  /**
   * Set environment type
   */
  setEnvironmentType(type: ExecutionEnvironmentType): void {
    this.environmentType = type;
    
    // Update metadata
    this.metadata = {
      ...this.metadata,
      environmentType: type,
      environmentChanged: Date.now()
    };
  }
  
  /**
   * Switch to qualitative environment (CPU-like operations)
   */
  enterQualitativeMode(): boolean {
    this.setEnvironmentType("qualitative");
    return true;
  }
  
  /**
   * Switch to quantitative environment (GPU-like operations)
   */
  enterQuantitativeMode(): boolean {
    this.setEnvironmentType("quantitative");
    return true;
  }
  
  /**
   * Start an operation
   */
  beginOperation(operation: ExecutionOperation): string {
    const operationId = `op:${this.id}:${operation}:${Date.now()}`;
    this.activeOperations.set(operationId, operation);
    
    // Update metadata
    this.metadata = {
      ...this.metadata,
      activeOperation: operationId,
      operationStarted: Date.now()
    };
    
    return operationId;
  }
  
  /**
   * Complete an operation
   */
  completeOperation(operationId: string, result: any): ExecutionResult {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      return {
        success: false,
        value: null,
        environmentType: this.environmentType,
        operation: "identify", // Default fallback
        contextId: this.id,
        timestamp: Date.now(),
        error: {
          message: `Operation not found: ${operationId}`
        }
      };
    }
    
    // Remove from active operations
    this.activeOperations.delete(operationId);
    
    // Clear from metadata
    if (this.metadata && this.metadata.activeOperation === operationId) {
      this.metadata.activeOperation = undefined;
      this.metadata.operationCompleted = Date.now();
    }
    
    // Return success result
    return {
      success: true,
      value: result,
      environmentType: this.environmentType,
      operation,
      contextId: this.id,
      timestamp: Date.now(),
      metadata: {
        operationId,
        completed: Date.now()
      }
    };
  }
  
  /**
   * Execute a function in a specific environment
   */
  withEnvironment<R>(environmentType: ExecutionEnvironmentType, fn: () => R): R {
    // Store previous environment
    const previousEnvironment = this.environmentType;
    
    // Switch environment
    this.setEnvironmentType(environmentType);
    
    try {
      // Execute function
      return fn();
    } finally {
      // Restore previous environment
      this.setEnvironmentType(previousEnvironment);
    }
  }
  
  /**
   * Execute an operation
   */
  execute<R>(operation: ExecutionOperation, fn: () => R): ExecutionResult {
    // Start operation
    const operationId = this.beginOperation(operation);
    
    try {
      // Execute function
      const result = fn();
      
      // Complete operation
      return this.completeOperation(operationId, result);
    } catch (error) {
      // Handle error
      this.activeOperations.delete(operationId);
      
      return {
        success: false,
        value: null,
        environmentType: this.environmentType,
        operation,
        contextId: this.id,
        timestamp: Date.now(),
        error: {
          message: error.message || "Error executing operation",
          details: error
        }
      };
    }
  }
  
  /**
   * Static helper to execute in a specific environment
   */
  static withExecutionContext<R>(contextId: string, environmentType: ExecutionEnvironmentType, fn: () => R): R {
    const context = FormContext.getContext(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }
    
    // If already a FormExecutionContext, use it
    if (context instanceof FormExecutionContext) {
      return context.withEnvironment(environmentType, fn);
    }
    
    // Otherwise, create a temporary FormExecutionContext
    const execContext = FormExecutionContext.createExecutionContext({
      id: `exec:${contextId}:${Date.now()}`,
      name: `Execution context for ${contextId}`,
      parentId: contextId,
      environmentType
    });
    
    return execContext.run(fn);
  }
}

/**
 * Create a FormExecutionContext instance
 */
export function createExecutionContext(options: {
  id?: string;
  type?: string;
  name?: string;
  parentId?: string;
  metadata?: Record<string, any>;
  config?: any;
  autoActivate?: boolean;
  environmentType?: ExecutionEnvironmentType;
}): FormExecutionContext {
  return FormExecutionContext.createExecutionContext(options);
}

/**
 * Execute in a specific environment type
 */
export function withExecutionContext<R>(
  contextId: string, 
  environmentType: ExecutionEnvironmentType, 
  fn: () => R
): R {
  return FormExecutionContext.withExecutionContext(contextId, environmentType, fn);
}