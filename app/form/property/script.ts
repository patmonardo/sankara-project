import { z } from "zod";
import { PropertyScriptSchema, PropertyScriptType } from "../schema/property";

/**
 * PropertyScript - Represents the definition of a script associated with a property.
 *
 * Primarily a data container. Actions (creation, registration, execution, retrieval)
 * are handled by an Engine (e.g., ContextEngine or a dedicated Property/ScriptEngine)
 * via verbs emitted by a Service (e.g., PropertyService or ScriptService).
 */
export class PropertyScript {
  // Core data following the schema
  id: string;
  name: string;
  description?: string;
  scriptType: PropertyScriptType;
  contextId: string;
  code: any; // The script function/code (usually string)
  propertyId: string; // Property this script computes/validates
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

  // Internal state for compiled function and cache (can remain for instance-level use)
  private _compiledFn: Function | null = null;
  private _cache: Map<string, { value: any; timestamp: number }> = new Map();

  /**
   * Create a new PropertyScript instance from validated data.
   * Does not automatically register or persist.
   */
  constructor(data: z.infer<typeof PropertyScriptSchema>) {
    // Validate data against schema
    const validated = PropertyScriptSchema.parse(data);

    // --- Direct assignments based on PropertyScriptSchema ---
    this.id = validated.id;
    this.name = validated.name;
    this.description = validated.description;
    this.scriptType = validated.scriptType;
    this.contextId = validated.contextId;
    this.code = validated.code;
    this.propertyId = validated.propertyId;
    this.input = validated.input;
    this.output = validated.output;
    this.dependencies = validated.dependencies;
    this.formId = validated.formId;
    this.entityId = validated.entityId;
    this.relationId = validated.relationId;
    this.caching = validated.caching;
    // --- End of Schema Assignments ---

    // Initialize with current timestamp if not provided
    this.created = validated.created instanceof Date ? validated.created : new Date(validated.created || data.created || Date.now());
    this.updated = validated.updated instanceof Date ? validated.updated : new Date(validated.updated || data.updated || Date.now());
  }

  // --- Static Factory Methods Removed ---
  // Creation is now handled by a Service emitting verbs for an Engine.
  // static create(...)
  // static createValidator(...)
  // static createCalculator(...)

  // --- Registration Method Removed ---
  // Registration/persistence is handled by the Engine processing creation/update verbs.
  // register(): void { ... }

  /**
   * Execute the script with provided dependencies and inputs.
   * Assumes the calling Engine has resolved and provided the dependencies.
   */
  async execute(
    dependencies: Record<string, any>, // Dependencies provided by the engine
    inputs: Record<string, any> = {}   // Specific inputs for this execution run
  ): Promise<any> {
    // Check for cached result if caching is enabled
    const cacheKeyObject = { ...dependencies, ...inputs }; // Base cache key on all inputs
    const cacheKey = JSON.stringify(cacheKeyObject);

    if (this.caching?.enabled) {
      const cached = this._cache.get(cacheKey);
      const ttl = this.caching.ttl ?? 5000; // Default 5 seconds

      if (cached && Date.now() - cached.timestamp < ttl) {
        // console.log(`Script ${this.id} cache hit for key: ${cacheKey}`);
        return cached.value;
      }
      // console.log(`Script ${this.id} cache miss for key: ${cacheKey}`);
    }

    // --- Dependency Fetching Logic Removed ---
    // The 'dependencies' argument is now expected to contain the resolved values.

    // Compile the function if not already compiled
    if (!this._compiledFn) {
      this._compiledFn = this._compileFunction();
    }

    try {
      // Execute the function with provided dependencies and inputs
      const mergedInputs = { ...dependencies, ...inputs }; // Combine for script convenience
      // Provide context information to the script
      const executionContext = { // Renamed 'context' to avoid conflict
        contextId: this.contextId,
        propertyId: this.propertyId,
        entityId: this.entityId,
        formId: this.formId,
        relationId: this.relationId,
        timestamp: Date.now(),
        // Add other relevant info the engine might know (e.g., userId)
      };

      // console.log(
      //   `Executing script ${this.id} with inputs:`,
      //   mergedInputs,
      //   "and context:",
      //   executionContext
      // );
      const result = await this._compiledFn(mergedInputs, executionContext);
      // console.log(`Script ${this.id} execution result:`, result);

      // Cache the result if caching is enabled
      if (this.caching?.enabled) {
        this._cache.set(cacheKey, {
          value: result,
          timestamp: Date.now(),
        });
        // console.log(`Script ${this.id} cached result for key: ${cacheKey}`);
      }

      return result;
    } catch (error) {
      console.error(`Error executing script ${this.id} (${this.name}):`, error);
      throw new Error(
        `Script execution failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Clear the execution cache
   */
  clearCache(): void {
    this._cache.clear();
    // console.log(`Cache cleared for script ${this.id}`);
  }

  /**
   * Convert to plain object (for serialization) matching PropertyScriptSchema
   */
  toJSON(): z.infer<typeof PropertyScriptSchema> {
    // Use Zod schema's parse method on the instance's current state
    // to ensure the output conforms to the schema structure.
    try {
        return PropertyScriptSchema.parse({
          id: this.id,
          name: this.name,
          description: this.description,
          scriptType: this.scriptType,
          contextId: this.contextId,
          code: this.code, // Ensure code is serializable (e.g., string)
          propertyId: this.propertyId,
          input: this.input,
          output: this.output,
          dependencies: this.dependencies,
          formId: this.formId,
          entityId: this.entityId,
          relationId: this.relationId,
          caching: this.caching,
          created: this.created,
          updated: this.updated,
        });
    } catch (error) {
        console.error(`Failed to serialize PropertyScript ${this.id} to JSON:`, error);
        throw error; // Re-throw ZodError
    }
  }

  /**
   * Compile the function from its string representation
   * @private
   */
  private _compileFunction(): Function {
    if (!this.code) {
      throw new Error(
        `Script ${this.id} (${this.name}) has no code to compile.`
      );
    }

    try {
      // Primarily expect code to be a string representing a function
      if (typeof this.code === "string") {
        const AsyncFunction = Object.getPrototypeOf(
          async function () {}
        ).constructor;
        // Pass 'inputs' and 'context' as arguments to the compiled function
        return new AsyncFunction(
          "inputs",
          "context", // Renamed from executionContext for consistency with script code
          `
          try {
            // Assume this.code is a string like "(inputs, context) => { ... }"
            const userFunction = (${this.code});
            // Call the user's function with the provided arguments
            return await userFunction(inputs, context);
          } catch (err) {
            console.error("Error within compiled script execution:", err);
            throw err; // Re-throw error
          }
        `
        );
      }
      // Support direct function assignment (less likely if serialized)
      else if (typeof this.code === "function") {
        console.warn(
          `Script ${this.id} code is a direct function. This might not serialize/deserialize correctly.`
        );
        return this.code;
      }

      throw new Error(
        `Unsupported code type for script ${this.id}: ${typeof this.code}`
      );
    } catch (error) {
      console.error(
        `Error compiling script ${this.id} (${this.name}):`,
        this.code,
        error
      );
      throw new Error(
        `Script compilation failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  // --- Static Retrieval Methods Removed ---
  // Retrieval is now handled by a Service emitting verbs for an Engine.
  // static async getScript(...)
  // static async findForProperty(...)
}