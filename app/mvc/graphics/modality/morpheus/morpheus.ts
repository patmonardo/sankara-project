import { EventEmitter } from 'events';
import {
  SimpleMorph,
  MorphOptimizationMetadata,
  createMorph,
} from "../morph/morph";
import { MorpheusContext, MorpheusContextSchema } from "../schema/context";
import { createPipeline } from "../morph/pipeline";
import { FormShape } from "../schema/form";

/**
 * Morphism metadata for documentation and discovery
 */
export interface MorphismMetadata {
  description?: string;
  category?: string;
  tags?: string[];
  inputType?: string;
  outputType?: string;
  author?: string;
  version?: string;
  registered?: string;
  composition?: {
    type: "pipeline" | "composite";
    morphs: string[];
  };
}

/**
 * Serializable registry data
 */
export interface SerializableMorpheusRegistry {
  morphisms: Record<string, string>;
  metadata: Record<string, MorphismMetadata>;
  version: string;
  exportedAt: string;
}

/**
 * Form field definition
 */
export interface FormField {
  id: string;
  type: string;
  label: string;
  name?: string;
  description?: string;
  required?: boolean;
  options?: any[];
  defaultValue?: any;
  validation?: Array<{
    type: string;
    params?: Record<string, any>;
    message: string;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Form definition
 */
export interface FormDefinition {
  id: string;
  name: string;
  title: string;
  description?: string;
  fields: FormField[];
  layout?: any;
  submit?: {
    label?: string;
    action?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Morpheus - A global registry and discovery service for morphisms
 *
 * This class provides a central repository for registering, discovering,
 * and documenting morphisms without reimplementing their functionality.
 */
export class Morpheus extends EventEmitter {
  private morphisms = new Map<string, SimpleMorph<any, any>>();
  private metadata = new Map<string, MorphismMetadata>();
  private categories = new Map<string, Set<string>>();
  private forms = new Map<string, FormDefinition>();

  constructor() {
    super();
  }

  /**
   * Register an existing morphism with the system
   */
  register<I, O>(
    morph: SimpleMorph<I, O>,
    metadata: MorphismMetadata = {}
  ): this {
    // Store the morphism
    this.morphisms.set(morph.name, morph);

    // Store metadata
    const now = new Date().toISOString();
    const enhancedMetadata = {
      ...metadata,
      registered: now,
    };

    this.metadata.set(morph.name, enhancedMetadata);

    // Add to categories
    const category = metadata.category || "uncategorized";
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set());
    }
    this.categories.get(category)?.add(morph.name);

    // Add to tags
    if (metadata.tags) {
      for (const tag of metadata.tags) {
        if (!this.categories.has(`tag:${tag}`)) {
          this.categories.set(`tag:${tag}`, new Set());
        }
        this.categories.get(`tag:${tag}`)?.add(morph.name);
      }
    }

    // Emit event for extensions to listen to
    this.emit('morphism:registered', {
      name: morph.name,
      metadata: enhancedMetadata
    });

    return this;
  }

  /**
   * Create and register a new morphism
   */
  define<I, O>(
    name: string,
    transform: (input: I, context: MorpheusContext) => O,
    optimizationMetadata: MorphOptimizationMetadata = {}
  ): SimpleMorph<I, O> {
    // Create the morphism using the existing factory
    const morph = createMorph<I, O>(name, transform, optimizationMetadata);

    // Register it with default metadata
    this.register(morph, {
      description: `Morphism: ${name}`,
    });

    return morph;
  }

  /**
   * Create and register a pipeline using the existing pipeline builder
   */
  pipeline<I, O = I>(name: string, metadata: MorphismMetadata = {}) {
    // Create a pipeline builder
    const pipelineBuilder = createPipeline<I>(name);

    // Create a wrapper that will register the pipeline when built
    const wrappedBuilder = {
      ...pipelineBuilder,

      // Override build to register the pipeline
      build: (buildMetadata: any = {}) => {
        const builtPipeline = pipelineBuilder.build(buildMetadata);

        // Register the built pipeline
        this.register(builtPipeline, {
          ...metadata,
          ...buildMetadata,
          category: buildMetadata.category || metadata.category || "pipeline",
          composition: {
            type: "pipeline",
            morphs: [], // We can't easily get the morphs from the pipeline
          },
        });

        return builtPipeline;
      },
    };

    return wrappedBuilder;
  }

  /**
   * Get a morphism by name
   */
  get<I = any, O = any>(name: string): SimpleMorph<I, O> | undefined {
    return this.morphisms.get(name) as SimpleMorph<I, O>;
  }

  /**
   * Get metadata about a morphism
   */
  getMetadata(name: string): MorphismMetadata | undefined {
    return this.metadata.get(name);
  }

  /**
   * List all morphisms in a category
   */
  listByCategory(category: string): string[] {
    return Array.from(this.categories.get(category) || []);
  }

  /**
   * List all categories
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys()).filter(
      (key) => !key.startsWith("tag:")
    );
  }

  /**
   * List all tags
   */
  getTags(): string[] {
    return Array.from(this.categories.keys())
      .filter((key) => key.startsWith("tag:"))
      .map((key) => key.substring(4));
  }

  /**
   * Find morphisms by input and output types
   */
  findByTypes(inputType: string, outputType: string): string[] {
    return Array.from(this.metadata.entries())
      .filter(
        ([_, meta]) =>
          meta.inputType === inputType && meta.outputType === outputType
      )
      .map(([name]) => name);
  }

  /**
   * Transform data using a named morphism
   */
  transform<I, O>(
    name: string, 
    input: I, 
    context: MorpheusContext | Record<string, any>
  ): O {
    const morph = this.get<I, O>(name);
    if (!morph) {
      throw new Error(`Morphism "${name}" not found`);
    }
    
    // Handle context object creation if passed a plain object
    const ctx = isPlainObject(context) ? createMorpheusContext(context) : context;
    
    // Start timing
    const startTime = performance.now();
    
    try {
      // Apply the transformation
      const result = morph.apply(input, ctx);
      
      // Emit transformation event
      this.emit('morph:transform', {
        name,
        input,
        output: result,
        context: ctx,
        duration: performance.now() - startTime
      });
      
      return result;
    } catch (err) {
      // Emit error event
      this.emit('morph:error', {
        name,
        input,
        error: err,
        context: ctx,
        duration: performance.now() - startTime
      });
      
      throw err;
    }
  }

  /**
   * Register a form definition
   */
  registerForm(form: FormDefinition): void {
    this.forms.set(form.id, form);
    this.emit('form:registered', form);
  }
  
  /**
   * Get a form by ID
   */
  getForm(formId: string): FormDefinition | undefined {
    return this.forms.get(formId);
  }
  
  /**
   * Get all registered forms
   */
  getAllForms(): FormDefinition[] {
    return Array.from(this.forms.values());
  }
  
  /**
   * Transform a form using appropriate morphisms
   */
  transformForm<T extends FormShape>(
    form: T,
    mode: string, 
    context?: Partial<MorpheusContext>
  ): any {
    // Find appropriate morphism for this mode
    const morphName = `form:${mode}`;
    const fallbackName = 'form:transform';
    
    // Create context
    const ctx = createMorpheusContext({
      ...context,
      type: mode,
      mode
    });
    
    // Try to find and apply appropriate morph
    if (this.get(morphName)) {
      return this.transform(morphName, form, ctx);
    } else if (this.get(fallbackName)) {
      return this.transform(fallbackName, form, ctx);
    }
    
    // No appropriate morph found, return form as is
    return form;
  }

  /**
   * Export registry data for serialization
   */
  export(): SerializableMorpheusRegistry {
    // Convert maps to plain objects
    const morphisms: Record<string, string> = {};
    const metadata: Record<string, MorphismMetadata> = {};

    for (const [name, morph] of this.morphisms.entries()) {
      // We can only store the name of the morphism, not the function itself
      morphisms[name] = name;
      metadata[name] = this.metadata.get(name) || {};
    }

    return {
      morphisms,
      metadata,
      version: "1.0",
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Import registry data
   *
   * Note: This only imports metadata, not the actual morphism implementations
   * Those must be registered separately
   */
  import(data: SerializableMorpheusRegistry): number {
    let count = 0;
    
    const shouldEmit = Object.keys(data.metadata).length > 0;

    for (const [name, meta] of Object.entries(data.metadata)) {
      if (!this.metadata.has(name)) {
        this.metadata.set(name, meta);

        // Add to categories
        const category = meta.category || "imported";
        if (!this.categories.has(category)) {
          this.categories.set(category, new Set());
        }
        this.categories.get(category)?.add(name);

        count++;
      }
    }
    
    // Emit registry updated event if any items were imported
    if (shouldEmit) {
      this.emit('registry:updated', { importedCount: count });
    }

    return count;
  }
  
  /**
   * Handle Neo entity events (typically from extension)
   */
  handleNeoEntity(entity: any): void {
    // Convert Neo entity to form if appropriate
    if (entity.type === 'form' || entity.type === 'form:definition') {
      const form = this.neoEntityToForm(entity);
      this.registerForm(form);
    }
  }
  
  /**
   * Convert Neo entity to Morpheus form
   */
  private neoEntityToForm(entity: any): FormDefinition {
    return {
      id: entity.id,
      name: entity.properties?.name || 'Unnamed Form',
      title: entity.properties?.title || entity.properties?.name || 'Unnamed Form',
      description: entity.properties?.description,
      fields: Array.isArray(entity.properties?.fields) 
        ? entity.properties.fields.map((field: any) => ({
            id: field.id,
            type: field.type,
            label: field.label,
            name: field.name || field.id,
            description: field.description,
            required: field.required,
            options: field.options,
            defaultValue: field.defaultValue,
            validation: field.validation,
            metadata: field.metadata
          }))
        : [],
      layout: entity.properties?.layout,
      submit: {
        label: entity.properties?.submitLabel || 'Submit',
        action: entity.properties?.submitAction
      },
      metadata: {
        ...entity.metadata,
        neoEntityId: entity.id,
        neoEntityType: entity.type
      }
    };
  }
}

/**
 * Check if an object is a plain object (not a class instance)
 */
function isPlainObject(obj: any): boolean {
  return obj && typeof obj === 'object' && obj.constructor === Object;
}

/**
 * Creates a MorpheusContext with reasonable defaults
 * 
 * This function creates a context and validates it against the schema
 */
export function createMorpheusContext(
  options: Partial<MorpheusContext> = {}
): MorpheusContext {
  // Create a basic context object
  const contextData = {
    // Required discriminant field
    type: options.type || "view",
    
    // Core required fields
    mode: options.mode || "view",
    values: options.values || {},
    data: options.data || {},
    
    // UI state with defaults
    ui: {
      touched: options.ui?.touched || {},
      dirty: options.ui?.dirty || {},
      focused: options.ui?.focused,
      hovering: options.ui?.hovering
    },
    
    // Constraints with defaults
    constraints: {
      device: options.constraints?.device || "desktop",
      orientation: options.constraints?.orientation || "portrait",
      locale: options.constraints?.locale || "en-US",
      translations: options.constraints?.translations || {},
      accessibilityLevel: options.constraints?.accessibilityLevel || "AA",
      readOnly: options.constraints?.readOnly || false,
      maxColumns: options.constraints?.maxColumns,
      maxFieldsPerSection: options.constraints?.maxFieldsPerSection
    },
    
    // Optional but common fields with defaults if provided
    validationLevel: options.validationLevel || "standard",
    validators: options.validators || {},
    includeFields: options.includeFields,
    excludeFields: options.excludeFields
  };

  // Use the schema to validate and set defaults
  return MorpheusContextSchema.parse(contextData);
}

// Create the global Morpheus registry instance
export const morpheus = new Morpheus();

// Make sure this can work as a module
export default morpheus;