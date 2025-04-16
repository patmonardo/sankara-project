export type FormEntityId = string;

/**
 * Represents a basic entity in the system.
 * Primarily a data container. Actions are handled by EntityEngine via verbs.
 */
export class FormEntity {
  public id: FormEntityId;
  public type: string;
  public properties: Record<string, any>; // General purpose properties/data
  public metadata: Record<string, any>;
  public contextId?: string; // Optional context association

  // Static entity registry - This will be managed by the EntityEngine
  private static entities: Map<string, FormEntity> = new Map(); // Keep for findOrCreate placeholder

  /**
   * Basic constructor for creating an entity instance.
   * Does not automatically register or persist.
   */
  constructor(config: {
    id: FormEntityId; // ID is now mandatory for the constructor
    type: string;
    properties?: Record<string, any>;
    metadata?: Record<string, any>;
    contextId?: string;
  }) {
    this.id = config.id;
    this.type = config.type;
    this.properties = config.properties || {};
    this.metadata = {
        ...(config.metadata || {}),
        // Ensure created/updated are managed by the engine during actual creation/update
    };
    this.contextId = config.contextId;
  }

  /**
   * Get serialized representation of the entity.
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      properties: this.properties,
      contextId: this.contextId,
      metadata: this.metadata,
    };
  }

  // --- Placeholder Static Methods (To be replaced by Engine logic) ---

  /**
   * @deprecated Use EntityService.getEntity or direct engine access.
   * Placeholder for retrieving an entity instance. Managed by EntityEngine.
   */
  static getEntity(id: string): FormEntity | undefined {
    // In a real scenario, the Engine would manage this map.
    // This is just to satisfy the findOrCreate placeholder for now.
    return FormEntity.entities.get(id);
  }

   /**
    * @deprecated Use EntityService.createEntity or direct engine action.
    * Placeholder for adding an entity instance. Managed by EntityEngine.
    */
   static _registerEntity(entity: FormEntity): void {
       // In a real scenario, the Engine would manage this map.
       FormEntity.entities.set(entity.id, entity);
       // The engine would also set created/updated metadata here.
       if (!entity.metadata.created) entity.metadata.created = Date.now();
       entity.metadata.updated = Date.now();
   }

  /**
   * Placeholder implementation for findOrCreate needed by other services/engines.
   * In a real system, this logic might live in the EntityEngine or be more complex.
   * It currently relies on the static map which is discouraged.
   */
  static findOrCreate(config: { id: string; type: string; }): FormEntity {
    let entity = FormEntity.getEntity(config.id);
    if (!entity) {
        console.warn(`FormEntity.findOrCreate: Creating entity '${config.id}' via placeholder.`);
        entity = new FormEntity({
            id: config.id,
            type: config.type,
            metadata: { created: Date.now() } // Add basic metadata
        });
        // Register it in the placeholder map
        FormEntity._registerEntity(entity);
    }
    return entity;
  }

}

// Remove the old createFormEntity function
// export function createFormEntity(...) { ... }