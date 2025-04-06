import { SimpleMorph, MorphOptimizationMetadata } from "./morph";
import { MorpheusContext } from "../schema/context";
import { morpheus } from "../modality/morpheus";

/**
 * FluentPipeline - A builder pattern for creating morphism pipelines
 *
 * This provides a more fluent API for creating complex transformation pipelines.
 */
export class FluentPipeline<I, O> {
  private steps: SimpleMorph<any, any>[] = [];
  private pipelineName: string;

  /**
   * Create a new pipeline with an optional starting morphism
   */
  constructor(name: string, initialMorph?: SimpleMorph<I, any>) {
    this.pipelineName = name;
    if (initialMorph) {
      this.steps.push(initialMorph);
    }
  }

  /**
   * Add a morphism to the pipeline
   */
  pipe<T>(morph: SimpleMorph<O, T>): FluentPipeline<I, T> {
    this.steps.push(morph);
    return this as unknown as FluentPipeline<I, T>;
  }

  /**
   * Add a named morphism from the registry to the pipeline
   */
  pipeTo<T>(morphName: string): FluentPipeline<I, T> {
    const morph = morpheus.get<O, T>(morphName);
    if (!morph) {
      throw new Error(`Morphism "${morphName}" not found`);
    }

    this.steps.push(morph);
    return this as unknown as FluentPipeline<I, T>;
  }

  /**
   * Add a filter step that transforms only when a condition is met
   */
  filter(
    condition: (input: O, context: MorpheusContext) => boolean
  ): FluentPipeline<I, O> {
    const filterMorph = new SimpleMorph<O, O>(
      `Filter_${this.steps.length}`,
      (input, context) => (condition(input, context) ? input : input),
      {
        pure: false,
        fusible: false,
        cost: 0.1,
        memoizable: false,
      }
    );

    this.steps.push(filterMorph);
    return this;
  }

  /**
   * Add a transformation function directly
   */
  map<T>(
    transform: (input: O, context: MorpheusContext) => T,
    options: {
      name?: string;
      pure?: boolean;
      fusible?: boolean;
      cost?: number;
      memoizable?: boolean;
    } = {}
  ): FluentPipeline<I, T> {
    const mapMorph = new SimpleMorph<O, T>(
      options.name || `Map_${this.steps.length}`,
      transform,
      {
        pure: options.pure !== false,
        fusible: options.fusible !== false,
        cost: options.cost || 1,
        memoizable: options.memoizable !== false,
      }
    );

    this.steps.push(mapMorph);
    return this as unknown as FluentPipeline<I, T>;
  }

  /**
   * Conditionally branch the pipeline
   */
  branch<T>(
    condition: (input: O, context: MorpheusContext) => boolean,
    trueMorph: SimpleMorph<O, T>,
    falseMorph: SimpleMorph<O, T>
  ): FluentPipeline<I, T> {
    // Get cost of both morphs with safe defaults
    const trueCost = trueMorph?.optimizationMetadata?.cost ?? 1;
    const falseCost = falseMorph?.optimizationMetadata?.cost ?? 1;

    const branchMorph = new SimpleMorph<O, T>(
      `Branch_${this.steps.length}`,
      (input, context) => {
        if (condition(input, context)) {
          return trueMorph.apply(input, context);
        } else {
          return falseMorph.apply(input, context);
        }
      },
      {
        pure: false,
        fusible: false,
        cost: 1 + Math.max(trueCost, falseCost),
        memoizable: false,
      }
    );

    this.steps.push(branchMorph);
    return this as unknown as FluentPipeline<I, T>;
  }

