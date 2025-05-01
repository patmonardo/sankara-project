import { NeoCore, NeoExtension } from '../neo';
import { NeoEvent } from '../event';

/**
 * MVC Extension - Model-View-Controller Pattern
 * 
 * Implements the architectural pattern for Neo:
 * - Model: Data and business logic
 * - View: Presentation and formatting
 * - Controller: User input and application control
 */
export class MVCExtension implements NeoExtension {
  id = 'mvc';
  type = 'architecture';
  capabilities = [
    'modelGeneration',    // Generate data models
    'viewRendering',      // Render views
    'controllerBinding',  // Bind controllers to models and views
    'stateManagement'     // Manage application state
  ];
  
  private core: NeoCore | null = null;
  private models: Map<string, any> = new Map();
  private views: Map<string, any> = new Map();
  private controllers: Map<string, any> = new Map();
  
  /**
   * Initialize with Neo core
   */
  initialize(core: NeoCore): void {
    this.core = core;
    
    console.log('[MVC] Initializing architectural pattern');
    
    // Set up event handlers
    this.setupEventHandlers();
  }
  
  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    if (!this.core) return;
    
    // Listen for model events
    this.core.dialectic.onEvent('model:create', (event) => {
      this.createModel(event.content.model);
    });
    
    // Listen for view events
    this.core.dialectic.onEvent('view:create', (event) => {
      this.createView(event.content.view);
    });
    
    // Listen for controller events
    this.core.dialectic.onEvent('controller:create', (event) => {
      this.createController(event.content.controller);
    });
    
    // Listen for entity events to extract MVC
    this.core.dialectic.onEvent('entity-created', (event) => {
      this.handleEntityEvent(event);
    });
    
