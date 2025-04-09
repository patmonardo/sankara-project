import { NeoCore, NeoExtension } from '../neo';
import { NeoEvent } from '../event';

// Morpheus type from the imported module
interface Morpheus {
  // Form Registry
  registerForm(form: any): void;
  updateForm(form: any): void;
  getForm(id: string): any;
  getAllForms(): any[];
  
  // Morpheus transformation
  transform(morphName: string, input: any, context?: any): any;
  validateForm(formId: string, values: any): any;
  
  // Export/import
  export(): any;
  import(data: any): number;
  
  // Event listeners
  on(eventName: string, callback: Function): () => void;
}

// Import the global morpheus instance from your app
import { morpheus } from '@/core/morpheus';

/**
 * Morpheus Neo Extension
 * 
 * Connects Neo to the Morpheus Form System:
 * - Syncs form definitions to/from Neo
 * - Performs form transforms through Neo events
 * - Manages form registries across components
 */
export class MorpheusExtension implements NeoExtension {
  id = 'morpheus';
  type = 'form';
  capabilities = [
    'formTransformation', 
    'formRegistry', 
    'formDefinition',
    'formValidation'
  ];
  
  private core: NeoCore | null = null;
  private formSpace: string;
  private cleanupFunctions: Array<() => void> = [];
  
  constructor(
    private morpheus: Morpheus,
    options: { formSpace?: string } = {}
  ) {
    this.formSpace = options.formSpace || 'forms';
  }
  
  /**
   * Initialize the extension with Neo Core
   */
  initialize(core: NeoCore): void {
    this.core = core;
    
    // Join the forms space or create it if needed
    this.ensureFormSpace();
    
    // Set up event listeners
    this.setupEvents();
    
    // Load form registry from Neo if available
    this.loadRegistryFromNeo();
    
    console.log('[Morpheus] Extension initialized');
  }
  
  /**
   * Ensure the form space exists
   */
  private async ensureFormSpace(): Promise<void> {
    if (!this.core) return;
    
    try {
      // Try to join the form space
      await this.core.dialectic.joinSpace(this.formSpace);
    } catch (e) {
      // If it doesn't exist, create it
      await this.core.dialectic.createSpace(this.formSpace, 'Form Definitions');
      await this.core.dialectic.joinSpace(this.formSpace);
    }
  }
  
  /**
   * Set up event handlers
   */
  private setupEvents(): void {
    if (!this.core) return;
    
    // Listen for form entity events from Neo
    this.cleanupFunctions.push(
      this.core.on('event:entity:created', this.handleEntityCreated.bind(this))
    );
    
    this.cleanupFunctions.push(
      this.core.on('event:entity:updated', this.handleEntityUpdated.bind(this))
    );
    
    // Listen for form registry events from Neo
    this.cleanupFunctions.push(
      this.core.on('event:form:syncRegistry', () => this.syncRegistryToNeo())
    );
    
    // Listen for form events from Morpheus
    const formRegistered = this.morpheus.on('form:registered', 
      this.handleMorpheusFormRegistered.bind(this)
    );
    
    const formUpdated = this.morpheus.on('form:updated', 
      this.handleMorpheusFormUpdated.bind(this)
    );
    
    const registryUpdated = this.morpheus.on('registry:updated', 
      () => this.syncRegistryToNeo()
    );
    
    // Add cleanup handlers
    this.cleanupFunctions.push(formRegistered);
    this.cleanupFunctions.push(formUpdated);
    this.cleanupFunctions.push(registryUpdated);
  }
  
  /**
   * Clean up all event listeners
   */
  private cleanup(): void {
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
  }
  
  /**
   * Handle entity created event from Neo
   */
  private handleEntityCreated(event: NeoEvent): void {
    const entity = event.content?.entity;
    
    // We only care about form entities
    if (!entity || entity.type !== 'form') return;
    
    try {
      // Convert entity to form
      const form = this.entityToForm(entity);
      
      // Mark that it came from Neo to avoid circular updates
      form._source = 'neo';
      
      // Register with Morpheus
      this.morpheus.registerForm(form);
      
      console.log(`[Morpheus] Registered form from Neo: ${form.id}`);
    } catch (e) {
      console.error('[Morpheus] Failed to process form entity:', e);
    }
  }
  
  /**
   * Handle entity updated event from Neo
   */
  private handleEntityUpdated(event: NeoEvent): void {
    const entity = event.content?.entity;
    
    // We only care about form entities
    if (!entity || entity.type !== 'form') return;
    
    try {
      // Convert entity to form
      const form = this.entityToForm(entity);
      
      // Mark that it came from Neo to avoid circular updates
      form._source = 'neo';
      
      // Update in Morpheus
      this.morpheus.updateForm(form);
      
      console.log(`[Morpheus] Updated form from Neo: ${form.id}`);
    } catch (e) {
      console.error('[Morpheus] Failed to process form entity update:', e);
    }
  }
  
