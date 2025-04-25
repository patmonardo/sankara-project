import { createMorph } from "../core";
import { GraphShape } from "../graph/types";
import { PrismaShape, PrismaQuery, PrismaContext } from "./types";

/**
 * Generates a single Prisma query from a graph entity.
 */
function generatePrismaQuery(entity: any, shape: GraphShape): PrismaQuery {
  // Basic example: map the entity's id and label into a Prisma query string.
  return {
    id: entity.id,
    name: entity.label || entity.id,
    query: `// Prisma query to handle entity ${entity.id}`,
    purpose: "read",
  };
}

/**
 * GraphToPrismaMorph - Transforms a GraphShape into a PrismaShape.
 */
export const GraphToPrismaMorph = createMorph<GraphShape, PrismaShape>(
  "GraphToPrismaMorph",
  (graph, context: PrismaContext) => {
    const prismaShape: PrismaShape = {
      ...graph,
      prismaQueries: [],
      generatedAt: new Date().toISOString(),
      queryCount: 0,
      meta: {
        // Optionally copy/select meta from graph.
      },
    };

    // Map graph entities to Prisma queries.
    if (graph.entities) {
      graph.entities.forEach(entity => {
        prismaShape.prismaQueries.push(generatePrismaQuery(entity, graph));
      });
    }
    
    // (Optional) Process relationships or other graph aspects into queries.
    // if (graph.relationships) { … }

    prismaShape.queryCount = prismaShape.prismaQueries.length;
    return prismaShape;
  },
  { pure: true, fusible: true, cost: 3, memoizable: true }
);