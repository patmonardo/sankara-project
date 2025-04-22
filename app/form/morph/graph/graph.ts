import { createMorph } from "../core";
import { FormShape } from "../../schema/form";
import {
  GraphShape,
  GraphEntity,
  GraphRelationship,
} from "./types";

/**
 * GraphMorph - Transforms a FormShape into a GraphShape
 * 
 * This morph takes a standard FormShape and converts it into a graph representation,
 * with entity nodes and relationships based on the form structure.
 */
export const GraphMorph = createMorph<FormShape, GraphShape>(
  "GraphMorph",
  (form, context) => {
    // Validate input
    if (!form || !form.id) {
      throw new Error("Invalid form provided to GraphMorph");
    }

    // Get configuration from pipeline context
    const config = context?.data?.config || {};
    
    // Initialize GraphShape
    const graph: GraphShape = {
      id: `graph-${form.id}`,
      name: form.name || `Graph of ${form.id}`,
      description: form.description || `Graph representation of form ${form.id}`,
      // Copy all fields from the original form
      fields: [...form.fields],
      // Initialize graph-specific properties
      entities: [],
      relationships: [],
      meta: {
        // Include any existing meta properties
        ...(form.meta || {}),
        // Add graph-specific metadata
        //relationDefs: form.meta?.relationDefs || [],
        generatedAt: new Date().toISOString(),
        sourceMorph: "GraphMorph",
        entityCount: 0,
        relationshipCount: 0,
        
        // Apply configuration with precedence:
        // 1. Runtime config from pipeline
        // 2. Form meta values
        // 3. Default values
        labelPrefix: config.labelPrefix || form.meta?.labelPrefix || "",
        includeMetadata: config.includeMetadata !== undefined ? 
                        config.includeMetadata : 
                        form.meta?.includeMetadata !== false,
        excludeFromGraph: config.excludeFromGraph || form.meta?.excludeFromGraph || [],
        
        analysisPerformed: false,
        visualizationGenerated: false,
        
        // Analysis configuration
        analysisConfig: {
          includeCommunities: config.includeCommunities !== undefined ?
                             config.includeCommunities :
                             form.meta?.analysisConfig?.includeCommunities !== false,
          includeCentrality: config.includeCentrality !== undefined ?
                            config.includeCentrality :
                            form.meta?.analysisConfig?.includeCentrality !== false,
          includePaths: config.includePaths !== undefined ?
                       config.includePaths :
                       form.meta?.analysisConfig?.includePaths !== false,
        },
        
        // Visualization configuration
        visualizationConfig: {
          layout: config.layout || form.meta?.visualizationConfig?.layout || "force",
          highlightCommunities: config.highlightCommunities !== undefined ?
                               config.highlightCommunities :
                               form.meta?.visualizationConfig?.highlightCommunities !== false,
          theme: config.theme || form.meta?.visualizationConfig?.theme || "light",
        },
        testDataGenerated: false
      }
    };

    // Create the primary entity from the form
    const formEntity = createFormEntity(form);
    addEntity(graph, formEntity);

    // Process relationship definitions if available
    const relationDefs = graph.meta.relationDefs || [];
    processRelationshipDefinitions(graph, formEntity, relationDefs);

    // Handle operation-specific behaviors
    const operation = config.operation || context?.data?.operation;
    
    // Generate test data if requested through config or context
    if (config.includeTestData === true || context?.data?.includeTestData === true) {
      addTestData(graph);
      graph.meta.testDataGenerated = true;
      graph.meta.testDataTimestamp = new Date().toISOString();
    }

    // Update entity and relationship counts
    graph.meta.entityCount = graph.entities.length;
    graph.meta.relationshipCount = graph.relationships.length;

    return graph;
  },
  {
    pure: false, // Uses Date()
    fusible: true,
    cost: 2
  }
);

/**
 * Creates the primary entity representing the form
 */
function createFormEntity(form: FormShape): GraphEntity {
  const entityId = getEntityTypeId(form.id);
  
  // Extract property schema from form fields
  const propertySchema = extractPropertySchema(form.fields, form.meta?.excludeFromGraph || []);
  
  return {
    id: entityId,
    labels: [entityId],
    properties: {
      _schema: propertySchema,
      name: form.name || form.id,
      description: form.description
    },
    meta: {
      source: "FormSchema",
      createdAt: new Date().toISOString(),
      originalId: form.id,
      isNodeType: true
    }
  };
}

