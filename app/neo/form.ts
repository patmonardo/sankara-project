import EventEmitter from "events";
import { NeoEvent } from "./event";
import { NeoCore } from "./neo";
import { NeoExtension, NeoComponentId } from "./dialectic";
import { NeoGraph } from "./graph";
import { NeoNode } from "./node";

/**
 * NeoForm - The Absolute Middle Mediating Machine
 *
 * Acts as the mediating mechanism between:
 * - BEC (Transcendental Logic)
 * - MVC (Ordinary Logic)
 * - NEO (Infrastructure)
 *
 * To produce NeoNode as concrete universal
 */
export class NeoForm {
  // Core references
  private core: NeoCore | null = null;
  private componentId: NeoComponentId;
  private graph: NeoGraph | null = null;

  // Form storage
  private forms: Map<string, NeoForm> = new Map();

  // Event system
  private eventEmitter: EventEmitter = new EventEmitter();

  // Extensions
  private extensions: Map<NeoComponentId, NeoExtension> = new Map();

  /**
   * Create a new NeoForm instance
   */
  constructor(options: {
    core: NeoCore;
    componentId: NeoComponentId;
    graph: NeoGraph;
  }) {
    // Set component ID
    this.componentId = options.componentId || {
      id: `form:${Date.now()}`,
      type: "neo:form",
      name: "Neo Form",
    };

    // Set core reference if provided
    if (options.core) {
      this.setCore(options.core);
    }

    // Set graph reference if provided
    if (options.graph) {
      this.setGraph(options.graph);
    }
  }

  /**
   * Set NeoCore reference
   */
  setCore(core: NeoCore): void {
    this.core = core;

    // Register form with core if needed
    if (core) {
      try {
        // Register as extension if core supports it
        if (typeof core.registerExtension === "function") {
          core.registerExtension(this.createFormExtension());
        }
      } catch (error) {
        console.warn("[NeoForm] Failed to register with core:", error);
      }
    }
  }

  /**
   * Set NeoGraph reference
   */
  setGraph(graph: NeoGraph): void {
    this.graph = graph;
  }

  /**
   * Initialize the form system
   */
  async initialize(): Promise<void> {
    console.log("[NeoForm] Initializing...");

    // Initialize extensions
    for (const extension of this.extensions.values()) {
      if (typeof extension.initialize === "function") {
        await extension.initialize(this.core!);
      }
    }

    // Load forms from graph if available
    if (this.graph) {
      await this.loadFormsFromGraph();
    }

    console.log("[NeoForm] Initialization complete");
  }

  /**
   * Register a form definition
   */
  registerForm(formDef: any): void {
    // Validate form definition
    if (!formDef.id) {
      throw new Error("Form definition must have an id");
    }

    console.log(`[NeoForm] Registering form: ${formDef.id}`);

    // Store form
    this.forms.set(formDef.id, formDef);

    // Emit form registration event
    this.emit({
      id: `form:${formDef.id}`,
      type: "form",
      subtype: "registered",
      source: this.componentId,
      timestamp: Date.now(),
      content: {
        formId: formDef.id,
        formType: formDef.type,
      },
    });

    // Persist to graph if available
    if (this.graph) {
      this.emit({
        id: `form:${formDef.id}`,
        type: "form",
        subtype: "definition:create",
        source: this.componentId,
        timestamp: Date.now(),
        content: formDef,
      });
    }
  }

  /**
   * Register an extension
   */
  registerExtension(extension: NeoExtension): void {
    if (!extension.id) {
      throw new Error("Extension must have an id");
    }

    console.log(`[NeoForm] Registering extension: ${extension.id}`);

    // Register extension
    this.extensions.set(extension.id, extension);

    // Initialize if we're already initialized
    if (this.core) {
      extension.initialize(this.core);
    }
  }

  /**
   * Get a registered form
   */
  getForm(formId: string): any {
    return this.forms.get(formId);
  }

