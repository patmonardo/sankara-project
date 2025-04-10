import { NeoCore } from "./neo";
import { NeoEvent } from "./event";
import { NeoProtocol, NeoEntityId, NeoSpaceId } from "./dialectic";

/**
 * Property definition interface
 */
export interface PropertyDefinition<T = any> {
  name: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "array"
    | "date"
    | "map"
    | "set"
    | "reference"
    | "custom";
  required?: boolean;
  defaultValue?: T;
  validationRules?: Array<{
    type: string;
    params?: Record<string, any>;
    message: string;
  }>;
  customType?: string;
  metadata?: Record<string, any>;
  nestedProperties?: Record<string, PropertyDefinition>; // For object type properties
  referenceType?: string; // For reference type properties
}

/**
 * Property subscription options
 */
export interface PropertySubscriptionOptions {
  entityId: NeoEntityId;
  propertyName: string;
  immediate?: boolean;
}

/**
 * Property batch operation result
 */
export interface PropertyBatchResult {
  success: boolean;
  failed: Array<{
    propertyName: string;
    value: any;
    error: string;
  }>;
  successful: string[];
}

/**
 * Neo Property System
 *
 * Specialized property operations that extend the Dialectical Protocol
 * Implements attribute-focused methods on top of the One Node architecture
 */
export class NeoProperty {
  private propertySpace: NeoSpaceId;
  private subscriptions: Map<string, Array<(value: any, previous: any) => void>> = new Map();

  constructor(
    private protocol: NeoProtocol,
    options: { propertySpaceId?: NeoSpaceId } = {}
  ) {
    // Set property space
    this.propertySpace = options.propertySpaceId || "properties";

    // Listen for property events from protocol
    this.protocol.onEvent("property", (event) => {
      if (event.subtype === "define") {
        this.handlePropertyDefinitionEvent(event.content);
      } else if (event.subtype === "updated") {
        this.handlePropertyUpdateEvent(event.content);
      }
    });
  }

  /**
   * Handle property definition event
   *
   * This is called when a property definition event is received
   */
  private handlePropertyDefinitionEvent(content: any): void {
    if (content.definition) {
      this.defineProperty(content.definition).catch((err) => {
        console.error("Failed to process property definition:", err);
      });
    }
  }

