import { createMorph } from "../core";
import { FormShape } from "../../schema/form";
import { GraphShape, GraphEntity, GraphRelation } from "./types";

/**
 * Factory function to create graph entities with all required fields
 */
function createEntity(props: Partial<GraphEntity> & { id: string }): GraphEntity {
  return {
    id: props.id,
    labels: props.labels || [props.id],
    properties: props.properties || {},
    source: props.source || "Unknown",
    createdAt: props.createdAt || new Date().toISOString(),
    isNodeType: props.isNodeType !== undefined ? props.isNodeType : true,
    name: props.name,
    type: props.type,
    description: props.description,
    originalId: props.originalId,
    isPlaceholder: props.isPlaceholder,
    importance: props.importance
  };
}

/**
 * Factory function to create graph relations with all required fields
 */
function createRelation(props: Partial<GraphRelation> & { 
  fromId: string;
  toId: string;
  type: string;
}): GraphRelation {
  return {
    id: props.id || `rel-${props.fromId}-${props.type}-${props.toId}`,
    fromId: props.fromId,
    toId: props.toId,
    type: props.type,
    properties: props.properties || {},
    source: props.source || "Unknown",
    createdAt: props.createdAt || new Date().toISOString(),
    field: props.field,
    targetProperty: props.targetProperty,
    createTargets: props.createTargets,
    strength: props.strength,
    isRelationType: props.isRelationType,
    direction: props.direction
  };
}

/**
 * Core Graph Morph implementation
 */
export const GraphMorph = createMorph<FormShape, GraphShape>(
  "GraphMorph",
  (form, context) => {
    // Create a minimal implementation that works correctly
    const graph: GraphShape = {
      id: `graph-${form.id}`,
      name: form.name || `Graph of ${form.id}`,
      description: form.description || `Graph representation of form ${form.id}`,
      fields: [...form.fields],
      entities: [],
      relations: [],
      
      // Required fields with proper typing
      generatedAt: new Date().toISOString(),
      sourceMorph: "GraphMorph",
      entityCount: 0,
      relationCount: 0,
      includeMetadata: true,
      excludeFromGraph: [],
      analysisPerformed: false,
      visualizationGenerated: false,
      
      // Config objects
      analysisConfig: {
        includeCommunities: true,
        includeCentrality: true,
        includePaths: true
      },
      
      visualizationConfig: {
        layout: "force",
        highlightCommunities: true,
        theme: "light"
      }
    };
    
    // Add a simple entity to demonstrate it working
    const entity = createEntity({
      id: `entity-${form.id}`,
      labels: ["Form"],
      properties: {
        name: form.name,
        description: form.description
      },
      source: "FormSchema"
    });
    
    graph.entities.push(entity);
    graph.entityCount = 1;
    
    return graph;
  }
);