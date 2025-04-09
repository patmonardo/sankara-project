import { MorpheusContext, ViewContext } from "../../schema/context";
import { SimpleMorph } from "../morph";
import { ViewOutput, ViewField } from "./display";

/**
 * Relationship type
 */
export type RelationshipType = 
  | 'references' 
  | 'dependsOn' 
  | 'constrains' 
  | 'derivedFrom' 
  | 'aggregates' 
  | 'links' 
  | 'custom';

/**
 * Relationship definition
 */
export interface Relationship {
  type: RelationshipType;
  sourceFieldId: string;
  targetFieldId: string;
  label?: string;
  strength?: number; // 0-1 scale
  bidirectional?: boolean;
  meta?: Record<string, any>;
}

/**
 * Field with relationship metadata
 */
export interface RelatedViewField extends ViewField {
  meta: ViewField['meta'] & {
    relationships?: {
      outgoing: Array<{
        type: RelationshipType;
        targetId: string;
        label?: string;
        action?: string;
      }>;
      incoming: Array<{
        type: RelationshipType;
        sourceId: string;
        label?: string;
        action?: string;
      }>;
      count: {
        outgoing: number;
        incoming: number;
        total: number;
      };
    };
  };
}

/**
 * View with relationship metadata
 */
export interface RelationalViewOutput extends ViewOutput {
  fields: RelatedViewField[];
  meta: ViewOutput['meta'] & {
    relationships: {
      fieldMap: Record<string, string[]>; // Maps field IDs to related field IDs
      relationshipCount: number;
      graph?: any; // Optional graph representation for visualization
    };
  };
}

/**
 * Analyze and add field relationships
 */
