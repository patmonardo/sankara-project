import { SimpleMorph, MorphPipeline } from "../morph";
import { FormShape } from "../../schema/form";
import { GraphShape } from "../graph/types";
import { CypherShape } from "./types";
import { FormToGraphSchemaMorph } from "../graph/graph";
import { CypherMorph } from "./cypher";

/**
 * Configuration for the Cypher pipeline
 */
export interface CypherPipelineConfig {
  /** Neo4j version to target */
  dialectVersion?: string;
  
  /** Whether to use parameterized queries */
  parameterized?: boolean;
  
  /** Prefix for node labels */
  labelPrefix?: string;
  
  /** Whether to include metadata properties */
  includeMetadata?: boolean;
  
  /** Default node label when not specified */
  defaultNodeLabel?: string;
  
  /** Property keys to use as identifiers when matching */
  identifierProperties?: string[];
  
  /** Whether to create or match target nodes */
  createTargets?: boolean;
}

/**
 * CypherPipeline - A specialized pipeline for generating Neo4j Cypher queries from forms
 * 
 * This pipeline handles context/config at the root level, allowing individual morphs
 * to focus on their specific transformations by reading from meta properties.
 */
export class CypherPipeline {
  private pipeline: MorphPipeline<FormShape, CypherShape>;
  private config: CypherPipelineConfig;
  
  /**
   * Create a new CypherPipeline with optional configuration
   */
  constructor(config: CypherPipelineConfig = {}) {
    // Store configuration with defaults
    this.config = {
      dialectVersion: config.dialectVersion || "Neo4j 5.0",
      parameterized: config.parameterized !== false,
      labelPrefix: config.labelPrefix || "",
      includeMetadata: config.includeMetadata !== false, 
      defaultNodeLabel: config.defaultNodeLabel || "Entity",
      identifierProperties: config.identifierProperties || ["id"],
      createTargets: config.createTargets !== false
    };
    
    // Create the core pipeline
    this.pipeline = new MorphPipeline<FormShape, CypherShape>();
    
    // Add the form-to-graph transformation
    this.pipeline.add(FormToGraphSchemaMorph);
    
    // Add the cross-domain bridge (handles the mode transition)
    this.pipeline.add(new SimpleMorph<GraphShape, CypherShape>(
      "GraphToCypherBridge",
      (graphShape) => {
        // Initialize the CypherShape with config values in meta
        return {
          ...graphShape,
          queries: [],
          parameters: {},
          meta: {
            ...graphShape.meta,
            // Root pipeline injects config into meta
            dialectVersion: this.config.dialectVersion,
            parameterized: this.config.parameterized,
            labelPrefix: this.config.labelPrefix,
            includeMetadata: this.config.includeMetadata,
            defaultNodeLabel: this.config.defaultNodeLabel,
            identifierProperties: this.config.identifierProperties,
            createTargets: this.config.createTargets,
            queryCount: 0
          }
        } as CypherShape;
      }
    ));
    
    // Add the cypher query generator
    // (This morph reads from meta, doesn't need direct context access)
    this.pipeline.add(CypherMorph);
  }
  
  /**
   * Generate Cypher queries from a form definition
   * 
   * @param form The form definition to transform
   * @returns A CypherShape with generated queries
   */
  generate(form: FormShape): CypherShape {
    return this.pipeline.run(form);
  }
  
  /**
   * Get diagnostic information about the pipeline execution
   * 
   * @param form The form to process
   * @returns Diagnostic information for each stage
   */
  explain(form: FormShape): Array<{
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
      relationshipCount: 0
    });
    
    // Graph stage
    const graphShape = FormToGraphSchemaMorph.run(form);
    result.push({
      stage: "Graph Structure",
      entityCount: graphShape.entities?.length || 0,
      relationshipCount: graphShape.relationships?.length || 0
    });
    
    // CypherShape stage (before query generation)
    const bridgeMorph = new SimpleMorph<GraphShape, CypherShape>(
      "GraphToCypherBridge",
      (graphShape) => {
        return {
          ...graphShape,
          queries: [],
          parameters: {},
          meta: {
            ...graphShape.meta,
            dialectVersion: this.config.dialectVersion,
            parameterized: this.config.parameterized,
            labelPrefix: this.config.labelPrefix,
            includeMetadata: this.config.includeMetadata,
            defaultNodeLabel: this.config.defaultNodeLabel,
            identifierProperties: this.config.identifierProperties,
            createTargets: this.config.createTargets,
            queryCount: 0
          }
        } as CypherShape;
      }
    );
    const cypherShapeEmpty = bridgeMorph.run(graphShape);
    result.push({
      stage: "Cypher Container",
      entityCount: cypherShapeEmpty.entities?.length || 0,
      relationshipCount: cypherShapeEmpty.relationships?.length || 0,
      queryCount: 0
    });
    
    // Final CypherShape with queries
    const cypherShapeFinal = CypherMorph.run(cypherShapeEmpty);
    result.push({
      stage: "Cypher Complete",
      entityCount: cypherShapeFinal.entities?.length || 0,
      relationshipCount: cypherShapeFinal.relationships?.length || 0,
      queryCount: cypherShapeFinal.queries?.length || 0
    });
    
    return result;
  }
  
  /**
   * Get summary statistics about the generated queries
   * 
   * @param cypherShape The generated cypher shape
   * @returns Statistics about query types and counts
   */
  queryStats(cypherShape: CypherShape): {
    total: number;
    byPurpose: Record<string, number>;
    byEntityCount: Record<string, number>;
  } {
    const stats = {
      total: cypherShape.queries?.length || 0,
      byPurpose: {} as Record<string, number>,
      byEntityCount: {} as Record<string, number>
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
}

/**
 * Quick helper function to generate Cypher from a form
 */
export function generateCypher(form: FormShape, config?: CypherPipelineConfig): CypherShape {
  return new CypherPipeline(config).generate(form);
}

/**
 * Quick helper function to get query statistics from a form
 */
export function getCypherStats(form: FormShape, config?: CypherPipelineConfig): ReturnType<CypherPipeline['queryStats']> {
  const pipeline = new CypherPipeline(config);
  const result = pipeline.generate(form);
  return pipeline.queryStats(result);
}