    // Listen for BEC processed events
    this.core.dialectic.onEvent('bec:processed', (event) => {
      this.processEntityMVC(event.content.entityId, event.content);
    });
  }
  
  /**
   * Handle entity events
   */
  private handleEntityEvent(event: any): void {
    const { entityId } = event.content || {};
    if (!entityId) return;
    
    // Check if this is an MVC entity
    const entity = this.core?.dialectic.getEntity(entityId);
    if (!entity) return;
    
    if (entity.type === 'model') {
      this.createModel(entity);
      return;
    }
    
    if (entity.type === 'view') {
      this.createView(entity);
      return;
    }
    
    if (entity.type === 'controller') {
      this.createController(entity);
      return;
    }
  }
  
  /**
   * Create a model
   */
  createModel(model: any): void {
    if (!model?.id) return;
    
    console.log(`[MVC] Creating model: ${model.id}`);
    
    // Register the model
    this.models.set(model.id, model);
    
    // Emit model created event
    this.core?.dialectic.emit({
      type: 'mvc',
      subtype: 'model-created',
      content: {
        modelId: model.id,
        fields: model.fields || []
      }
    });
  }
  
  /**
   * Create a view
   */
  createView(view: any): void {
    if (!view?.id) return;
    
    console.log(`[MVC] Creating view: ${view.id}`);
    
    // Register the view
    this.views.set(view.id, view);
    
    // Emit view created event
    this.core?.dialectic.emit({
      type: 'mvc',
      subtype: 'view-created',
      content: {
        viewId: view.id,
        components: view.components || []
      }
    });
    
    // If the view is linked to a model, render it
    if (view.modelId && this.models.has(view.modelId)) {
      const model = this.models.get(view.modelId);
      this.renderView(view.id, model);
    }
  }
  
  /**
   * Create a controller
   */
  createController(controller: any): void {
    if (!controller?.id) return;
    
    console.log(`[MVC] Creating controller: ${controller.id}`);
    
    // Register the controller
    this.controllers.set(controller.id, controller);
    
    // Emit controller created event
    this.core?.dialectic.emit({
      type: 'mvc',
      subtype: 'controller-created',
      content: {
        controllerId: controller.id,
        actions: controller.actions || []
      }
    });
    
    // Bind the controller to model and view
    if (controller.modelId && controller.viewId) {
      this.bindController(
        controller.id,
        controller.modelId,
        controller.viewId
      );
    }
  }
  
  /**
   * Render a view with model data
   */
  renderView(viewId: string, model: any): any {
    const view = this.views.get(viewId);
    if (!view) return null;
    
    console.log(`[MVC] Rendering view ${viewId} with model data`);
    
    // Apply model data to view components
    const renderedView = this.applyModelToView(view, model);
    
    // Emit view rendered event
    this.core?.dialectic.emit({
      type: 'mvc',
      subtype: 'view-rendered',
      content: {
        viewId,
        modelId: model.id,
        renderedView
      }
    });
    
    return renderedView;
  }
  
  /**
   * Bind a controller to a model and view
   */
  bindController(controllerId: string, modelId: string, viewId: string): void {
    const controller = this.controllers.get(controllerId);
    const model = this.models.get(modelId);
    const view = this.views.get(viewId);
    
    if (!controller || !model || !view) {
      console.error(`[MVC] Cannot bind controller: ${controllerId}, ${modelId}, ${viewId}`);
      return;
    }
    
    console.log(`[MVC] Binding controller ${controllerId} to model ${modelId} and view ${viewId}`);
    
    // Create bindings
    const bindings = this.createBindings(controller, model, view);
    
    // Update controller with bindings
    controller.bindings = bindings;
    this.controllers.set(controllerId, controller);
    
    // Emit controller bound event
    this.core?.dialectic.emit({
      type: 'mvc',
      subtype: 'controller-bound',
      content: {
        controllerId,
        modelId,
        viewId,
        bindings
      }
    });
  }
  
  /**
   * Apply model data to view
   */
  private applyModelToView(view: any, model: any): any {
    // Clone view to avoid modifying the original
    const renderedView = { ...view, components: [] };
    
    // Apply model data to each component
    renderedView.components = (view.components || []).map((component: any) => {
      const renderedComponent = { ...component };
      
      // Handle different component types
      if (component.type === 'field' && component.bind && model.fields) {
        const field = model.fields.find((f: any) => f.name === component.bind);
        if (field) {
          renderedComponent.value = field.value || field.defaultValue;
          renderedComponent.label = field.label || component.label;
        }
      }
      
      // Handle display components
      if (component.type === 'display' && component.bind && model.properties) {
        renderedComponent.value = model.properties[component.bind] || '';
      }
      
      // Handle list components
      if (component.type === 'list' && component.bind && model[component.bind]) {
        renderedComponent.items = model[component.bind];
      }
      
      return renderedComponent;
    });
    
    // Add metadata
    renderedView.metadata = {
      ...view.metadata,
      renderedAt: Date.now(),
      modelId: model.id
    };
    
    return renderedView;
  }
  
  /**
   * Create bindings between controller, model, and view
   */
  private createBindings(controller: any, model: any, view: any): any {
    const bindings: any = {
      actions: {},
      fields: {},
      events: {}
    };
    
    // Bind controller actions to model methods
    (controller.actions || []).forEach((action: any) => {
      bindings.actions[action.id] = {
        type: action.type,
        handler: action.handler,
        modelMethod: model.methods?.[action.handler] ? action.handler : null
      };
    });
    
    // Bind view fields to model fields
    (view.components || []).filter((c: any) => c.type === 'field').forEach((field: any) => {
      if (field.bind) {
        const modelField = (model.fields || []).find((f: any) => f.name === field.bind);
        if (modelField) {
          bindings.fields[field.id || field.bind] = {
            viewField: field.bind,
            modelField: modelField.name,
            twoWay: field.twoWay || false
          };
        }
      }
    });
    
    // Bind view events to controller actions
    (view.components || []).filter((c: any) => c.events).forEach((component: any) => {
      Object.entries(component.events || {}).forEach(([eventName, actionId]) => {
        if (typeof actionId === 'string' && controller.actions.some((a: any) => a.id === actionId)) {
          bindings.events[`${component.id || 'component'}:${eventName}`] = actionId;
        }
      });
    });
    
    return bindings;
  }
  
  /**
   * Process entity through MVC
   */
  async processEntityMVC(entityId: string, becResult?: any): Promise<void> {
    if (!this.core) return;
    
    const entity = this.core.dialectic.getEntity(entityId);
    if (!entity) return;
    
    console.log(`[MVC] Processing entity ${entityId} through MVC pattern`);
    
    // Use BEC result if provided, otherwise process entity directly
    const bec = becResult || {
      being: {},
      essence: {},
      concept: {}
    };
    
    // Generate Model from Being
    const model = this.generateModel(entity, bec.being);
    
    // Generate View from Essence
    const view = this.generateView(entity, bec.essence);
    
    // Generate Controller from Concept
    const controller = this.generateController(entity, bec.concept);
    
    // Store MVC results
    this.models.set(model.id, model);
    this.views.set(view.id, view);
    this.controllers.set(controller.id, controller);
    
    // Create relations between MVC components and the entity
    this.core.dialectic.createRelation(
      entityId,
      model.id,
      'has-model',
      { generatedBy: 'mvc', timestamp: Date.now() }
    );
    
    this.core.dialectic.createRelation(
      entityId,
      view.id,
      'has-view',
      { generatedBy: 'mvc', timestamp: Date.now() }
    );
    
    this.core.dialectic.createRelation(
      entityId,
      controller.id,
      'has-controller',
      { generatedBy: 'mvc', timestamp: Date.now() }
    );
    
    // Bind controller to model and view
    this.bindController(controller.id, model.id, view.id);
    
    // Create MVC record in the entity
    this.core.dialectic.updateEntity(entityId, {
      metadata: {
        ...entity.metadata,
        mvc: {
          modelId: model.id,
          viewId: view.id,
          controllerId: controller.id,
          processed: true,
          timestamp: Date.now()
        }
      }
    });
    
    // Emit MVC processed event
    this.core.dialectic.emit({
      type: 'mvc',
      subtype: 'processed',
      content: {
        entityId,
        model,
        view,
        controller
      }
    });
  }
  
  /**
   * Generate Model from entity and Being
   */
  private generateModel(entity: any, being: any): any {
    const id = `model:${entity.id}:${Date.now()}`;
    
    // Generate fields from entity properties
    const fields = Object.entries(entity.properties || {}).map(([key, value]) => ({
      name: key,
      label: this.humanizeFieldName(key),
      type: this.inferFieldType(value),
      defaultValue: value
    }));
    
    // Create model entity
    return {
      id,
      type: 'model',
      name: `Model for ${entity.type} ${entity.id}`,
      entityType: entity.type,
      entityId: entity.id,
      fields,
      methods: this.generateModelMethods(entity),
      properties: entity.properties || {},
      quality: being.quality || 'model',
      created: Date.now()
    };
  }
  
  /**
   * Generate View from entity and Essence
   */
  private generateView(entity: any, essence: any): any {
    const id = `view:${entity.id}:${Date.now()}`;
    
    // Generate components from entity properties
    const components = this.generateViewComponents(entity, essence);
    
    // Create view entity
    return {
      id,
      type: 'view',
      name: `View for ${entity.type} ${entity.id}`,
      entityType: entity.type,
      entityId: entity.id,
      appearance: essence.appearance || entity.type,
      layout: 'standard',
      components,
      created: Date.now()
    };
  }
  
  /**
   * Generate Controller from entity and Concept
   */
  private generateController(entity: any, concept: any): any {
    const id = `controller:${entity.id}:${Date.now()}`;
    
    // Generate actions for this entity type
    const actions = this.generateControllerActions(entity, concept);
    
    // Create controller entity
    return {
      id,
      type: 'controller',
      name: `Controller for ${entity.type} ${entity.id}`,
      entityType: entity.type,
      entityId: entity.id,
      purpose: concept.purpose || 'control',
      actions,
      created: Date.now()
    };
  }
  
  /**
   * Generate view components from entity
   */
  private generateViewComponents(entity: any, essence: any): any[] {
    const components = [];
    
    // Add header component
    components.push({
      id: 'header',
      type: 'header',
      title: entity.properties?.name || essence.appearance || entity.type,
      subtitle: entity.type
    });
    
    // Add form components for each property
    Object.entries(entity.properties || {}).forEach(([key, value], index) => {
      // Skip special properties
      if (['id', 'type'].includes(key)) return;
      
      components.push({
        id: `field_${key}`,
        type: 'field',
        fieldType: this.inferFieldType(value),
        label: this.humanizeFieldName(key),
        bind: key,
        order: index + 1,
        events: {
          change: `action_update_${key}`
        }
      });
    });
    
    // Add actions component
    components.push({
      id: 'actions',
      type: 'actions',
      align: 'end',
      buttons: [
        {
          id: 'save',
          label: 'Save',
          primary: true,
          action: 'action_save'
        },
        {
          id: 'cancel',
          label: 'Cancel',
          action: 'action_cancel'
        }
      ]
    });
    
    return components;
  }
  
  /**
   * Generate controller actions for entity
   */
  private generateControllerActions(entity: any, concept: any): any[] {
    const actions = [];
    
    // Standard CRUD actions
    actions.push({
      id: 'action_load',
      type: 'load',
      handler: 'loadEntity',
      arguments: {
        id: { type: 'string', required: true }
      }
    });
    
    actions.push({
      id: 'action_save',
      type: 'save',
      handler: 'saveEntity',
      arguments: {
        data: { type: 'object', required: true }
      }
    });
    
    actions.push({
      id: 'action_delete',
      type: 'delete',
      handler: 'deleteEntity',
      arguments: {
        id: { type: 'string', required: true }
      }
    });
    
    actions.push({
      id: 'action_cancel',
      type: 'cancel',
      handler: 'cancelEdit',
      arguments: {}
    });
    
    // Add property-specific update actions
    Object.keys(entity.properties || {}).forEach(key => {
      // Skip special properties
      if (['id', 'type'].includes(key)) return;
      
      actions.push({
        id: `action_update_${key}`,
        type: 'update',
        handler: 'updateProperty',
        arguments: {
          property: { type: 'string', value: key },
          value: { type: 'any', required: true }
        }
      });
    });
    
    return actions;
  }
  
  /**
   * Generate model methods
   */
  private generateModelMethods(entity: any): any {
    return {
      loadEntity: {
        type: 'query',
        query: `MATCH (e:${entity.type} {id: $id}) RETURN e`
      },
      saveEntity: {
        type: 'mutation',
        query: `MERGE (e:${entity.type} {id: $data.id}) 
                SET e += $data 
                RETURN e`
      },
      deleteEntity: {
        type: 'mutation',
        query: `MATCH (e:${entity.type} {id: $id}) 
                DETACH DELETE e`
      },
      updateProperty: {
        type: 'mutation',
        query: `MATCH (e:${entity.type} {id: $id}) 
                SET e[$property] = $value 
                RETURN e`
      }
    };
  }
  
  /**
   * Humanize a field name
   */
  private humanizeFieldName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
  
  /**
   * Infer field type from value
   */
  private inferFieldType(value: any): string {
    if (value === null || value === undefined) {
      return 'text';
    }
    
    const type = typeof value;
    
    switch (type) {
      case 'string':
        if (value.length > 100) return 'textarea';
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
        return 'text';
        
      case 'number':
        return Number.isInteger(value) ? 'integer' : 'decimal';
        
      case 'boolean':
        return 'boolean';
        
      case 'object':
        if (Array.isArray(value)) return 'array';
        return 'object';
        
      default:
        return 'text';
    }
  }
  
  /**
   * Handle events
   */
  handleEvent(event: NeoEvent): void {
    if (event.target !== this.id) return;
    
    switch (event.type) {
      case 'mvc:process':
        this.handleMVCProcessEvent(event);
        break;
        
      case 'mvc:render':
        this.handleRenderEvent(event);
        break;
        
      case 'mvc:execute':
        this.handleExecuteEvent(event);
        break;
    }
  }
  
  /**
   * Handle MVC process event
   */
  private async handleMVCProcessEvent(event: NeoEvent): Promise<void> {
    const { entityId } = event.content || {};
    
    if (!entityId || !this.core) {
      this.emitError(event, 'Entity ID required');
      return;
    }
    
    try {
      // Process entity through MVC
      await this.processEntityMVC(entityId);
      
      // Get MVC data from entity metadata
      const entity = this.core.dialectic.getEntity(entityId);
      const mvc = entity?.metadata?.mvc || {};
      
      // Emit response
      this.emitResponse(event, {
        entityId,
        modelId: mvc.modelId,
        viewId: mvc.viewId,
        controllerId: mvc.controllerId,
        processed: true
      });
    } catch (error) {
      this.emitError(event, error.message);
    }
  }
  
  /**
   * Handle render event
   */
  private async handleRenderEvent(event: NeoEvent): Promise<void> {
    const { viewId, modelId, data } = event.content || {};
    
    if (!viewId || !this.core) {
      this.emitError(event, 'View ID required');
      return;
    }
    
    try {
      // Get view
      const view = this.views.get(viewId);
      if (!view) {
        this.emitError(event, `View not found: ${viewId}`);
        return;
      }
      
      // Get model
      let model = modelId ? this.models.get(modelId) : null;
      
      // If model not found but data provided, create temporary model
      if (!model && data) {
        model = {
          id: `temp:${Date.now()}`,
          properties: data
        };
      }
      
      if (!model) {
        this.emitError(event, 'Model required for rendering');
        return;
      }
      
      // Render the view
      const renderedView = this.renderView(viewId, model);
      
      // Emit response
      this.emitResponse(event, {
        viewId,
        modelId: model.id,
        renderedView
      });
    } catch (error) {
      this.emitError(event, error.message);
    }
  }
  
  /**
   * Handle execute event
   */
  private async handleExecuteEvent(event: NeoEvent): Promise<void> {
    const { controllerId, actionId, args } = event.content || {};
    
    if (!controllerId || !actionId || !this.core) {
      this.emitError(event, 'Controller ID and action ID required');
      return;
    }
    
    try {
      // Get controller
      const controller = this.controllers.get(controllerId);
      if (!controller) {
        this.emitError(event, `Controller not found: ${controllerId}`);
        return;
      }
      
      // Find action
      const action = controller.actions.find((a: any) => a.id === actionId);
      if (!action) {
        this.emitError(event, `Action not found: ${actionId}`);
        return;
      }
      
      // Execute action
      console.log(`[MVC] Executing controller action: ${controllerId}.${actionId}`);
      
      // Get model and view
      const modelId = controller.modelId;
      const viewId = controller.viewId;
      
      if (!modelId) {
        this.emitError(event, 'No model associated with controller');
        return;
      }
      
      const model = this.models.get(modelId);
      
      // Get method from model
      const methodName = action.handler;
      const method = model.methods?.[methodName];
      
      if (!method) {
        this.emitError(event, `Method not found: ${methodName}`);
        return;
      }
      
      // Execute method based on type
      let result;
      if (method.type === 'query' || method.type === 'mutation') {
        // Execute database query
        result = await this.core.dialectic.query(method.query, args || {});
      } else {
        this.emitError(event, `Unsupported method type: ${method.type}`);
        return;
      }
      
      // If view exists, re-render it with updated data
      let renderedView;
      if (viewId && this.views.has(viewId)) {
        // Update model with result if available
        if (result && result.length > 0) {
          const updatedModel = { ...model, properties: result[0] };
          this.models.set(modelId, updatedModel);
          renderedView = this.renderView(viewId, updatedModel);
        } else {
          renderedView = this.renderView(viewId, model);
        }
      }
      
      // Emit response
      this.emitResponse(event, {
        controllerId,
        actionId,
        result,
        renderedView
      });
    } catch (error) {
      this.emitError(event, error.message);
    }
  }
  
  /**
   * Emit response
   */
  private emitResponse(event: NeoEvent, content: any): void {
    if (!this.core) return;
    
    this.core.dialectic.emit({
      type: event.type,
      subtype: 'response',
      targetId: event.source,
      content,
      relations: {
        requestId: event.id
      }
    });
  }
  
  /**
   * Emit error
   */
  private emitError(event: NeoEvent, message: string): void {
    if (!this.core) return;
    
    this.core.dialectic.emit({
      type: event.type,
      subtype: 'error',
      targetId: event.source,
      content: {
        error: message,
        requestId: event.id
      },
      relations: {
        requestId: event.id
      }
    });
  }
}

/**
 * Create an MVC extension
 */
export function createMVCExtension(): MVCExtension {
  return new MVCExtension();
}