import { FormShape, FormMode } from '../schema/form';
import { SaraContext } from '../schema/context';
import { FormModality } from './modality';
import { createMorphPipeline, MorphOperation, createMorphOperation } from './morpheus';
import { createRelationEvaluator, RelationEvaluator } from './sara';

// Import morphs and transformers
import {
  ExtractQualitiesMorph,
  ViewOutputMorph,
} from '../morph/view/extract';

import {
  ViewExtractTransformer,
  ViewRenderTransformer,
} from '../transformer/view';

/**
 * Standard component registry - extensible via dependency injection
 */
const registry = {
  morphs: {
    view: {
      extractQualities: ExtractQualitiesMorph,
      viewOutput: ViewOutputMorph,
    },
    edit: {
      editableFields: null, // Not yet implemented
      validation: null, // Not yet implemented
    }
  },
  transformers: {
    view: {
      extract: ViewExtractTransformer,
      render: ViewRenderTransformer,
    },
    edit: {
      permissions: null, // Not yet implemented
      validation: null, // Not yet implemented
    }
  }
};

/**
 * ModalityFactory - Creates preconfigured FormModality instances
 * with a cleaner, more functional approach
 */
export class ModalityFactory {
  /**
   * Create a default modality with standard pipelines and evaluators
   */
  static createDefault<T extends FormShape>(): FormModality<T> {
    return new FormModality<T>()
      // Register view mode components
      .registerMorphPipeline('view', this.createViewMorphPipeline<T>())
      .registerRelationEvaluator('view', this.createViewRelationEvaluator<T>())
      // Register edit mode components
      .registerMorphPipeline('edit', this.createEditMorphPipeline<T>())
      .registerRelationEvaluator('edit', this.createEditRelationEvaluator<T>());
  }
  
  /**
   * Create a standard view pipeline for Morpheus operations
   */
  static createViewMorphPipeline<T extends FormShape>(): ReturnType<typeof createMorphPipeline<T>> {
    const pipeline = createMorphPipeline<T>();
    
    // Add extract qualities operation
    pipeline.pipe(createMorphOperation<T, T>((form, context) => {
      const ExtractMorph = registry.morphs.view.extractQualities;
      
      if (ExtractMorph) {
        return new ExtractMorph().apply(form, context);
      }
      
      // Fallback implementation
      return { 
        ...form, 
        qualities: { extracted: true } 
      };
    }));
    
    // Add view output operation
    pipeline.pipe(createMorphOperation<T, any>((form, context) => {
      const ViewMorph = registry.morphs.view.viewOutput;
      
      if (ViewMorph) {
        return new ViewMorph().apply(form, context);
      }
      
      // Fallback implementation
      return { 
        ...form, 
        display: { formatted: true } 
      };
    }));
    
    return pipeline;
  }
  
