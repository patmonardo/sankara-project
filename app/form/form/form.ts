import React from "react";
import { 
  FormDefinition,
} from "@/form/schema/schema";
import { 
  FormMatter, 
  FormMode, 
  FormContent, 
  FormHandler, 
  FormState, 
  FormShape 
} from "@/form/schema/form";
import { FormShapeAdapter } from "@/form/modality/render";
import { PropertyService } from "@/form/property/property";
import { FormContext } from "@/form/context/context";

export class Form<T extends FormShape = FormShape> {
  // Core identity
  id: string;
  
  // Knowledge representation
  definition: FormDefinition;
  
  // Runtime state
  state: FormState = { status: "idle" };
  
  // Associated data
  data?: FormMatter;
  
  /**
   * Create a new Form instance
   */
  constructor(
    definition: FormDefinition,
    data?: FormMatter,
    options?: {
      id?: string;
      autoActivate?: boolean;
    }
  ) {
    this.id = options?.id || definition.id;
    this.definition = definition;
    this.data = data;
    
    // Register with the Form system
    FormSystem.getInstance().registerForm(definition);
    
    // Auto-activate if requested
    if (options?.autoActivate) {
      this.activate();
    }
  }
  
  /**
   * Activate this form's context
   */
  activate(): boolean {
    // Find or create a context for this form
    const contextId = this.getContextId();
    return FormContext.switchContext(contextId);
  }
  
  /**
   * Execute a function within this form's context
   */
  run<R>(fn: () => R): R {
    return FormContext.withContext(this.getContextId(), fn);
  }
  
  /**
   * Get the primary context for this form
   */
  private getContextId(): string {
    // Find an existing context or create one
    const contextKey = Object.keys(this.definition.contexts)[0];
    if (contextKey) {
      return this.definition.contexts[contextKey].id;
    }
    
    // No context found, create one
    const context = FormContext.createContext({
      name: `Context for ${this.definition.name}`,
      type: "composite",
      active: false
    });
    
    // Register with definition
    this.definition.contexts[context.id] = context;
    return context.id;
  }
  
  /**
   * Execute a property on this form
   */
  executeProperty<R = any>(
    propertyId: string,
    inputs: Record<string, any> = {}
  ): R {
    return this.run(() => {
      return PropertyService.execute(propertyId, {
        ...inputs,
        form: this,
        formId: this.id
      }) as R;
    });
  }
  
  /**
   * Generate an entity within this form
   */
  createEntity(
    entityType: string, 
    data: Record<string, any>
  ): string {
    return this.run(() => {
      // Check if we have an entity definition for this type
      const entityDefKey = Object.keys(this.definition.entities)
        .find(key => this.definition.entities[key].type === entityType);
      
      if (!entityDefKey) {
        throw new Error(`No entity definition found for type: ${entityType}`);
      }
      
      // Get the context
      const contextId = this.getContextId();
      const context = FormContext.getContext(contextId);
      
      // Create entity using form's context
      return context.createEntity?.({
        ...data,
        type: entityType
      }) || '';
    });
  }
  
  /**
   * Create a relation between entities in this form
   */
  createRelation(
    sourceId: string,
    targetId: string,
    relationType: string,
    data: Record<string, any> = {}
  ): string {
    return this.run(() => {
      // Get the context
      const contextId = this.getContextId();
      const context = FormContext.getContext(contextId);
      
      // Create relation using form's context
      return context.createRelation?.(
        sourceId,
        targetId,
        relationType,
        data
      ) || '';
    });
  }
  
  /**
   * Get the shape of this form
   */
  async getShape(mode: FormMode): Promise<T> {
    // This would create the appropriate form shape based on mode and definition
    switch (mode) {
      case "create":
        return this.createForm();
      case "edit":
        return this.editForm();
      default:
        throw new Error(`Unsupported mode: ${mode}`);
    }
  }
  
  /**
   * Create a form shape for "create" mode
   */
  protected async createForm(): Promise<T> {
    // Default implementation - subclasses should override
    return {} as T;
  }
  
  /**
   * Create a form shape for "edit" mode
   */
  protected async editForm(): Promise<T> {
    // Default implementation - subclasses should override
    return {} as T;
  }
  
  /**
   * Render the form in a specific format
   */
  async render(
    mode: FormMode,
    content: FormContent,
    handler: FormHandler
  ): Promise<React.ReactNode | string> {
    try {
      // Get the form shape based on mode
      const shape = await this.getShape(mode);
      
      // Render the form in the requested format
      switch (content) {
        case "jsx":
          return this.renderJSX(shape, this.data, handler);
        case "json":
          return this.renderJSON(shape, this.data, handler);
        case "html":
          return this.renderHTML(shape, this.data, handler);
        case "xml":
          return this.renderXML(shape, this.data, handler);
        default:
          throw new Error(`Unsupported format: ${content}`);
      }
    } catch (error) {
      console.error("Error rendering form:", error);
      return null;
    }
  }
  
  // Rendering methods (unchanged from current implementation)
  renderJSX(shape: T, data: FormMatter, handler: FormHandler): React.ReactNode {
    return FormShapeAdapter.toJSX(shape, data, handler);
  }
  
  renderJSON(shape: T, data: FormMatter, handler: FormHandler): string {
    return FormShapeAdapter.toJSON(shape, data);
  }
  
  renderHTML(shape: T, data: FormMatter, handler: FormHandler): string {
    return FormShapeAdapter.toHTML(shape, data);
  }
  
  renderXML(shape: T, data: FormMatter, handler: FormHandler): string {
    return FormShapeAdapter.toXML(shape, data);
  }
  
  /**
   * Update the form's state
   */
  setState(state: Partial<FormState>): void {
    this.state = {
      ...this.state,
      ...state,
    };
  }
}

/**
 * Create a form from a definition
 */
export function createForm<T extends FormShape = FormShape>(
  definition: FormDefinition,
  data?: FormMatter,
  options?: {
    id?: string;
    autoActivate?: boolean;
  }
): Form<T> {
  return new Form<T>(definition, data, options);
}

