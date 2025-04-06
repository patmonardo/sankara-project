import { NeoCore, NeoExtension } from '../neo';

/**
 * Sara Extension
 * 
 * Extends the Neo Core's manifestation into the Conceptual domain.
 */
export class SaraExtension implements NeoExtension {
  id = 'sara';
  type = 'concepts';
  capabilities = ['conceptMapping', 'ontology', 'semanticAnalysis'];
  
  private core: NeoCore | null = null;
  private conceptEngine: any; // Sara concept engine
  
  constructor(conceptEngine: any) {
    this.conceptEngine = conceptEngine;
  }
  
  initialize(core: NeoCore): void {
    this.core = core;
    this.setupExtension();
  }
  
  private setupExtension() {
    if (!this.core) return;
    
    // Listen for entity creation to apply concept extraction
    this.core.dialectic.onEvent('entity-created', (event) => {
      // Only process text-containing entities
      if (!this.hasTextContent(event.content.entity)) return;
      
      // Extract concepts from entity text
      this.extractConcepts(event.content.entityId);
    });
    
    // Listen for entity updates to update concepts
    this.core.dialectic.onEvent('entity-updated', (event) => {
      // Only process text-containing entities
      if (!this.hasTextContent(event.content.entity)) return;
      
      // Update concepts for entity
      this.updateConcepts(event.content.entityId);
    });
    
    // Listen for concept events from Sara
    this.conceptEngine.on('concept:discovered', (conceptEvent: any) => {
      if (!this.core) return;
      
      // Create concept entity if it doesn't exist
      this.ensureConceptExists(conceptEvent.concept);
    });
  }
  
  handleEvent(event: any): void {
    // Handle specific extension events
    if (event.type === 'sara:analyze') {
      const entityId = event.content.entityId;
      const entity = this.core?.dialectic.getEntity(entityId);
      
      if (entity) {
        this.extractConcepts(entityId);
      }
    }
    
    if (event.type === 'sara:query-related') {
      const conceptName = event.content.concept;
      const relatedConcepts = this.findRelatedConcepts(conceptName);
      
      // Return results through event emission
      this.core?.dialectic.emit({
        type: 'relation',
        subtype: 'related-concepts',
        content: {
          requestId: event.content.requestId,
          concept: conceptName,
          relatedConcepts
        },
        metadata: {
          responseToEvent: event.id,
          fromExtension: this.id
        }
      });
    }
  }
  
  /**
   * Extract concepts from an entity
   */
  private async extractConcepts(entityId: string): Promise<void> {
    if (!this.core) return;
    
    const entity = this.core.dialectic.getEntity(entityId);
    if (!entity) return;
    
    // Get textual content from entity
    const text = this.extractTextFromEntity(entity);
    if (!text) return;
    
    // Use Sara to extract concepts
    const concepts = await this.conceptEngine.extractConcepts(text);
    
    // Create concept entities and relations
    for (const concept of concepts) {
      // Ensure concept exists
      const conceptId = await this.ensureConceptExists(concept.name);
      
      // Create relation between entity and concept
      this.core.dialectic.createRelation(
        entityId,
        conceptId,
        'has-concept',
        {
          confidence: concept.confidence,
          extractedAt: Date.now(),
          extractionMethod: 'sara-automatic'
        }
      );
    }
    
    // Emit concept extraction event
    this.core.dialectic.emit({
      type: 'relation',
      subtype: 'concepts-extracted',
      spaceId: entity.spaceId || 'sara',
      content: {
        entityId,
        conceptCount: concepts.length,
        concepts: concepts.map(c => c.name)
      },
      metadata: {
        fromExtension: this.id
      }
    });
  }
  
  /**
   * Update concepts for an entity
   */
  private async updateConcepts(entityId: string): Promise<void> {
    if (!this.core) return;
    
    // Delete existing concept relations
    const relatedEntities = this.core.dialectic.findRelatedEntities(
      entityId,
      'has-concept'
    );
    
    for (const relation of relatedEntities) {
      this.core.dialectic.deleteRelation(
        entityId,
        relation.entity.id,
        'has-concept'
      );
    }
    
    // Extract new concepts
    await this.extractConcepts(entityId);
  }
  
  /**
   * Ensure a concept entity exists
   */
  private async ensureConceptExists(conceptName: string): Promise<string> {
    if (!this.core) throw new Error('Core not initialized');
    
    // Try to find existing concept
    const existingConcepts = this.core.dialectic.findEntities({
      type: 'sara:concept',
      properties: { name: conceptName }
    });
    
    if (existingConcepts.length > 0) {
      return existingConcepts[0].id;
    }
    
    // If not found, create the concept
    const conceptId = this.core.dialectic.createEntity({
      type: 'sara:concept',
      spaceId: 'sara:ontology',
      properties: {
        name: conceptName,
        normalized: conceptName.toLowerCase(),
        createdAt: Date.now()
      },
      metadata: {
        fromSara: true,
        viaExtension: this.id
      }
    });
    
    // Emit concept created event
    this.core.dialectic.emit({
      type: 'relation',
      subtype: 'concept-created',
      spaceId: 'sara:ontology',
      content: {
        conceptId,
        name: conceptName
      },
      metadata: {
        fromExtension: this.id
      }
    });
    
    return conceptId;
  }
  
