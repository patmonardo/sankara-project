import { createMorph } from "../../morph/core";
import { CypherShape, CypherQuery } from "./types";

/**
 * Transforms a CypherShape to generate Neo4j queries based on entities and relationships
 */
export const CypherMorph = createMorph<CypherShape, CypherShape>(
  "CypherMorph",
  (shape, context) => {
    // Validate input
    if (!shape || !shape.id) {
      throw new Error("Invalid shape provided to CypherMorph");
    }

    // Initialize arrays if not present
    shape.queries = shape.queries || [];
    shape.parameters = shape.parameters || {};
    
    // Initialize or update meta
    shape.meta = shape.meta || {};
    shape.meta.generatedAt = shape.meta.generatedAt || new Date().toISOString();
    shape.meta.sourceMorph = "CypherMorph";

    // Generate schema/constraint queries
    generateSchemaQueries(shape);
    
    // Generate CRUD queries for entities
    if (shape.entities) {
      shape.entities.forEach(entity => {
        // Create
        generateCreateQuery(entity, shape);
        
        // Read
        generateMatchQuery(entity, shape);
        
        // Update
        generateUpdateQuery(entity, shape);
        
        // Delete
        generateDeleteQuery(entity, shape);
      });
    }
    
    // Generate relationship queries
    if (shape.relationships) {
      shape.relationships.forEach(rel => {
        generateRelationshipQuery(rel, shape);
      });
    }
    
    // Generate graph traversal queries
    if (shape.relationships && shape.relationships.length > 0) {
      generateTraversalQueries(shape);
    }

    // Update query count in meta
    shape.meta.queryCount = shape.queries.length;

    return shape;
  },
  {
    pure: false, // Due to Date() when generatedAt not provided
    fusible: true,
    cost: 3,
    memoizable: false, // Due to potential Date()
    description: "Generates Neo4j Cypher queries from a graph shape"
  }
);

/**
 * Generate schema-related queries (constraints and indexes)
 */
function generateSchemaQueries(shape: CypherShape): void {
  // Skip if no entities
  if (!shape.entities) return;
  
  // For each entity, create constraints and indexes as needed
  shape.entities.forEach(entity => {
    // Get properly formatted entity label with prefix
    const entityLabels = Array.isArray(entity.labels) && entity.labels.length > 0 
      ? entity.labels.map(label => prependLabelPrefix(label, shape.meta?.labelPrefix))
      : [prependLabelPrefix(entity.id, shape.meta?.labelPrefix)];
    
    const entityLabel = entityLabels[0];  // Use the first label for constraints
    
    // Create unique constraint on id property if it exists in the schema
    const idProperties = shape.meta?.identifierProperties || ["id"];
    idProperties.forEach(idProp => {
      if (entity.properties?._fieldSchema?.[idProp]) {
        const constraintQuery: CypherQuery = {
          id: `constraint-${entity.id}-${idProp}`,
          name: `Create unique constraint for ${entityLabel}.${idProp}`,
          query: `CREATE CONSTRAINT IF NOT EXISTS FOR (n:${entityLabel}) REQUIRE n.${idProp} IS UNIQUE`,
          purpose: "schema",
          executionOrder: 0, // Schema operations should run first
        };
        
        shape.queries.push(constraintQuery);
      }
    });
    
    // Create indexes for fields marked as indexed
    const fieldSchema = entity.properties?._fieldSchema || {};
    Object.entries(fieldSchema).forEach(([fieldId, fieldDef]: [string, any]) => {
      if (fieldDef.index === true) {
        const indexQuery: CypherQuery = {
          id: `index-${entity.id}-${fieldId}`,
          name: `Create index on ${entityLabel}.${fieldId}`,
          query: `CREATE INDEX IF NOT EXISTS FOR (n:${entityLabel}) ON (n.${fieldId})`,
          purpose: "schema",
          executionOrder: 0,
        };
        
        shape.queries.push(indexQuery);
      }
    });
  });
}

/**
 * Generate a CREATE query for an entity
 */