  /**
   * Get all registered forms
   */
  getForms(): any[] {
    return Array.from(this.forms.values());
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
    console.log(`[NeoForm] Executing form: ${formId}`);

    // Get form definition
    const formDef = this.forms.get(formId);
    if (!formDef) {
      if (options.allowMissing) {
        // Try to load from graph
        if (this.graph) {
          try {
            const graphForm = await this.loadFormFromGraph(formId);
            if (graphForm) {
              this.forms.set(formId, graphForm);
              return this.executeForm(formId, input, options);
            }
          } catch (error) {
            console.warn(`[NeoForm] Error loading form from graph: ${error}`);
          }
        }
      }

      throw new Error(`Form not found: ${formId}`);
    }

    // Create execution context
    const context = {
      id:
        options.contextId ||
        `form:exec:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`,
      formId,
      input,
      options,
      timestamp: Date.now(),
    };

    try {
      // Announce execution start
      this.emit({
        id: `form:${formId}`,
        type: "form",
        subtype: "execution:start",
        source: this.componentId,
        timestamp: Date.now(),
        content: context,
      });

      // 1. UNIVERSAL MOMENT (BEC) - Process through Transcendental Logic
      const becResult = await this.processBEC(formDef, input, context);

      // 2. PARTICULAR MOMENT (MVC) - Process through Ordinary Logic
      const mvcResult = await this.processMVC(formDef, becResult, context);

      // 3. INFRASTRUCTURE MOMENT (NEO) - Process through Infrastructure Logic
      const neoResult = await this.processNEO(
        formDef,
        becResult,
        mvcResult,
        context
      );

      // 4. Combine results
      let result = {
        formId,
        contextId: context.id,
        success: true,
        universal: becResult, // Transcendental Logic result
        particular: mvcResult, // Ordinary Logic result
        infrastructure: neoResult, // Infrastructure Logic result
        node: null as NeoNode | null 
      };

      // 5. INDIVIDUAL MOMENT - Create NeoNode if requested
      if (options.createNode) {
        const node = await this.createNeoNode(formDef, result, context);
        
        // Add node to result
        result = {
          ...result,
          node: node
        };
      
        // Persist node if graph is available
        if (this.graph && options.persistNode) {
          this.emit({
            id: `form:${formId}`,
            type: "graph",
            subtype: "node:create",
            source: this.componentId,
            timestamp: Date.now(),
            content: { node },
          });
        }
      }

      // Announce execution completion
      this.emit({
        id: `form:${formId}`,
        type: "form",
        subtype: "execution:complete",
        source: this.componentId,
        timestamp: Date.now(),
        content: {
          contextId: context.id,
          success: true,
          result,
        },
      });

      return result;
    } catch (error) {
      console.error(`[NeoForm] Execution error:`, error);

      // Announce execution error
      this.emit({
        id: `form:${formId}`,
        type: "form",
        subtype: "execution:error",
        source: this.componentId,
        timestamp: Date.now(),
        content: {
          contextId: context.id,
          error: error,
        },
      });

      throw error;
    }
  }

  /**
   * Process through BEC (Universal/Transcendental Logic)
   */
  private async processBEC(
    formDef: any,
    input: any,
    context: any
  ): Promise<any> {
    console.log(`[NeoForm] Processing BEC for form: ${formDef.id}`);

    // Find BEC extensions
    const becExtensions = Array.from(this.extensions.values()).filter((ext) =>
      ext.capabilities?.includes("becProcessing")
    );

    if (becExtensions.length === 0) {
      console.log("[NeoForm] No BEC extensions found, using default processor");

      // Default BEC processing
      return this.defaultBECProcess(formDef, input, context);
    }

    // Process through all BEC extensions
    let becResult = { ...input };
    for (const extension of becExtensions) {
      try {
        // Send processing event to extension
        const result = await this.processWithExtension(
          extension.id,
          "bec:process",
          {
            formDef,
            input: becResult,
            context,
          }
        );

        becResult = result || becResult;
      } catch (error) {
        console.warn(
          `[NeoForm] Error in BEC processing with extension ${extension.id}:`,
          error
        );
      }
    }

    return {
      being: becResult.being || {},
      essence: becResult.essence || {},
      concept: becResult.concept || {},
      _processed: true,
      _timestamp: Date.now(),
    };
  }

