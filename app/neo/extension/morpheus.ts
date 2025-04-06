import { NeoCore, NeoExtension } from '../neo';
import { NeoEvent } from '../event';
import { Morpheus } from '../../mvc/graphics/modality/morpheus';

/**
 * Morpheus Extension
 * 
 * A minimal bridge connecting Neo Core to the Morpheus Form Engine.
 * This extension doesn't implement form functionality - it only delegates to the Morpheus engine.
 */
export class MorpheusExtension implements NeoExtension {
  id = 'morpheus';
  type = 'bridge';
  capabilities = ['formTransformation', 'formBridge'];
  
  private core: NeoCore | null = null;
  
  constructor(private morpheus: Morpheus) {}
  
  /**
   * Initialize extension with Neo Core
   */
  initialize(core: NeoCore): void {
    this.core = core;
    this.setupEventBridge();
  }
  
  /**
   * Set up bidirectional event bridge between Neo and Morpheus
   */
  private setupEventBridge(): void {
    if (!this.core) return;
    
    // Neo → Morpheus: Entity events that should map to form transformations
    this.core.dialectic.onEvent('entity', (event: NeoEvent) => {
      // When a form entity is created or updated, dispatch to Morpheus
      if (event.type === 'entity' && event.content?.entity?.type === 'form') {
        this.dispatchToMorpheus(event.content.entity);
      }
    });
    
    // Morpheus → Neo: Setup Morpheus to emit events to Neo
    // This allows Morpheus to trigger Neo actions via events
    this.morpheus.on('morph:action', (action: any) => {
      if (!this.core) return;
      
      // Transform Morpheus action to Neo event
      this.core.dialectic.emit({
        type: 'action',
        subtype: action.type,
        spaceId: action.spaceId || 'forms',
        content: action.payload,
        metadata: {
          fromMorpheus: true,
          viaExtension: this.id
        }
      });
    });
  }
  
  /**
   * Handle Neo events targeted at this extension
   */
  handleEvent(event: NeoEvent): void {
    if (!this.core) return;
    
    if (event.type === 'form') {
      // Form transform event - use Morpheus to transform data
      if (event.subtype === 'transform') {
        try {
          const result = this.morpheus.transform(
            event.content.morphName,
            event.content.input,
            event.content.context
          );
          
          // Return the result
          this.core.dialectic.emit({
            type: 'form',
            subtype: 'transformed',
            spaceId: event.spaceId,
            content: {
              result,
              requestId: event.content.requestId
            },
            metadata: {
              viaExtension: this.id
            }
          });
        } catch (e) {
          // Return the error
          this.core.dialectic.emit({
            type: 'error',
            subtype: 'transform',
            spaceId: event.spaceId,
            content: {
              error: e.message,
              requestId: event.content.requestId
            },
            metadata: {
              viaExtension: this.id
            }
          });
        }
      }
      
      // Registry sync event - persist Morpheus registry to Neo
      else if (event.subtype === 'syncRegistry') {
        this.syncRegistryToNeo();
      }
    }
  }
  
  /**
   * Dispatch a form entity to Morpheus
   */
  private dispatchToMorpheus(entity: any): void {
    // Simply notify Morpheus about the form entity
    // The actual form handling happens in the Morpheus engine
    this.morpheus.emit('neo:entity', entity);
  }
  
  /**
   * Sync Morpheus registry to Neo storage
   */
  private syncRegistryToNeo(): void {
    if (!this.core) return;
    
    try {
      // Get registry data from Morpheus
      const registryData = this.morpheus.export();
      
      // Store in Neo as a system entity
      const existingRegistry = this.core.dialectic.findEntities({
        type: 'morpheus:registry',
        spaceId: 'system'
      })[0];
      
      if (existingRegistry) {
        // Update existing registry
        this.core.dialectic.updateEntity(existingRegistry.id, {
          properties: { registry: registryData }
        });
      } else {
        // Create new registry entity
        this.core.dialectic.createEntity({
          type: 'morpheus:registry',
          spaceId: 'system',
          properties: { registry: registryData }
        });
      }
    } catch (e) {
      console.error('Failed to sync Morpheus registry to Neo:', e);
    }
  }
  
  /**
   * Load Morpheus registry from Neo storage
   */
  loadRegistryFromNeo(): void {
    if (!this.core) return;
    
    try {
      // Find registry entity
      const registryEntity = this.core.dialectic.findEntities({
        type: 'morpheus:registry',
        spaceId: 'system'
      })[0];
      
      if (registryEntity && registryEntity.properties.registry) {
        // Import registry data to Morpheus
        this.morpheus.import(registryEntity.properties.registry);
      }
    } catch (e) {
      console.warn('Could not load Morpheus registry from Neo:', e);
    }
  }
}

/**
 * Create a Morpheus Extension
 */
export function createMorpheusExtension(
  morpheus: Morpheus
): MorpheusExtension {
  return new MorpheusExtension(morpheus);
}