import { NeoProtocol, NeoEntityId, NeoSpaceId } from "./dialectic";

/**
 * Property definition interface
 */
export interface PropertyDefinition {
  name: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "array"
    | "date"
    | "custom";
  required?: boolean;
  defaultValue?: any;
  validationRules?: Array<{
    type: string;
    params?: Record<string, any>;
    message: string;
  }>;
  customType?: string;
  metadata?: Record<string, any>;
}

/**
 * Neo Property System
 *
 * Specialized property operations that extend the Dialectical Protocol
 * Implements attribute-focused methods on top of the One Node architecture
 */
export class NeoProperty {
  private propertySpace: NeoSpaceId;

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
   * Define a property type
   */
  async defineProperty(definition: PropertyDefinition): Promise<NeoEntityId> {
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
        definedAt: Date.now(),
      },
      metadata: definition.metadata,
    });

    // Announce property definition
    this.protocol.emit({
      type: "property",
      subtype: "defined",
      spaceId: this.propertySpace,
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
   * Register with NeoCore
   *
   * This allows the PropertySystem to integrate with Neo's property rights engine
   */
  registerWithNeoCore(neoCore: any): void {
    // Register property-related events
    neoCore.on("event:property:added", (event) => {
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
  private handlePropertyChangedEvent(event: any): void {
    if (!event.content || !event.content.entityId || !event.content.changes) {
      return;
    }

    const { entityId, changes } = event.content;

    // Process each property change
    for (const [key, change] of Object.entries(changes)) {
      if (!change || typeof change !== "object") continue;

      // Get property definition
      const definition = this.getPropertyDefinition(key);

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
