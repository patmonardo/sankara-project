//@/form/entity/entity.ts
import { NeoCore } from '@/neo/neo';

export type FormEntityId = string;

export class FormEntity {
  // Identity properties
  id: string;
  type: string;
  data: Record<string, any>;

  // Entity-specific properties
  properties: Record<string, any>;
  contextId?: string;
  metadata?: Record<string, any>;
  
  // Structural components (BEC · MVC · NEO)
  private being: any;
  private essence: any;
  private concept: any;
  
  private model: any;
  private view: any;
  private controller: any;
  
  // This property needs to be public to be accessed in tests
  core: any;
  private dialectic: any;
  private context: any;
  
  // Static entity registry - moved from NeoCore
  private static entities: Map<string, FormEntity> = new Map();
  
  /**
   * Creates an entity that embodies the dialectical unity
   */
  static create(options: {
    // Entity specific
    id?: string;
    type?: string;
    properties?: Record<string, any>;
    contextId?: string;
    
    // BEC aspects
    being?: any;      // Immediate existence
    essence?: any;    // Determinate qualities
    concept?: any;    // Universal structure
    
    // MVC aspects
    model?: any;      // Data representation
    view?: any;       // Presentation logic
    controller?: any; // Transformation logic
    
    // NEO aspects
    core?: any;       // Core infrastructure
    dialectic?: any;  // Dialectical mechanisms
    context?: any;    // Contextual environment
  }) {
    // Instance that embodies the unity of BEC · MVC · NEO
    return new FormEntity(options);
  }
  
  /**
   * Constructor for FormEntity
   */
  constructor(options: {
    id?: string;
    type?: string;
    properties?: Record<string, any>;
    contextId?: string;
    being?: any;
    essence?: any;
    concept?: any;
    model?: any;
    view?: any;
    controller?: any;
    core?: any;
    dialectic?: any;
    context?: any;
  }) {
    // Set defaults for identity
    this.id = options.id || `entity:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    this.type = options.type || 'neo:entity';
    this.data = {};
    
    // Set entity-specific properties
    this.properties = options.properties || {};
    this.contextId = options.contextId;
    this.metadata = {
      created: Date.now(),
      updated: Date.now()
    };
    
    // Set BEC components
    this.being = options.being || { process: (input: any) => input };
    this.essence = options.essence || { process: (being: any, input: any) => being };
    this.concept = options.concept || { process: (being: any, essence: any, input: any) => ({ being, essence }) };
    
    // Set MVC components
    this.model = options.model || { process: (input: any) => input };
    this.view = options.view || { process: (model: any, input: any) => model };
    this.controller = options.controller || { process: (model: any, view: any, input: any) => ({ model, view }) };
    
    // Set NEO components
    this.core = options.core || NeoCore.getInstance();
    this.dialectic = options.dialectic || { process: (core: any, input: any) => core };
    this.context = options.context || { process: (dialectic: any, core: any, input: any) => ({ dialectic, core }) };
  }
  
  /**
   * Register an entity in the system (moved from NeoCore)
   */
  static registerEntity(entity: FormEntity): void {
    FormEntity.entities.set(entity.id, entity);
  }
  
  /**
   * Create an entity in the system
   * Moved from NeoCore
   */
  static createEntity(data: Partial<FormEntity>): string {
    const id = data.id || `entity:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    
    const newEntity = new FormEntity({
      id,
      type: data.type || 'entity',
      properties: data
    });
    
    // Register the entity
    FormEntity.entities.set(id, newEntity);
    
    // Emit entity created event if we have access to NeoCore
    const core = NeoCore.getInstance();
    if (core && core.emit) {
      core.emit({
        type: 'entity',
        subtype: 'created',
        content: { entityId: id, entity: newEntity }
      });
    }
    
    return id;
  }
  
  /**
   * Get an entity from the system by ID
   * Moved from NeoCore
   */
  static getEntity(id: string): FormEntity | undefined {
    return FormEntity.entities.get(id);
  }
  
  /**
   * Update an entity in the system
   * Moved from NeoCore
   */
  static updateEntity(id: string, data: Partial<FormEntity>): boolean {
    const entity = FormEntity.entities.get(id);
    if (!entity) {
      return false;
    }
    
    // Update properties
    Object.assign(entity.properties, data);
    
    // Update metadata
    if (!entity.metadata) {
      entity.metadata = {};
    }
    entity.metadata.updated = Date.now();
    
    // Persist the updated entity
    FormEntity.entities.set(id, entity);
    
    // Emit entity updated event if we have access to NeoCore
    const core = NeoCore.getInstance();
    if (core && core.emit) {
      core.emit({
        type: 'entity',
        subtype: 'updated',
        content: { entityId: id, changes: data, entity }
      });
    }
    
    return true;
  }
  
