import { createMorph } from "../../morph/core";
import {
    GraphShape,
    GraphEntity,
    GraphRelationship,
    FormRelationship,
} from "./types";

// --- generateLabel helper function ---
function generateLabel(id: string): string {
    const baseName = id.replace(/Form$/, '').replace(/[-_](.)/g, (_, c) => c.toUpperCase());
    const titleCaseName = toTitleCase(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    return titleCaseName;
}

/**
 * Transforms a FormShape definition into a GraphShape schema model.
 * Creates entities and relationships from the form definition.
 */
export const FormToGraphSchemaMorph = createMorph<GraphShape, GraphShape>(
  "FormToGraphSchemaMorph",
  (shape) => { // Input is GraphShape
    // Validate input
    if (!shape || !shape.id) {
      throw new Error("Invalid shape provided to FormToGraphSchemaMorph");
    }

    // --- Initialize Graph Schema ---
    const graphShape: GraphShape = {
      ...shape,
      id: `graph-schema-${shape.id}`,
      name: `${shape.name || shape.id} Graph Schema`,
      // Initialize empty arrays for graph elements
      entities: [],
      relationships: [],
      meta: {
        ...(shape.meta || {}),
        // Store relationship definitions from meta.relationships into meta.relationDefs
        relationDefs: shape.meta?.relationDefs || [],
        // Add graph-specific metadata
        generatedAt: new Date().toISOString(),
        sourceMorph: "FormToGraphSchemaMorph",
        entityCount: 0,
        relationshipCount: 0,
        // Preserve or set other meta properties
        labelPrefix: shape.meta?.labelPrefix || "",
        includeMetadata: shape.meta?.includeMetadata !== false,
      }
    };

    // --- Process Main Entity Type ---
    const mainEntityType = processFormEntityType(graphShape);
    addEntity(graphShape, mainEntityType);

    // --- Process Relationship Types defined in meta ---
    const relationDefs = graphShape.meta.relationDefs || [];
    processFormRelationshipTypes(graphShape, mainEntityType, relationDefs, graphShape);

    // --- Update Counts ---
    graphShape.meta.entityCount = graphShape.entities.length;
    graphShape.meta.relationshipCount = graphShape.relationships.length;

    return graphShape;
  },
  {
    pure: false, // Due to Date()
    fusible: true,
    cost: 2,
    memoizable: false // Due to Date()
  }
);

// Rest of the file remains unchanged
/**
 * Creates a GraphEntity representing the Node Type defined by the FormShape.
 */
function processFormEntityType(shape: GraphShape): GraphEntity {
    const entityTypeId = generateLabel(shape.id);
    const labels = [entityTypeId];
    // We can now safely access meta.labelPrefix and meta.includeMetadata
    const propertiesSchema = extractFormFieldSchema(shape);

    return {
        id: entityTypeId,
        labels: labels,
        properties: { _fieldSchema: propertiesSchema },
        meta: {
            source: "FormShape",
            originalShapeId: shape.id,
            description: shape.description || `Node type derived from ${shape.id}`,
            isNodeType: true,
        }
    };
}

/**
 * Extracts a schema representation of the form fields.
 */
function extractFormFieldSchema(shape: GraphShape): Record<string, any> {
    const fieldSchema: Record<string, any> = {};
    const excluded = shape.meta?.excludeFromGraph || [];
    // Now using meta.relationDefs instead of meta.relationships
    const relFields = shape.meta.relationDefs?.map(r => r.field) || [];

    shape.fields.forEach(field => {
        if (!excluded.includes(field.id) && !relFields.includes(field.id)) {
            fieldSchema[field.id] = {
                type: field.type,
                label: field.label,
                required: field.required || false,
                ...(field.meta || {})
            };
        }
    });
    // Add metadata fields if configured
    if (shape.meta.includeMetadata !== false) {
         fieldSchema['_formId'] = { type: 'string', label: 'Source Form ID' };
         fieldSchema['_createdAt'] = { type: 'datetime', label: 'Creation Timestamp' };
         fieldSchema['_updatedAt'] = { type: 'datetime', label: 'Update Timestamp' };
    }
    return fieldSchema;
}

/**
 * Processes relationship definitions in GraphShape.meta to create Relationship Types.
 */
function processFormRelationshipTypes(
    shape: GraphShape,
    sourceEntityType: GraphEntity,
    relationDefs: FormRelationship[], // Now explicitly using relationDefs
    graph: GraphShape,
): void {
    relationDefs.forEach((rel: FormRelationship) => {
        const targetEntityTypeLabel = rel.target;

        let targetEntityType = graph.entities.find(e => e.id === targetEntityTypeLabel);
        if (!targetEntityType) {
            targetEntityType = {
                id: targetEntityTypeLabel,
                labels: [targetEntityTypeLabel],
                properties: { _placeholder: true },
                meta: { source: "RelationshipDefinition", isNodeType: true }
            };
            addEntity(graph, targetEntityType);
        }

        const fromTypeId = rel.direction === 'INCOMING' ? targetEntityType.id : sourceEntityType.id;
        const toTypeId = rel.direction === 'INCOMING' ? sourceEntityType.id : targetEntityType.id;
        const relationshipTypeId = `reltype-${fromTypeId}-${rel.type}-${toTypeId}`;

        addRelationship(graph, {
            id: relationshipTypeId,
            fromId: fromTypeId,
            toId: toTypeId,
            type: rel.type.toUpperCase(),
            properties: { _propertySchema: rel.properties || {} },
            meta: {
                source: "FormRelationship",
                isRelationshipType: true,
            }
        });
    });
}

/**
 * Add an entity type to the graph schema.
 */
function addEntity(graph: GraphShape, entityType: GraphEntity): void {
  if (!graph.entities.some(e => e.id === entityType.id)) {
    graph.entities.push(entityType);
  }
}

/**
 * Add a relationship type to the graph schema.
 */
function addRelationship(graph: GraphShape, relationshipType: GraphRelationship): void {
   if (!graph.relationships.some(r => r.id === relationshipType.id ||
       (r.fromId === relationshipType.fromId && r.toId === relationshipType.toId && r.type === relationshipType.type))) {
    graph.relationships.push(relationshipType);
  }
}

// Add this near the top of your file or import from a utils module
function toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) =>
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}