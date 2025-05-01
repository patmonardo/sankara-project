import { FormPipeline } from "../core/pipeline";
import { FormShape } from "../../schema/shape";
import { GraphShape, GraphAnalysis, GraphVisualization } from "./types";
import { GraphAnalysisMorph } from "./analysis";
import { GraphVisualizationMorph } from "./visualization";
import { GraphMorph } from "./graph";

/**
 * GraphPipeline - A specialized pipeline for graph operations
 * 
 * This pipeline enables transforming forms into graphs, analyzing them,
 * and generating visualizations.
 */
export class GraphPipeline extends FormPipeline<GraphShape> {
  // Keep track of configured operations and options
  private pipelineConfig: {
    operation: "create" | "analyze" | "visualize" | "full";
    analysisOptions?: {
      includeCommunities?: boolean;
      includeCentrality?: boolean;
      includePaths?: boolean;
    };
    visualizationOptions?: {
      layout?: string;
      highlightCommunities?: boolean;
    };
  };
  
  /**
   * Constructor for GraphPipeline
   */
  constructor(config?: {
    operation?: "create" | "analyze" | "visualize" | "full";
    analysisOptions?: {
      includeCommunities?: boolean;
      includeCentrality?: boolean;
      includePaths?: boolean;
    };
    visualizationOptions?: {
      layout?: string;
      highlightCommunities?: boolean;
    };
  }) {
    super("GraphPipeline", {
      description: "Pipeline for graph operations",
      metadata: {
        operation: config?.operation || "full",
        analysisOptions: config?.analysisOptions,
        visualizationOptions: config?.visualizationOptions
      }
    });
    this.pipelineConfig = {
      operation: config?.operation || "full",
      analysisOptions: config?.analysisOptions,
      visualizationOptions: config?.visualizationOptions
    };
  }

  /**
   * Create a new graph from a form
   */
  createGraph(shape: FormShape): GraphShape {
    return this.run(shape);
  }
  
  /**
   * Analyze an existing graph
   */
  analyzeGraph(graph: GraphShape): GraphShape {
    return this.run(graph);
  }
  
  /**
   * Generate visualization for a graph
   */
  visualizeGraph(graph: GraphShape): GraphShape {
    return this.run(graph);
  }
  
  /**
   * Full pipeline: Create + Analyze + Visualize
   */
  processGraph(shape: FormShape): GraphShape {
    return this.run(shape, this.pipelineConfig);
  }
}

/**
 * Create a standard graph pipeline with default morphs
 */
export function createGraphPipeline(config?: {
  operation?: "create" | "analyze" | "visualize" | "full";
  analysisOptions?: {
    includeCommunities?: boolean;
    includeCentrality?: boolean;
    includePaths?: boolean;
  };
  visualizationOptions?: {
    layout?: string;
    highlightCommunities?: boolean;
  };
}): GraphPipeline {
  const pipeline = new GraphPipeline(config);
  
  // Add basic graph generation
  pipeline.pipe(GraphMorph);
  
  // Add analysis capabilities if needed
  if (config?.operation === "analyze" || config?.operation === "full" || !config?.operation) {
    pipeline.pipe(GraphAnalysisMorph);
  }
  
  // Add visualization capabilities if needed
  if (config?.operation === "visualize" || config?.operation === "full" || !config?.operation) {
    pipeline.pipe(GraphVisualizationMorph);
  }
  
  return pipeline;
}