  /**
   * Create a standard view relation evaluator
   */
  static createViewRelationEvaluator<T extends FormShape>(): RelationEvaluator<T, any> {
    return createRelationEvaluator<T>((form, context) => {
      const ExtractTransformer = registry.transformers.view.extract;
      const RenderTransformer = registry.transformers.view.render;
      
      try {
        // Apply extract transformer if available
        let result = form;
        
        if (ExtractTransformer) {
          result = new ExtractTransformer().transform(result, context);
        }
        
        // Apply render transformer if available
        if (RenderTransformer) {
          result = new RenderTransformer().transform(result, context);
        }
        
        return result;
      } catch (e) {
        console.error("View relation evaluation error:", e);
        return form;
      }
    }));
  }
  
  /**
   * Create a standard edit pipeline for Morpheus operations
   */
  static createEditMorphPipeline<T extends FormShape>(): ReturnType<typeof createMorphPipeline<T>> {
    const pipeline = createMorphPipeline<T>();
    
    // Add editable fields operation with clean fallback
    pipeline.pipe(createMorphOperation<T, T>((form, context) => {
      const EditableFieldsMorph = registry.morphs.edit.editableFields;
      
      if (EditableFieldsMorph) {
        return new EditableFieldsMorph().apply(form, context);
      }
      
      // Functional fallback approach
      return {
        ...form,
        fields: this.makeFieldsEditable(form.fields)
      };
    }));
    
    // Add validation setup operation
    pipeline.pipe(createMorphOperation<T, any>((form, context) => {
      const ValidationMorph = registry.morphs.edit.validation;
      
      if (ValidationMorph) {
        return new ValidationMorph().apply(form, context);
      }
      
      return {
        ...form,
        validation: { enabled: true }
      };
    }));
    
    return pipeline;
  }
  
  /**
   * Helper method to make fields editable - extracted for clarity
   */
  private static makeFieldsEditable(fields: any): any {
    if (Array.isArray(fields)) {
      return fields.map(field => ({
        ...field,
        readOnly: false,
        editable: true
      }));
    } else {
      return Object.fromEntries(
        Object.entries(fields || {}).map(([key, field]) => [
          key, 
          { ...field, readOnly: false, editable: true }
        ])
      );
    }
  }
  
  /**
   * Create a standard edit relation evaluator
   */
  static createEditRelationEvaluator<T extends FormShape>(): RelationEvaluator<T, any> {
    return createRelationEvaluator<T>((form, context) => {
      try {
        let result = form;
        
        // Apply permissions if available
        const PermissionsTransformer = registry.transformers.edit.permissions;
        if (PermissionsTransformer) {
          result = new PermissionsTransformer().transform(result, context);
        } else {
          // Apply clean fallback permissions logic
          result = this.applyDefaultPermissions(result, context);
        }
        
        // Apply validation if available
        const ValidationTransformer = registry.transformers.edit.validation;
        if (ValidationTransformer) {
          result = new ValidationTransformer().transform(result, context);
        }
        
        return result;
      } catch (e) {
        console.error("Edit relation evaluation error:", e);
        return form;
      }
    }));
  }
  
  /**
   * Helper method for default permissions - extracted for clarity
   */
  private static applyDefaultPermissions(form: any, context: SaraContext): any {
    const userRole = context.data?.userRole || 'user';
    
    if (userRole !== 'admin') {
      const restrictedFields = ['internalId', 'createdBy', 'systemFlags'];
      const fields = form.fields;
      
      // Handle both array and object field collections
      if (Array.isArray(fields)) {
        return {
          ...form,
          fields: fields.map(field => 
            restrictedFields.includes(field.id) 
              ? { ...field, readOnly: true, editable: false }
              : field
          )
        };
      } else {
        return {
          ...form,
          fields: Object.fromEntries(
            Object.entries(fields || {}).map(([key, field]) => [
              key,
              restrictedFields.includes(key)
                ? { ...field, readOnly: true, editable: false }
                : field
            ])
          )
        };
      }
    }
    
    return form;
  }
  
  /**
   * Create a modality with only Morpheus pipelines
   */
  static createMorpheusOnly<T extends FormShape>(): FormModality<T> {
    return new FormModality<T>()
      .registerMorphPipeline('view', this.createViewMorphPipeline<T>())
      .registerMorphPipeline('edit', this.createEditMorphPipeline<T>());
  }
  
  /**
   * Create a modality with only Sara evaluators
   */
  static createSaraOnly<T extends FormShape>(): FormModality<T> {
    return new FormModality<T>()
      .registerRelationEvaluator('view', this.createViewRelationEvaluator<T>())
      .registerRelationEvaluator('edit', this.createEditRelationEvaluator<T>());
  }
  
  /**
   * Create a modality configured for a specific form type
   */
  static createForFormType<T extends FormShape>(formType: string): FormModality<T> {
    // Start with the default modality
    const modality = this.createDefault<T>();
    
    // Add form-specific customizations using a cleaner pattern
    const formTypeHandlers: Record<string, (m: FormModality<T>) => FormModality<T>> = {
      'user': (m) => m.registerMorphPipeline(
        'view',
        createMorphPipeline<T>().pipe(
          createMorphOperation((form, _) => ({
            ...form,
            sensitiveFieldsHidden: true
          }))
        )
      ),
      
      'product': (m) => m.registerMorphPipeline(
        'view',
        createMorphPipeline<T>().pipe(
          createMorphOperation((form, context) => ({
            ...form,
            showPricing: context.data?.showPricing ?? true
          }))
        )
      )
    };
    
    // Apply the handler if it exists
    return formTypeHandlers[formType] 
      ? formTypeHandlers[formType](modality) 
      : modality;
  }
  
  /**
   * Future expansion for AI/Codex integration
   */
  static createIntelligent<T extends FormShape>(
    formType: string,
    contextHints: Record<string, any> = {}
  ): FormModality<T> {
    const modality = this.createForFormType<T>(formType);
    
    // Handle adaptiveUI hint cleanly
    if (contextHints.adaptiveUI) {
      modality.registerMorphPipeline(
        'view',
        createMorphPipeline<T>().pipe(
          createMorphOperation((form, _) => ({
            ...form,
            adaptive: true,
            adaptiveHints: contextHints.adaptiveHints || {}
          }))
        )
      );
    }
    
    return modality;
  }
  
  /**
   * Register a custom component in the registry
   * This allows for runtime extension of the factory capabilities
   */
  static registerComponent(
    type: 'morph' | 'transformer',
    mode: 'view' | 'edit',
    name: string,
    component: any
  ): void {
    if (registry[`${type}s`]?.[mode]) {
      registry[`${type}s`][mode][name] = component;
    }
  }
}