  /**
   * Handle form registered event from Morpheus
   */
  private handleMorpheusFormRegistered(form: any): void {
    // Skip if the form came from Neo (to avoid circular updates)
    if (form._source === 'neo') return;
    
    if (!this.core) return;
    
    // Create a Neo entity for this form
    const entityId = this.core.createEntity({
      type: 'form',
      properties: this.formToEntityProperties(form),
      spaceId: this.formSpace,
      metadata: {
        fromMorpheus: true
      }
    });
    
    console.log(`[Morpheus] Created Neo entity for form: ${form.id}`);
  }
  
  /**
   * Handle form updated event from Morpheus
   */
  private handleMorpheusFormUpdated(form: any): void {
    // Skip if the form came from Neo (to avoid circular updates)
    if (form._source === 'neo') return;
    
    if (!this.core) return;
    
    // Find the existing entity for this form
    const entities = this.core.findEntities({
      type: 'form',
      properties: { id: form.id },
      spaceId: this.formSpace
    });
    
    if (entities.length > 0) {
      // Update the existing entity
      const entityId = entities[0].id;
      this.core.dialectic.updateEntity(entityId, {
        properties: this.formToEntityProperties(form)
      });
      
      console.log(`[Morpheus] Updated Neo entity for form: ${form.id}`);
    } else {
      // Create a new entity (fallback)
      this.handleMorpheusFormRegistered(form);
    }
  }
  
  /**
   * Convert a Neo entity to a Morpheus form
   */
  private entityToForm(entity: any): any {
    const props = entity.properties || {};
    
    return {
      id: props.id || entity.id,
      name: props.name || 'Unnamed Form',
      title: props.title || props.name || 'Unnamed Form',
      description: props.description,
      fields: Array.isArray(props.fields) ? props.fields : [],
      layout: props.layout,
      submit: props.submit || { label: 'Submit' },
      validation: props.validation,
      transforms: props.transforms,
      metadata: {
        ...props.metadata,
        neoEntityId: entity.id
      }
    };
  }
  
  /**
   * Convert a Morpheus form to Neo entity properties
   */
  private formToEntityProperties(form: any): Record<string, any> {
    return {
      id: form.id,
      name: form.name,
      title: form.title,
      description: form.description,
      fields: form.fields || [],
      layout: form.layout,
      submit: form.submit,
      validation: form.validation,
      transforms: form.transforms,
      metadata: {
        ...form.metadata,
        fromMorpheus: true
      }
    };
  }
  
  /**
   * Handle direct events sent to this extension
   */
  handleEvent(event: NeoEvent): void {
    if (!this.core) return;
    
    switch(event.type) {
      case 'form':
        this.handleFormEvent(event);
        break;
        
      case 'extension':
        // Handle extension-specific commands
        if (event.subtype === 'command') {
          this.handleCommandEvent(event);
        }
        break;
    }
  }
  
  /**
   * Handle form-related events
   */
  private handleFormEvent(event: NeoEvent): void {
    if (!this.core) return;
    
    // Form events have subtypes for different operations
    switch(event.subtype) {
      case 'transform':
        this.handleTransformEvent(event);
        break;
        
      case 'validate':
        this.handleValidateEvent(event);
        break;
        
      case 'get':
        this.handleGetFormEvent(event);
        break;
        
      case 'list':
        this.handleListFormsEvent(event);
        break;
    }
  }
  
  /**
   * Handle command events
   */
  private handleCommandEvent(event: NeoEvent): void {
    const command = event.content?.command;
    
    switch(command) {
      case 'syncRegistry':
        this.syncRegistryToNeo();
        this.sendResponse(event, {
          success: true,
          message: 'Registry synced'
        });
        break;
        
      case 'loadRegistry':
        this.loadRegistryFromNeo();
        this.sendResponse(event, {
          success: true,
          message: 'Registry loaded'
        });
        break;
    }
  }
  
  /**
   * Handle a form transform event
   */
  private handleTransformEvent(event: NeoEvent): void {
    if (!this.core) return;
    
    try {
      const { morphName, input, context } = event.content || {};
      
      if (!morphName) {
        this.sendErrorResponse(event, 'Missing morphName in transform request');
        return;
      }
      
      // Perform the transformation using Morpheus
      const result = this.morpheus.transform(
        morphName,
        input || {},
        context || {}
      );
      
      // Send the successful result
      this.sendResponse(event, {
        success: true,
        result
      });
    } catch (e) {
      this.sendErrorResponse(event, e.message);
    }
  }
  