// ... rest of the helper functions remain the same ...
/**
 * Extracts property schema from form fields
 */
function extractPropertySchema(fields: any[], excluded: string[]): Record<string, any> {
  const schema: Record<string, any> = {};
  
  fields.forEach(field => {
    // Skip excluded fields and relationship fields (handled separately)
    if (!excluded.includes(field.id) && !isRelationshipField(field)) {
      schema[field.id] = {
        type: mapFieldTypeToGraphType(field.type),
        required: !!field.required,
        label: field.label || field.id
      };
    }
  });
  
  return schema;
}

/**
 * Maps form field types to graph property types
 */
function mapFieldTypeToGraphType(fieldType: string): string {
  const typeMap: Record<string, string> = {
    'text': 'String',
    'textarea': 'String',
    'number': 'Float',
    'integer': 'Integer',
    'boolean': 'Boolean',
    'date': 'Date',
    'datetime': 'DateTime',
    'time': 'Time',
    'email': 'String',
    'url': 'String',
    'password': 'String',
    'select': 'String',
    'multiselect': 'StringArray',
    'checkbox': 'Boolean',
    'radio': 'String',
    'array': 'Array',
    'object': 'Object',
    'file': 'String',
    'image': 'String'
  };
  
  return typeMap[fieldType] || 'String';
}

/**
 * Processes relationship definitions to create relationship types in the graph
 */
function processRelationshipDefinitions(
  graph: GraphShape,
  sourceEntityType: GraphEntity,
  relationDefs: FormRelationship[]
): void {
  relationDefs.forEach(rel => {
    // Create target entity if it doesn't exist
    const targetEntityId = rel.target;
    let targetEntity = graph.entities.find(e => e.id === targetEntityId);
    
    if (!targetEntity) {
      targetEntity = {
        id: targetEntityId,
        labels: [targetEntityId],
        properties: {
          _placeholder: true,
          name: targetEntityId
        },
        meta: {
          source: "RelationshipDefinition",
          createdAt: new Date().toISOString(),
          isNodeType: true,
          isPlaceholder: true
        }
      };
      addEntity(graph, targetEntity);
    }
    
    // Determine source and target based on direction
    const fromId = rel.direction === 'INCOMING' ? targetEntityId : sourceEntityType.id;
    const toId = rel.direction === 'INCOMING' ? sourceEntityType.id : targetEntityId;
    
    // Create relationship
    const relationshipId = `rel-${fromId}-${rel.type}-${toId}`;
    addRelationship(graph, {
      id: relationshipId,
      fromId: fromId,
      toId: toId,
      type: rel.type.toUpperCase(),
      properties: rel.properties || {},
      meta: {
        source: "FormRelationship",
        createdAt: new Date().toISOString(),
        field: rel.field,
        targetProperty: rel.targetProperty || 'id',
        createTargets: !!rel.createTargets
      }
    });
  });
}

/**
 * Adds test data entities and relationships to the graph
 */
