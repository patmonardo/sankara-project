import { z } from "zod";
import { PropertySchema, PropertyType } from "../schema/property";

/**
 * Represents a property associated with an entity or relation within a context.
 * Primarily a data container. Actions (creation, update, value calculation for
 * non-static types) are handled by an Engine (e.g., ContextEngine or a dedicated PropertyEngine)
 * via verbs emitted by PropertyService.
 */
export class FormProperty {
  // Core data following the schema
  id: string;
  name: string;
  description?: string;
  propertyType: PropertyType;
  contextId: string;
  entityId?: string;
  relationId?: string;
  staticValue?: any;
  derivedFrom?: string;
  scriptId?: string;
  qualitative?: {
    essential?: boolean;
    observable?: boolean;
    mutable?: boolean;
    inherent?: boolean;
  };
  quantitative?: {
    dataType?: "string" | "number" | "boolean" | "date" | "object" | "array";
    unit?: string;
    precision?: number;
    range?: {
      min?: any;
      max?: any;
    };
  };
  created: Date;
  updated: Date;

  // Internal state for caching (can remain for instance-level optimization)
  private _cachedValue: any;
  private _lastCalculated: number = 0;
  // Calculation promise removed - complex calculations belong in the engine

  /**
   * Create a new FormProperty instance from validated data.
   * Does not automatically register or persist.
   */
  constructor(data: z.infer<typeof PropertySchema>) {
    // Validate data against schema
    const validated = PropertySchema.parse(data);

    // --- Explicit property assignments ---
    this.id = validated.id;
    this.name = validated.name;
    this.description = validated.description;
    this.propertyType = validated.propertyType;
    this.contextId = validated.contextId;
    this.entityId = validated.entityId;
    this.relationId = validated.relationId;
    this.staticValue = validated.staticValue;
    this.derivedFrom = validated.derivedFrom;
    this.scriptId = validated.scriptId;
    this.qualitative = validated.qualitative;
    this.quantitative = validated.quantitative;
    // --- End explicit assignments ---

    // Handle date initialization
    this.created =
      validated.created instanceof Date
        ? validated.created
        : new Date(validated.created || data.created || Date.now());
    this.updated =
      validated.updated instanceof Date
        ? validated.updated
        : new Date(validated.updated || data.updated || Date.now());
  }

  /**
   * Get the value of this property, prioritizing cache and static value.
   * Complex calculations (derived, scripted, relational) are expected to be
   * handled by the responsible Engine, which would then potentially update
   * the staticValue or provide the value through a different mechanism.
   * This method primarily serves synchronous access to known values.
   */
  async getValue(): Promise<any> {
    // Calculation promise logic removed.

    // Check cache (simple TTL)
    const cacheTTL = 1000; // 1 second
    if (
      this._cachedValue !== undefined &&
      Date.now() - this._lastCalculated < cacheTTL
    ) {
      return this._cachedValue;
    }

    // Check static value
    if (this.staticValue !== undefined) {
      this._cachedValue = this.staticValue;
      this._lastCalculated = Date.now();
      return this.staticValue;
    }

    // --- Complex Calculation Logic Removed ---
    // Derived, Scripted, Relational value calculation requires external data/execution
    // and should be handled by the Engine responding to a 'property:getRequested' verb.
    // The Engine would perform the calculation and return the result, potentially
    // updating this instance's staticValue if appropriate.

    // Indicate that the value needs calculation by the engine.
    // Option 1: Throw an error
    // throw new Error(`Value for property '${this.name}' requires calculation by the engine.`);
    // Option 2: Return undefined or a specific marker
    console.warn(
      `Value for property '${this.name}' (${this.id}) requires calculation by the engine (derived/scripted/relational). Returning undefined.`
    );
    return undefined;
  }

