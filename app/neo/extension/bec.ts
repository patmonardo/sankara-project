import { NeoCore, NeoExtension } from '../neo';
import { NeoEvent } from '../event';

/**
 * BEC Extension - Being-Essence-Concept System
 * 
 * Implements the ontological framework for Neo:
 * - Being: Immediate determination (what something is)
 * - Essence: Mediated determination (how something appears)
 * - Concept: Self-determination (why something exists)
 */
export class BECExtension implements NeoExtension {
  id = 'bec';
  type = 'ontology';
  capabilities = [
    'beingManagement',    // Entity management
    'essenceMediation',   // Relation management
    'conceptDetermination' // Context and universal management
  ];
  
  private core: NeoCore | null = null;
  
  /**
   * Initialize with Neo core
   */
  initialize(core: NeoCore): void {
    this.core = core;
    
    console.log('[BEC] Initializing ontological framework');
    
    // Set up event handlers
    this.setupEventHandlers();
  }
  
  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    if (!this.core) return;
    
    // Listen for entity events to process through BEC
    this.core.dialectic.onEvent('entity-created', (event) => {
      this.processEntityBeingEssence(event.content.entityId);
    });
    
    this.core.dialectic.onEvent('entity-updated', (event) => {
      this.processEntityBeingEssence(event.content.entityId);
    });
    
