//@/form/morph/morph.ts
import { MorpheusContext } from "../schema/context";
import { FormShape } from "../schema/form";

/**
 * FormMorph - Shape-centered transformation
 * Transforms one form shape into another
 */
export interface FormMorph<TInput = FormShape, TOutput = FormShape> {
  /**
   * Apply the morphism to transform input shape to output shape
   */
  apply(input: TInput, context: MorpheusContext): TOutput;

  /**
   * Name of the morphism (for debugging)
   */
  readonly name?: string;

  /**
   * Compose this morphism with another
   */
  then<TNext>(next: FormMorph<TOutput, TNext>): FormMorph<TInput, TNext>;

  /**
   * Optimization metadata - helps the optimizer understand this morph
   */
  readonly optimizationMetadata?: MorphOptimizationMetadata;
}

/**
 * Optimization metadata for morphs
 */
export interface MorphOptimizationMetadata {
  /** Whether the morph is pure (has no side effects) */
  pure?: boolean;
  /** Whether the morph can be fused with adjacent morphs */
  fusible?: boolean;
  /** Computational cost estimate (higher = more expensive) */
  cost?: number;
  // Whether the morph can cache results for the same input
  memoizable?: boolean;
}

/**
 * BaseMorph - Base implementation of FormMorph
 */
export abstract class BaseMorph<TInput = FormShape, TOutput = FormShape>
  implements FormMorph<TInput, TOutput>
{
  constructor(
    public readonly name: string = "Morph",
    public readonly optimizationMetadata: MorphOptimizationMetadata = {
      pure: true,
      fusible: true,
      cost: 1,
    }
  ) {}

  abstract apply(input: TInput, context: MorpheusContext): TOutput;

  /**
   * Compose this morphism with another
   */
  then<TNext>(next: FormMorph<TOutput, TNext>): FormMorph<TInput, TNext> {
    const self = this;
    return new CompositeMorph(
      self,
      next,
      `${self.name} → ${next.name || "unnamed"}`
    );
  }
}

/**
 * Simple morph - a concrete implementation for simple transformations
 */
export class SimpleMorph<
  TInput = FormShape,
  TOutput = FormShape
> extends BaseMorph<TInput, TOutput> {
  constructor(
    name: string,
    private readonly transformer: (
      input: TInput,
      context: MorpheusContext
    ) => TOutput,
    optimizationMetadata: MorphOptimizationMetadata = {
      pure: true,
      fusible: true,
      cost: 1,
    }
  ) {
    super(name, optimizationMetadata);
  }

  apply(input: TInput, context: MorpheusContext): TOutput {
    return this.transformer(input, context);
  }
}

/**
 * CompositeMorph - Composition of two morphisms
 */
export class CompositeMorph<TInput, TIntermediate, TOutput>
  implements FormMorph<TInput, TOutput>
{
  public readonly optimizationMetadata: MorphOptimizationMetadata;

  constructor(
    private readonly first: FormMorph<TInput, TIntermediate>,
    private readonly second: FormMorph<TIntermediate, TOutput>,
    public readonly name: string = "CompositeMorph"
  ) {
    // Compute optimization metadata by combining the metadata of the components
    this.optimizationMetadata = {
      // A composite is pure only if both components are pure
      pure:
        first.optimizationMetadata?.pure !== false &&
        second.optimizationMetadata?.pure !== false,

      // A composite is fusible only if both components are fusible
      fusible:
        first.optimizationMetadata?.fusible !== false &&
        second.optimizationMetadata?.fusible !== false,

      // Total cost is the sum of component costs
      cost:
        (first.optimizationMetadata?.cost || 1) +
        (second.optimizationMetadata?.cost || 1),
    };
  }

  apply(input: TInput, context: MorpheusContext): TOutput {
    const intermediate = this.first.apply(input, context);
    return this.second.apply(intermediate, context);
  }

  then<TNext>(next: FormMorph<TOutput, TNext>): FormMorph<TInput, TNext> {
    return new CompositeMorph(
      this,
      next,
      `${this.name} → ${next.name || "unnamed"}`
    );
  }

  /**
   * Access the first morph in the composition
   */
  getFirst(): FormMorph<TInput, TIntermediate> {
    return this.first;
  }

  /**
   * Access the second morph in the composition
   */
  getSecond(): FormMorph<TIntermediate, TOutput> {
    return this.second;
  }
}

