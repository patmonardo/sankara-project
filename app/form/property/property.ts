import { z } from "zod";
import { PropertySchema, PropertyType, PropertyScriptSchema, PropertyScriptType } from "../schema/property";
import { SandarbhaSevā } from "../context/service";

/**
 * FormProperty - A contextual determination of what an entity is
 * 
 * Properties operate as the Essential Being of Thingness - they
 * represent what an entity IS within a specific context.
 * 
 * This class implements the FormProperty concept, allowing properties to:
 * 1. Be instantiated from their schema definition
 * 2. Calculate their values based on different resolution strategies
 * 3. Validate their own values
 * 4. Interact with their context
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
  
  // Internal state
  private _cachedValue: any;
  private _lastCalculated: number = 0;
  private _calculationPromise: Promise<any> | null = null;
  
  /**
   * Create a new FormProperty
   */
  constructor(data: z.infer<typeof PropertySchema>) {
    // Validate data against schema
    const validated = PropertySchema.parse(data);
    
    // Copy all fields from validated data
    Object.assign(this, validated);
    
    // Initialize with current timestamp if not provided
    this.created = data.created || new Date();
    this.updated = data.updated || new Date();
  }
  
  /**
   * Create a new property and register it with the context
   */
  static create(data: Omit<z.infer<typeof PropertySchema>, "id" | "created" | "updated">): FormProperty {
    const id = `property:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    
    const property = new FormProperty({
      ...data,
      id,
      created: new Date(),
      updated: new Date()
    });
    
    // Register property with context
    property.register();
    
    return property;
  }
  
  /**
   * Create an intrinsic property (essential to what the entity is)
   */
  static createIntrinsic(
    contextId: string, 
    entityId: string, 
    name: string, 
    value: any,
    options: {
      description?: string;
      essential?: boolean;
      mutable?: boolean;
    } = {}
  ): FormProperty {
    return FormProperty.create({
      name,
      contextId,
      entityId,
      propertyType: "intrinsic",
      staticValue: value,
      description: options.description,
      qualitative: {
        essential: options.essential ?? true,
        mutable: options.mutable ?? false,
        inherent: true,
        observable: true
      }
    });
  }
  
  /**
   * Create an extrinsic property (accidental to what the entity is)
   */
  static createExtrinsic(
    contextId: string, 
    entityId: string, 
    name: string, 
    value: any,
    options: {
      description?: string;
      mutable?: boolean;
      observable?: boolean;
    } = {}
  ): FormProperty {
    return FormProperty.create({
      name,
      contextId,
      entityId,
      propertyType: "extrinsic",
      staticValue: value,
      description: options.description,
      qualitative: {
        essential: false,
        mutable: options.mutable ?? true,
        inherent: false,
        observable: options.observable ?? true
      }
    });
  }
  
  /**
   * Create a relational property (emerges from relations)
   */
  static createRelational(
    contextId: string, 
    relationId: string, 
    name: string,
    options: {
      description?: string;
      entityId?: string;
      scriptId?: string;
      observable?: boolean;
    } = {}
  ): FormProperty {
    return FormProperty.create({
      name,
      contextId,
      relationId,
      entityId: options.entityId,
      propertyType: "relational",
      scriptId: options.scriptId,
      description: options.description,
      qualitative: {
        essential: false,
        mutable: true,
        inherent: false,
        observable: options.observable ?? true
      }
    });
  }
  
  /**
   * Create a derived property (computed from other properties)
   */
  static createDerived(
    contextId: string, 
    entityId: string, 
    name: string,
    derivedFrom: string,
    options: {
      description?: string;
      scriptId?: string;
      observable?: boolean;
    } = {}
  ): FormProperty {
    return FormProperty.create({
      name,
      contextId,
      entityId,
      propertyType: "relational",
      derivedFrom,
      scriptId: options.scriptId,
      description: options.description,
      qualitative: {
        essential: false,
        mutable: false,
        inherent: false,
        observable: options.observable ?? true
      }
    });
  }
  
  /**
   * Register this property with its context
   */
  register(): void {
    // Store property in context as a DharmaGuṇa relation
    SandarbhaSevā.guṇātmakaNiṣpādana(
      this.contextId,
      "sambandhaNirmāṇa",
      () => {
        const sandarbha = SandarbhaSevā.getSandarbha(this.contextId);
        if (!sandarbha) {
          throw new Error(`Context not found: ${this.contextId}`);
        }
        
        // Create a property definition relation
        return sandarbha.sambandhaNirmāṇa(
          this.entityId || "system",
          `propertyDef:${this.id}`,
          "propertyDefinition",
          {
            property: this.toJSON(),
            timestamp: Date.now()
          }
        );
      }
    );
  }
  
  /**
   * Get the value of this property
   */
  async getValue(): Promise<any> {
    // If there's an in-progress calculation, return that promise
    if (this._calculationPromise) {
      return this._calculationPromise;
    }
    
    // Create a new calculation promise
    this._calculationPromise = this._calculateValue();
    
    try {
      const result = await this._calculationPromise;
      return result;
    } finally {
      // Clear promise when done, regardless of success/failure
      this._calculationPromise = null;
    }
  }
  
  /**
   * Get the value synchronously if available
   */
  getValueSync(): { value: any, isCached: boolean, timestamp: number } {
    // If we have a cached value, return it
    if (this._cachedValue !== undefined) {
      return {
        value: this._cachedValue,
        isCached: true,
        timestamp: this._lastCalculated
      };
    }
    
    // For static values, we can return immediately
    if (this.staticValue !== undefined) {
      return {
        value: this.staticValue,
        isCached: false,
        timestamp: Date.now()
      };
    }
    
    // Otherwise we can't get the value synchronously
    return {
      value: undefined,
      isCached: false,
      timestamp: 0
    };
  }
  
  /**
   * Update the static value of this property
   */
  setValue(value: any): void {
    if (!this.qualitative?.mutable) {
      throw new Error(`Cannot modify immutable property: ${this.name}`);
    }
    
    this.staticValue = value;
    this._cachedValue = value;
    this._lastCalculated = Date.now();
    this.updated = new Date();
    
    // Update the property in the context
    this.register();
  }
  
  /**
   * Invalidate the cached value
   */
  invalidateCache(): void {
    this._cachedValue = undefined;
    this._lastCalculated = 0;
  }
  
  /**
   * Validate a value against this property's constraints
   */
  validate(value: any): { valid: boolean, errors: string[] } {
    const errors: string[] = [];
    
    // Check data type if specified
    if (this.quantitative?.dataType) {
      const valueType = Array.isArray(value) ? 'array' : typeof value;
      if (valueType === 'object' && value instanceof Date) {
        if (this.quantitative.dataType !== 'date') {
          errors.push(`Expected ${this.quantitative.dataType}, got date`);
        }
      } else if (valueType !== this.quantitative.dataType) {
        errors.push(`Expected ${this.quantitative.dataType}, got ${valueType}`);
      }
    }
    
    // Check range constraints for numbers
    if (this.quantitative?.range && typeof value === 'number') {
      if (this.quantitative.range.min !== undefined && value < this.quantitative.range.min) {
        errors.push(`Value ${value} is less than minimum ${this.quantitative.range.min}`);
      }
      if (this.quantitative.range.max !== undefined && value > this.quantitative.range.max) {
        errors.push(`Value ${value} is greater than maximum ${this.quantitative.range.max}`);
      }
    }
    
    // Check custom validation via script if available
    if (this.scriptId) {
      // This would call into the PropertyScript system
      // We'll implement this when we have PropertyScript class
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Convert to plain object (for serialization)
   */
  toJSON(): z.infer<typeof PropertySchema> {
    return {
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
      updated: this.updated
    };
  }
  
  /**
   * Calculate the current value of the property
   * @private
   */
  private async _calculateValue(): Promise<any> {
    // If we have a recent cached value, return it
    const cacheTTL = 1000; // 1 second
    if (this._cachedValue !== undefined && 
        (Date.now() - this._lastCalculated) < cacheTTL) {
      return this._cachedValue;
    }
    
    // Resolution strategies in order of precedence
    
    // 1. Static value
    if (this.staticValue !== undefined) {
      this._cachedValue = this.staticValue;
      this._lastCalculated = Date.now();
      return this.staticValue;
    }
    
    // 2. Derived from another property
    if (this.derivedFrom) {
      // Fetch the source property
      const sourceProperty = await FormProperty.getById(this.contextId, this.derivedFrom);
      if (!sourceProperty) {
        throw new Error(`Source property not found: ${this.derivedFrom}`);
      }
      
      // Get its value
      const sourceValue = await sourceProperty.getValue();
      
      // If we have a script, transform the value
      if (this.scriptId) {
        const script = await PropertyScript.getById(this.contextId, this.scriptId);
        if (!script) {
          throw new Error(`Script not found: ${this.scriptId}`);
        }
        
        const transformedValue = await script.execute({
          sourceValue,
          property: this.toJSON()
        });
        
        this._cachedValue = transformedValue;
        this._lastCalculated = Date.now();
        return transformedValue;
      }
      
      // Otherwise just use the source value directly
      this._cachedValue = sourceValue;
      this._lastCalculated = Date.now();
      return sourceValue;
    }
    
    // 3. Calculated via script
    if (this.scriptId) {
      const script = await PropertyScript.getById(this.contextId, this.scriptId);
      if (!script) {
        throw new Error(`Script not found: ${this.scriptId}`);
      }
      
      const calculatedValue = await script.execute({
        property: this.toJSON(),
        entityId: this.entityId,
        relationId: this.relationId
      });
      
      this._cachedValue = calculatedValue;
      this._lastCalculated = Date.now();
      return calculatedValue;
    }
    
    // 4. Relational property from context
    if (this.relationId) {
      const result = await SandarbhaSevā.guṇātmakaNiṣpādana(
        this.contextId,
        "sambandha",
        () => {
          return { value: "Relation value" }; // Placeholder
        }
      );
      
      if (result.saphala) {
        this._cachedValue = result.mūlya.value;
        this._lastCalculated = Date.now();
        return result.mūlya.value;
      }
    }
    
    // No resolution strategy worked
    throw new Error(`Cannot resolve value for property: ${this.name}`);
  }
  
  /**
   * Load a property by ID
   */
  static async getById(contextId: string, propertyId: string): Promise<FormProperty | null> {
    const result = await SandarbhaSevā.guṇātmakaNiṣpādana(
      contextId,
      "sambandhāḥPrāpti",
      () => {
        const sandarbha = SandarbhaSevā.getSandarbha(contextId);
        if (!sandarbha) {
          throw new Error(`Context not found: ${contextId}`);
        }
        
        return sandarbha.sambandhāḥPrāpti({
          prakāra: "propertyDefinition",
          para: `propertyDef:${propertyId}`
        })[0];
      }
    );
    
    if (!result.saphala || !result.mūlya) {
      return null;
    }
    
    const propertyData = result.mūlya.lakṣaṇa?.property;
    if (!propertyData) {
      return null;
    }
    
    return new FormProperty(propertyData);
  }
  
  /**
   * Find properties for an entity
   */
  static async findForEntity(contextId: string, entityId: string): Promise<FormProperty[]> {
    const result = await SandarbhaSevā.guṇātmakaNiṣpādana(
      contextId,
      "sambandhāḥPrāpti",
      () => {
        const sandarbha = SandarbhaSevā.getSandarbha(contextId);
        if (!sandarbha) {
          throw new Error(`Context not found: ${contextId}`);
        }
        
        return sandarbha.sambandhāḥPrāpti({
          prakāra: "propertyDefinition",
          pūrva: entityId
        });
      }
    );
    
    if (!result.saphala || !Array.isArray(result.mūlya)) {
      return [];
    }
    
    return result.mūlya
      .filter(r => r.lakṣaṇa?.property)
      .map(r => new FormProperty(r.lakṣaṇa.property));
  }
}

/**
 * PropertyScript - A script that determines a property
 * 
 * PropertyScripts are mechanisms by which properties manifest -
 * they implement the realization of properties within contexts.
 */
export class PropertyScript {
  // Core data following the schema
  id: string;
  name: string;
  description?: string;
  scriptType: PropertyScriptType;
  contextId: string;
  code: any;
  propertyId: string;
  input?: Record<string, any>;
  output?: Record<string, any>;
  dependencies?: string[];
  formId?: string;
  entityId?: string;
  relationId?: string;
  caching?: {
    enabled: boolean;
    ttl?: number;
  };
  created: Date;
  updated: Date;
  
  // Internal state
  private _compiledFn: Function | null = null;
  private _cache: Map<string, { value: any, timestamp: number }> = new Map();
  
  /**
   * Create a new PropertyScript
   */
  constructor(data: z.infer<typeof PropertyScriptSchema>) {
    // Validate data against schema
    const validated = PropertyScriptSchema.parse(data);
    
    // Copy all fields from validated data
    Object.assign(this, validated);
    
    // Initialize with current timestamp if not provided
    this.created = data.created || new Date();
    this.updated = data.updated || new Date();
  }
  
  /**
   * Create a new script and register it with the context
   */
  static create(data: Omit<z.infer<typeof PropertyScriptSchema>, "id" | "created" | "updated">): PropertyScript {
    const id = `script:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    
    const script = new PropertyScript({
      ...data,
      id,
      created: new Date(),
      updated: new Date()
    });
    
    // Register script with context
    script.register();
    
    return script;
  }
  
  /**
   * Create a validator script
   */
  static createValidator(
    contextId: string,
    propertyId: string,
    name: string,
    validationFn: (value: any, context: any) => boolean | string | string[],
    options: {
      description?: string;
      dependencies?: string[];
      entityId?: string;
      formId?: string;
    } = {}
  ): PropertyScript {
    return PropertyScript.create({
      name,
      contextId,
      propertyId,
      scriptType: "validator",
      code: validationFn.toString(),
      description: options.description,
      dependencies: options.dependencies,
      entityId: options.entityId,
      formId: options.formId
    });
  }
  
  /**
   * Create a calculator script
   */
  static createCalculator(
    contextId: string,
    propertyId: string,
    name: string,
    calculationFn: (inputs: any, context: any) => any,
    options: {
      description?: string;
      dependencies?: string[];
      entityId?: string;
      formId?: string;
      input?: Record<string, any>;
      output?: Record<string, any>;
      caching?: boolean;
      cacheTTL?: number;
    } = {}
  ): PropertyScript {
    return PropertyScript.create({
      name,
      contextId,
      propertyId,
      scriptType: "calculator",
      code: calculationFn.toString(),
      description: options.description,
      dependencies: options.dependencies,
      entityId: options.entityId,
      formId: options.formId,
      input: options.input,
      output: options.output,
      caching: {
        enabled: options.caching ?? true,
        ttl: options.cacheTTL
      }
    });
  }
  
  /**
   * Register this script with its context
   */
  register(): void {
    // Store script in context
    SandarbhaSevā.guṇātmakaNiṣpādana(
      this.contextId,
      "sambandhaNirmāṇa",
      () => {
        const sandarbha = SandarbhaSevā.getSandarbha(this.contextId);
        if (!sandarbha) {
          throw new Error(`Context not found: ${this.contextId}`);
        }
        
        // Create a script definition relation
        return sandarbha.sambandhaNirmāṇa(
          "system",
          `scriptDef:${this.id}`,
          "scriptDefinition",
          {
            script: this.toJSON(),
            timestamp: Date.now()
          }
        );
      }
    );
  }
  
  /**
   * Execute the script with provided inputs
   */
  async execute(inputs: Record<string, any> = {}): Promise<any> {
    // Check for cached result if caching is enabled
    if (this.caching?.enabled) {
      const cacheKey = JSON.stringify(inputs);
      const cached = this._cache.get(cacheKey);
      const ttl = this.caching.ttl || 5000; // Default 5 seconds
      
      if (cached && (Date.now() - cached.timestamp) < ttl) {
        return cached.value;
      }
    }
    
    // Get script dependencies if specified
    const dependencies: Record<string, any> = {};
    
    if (this.dependencies && this.dependencies.length > 0) {
      await Promise.all(this.dependencies.map(async (depId) => {
        const prop = await FormProperty.getById(this.contextId, depId);
        if (prop) {
          const value = await prop.getValue();
          dependencies[prop.name] = value;
        }
      }));
    }
    
    // Compile the function if not already compiled
    if (!this._compiledFn) {
      this._compiledFn = this._compileFunction();
    }
    
    try {
      // Execute the function with inputs and dependencies
      const mergedInputs = { ...dependencies, ...inputs };
      const context = {
        contextId: this.contextId,
        propertyId: this.propertyId,
        entityId: this.entityId,
        formId: this.formId,
        relationId: this.relationId,
        timestamp: Date.now()
      };
      
      const result = await this._compiledFn(mergedInputs, context);
      
      // Cache the result if caching is enabled
      if (this.caching?.enabled) {
        const cacheKey = JSON.stringify(inputs);
        this._cache.set(cacheKey, {
          value: result,
          timestamp: Date.now()
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Error executing script ${this.id} (${this.name}):`, error);
      throw new Error(`Script execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Clear the execution cache
   */
  clearCache(): void {
    this._cache.clear();
  }
  
  /**
   * Convert to plain object (for serialization)
   */
  toJSON(): z.infer<typeof PropertyScriptSchema> {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      scriptType: this.scriptType,
      contextId: this.contextId,
      code: this.code,
      propertyId: this.propertyId,
      input: this.input,
      output: this.output,
      dependencies: this.dependencies,
      formId: this.formId,
      entityId: this.entityId,
      relationId: this.relationId,
      caching: this.caching,
      created: this.created,
      updated: this.updated
    };
  }
  
  /**
   * Compile the function from its string representation
   * @private
   */
  private _compileFunction(): Function {
    try {
      // For script stored as a string function definition
      if (typeof this.code === 'string' && 
          (this.code.startsWith('function') || this.code.startsWith('('))) {
        return new Function('inputs', 'context', `
          return (${this.code})(inputs, context);
        `);
      }
      
      // For simple expressions
      return new Function('inputs', 'context', `
        return ${this.code};
      `);
    } catch (error) {
      console.error(`Error compiling script ${this.id} (${this.name}):`, error);
      throw new Error(`Script compilation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Load a script by ID
   */
  static async getById(contextId: string, scriptId: string): Promise<PropertyScript | null> {
    const result = await SandarbhaSevā.guṇātmakaNiṣpādana(
      contextId,
      "sambandhāḥPrāpti",
      () => {
        const sandarbha = SandarbhaSevā.getSandarbha(contextId);
        if (!sandarbha) {
          throw new Error(`Context not found: ${contextId}`);
        }
        
        return sandarbha.sambandhāḥPrāpti({
          prakāra: "scriptDefinition",
          para: `scriptDef:${scriptId}`
        })[0];
      }
    );
    
    if (!result.saphala || !result.mūlya) {
      return null;
    }
    
    const scriptData = result.mūlya.lakṣaṇa?.script;
    if (!scriptData) {
      return null;
    }
    
    return new PropertyScript(scriptData);
  }
  
  /**
   * Find scripts for a property
   */
  static async findForProperty(contextId: string, propertyId: string): Promise<PropertyScript[]> {
    const result = await SandarbhaSevā.guṇātmakaNiṣpādana(
      contextId,
      "sambandhāḥPrāpti",
      () => {
        const sandarbha = SandarbhaSevā.getSandarbha(contextId);
        if (!sandarbha) {
          throw new Error(`Context not found: ${contextId}`);
        }
        
        // Find all script definitions
        const allScripts = sandarbha.sambandhāḥPrāpti({
          prakāra: "scriptDefinition"
        });
        
        // Filter to only those for this property
        return allScripts.filter(s => 
          s.lakṣaṇa?.script?.propertyId === propertyId
        );
      }
    );
    
    if (!result.saphala || !Array.isArray(result.mūlya)) {
      return [];
    }
    
    return result.mūlya
      .filter(r => r.lakṣaṇa?.script)
      .map(r => new PropertyScript(r.lakṣaṇa.script));
  }
}

export default { FormProperty, PropertyScript };