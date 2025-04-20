import { Morph, MorphOptions, MorphTransformer, PostProcessor } from './types';

/**
 * Default morph options
 */
const DEFAULT_MORPH_OPTIONS: MorphOptions = {
  pure: true,
  fusible: false,
  cost: 1,
  memoizable: false
};

/**
 * Create a new morph
 */
export function createMorph<T, U>(
  name: string,
  transformer: MorphTransformer<T, U>,
  options: Partial<MorphOptions> = {}
): Morph<T, U> {
  const mergedOptions: MorphOptions = {
    ...DEFAULT_MORPH_OPTIONS,
    ...options
  };

  return {
    name,
    options: mergedOptions,
    transform: transformer
  };
}

/**
 * Compose two morphs into a new morph
 */
export function composeMorphs<T, U, V>(
  first: Morph<T, U>,
  second: Morph<U, V>,
  name = `${first.name}➝${second.name}`
): Morph<T, V> {
  return createMorph<T, V>(
    name,
    (input: T, context?: any): V => {
      const intermediate = first.transform(input, context);
      return second.transform(intermediate, context);
    },
    {
      pure: first.options.pure && second.options.pure,
      fusible: first.options.fusible && second.options.fusible,
      cost: first.options.cost + second.options.cost,
      memoizable: first.options.memoizable && second.options.memoizable
    }
  );
}

/**
 * IdentityMorph - A morph that returns its input unchanged
 */
export class IdentityMorph<T> implements Morph<T, T> {
  readonly name: string;
  readonly options: MorphOptions;
  
  constructor(name: string = "IdentityMorph") {
    this.name = name;
    this.options = {
      pure: true,
      fusible: true,
      cost: 0,
      memoizable: true,
    };
  }
  
  transform(input: T, context?: any): T {
    return input;
  }
}

/**
 * ComposedMorph - A morph composed of multiple morphs with optional post-processing
 */
export class ComposedMorph<T, U> implements Morph<T, U> {
  readonly name: string;
  readonly options: MorphOptions;
  private steps: Array<Morph<any, any>>;
  private postProcessor?: PostProcessor<U>;
  
  constructor(
    name: string,
    steps: Array<Morph<any, any>>,
    options: Partial<MorphOptions> = {},
    postProcessor?: PostProcessor<U>
  ) {
    this.name = name;
    this.steps = [...steps];
    this.postProcessor = postProcessor;
    
    // Calculate combined options
    const isPure = postProcessor 
      ? false // Post-processing makes it impure by default
      : steps.every(step => step.options.pure);
      
    const isFusible = !postProcessor && steps.every(step => step.options.fusible);
    
    const totalCost = steps.reduce(
      (total, step) => total + step.options.cost, 
      postProcessor ? 1 : 0
    );
    
    this.options = {
      pure: isPure,
      fusible: isFusible,
      cost: totalCost,
      memoizable: isPure && steps.every(step => step.options.memoizable !== false),
      ...options
    };
  }
  
  transform(input: T, context?: any): U {
    // Apply each step in sequence
    let result: any = input;
    
    for (const step of this.steps) {
      result = step.transform(result, context);
    }
    
    // Apply post-processing if provided
    if (this.postProcessor) {
      result = this.postProcessor(result as U, context);
    }
    
    return result as U;
  }
  
  /**
   * Get steps in this composed morph
   */
  getSteps(): Array<Morph<any, any>> {
    return [...this.steps];
  }
  
  /**
   * Get post-processor if any
   */
  getPostProcessor(): PostProcessor<U> | undefined {
    return this.postProcessor;
  }
  
  /**
   * Create a composed morph from an array of morphs
   */
  static compose<T, U>(
    name: string,
    morphs: Array<Morph<any, any>>,
    options: Partial<MorphOptions> = {},
    postProcessor?: PostProcessor<U>
  ): ComposedMorph<T, U> {
    return new ComposedMorph(name, morphs, options, postProcessor);
  }
}