  /**
   * Find concepts related to a given concept
   */
  private findRelatedConcepts(conceptName: string): Array<{
    id: string;
    name: string;
    relationTypes: string[];
    confidence: number;
  }> {
    if (!this.core) return [];
    
    // Find concept entity
    const concepts = this.core.dialectic.findEntities({
      type: 'sara:concept',
      properties: { name: conceptName }
    });
    
    if (concepts.length === 0) return [];
    
    const conceptId = concepts[0].id;
    
    // Find related concepts
    const relatedEntities = this.core.dialectic.findRelatedEntities(
      conceptId,
      undefined,
      'both'
    );
    
    // Group by related entity and collect relation types
    const relatedByEntity = new Map<string, {
      entity: any;
      relationTypes: string[];
      maxConfidence: number;
    }>();
    
    for (const related of relatedEntities) {
      if (related.entity.type !== 'sara:concept') continue;
      
      const entityId = related.entity.id;
      const confidence = related.properties.confidence || 0.5;
      
      if (!relatedByEntity.has(entityId)) {
        relatedByEntity.set(entityId, {
          entity: related.entity,
          relationTypes: [related.relationType],
          maxConfidence: confidence
        });
      } else {
        const existing = relatedByEntity.get(entityId)!;
        existing.relationTypes.push(related.relationType);
        existing.maxConfidence = Math.max(existing.maxConfidence, confidence);
      }
    }
    
    // Convert to array result
    return Array.from(relatedByEntity.values()).map(item => ({
      id: item.entity.id,
      name: item.entity.properties.name,
      relationTypes: item.relationTypes,
      confidence: item.maxConfidence
    }));
  }
  
  /**
   * Check if entity has text content
   */
  private hasTextContent(entity: any): boolean {
    if (!entity?.properties) return false;
    
    // Check common text fields
    return Object.values(entity.properties).some(value => 
      typeof value === 'string' && value.length > 10
    );
  }
  
  /**
   * Extract text from entity
   */
  private extractTextFromEntity(entity: any): string {
    if (!entity?.properties) return '';
    
    // Common text fields
    const textFields = [
      'content', 'text', 'description', 'body', 
      'message', 'title', 'summary', 'notes'
    ];
    
    // Concatenate all text fields
    let text = '';
    for (const field of textFields) {
      if (typeof entity.properties[field] === 'string') {
        text += ' ' + entity.properties[field];
      }
    }
    
    // Add other string properties that might contain text
    for (const [key, value] of Object.entries(entity.properties)) {
      if (textFields.includes(key)) continue; // Skip already processed fields
      if (typeof value === 'string' && value.length > 10) {
        text += ' ' + value;
      }
    }
    
    return text.trim();
  }
  
  /**
   * Transform between Neo entities and Sara concepts
   */
  transformEntity(entity: any, direction: 'toDomain' | 'toNeo'): any {
    if (direction === 'toDomain') {
      // Transform Neo entity to Sara concept
      if (entity.type === 'sara:concept') {
        return {
          id: entity.id,
          name: entity.properties.name,
          normalized: entity.properties.normalized || entity.properties.name.toLowerCase(),
          createdAt: entity.properties.createdAt,
          modifiedAt: entity.properties.modifiedAt,
          metadata: entity.metadata
        };
      }
      
      // Transform Neo entity to Sara analyzable content
      return {
        id: entity.id,
        type: entity.type,
        content: this.extractTextFromEntity(entity),
        metadata: {
          ...entity.metadata,
          originalType: entity.type,
          originalId: entity.id
        }
      };
    } else {
      // Transform Sara concept to Neo entity
      if (entity.type === 'concept') {
        return {
          type: 'sara:concept',
          spaceId: 'sara:ontology',
          properties: {
            name: entity.name,
            normalized: entity.normalized || entity.name.toLowerCase(),
            createdAt: entity.createdAt || Date.now(),
            modifiedAt: entity.modifiedAt || Date.now()
          },
          metadata: {
            ...entity.metadata,
            fromSara: true
          }
        };
      }
      
      // Default transformation
      return {
        type: `sara:${entity.type || 'unknown'}`,
        properties: entity,
        metadata: {
          fromSara: true,
          originalType: entity.type
        }
      };
    }
  }
}

/**
 * Create a Sara Extension
 */
export function createSaraExtension(conceptEngine: any): SaraExtension {
  return new SaraExtension(conceptEngine);
}