/**
 * ComposedMorph - Advanced composition of multiple morphisms with post-processing
 */
export class ComposedMorph<TInput, TOutput>
  implements FormMorph<TInput, TOutput>
{
  public readonly optimizationMetadata: MorphOptimizationMetadata;
  private readonly pipeline: FormMorph<TInput, any>;

  constructor(
    public readonly name: string,
    private readonly steps: FormMorph<any, any>[],
    private readonly postProcess?:
      | ((result: TOutput, context: MorpheusContext) => TOutput)
      | null,
    metadata?: MorphOptimizationMetadata
  ) {
    // Build the pipeline by composing all steps
    let pipeline: FormMorph<TInput, any> = new IdentityMorph<TInput>();

    for (const step of steps) {
      pipeline = new CompositeMorph(
        pipeline as any,
        step as any,
        `${pipeline.name} → ${step.name || "unnamed"}`
      );
    }

    this.pipeline = pipeline;

    // Calculate pure flag - all steps must be pure
    const allStepsPure = steps.every(
      (step) => step.optimizationMetadata?.pure !== false
    );

    // Determine if post-processing is pure
    const postProcessingPure =
      postProcess === null || // null post-processing is considered pure
      postProcess === undefined || // undefined post-processing is considered pure
      metadata?.pure === true; // explicit pure flag overrides

    // Calculate combined optimization metadata
    this.optimizationMetadata = {
      // Pure only if all steps are pure and post-processing is pure
      pure: allStepsPure && postProcessingPure,

      // Fusible only if explicitly marked as such in provided metadata
      fusible: metadata?.fusible === true,

      // Cost is sum of all steps plus 1 for post-processing if present
      cost: steps.reduce(
        (sum, step) => sum + (step.optimizationMetadata?.cost || 1),
        postProcess !== null && postProcess !== undefined ? 1 : 0
      ),

      // Copy any additional properties from provided metadata
      ...(metadata
        ? {
            ...Object.entries(metadata)
              .filter(([key]) => !["pure", "fusible", "cost"].includes(key))
              .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}),
          }
        : {}),
    };
  }

  apply(input: TInput, context: MorpheusContext): TOutput {
    // Apply the pipeline first
    let result = this.pipeline.apply(input, context) as TOutput;

    // Then apply post-processing if provided
    if (this.postProcess) {
      result = this.postProcess(result, context);
    }

    return result;
  }

  then<TNext>(next: FormMorph<TOutput, TNext>): FormMorph<TInput, TNext> {
    // Combine the steps with the next morph
    return new ComposedMorph<TInput, TNext>(
      `${this.name} → ${next.name || "unnamed"}`,
      [...this.steps, next as any],
      null,
      {
        // Pure only if this composed morph and the next morph are pure
        pure:
          this.optimizationMetadata?.pure !== false &&
          next.optimizationMetadata?.pure !== false,

        // New composition is never fusible
        fusible: false,

        // Combined cost
        cost:
          (this.optimizationMetadata?.cost || 0) +
          (next.optimizationMetadata?.cost || 1),
      }
    );
  }

  /**
   * Get all steps in this composed morph
   */
  getSteps(): FormMorph<any, any>[] {
    return [...this.steps];
  }

  /**
   * Get the post-processing function if any
   */
  getPostProcess():
    | ((result: TOutput, context: MorpheusContext) => TOutput)
    | null
    | undefined {
    return this.postProcess;
  }
}