  /**
   * Process through MVC (Particular/Ordinary Logic)
   */
  private async processMVC(
    formDef: any,
    becResult: any,
    context: any
  ): Promise<any> {
    console.log(`[NeoForm] Processing MVC for form: ${formDef.id}`);

    // Find MVC extensions
    const mvcExtensions = Array.from(this.extensions.values()).filter((ext) =>
      ext.capabilities?.includes("mvcProcessing")
    );

    if (mvcExtensions.length === 0) {
      console.log("[NeoForm] No MVC extensions found, using default processor");

      // Default MVC processing
      return this.defaultMVCProcess(formDef, becResult, context);
    }

    // Process through all MVC extensions
    let mvcResult = { ...becResult };
    for (const extension of mvcExtensions) {
      try {
        // Send processing event to extension
        const result = await this.processWithExtension(
          extension.id,
          "mvc:process",
          {
            formDef,
            becResult,
            context,
          }
        );

        mvcResult = result || mvcResult;
      } catch (error) {
        console.warn(
          `[NeoForm] Error in MVC processing with extension ${extension.id}:`,
          error
        );
      }
    }

    return {
      model: mvcResult.model || {},
      view: mvcResult.view || {},
      controller: mvcResult.controller || {},
      _processed: true,
      _timestamp: Date.now(),
    };
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
    console.log(`[NeoForm] Processing NEO for form: ${formDef.id}`);

    // Find NEO extensions
    const neoExtensions = Array.from(this.extensions.values()).filter((ext) =>
      ext.capabilities?.includes("neoProcessing")
    );

    if (neoExtensions.length === 0) {
      console.log("[NeoForm] No NEO extensions found, using default processor");

      // Default NEO processing
      return this.defaultNEOProcess(formDef, becResult, mvcResult, context);
    }

    // Process through all NEO extensions
    let neoResult = { ...mvcResult };
    for (const extension of neoExtensions) {
      try {
        // Send processing event to extension
        const result = await this.processWithExtension(
          extension.id,
          "neo:process",
          {
            formDef,
            becResult,
            mvcResult,
            context,
          }
        );

        neoResult = result || neoResult;
      } catch (error) {
        console.warn(
          `[NeoForm] Error in NEO processing with extension ${extension.id}:`,
          error
        );
      }
    }

    return {
      core: neoResult.core || {},
      dialectic: neoResult.dialectic || {},
      graph: neoResult.graph || {},
      _processed: true,
      _timestamp: Date.now(),
    };
  }
  // In the createNeoNode method of NeoForm class:

  /**
   * Create NeoNode from form results
   */
  private async createNeoNode(
    formDef: any,
    result: any,
    context: any
  ): Promise<NeoNode> {
    console.log(`[NeoForm] Creating NeoNode for form: ${formDef.id}`);

    // Create NeoNode instance
    const node = NeoNode.create({
      // BEC aspects - from universal result
      being: {
        process: (input: any) => result.universal.being,
      },
      essence: {
        process: (being: any, input: any) => result.universal.essence,
      },
      concept: {
        process: (being: any, essence: any, input: any) =>
          result.universal.concept,
      },

      // MVC aspects - from particular result
      model: {
        process: (input: any) => result.particular.model,
      },
      view: {
        process: (model: any, input: any) => result.particular.view,
      },
      controller: {
        process: (model: any, view: any, input: any) =>
          result.particular.controller,
      },

      // NEO aspects - from infrastructure result
      core: {
        process: (input: any) => result.infrastructure.core,
      },
      dialectic: {
        process: (core: any, input: any) => result.infrastructure.dialectic,
      },
      graph: {
        process: (dialectic: any, core: any, input: any) =>
          result.infrastructure.graph,
      },
    });

    // Set node properties
    node.id =
      context.options?.nodeId || `node:form:${formDef.id}:${Date.now()}`;
    node.type = formDef.nodeType || "form:result";
    node.data = {
      formId: formDef.id,
      contextId: context.id,
      input: context.input,
      timestamp: Date.now(),
    };

    return node;
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

    const graph = {
      nodes: [
        {
          id: `node:form:${formDef.id}:${Date.now()}`,
          type: "form:result",
          properties: {
            formId: formDef.id,
            timestamp: Date.now(),
          },
        },
      ],
      edges: [],
    };

    return {
      core,
      dialectic,
      graph,
      _processed: true,
      _timestamp: Date.now(),
    };
  }

