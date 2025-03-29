import { z } from 'zod';
import { BaseSchema } from './being/schema/base';
import { Registry, RegistrySchema, createRegistry } from './being/schema/registry';
import { EntityRef } from './being/schema/entity';
import { registryService } from './being/registry';

/**
 * Organon - The Framework Generator
 *
 * The Organon is not a framework, but the generative principle that
 * produces frameworks while remaining fluid and dialectical itself.
 *
 * This represents the absolute science of immutable substance
 * as it dynamically determines itself through its own movement.
 */

// Different modes of framework generation
export const FrameworkModes = [
  'dialectical',  // Generates through dialectical movement
  'analytical',   // Generates through analytical division
  'synthetic',    // Generates through synthetic unification
  'systemic',     // Generates through system formation
  'organic',      // Generates through organic growth
  'teleological'  // Generates through purposive development
] as const;

// Framework orientations
export const FrameworkOrientations = [
  'ontological',  // Being-oriented
  'epistemic',    // Knowledge-oriented
  'practical',    // Action-oriented
  'axiological',  // Value-oriented
  'aesthetic',    // Beauty-oriented
  'logical'       // Logic-oriented
] as const;

// Organon schema
export const OrganonSchema = BaseSchema.extend({
  // Identity
  name: z.string(),
  description: z.string().optional(),

  // Generation principles
  mode: z.enum(FrameworkModes).default('dialectical'),
  orientation: z.enum(FrameworkOrientations).default('ontological'),

  // Generated frameworks
  registries: z.array(z.string()).default([]), // IDs of registries

  // Generation state
  generation: z.number().int().nonnegative().default(0),

  // Principles of generation
  principles: z.record(z.any()).default({}),

  // Meta-system properties
  meta: z.record(z.any()).default({})
});

export type Organon = z.infer<typeof OrganonSchema>;

/**
 * Create a new Organon
 */
export function createOrganon(params: {
  name: string;
  description?: string;
  mode?: z.infer<typeof OrganonSchema.shape.mode>;
  orientation?: z.infer<typeof OrganonSchema.shape.orientation>;
  principles?: Record<string, any>;
}): Organon {
  const now = new Date();

  return {
    id: crypto.randomUUID(),
    name: params.name,
    description: params.description,
    mode: params.mode || 'dialectical',
    orientation: params.orientation || 'ontological',
    registries: [],
    generation: 0,
    principles: params.principles || {},
    meta: {
      createdBy: 'system',
      immutableCore: true
    },
    createdAt: now,
    updatedAt: now
  };
}

/**
 * FrameworkDefinition - The blueprint for a generated framework
 */
export interface FrameworkDefinition {
  name: string;
  description?: string;
  type: string;
  entities: Array<{
    type: string;
    name: string;
    description?: string;
    properties?: Record<string, any>;
  }>;
  relations: Array<{
    type: string;
    source: { entityType: string, entityIndex: number };
    target: { entityType: string, entityIndex: number };
    properties?: Record<string, any>;
  }>;
  contexts: Array<{
    name: string;
    type: string;
    description?: string;
    entityIndices: number[];
    properties?: Record<string, any>;
  }>;
}

/**
 * OrganonService - The service that manages framework generation
 */
export class OrganonService {
  private static instance: OrganonService;

  // In-memory storage
  private organons: Map<string, Organon> = new Map();

  // Generation history
  private generationHistory: Map<string, Array<{
    generation: number;
    timestamp: Date;
    frameworks: string[];
  }>> = new Map();