export const RelationshipMorph = new SimpleMorph<ViewOutput, RelationalViewOutput>(
  "RelationshipsMorph",
  (view, context: MorpheusContext) => {
    // Validate input
    if (!view || !Array.isArray(view.fields)) {
      throw new Error("Invalid view output provided to RelationshipsMorph");
    }

    const viewContext = context as ViewContext;
    const relationshipsConfig = viewContext.relationships || {};
    
    // Get explicit relationships from config
    const explicitRelationships: Relationship[] = relationshipsConfig.explicit || [];
    
    // Auto-detect relationships if enabled
    const autoDetectedRelationships: Relationship[] = 
      relationshipsConfig.autoDetect ? detectRelationships(view) : [];
    
    // Combine all relationships
    const allRelationships = [
      ...explicitRelationships,
      ...autoDetectedRelationships
    ];
    
    // Create field ID map for quick lookup
    const fieldIds = new Set(view.fields.map(field => field.id));
    
    // Filter out invalid relationships (referencing non-existent fields)
    const validRelationships = allRelationships.filter(rel => 
      fieldIds.has(rel.sourceFieldId) && fieldIds.has(rel.targetFieldId)
    );
    
    // Build relationship maps
    const outgoingMap: Record<string, Array<{type: RelationshipType, targetId: string, label?: string}>> = {};
    const incomingMap: Record<string, Array<{type: RelationshipType, sourceId: string, label?: string}>> = {};
    const fieldMap: Record<string, string[]> = {};
    
    // Initialize maps for all fields
    view.fields.forEach(field => {
      outgoingMap[field.id] = [];
      incomingMap[field.id] = [];
      fieldMap[field.id] = [];
    });
    
    // Populate maps
    validRelationships.forEach(rel => {
      // Add outgoing relationship
      outgoingMap[rel.sourceFieldId].push({
        type: rel.type,
        targetId: rel.targetFieldId,
        label: rel.label
      });
      
      // Add incoming relationship
      incomingMap[rel.targetFieldId].push({
        type: rel.type,
        sourceId: rel.sourceFieldId,
        label: rel.label
      });
      
      // Update field map
      fieldMap[rel.sourceFieldId].push(rel.targetFieldId);
      
      // Handle bidirectional relationships
      if (rel.bidirectional) {
        outgoingMap[rel.targetFieldId].push({
          type: rel.type,
          targetId: rel.sourceFieldId,
          label: rel.label
        });
        
        incomingMap[rel.sourceFieldId].push({
          type: rel.type,
          sourceId: rel.targetFieldId,
          label: rel.label
        });
        
        fieldMap[rel.targetFieldId].push(rel.sourceFieldId);
      }
    });
    
    // Create fields with relationship metadata
    const fieldsWithRelationships = view.fields.map(field => {
      const outgoing = outgoingMap[field.id];
      const incoming = incomingMap[field.id];
      
      return {
        ...field,
        meta: {
          ...field.meta,
          relationships: {
            outgoing: outgoing.map(rel => ({
              ...rel,
              action: `navigate:${rel.targetId}`
            })),
            incoming: incoming.map(rel => ({
              ...rel,
              action: `navigate:${rel.sourceId}`
            })),
            count: {
              outgoing: outgoing.length,
              incoming: incoming.length,
              total: outgoing.length + incoming.length
            }
          }
        }
      };
    }) as RelatedViewField[];
    
    // Optionally create a graph representation
    const graph = relationshipsConfig.includeGraph ? 
      createRelationshipGraph(validRelationships, view.fields) : undefined;
    
    // Return view with relationship data
    return {
      ...view,
      fields: fieldsWithRelationships,
      meta: {
        ...view.meta,
        relationships: {
          fieldMap,
          relationshipCount: validRelationships.length,
          graph
        }
      }
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 3,  // Higher cost due to relationship analysis
    memoizable: true
  }
);

/**
 * Auto-detect relationships between fields
 */
function detectRelationships(view: ViewOutput): Relationship[] {
  const relationships: Relationship[] = [];
  
  // Map of field IDs to fields for quick lookup
  const fieldMap = new Map(view.fields.map(f => [f.id, f]));
  
  // Loop through all fields
  view.fields.forEach(sourceField => {
    // Check for reference fields
    if (sourceField.type === 'reference' && sourceField.meta?.referencesField) {
      const targetId = sourceField.meta.referencesField;
      if (fieldMap.has(targetId)) {
        relationships.push({
          type: 'references',
          sourceFieldId: sourceField.id,
          targetFieldId: targetId,
          label: `References ${fieldMap.get(targetId)?.label || targetId}`
        });
      }
    }
    
    // Check for dependencies in validation
    if (sourceField.meta?.validation?.dependsOn) {
      const dependencies = 
        Array.isArray(sourceField.meta.validation.dependsOn) ? 
        sourceField.meta.validation.dependsOn : 
        [sourceField.meta.validation.dependsOn];
      
      dependencies.forEach(targetId => {
        if (fieldMap.has(targetId)) {
          relationships.push({
            type: 'dependsOn',
            sourceFieldId: sourceField.id,
            targetFieldId: targetId,
            label: `Depends on ${fieldMap.get(targetId)?.label || targetId}`
          });
        }
      });
    }
    
    // Check for calculated fields
    if (sourceField.meta?.derivedFrom) {
      const sources = 
        Array.isArray(sourceField.meta.derivedFrom) ? 
        sourceField.meta.derivedFrom : 
        [sourceField.meta.derivedFrom];
      
      sources.forEach(targetId => {
        if (fieldMap.has(targetId)) {
          relationships.push({
            type: 'derivedFrom',
            sourceFieldId: sourceField.id,
            targetFieldId: targetId,
            label: `Derived from ${fieldMap.get(targetId)?.label || targetId}`
          });
        }
      });
    }
    
    // Check for explicit relationships in metadata
    if (sourceField.meta?.relatedFields) {
      const relations = sourceField.meta.relatedFields;
      Object.entries(relations).forEach(([targetId, relType]) => {
        if (fieldMap.has(targetId)) {
          relationships.push({
            type: relType as RelationshipType || 'links',
            sourceFieldId: sourceField.id,
            targetFieldId: targetId,
            label: `Related to ${fieldMap.get(targetId)?.label || targetId}`
          });
        }
      });
    }
  });
  
  return relationships;
}

/**
 * Create a graph representation for visualization
 */
function createRelationshipGraph(
  relationships: Relationship[], 
  fields: ViewField[]
): any {
  // Create nodes from fields
  const nodes = fields.map(field => ({
    id: field.id,
    label: field.label,
    type: field.type,
    data: field.meta
  }));
  
  // Create edges from relationships
  const edges = relationships.map((rel, index) => ({
    id: `rel_${index}`,
    source: rel.sourceFieldId,
    target: rel.targetFieldId,
    type: rel.type,
    label: rel.label,
    bidirectional: rel.bidirectional || false,
    strength: rel.strength || 1,
    data: rel.meta
  }));
  
  return {
    nodes,
    edges,
    directed: true
  };
}