  /**
   * Handle property update event for subscriptions
   */
  private handlePropertyUpdateEvent(content: any): void {
    if (!content || !content.entityId || !content.propertyName) return;
    
    const { entityId, propertyName, value, previousValue } = content;
    const subscriptionKey = `${entityId}:${propertyName}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      const handlers = this.subscriptions.get(subscriptionKey) || [];
      handlers.forEach(handler => {
        try {
          handler(value, previousValue);
        } catch (err) {
          console.error(`Error in property subscription handler: ${err}`);
        }
      });
    }
  }

  /**
   * Define a property type with generic type parameter
   */
  async defineProperty<T>(definition: PropertyDefinition<T>): Promise<NeoEntityId> {
    // Create property definition entity
    const propertyId = this.protocol.createEntity({
      type: "property:definition",
      spaceId: this.propertySpace,
      properties: {
        name: definition.name,
        type: definition.type,
        required: definition.required || false,
        defaultValue: definition.defaultValue,
        validationRules: definition.validationRules || [],
        customType: definition.customType,
        nestedProperties: definition.nestedProperties,
        referenceType: definition.referenceType,
        definedAt: Date.now(),
      },
      metadata: definition.metadata,
    });

    // Announce property definition
    this.protocol.emit({
      id: propertyId,
      type: "property",
      subtype: "defined",
      spaceId: this.propertySpace,
      source: propertyId,
      content: {
        propertyId,
        definition,
      },
    });

    return propertyId;
  }

  /**
   * Get a property definition by name
   */
  getPropertyDefinition(name: string): PropertyDefinition | null {
    const definitions = this.protocol.findEntities({
      type: "property:definition",
      spaceId: this.propertySpace,
      properties: { name },
    });

    if (definitions.length === 0) {
      return null;
    }

    const definition = definitions[0];

    return {
      name: definition.properties.name,
      type: definition.properties.type,
      required: definition.properties.required,
      defaultValue: definition.properties.defaultValue,
      validationRules: definition.properties.validationRules,
      customType: definition.properties.customType,
      nestedProperties: definition.properties.nestedProperties,
      referenceType: definition.properties.referenceType,
      metadata: definition.metadata,
    };
  }

  /**
   * Set a property value on an entity
   */
  setPropertyValue(entityId: NeoEntityId, propertyName: string, value: any): void {
    const entity = this.protocol.getEntity(entityId);
    if (!entity) {
      throw new Error(`Entity not found: ${entityId}`);
    }

    // Check property definition
    const definition = this.getPropertyDefinition(propertyName);

    // Validate value if definition exists
    if (definition) {
      this.validateValue(value, definition);
    }

    // Update entity property
    this.protocol.updateEntity(entityId, {
      properties: {
        ...entity.properties,
        [propertyName]: value,
      },
    });

    // Emit property update event
    this.protocol.emit({
      id: entityId,
      type: "property",
      subtype: "updated",
      spaceId: entity.spaceId || this.propertySpace,
      content: {
        entityId,
        propertyName,
        value,
        previousValue: entity.properties[propertyName],
      },
    });
  }

  /**
   * Set multiple property values on an entity in a single batch operation
   */
  setBatchPropertyValues(
    entityId: NeoEntityId, 
    properties: Record<string, any>
  ): PropertyBatchResult {
    const entity = this.protocol.getEntity(entityId);
    if (!entity) {
      throw new Error(`Entity not found: ${entityId}`);
    }

    const result: PropertyBatchResult = {
      success: true,
      failed: [],
      successful: []
    };

    const updatedProperties = { ...entity.properties };
    const previousValues: Record<string, any> = {};

    // Validate all properties first
    for (const [propertyName, value] of Object.entries(properties)) {
      const definition = this.getPropertyDefinition(propertyName);
      
      // Validate if definition exists
      if (definition) {
        const validation = this.validateValue(value, definition);
        if (!validation.valid) {
          result.failed.push({
            propertyName,
            value,
            error: validation.errors.join(', ')
          });
          result.success = false;
        } else {
          // Store previous value for event
          previousValues[propertyName] = entity.properties[propertyName];
          // Update property
          updatedProperties[propertyName] = value;
          result.successful.push(propertyName);
        }
      } else {
        // No definition, just update
        previousValues[propertyName] = entity.properties[propertyName];
        updatedProperties[propertyName] = value;
        result.successful.push(propertyName);
      }
    }

    // Apply changes if any properties were valid
    if (result.successful.length > 0) {
      // Update entity with all successful properties
      this.protocol.updateEntity(entityId, {
        properties: updatedProperties
      });

      // Emit batch property update event
      this.protocol.emit({
        id: entityId,
        type: "property",
        subtype: "batch-updated",
        spaceId: entity.spaceId || this.propertySpace,
        content: {
          entityId,
          properties: result.successful.reduce((acc, key) => {
            acc[key] = {
              value: updatedProperties[key],
              previousValue: previousValues[key]
            };
            return acc;
          }, {} as Record<string, any>)
        }
      });
    }

    return result;
  }

  /**
   * Get a property value from an entity
   */
  getPropertyValue(entityId: NeoEntityId, propertyName: string): any {
    const entity = this.protocol.getEntity(entityId);
    if (!entity) {
      return undefined;
    }

    return entity.properties[propertyName];
  }

  /**
   * Delete a property from an entity
   */
  deleteProperty(entityId: NeoEntityId, propertyName: string): void {
    const entity = this.protocol.getEntity(entityId);
    if (!entity) {
      throw new Error(`Entity not found: ${entityId}`);
    }

    // Clone properties
    const newProperties = { ...entity.properties };

    // Delete property
    const previousValue = newProperties[propertyName];
    delete newProperties[propertyName];

    // Update entity
    this.protocol.updateEntity(entityId, {
      properties: newProperties,
    });

    // Emit property delete event
    this.protocol.emit({
      id: entityId,
      type: "property",
      subtype: "deleted",
      spaceId: entity.spaceId || this.propertySpace,
      content: {
        entityId,
        propertyName,
        previousValue,
      },
    });
  }

  /**
   * Validate a value against a property definition
   */
  validateValue(
    value: any,
    definition: PropertyDefinition
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required
    if (definition.required && (value === undefined || value === null)) {
      errors.push(`Property ${definition.name} is required`);
      return { valid: false, errors };
    }

    // Skip further validation if value is undefined/null
    if (value === undefined || value === null) {
      return { valid: true, errors };
    }

    // Check type
    switch (definition.type) {
      case "string":
        if (typeof value !== "string") {
          errors.push(`Property ${definition.name} must be a string`);
        }
        break;

      case "number":
        if (typeof value !== "number") {
          errors.push(`Property ${definition.name} must be a number`);
        }
        break;

      case "boolean":
        if (typeof value !== "boolean") {
          errors.push(`Property ${definition.name} must be a boolean`);
        }
        break;

      case "object":
        if (
          typeof value !== "object" ||
          value === null ||
          Array.isArray(value)
        ) {
          errors.push(`Property ${definition.name} must be an object`);
        } else if (definition.nestedProperties && errors.length === 0) {
          // Validate nested properties
          for (const [nestedKey, nestedDef] of Object.entries(definition.nestedProperties)) {
            if (nestedKey in value) {
              const nestedValidation = this.validateValue(value[nestedKey], {
                ...nestedDef,
                name: `${definition.name}.${nestedKey}`
              });
              
              if (!nestedValidation.valid) {
                errors.push(...nestedValidation.errors);
              }
            } else if (nestedDef.required) {
              errors.push(`Nested property ${definition.name}.${nestedKey} is required`);
            }
          }
        }
        break;

      case "array":
        if (!Array.isArray(value)) {
          errors.push(`Property ${definition.name} must be an array`);
        }
        break;

      case "date":
        if (
          !(value instanceof Date) &&
          typeof value !== "string" &&
          typeof value !== "number"
        ) {
          errors.push(`Property ${definition.name} must be a date`);
        }
        break;
        
      case "map":
        if (!(value instanceof Map)) {
          errors.push(`Property ${definition.name} must be a Map`);
        }
        break;
        
      case "set":
        if (!(value instanceof Set)) {
          errors.push(`Property ${definition.name} must be a Set`);
        }
        break;
        
      case "reference":
        // Validate that the reference points to a valid entity of the specified type
        if (typeof value !== "string" && typeof value !== "number") {
          errors.push(`Property ${definition.name} must be a valid entity reference`);
        } else if (definition.referenceType) {
          const referencedEntity = this.protocol.getEntity(value);
          if (!referencedEntity) {
            errors.push(`Referenced entity ${value} does not exist`);
          } else if (referencedEntity.type !== definition.referenceType) {
            errors.push(`Referenced entity ${value} is not of type ${definition.referenceType}`);
          }
        }
        break;
    }

    // Apply validation rules
    if (definition.validationRules && errors.length === 0) {
      for (const rule of definition.validationRules) {
        switch (rule.type) {
          case "min":
            if (typeof value === "number" && value < rule.params?.value) {
              errors.push(rule.message);
            } else if (
              typeof value === "string" &&
              value.length < rule.params?.value
            ) {
              errors.push(rule.message);
            } else if (
              Array.isArray(value) &&
              value.length < rule.params?.value
            ) {
              errors.push(rule.message);
            }
            break;

          case "max":
            if (typeof value === "number" && value > rule.params?.value) {
              errors.push(rule.message);
            } else if (
              typeof value === "string" &&
              value.length > rule.params?.value
            ) {
              errors.push(rule.message);
            } else if (
              Array.isArray(value) &&
              value.length > rule.params?.value
            ) {
              errors.push(rule.message);
            }
            break;

          case "pattern":
            if (
              typeof value === "string" &&
              !new RegExp(rule.params?.pattern).test(value)
            ) {
              errors.push(rule.message);
            }
            break;

          case "enum":
            if (
              Array.isArray(rule.params?.values) &&
              !rule.params?.values.includes(value)
            ) {
              errors.push(rule.message);
            }
            break;
            
          case "custom":
            if (rule.params?.validatorFn && typeof rule.params.validatorFn === "function") {
              try {
                const customValid = rule.params.validatorFn(value);
                if (!customValid) {
                  errors.push(rule.message);
                }
              } catch (err) {
                errors.push(`Custom validation error: ${err.message}`);
              }
            }
            break;
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Find entities with specific property values
   */
  findByProperty(
    propertyName: string,
    value: any,
    spaceId?: NeoSpaceId
  ): NeoEntityId[] {
    const entities = this.protocol.findEntities({
      spaceId,
      properties: {
        [propertyName]: value,
      },
    });

    return entities.map((entity) => entity.id);
  }

  /**
   * Find entities that match a complex property query
   */
  findEntitiesByPropertyQuery(
    query: Array<{
      propertyName: string;
      operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "startsWith" | "endsWith";
      value: any;
    }>,
    spaceId?: NeoSpaceId
  ): NeoEntityId[] {
    // Find all entities in the target space
    const allEntities = spaceId 
      ? this.protocol.findEntities({ spaceId })
      : this.protocol.findEntities({});

    // Filter entities based on property queries
    const filtered = allEntities.filter(entity => {
      return query.every(condition => {
        const propertyValue = entity.properties[condition.propertyName];
        
        switch (condition.operator) {
          case "eq":
            return propertyValue === condition.value;
          case "neq":
            return propertyValue !== condition.value;
          case "gt":
            return propertyValue > condition.value;
          case "gte":
            return propertyValue >= condition.value;
          case "lt":
            return propertyValue < condition.value;
          case "lte":
            return propertyValue <= condition.value;
          case "contains":
            if (typeof propertyValue === "string") {
              return propertyValue.includes(condition.value);
            } else if (Array.isArray(propertyValue)) {
              return propertyValue.includes(condition.value);
            }
            return false;
          case "startsWith":
            return typeof propertyValue === "string" && propertyValue.startsWith(condition.value);
          case "endsWith":
            return typeof propertyValue === "string" && propertyValue.endsWith(condition.value);
          default:
            return false;
        }
      });
    });

    return filtered.map(entity => entity.id);
  }

  /**
   * Subscribe to property changes
   */
  subscribeToProperty(
    options: PropertySubscriptionOptions,
    handler: (value: any, previousValue: any) => void
  ): () => void {
    const { entityId, propertyName, immediate = true } = options;
    const subscriptionKey = `${entityId}:${propertyName}`;
    
    if (!this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.set(subscriptionKey, []);
    }
    
    const handlers = this.subscriptions.get(subscriptionKey) || [];
    handlers.push(handler);
    this.subscriptions.set(subscriptionKey, handlers);
    
    // Call handler immediately with current value if requested
    if (immediate) {
      const currentValue = this.getPropertyValue(entityId, propertyName);
      try {
        handler(currentValue, undefined);
      } catch (err) {
        console.error(`Error in immediate property subscription handler: ${err}`);
      }
    }
    
    // Return unsubscribe function
    return () => {
      const handlers = this.subscriptions.get(subscriptionKey) || [];
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
        this.subscriptions.set(subscriptionKey, handlers);
      }
    };
  }

  /**
   * Register with NeoCore
   *
   * This allows the PropertySystem to integrate with Neo's property rights engine
   */
  registerWithNeoCore(neoCore: NeoCore): void {
    // Register property-related events
    neoCore.on("event:property:added", (event: NeoEvent) => {
      this.handlePropertyAddedEvent(event);
    });

    neoCore.on("event:property:changed", (event) => {
      this.handlePropertyChangedEvent(event);
    });

    neoCore.on("event:property:removed", (event) => {
      this.handlePropertyRemovedEvent(event);
    });
  }

  /**
   * Handle property added event
   */
  private handlePropertyAddedEvent(event: any): void {
    // Skip if no entity or properties
    if (
      !event.content ||
      !event.content.entityId ||
      !event.content.properties
    ) {
      return;
    }

    const { entityId, properties } = event.content;

    // Update indices or perform additional validation
    for (const [key, value] of Object.entries(properties)) {
      // Get property definition
      const definition = this.getPropertyDefinition(key);

      // Validate if definition exists
      if (definition) {
        const validation = this.validateValue(value, definition);
        if (!validation.valid) {
          // Log validation errors but don't block (non-blocking validation)
          console.warn(
            `Validation warning for ${key} on entity ${entityId}: ${validation.errors.join(
              ", "
            )}`
          );
        }
      }
    }
  }

  /**
   * Handle property changed event
   */
  private handlePropertyChangedEvent(event: NeoEvent): void {
    if (!event.content || !event.content.entityId || !event.content.changes) {
      console.debug("Invalid property changed event structure:", event);
      return;
    }

    const { entityId, changes } = event.content;

    // Process each property change
    for (const [key, change] of Object.entries(changes)) {
      if (!change || typeof change !== "object") {
        console.debug(`Skipping invalid change for property "${key}":`, change);
        continue;
      }

      // Debug change structure
      console.debug(`Processing property change for "${key}":`, change);

      // Get property definition
      const definition = this.getPropertyDefinition(key);
      
      // Check if change has expected structure
      if (!('to' in change)) {
        console.warn(`Change object for property "${key}" missing "to" field:`, change);
        continue;
      }

      // Validate new value if definition exists
      if (definition && change.to !== undefined) {
        const validation = this.validateValue(change.to, definition);
        if (!validation.valid) {
          console.warn(
            `Validation warning for changed property ${key} on entity ${entityId}: ${validation.errors.join(
              ", "
            )}`
          );
        }
      }
    }
  }

  /**
   * Handle property removed event
   */
  private handlePropertyRemovedEvent(event: any): void {
    if (
      !event.content ||
      !event.content.entityId ||
      !event.content.propertyKeys
    ) {
      return;
    }

    const { entityId, propertyKeys, originalValues } = event.content;

    // Process removed properties
    for (const key of propertyKeys) {
      // Check if property was required
      const definition = this.getPropertyDefinition(key);

      if (definition && definition.required) {
        console.warn(
          `Required property ${key} was removed from entity ${entityId}`
        );
      }
    }
  }

  /**
   * Get all property definitions
   */
  getAllPropertyDefinitions(): PropertyDefinition[] {
    const definitions = this.protocol.findEntities({
      type: "property:definition",
      spaceId: this.propertySpace,
    });

    return definitions.map(definition => ({
      name: definition.properties.name,
      type: definition.properties.type,
      required: definition.properties.required,
      defaultValue: definition.properties.defaultValue,
      validationRules: definition.properties.validationRules,
      customType: definition.properties.customType,
      nestedProperties: definition.properties.nestedProperties,
      referenceType: definition.properties.referenceType,
      metadata: definition.metadata,
    }));
  }
}

/**
 * Create a Neo Property System
 */
export function createNeoProperty(
  protocol: NeoProtocol,
  options?: { propertySpaceId?: NeoSpaceId }
): NeoProperty {
  return new NeoProperty(protocol, options);
}