  /**
   * Helper: Extract relations from being
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

  /**
   * Helper: Determine reflection
   */
  private determineReflection(being: any, schema: any): any {
    return {
      type: schema.type || "unknown",
      qualities: {},
    };
  }

  /**
   * Helper: Determine universal
   */
  private determineUniversal(being: any, essence: any, schema: any): any {
    return {
      category: schema.category || "default",
      properties: {},
    };
  }

  /**
   * Helper: Determine particular
   */
  private determineParticular(being: any, essence: any, schema: any): any {
    return {
      instance: {
        type: essence.reflection?.type || "unknown",
        id: being.id || `entity:${Date.now()}`,
      },
      properties: {},
    };
  }

  /**
   * Helper: Determine individual
   */
  private determineSingular(being: any, essence: any, schema: any): any {
    return {
      concrete: {
        type: essence.reflection?.type || "unknown",
        id: being.id || `entity:${Date.now()}`,
      },
      properties: {},
    };
  }

  /**
   * Helper: Generate view components
   */
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
   * Load forms from graph
   */
  private async loadFormsFromGraph(): Promise<void> {
    if (!this.graph) return;

    try {
      console.log("[NeoForm] Loading forms from graph...");

      // Use graph extension if available
      const graphExt = Array.from(this.extensions.values()).find((ext) =>
        ext.capabilities?.includes("formDefinitions")
      );

      if (graphExt) {
        const forms = await this.processWithExtension(
          graphExt.id,
          "forms:get",
          {}
        );

        if (Array.isArray(forms)) {
          for (const form of forms) {
            this.forms.set(form.id, form);
          }
          console.log(`[NeoForm] Loaded ${forms.length} forms from graph`);
        }
      }
    } catch (error) {
      console.warn("[NeoForm] Error loading forms from graph:", error);
    }
  }

  /**
   * Load form from graph
   */
  private async loadFormFromGraph(formId: string): Promise<any> {
    if (!this.graph) return null;

    try {
      console.log(`[NeoForm] Loading form from graph: ${formId}`);

      // Use graph extension if available
      const graphExt = Array.from(this.extensions.values()).find((ext) =>
        ext.capabilities?.includes("formDefinitions")
      );

      if (graphExt) {
        const form = await this.processWithExtension(graphExt.id, "form:get", {
          formId,
        });

        if (form) {
          return form;
        }
      }

      return null;
    } catch (error) {
      console.warn(`[NeoForm] Error loading form ${formId} from graph:`, error);
      return null;
    }
  }

