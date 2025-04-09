import { SaraContext } from "../schema/context";

/**
 * RelationEvaluator - Evaluates essential relations between forms
 * Implements the essential relation moment of the dialectical progression
 */
export interface RelationEvaluator<T, R> {
  /**
   * Transform input through its essential relations
   */
  transform(input: T, context: SaraContext): R;

  /**
   * Compose with another relation evaluator
   */
  compose<N>(next: RelationEvaluator<R, N>): RelationEvaluator<T, N>;
}

/**
 * RelationRule - A specific evaluation rule for form relations
 */
export interface RelationRule<T, R> {
  /**
   * Apply the relation rule to transform input
   */
  evaluate(input: T, context: SaraContext): R;

  /**
   * Name of the rule (for debugging)
   */
  name: string;
}

/**
 * DefaultRelationEvaluator - Standard implementation of RelationEvaluator
 */
export class DefaultRelationEvaluator<T, R = T>
  implements RelationEvaluator<T, R>
{
  private rules: Array<RelationRule<any, any>> = [];

  constructor(private readonly name: string = "RelationEvaluator") {}

  /**
   * Add a rule to the evaluator
   */
  addRule<N>(rule: RelationRule<R, N>): RelationEvaluator<T, N> {
    this.rules.push(rule);
    return this as unknown as RelationEvaluator<T, N>;
  }

  /**
   * Compose with another evaluator
   */
  compose<N>(next: RelationEvaluator<R, N>): RelationEvaluator<T, N> {
    return new CompositeRelationEvaluator(this, next);
  }

  /**
   * Transform input through relations
   */
  transform(input: T, context: SaraContext): R {
    let result = input as any;

    for (const rule of this.rules) {
      result = rule.evaluate(result, context);
    }

    return result as R;
  }
}

/**
 * CompositeRelationEvaluator - Combines multiple evaluators
 */
export class CompositeRelationEvaluator<T, M, R>
  implements RelationEvaluator<T, R>
{
  constructor(
    private readonly first: RelationEvaluator<T, M>,
    private readonly second: RelationEvaluator<M, R>
  ) {}

  transform(input: T, context: SaraContext): R {
    const intermediate = this.first.transform(input, context);
    return this.second.transform(intermediate, context);
  }

  compose<N>(next: RelationEvaluator<R, N>): RelationEvaluator<T, N> {
    return new CompositeRelationEvaluator(this, next);
  }
}

/**
 * Create a relation rule from a function
 */
export function createRelationRule<T, R>(
  name: string,
  evaluator: (input: T, context: SaraContext) => R
): RelationRule<T, R> {
  return {
    name,
    evaluate: evaluator,
  };
}

/**
 * Implementation of createRelationEvaluator
 */
export function createRelationEvaluator<T, R = T>(
  nameOrFn: string | ((input: T, context: SaraContext) => R)
): RelationEvaluator<T, R> {
  if (typeof nameOrFn === 'string') {
    // Original implementation - create an empty evaluator with a name
    return new DefaultRelationEvaluator<T, R>(nameOrFn);
  } else {
    // New implementation - create an evaluator from a function
    const evaluator = new DefaultRelationEvaluator<T, R>();
    
    // Add the function as a rule
    evaluator.addRule(createRelationRule(
      'InlineEvaluator',
      nameOrFn as any // Cast needed due to generic constraints
    ));
    
    return evaluator;
  }
}

/**
 * Create a SaraContext with reasonable defaults
 */
export function createSaraContext(options: Partial<SaraContext> = {}): SaraContext {
  return {
    operationId: options.operationId || crypto.randomUUID?.() || `op-${Date.now()}`,
    timestamp: options.timestamp || Date.now(),
    mode: options.mode || "view",
    format: options.format || "jsx",
    debug: options.debug || false,
    relations: options.relations || {},
    relatedShapes: options.relatedShapes || {},
    // Optional properties
    ...(options.relationalConstraints && { relationalConstraints: options.relationalConstraints }),
    ...(options.quantities && { quantities: options.quantities }),
    ...(options.constraints && { constraints: options.constraints }),
  };
}