/**
 * IdentityMorph - The identity morphism for forms
 */
export class IdentityMorph<T> extends BaseMorph<T, T> {
  constructor() {
    super("IdentityMorph", { pure: true, fusible: true, cost: 0 });
  }

  apply(input: T): T {
    return input;
  }
}

/**
 * MorphPipeline - A pipeline of form morphisms
 */
export class MorphPipeline<TInput = FormShape, TOutput = FormShape> {
  constructor(
    private readonly morphism: FormMorph<TInput, TOutput>,
    public readonly name: string = "Pipeline"
  ) {}

  /**
   * Apply the pipeline to transform the input
   */
  apply(input: TInput, context: MorpheusContext): TOutput {
    return this.morphism.apply(input, context);
  }

  /**
   * Add another morphism to the pipeline
   */
  then<TNext>(morph: FormMorph<TOutput, TNext>): MorphPipeline<TInput, TNext> {
    return new MorphPipeline(
      this.morphism.then(morph),
      `${this.name} → ${morph.name || "unnamed"}`
    );
  }

  /**
   * Create an empty pipeline with identity morphism
   */
  static identity<T>(): MorphPipeline<T, T> {
    return new MorphPipeline(new IdentityMorph<T>(), "IdentityPipeline");
  }

  /**
   * Get the underlying morphism
   */
  getMorphism(): FormMorph<TInput, TOutput> {
    return this.morphism;
  }

  /**
   * Get all morphs in this pipeline
   * @returns Array of all morphs in the pipeline
   */
  getMorphs(): FormMorph<any, any>[] {
    return extractSteps(this);
  }
}

/**
 * LazyMorphPipeline - A pipeline that delays execution until needed
 */
export class LazyMorphPipeline<TIn, TOut> implements FormMorph<TIn, TOut> {
  public readonly optimizationMetadata: MorphOptimizationMetadata;

  constructor(
    private readonly steps: FormMorph<any, any>[],
    public readonly name?: string
  ) {
    // Compute combined optimization metadata
    this.optimizationMetadata = {
      // A lazy pipeline is pure if all steps are pure
      pure: steps.every((step) => step.optimizationMetadata?.pure !== false),

      // A lazy pipeline is fusible if all steps are fusible
      fusible: steps.every(
        (step) => step.optimizationMetadata?.fusible !== false
      ),

      // Total cost is the sum of all step costs
      cost: steps.reduce(
        (sum, step) => sum + (step.optimizationMetadata?.cost || 1),
        0
      ),
    };
  }

  apply(input: TIn, context: MorpheusContext): TOut {
    // Only execute when apply is called
    let current: any = input;

    for (const step of this.steps) {
      current = step.apply(current, context);
    }

    return current as TOut;
  }

  then<TNext>(next: FormMorph<TOut, TNext>): LazyMorphPipeline<TIn, TNext> {
    // Just add to steps array, don't execute
    return new LazyMorphPipeline(
      [...this.steps, next],
      `${this.name || "Pipeline"} → ${next.name || "Unnamed"}`
    );
  }

  static identity<T>(): LazyMorphPipeline<T, T> {
    return new LazyMorphPipeline<T, T>([], "Identity");
  }

  /**
   * Get all steps in the pipeline
   */
  getSteps(): FormMorph<any, any>[] {
    return [...this.steps];
  }
}

/**
 * Optimize a pipeline by fusing compatible operations
 */
