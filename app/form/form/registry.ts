import { Context } from '../context/context';
import { FormSystem } from './system';
import { FormDefinition } from '../schema/schema';
import { FormMatter } from '../schema/form';

/**
 * FormEngine - Core processing capabilities for the Form system
 * 
 * Provides transformation, analysis, and workflow execution for forms
 * without overcomplicating the implementation with philosophical concepts.
 */
export class FormEngine {
  private static instance: FormEngine;
  private context: Context;
  private formSystem: FormSystem;
  
  // Registry of transformers, analyzers, and workflows
  private transformers: Map<string, TransformerFunction> = new Map();
  private analyzers: Map<string, AnalyzerFunction> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  
  private constructor() {
    this.formSystem = FormSystem.getInstance();
    this.context = new Context(); // Simplified for this example
    this.registerDefaultComponents();
  }
  
  /**
   * Get the singleton instance
   */
  static getInstance(): FormEngine {
    if (!FormEngine.instance) {
      FormEngine.instance = new FormEngine();
    }
    return FormEngine.instance;
  }
  
  /**
   * Register default components
   */
  private registerDefaultComponents(): void {
    // Register default transformers
    this.registerTransformer('json', (form) => {
      return JSON.stringify(form, null, 2);
    });
    
    this.registerTransformer('html', (form) => {
      // Basic HTML representation
      return `<div class="form">
        <h2>${form.definition.name}</h2>
        <form>
          ${(form.definition.fields || [])
            .map(field => `<div class="field">
              <label>${field.label || field.name}</label>
              <input type="${field.type || 'text'}" name="${field.name}" 
                ${field.required ? 'required' : ''} />
            </div>`)
            .join('\n')}
          <button type="submit">Submit</button>
        </form>
      </div>`;
    });
    
    // Register default analyzers
    this.registerAnalyzer('structure', (form) => {
      const fields = form.definition.fields || [];
      return {
        name: form.definition.name,
        fieldCount: fields.length,
        requiredFields: fields.filter(f => f.required).length,
        fieldTypes: fields.reduce((acc, field) => {
          acc[field.type || 'text'] = (acc[field.type || 'text'] || 0) + 1;
          return acc;
        }, {})
      };
    });
    
    this.registerAnalyzer('validation', (form) => {
      const fields = form.definition.fields || [];
      const issues = [];
      
      // Basic validation rules
      if (!form.definition.name) {
        issues.push('Form name is missing');
      }
      
      if (fields.length === 0) {
        issues.push('Form has no fields');
      }
      
      fields.forEach(field => {
        if (!field.name) {
          issues.push(`Field is missing a name`);
        }
      });
      
      return {
        valid: issues.length === 0,
        issues: issues
      };
    });
    
    // Register default workflows
    this.registerWorkflow('validate-transform', [
      { type: 'analyze', name: 'validation' },
      { type: 'transform', name: 'json', condition: 'valid' }
    ]);
  }
  
  /**
   * Register a transformer
   */
  registerTransformer(name: string, transformer: TransformerFunction): void {
    this.transformers.set(name, transformer);
  }
  
  /**
   * Register an analyzer
   */
  registerAnalyzer(name: string, analyzer: AnalyzerFunction): void {
    this.analyzers.set(name, analyzer);
  }
  
  /**
   * Register a workflow
   */
  registerWorkflow(name: string, steps: WorkflowStep[]): void {
    this.workflows.set(name, { name, steps });
  }
  
  /**
   * Transform a form to a specific format
   */
  async transform(formId: string, format: string): Promise<any> {
    const form = this.formSystem.getForm(formId);
    if (!form) {
      throw new Error(`Form not found: ${formId}`);
    }
    
    const transformer = this.transformers.get(format);
    if (!transformer) {
      throw new Error(`Transformer not found: ${format}`);
    }
    
    // Record operation in context
    await this.context.recordOperation({
      type: 'transform',
      formId,
      format,
      timestamp: new Date().toISOString()
    });
    
    // Prepare form data for transformation
    const formData = {
      id: form.id,
      definition: form.vyākhyā,
      data: form.dravya || {},
    };
    
    // Execute transformer
    return transformer(formData);
  }
  
  /**
   * Analyze a form using a specific analyzer
   */
  async analyze(formId: string, analyzerName: string): Promise<any> {
    const form = this.formSystem.getForm(formId);
    if (!form) {
      throw new Error(`Form not found: ${formId}`);
    }
    
    const analyzer = this.analyzers.get(analyzerName);
    if (!analyzer) {
      throw new Error(`Analyzer not found: ${analyzerName}`);
    }
    
    // Record operation in context
    await this.context.recordOperation({
      type: 'analyze',
      formId,
      analyzer: analyzerName,
      timestamp: new Date().toISOString()
    });
    
    // Prepare form data for analysis
    const formData = {
      id: form.id,
      definition: form.vyākhyā,
      data: form.dravya || {},
    };
    
    // Execute analyzer
    return analyzer(formData);
  }
  
  /**
   * Execute a workflow on a form
   */
  async executeWorkflow(formId: string, workflowName: string): Promise<any> {
    const form = this.formSystem.getForm(formId);
    if (!form) {
      throw new Error(`Form not found: ${formId}`);
    }
    
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowName}`);
    }
    
    // Record operation in context
    await this.context.recordOperation({
      type: 'workflow',
      formId,
      workflow: workflowName,
      timestamp: new Date().toISOString()
    });
    
    // Execute workflow steps
    let result = {};
    
    for (const step of workflow.steps) {
      // Check if step should be executed based on condition
      if (step.condition && !this.evaluateCondition(step.condition, result)) {
        continue;
      }
      
      // Execute step based on type
      if (step.type === 'transform') {
        result = {
          ...result,
          transform: await this.transform(formId, step.name)
        };
      } 
      else if (step.type === 'analyze') {
        result = {
          ...result,
          analysis: await this.analyze(formId, step.name)
        };
      }
    }
    
    return result;
  }
  
  /**
   * Simple condition evaluation
   */
  private evaluateCondition(condition: string, result: any): boolean {
    // Support for basic conditions
    if (condition === 'valid' && result.analysis) {
      return result.analysis.valid === true;
    }
    
    return true; // Default to true if condition is unknown
  }
  
  /**
   * Create a form using the engine
   */
  async createForm(definition: FormDefinition, data?: FormMatter): Promise<string> {
    const formId = this.formSystem.createForm(definition, data);
    
    // Record operation in context
    await this.context.recordOperation({
      type: 'create',
      formId,
      timestamp: new Date().toISOString()
    });
    
    return formId;
  }
  
  /**
   * Get a list of available transformers
   */
  getTransformers(): string[] {
    return Array.from(this.transformers.keys());
  }
  
  /**
   * Get a list of available analyzers
   */
  getAnalyzers(): string[] {
    return Array.from(this.analyzers.keys());
  }
  
  /**
   * Get a list of available workflows
   */
  getWorkflows(): string[] {
    return Array.from(this.workflows.keys());
  }
}

/**
 * Types for the FormEngine
 */
type TransformerFunction = (form: any) => any;
type AnalyzerFunction = (form: any) => any;

interface Workflow {
  name: string;
  steps: WorkflowStep[];
}

interface WorkflowStep {
  type: 'transform' | 'analyze';
  name: string;
  condition?: string;
}