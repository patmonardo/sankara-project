import EventEmitter from "events";
import { NeoEvent } from "./event";
import { NeoCore } from "./neo";
import { NeoComponentId } from "./extension";
import { NeoGraph } from "./graph";
import { NeoEntityService, NeoEntity } from "./entity";
import { NeoContextService, getActiveContext } from "./context";

/**
 * NeoForm - The Absolute Middle Mediating Machine
 *
 * Acts as the mediating mechanism between:
 * - BEC (Transcendental Logic)
 * - MVC (Ordinary Logic)
 * - NEO (Infrastructure)
 */
export class NeoForm {
  // Core references
  private core: NeoCore;
  private componentId: NeoComponentId;
  private graph: NeoGraph;

  // Event system
  private eventEmitter: EventEmitter = new EventEmitter();

  /**
   * Create a new NeoForm instance
   */
  constructor(options: {
    core: NeoCore;
    componentId?: NeoComponentId;
    graph?: NeoGraph;
  }) {
    // Set core reference (required)
    this.core = options.core;

    // Set component ID
    this.componentId = options.componentId || {
      id: `form:${Date.now()}`,
      type: "neo:form",
      name: "Neo Form",
    };

    // Set graph reference if provided
    this.graph = options.graph || this.core.graph;

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for form processing
   */
  private setupEventHandlers(): void {
    // Listen for form execution requests
    this.core.on("form", (event: NeoEvent) => {
      if (event.subtype === "execute") {
        this.handleFormExecutionEvent(event);
      }
    });
  }

  /**
   * Initialize the form system
   */
  async initialize(): Promise<void> {
    this.logVerbose("Initializing...");
    
    // Nothing else to initialize - we're just a processor
    
    this.logVerbose("Initialization complete");
  }

  /**
   * Execute a form with the given input
   * This is the core mediation function
   */
  async executeForm(
    formId: string,
    input: any,
    options: any = {}
  ): Promise<any> {
    this.logVerbose(`Executing form: ${formId}`);

    // Get form definition from core/graph
    const formDef = await this.getFormDefinition(formId);
    if (!formDef) {
      throw new Error(`Form not found: ${formId}`);
    }

    // Create execution context
    const contextId = options.contextId || (getActiveContext()?.id);
    const executionContext = {
      id: `form:exec:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`,
      formId,
      input,
      options,
      contextId,
      timestamp: Date.now(),
    };

    try {
      // Announce execution start
      this.emitEvent({
        type: "form",
        subtype: "execution:start",
        content: executionContext,
      });

      // 1. UNIVERSAL MOMENT (BEC) - Process through Transcendental Logic
      const becResult = await this.processBEC(formDef, input, executionContext);

      // 2. PARTICULAR MOMENT (MVC) - Process through Ordinary Logic
      const mvcResult = await this.processMVC(formDef, becResult, executionContext);

      // 3. INFRASTRUCTURE MOMENT (NEO) - Process through Infrastructure Logic
      const neoResult = await this.processNEO(
        formDef,
        becResult,
        mvcResult,
        executionContext
      );

      // 4. Combine results
      let result = {
        formId,
        contextId: executionContext.contextId,
        executionId: executionContext.id,
        success: true,
        universal: becResult, // Transcendental Logic result
        particular: mvcResult, // Ordinary Logic result
        infrastructure: neoResult, // Infrastructure Logic result
        entity: null as NeoEntity | null 
      };

      // 5. INDIVIDUAL MOMENT - Create NeoEntity if requested
      if (options.createEntity) {
        const entity = await this.createNeoEntity(formDef, result, executionContext);
        
        // Add entity to result
        result = {
          ...result,
          entity
        };
      }

      // Announce execution completion
      this.emitEvent({
        type: "form",
        subtype: "execution:complete",
        content: {
          executionId: executionContext.id,
          success: true,
          result,
        },
      });

      return result;
    } catch (error) {
      this.logVerbose(`Execution error: ${error}`);

      // Announce execution error
      this.emitEvent({
        type: "form",
        subtype: "execution:error",
        content: {
          executionId: executionContext.id,
          error,
        },
      });

      throw error;
    }
  }

  /**
   * Get a form definition from the system
   */
  private async getFormDefinition(formId: string): Promise<any> {
    // First check if we have a form extension that can provide this
    const formExt = this.core.getExtensionsByType('form:provider')
      .find((ext) => ext.capabilities?.includes('formDefinitions'));

    if (formExt) {
      // Ask extension for form definition
      try {
        return await this.requestFromExtension(formExt.id, 'form:get', { formId });
      } catch (err) {
        this.logVerbose(`Error getting form from extension: ${err}`);
        // Fall through to other methods
      }
    }

    // Next, try to get it from graph via a query
    if (this.graph) {
      try {
        // We'll assume forms are stored as entities with type 'form:definition'
        const formEntities = NeoEntityService.queryEntities({
          type: 'form:definition',
          properties: { id: formId }
        });

        if (formEntities.length > 0) {
          return formEntities[0].properties;
        }
      } catch (err) {
        this.logVerbose(`Error getting form from graph: ${err}`);
        // Fall through to default
      }
    }

    // No form found
    return null;
  }

  /**
   * Process through BEC (Universal/Transcendental Logic)
   */
  private async processBEC(
    formDef: any,
    input: any,
    context: any
  ): Promise<any> {
    this.logVerbose(`Processing BEC for form: ${formDef.id}`);

    // Find BEC extensions
    const becExtensions = this.core.getExtensionsByType('bec:processor')
      .filter(ext => ext.capabilities?.includes('becProcessing'));

    if (becExtensions.length === 0) {
      // Default BEC processing
      return this.defaultBECProcess(formDef, input, context);
    }

    // Process through available BEC extension
    try {
      const primaryProcessor = becExtensions[0];
      const result = await this.requestFromExtension(
        primaryProcessor.id,
        "bec:process",
        {
          formDef,
          input,
          context,
        }
      );

      return result || this.defaultBECProcess(formDef, input, context);
    } catch (error) {
      this.logVerbose(`Error in BEC processing: ${error}`);
      // Fall back to default processor
      return this.defaultBECProcess(formDef, input, context);
    }
  }

  /**
   * Process through MVC (Particular/Ordinary Logic)
   */
  private async processMVC(
    formDef: any,
    becResult: any,
    context: any
  ): Promise<any> {
    this.logVerbose(`Processing MVC for form: ${formDef.id}`);

    // Find MVC extensions
    const mvcExtensions = this.core.getExtensionsByType('mvc:processor')
      .filter(ext => ext.capabilities?.includes('mvcProcessing'));

    if (mvcExtensions.length === 0) {
      // Default MVC processing
      return this.defaultMVCProcess(formDef, becResult, context);
    }

    // Process through available MVC extension
    try {
      const primaryProcessor = mvcExtensions[0];
      const result = await this.requestFromExtension(
        primaryProcessor.id,
        "mvc:process",
        {
          formDef,
          becResult,
          context,
        }
      );

      return result || this.defaultMVCProcess(formDef, becResult, context);
    } catch (error) {
      this.logVerbose(`Error in MVC processing: ${error}`);
      // Fall back to default processor
      return this.defaultMVCProcess(formDef, becResult, context);
    }
  }

  /**
   * Process through NEO (Infrastructure Logic)
   */
  private async processNEO(
    formDef: any,
    becResult: any,
    mvcResult: any,
    context: any
  ): Promise<any> {
    this.logVerbose(`Processing NEO for form: ${formDef.id}`);

    // Find NEO extensions
    const neoExtensions = this.core.getExtensionsByType('neo:processor')
      .filter(ext => ext.capabilities?.includes('neoProcessing'));

    if (neoExtensions.length === 0) {
      // Default NEO processing
      return this.defaultNEOProcess(formDef, becResult, mvcResult, context);
    }

    // Process through available NEO extension
    try {
      const primaryProcessor = neoExtensions[0];
      const result = await this.requestFromExtension(
        primaryProcessor.id,
        "neo:process",
        {
          formDef,
          becResult,
          mvcResult,
          context,
        }
      );

      return result || this.defaultNEOProcess(formDef, becResult, mvcResult, context);
    } catch (error) {
      this.logVerbose(`Error in NEO processing: ${error}`);
      // Fall back to default processor
      return this.defaultNEOProcess(formDef, becResult, mvcResult, context);
    }
  }

  /**
   * Create NeoEntity from form results
   */
  private async createNeoEntity(
    formDef: any,
    result: any,
    context: any
  ): Promise<NeoEntity> {
    this.logVerbose(`Creating NeoEntity for form: ${formDef.id}`);

    // Create NeoEntity instance with BEC · MVC · NEO unity
    const entity = NeoEntityService.create({
      // BEC aspects
      being: result.universal.being,
      essence: result.universal.essence,
      concept: result.universal.concept,
      
      // MVC aspects
      model: result.particular.model,
      view: result.particular.view,
      controller: result.particular.controller,
      
      // NEO aspects
      core: result.infrastructure.core,
      dialectic: result.infrastructure.dialectic,
      context: result.infrastructure.context,
      
      // Identity properties
      id: context.options?.entityId || `entity:form:${formDef.id}:${Date.now()}`,
      type: formDef.entityType || "form:result",
      properties: {
        formId: formDef.id,
        formName: formDef.name,
        contextId: context.contextId,
        executionId: context.id,
        input: context.input,
        timestamp: Date.now()
      },
      contextId: context.contextId
    });

    // Persist if requested
    if (context.options?.persist) {
      entity.persist();
    }

    return entity;
  }

  /**
   * Default BEC processing
   */
  private async defaultBECProcess(
    formDef: any,
    input: any,
    context: any
  ): Promise<any> {
    // Extract schema from form definition
    const schema = formDef.schema || {};

    // Basic BEC processing
    const being = {
      type: "form:input",
      properties: { ...input },
      timestamp: Date.now(),
    };

    const essence = {
      relations: this.extractRelations(being, schema),
      reflection: this.determineReflection(being, schema),
    };

    const concept = {
      universal: this.determineUniversal(being, essence, schema),
      particular: this.determineParticular(being, essence, schema),
      individual: this.determineSingular(being, essence, schema),
    };

    return {
      being,
      essence,
      concept,
      _processed: true,
      _timestamp: Date.now(),
    };
  }

  /**
   * Default MVC processing
   */
  private async defaultMVCProcess(
    formDef: any,
    becResult: any,
    context: any
  ): Promise<any> {
    // Extract views from form definition
    const viewDefs = formDef.views || {};

    // Basic MVC processing
    const model = {
      data: becResult,
      schema: formDef.schema || {},
    };

    const view = {
      template: viewDefs.default || "default",
      components: this.generateComponents(model, viewDefs),
    };

    const controller = {
      actions: formDef.actions || [],
      validators: formDef.validators || [],
      transformers: formDef.transformers || [],
    };

    return {
      model,
      view,
      controller,
      _processed: true,
      _timestamp: Date.now(),
    };
  }

  /**
   * Default NEO processing
   */
  private async defaultNEOProcess(
    formDef: any,
    becResult: any,
    mvcResult: any,
    context: any
  ): Promise<any> {
    // Basic NEO processing
    const core = {
      type: "form:result",
      schema: formDef.schema,
      data: {
        ...becResult,
        ...mvcResult,
      },
    };

    const dialectic = {
      thesis: { being: becResult.being },
      antithesis: { view: mvcResult.view },
      synthesis: {
        result: {
          bec: becResult,
          mvc: mvcResult,
        },
      },
    };

    // Create a contextual reference
    const contextRef = context.contextId ? 
      NeoContextService.getContext(context.contextId) : 
      getActiveContext();

    return {
      core,
      dialectic,
      context: contextRef ? {
        id: contextRef.id,
        type: contextRef.type,
        active: contextRef.active
      } : null,
      _processed: true,
      _timestamp: Date.now(),
    };
  }

  /**
   * Helper methods for default implementations
   */
  private extractRelations(being: any, schema: any): any[] {
    const relations = [];

    // Extract relations based on schema
    if (schema.relations) {
      for (const relation of schema.relations) {
        relations.push({
          type: relation.type,
          source: relation.source,
          target: relation.target,
          properties: {},
        });
      }
    }

    return relations;
  }

  private determineReflection(being: any, schema: any): any {
    return {
      type: schema.type || "unknown",
      qualities: {},
    };
  }

  private determineUniversal(being: any, essence: any, schema: any): any {
    return {
      category: schema.category || "default",
      properties: {},
    };
  }

  private determineParticular(being: any, essence: any, schema: any): any {
    return {
      instance: {
        type: essence.reflection?.type || "unknown",
        id: being.id || `entity:${Date.now()}`,
      },
      properties: {},
    };
  }

  private determineSingular(being: any, essence: any, schema: any): any {
    return {
      concrete: {
        type: essence.reflection?.type || "unknown",
        id: being.id || `entity:${Date.now()}`,
      },
      properties: {},
    };
  }

  private generateComponents(model: any, viewDefs: any): any[] {
    const components = [];

    // Generate components based on viewDefs
    if (viewDefs.components) {
      for (const compDef of viewDefs.components) {
        components.push({
          type: compDef.type,
          props: compDef.props || {},
          children: compDef.children || [],
        });
      }
    }

    return components;
  }

  /**
   * Handle form execution event from NeoCore
   */
  private handleFormExecutionEvent(event: NeoEvent): void {
    const { formId, input, options } = event.content || {};

    if (!formId) {
      this.emitEvent({
        type: "form",
        subtype: "execution:error",
        content: {
          error: "No formId provided",
          requestId: event.id
        },
      });
      return;
    }

    // Execute form
    this.executeForm(formId, input, options)
      .then((result) => {
        // Send response
        this.emitEvent({
          type: "form",
          subtype: "execution:response",
          content: { 
            result,
            requestId: event.id 
          },
        });
      })
      .catch((error) => {
        // Send error
        this.emitEvent({
          type: "form",
          subtype: "execution:error",
          content: {
            error: error.message || "Form execution failed",
            requestId: event.id
          },
        });
      });
  }

  /**
   * Make a request to an extension and wait for a response
   */
  private requestFromExtension(
    extensionId: string | NeoComponentId,
    type: string,
    content: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // Generate request ID
      const requestId = `req:${Date.now()}:${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      // Set up listener for response
      const cleanup = this.core.on(`${type}:response`, (event) => {
        if (event.content?.requestId === requestId) {
          cleanup(); // Remove listener
          errorCleanup(); // Remove error listener
          resolve(event.content?.result);
        }
      });

      // Set up listener for error
      const errorCleanup = this.core.on(`${type}:error`, (event) => {
        if (event.content?.requestId === requestId) {
          cleanup(); // Remove listener
          errorCleanup(); // Remove error listener
          reject(new Error(event.content?.error || "Unknown error"));
        }
      });

      // Send request to extension
      this.core.sendToExtension(extensionId, type, {
        ...content,
        requestId
      });

      // Set timeout
      setTimeout(() => {
        cleanup();
        errorCleanup();
        reject(new Error(`Request timed out`));
      }, 10000); // 10 second timeout
    });
  }

  /**
   * Emit an event through the core
   */
  private emitEvent(event: {
    type: string;
    subtype: string;
    content: any;
  }): void {
    this.core.emit({
      type: event.type,
      subtype: event.subtype,
      source: this.componentId,
      content: event.content,
    });
    
    // Also emit locally
    this.eventEmitter.emit(event.type, event);
    this.eventEmitter.emit(`${event.type}:${event.subtype}`, event);
  }

  /**
   * Log message if verbose mode is enabled
   */
  private logVerbose(message: string): void {
    if (this.core.getConfig<boolean>('verbose', false)) {
      console.log(`[NeoForm] ${message}`);
    }
  }

  /**
   * Clean up resources
   */
  async shutdown(): Promise<void> {
    this.logVerbose("Shutting down...");
    
    // Remove all event listeners
    this.eventEmitter.removeAllListeners();
    
    this.logVerbose("Shutdown complete");
  }
}

/**
 * Create a new NeoForm instance
 */
export function createNeoForm(options: {
  core: NeoCore;
  componentId?: NeoComponentId;
  graph?: NeoGraph;
}): NeoForm {
  return new NeoForm(options);
}