  /**
   * Calculate optimization metadata based on all steps
   */
  private calculateOptimizationMetadata(): MorphOptimizationMetadata {
    // Handle empty pipeline
    if (this.steps.length === 0) {
      return {
        pure: true,
        fusible: true,
        cost: 0,
        memoizable: true,
      };
    }

    // Handle single-step pipeline
    if (this.steps.length === 1) {
      return {
        pure: this.steps[0].optimizationMetadata?.pure ?? true,
        fusible: this.steps[0].optimizationMetadata?.fusible ?? true,
        cost: this.steps[0].optimizationMetadata?.cost ?? 1,
        memoizable: this.steps[0].optimizationMetadata?.memoizable ?? true,
      };
    }

    // Multi-step pipeline
    return {
      // Pure only if all steps are pure
      pure: this.steps.every((m) => m.optimizationMetadata?.pure !== false),

      // Fusible only if all steps are fusible
      fusible: this.steps.every(
        (m) => m.optimizationMetadata?.fusible !== false
      ),

      // Total cost is sum of all steps
      cost: this.steps.reduce(
        (sum, m) => sum + (m.optimizationMetadata?.cost ?? 1),
        0
      ),

      // Memoizable only if all steps are memoizable
      memoizable: this.steps.every(
        (m) => m.optimizationMetadata?.memoizable !== false
      ),
    };
  }

  /**
   * Register and build the pipeline
   */
  build(
    metadata: {
      description?: string;
      category?: string;
      tags?: string[];
      inputType?: string;
      outputType?: string;
    } = {}
  ): SimpleMorph<I, O> {
    // If there are no steps, use identity morphism
    if (this.steps.length === 0) {
      return new SimpleMorph<I, O>(
        this.pipelineName,
        (input) => input as unknown as O,
        {
          pure: true,
          fusible: true,
          cost: 0,
          memoizable: true,
        }
      );
    }

    // If just one step, wrap it
    if (this.steps.length === 1) {
      const step = this.steps[0];
      return new SimpleMorph<I, O>(
        this.pipelineName,
        (input, context) => step.apply(input, context) as O,
        {
          pure: step.optimizationMetadata?.pure ?? true,
          fusible: step.optimizationMetadata?.fusible ?? true,
          cost: step.optimizationMetadata?.cost ?? 1,
          memoizable: step.optimizationMetadata?.memoizable ?? true,
        }
      );
    }

    // Create a composed pipeline
    const pipeline = new SimpleMorph<I, O>(
      this.pipelineName,
      (input, context) => {
        let result: any = input;
        for (const step of this.steps) {
          result = step.apply(result, context);
        }
        return result as O;
      },
      this.calculateOptimizationMetadata()
    );

    // Register with morpheus system
    morpheus.define(pipeline, {
      description: metadata.description,
      category: metadata.category || "pipeline",
      tags: metadata.tags || [],
      inputType: metadata.inputType || "unknown",
      outputType: metadata.outputType || "unknown",
      composition: {
        type: "pipeline",
        morphs: this.steps.map((step) => step.name),
      },
    });

    return pipeline;
  }

  /**
   * Apply the pipeline without registering it
   */
  apply(input: I, context: MorpheusContext): O {
    let result: any = input;
    for (const step of this.steps) {
      result = step.apply(result, context);
    }
    return result as O;
  }

  /**
   * Create a fluent pipeline starting with a named morph from the registry
   */
  static fromName<I, O>(
    pipelineName: string,
    morphName: string
  ): FluentPipeline<I, O> {
    const morph = morpheus.get<I, O>(morphName);
    if (!morph) {
      throw new Error(`Morphism "${morphName}" not found`);
    }

    return new FluentPipeline<I, O>(pipelineName, morph);
  }
}
/**
 * Create a new pipeline
 */
export function createPipeline<I = any>(name: string): FluentPipeline<I, I> {
  return new FluentPipeline<I, I>(name);
}

/**
 * Start a pipeline with an initial morph
 */
export function startWith<I, O>(
  name: string,
  morph: SimpleMorph<I, O>
): FluentPipeline<I, O> {
  return FluentPipeline.fromName(name, morph.name);
}

/**
 * Start a pipeline with a named morph from the registry
 */
export function startWithName<I, O>(
  pipelineName: string,
  morphName: string
): FluentPipeline<I, O> {
  return FluentPipeline.fromName(pipelineName, morphName);
}
