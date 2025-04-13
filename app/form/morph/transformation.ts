import { FormContext } from "../context/context";
import { FormShape, FormMode } from "../schema/form";
import { applyFormMode } from "./modes";
import { 
  GraphTransformer, 
  Transformer, 
  transformWithResult
} from "./transformer";
import {
  SimpleMorph, 
  MorphPipeline,
  FluentPipeline,
  createPipeline
} from "./morph";
import { morpheus } from "../modality/morpheus";

/**
 * TransformationEngine - Unified transformation interface
 * 
 * Provides a single entry point for all form transformations,
 * integrating both the pipeline-based Morpheus system and
 * the graph-based Transformer approach from the legacy system.
 */
export class TransformationEngine {
  private context: FormContent;
  
  constructor(context: FormContent) {
    this.context = context;
  }
  
  /**
   * Transform a form to a specified mode
   */
  transformToMode(form: FormShape, mode: FormMode): FormShape {
    // Convert FormContent to MorpheusContext
    const morpheusContext = {
      formId: form.id,
      userId: this.context.getCurrentUser?.() || "anonymous",
      mode: mode,
      timestamp: Date.now(),
      // Add any other context properties needed
    };
    
    return applyFormMode(form, mode, morpheusContext);
  }
  
  /**
   * Transform a form to another format
   */
  transform(formOrId: FormShape | string, outputType: string, options?: any): any {
    // Get the form if an ID was provided
    const form = typeof formOrId === 'string' 
      ? this.context.getEntity(formOrId)
      : formOrId;
    
    if (!form) {
      throw new Error(`Form not found: ${formOrId}`);
    }
    
    // Create a common context object that works with both systems
    const transformContext = {
      formId: form.id,
      userId: this.context.getCurrentUser?.() || "anonymous",
      timestamp: Date.now(),
      options: options || {},
      context: this.context
    };
    
    // Try Morpheus system first
    try {
      return this.transformWithMorpheus(form, outputType, transformContext);
    } catch (e) {
      if ((e as Error).message.includes('not found')) {
        // Fall back to graph transformer if morph not found
        return this.transformWithGraph(form, outputType, transformContext);
      }
      throw e;
    }
  }
  
  /**
   * Transform using the Morpheus system
   */
  private transformWithMorpheus(form: any, outputType: string, context: any): any {
    // Find appropriate pipeline in Morpheus registry
    const morph = morpheus.find((m: any) => 
      m.metadata?.outputType === outputType || 
      m.metadata?.tags?.includes(outputType)
    );
    
    if (!morph) {
      throw new Error(`Morph not found for output type: ${outputType}`);
    }
    
    return morph.apply(form, context);
  }
  
  /**
   * Transform using the graph-based approach
   */
  private transformWithGraph(form: any, outputType: string, context: any): any {
    // Create a transformer for this output type
    const transformer = this.createTransformerForType(outputType, context.options);
    
    // Apply transformation and return result
    return transformWithResult(transformer, form, context).data;
  }
  
  /**
   * Create a transformer for a specific output type
   */
  private createTransformerForType(outputType: string, options?: any): Transformer<any, any> {
    // Create appropriate transformer based on output type
    switch (outputType) {
      case 'json':
        return this.createJsonTransformer(options);
      case 'xml':
        return this.createXmlTransformer(options);
      case 'csv':
        return this.createCsvTransformer(options);
      case 'validation':
        return this.createValidationTransformer(options);
      default:
        // For unknown types, return a default transformer
        return this.createDefaultTransformer(outputType, options);
    }
  }
  
  /**
   * Create transformers for specific output types
   */
  private createJsonTransformer(options?: any): Transformer<any, any> {
    const transformer = new GraphTransformer("JsonTransformer");
    // Configure JSON transformation
    // ...
    return transformer;
  }
  
  private createXmlTransformer(options?: any): Transformer<any, any> {
    const transformer = new GraphTransformer("XmlTransformer");
    // Configure XML transformation
    // ...
    return transformer;
  }
  
  private createCsvTransformer(options?: any): Transformer<any, any> {
    const transformer = new GraphTransformer("CsvTransformer");
    // Configure CSV transformation
    // ...
    return transformer;
  }
  
  private createValidationTransformer(options?: any): Transformer<any, any> {
    const transformer = new GraphTransformer("ValidationTransformer");
    // Configure validation transformation
    // ...
    return transformer;
  }
  
  private createDefaultTransformer(outputType: string, options?: any): Transformer<any, any> {
    const transformer = new GraphTransformer(`${outputType}Transformer`);
    // Configure a generic transformer
    // ...
    return transformer;
  }
  
  /**
   * Create a transformation pipeline
   */
  createPipeline(name: string, steps: string[]): any {
    // Build a pipeline using the consolidated FluentPipeline from morph.ts
    let pipeline = createPipeline(name);
    
    // Add all steps
    for (const step of steps) {
      pipeline = pipeline.pipeTo(step) as any;
    }
    
    // Build and register the pipeline
    const builtPipeline = pipeline.build({
      description: `Pipeline ${name} with steps: ${steps.join(', ')}`,
      category: 'pipeline',
      tags: ['custom', ...steps]
    });
    
    return {
      name,
      steps,
      created: true,
      pipeline: builtPipeline
    };
  }
  
  /**
   * Execute a transformation pipeline
   */
  executePipeline(pipelineName: string, input?: any): any {
    // Try Morpheus first
    const morph = morpheus.get(pipelineName);
    if (morph) {
      return morph.apply(input, {
        formId: input.id,
        userId: this.context.getCurrentUser?.() || "anonymous",
        timestamp: Date.now()
      });
    }
    
    // Fall back to graph-based pipeline if not found
    throw new Error(`Pipeline not found: ${pipelineName}`);
  }
  
  /**
   * Bridge method: Convert a Transformer to a Morphism
   */
  transformerToMorph<TIn, TOut>(
    transformer: Transformer<TIn, TOut>, 
    name?: string
  ): SimpleMorph<TIn, TOut> {
    return new SimpleMorph(
      name || transformer.name || 'TransformerMorph',
      (input, context) => transformer.transform(input, context),
      {
        pure: false, // Conservatively assume transformers are not pure
        fusible: false, // Don't try to fuse with other morphs
        cost: 1
      }
    );
  }
  
  /**
   * Bridge method: Convert a Morphism to a Transformer
   */
  morphToTransformer<TIn, TOut>(
    morph: SimpleMorph<TIn, TOut>
  ): Transformer<TIn, TOut> {
    return {
      name: morph.name,
      transform: (input, context) => morph.apply(input, context)
    };
  }
}