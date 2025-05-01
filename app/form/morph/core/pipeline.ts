import { FormShape } from "../../schema/shape";
import { Morph } from "./types";
import { createMorph } from "./morph";

/**
 * Pipeline - Executes a series of morphs
 */
export class Pipeline<TInput, TOutput = TInput> {
  private name: string;
  private morphs: Array<Morph<any, any>> = [];
  private metadata: Record<string, any>;
  private stages: Array<{ name: string; description: string; morphs: string[] }> = [];
  private currentStage: string | null = null;
  
  /**
   * Create a pipeline with a name and metadata
   */
  constructor(name: string, metadata: Record<string, any> = {}) {
    this.name = name;
    this.metadata = { ...metadata };
  }
  
  /**
   * Add a morph to the pipeline
   */
  pipe<TNext>(morph: Morph<any, TNext>): Pipeline<TInput, TNext> {
    // Add morph to list
    this.morphs.push(morph);
    
    // Track in current stage if we're in one
    if (this.currentStage) {
      const stageIndex = this.stages.findIndex(s => s.name === this.currentStage!);
      if (stageIndex >= 0) {
        this.stages[stageIndex].morphs.push(morph.name || "unnamed");
      }
    }
    
    // Return with updated output type
    return this as unknown as Pipeline<TInput, TNext>;
  }
  
  /**
   * Add a conditional morph
   */
  conditionally(
    predicate: (input: any, context: any) => boolean,
    morph: Morph<any, any>
  ): this {
    const conditionalMorph = createMorph(
      `Conditional(${morph.name || "unnamed"})`,
      (input, context) => {
        if (predicate(input, context)) {
          return morph.transform(input, context);
        }
        return input;
      }
    );
    
    this.morphs.push(conditionalMorph);
    
    // Track in current stage
    if (this.currentStage) {
      const stageIndex = this.stages.findIndex(s => s.name === this.currentStage!);
      if (stageIndex >= 0) {
        this.stages[stageIndex].morphs.push(conditionalMorph.name);
      }
    }
    
    return this;
  }
  
  /**
   * Start a named stage
   */
  stage(name: string, description: string = ""): this {
    // End previous stage if exists
    if (this.currentStage) {
      this.currentStage = null;
    }
    
    // Create new stage
    this.stages.push({
      name,
      description,
      morphs: []
    });
    
    this.currentStage = name;
    
    return this;
  }
  
  /**
   * End the current stage
   */
  endStage(): this {
    this.currentStage = null;
    return this;
  }
  
  /**
   * Build the pipeline with additional metadata
   */
  build(additionalMetadata: Record<string, any> = {}): this {
    // End any open stage
    if (this.currentStage) {
      this.endStage();
    }
    
    // Update metadata
    this.metadata = {
      ...this.metadata,
      ...additionalMetadata,
      stages: this.stages,
    };
    
    return this;
  }
  
  /**
   * Execute the pipeline with context
   */
  run(input: TInput, context: any = {}): TOutput {
    // Empty pipeline returns input as is
    if (this.morphs.length === 0) {
      return input as unknown as TOutput;
    }
    
    // Add pipeline info to context
    const enhancedContext = {
      ...context,
      pipeline: {
        name: this.name,
        stages: this.stages.map(s => s.name)
      }
    };
    
    // Execute each morph in sequence
    let result: any = input;
    for (const morph of this.morphs) {
      result = morph.transform(result, enhancedContext);
    }
    
    return result as TOutput;
  }
  
  /**
   * Get pipeline metadata
   */
  getMetadata(): { 
    name: string; 
    morphCount: number; 
    morphs: string[]; 
  } {
    return {
      name: this.name,
      morphCount: this.morphs.length,
      morphs: this.morphs.map(m => m.name || "unnamed")
    };
  }
}

/**
 * Create a pipeline with a name and optional metadata
 */
export function createPipeline<TInput, TOutput = TInput>(
  name: string,
  metadata: Record<string, any> = {}
): Pipeline<TInput, TOutput> {
  return new Pipeline<TInput, TOutput>(name, metadata);
}

/**
 * FormPipeline - Specialized for form operations
 */
export class FormPipeline<TOutput> extends Pipeline<FormShape, TOutput> {
  // Form-specific methods can go here
}

/**
 * Create a form pipeline
 */
export function createFormPipeline<TOutput>(
  name: string,
  metadata: Record<string, any> = {}
): FormPipeline<TOutput> {
  return new FormPipeline<TOutput>(name, metadata);
}