//@/form/schema/concept.ts
import { z } from 'zod';

/**
 * Schema for concept network visualization
 */

// Concept node schema
export const ConceptNodeSchema = z.object({
  id: z.string().nonempty('Concept ID is required'),
  name: z.string().nonempty('Concept name is required'),
  category: z.enum([
    'metaphysical',
    'epistemological',
    'ethical',
    'theological',
    'methodological'
  ]).optional().default('metaphysical'),
  count: z.number().int().nonnegative('Count must be a positive number'),
});

// Concept link/relation schema
export const ConceptLinkSchema = z.object({
  source: z.string().nonempty('Source concept ID is required'),
  target: z.string().nonempty('Target concept ID is required'),
  type: z.string().nonempty('Relation type is required'),
  strength: z.number()
    .positive('Strength must be positive')
    .min(0.1, 'Minimum strength is 0.1')
    .max(10, 'Maximum strength is 10')
    .default(1),
});

// Network configuration schema
export const NetworkConfigSchema = z.object({
  width: z.number().int().positive().default(800),
  height: z.number().int().positive().default(600),
  nodeRadius: z.number().positive().default(5),
  nodeFactor: z.number().positive().default(2),
  linkDistance: z.number().positive().default(100),
  chargeStrength: z.number().negative().default(-300),
  collisionRadius: z.number().positive().default(30),
});

// Complete concept network schema
export const ConceptNetworkSchema = z.object({
  nodes: z.array(ConceptNodeSchema)
    .nonempty('At least one concept node is required'),
  links: z.array(ConceptLinkSchema)
    .default([]),
  config: NetworkConfigSchema.optional().default({}),
});

// Input schema for concept network data fetching
export const ConceptNetworkQuerySchema = z.object({
  limit: z.number().int().positive().default(50),
  categories: z.array(
    z.enum([
      'metaphysical',
      'epistemological',
      'ethical',
      'theological',
      'methodological'
    ])
  ).optional(),
  centralConceptId: z.string().optional(),
  minRelationStrength: z.number().min(0).max(10).default(0),
  includeIsolatedNodes: z.boolean().default(false),
});

// Schema for concept network analytics
export const ConceptNetworkAnalyticsSchema = z.object({
  centralityConcepts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      centralityScore: z.number(),
    })
  ).default([]),
  clusterCount: z.number().int().nonnegative().default(0),
  clusters: z.array(
    z.object({
      id: z.number().int(),
      size: z.number().int().positive(),
      dominantCategory: z.string().optional(),
    })
  ).default([]),
  density: z.number().min(0).max(1).default(0),
  averageDegree: z.number().nonnegative().default(0),
});

// Types derived from schemas
export type ConceptNode = z.infer<typeof ConceptNodeSchema>;
export type ConceptLink = z.infer<typeof ConceptLinkSchema>;
export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;
export type ConceptNetwork = z.infer<typeof ConceptNetworkSchema>;
export type ConceptNetworkQuery = z.infer<typeof ConceptNetworkQuerySchema>;
export type ConceptNetworkAnalytics = z.infer<typeof ConceptNetworkAnalyticsSchema>;

/**
 * Helper functions for working with concept network schema
 */

// Validate network data
export function validateNetworkData(data: unknown): ConceptNetwork {
  return ConceptNetworkSchema.parse(data);
}

// Check if a network has valid connections
export function hasValidConnections(network: ConceptNetwork): boolean {
  if (network.links.length === 0) return false;

  const nodeIds = new Set(network.nodes.map(node => node.id));
  return network.links.every(link =>
    nodeIds.has(link.source) && nodeIds.has(link.target)
  );
}

// Create default empty network
export function createEmptyNetwork(): ConceptNetwork {
  return {
    nodes: [],
    links: [],
    config: NetworkConfigSchema.parse({}),
  };
}

// Convert database concept data to network nodes
export function dbConceptsToNodes(
  concepts: Array<{ id: string; name: string; category?: string; count: number }>
): ConceptNode[] {
  return concepts.map(concept => ConceptNodeSchema.parse(concept));
}

// Convert database relation data to network links
export function dbRelationsToLinks(
  relations: Array<{
    fromId: string;
    toId: string;
    type: string;
    strength?: number
  }>
): ConceptLink[] {
  return relations.map(relation => ConceptLinkSchema.parse({
    source: relation.fromId,
    target: relation.toId,
    type: relation.type,
    strength: relation.strength || 1
  }));
}