  // Private constructor for singleton
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): OrganonService {
    if (!OrganonService.instance) {
      OrganonService.instance = new OrganonService();
    }
    return OrganonService.instance;
  }

  /**
   * Create a new Organon
   */
  createOrganon(params: {
    name: string;
    description?: string;
    mode?: z.infer<typeof OrganonSchema.shape.mode>;
    orientation?: z.infer<typeof OrganonSchema.shape.orientation>;
    principles?: Record<string, any>;
  }): Organon {
    const organon = createOrganon(params);

    // Validate with schema
    const validatedOrganon = OrganonSchema.parse(organon);

    // Store
    this.organons.set(organon.id, validatedOrganon);

    // Initialize generation history
    this.generationHistory.set(organon.id, []);

    return validatedOrganon;
  }

  /**
   * Get an Organon by ID
   */
  getOrganon(id: string): Organon | undefined {
    return this.organons.get(id);
  }

  /**
   * Generate a framework from this Organon
   */
  generateFramework(
    organonId: string,
    template: FrameworkDefinition,
    params?: {
      entityTransform?: (entityDef: FrameworkDefinition['entities'][0], index: number) => FrameworkDefinition['entities'][0];
      relationTransform?: (relationDef: FrameworkDefinition['relations'][0], index: number) => FrameworkDefinition['relations'][0];
      contextTransform?: (contextDef: FrameworkDefinition['contexts'][0], index: number) => FrameworkDefinition['contexts'][0];
    }
  ): { registryId: string } | { error: string } {
    const organon = this.organons.get(organonId);
    if (!organon) {
      return { error: 'Organon not found' };
    }

    try {
      // Create a new registry to hold the framework using the registry service
      const registry = registryService.createRegistry({
        name: template.name,
        description: template.description,
        type: 'framework', // Explicitly set type to 'framework'
        properties: {
          generatedBy: organonId,
          generation: organon.generation + 1,
          frameworkDefinition: template
        }
      });

      // Apply the transformations according to Organon principles
      const transformedTemplate = this.applyTransforms(template, params);

      // The registry would now be populated with the transformed entities,
      // relations, and contexts using entity, relation, and context services
      // This would involve:
      // 1. Creating entities from transformedTemplate.entities
      // 2. Creating relations from transformedTemplate.relations
      // 3. Creating contexts from transformedTemplate.contexts
      // 4. Associating them all with the registry

      // For now, we'll just update the registry stats
      registryService.updateRegistryStats(registry.id, {
        entityCount: transformedTemplate.entities.length,
        relationCount: transformedTemplate.relations.length,
        contextCount: transformedTemplate.contexts.length
      });

      // Update the Organon with the new registry
      const updatedOrganon = {
        ...organon,
        registries: [...organon.registries, registry.id],
        generation: organon.generation + 1,
        updatedAt: new Date()
      };

      // Store the updated Organon
      this.organons.set(organonId, updatedOrganon);

      // Update generation history
      const history = this.generationHistory.get(organonId) || [];
      history.push({
        generation: updatedOrganon.generation,
        timestamp: new Date(),
        frameworks: [registry.id]
      });
      this.generationHistory.set(organonId, history);

      return { registryId: registry.id };
    } catch (error) {
      return { error: `Failed to generate framework: ${(error as Error).message}` };
    }
  }

  /**
   * Apply transformations to a framework template
   */
  private applyTransforms(
    template: FrameworkDefinition,
    params?: {
      entityTransform?: (entityDef: FrameworkDefinition['entities'][0], index: number) => FrameworkDefinition['entities'][0];
      relationTransform?: (relationDef: FrameworkDefinition['relations'][0], index: number) => FrameworkDefinition['relations'][0];
      contextTransform?: (contextDef: FrameworkDefinition['contexts'][0], index: number) => FrameworkDefinition['contexts'][0];
    }
  ): FrameworkDefinition {
    const result = { ...template };

    if (params?.entityTransform) {
      result.entities = template.entities.map((entity, index) =>
        params.entityTransform!(entity, index)
      );
    }

    if (params?.relationTransform) {
      result.relations = template.relations.map((relation, index) =>
        params.relationTransform!(relation, index)
      );
    }

    if (params?.contextTransform) {
      result.contexts = template.contexts.map((context, index) =>
        params.contextTransform!(context, index)
      );
    }

    return result;
  }

  /**
   * Get a framework's generation history
   */
  getGenerationHistory(organonId: string): Array<{
    generation: number;
    timestamp: Date;
    frameworks: string[];
  }> {
    return this.generationHistory.get(organonId) || [];
  }

  /**
   * Get all Organons
   */
  getAllOrganons(): Organon[] {
    return Array.from(this.organons.values());
  }

  /**
   * Delete an Organon
   */
  deleteOrganon(id: string): boolean {
    if (!this.organons.has(id)) {
      return false;
    }

    // Delete generation history
    this.generationHistory.delete(id);

    // Delete the Organon
    return this.organons.delete(id);
  }

  /**
   * Get frameworks generated by this Organon
   */
  getGeneratedFrameworks(organonId: string): string[] {
    const organon = this.organons.get(organonId);
    return organon?.registries || [];
  }
}

// Export singleton instance
export const organonService = OrganonService.getInstance();
