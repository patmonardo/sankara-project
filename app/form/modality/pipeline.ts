import { MorphPipeline, FormMorph, SimpleMorph, IdentityMorph } from "../morph/morph";
import { FormShape } from "../schema/form";
import { FormExecutionContext } from "../schema/context";

/**
 * RootPipeline - The base pipeline abstraction for any transformation sequence
 */
export abstract class RootPipeline<TInput, TOutput> {
  protected pipeline: MorphPipeline<TInput, TOutput>;
  protected context: FormExecutionContext;
  constructor() {
    // Create an initial pipeline and explicitly cast it
    const initialPipeline = new MorphPipeline<TInput, TInput>(
      new IdentityMorph<TInput>(),
      "IdentityPipeline"
    );
    
    // Cast to the desired type
    this.pipeline = initialPipeline as unknown as MorphPipeline<TInput, TOutput>;
    
    // Create a default context with mark structure
    this.context = {
      id: `pipeline-${Date.now()}`,
      timestamp: Date.now(),
      data: {},
      mark: { pipeline: { morphs: [] } }
    };
  }

  add(morph: FormMorph<any, any>): void {
    this.pipeline = this.pipeline.then(morph);
  }

  run(input: TInput, externalContext?: FormExecutionContext): TOutput {
    // Use external context if provided, otherwise use our internal one
    const runContext = externalContext || this.context;

    // Update timestamp for fresh execution
    runContext.timestamp = Date.now();

    return this.pipeline.apply(input, runContext);
  }

  /**
   * Get the number of morphs in the pipeline
   */
  length(): number {
    return this.pipeline.getMorphs().length;
  }

  /**
   * Get the names of morphs in the pipeline
   */
  getMorphNames(): string[] {
    return this.pipeline.getMorphs().map((m) => m.name || "unnamed");
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
 * FormModalPipeline - Specialized modal pipeline for form-based transformations
 *
 * This represents a pipeline that transforms forms into different modal representations
 * using configuration to guide the transformation process.
 */
export abstract class FormModalPipeline<TOutput> extends ModalPipeline<
  FormShape,
  TOutput
> {
  /**
   * Generate output from a form
   */
  generate(form: FormShape): TOutput {
    return this.run(form);
  }

  /**
   * Generate output with custom runtime config
   */
  generateWithConfig(
    form: FormShape,
    runtimeConfig: Record<string, any> = {}
  ): TOutput {
    return this.runWithConfig(form, runtimeConfig);
  }
}

/**
 * Helper to create a simple morph for bridging between modes
 */
export function createBridgeMorph<TInput, TOutput>(
  name: string,
  transformer: (input: TInput, config: Record<string, any>) => TOutput
): SimpleMorph<TInput, TOutput> {
  return new SimpleMorph<TInput, TOutput>(
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