function addTestData(graph: GraphShape): void {
  // Track test data entity count
  let testEntityCount = 0;
  
  // Get all non-placeholder entity types
  const entityTypes = graph.entities.filter(
    entity => !entity.meta?.isPlaceholder
  );
  
  // For each entity type, create sample instances
  entityTypes.forEach(entityType => {
    const typeName = entityType.id;
    const propertySchema = entityType.properties._schema || {};
    
    // Create 3-5 instances per entity type
    const instanceCount = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 1; i <= instanceCount; i++) {
      const instanceId = `${typeName.toLowerCase()}-instance-${i}`;
      const instance: GraphEntity = {
        id: instanceId,
        labels: [typeName],
        properties: generateSampleProperties(propertySchema),
        meta: {
          source: "TestData",
          createdAt: new Date().toISOString(),
          importance: Math.floor(Math.random() * 100),
        }
      };
      
      addEntity(graph, instance);
      testEntityCount++;
    }
  });
  
  // Create relationships between instances
  const instances = graph.entities.filter(
    entity => entity.meta?.source === "TestData"
  );
  
  // Create some random relationships
  const relationshipTypes = getUniqueRelationshipTypes(graph);
  
  instances.forEach(instance => {
    // Add 1-3 relationships per instance
    const relationCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < relationCount; i++) {
      // Pick a random target that isn't self
      let targetInstance = instances[Math.floor(Math.random() * instances.length)];
      while (targetInstance.id === instance.id) {
        targetInstance = instances[Math.floor(Math.random() * instances.length)];
      }
      
      // Pick a random relationship type
      const relType = relationshipTypes[Math.floor(Math.random() * relationshipTypes.length)];
      
      // Create relationship
      addRelationship(graph, {
        id: `testrel-${instance.id}-${relType}-${targetInstance.id}`,
        fromId: instance.id,
        toId: targetInstance.id,
        type: relType,
        properties: {
          weight: Math.floor(Math.random() * 10) + 1,
          testRelationship: true
        },
        meta: {
          source: "TestData",
          createdAt: new Date().toISOString(),
          strength: Math.floor(Math.random() * 100),
        }
      });
    }
  });
  
  // Update test data count in meta
  graph.meta.testDataEntityCount = testEntityCount;
}

/**
 * Generate sample property values based on a schema
 */
function generateSampleProperties(schema: Record<string, any>): Record<string, any> {
  const properties: Record<string, any> = {};
  
  Object.entries(schema).forEach(([key, def]) => {
    const propType = (def as any).type || 'String';
    
    switch (propType) {
      case 'String':
        properties[key] = `Sample ${key} value`;
        break;
      case 'Integer':
        properties[key] = Math.floor(Math.random() * 100);
        break;
      case 'Float':
        properties[key] = Math.random() * 100;
        break;
      case 'Boolean':
        properties[key] = Math.random() > 0.5;
        break;
      case 'Date':
        const date = new Date();
        date.setDate(date.getDate() + Math.floor(Math.random() * 30));
        properties[key] = date.toISOString().split('T')[0];
        break;
      case 'StringArray':
        properties[key] = ['Sample', 'Array', 'Values'];
        break;
      default:
        properties[key] = `Sample ${key} value`;
    }
  });
  
  return properties;
}

/**
 * Helper function to add an entity to the graph
 */
function addEntity(graph: GraphShape, entity: GraphEntity): void {
  // Check if entity already exists
  if (!graph.entities.some(e => e.id === entity.id)) {
    graph.entities.push(entity);
  }
}

/**
 * Helper function to add a relationship to the graph
 */
function addRelationship(graph: GraphShape, relationship: GraphRelationship): void {
  // Check if relationship already exists
  const exists = graph.relationships.some(
    r => r.id === relationship.id || 
    (r.fromId === relationship.fromId && 
     r.toId === relationship.toId && 
     r.type === relationship.type)
  );
  
  if (!exists) {
    graph.relationships.push(relationship);
  }
}

/**
 * Determine if a field represents a relationship
 */
function isRelationshipField(field: any): boolean {
  // Fields that typically represent relationships
  const relationshipTypes = ['reference', 'relation', 'entity', 'foreignKey'];
  return relationshipTypes.includes(field.type) || field.meta?.isRelationship;
}

/**
 * Get entity type ID from form ID
 */
function getEntityTypeId(formId: string): string {
  // Convert form-user-profile to UserProfile
  return formId
    .replace(/^form[-_]/, '')
    .replace(/[-_]form$/, '')
    .replace(/(^|[-_])([a-z])/g, (_, __, char) => char.toUpperCase());
}

/**
 * Get unique relationship types defined in the graph
 */
function getUniqueRelationshipTypes(graph: GraphShape): string[] {
  const types = new Set<string>();
  
  graph.relationships.forEach(rel => {
    if (rel.meta?.isRelationshipType) {
      types.add(rel.type);
    }
  });
  
  // If no relationship types defined, provide some defaults
  if (types.size === 0) {
    return ['RELATED_TO', 'CONNECTED_TO', 'BELONGS_TO'];
  }
  
  return Array.from(types);
}