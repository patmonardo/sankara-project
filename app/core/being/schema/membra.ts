import { z } from 'zod';
import { EntityRefSchema } from './entity';

/**
 * Membra Schema - Logical Division and Membership
 *
 * Draws from Kant's logical division (membra divisionis) and develops it
 * through Hegel's dialectical movement toward concrete universality.
 *
 * In Kantian logic, "membra" refers to the parts of a division of a concept,
 * but in our Hegelian extension, it becomes a dynamic process of determining
 * proper membership, consequence, and inherence.
 */

// Types of logical relations recognized in our system
export const LogicalRelationTypes = {
  // Membership relations (divisio)
  Membership: [
    'member_of',       // Basic membership
    'belongs_to',      // Stronger membership with implication of necessity
    'participates_in', // Active membership
    'composes',        // Constitutive membership
  ],

  // Consequence relations (nexus)
  Consequence: [
    'causes',         // Direct causation
    'leads_to',       // Indirect causation
    'results_in',     // End state causation
    'enables',        // Necessary but not sufficient condition
    'prevents',       // Negative causation
  ],

  // Inherence relations (attributa)
  Inherence: [
    'is_a',           // Type identity
    'instance_of',    // Instance relation
    'subclass_of',    // Hierarchical subsumption
    'exemplifies',    // Property-rich instance
    'characterizes',  // Property relation
  ],
} as const;

// Schema for membership specification
export const MembershipSpecSchema = z.object({
  // The entity member being considered
  member: EntityRefSchema,

  // The type of membership relation
  relation: z.enum([
    ...LogicalRelationTypes.Membership,
    ...LogicalRelationTypes.Consequence,
    ...LogicalRelationTypes.Inherence,
  ]),

  // Constraints on the membership relation
  constraints: z.record(z.any()).optional(),

  // Flags indicating special membership status
  flags: z.object({
    necessary: z.boolean().optional(),   // Is this membership necessary?
    sufficient: z.boolean().optional(),  // Is this membership sufficient?
    exclusive: z.boolean().optional(),   // Is this membership exclusive?
    transitive: z.boolean().optional(),  // Is this membership transitive?
  }).optional(),

  // Temporal aspects of the membership
  temporality: z.object({
    permanent: z.boolean().optional(),  // Is this membership permanent?
    since: z.date().optional(),         // When did this membership begin?
    until: z.date().optional(),         // When does this membership end?
  }).optional(),

  // Dialectical status of the membership
  dialectic: z.object({
    isThesis: z.boolean().optional(),      // Is this a thesis membership?
    isAntithesis: z.boolean().optional(),  // Is this an antithesis membership?
    isSynthesis: z.boolean().optional(),   // Is this a synthesis membership?
    resolves: z.array(z.string()).optional(), // IDs of memberships this resolves
  }).optional(),
});

export type MembershipSpec = z.infer<typeof MembershipSpecSchema>;

// Schema for path/trace through logical relations
export const LogicalPathSchema = z.object({
  // Start and end points
  from: EntityRefSchema,
  to: EntityRefSchema,

  // The relations that form the path
  relations: z.array(z.string()), // IDs of relations

  // Type of path
  pathType: z.enum([
    'membership',    // Path through membership relations
    'consequence',   // Path through consequence relations
    'inherence',     // Path through inherence relations
    'mixed',         // Path through mixed relation types
  ]),

  // Properties of the entire path
  properties: z.object({
    length: z.number().int().min(1),  // Number of relations in path
    isCyclic: z.boolean(),            // Does the path form a cycle?
    isDirected: z.boolean(),          // Is the path strictly directional?
    coherence: z.number().min(0).max(1).optional(), // Semantic coherence of path
  }),

  // Path metadata
  metadata: z.record(z.any()).optional(),
});

export type LogicalPath = z.infer<typeof LogicalPathSchema>;

// Schema for logical structures within the system
export const LogicalStructureSchema = z.object({
  id: z.string(),

  // Type of structure
  type: z.enum([
    'hierarchy',      // Tree-like inheritance structure
    'network',        // Graph-like associative structure
    'sequence',       // Linear/ordered structure
    'cycle',          // Circular structure
    'dialectic',      // Thesis-antithesis-synthesis structure
  ]),

  // Name and description
  name: z.string(),
  description: z.string().optional(),

  // The entities that participate in this structure
  entities: z.array(EntityRefSchema),

  // The relations that constitute this structure
  relations: z.array(z.string()), // IDs of relations

  // Properties specific to this structure
  properties: z.record(z.any()).optional(),

  // Creation and update timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LogicalStructure = z.infer<typeof LogicalStructureSchema>;

/**
 * Create a new logical structure
 */
export function createLogicalStructure(params: {
  type: z.infer<typeof LogicalStructureSchema.shape.type>;
  name: string;
  description?: string;
  entities: EntityRefSchema[];
  relations: string[];
  properties?: Record<string, any>;
}): LogicalStructure {
  const now = new Date();

  return {
    id: crypto.randomUUID(),
    type: params.type,
    name: params.name,
    description: params.description,
    entities: params.entities,
    relations: params.relations,
    properties: params.properties || {},
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a new logical path
 */
export function createLogicalPath(params: {
  from: EntityRefSchema;
  to: EntityRefSchema;
  relations: string[];
  pathType?: z.infer<typeof LogicalPathSchema.shape.pathType>;
  isCyclic?: boolean;
  isDirected?: boolean;
  coherence?: number;
  metadata?: Record<string, any>;
}): LogicalPath {
  // Determine path type based on relations if not provided
  let pathType = params.pathType;
  if (!pathType) {
    pathType = 'mixed'; // Default
    // This would require analyzing the relations to determine the actual path type
  }

  return {
    from: params.from,
    to: params.to,
    relations: params.relations,
    pathType: pathType,
    properties: {
      length: params.relations.length,
      isCyclic: params.isCyclic ?? false,
      isDirected: params.isDirected ?? true,
      coherence: params.coherence,
    },
    metadata: params.metadata,
  };
}
