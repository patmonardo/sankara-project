import { FormShape } from '../schema/form';
import { FormModality } from '../schema/modality';
import { SaraContext } from '../schema/context';
import { createMorphPipeline } from './morpheus';
import { createRelationEvaluator } from './sara';

/**
 * ModalityService - Manages form modality instances and provides access to them
 */
export class ModalityService {
  private modalities: Record<string, FormModality<any>> = {};
  
  /**
   * Register a modality instance for a form type
   */
  registerModality<T extends FormShape>(name: string, modality: FormModality<T>): this {
    this.modalities[name] = modality;
    return this;
  }
  
  /**
   * Get a modality instance by name
   */
  getModality<T extends FormShape>(name: string): FormModality<T> {
    const modality = this.modalities[name];
    if (!modality) {
      throw new Error(`Modality not found: ${name}`);
    }
    return modality as FormModality<T>;
  }
  
  /**
   * Create a new modality and register it
   */
  createModality<T extends FormShape>(name: string): FormModality<T> {
    const modality = new FormModality<T>();
    this.modalities[name] = modality;
    return modality;
  }
  
  /**
   * Actualize a form using its registered modality
   */
  actualize<T extends FormShape>(
    modalityName: string, 
    form: T, 
    contextParams: Partial<SaraContext> = {}
  ): any {
    return this.getModality<T>(modalityName).actualize(form, contextParams);
  }
}

// Global instance for application use
export const modalityService = new ModalityService();

/**
 * Configure and register a standard modality
 */
export function configureStandardModality<T extends FormShape>(
  name: string,
  viewPipelineConfig?: (pipeline: ReturnType<typeof createMorphPipeline<T>>) => void,
  viewEvaluatorConfig?: (form: T, context: SaraContext) => any
): FormModality<T> {
  // Create the modality
  const modality = new FormModality<T>();
  
  // Configure view mode
  if (viewPipelineConfig) {
    const viewPipeline = createMorphPipeline<T>();
    viewPipelineConfig(viewPipeline);
    modality.registerMorphPipeline('view', viewPipeline);
  }
  
  if (viewEvaluatorConfig) {
    const viewEvaluator = createRelationEvaluator<T,any>(viewEvaluatorConfig);
    modality.registerRelationEvaluator('view', viewEvaluator);
  }
  
  // Register and return
  modalityService.registerModality(name, modality);
  return modality;
}