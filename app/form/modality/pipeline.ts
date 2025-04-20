import { 
  Morph, 
  IdentityMorph, 
  createMorph, 
  ComposedMorph 
} from "../morph";
import { FormShape } from "../schema/form";
import { FormExecutionContext } from "../schema/context";

/**
 * RootPipeline - The base pipeline abstraction for any transformation sequence
 */
export abstract class RootPipeline<TInput, TOutput> {
  protected pipeline: Morph<TInput, TOutput>;
  protected context: FormExecutionContext;
  
  constructor() {
    // Create an initial identity morph and cast it to the desired output type
    this.pipeline = new IdentityMorph<TInput>() as unknown as Morph<TInput, TOutput>;
    
    // Create a default context with mark structure
    this.context = {
      id: `pipeline-${Date.now()}`,
      timestamp: Date.now(),
      data: {},
      mark: { pipeline: { morphs: [] } }
    };
  }

  add(morph: Morph<any, any>): void {
    // Compose the current pipeline with the new morph
    if (this.pipeline instanceof ComposedMorph) {
      // If we already have a composed morph, add to it
      const currentSteps = (this.pipeline as ComposedMorph<any, any>).getSteps();
      this.pipeline = ComposedMorph.compose<TInput, TOutput>(
        "ExtendedPipeline",
        [...currentSteps, morph]
      );
    } else {
      // Otherwise create a composed morph with the current and new
      this.pipeline = ComposedMorph.compose<TInput, TOutput>(
        "ComposedPipeline",
        [this.pipeline, morph]
      );
    }
  }

  run(input: TInput, externalContext?: FormExecutionContext): TOutput {
    // Use external context if provided, otherwise use our internal one
    const runContext = externalContext || this.context;

    // Update timestamp for fresh execution
    runContext.timestamp = Date.now();

    return this.pipeline.transform(input, runContext);
  }

  /**
   * Get the number of morphs in the pipeline
   */
  length(): number {
    if (this.pipeline instanceof ComposedMorph) {
      return (this.pipeline as ComposedMorph<any, any>).getSteps().length;
    }
    return 1; // Just a single morph
  }

  /**
   * Get the names of morphs in the pipeline
   */
  getMorphNames(): string[] {
    if (this.pipeline instanceof ComposedMorph) {
      return (this.pipeline as ComposedMorph<any, any>)
        .getSteps()
        .map(m => m.name || "unnamed");
    }
    return [this.pipeline.name || "unnamed"];
  }

  /**
   * Get statistics about the pipeline
   */
  stats(): {
    morphCount: number;
    morphNames: string[];
  } {
    return {
      morphCount: this.length(),
      morphNames: this.getMorphNames(),
    };
  }

  /**
   * Execute with timing information
   */
  executeWithTiming(input: TInput): {
    result: TOutput;
    executionTime: number;
  } {
    const start = performance.now();
    const result = this.run(input);
    const end = performance.now();

    return {
      result,
      executionTime: end - start,
    };
  }
}

/**
 * ModalPipeline - Pipeline with modal transformation capabilities
 *
 * Represents a pipeline that can transform between different modes of representation
 * while preserving semantic meaning through configuration-driven transformations.
 */
export abstract class ModalPipeline<TInput, TOutput> extends RootPipeline<
  TInput,
  TOutput
> {
  protected config: Record<string, any>;

  /**
   * Create a modal pipeline with configuration
   */
  constructor(config: Record<string, any> = {}) {
    super();
    this.config = { ...config };

    // Add config to context for morphs that need it
    this.context.data = this.context.data || {};
    this.context.data.config = this.config;
  }

  /**
   * Get the current modal configuration
   */
  getConfig(): Record<string, any> {
    return { ...this.config };
  }

  /**
   * Update modal configuration
   */
  updateConfig(newConfig: Record<string, any>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    // Add config to context for morphs that need it
    this.context.data = this.context.data || {};
    this.context.data.config = this.config;
  }

  /**
   * Run with temporary configuration override
   */
  runWithConfig(
    input: TInput,
    runtimeConfig: Record<string, any> = {}
  ): TOutput {
    // Store original config
    const originalConfig = { ...this.config };

    // Temporarily update config
    this.updateConfig(runtimeConfig);

    // Run with updated config
    const result = this.run(input);

    // Restore original config
    this.updateConfig(originalConfig);

    return result;
  }
}

/**
 * FormModalPipeline - Specialized modal pipeline for shape-based transformations
 *
 * This represents a pipeline that transforms forms into different modal representations
 * using configuration to guide the transformation process.
 */
export abstract class FormModalPipeline<TOutput> extends ModalPipeline<
  FormShape,
  TOutput
> {
  /**
   * Generate output from a shape
   */
  generate(shape: FormShape): TOutput {
    return this.run(shape);
  }

  /**
   * Generate output with custom runtime config
   */
  generateWithConfig(
    shape: FormShape,
    runtimeConfig: Record<string, any> = {}
  ): TOutput {
    return this.runWithConfig(shape, runtimeConfig);
  }
}

/**
 * Helper to create a simple morph for bridging between modes
 */
export function createBridgeMorph<TInput, TOutput>(
  name: string,
  transformer: (input: TInput, config: Record<string, any>) => TOutput
): Morph<TInput, TOutput> {
  return createMorph<TInput, TOutput>(
    name,
    (input, context) => {
      // Safely extract config from context - handle case where data might be undefined
      const config = context?.data?.config || {};
      return transformer(input, config);
    },
    {
      pure: false, // Depends on context
      fusible: false, // Bridge morphs shouldn't be fused
      cost: 1,
    }
  );
}