  /**
   * Remove an entity from the system
   */
  static removeEntity(id: string): boolean {
    const entity = FormEntity.entities.get(id);
    if (!entity) {
      return false;
    }
    
    // Remove the entity
    FormEntity.entities.delete(id);
    
    // Emit entity removed event if we have access to NeoCore
    const core = NeoCore.getInstance();
    if (core && core.emit) {
      core.emit({
        type: 'entity',
        subtype: 'removed',
        content: { entityId: id, entity }
      });
    }
    
    return true;
  }
  
  /**
   * Query entities by criteria
   * New functionality not previously in NeoCore
   */
  static queryEntities(filter: {
    type?: string;
    contextId?: string;
    properties?: Record<string, any>;
  } = {}): FormEntity[] {
    return Array.from(FormEntity.entities.values()).filter(entity => {
      // Match type if specified
      if (filter.type && entity.type !== filter.type) {
        return false;
      }
      
      // Match contextId if specified
      if (filter.contextId && entity.contextId !== filter.contextId) {
        return false;
      }
      
      // Match properties if specified
      if (filter.properties) {
        for (const [key, value] of Object.entries(filter.properties)) {
          if (entity.properties[key] !== value) {
            return false;
          }
        }
      }
      
      return true;
    });
  }
  
  /**
   * Persist the entity to the system
   */
  persist(): string {
    // Update the updated timestamp
    if (!this.metadata) {
      this.metadata = {};
    }
    this.metadata.updated = Date.now();
    
    // Prepare entity data for persistence
    const entityData = {
      id: this.id,
      type: this.type,
      ...this.properties,
      metadata: {
        ...this.metadata,
        persisted: Date.now(),
        contextId: this.contextId
      }
    };
    
    // Store in entity registry
    if (FormEntity.getEntity(this.id)) {
      FormEntity.updateEntity(this.id, entityData);
    } else {
      FormEntity.createEntity(entityData);
    }
    
    return this.id;
  }
  
  /**
   * Delete this entity
   */
  delete(): boolean {
    return FormEntity.removeEntity(this.id);
  }
  
  /**
   * Create a relation from this entity to another
   */
  relateTo(targetId: string, relationType: string, properties?: Record<string, any>) {
    // Import dynamically to avoid circular dependency issues
    const { createNeoRelation } = require('./relation');
    
    // Create relation instance
    const relation = createNeoRelation({
      source: { id: this.id, type: this.type },
      target: { id: targetId, type: 'entity' }, // We could load the target entity to get its type
      type: 'relation',
      subtype: relationType,
      content: {
        ...properties || {},
        sourceEntity: this.id,
        targetEntity: targetId,
        relationType
      },
      spaceId: this.contextId,
      metadata: {
        created: Date.now(),
        relationType
      }
    });
    
    // Persist the relation
    relation.persist();
    
    return relation;
  }
  
  // BEC, MVC, and NEO methods remain the same...
  
  /**
   * Get serialized representation of the entity
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      properties: this.properties,
      contextId: this.contextId,
      data: this.data,
      metadata: this.metadata
    };
  }
}

/**
 * Create a FormEntity instance
 * 
 * This function creates a FormEntity with the provided configuration,
 * making it available for import by other modules.
 */
export function createFormEntity(config: {
  id?: string;
  type?: string;
  properties?: Record<string, any>;
  metadata?: Record<string, any>;
  contextId?: string;
  being?: any;
  essence?: any;
  concept?: any;
}): FormEntity {
  // Create entity with unique ID if not provided
  const id = config.id || `entity:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
  
  // Create the entity instance
  const entity = FormEntity.create({
    id,
    type: config.type || 'neo:entity',
    // Entity-specific
    properties: config.properties || {},
    contextId: config.contextId,
    
    // BEC aspects
    being: {
      process: () => config.being || {}
    },
    essence: {
      process: () => config.essence || {}
    },
    concept: {
      process: () => config.concept || {}
    },
    
    // Core
    core: NeoCore.getInstance()
  });
  
  // Set entity metadata
  entity.metadata = {
    ...config.metadata || {},
    created: Date.now()
  };
  
  // Register the entity in the system
  FormEntity.registerEntity(entity);
  
  return entity;
}