function generateCreateQuery(entity: any, shape: CypherShape): void {
  const variable = "n";
  const paramName = "props";
  
  // Get properly formatted entity label(s)
  const entityLabels = Array.isArray(entity.labels) && entity.labels.length > 0 
    ? entity.labels.map((label: string) => prependLabelPrefix(label, shape.meta?.labelPrefix))
    : [prependLabelPrefix(entity.id, shape.meta?.labelPrefix)];
  
  const labelString = entityLabels.join(':');
  
  // Generate the Cypher text
  const cypherText = `CREATE (${variable}:${labelString} $${paramName})
RETURN ${variable}`;

  // Add to shape queries
  shape.queries.push({
    id: `create-${entity.id}`,
    name: `Create ${entity.id} node`,
    query: cypherText,
    purpose: "create",
    executionOrder: 1,
  });
}

/**
 * Generate a MATCH query for an entity
 */
function generateMatchQuery(entity: any, shape: CypherShape): void {
  const variable = "n";
  
  // Get properly formatted entity label(s)
  const entityLabels = Array.isArray(entity.labels) && entity.labels.length > 0 
    ? entity.labels.map((label: string) => prependLabelPrefix(label, shape.meta?.labelPrefix))
    : [prependLabelPrefix(entity.id, shape.meta?.labelPrefix)];
  
  const labelString = entityLabels.join(':');
  
  // Get identifier property (usually 'id')
  const idProp = shape.meta?.identifierProperties?.[0] || "id";
  
  // Build the query - for basic match by ID
  const matchById = `MATCH (${variable}:${labelString} {${idProp}: $${idProp}})
RETURN ${variable}`;

  // Add to shape queries
  shape.queries.push({
    id: `match-by-id-${entity.id}`,
    name: `Match ${entity.id} node by ${idProp}`,
    query: matchById,
    purpose: "match",
    executionOrder: 1,
  });
  
  // Add a more general match with filtering
  const matchFiltered = `MATCH (${variable}:${labelString})
WHERE $filter IS NULL OR ANY(key IN keys($filter) WHERE ${variable}[key] = $filter[key])
RETURN ${variable}`;

  // Add to shape queries
  shape.queries.push({
    id: `match-filtered-${entity.id}`,
    name: `Match ${entity.id} nodes with filter`,
    query: matchFiltered,
    purpose: "match",
    executionOrder: 1,
  });
}

/**
 * Generate an UPDATE query for an entity
 */
function generateUpdateQuery(entity: any, shape: CypherShape): void {
  const variable = "n";
  const propsParam = "props";
  
  // Get properly formatted entity label(s)
  const entityLabels = Array.isArray(entity.labels) && entity.labels.length > 0 
    ? entity.labels.map((label: string) => prependLabelPrefix(label, shape.meta?.labelPrefix))
    : [prependLabelPrefix(entity.id, shape.meta?.labelPrefix)];
  
  const labelString = entityLabels.join(':');
  
  // Get identifier property (usually 'id')
  const idProp = shape.meta?.identifierProperties?.[0] || "id";
  
  // Build the query
  const updateQuery = `MATCH (${variable}:${labelString} {${idProp}: $${idProp}})
SET ${variable} += $${propsParam}
RETURN ${variable}`;

  // Add to shape queries
  shape.queries.push({
    id: `update-${entity.id}`,
    name: `Update ${entity.id} node`,
    query: updateQuery,
    purpose: "update",
    executionOrder: 1,
  });
}

/**
 * Generate a DELETE query for an entity
 */
function generateDeleteQuery(entity: any, shape: CypherShape): void {
  const variable = "n";
  
  // Get properly formatted entity label(s)
  const entityLabels = Array.isArray(entity.labels) && entity.labels.length > 0 
    ? entity.labels.map((label: string) => prependLabelPrefix(label, shape.meta?.labelPrefix))
    : [prependLabelPrefix(entity.id, shape.meta?.labelPrefix)];
  
  const labelString = entityLabels.join(':');
  
  // Get identifier property (usually 'id')
  const idProp = shape.meta?.identifierProperties?.[0] || "id";
  
  // Build the query
  const deleteQuery = `MATCH (${variable}:${labelString} {${idProp}: $${idProp}})
DETACH DELETE ${variable}`;

  // Add to shape queries
  shape.queries.push({
    id: `delete-${entity.id}`,
    name: `Delete ${entity.id} node`,
    query: deleteQuery,
    purpose: "delete",
    executionOrder: 1,
  });
}

/**
 * Generate a query to create a relationship
 */
