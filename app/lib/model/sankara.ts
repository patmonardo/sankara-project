//@/lib/model/sankara.ts
import { prisma } from '@/lib/data/client';

export class SankaraModel {
  /**
   * Get corpus statistics for dashboard
   */
  static async getCorpusStats() {
    try {
      const [
        textCount,
        conceptCount,
        relationCount,
        explorationCount
      ] = await Promise.all([
        prisma.sankaraText.count(),
        prisma.concept.count(),
        prisma.conceptRelation.count(),
        prisma.exploration.count()
      ]);

      return {
        textCount,
        conceptCount,
        relationCount,
        explorationCount
      };
    } catch (error) {
      console.error("Error fetching corpus stats:", error);
      return {
        textCount: 0,
        conceptCount: 0,
        relationCount: 0,
        explorationCount: 0
      };
    }
  }

  /**
   * Get concept frequency data
   */
  static async getConceptFrequency(limit = 50, categoryFilter?: string[]) {
    try {
      const concepts = await prisma.concept.findMany({
        where: categoryFilter ? {
          category: { in: categoryFilter }
        } : undefined,
        include: {
          _count: {
            select: { textConcepts: true }
          }
        },
        orderBy: {
          textConcepts: {
            _count: 'desc'
          }
        },
        take: limit
      });

      return concepts.map(concept => ({
        id: concept.id,
        name: concept.name,
        category: concept.category || 'unknown',
        frequency: concept._count.textConcepts
      }));
    } catch (error) {
      console.error("Error fetching concept frequency:", error);
      return [];
    }
  }

  /**
   * Get concept network data for visualization
   */
  static async getConceptNetwork(
    limit = 50,
    centralConceptId?: string,
    minStrength = 0.0
  ) {
    try {
      // If we have a central concept, prioritize relations with that concept
      let conceptsQuery = {};

      if (centralConceptId) {
        conceptsQuery = {
          OR: [
            {
              fromRelations: {
                some: {
                  toId: centralConceptId,
                  strength: { gte: minStrength }
                }
              }
            },
            {
              toRelations: {
                some: {
                  fromId: centralConceptId,
                  strength: { gte: minStrength }
                }
              }
            },
            {
              id: centralConceptId
            }
          ]
        };
      }

      // Get concepts first
      const concepts = await prisma.concept.findMany({
        where: conceptsQuery,
        include: {
          _count: {
            select: { textConcepts: true }
          }
        },
        take: limit
      });

      // Get concept IDs for relation query
      const conceptIds = concepts.map(c => c.id);

      // Get relations between these concepts
      const relations = await prisma.conceptRelation.findMany({
        where: {
          fromId: { in: conceptIds },
          toId: { in: conceptIds },
          strength: { gte: minStrength }
        }
      });

      return {
        concepts,
        relations
      };
    } catch (error) {
      console.error("Error fetching concept network:", error);
      return {
        concepts: [],
        relations: []
      };
    }
  }

  /**
   * Get recent explorations
   */
  static async getRecentExplorations(limit = 5) {
    try {
      return prisma.exploration.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          concepts: {
            include: {
              concept: true
            },
            take: 3
          },
          texts: {
            include: {
              text: true
            },
            take: 1
          }
        }
      });
    } catch (error) {
      console.error("Error fetching recent explorations:", error);
      return [];
    }
  }

  /**
   * Get text categories distribution
   */
  static async getTextCategories() {
    try {
      const texts = await prisma.sankaraText.findMany({
        select: {
          category: true
        }
      });

      const categories: Record<string, number> = {};

      texts.forEach(text => {
        const category = text.category || 'uncategorized';
        categories[category] = (categories[category] || 0) + 1;
      });

      return Object.entries(categories).map(([name, count]) => ({
        name,
        count
      }));
    } catch (error) {
      console.error("Error fetching text categories:", error);
      return [];
    }
  }

  /**
   * Get a single text with sections and concepts
   */
  static async getText(id: string) {
    try {
      return prisma.sankaraText.findUnique({
        where: { id },
        include: {
          sections: {
            orderBy: { position: 'asc' }
          },
          concepts: {
            include: {
              concept: true
            }
          }
        }
      });
    } catch (error) {
      console.error(`Error fetching text ${id}:`, error);
      return null;
    }
  }

  /**
   * Search for texts by concept
   */
  static async getTextsByConceptId(conceptId: string, limit = 10) {
    try {
      return prisma.sankaraText.findMany({
        where: {
          concepts: {
            some: {
              conceptId
            }
          }
        },
        take: limit,
        include: {
          concepts: {
            include: {
              concept: true
            },
            where: {
              conceptId
            }
          }
        }
      });
    } catch (error) {
      console.error(`Error fetching texts for concept ${conceptId}:`, error);
      return [];
    }
  }

  /**
   * Get a single concept with related concepts
   */
  static async getConcept(id: string) {
    try {
      const concept = await prisma.concept.findUnique({
        where: { id },
        include: {
          fromRelations: {
            include: {
              toConcept: true
            }
          },
          toRelations: {
            include: {
              fromConcept: true
            }
          },
          textConcepts: {
            include: {
              text: true
            },
            take: 5
          }
        }
      });

      if (!concept) return null;

      // Format related concepts
      const relatedConcepts = [
        ...concept.fromRelations.map(rel => ({
          id: rel.toConcept.id,
          name: rel.toConcept.name,
          relation: rel.type,
          direction: 'to' as const,
          strength: rel.strength || 1
        })),
        ...concept.toRelations.map(rel => ({
          id: rel.fromConcept.id,
          name: rel.fromConcept.name,
          relation: rel.type,
          direction: 'from' as const,
          strength: rel.strength || 1
        }))
      ];

      return {
        ...concept,
        relatedConcepts,
        texts: concept.textConcepts.map(tc => tc.text)
      };
    } catch (error) {
      console.error(`Error fetching concept ${id}:`, error);
      return null;
    }
  }
}
