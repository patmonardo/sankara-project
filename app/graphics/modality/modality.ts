import { FormShape, FormMode } from '../schema/form';
import { MorpheusContext, SaraContext } from '../schema/context';
import { MorphPipeline } from './morpheus';
import { RelationEvaluator } from './sara';
import { createMorpheusContext } from './morpheus';
import { createSaraContext } from './sara';

/**
 * FormModality - Manages form transformations across different modes
 * Integrates both Morpheus operations and Sara relations
 */
export class FormModality<T extends FormShape = FormShape> {
  private morphPipelines: Record<FormMode, MorphPipeline<T, any>> = {} as any;
  private relationEvaluators: Record<FormMode, RelationEvaluator<T, any>> = {} as any;
  
  private innerState = {
    mode: 'view' as FormMode,
    data: {} as Record<string, any>
  };
  
  /**
   * Register a morph pipeline for a specific mode
   */
  registerMorphPipeline(mode: FormMode, pipeline: MorphPipeline<T, any>): this {
    this.morphPipelines[mode] = pipeline;
    return this;
  }
  
  /**
   * Register a relation evaluator for a specific mode
   */
  registerRelationEvaluator(mode: FormMode, evaluator: RelationEvaluator<T, any>): this {
    this.relationEvaluators[mode] = evaluator;
    return this;
  }
  
  /**
   * MORPHEUS: Adapt form shape through operations
   * Uses MorpheusContext for Form-in-itself operations
   */
  adapt(form: T, contextParams: Partial<MorpheusContext> = {}): any {
    // Create a proper MorpheusContext
    const context = createMorpheusContext({
      ...contextParams,
      mode: contextParams.mode || this.innerState.mode,
      // Store innerState in the correct location
      values: {
        ...(contextParams.values || {}),
        innerState: this.innerState.data
      }
    });
    
    const pipeline = this.morphPipelines[context.mode];
    if (!pipeline) {
      throw new Error(`No Morpheus pipeline registered for mode: ${context.mode}`);
    }

    return pipeline.apply(form, context);
  }
  
  /**
   * SARA: Evaluate form through essential relations
   * Uses SaraContext for Form-in-relation operations
   */
  eval(form: T, contextParams: Partial<SaraContext> = {}): any {
    // Create a proper SaraContext
    const context = createSaraContext({
      ...contextParams,
      mode: contextParams.mode || this.innerState.mode,
      // Store innerState in data field
      data: {
        ...(contextParams.data || {}),
        innerState: this.innerState.data
      }
    });
    
    const evaluator = this.relationEvaluators[context.mode];
    if (!evaluator) {
      throw new Error(`No Sara evaluator registered for mode: ${context.mode}`);
    }

    return evaluator.transform(form, context);
  }
  
  /**
   * Actualize: The complete form transformation process
   * Integrates both adaptation and evaluation with proper context isolation
   */
  actualize(
    form: T, 
    contextParams: {
      morpheus?: Partial<MorpheusContext>;
      sara?: Partial<SaraContext>;
      mode?: FormMode;
    } = {}
  ): any {
    // Extract shared mode
    const mode = contextParams.mode || this.innerState.mode;
    
    // Apply Morpheus adaptation with MorpheusContext
    let adaptedForm: any;
    try {
      adaptedForm = this.adapt(form, {
        ...(contextParams.morpheus || {}),
        mode
      });
    } catch (e) {
      console.error('Morpheus adaptation failed:', e);
      adaptedForm = form;
    }
    
    // Apply Sara evaluation with SaraContext
    try {
      return this.eval(adaptedForm, {
        ...(contextParams.sara || {}),
        mode
      });
    } catch (e) {
      console.error('Sara evaluation failed:', e);
      return adaptedForm;
    }
  }
  
  /**
   * Simplified actualize method for backward compatibility
   */
  actualizeSimple(form: T, mode?: FormMode, data?: Record<string, any>): any {
    return this.actualize(form, {
      mode: mode || this.innerState.mode,
      morpheus: {
        values: { ...(data || {}), innerState: this.innerState.data }
      },
      sara: {
        data: { ...(data || {}), innerState: this.innerState.data }
      }
    });
  }
  
  /**
   * Transition to a different mode
   */
  transition(to: FormMode): this {
    this.innerState.mode = to;
    return this;
  }
  
  /**
   * Set inner state data
   */
  setData(data: Record<string, any>): this {
    this.innerState.data = data;
    return this;
  }
  
  /**
   * Get inner state data
   */
  getData(): Record<string, any> {
    return { ...this.innerState.data };
  }
}

/**
 * Create a configured FormModality instance
 */
export function createFormModality<T extends FormShape>(): FormModality<T> {
  return new FormModality<T>();
}