export function optimizePipeline<TIn, TOut>(
  pipeline: MorphPipeline<TIn, TOut>
): MorphPipeline<TIn, TOut> {
  // Extract the steps from the pipeline
  const steps = extractSteps(pipeline);

  // If we couldn't extract steps, return the original pipeline
  if (!steps || steps.length === 0) {
    return pipeline;
  }

  // Fuse compatible steps
  const optimizedSteps: FormMorph<any, any>[] = [];

  for (let i = 0; i < steps.length; i++) {
    const current = steps[i];

    // Skip identity morphs (except at the beginning if there's nothing else)
    if (
      current instanceof IdentityMorph &&
      (optimizedSteps.length > 0 || i < steps.length - 1)
    ) {
      continue;
    }

    // If this is a fusible morph and the next one is too, try to fuse them
    if (i < steps.length - 1 && isFusible(current) && isFusible(steps[i + 1])) {
      const next = steps[i + 1];

      // Create a fused morph using SimpleMorph instead of BaseMorph
      const fused = new SimpleMorph(
        `${current.name || "Unnamed"} ⊕ ${next.name || "Unnamed"}`,
        (input, context) => next.apply(current.apply(input, context), context),
        {
          // Combine optimization metadata
          pure:
            current.optimizationMetadata?.pure !== false &&
            next.optimizationMetadata?.pure !== false,
          fusible: true,
          cost:
            (current.optimizationMetadata?.cost || 1) +
            (next.optimizationMetadata?.cost || 1),
        }
      );

      optimizedSteps.push(fused);
      i++; // Skip the next step since we fused it
    } else {
      optimizedSteps.push(current);
    }
  }

  // Recreate the pipeline with optimized steps
  let optimizedPipeline = MorphPipeline.identity<TIn>();
  for (const step of optimizedSteps) {
    optimizedPipeline = optimizedPipeline.then(step as any);
  }
  return pipeline;
}

/**
 * Helper to detect if a morph is fusible
 */
function isFusible(morph: FormMorph<any, any>): boolean {
  // Check if the morph explicitly states it's fusible
  if (morph.optimizationMetadata?.fusible === true) {
    return true;
  }

  // Simple morphs are fusible by default
  if (morph instanceof SimpleMorph) {
    return morph.optimizationMetadata?.fusible !== false;
  }

  // Identity morphs are always fusible
  if (morph instanceof IdentityMorph) {
    return true;
  }

  // By default, assume not fusible to be safe
  return false;
}

/**
 * Helper to extract steps from a pipeline
 */
function extractSteps(
  pipeline: MorphPipeline<any, any>
): FormMorph<any, any>[] {
  const morphism = pipeline.getMorphism();

  // Handle LazyMorphPipeline
  if (morphism instanceof LazyMorphPipeline) {
    return morphism.getSteps();
  }

  // For composite morphs, we extract recursively
  if (morphism instanceof CompositeMorph) {
    const first = morphism.getFirst();
    const second = morphism.getSecond();

    // If first is a composite, extract its steps
    const firstSteps =
      first instanceof CompositeMorph
        ? extractSteps(new MorphPipeline(first))
        : [first];

    // If second is a composite, extract its steps
    const secondSteps =
      second instanceof CompositeMorph
        ? extractSteps(new MorphPipeline(second))
        : [second];

    // Combine all steps
    return [...firstSteps, ...secondSteps];
  }

  // For non-composite morphs, just return the morphism as a single step
  return [morphism];
}

/**
 * Create a simple morph from a transformation function
 */
export function createMorph<TIn, TOut>(
  name: string,
  transform: (input: TIn, context: MorpheusContext) => TOut,
  metadata: MorphOptimizationMetadata = { pure: true, fusible: true, cost: 1 }
): SimpleMorph<TIn, TOut> {
  return new SimpleMorph(name, transform, metadata);
}

/**
 * Create an optimized pipeline directly
 */
export function createOptimizedPipeline<TIn, TOut>(
  steps: Array<FormMorph<any, any>>,
  name: string = "OptimizedPipeline"
): MorphPipeline<TIn, TOut> {
  // Create a pipeline from steps
  let pipeline = MorphPipeline.identity<TIn>();
  for (const step of steps) {
    pipeline = pipeline.then(step as any);
  }

  // Apply optimization
  return optimizePipeline(pipeline) as unknown as MorphPipeline<TIn, TOut>;
}