  /**
   * Handle a form validation event
   */
  private handleValidateEvent(event: NeoEvent): void {
    if (!this.core) return;
    
    try {
      const { formId, values } = event.content || {};
      
      if (!formId) {
        this.sendErrorResponse(event, 'Missing formId in validation request');
        return;
      }
      
      // Validate form values using Morpheus
      const result = this.morpheus.validateForm(formId, values || {});
      
      // Send the validation result
      this.sendResponse(event, {
        success: true,
        result
      });
    } catch (e) {
      this.sendErrorResponse(event, e.message);
    }
  }
  
  /**
   * Handle a get form event
   */
  private handleGetFormEvent(event: NeoEvent): void {
    if (!this.core) return;
    
    try {
      const formId = event.content?.formId;
      
      if (!formId) {
        this.sendErrorResponse(event, 'Missing formId in get request');
        return;
      }
      
      // Get form from Morpheus
      const form = this.morpheus.getForm(formId);
      
      if (!form) {
        this.sendErrorResponse(event, `Form not found: ${formId}`);
        return;
      }
      
      // Send the form
      this.sendResponse(event, {
        success: true,
        form
      });
    } catch (e) {
      this.sendErrorResponse(event, e.message);
    }
  }
  
  /**
   * Handle a list forms event
   */
  private handleListFormsEvent(event: NeoEvent): void {
    if (!this.core) return;
    
    try {
      // Get all forms from Morpheus
      const forms = this.morpheus.getAllForms();
      
      // Send the list of forms
      this.sendResponse(event, {
        success: true,
        forms,
        count: forms.length
      });
    } catch (e) {
      this.sendErrorResponse(event, e.message);
    }
  }
  
  /**
   * Send a response to an event
   */
  private sendResponse(originalEvent: NeoEvent, content: any): void {
    if (!this.core) return;
    
    this.core.dialectic.emit({
      type: originalEvent.type,
      subtype: `${originalEvent.subtype}:response`,
      spaceId: originalEvent.spaceId,
      content: {
        ...content,
        requestId: originalEvent.content?.requestId
      },
      relations: {
        replyTo: originalEvent.id
      }
    });
  }
  
  /**
   * Send an error response to an event
   */
  private sendErrorResponse(originalEvent: NeoEvent, error: string): void {
    if (!this.core) return;
    
    this.core.dialectic.emit({
      type: originalEvent.type,
      subtype: `${originalEvent.subtype}:error`,
      spaceId: originalEvent.spaceId,
      content: {
        success: false,
        error,
        requestId: originalEvent.content?.requestId
      },
      relations: {
        replyTo: originalEvent.id
      }
    });
  }
  
  /**
   * Sync the Morpheus registry to Neo
   */
  syncRegistryToNeo(): void {
    if (!this.core) return;
    
    try {
      // Get registry data from Morpheus
      const registryData = this.morpheus.export();
      
      // Find existing registry entity
      const registryEntities = this.core.findEntities({
        type: 'morpheus:registry',
        spaceId: this.formSpace
      });
      
      if (registryEntities.length > 0) {
        // Update existing registry
        const entityId = registryEntities[0].id;
        this.core.dialectic.updateEntity(entityId, {
          properties: {
            registry: registryData,
            updatedAt: Date.now()
          }
        });
        
        console.log('[Morpheus] Registry updated in Neo');
      } else {
        // Create new registry entity
        this.core.createEntity({
          type: 'morpheus:registry',
          properties: {
            registry: registryData,
            createdAt: Date.now()
          },
          spaceId: this.formSpace
        });
        
        console.log('[Morpheus] Registry created in Neo');
      }
    } catch (e) {
      console.error('[Morpheus] Failed to sync registry to Neo:', e);
    }
  }
  
  /**
   * Load the Morpheus registry from Neo
   */
  loadRegistryFromNeo(): void {
    if (!this.core) return;
    
    try {
      // Find registry entity
      const registryEntities = this.core.findEntities({
        type: 'morpheus:registry',
        spaceId: this.formSpace
      });
      
      if (registryEntities.length > 0) {
        const registry = registryEntities[0].properties?.registry;
        
        if (registry) {
          // Import registry to Morpheus
          const count = this.morpheus.import(registry);
          console.log(`[Morpheus] Loaded registry from Neo (${count} items)`);
        }
      }
    } catch (e) {
      console.error('[Morpheus] Failed to load registry from Neo:', e);
    }
  }
}

/**
 * Create a Morpheus extension using the global Morpheus instance
 */
export function createMorpheusExtension(options: {
  morpheus?: Morpheus;
  formSpace?: string;
} = {}): MorpheusExtension {
  // Use provided Morpheus instance or the global one
  const morpheusInstance = options.morpheus || morpheus;
  
  return new MorpheusExtension(morpheusInstance, {
    formSpace: options.formSpace
  });
}