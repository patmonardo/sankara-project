/**
 * Core Ontological Registry
 *
 * Maps fundamental concepts to their implementations
 */
export const OntologicalRegistry = {
  // Being Layer
  being: {
    entity: '/app/core/being/schema/entity.ts',
    relation: '/app/core/being/schema/relation.ts',
    context: '/app/core/being/schema/context.ts',
    registry: '/app/core/being/schema/registry.ts',
  },

  // Essence Layer
  essence: {
    shine: '/app/core/essence/schema/shine.ts',
    reflection: '/app/core/essence/schema/reflection.ts',
    ground: '/app/core/essence/schema/ground.ts',
    codex: '/app/core/essence/schema/codex.ts',
  },

  // System Layer
  system: {
    property: '/app/core/system/property.ts',
    graph: '/app/core/system/graph.ts',
    event: '/app/core/system/event.ts',
    service: '/app/core/system/service.ts',
  }
};

/**
 * Concept Map - Philosophical mapping of concepts
 */
export const ConceptMap = {
  entity: {
    description: 'Individual substance or particular',
    essence: 'shine',
    examples: ['person', 'object', 'idea'],
    operations: ['create', 'read', 'update', 'delete']
  },

  relation: {
    description: 'Connection between entities',
    essence: 'reflection',
    examples: ['owns', 'causes', 'contains'],
    operations: ['connect', 'disconnect', 'traverse']
  },

  context: {
    description: 'Grouping of entities and relations',
    essence: 'ground',
    examples: ['project', 'situation', 'domain'],
    operations: ['contain', 'filter', 'scope']
  },

  // More concepts...
};

/**
 * Philosophical Triads - Key conceptual structures
 */
export const PhilosophicalTriads = [
  {
    name: 'Being',
    members: ['entity', 'relation', 'context'],
    description: 'The moments of immediate existence'
  },
  {
    name: 'Essence',
    members: ['shine', 'reflection', 'ground'],
    description: 'The moments of mediated existence'
  },
  {
    name: 'Logic',
    members: ['concept', 'judgment', 'syllogism'],
    description: 'The moments of conceptual thought'
  },
  // More triads...
];
