import { Morph } from './types';

/**
 * Registry for morphs
 */
export class MorphRegistry {
  private morphs: Map<string, Morph<any, any>> = new Map();
  private pipelines: Map<string, Morph<any, any>> = new Map();
  private tags: Map<string, Set<string>> = new Map();
  private categories: Map<string, Set<string>> = new Map();

  /**
   * Register a morph
   */
  registerMorph(id: string, morph: Morph<any, any>, category?: string, tags?: string[]): void {
    this.morphs.set(id, morph);
    
    // Categorize the morph
    if (category) {
      if (!this.categories.has(category)) {
        this.categories.set(category, new Set());
      }
      this.categories.get(category)!.add(id);
    }
    
    // Add tags
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, new Set());
        }
        this.tags.get(tag)!.add(id);
      }
    }
  }

  /**
   * Register a pipeline
   */
  registerPipeline(id: string, pipeline: Morph<any, any>, category?: string, tags?: string[]): void {
    this.pipelines.set(id, pipeline);
    
    // Use same categorization as morphs
    if (category) {
      if (!this.categories.has(category)) {
        this.categories.set(category, new Set());
      }
      this.categories.get(category)!.add(id);
    }
    
    // Add tags
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, new Set());
        }
        this.tags.get(tag)!.add(id);
      }
    }
  }

  /**
   * Get a morph by ID
   */
  getMorph<T, U>(id: string): Morph<T, U> | undefined {
    return this.morphs.get(id) as Morph<T, U> | undefined;
  }

  /**
   * Get a pipeline by ID
   */
  getPipeline<T, U>(id: string): Morph<T, U> | undefined {
    return this.pipelines.get(id) as Morph<T, U> | undefined;
  }

  /**
   * Get morphs by category
   */
  getMorphsByCategory(category: string): Array<Morph<any, any>> {
    const ids = this.categories.get(category);
    if (!ids) return [];
    
    return Array.from(ids)
      .map(id => this.morphs.get(id) || this.pipelines.get(id))
      .filter(Boolean) as Array<Morph<any, any>>;
  }

  /**
   * Get morphs by tag
   */
  getMorphsByTag(tag: string): Array<Morph<any, any>> {
    const ids = this.tags.get(tag);
    if (!ids) return [];
    
    return Array.from(ids)
      .map(id => this.morphs.get(id) || this.pipelines.get(id))
      .filter(Boolean) as Array<Morph<any, any>>;
  }
}

/**
 * Singleton registry instance
 */
export const morphRegistry = new MorphRegistry();

/**
 * Register a morph with the global registry
 */
export function registerMorph(
  id: string,
  morph: Morph<any, any>,
  category?: string,
  tags?: string[]
): Morph<any, any> {
  morphRegistry.registerMorph(id, morph, category, tags);
  return morph;
}

/**
 * Register a pipeline with the global registry
 */
export function registerPipeline(
  id: string,
  pipeline: Morph<any, any>,
  category?: string,
  tags?: string[]
): Morph<any, any> {
  morphRegistry.registerPipeline(id, pipeline, category, tags);
  return pipeline;
}