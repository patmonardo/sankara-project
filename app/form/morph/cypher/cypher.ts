import { createMorph } from "../core";
import { FormShape } from "../../schema/shape";
import { 
  CypherShape, 
  CypherQuery, 
  CypherEntity, 
  CypherRelationship 
} from "./types";
import { GraphShape } from "../graph/types";
import { toNodeLabel } from "./query";

/**
 * CypherMorph - Transforms a FormShape into a CypherShape
 * 
 * This morph takes a standard FormShape and converts it into a Cypher representation,
 * ready for query generation.
 */
export const CypherMorph = createMorph<FormShape, CypherShape>(
  "CypherMorph",
  (form, context) => {
    // Validate input
    if (!form || !form.id) {
      throw new Error("Invalid form provided to CypherMorph");
    }

    // Get configuration from pipeline context
    const config = context?.data?.config || {};
    
    // Initialize CypherShape
    const cypherShape: CypherShape = {
      id: `cypher-${form.id}`,
      name: form.name || `Cypher for ${form.id}`,
      description: form.description || `Cypher representation of form ${form.id}`,
      // Copy all fields from the original form
      fields: [...form.fields],
      // Initialize cypher-specific properties
      entities: [],
      relationships: [],
      queries: [],
      parameters: {},
      meta: {
        // Include any existing meta properties
        ...(form.meta || {}),
        // Add cypher-specific metadata
        generatedAt: new Date().toISOString(),
        sourceMorph: "CypherMorph",
        entityCount: 0,
        relationshipCount: 0,
        queryCount: 0,
        
        // Apply configuration with precedence:
        // 1. Runtime config from pipeline
        // 2. Form meta values
        // 3. Default values
        dialectVersion: config.dialectVersion || form.meta?.dialectVersion || "Neo4j 5.0",
        parameterized: config.parameterized !== undefined ? 
                      config.parameterized : 
                      form.meta?.parameterized !== false,
        labelPrefix: config.labelPrefix || form.meta?.labelPrefix || "",
        includeMetadata: config.includeMetadata !== undefined ? 
                        config.includeMetadata : 
                        form.meta?.includeMetadata !== false,
        defaultNodeLabel: config.defaultNodeLabel || form.meta?.defaultNodeLabel || "Entity",
        identifierProperties: config.identifierProperties || 
                             form.meta?.identifierProperties || 
                             ["id"],
        createTargets: config.createTargets !== undefined ? 
                      config.createTargets : 
                      form.meta?.createTargets !== false,
        relationDefs: form.meta?.relationDefs || []
      }
    };

    // Create primary entity from form
    const formEntity = createPrimaryCypherEntity(form, cypherShape.meta);
    cypherShape.entities.push(formEntity);

    // Process fields for property definitions
    processFields(cypherShape, form);
    
    // Process relationship definitions
    processRelationDefs(cypherShape);

    // Update entity and relationship counts
    cypherShape.meta.entityCount = cypherShape.entities.length;
    cypherShape.meta.relationshipCount = cypherShape.relationships.length;

    return cypherShape;
  },
  {
    pure: false, // Uses Date()
    fusible: true,
    cost: 2,
    description: "Transforms a FormShape into a CypherShape for query generation"
  }
);

/**
 * Creates a primary entity representing the form
 */
function createPrimaryCypherEntity(form: FormShape, meta: Record<string, any>): CypherEntity {
  const entityName = toNodeLabel(form.id, meta.labelPrefix);
  
  return {
    variable: "n",
    labels: [entityName],
    properties: {
      id: form.id,
      name: form.name || form.id,
      description: form.description || ""
    },
    operation: "CREATE"
  };
}

/**
 * Process form fields to create property definitions
 */
function processFields(cypherShape: CypherShape, form: FormShape): void {
  const primaryEntity = cypherShape.entities[0];
  const excludedFields = cypherShape.meta.excludeFromGraph || [];
  
  // Process each field
  form.fields.forEach(field => {
    // Skip excluded fields
    if (excludedFields.includes(field.id)) {
      return;
    }
    
    // Add field as property to the primary entity if it's a primitive type
    if (isPrimitiveField(field.type)) {
      primaryEntity.properties = primaryEntity.properties || {};
      primaryEntity.properties[field.id] = null; // Initialize with null value
    } 
    // For relationship fields, we'll handle them separately
    else if (field.type === 'relation' || field.meta?.isRelation) {
      // Handled in processRelationDefs
    }
    // For complex types like arrays or objects, could add additional processing here
  });
}

/**
 * Process relationship definitions to create relationships
 */
function processRelationDefs(cypherShape: CypherShape): void {
  const relationDefs = cypherShape.meta.relationDefs || [];
  const primaryEntityId = cypherShape.entities[0]?.variable || "n";
  
  relationDefs.forEach((rel: any, index: number) => {
    // Create target entity if needed
    const targetEntityName = toNodeLabel(rel.target, cypherShape.meta.labelPrefix);
    let targetEntity = cypherShape.entities.find(e => 
      e.labels.includes(targetEntityName)
    );
    
    // If target doesn't exist, create it
    if (!targetEntity) {
      targetEntity = {
        variable: `target${index}`,
        labels: [targetEntityName],
        properties: {
          id: rel.target.toLowerCase(),
          name: rel.target
        },
        operation: cypherShape.meta.createTargets ? "CREATE" : "MATCH"
      };
      
      cypherShape.entities.push(targetEntity);
    }
    
    // Create the relationship
    const relationship: CypherRelationship = {
      variable: `rel${index}`,
      type: rel.type,
      properties: rel.properties || {},
      direction: rel.direction || "OUTGOING",
      from: primaryEntityId,
      to: targetEntity.variable,
      operation: "CREATE"
    };
    
    cypherShape.relationships.push(relationship);
  });
}

/**
 * Check if a field type is primitive (directly storable in Neo4j)
 */
function isPrimitiveField(fieldType: string): boolean {
  const primitiveTypes = [
    'text', 'textarea', 'number', 'integer', 'boolean', 
    'date', 'datetime', 'time', 'email', 'url', 'password', 
    'select', 'radio'
  ];
  
  return primitiveTypes.includes(fieldType);
}