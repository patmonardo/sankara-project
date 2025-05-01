import { FormPipeline } from "../core";
import { FormShape } from "../../schema/shape";
import { CypherShape, CypherConfig } from "./types";
import { CypherQueryMorph } from "./query";

/**
 * CypherPipeline - A specialized pipeline for generating Neo4j Cypher queries from forms
 *
 * This pipeline extends FormPipeline to provide Cypher generation capabilities.
 */
export class CypherPipeline extends FormPipeline<CypherShape> {
  /**
   * Create a new CypherPipeline with optional configuration
   */
  constructor(config: CypherConfig = {}) {
    // Initialize with configuration
    super({
      ...config,
      operation: "generate",
    });

    // Add the cypher query generator
    this.add(CypherQueryMorph);
  }

  /**
   * Generate Cypher queries from a shape definition
   */
  generateCypher(shape: FormShape): CypherShape {
    return this.run(shape);
  }

  /**
   * Generate Cypher with specific configuration
   */
  generateCypherWithConfig(
    shape: FormShape,
    config: Partial<CypherConfig>
  ): CypherShape {
    // Fixed: Pass operation at top level, config inside data.config
    return this.runWithConfig(shape, {
      operation: "generate",
      config: { config },
    });
  }

  /**
   * Get diagnostic information about the pipeline execution
   */
  explain(shape: FormShape): Array<{
    stage: string;
    entityCount: number;
    relationshipCount: number;
    queryCount?: number;
  }> {
    const result = [];

    // Form stage
    result.push({
      stage: "Form Definition",
      entityCount: 0,
      relationshipCount: 0,
    });

    // Execute with tracking
    const { intermediateResults } = this.executeWithTracking(shape);

    // Process intermediate results
    intermediateResults.forEach((ir, index) => {
      const stageName = ir.morphName || `Stage ${index + 1}`;
      const data = ir.result;

      result.push({
        stage: stageName,
        entityCount: data.entities?.length || 0,
        relationshipCount: data.relationships?.length || 0,
        queryCount: data.queries?.length || 0,
      });
    });

    return result;
  }

  /**
   * Get summary statistics about the generated queries
   */
  queryStats(cypherShape: CypherShape): {
    total: number;
    byPurpose: Record<string, number>;
    byEntityCount: Record<string, number>;
  } {
    const stats = {
      total: cypherShape.queries?.length || 0,
      byPurpose: {} as Record<string, number>,
      byEntityCount: {} as Record<string, number>,
    };

    // Skip if no queries
    if (!cypherShape.queries?.length) {
      return stats;
    }

    // Group by purpose
    for (const query of cypherShape.queries) {
      if (!stats.byPurpose[query.purpose]) {
        stats.byPurpose[query.purpose] = 0;
      }
      stats.byPurpose[query.purpose]++;
    }

    // Count per entity
    for (const entity of cypherShape.entities || []) {
      let count = 0;
      for (const query of cypherShape.queries) {
        if (query.name.includes(entity.id)) {
          count++;
        }
      }
      stats.byEntityCount[entity.id] = count;
    }

    return stats;
  }

  /**
   * Execute pipeline with tracking of intermediate results
   * @private
   */
  private executeWithTracking(shape: FormShape): {
    result: CypherShape;
    intermediateResults: Array<{
      morphName: string;
      result: any;
    }>;
  } {
    const intermediateResults: Array<{
      morphName: string;
      result: any;
    }> = [];

    // Get the morphs
    const morphs = this.getMorphs();

    // Run each morph in sequence, capturing results
    let currentResult: any = shape;

    for (const morph of morphs) {
      currentResult = morph.transform(currentResult, {
        id: `explain-${morph.name}`,
        timestamp: Date.now(),
        data: { config: this.getConfig() },
      });

      intermediateResults.push({
        morphName: morph.name,
        result: currentResult,
      });
    }

    return {
      result: currentResult,
      intermediateResults,
    };
  }
}

/**
 * Quick helper function to generate Cypher from a shape
 */
export function generateCypher(
  shape: FormShape,
  config?: CypherConfig
): CypherShape {
  return new CypherPipeline(config).generateCypher(shape);
}

/**
 * Quick helper function to get query statistics from a shape
 */
export function getCypherStats(
  shape: FormShape,
  config?: CypherConfig
): ReturnType<CypherPipeline["queryStats"]> {
  const pipeline = new CypherPipeline(config);
  const result = pipeline.generateCypher(shape);
  return pipeline.queryStats(result);
}