function generateRelationshipQuery(relationship: any, shape: CypherShape): void {
  const fromVar = "source";
  const toVar = "target";
  const relVar = "r";
  const relType = relationship.type;
  
  // Get identifier property (usually 'id')
  const idProp = shape.meta?.identifierProperties?.[0] || "id";
  
  // Get from and to entity labels
  const fromEntity = shape.entities?.find(e => e.id === relationship.fromId);
  const toEntity = shape.entities?.find(e => e.id === relationship.toId);
  
  if (!fromEntity || !toEntity) {
    // Skip if we can't find both entities
    return;
  }
  
  const fromLabels = Array.isArray(fromEntity.labels) && fromEntity.labels.length > 0 
    ? fromEntity.labels.map(label => prependLabelPrefix(label, shape.meta?.labelPrefix))
    : [prependLabelPrefix(fromEntity.id, shape.meta?.labelPrefix)];
  
  const toLabels = Array.isArray(toEntity.labels) && toEntity.labels.length > 0 
    ? toEntity.labels.map(label => prependLabelPrefix(label, shape.meta?.labelPrefix))
    : [prependLabelPrefix(toEntity.id, shape.meta?.labelPrefix)];
  
  // Build the query for creating a relationship
  const createRelQuery = `MATCH (${fromVar}:${fromLabels.join(':')} {${idProp}: $fromId})
MATCH (${toVar}:${toLabels.join(':')} {${idProp}: $toId})
CREATE (${fromVar})-[${relVar}:${relType} $props]->(${toVar})
RETURN ${relVar}, ${fromVar}, ${toVar}`;

  // Add to shape queries
  shape.queries.push({
    id: `create-rel-${relationship.id || relationship.type}`,
    name: `Create ${relType} relationship`,
    query: createRelQuery,
    purpose: "create",
    executionOrder: 2, // After node creation
  });
}

/**
 * Generate graph traversal queries
 */
function generateTraversalQueries(shape: CypherShape): void {
  // Create a basic traversal query to find connected nodes
  if (shape.entities?.length >= 2 && shape.relationships?.length >= 1) {
    const srcEntity = shape.entities[0];
    const destEntity = shape.entities[1];
    
    const srcLabels = Array.isArray(srcEntity.labels) && srcEntity.labels.length > 0 
      ? srcEntity.labels.map(label => prependLabelPrefix(label, shape.meta?.labelPrefix))
      : [prependLabelPrefix(srcEntity.id, shape.meta?.labelPrefix)];
    
    const destLabels = Array.isArray(destEntity.labels) && destEntity.labels.length > 0 
      ? destEntity.labels.map(label => prependLabelPrefix(label, shape.meta?.labelPrefix))
      : [prependLabelPrefix(destEntity.id, shape.meta?.labelPrefix)];
      
    const srcLabelString = srcLabels.join(':');
    const destLabelString = destLabels.join(':');
    
    // Get identifier property (usually 'id')
    const idProp = shape.meta?.identifierProperties?.[0] || "id";
    
    // General traversal
    const traversalQuery = `MATCH path = (src:${srcLabelString} {${idProp}: $${idProp}})-[*1..${shape.relationships.length + 1}]->(related)
RETURN path LIMIT $limit`;

    // Add to shape queries
    shape.queries.push({
      id: `traversal-${shape.id}`,
      name: `Traverse from ${srcEntity.id}`,
      query: traversalQuery,
      purpose: "match",
      executionOrder: 3, // After relationship creation
    });
    
    // Path finding between two specific nodes
    const pathQuery = `MATCH path = shortestPath((src:${srcLabelString} {${idProp}: $sourceId})-[*..10]->(dest:${destLabelString} {${idProp}: $targetId}))
RETURN path`;

    // Add to shape queries
    shape.queries.push({
      id: `path-${shape.id}`,
      name: `Find path between ${srcEntity.id} and ${destEntity.id}`,
      query: pathQuery,
      purpose: "match",
      executionOrder: 3,
    });
  }
}

/**
 * Helper function to prepend label prefix if specified
 */
function prependLabelPrefix(label: string, prefix?: string): string {
  if (!prefix) return label;
  return `${prefix}${label}`;
}

/**
 * Helper function to convert shape ID to a Neo4j node label with proper casing
 */
export function toNodeLabel(id: string, prefix?: string): string {
  // Remove common prefixes/suffixes
  let label = id.replace(/Form$/, "").replace(/^form/, "");

  // Convert kebab-case or snake_case to PascalCase
  label = label
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());

  // Add custom prefix if specified
  if (prefix) {
    label = prefix + label;
  }

  return label;
}