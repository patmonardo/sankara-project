import { FormPipeline } from "../core/pipeline";
import { FormShape } from "../../schema/form";
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
  /**
   * Create a new graph from a form
   */
  createGraph(shape: FormShape): GraphShape {
    return this.runWithConfig(shape, { operation: "create" });
  }
  
  /**
   * Analyze an existing graph
   */
  analyzeGraph(graph: GraphShape): GraphShape & { analysis: GraphAnalysis } {
    return this.runWithConfig(graph, { operation: "analyze" });
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
  processGraph(shape: FormShape): GraphShape & { 
    analysis: GraphAnalysis,
    visualization: GraphVisualization 
  } {
    return this.runWithConfig(shape, { 
      operation: "full",
      analysisOptions: {
        includeCommunities: true,
        includeCentrality: true,
        includePaths: true
      },
      visualizationOptions: {
        layout: "force",
        highlightCommunities: true
      }
    });
  }
}

/**
 * Create a standard graph pipeline with default morphs
 */
export function createGraphPipeline(config: Record<string, any> = {}): GraphPipeline {
  const pipeline = new GraphPipeline(config);
  
  // Add basic graph generation
  pipeline.add(GraphMorph);
  
  // Add analysis capabilities
  pipeline.add(GraphAnalysisMorph);
  
  // Add visualization capabilities
  pipeline.add(GraphVisualizationMorph);
  
  return pipeline;
}