  /**
   * Get the value synchronously if available (cached or static).
   */
  getValueSync(): { value: any; isCached: boolean; timestamp: number } {
    // If we have a cached value, return it
    if (this._cachedValue !== undefined) {
      return {
        value: this._cachedValue,
        isCached: true,
        timestamp: this._lastCalculated,
      };
    }

    // For static values, we can return immediately
    if (this.staticValue !== undefined) {
      // Technically not "cached" in the sense of calculated, but it's the current known value
      return {
        value: this.staticValue,
        isCached: false, // Or true? Depends on definition. Let's say false.
        timestamp: this.updated.getTime(), // Use updated timestamp for static value
      };
    }

    // Otherwise we can't get the value synchronously
    return {
      value: undefined,
      isCached: false,
      timestamp: 0,
    };
  }

  /**
   * Update the static value of this property *in memory*.
   * Throws if the property is marked as immutable.
   * Note: To persist this change, PropertyService.setProperty must be called,
   * which will trigger the Engine to update the persisted definition.
   */
  setValue(value: any): void {
    if (!this.qualitative?.mutable) {
      throw new Error(`Cannot modify immutable property: ${this.name}`);
    }

    this.staticValue = value;
    this._cachedValue = value; // Update cache as well
    this._lastCalculated = Date.now(); // Update cache timestamp
    this.updated = new Date(); // Update instance updated time

    // --- Registration Call Removed ---
    // this.register();
    console.warn(
      `FormProperty '${this.name}' (${this.id}) setValue called. Remember to call PropertyService.setProperty to persist.`
    );
  }

  /**
   * Invalidate the cached value.
   */
  invalidateCache(): void {
    this._cachedValue = undefined;
    this._lastCalculated = 0;
  }

  /**
   * Validate a value against this property's constraints (dataType, range).
   * Note: Script-based validation is not included here as script execution
   * belongs in the Engine.
   */
  validate(value: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const quantitative = this.quantitative; // Alias for brevity

    // Check data type if specified
    if (quantitative?.dataType) {
      // Explicitly declare the type to include typeof results plus 'array' and 'date'
      let valueType:
        | "string"
        | "number"
        | "bigint"
        | "boolean"
        | "symbol"
        | "undefined"
        | "object"
        | "function"
        | "array"
        | "date";

      if (value === null) {
        valueType = "object"; // typeof null is 'object'
        // Add specific null handling if needed, e.g., if null isn't a valid 'object' for your schema
        // if (quantitative.dataType !== 'object') { errors.push(`Got null value`); }
      } else if (Array.isArray(value)) {
        valueType = "array";
      } else if (value instanceof Date) {
        valueType = "date";
      } else {
        valueType = typeof value;
      }

      // Now the comparison is type-safe
      if (valueType !== quantitative.dataType) {
        errors.push(`Expected ${quantitative.dataType}, got ${valueType}`);
      }
    }

    // Check range constraints for numbers
    if (quantitative?.range && typeof value === "number") {
      // Keep typeof here for JS runtime check
      if (
        quantitative.range.min !== undefined &&
        value < quantitative.range.min
      ) {
        errors.push(
          `Value ${value} is less than minimum ${quantitative.range.min}`
        );
      }
      if (
        quantitative.range.max !== undefined &&
        value > quantitative.range.max
      ) {
        errors.push(
          `Value ${value} is greater than maximum ${quantitative.range.max}`
        );
      }
    }

    // --- Script Validation Removed ---
    // if (this.scriptId) { ... }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert to plain object matching the schema (for serialization).
   */
  toJSON(): z.infer<typeof PropertySchema> {
    // Use Zod schema's parse method on the instance's current state
    // to ensure the output conforms to the schema structure.
    // This handles potential discrepancies if internal state somehow diverged.
    try {
      return PropertySchema.parse({
        id: this.id,
        name: this.name,
        description: this.description,
        propertyType: this.propertyType,
        contextId: this.contextId,
        entityId: this.entityId,
        relationId: this.relationId,
        staticValue: this.staticValue,
        derivedFrom: this.derivedFrom,
        scriptId: this.scriptId,
        qualitative: this.qualitative,
        quantitative: this.quantitative,
        created: this.created,
        updated: this.updated,
      });
    } catch (error) {
      console.error(
        `Failed to serialize FormProperty ${this.id} to JSON:`,
        error
      );
      // Fallback or re-throw depending on desired error handling
      throw error; // Re-throw ZodError
    }
  }
}
