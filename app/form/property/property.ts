import { createNeoComponentId } from "@/neo/extension";
import { FormRelation } from "../relation/relation";
import { FormContext } from "../context/context";
import { PropertyScript, PropertyScriptType } from "../schema/property";

/**
 * PropertyService - Manages and executes property scripts
 * within contexts
 */
export class PropertyService {
  private static scripts = new Map<string, PropertyScript>();
  private static cache = new Map<string, {
    value: any,
    expires: number
  }>();
  
  /**
   * Register a property script
   */
  static registerScript(script: PropertyScript): PropertyScript {
    this.scripts.set(script.id, script);
    
    // If the script has dependencies, create relations between them
    if (script.dependencies?.length) {
      script.dependencies.forEach(depId => {
        FormRelation.relate(
          createNeoComponentId(script.id, "property:script"), 
          createNeoComponentId(depId,"property:script"), 
          "depends-on", 
          { required: true }
        );
      });
    }
    
    return script;
  }
  
  /**
   * Get a property script by ID
   */
  static getScript(id: string): PropertyScript | undefined {
    return this.scripts.get(id);
  }
  
  /**
   * Execute a property script in a context
   */
  static execute(
    scriptId: string, 
    inputs: Record<string, any> = {},
    options: { 
      useCache?: boolean,
      forceFresh?: boolean
    } = {}
  ): any {
    const script = this.getScript(scriptId);
    if (!script) throw new Error(`Property script not found: ${scriptId}`);
    
    // Check cache if enabled and not forcing fresh execution
    const cacheKey = `${scriptId}:${JSON.stringify(inputs)}`;
    if (
      options.useCache !== false && 
      script.caching?.enabled && 
      !options.forceFresh
    ) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return cached.value;
      }
    }
    
    // Execute within context
    return FormContext.withContext(script.contextId, () => {
      try {
        // Prepare execution function
        const execFn = typeof script.code === "function" 
          ? script.code 
          : this.compileScript(script.code as string);
        
        // Execute the script within context
        const result = execFn({
          ...inputs,
          script,
          getEntity: (id: string) => {
            // Implementation would get entity from context
            return null; // Placeholder
          },
          getRelation: (id: string) => {
            // Implementation would get relation from context
            return null; // Placeholder
          },
          executeScript: (id: string, scriptInputs: Record<string, any> = {}) => {
            return PropertyService.execute(id, scriptInputs);
          },
          emitEvent: (type: string, content: any) => {
            return FormRelation.emit(
              createNeoComponentId(script.id, "property:script"), 
              type, 
              content, 
              [script.contextId]
            );
          }
        });
        
        // Cache result if caching is enabled
        if (script.caching?.enabled) {
          const ttl = script.caching.ttl || 30000; // Default 30 seconds
          this.cache.set(cacheKey, {
            value: result,
            expires: Date.now() + ttl
          });
        }
        
        return result;
      } catch (error) {
        console.error(`Error executing property script ${script.id}:`, error);
        throw error;
      }
    });
  }
  
  /**
   * Compile a script from string to function
   * This is the moment where the script transitions from pure concept to executable form
   */
  private static compileScript(scriptStr: string): Function {
    // Simple implementation for demonstration
    // In production, you'd want something more secure
    return new Function('env', `
      with(env) {
        return (${scriptStr});
      }
    `);
  }
  
  /**
   * Clear property script cache
   */
  static clearCache(scriptId?: string): void {
    if (scriptId) {
      // Clear specific script
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${scriptId}:`)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }
  
  /**
   * Get all scripts for a form
   */
  static getFormScripts(formId: string): PropertyScript[] {
    return Array.from(this.scripts.values())
      .filter(script => script.formId === formId);
  }
  
  /**
   * Get all scripts for an entity
   */
  static getEntityScripts(entityId: string): PropertyScript[] {
    return Array.from(this.scripts.values())
      .filter(script => script.entityId === entityId);
  }
}

/**
 * Create a property script
 */
export function createPropertyScript(config: {
  id?: string;
  name: string;
  description?: string;
  scriptType: PropertyScriptType;
  contextId?: string;
  code: Function | string;  // Directly use TypeScript types here
  input?: Record<string, any>;
  output?: Record<string, any>;
  dependencies?: string[];
  formId?: string;
  entityId?: string;
  relationId?: string;
  caching?: {
    enabled?: boolean;
    ttl?: number;
  };
}): PropertyScript {
  // Create context for script if not provided
  const contextId = config.contextId || FormContext.createContext({
    id: `context:property:${Date.now()}`,
    name: `Context for ${config.name} property`,
    type: "action"
  }).id;
  
  const script: PropertyScript = {
    id: config.id || `property:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`,
    name: config.name,
    description: config.description,
    scriptType: config.scriptType,
    contextId: contextId,
    code: config.code,
    input: config.input,
    output: config.output,
    dependencies: config.dependencies,
    formId: config.formId,
    entityId: config.entityId,
    relationId: config.relationId,
    caching: config.caching ? {
      enabled: config.caching.enabled ?? false,
      ttl: config.caching.ttl
    } : undefined,
    created: new Date(),
    updated: new Date()
  };
  
  return PropertyService.registerScript(script);
}

/**
 * Helper functions for common property script types
 */

/**
 * Create a getter property
 */
export function createGetter(config: {
  name: string;
  code: Function | string;
  contextId?: string;
  formId?: string;
  entityId?: string;
  caching?: boolean;
}): PropertyScript {
  return createPropertyScript({
    name: config.name,
    scriptType: "getter",
    contextId: config.contextId,
    code: config.code,
    formId: config.formId,
    entityId: config.entityId,
    caching: {
      enabled: config.caching ?? true,
      ttl: 60000 // 1 minute default for getters
    }
  });
}

/**
 * Create a calculator property
 */
export function createCalculator(config: {
  name: string;
  code: Function | string;
  dependencies?: string[];
  contextId?: string;
  formId?: string;
  entityId?: string;
  caching?: boolean;
}): PropertyScript {
  return createPropertyScript({
    name: config.name,
    scriptType: "calculator",
    contextId: config.contextId,
    code: config.code,
    dependencies: config.dependencies,
    formId: config.formId,
    entityId: config.entityId,
    caching: {
      enabled: config.caching ?? true,
      ttl: 30000 // 30 seconds default for calculations
    }
  });
}

/**
 * Create a validator property
 */
export function createValidator(config: {
  name: string;
  code: Function | string;
  contextId?: string;
  formId?: string;
  entityId?: string;
}): PropertyScript {
  return createPropertyScript({
    name: config.name,
    scriptType: "validator",
    contextId: config.contextId,
    code: config.code,
    formId: config.formId,
    entityId: config.entityId,
    caching: {
      enabled: false // Validators should not be cached
    }
  });
}