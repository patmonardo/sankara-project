// Add to existing types

/**
 * Basic morph transformation function signature
 */
export type MorphTransformer<T, U> = (input: T, context?: any) => U;

/**
 * Post-processing function for composed morphs
 */
export type PostProcessor<T> = (result: T, context?: any) => T;

/**
 * Options for morph configuration
 */
export interface MorphOptions {
  pure: boolean;         // Is this morph pure (same input always produces same output)?
  fusible: boolean;      // Can this morph be combined with others in optimization?
  cost: number;          // Relative computational cost
  memoizable?: boolean;  // Can results be cached?
  description?: string;  // Human-readable description
  tags?: string[];       // Categorization tags
}

/**
 * Core morph interface
 */
export interface Morph<T, U> {
  readonly name: string;
  readonly options: MorphOptions;
  transform: MorphTransformer<T, U>;
}

/**
 * Condition function type for conditionally applying morphs
 */
export type MorphCondition<T> = (input: T, context?: any) => boolean;

/**
 * Pipeline step types
 */
export type MorphStep<T, U> =
  | { type: "morph"; morph: Morph<T, U> }
  | { type: "map"; fn: (input: T, context?: any) => U }
  | { type: "conditional"; condition: MorphCondition<T>; morph: Morph<T, U> };