    this.core.dialectic.onEvent('relation-created', (event) => {
      this.processRelationEssence(
        event.content.sourceId, 
        event.content.targetId, 
        event.content.type
      );
    });
  }
  
  /**
   * Process entity through Being and Essence
   */
  async processEntityBeingEssence(entityId: string): Promise<void> {
    if (!this.core) return;
    
    const entity = this.core.dialectic.getEntity(entityId);
    if (!entity) return;
    
    console.log(`[BEC] Processing entity ${entityId} through Being and Essence`);
    
    // Process Being (immediate determination)
    const beingResult = this.processBeing(entity);
    
    // Process Essence (mediated determination)
    const essenceResult = this.processEssence(entity, beingResult);
    
    // Process Concept (self-determination)
    const conceptResult = this.processConcept(entity, beingResult, essenceResult);
    
    // Update entity with BEC metadata
    this.core.dialectic.updateEntity(entityId, {
      metadata: {
        ...entity.metadata,
        bec: {
          beingProcessed: true,
          essenceProcessed: true,
          conceptProcessed: true,
          timestamp: Date.now()
        }
      }
    });
    
    // Emit BEC processed event
    this.core.dialectic.emit({
      type: 'bec',
      subtype: 'processed',
      content: {
        entityId,
        being: beingResult,
        essence: essenceResult,
        concept: conceptResult
      }
    });
  }
  
  /**
   * Process relation through Essence
   */
  async processRelationEssence(sourceId: string, targetId: string, relationType: string): Promise<void> {
    if (!this.core) return;
    
    // Get relation
    const relation = this.core.dialectic.getRelation(sourceId, targetId, relationType);
    if (!relation) return;
    
    console.log(`[BEC] Processing relation ${sourceId} -[${relationType}]-> ${targetId} through Essence`);
    
    // Process relation through Essence
    const essenceResult = this.processRelationAsEssence(relation);
    
    // Update relation with Essence metadata
    this.core.dialectic.updateRelation(sourceId, targetId, relationType, {
      metadata: {
        ...relation.metadata,
        essence: {
          processed: true,
          timestamp: Date.now()
        }
      }
    });
    
    // Emit Essence processed event
    this.core.dialectic.emit({
      type: 'bec',
      subtype: 'essence-processed',
      content: {
        sourceId,
        targetId,
        relationType,
        essence: essenceResult
      }
    });
  }
  
  /**
   * Process entity through Being (immediate determination)
   */
  private processBeing(entity: any): any {
    // Extract ontological Being properties
    return {
      id: entity.id,
      type: entity.type,
      properties: { ...entity.properties },
      immediacy: true,
      definite: true,
      quality: this.extractQuality(entity)
    };
  }
  
  /**
   * Process entity through Essence (mediated determination)
   */
  private processEssence(entity: any, being: any): any {
    // Extract ontological Essence properties
    return {
      id: entity.id,
      appearance: this.extractAppearance(entity),
      identity: being.type,
      difference: this.extractDifference(entity),
      reflected: true,
      mediated: true,
      inwardness: this.extractInwardness(entity)
    };
  }
  
  /**
   * Process entity through Concept (self-determination)
   */
  private processConcept(entity: any, being: any, essence: any): any {
    // Extract ontological Concept properties
    return {
      id: entity.id,
      universal: being.type,
      particular: essence.appearance,
      individual: entity.id,
      freedom: true,
      selfdetermination: true,
      purpose: this.extractPurpose(entity)
    };
  }
  
  /**
   * Process relation through Essence
   */
  private processRelationAsEssence(relation: any): any {
    return {
      source: relation.sourceId,
      target: relation.targetId,
      type: relation.type,
      mediation: true,
      reflection: this.extractReflection(relation),
      ground: relation.properties
    };
  }
  
  /**
   * Extract quality from entity
   */
  private extractQuality(entity: any): string {
    // Determine quality based on entity type and properties
    if (entity.type === 'form') return 'formative';
    if (entity.type === 'concept') return 'conceptual';
    if (entity.properties?.concrete) return 'concrete';
    return 'abstract';
  }
  
  /**
   * Extract appearance from entity
   */
  private extractAppearance(entity: any): string {
    // Determine appearance based on entity properties
    if (entity.properties?.appearance) return entity.properties.appearance;
    if (entity.properties?.name) return entity.properties.name;
    return entity.type;
  }
  
  /**
   * Extract difference from entity
   */
  private extractDifference(entity: any): any {
    // Determine difference based on entity properties
    return {
      essential: entity.properties?.essential || true,
      accidental: Object.keys(entity.properties || {})
        .filter(key => !['id', 'type', 'name', 'essential'].includes(key))
    };
  }
  
  /**
   * Extract inwardness from entity
   */
  private extractInwardness(entity: any): any {
    // Determine inwardness based on entity properties
    return {
      essence: entity.properties?.essence || entity.type,
      substance: entity.properties?.substance || 'entity'
    };
  }
  
  /**
   * Extract purpose from entity
   */
  private extractPurpose(entity: any): string {
    // Determine purpose based on entity properties
    if (entity.properties?.purpose) return entity.properties.purpose;
    if (entity.type === 'form') return 'formation';
    if (entity.type === 'concept') return 'conception';
    return 'determination';
  }
  
  /**
   * Extract reflection from relation
   */
  private extractReflection(relation: any): any {
    // Determine reflection based on relation properties
    return {
      positing: true,
      determining: relation.properties?.determining || false,
      external: relation.properties?.external || true
    };
  }
  
  /**
   * Handle extension events
   */
  handleEvent(event: NeoEvent): void {
    if (event.target !== this.id) return;
    
    // Handle BEC-specific events
    switch (event.type) {
      case 'bec:process':
        this.handleBECProcessEvent(event);
        break;
        
      case 'bec:concept':
        this.handleConceptEvent(event);
        break;
    }
  }
  
  /**
   * Handle BEC process event
   */
  private async handleBECProcessEvent(event: NeoEvent): Promise<void> {
    const { entityId } = event.content || {};
    
    if (!entityId || !this.core) {
      this.emitError(event, 'Entity ID required');
      return;
    }
    
    try {
      await this.processEntityBeingEssence(entityId);
      
      // Emit success response
      this.emitResponse(event, {
        entityId,
        processed: true,
        timestamp: Date.now()
      });
    } catch (error) {
      this.emitError(event, error.message);
    }
  }
  
  /**
   * Handle concept event
   */
  private async handleConceptEvent(event: NeoEvent): Promise<void> {
    const { entityId } = event.content || {};
    
    if (!entityId || !this.core) {
      this.emitError(event, 'Entity ID required');
      return;
    }
    
    try {
      const entity = this.core.dialectic.getEntity(entityId);
      if (!entity) {
        this.emitError(event, `Entity not found: ${entityId}`);
        return;
      }
      
      // Get the Being and Essence
      const being = this.processBeing(entity);
      const essence = this.processEssence(entity, being);
      
      // Process Concept
      const concept = this.processConcept(entity, being, essence);
      
      // Emit success response
      this.emitResponse(event, {
        entityId,
        concept,
        timestamp: Date.now()
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
      target: event.source,
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
      target: event.source,
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
 * Create a BEC extension
 */
export function createBECExtension(): BECExtension {
  return new BECExtension();
}