  /**
   * Process with extension
   */
  private processWithExtension(
    extensionId: NeoComponentId,
    type: string,
    content: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // Generate request ID
      const requestId = `req:${Date.now()}:${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      // Set up listener for response
      const cleanup = this.on(`${type}:response`, (event) => {
        if (event.relations?.requestId === requestId) {
          cleanup(); // Remove listener
          resolve(event.content?.result);
        }
      });

      // Set up listener for error
      const errorCleanup = this.on(`${type}:error`, (event) => {
        if (event.relations?.requestId === requestId) {
          cleanup(); // Remove listener
          errorCleanup(); // Remove error listener
          reject(new Error(event.content?.error || "Unknown error"));
        }
      });

      // Send request to extension
      this.emit({
        type: "extension",
        subtype: type,
        target: extensionId,
        source: this.componentId,
        id: requestId,
        timestamp: Date.now(),
        content,
      });

      // Set timeout
      setTimeout(() => {
        cleanup();
        errorCleanup();
        reject(new Error(`Request to extension ${extensionId} timed out`));
      }, 10000); // 10 second timeout
    });
  }

  /**
   * Register node type with form system
   */
  registerNodeType(nodeType: any): void {
    // Placeholder for node type registration
    console.log(`[NeoForm] Registered node type: ${nodeType.name}`);
  }

  /**
   * Create form extension for NeoCore
   */
  private createFormExtension(): NeoExtension {
    return {
      id: this.componentId,
      type: "neo:form",
      capabilities: [
        "formProcessing",
        "nodeCreation",
        "becProcessing",
        "mvcProcessing",
        "neoProcessing",
      ],

      initialize: (core: NeoCore) => {
        console.log("[NeoForm] Initializing as NeoCore extension");
      },

      handleEvent: (event: NeoEvent) => {
        switch (event.subtype) {
          case "execute":
            this.handleFormExecutionEvent(event);
            break;

          case "register":
            this.handleFormRegistrationEvent(event);
            break;

          default:
            // Forward to event handler
            this.eventEmitter.emit(event.type, event);
            this.eventEmitter.emit(`${event.type}:${event.subtype}`, event);
        }
      },
    };
  }

  /**
   * Handle form execution event from NeoCore
   */
  private handleFormExecutionEvent(event: NeoEvent): void {
    const { formId, input, options } = event.content || {};

    if (!formId) {
      this.emit({
        id: `form:${Date.now()}`,
        type: "form",
        subtype: "execution:error",
        source: this.componentId,
        timestamp: Date.now(),
        content: {
          error: "No formId provided",
        },
        relations: { requestId: event.id },
      });
      return;
    }

    // Execute form
    this.executeForm(formId, input, options)
      .then((result) => {
        // Send response
        this.emit({
          id: `form:${Date.now()}`,
          type: "form",
          subtype: "execution:response",
          source: this.componentId,
          timestamp: Date.now(),
          content: { result },
          relations: { requestId: event.id },
        });
      })
      .catch((error) => {
        // Send error
        this.emit({
          id: `form:${Date.now()}`,
          type: "form",
          subtype: "execution:error",
          source: this.componentId,
          timestamp: Date.now(),
          content: {
            error: error,
          },
          relations: { requestId: event.id },
        });
      });
  }

  /**
   * Handle form registration event from NeoCore
   */
  private handleFormRegistrationEvent(event: NeoEvent): void {
    const formDef = event.content;

    if (!formDef || !formDef.id) {
      this.emit({
        id: `form:${Date.now()}`,
        type: "form",
        subtype: "registration:error",
        source: this.componentId,
        timestamp: Date.now(),
        content: {
          error: "Invalid form definition",
        },
        relations: { requestId: event.id },
      });
      return;
    }

    // Register form
    try {
      this.registerForm(formDef);

      // Send response
      this.emit({
        id: `form:${Date.now()}`,
        type: "form",
        subtype: "registration:response",
        source: this.componentId,
        timestamp: Date.now(),
        content: {
          formId: formDef.id,
        },
        relations: { requestId: event.id },
      });
    } catch (error) {
      // Send error
      this.emit({
        id: `form:${Date.now()}`,
        type: "form",
        subtype: "registration:error",
        source: this.componentId,
        timestamp: Date.now(),
        content: {
          error: error,
          formId: formDef.id,
        },
        relations: { requestId: event.id },
      });
    }
  }

  /**
   * Emit an event
   */
  emit(event: NeoEvent): void {
    // Ensure event has required properties
    const completeEvent = {
      ...event,
      id:
        event.id ||
        `event:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`,
      source: event.source || this.componentId,
      timestamp: event.timestamp || Date.now(),
    };

    // If we have a core reference, emit through core
    if (this.core) {
      this.core.protocol.emit(completeEvent);
    }

    // Also emit locally
    this.eventEmitter.emit(event.type, completeEvent);
    this.eventEmitter.emit(`${event.type}:${event.subtype}`, completeEvent);
  }

  /**
   * Listen for events
   */
  on(eventType: string, handler: (event: NeoEvent) => void): () => void {
    this.eventEmitter.on(eventType, handler);

    // Return cleanup function
    return () => {
      this.eventEmitter.off(eventType, handler);
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    console.log("[NeoForm] Cleaning up...");

    // Clean up extensions in reverse order
    const extensions = Array.from(this.extensions.values());
    for (let i = extensions.length - 1; i >= 0; i--) {
      const extension = extensions[i];
      if (typeof (extension as any).cleanup === "function") {
        await (extension as any).cleanup();
      }
    }

    // Clear forms
    this.forms.clear();

    // Remove all event listeners
    this.eventEmitter.removeAllListeners();

    console.log("[NeoForm] Cleanup complete");
  }
}

/**
 * Create a new NeoForm instance
 */
export function createNeoForm(options: {
  core: NeoCore;
  componentId: NeoComponentId;
  graph: NeoGraph;
}): NeoForm {
  return new NeoForm(options);
}
