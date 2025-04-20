import { Morph, MorphOptions, MorphCondition, MorphStep } from './types';
import { createMorph, composeMorphs } from './morph';

/**
 * Fluent interface for building pipelines
 */
export class FluentPipeline<T, U = T> {
  private steps: Array<MorphStep<any, any>> = [];
  private readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Add a morph to the pipeline
   */
  pipe<V>(morph: Morph<U, V>): FluentPipeline<T, V> {
    this.steps.push({
      type: "morph",
      morph,
    });
    return this as unknown as FluentPipeline<T, V>;
  }

  /**
   * Conditionally apply a morph based on a condition function
   */
  conditionally<V>(
    condition: MorphCondition<U>,
    morph: Morph<U, V>
  ): FluentPipeline<T, V | U> {
    this.steps.push({
      type: "conditional",
      condition,
      morph,
    });
    return this as unknown as FluentPipeline<T, V | U>;
  }

  /**
   * Apply a map function to the pipeline
   */
  map<V>(fn: (input: U, context?: any) => V): FluentPipeline<T, V> {
    this.steps.push({
      type: "map",
      fn,
    });
    return this as unknown as FluentPipeline<T, V>;
  }

  /**
   * Build the pipeline into a Morph
   */
  build(options: Partial<MorphOptions> = {}): Morph<T, U> {
    // Default options if not provided
    const buildOptions: MorphOptions = {
      pure: true,
      fusible: true,
      cost: this.calculateTotalCost(),
      memoizable: false,
      description: options.description || `Pipeline: ${this.name}`,
      tags: options.tags || [],
      ...options
    };

    return createMorph<T, U>(
      this.name,
      (input: T, context?: any): U => {
        // Start with the input
        let result: any = input;

        // Apply each step
        for (const step of this.steps) {
          if (step.type === "morph") {
            result = step.morph.transform(result, context);
          } else if (step.type === "map") {
            result = step.fn(result, context);
          } else if (step.type === "conditional") {
            // Only apply the morph if the condition returns true
            if (step.condition(result, context)) {
              result = step.morph.transform(result, context);
            }
            // If condition is false, result passes through unchanged
          }
        }

        return result as U;
      },
      buildOptions
    );
  }

  /**
   * Calculate the total cost of this pipeline
   */
  private calculateTotalCost(): number {
    return this.steps.reduce((total, step) => {
      if (step.type === "morph") {
        return total + step.morph.options.cost;
      } else if (step.type === "conditional") {
        // Conditional steps cost slightly less since they might not run
        return total + (step.morph.options.cost * 0.8); 
      } else {
        // Map functions are assumed to be low cost
        return total + 1;
      }
    }, 0);
  }

  /**
   * Optimize the pipeline by fusing compatible morphs
   */
  optimize(): FluentPipeline<T, U> {
    if (this.steps.length <= 1) {
      return this; // Nothing to optimize
    }

    const optimizedSteps: Array<MorphStep<any, any>> = [];
    let currentMorphs: Array<Morph<any, any>> = [];
    
    // Process each step
    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      
      if (step.type === "morph" && step.morph.options.fusible) {
        // Add to current fusible group
        currentMorphs.push(step.morph);
      } else {
        // Fuse any pending morphs before adding a non-fusible step
        if (currentMorphs.length > 0) {
          optimizedSteps.push(this.fuseSteps(currentMorphs));
          currentMorphs = [];
        }
        
        // Add the non-fusible step
        optimizedSteps.push(step);
      }
    }
    
    // Handle any remaining fusible morphs
    if (currentMorphs.length > 0) {
      optimizedSteps.push(this.fuseSteps(currentMorphs));
    }
    
    // Create a new pipeline with the optimized steps
    const result = new FluentPipeline<T, U>(this.name + "-optimized");
    result.steps = optimizedSteps;
    return result;
  }
  
  /**
   * Fuse multiple morphs into a single step
   */
  private fuseSteps(morphs: Array<Morph<any, any>>): MorphStep<any, any> {
    if (morphs.length === 0) {
      throw new Error("Cannot fuse empty morphs array");
    }
    
    if (morphs.length === 1) {
      return { type: "morph", morph: morphs[0] };
    }
    
    // Compose all morphs into one
    let fusedMorph = morphs[0];
    for (let i = 1; i < morphs.length; i++) {
      fusedMorph = composeMorphs(fusedMorph, morphs[i]);
    }
    
    return { type: "morph", morph: fusedMorph };
  }
  
  /**
   * Print a debug representation of the pipeline
   */
  debug(): string {
    let result = `Pipeline: ${this.name}\n`;
    
    this.steps.forEach((step, index) => {
      if (step.type === "morph") {
        result += `  ${index}. Morph: ${step.morph.name} (cost: ${step.morph.options.cost})\n`;
      } else if (step.type === "map") {
        result += `  ${index}. Map function (cost: 1)\n`;
      } else if (step.type === "conditional") {
        result += `  ${index}. Conditional: ${step.morph.name} (cost: ${step.morph.options.cost * 0.8})\n`;
      }
    });
    
    result += `Total cost: ${this.calculateTotalCost()}\n`;
    
    return result;
  }
}

/**
 * Create a new pipeline
 */
export function createPipeline<T>(name: string): FluentPipeline<T> {
  return new FluentPipeline<T>(name);
}