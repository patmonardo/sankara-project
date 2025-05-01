import { Neo4jConnection } from '../connection';
import { FormDefinition } from '@/form/schema/schema';

/**
 * FormDefinitionRepository
 * 
 * Manages the persistence of FormDefinitions in Neo4j,
 * representing the unified transcendental objects that bring together
 * entities, relations, and contexts.
 */
export class FormDefinitionRepository {
  private connection: Neo4jConnection;
  
  constructor(connection: Neo4jConnection) {
    this.connection = connection;
  }
  
  /**
   * Persist a FormDefinition to Neo4j
   */
  async saveDefinition(definition: FormDefinition): Promise<FormDefinition> {
    const session = this.connection.getSession();
    
    try {
      const txc = session.beginTransaction();
      
      // Create FormDefinition node
      await txc.run(`
        MERGE (fd:FormDefinition {id: $id})
        SET fd.name = $name,
            fd.description = $description,
            fd.type = $type,
            fd.category = $category,
            fd.template = $template,
            fd.abstract = $abstract,
            fd.version = $version,
            fd.createdAt = datetime($createdAt),
            fd.updatedAt = datetime($updatedAt),
            fd.author = $author
        RETURN fd
      `, {
        id: definition.id,
        name: definition.name,
        description: definition.description || '',
        type: definition.type,
        category: definition.category || '',
        template: definition.template || false,
        abstract: definition.abstract || false,
        version: definition.version,
        createdAt: definition.createdAt,
        updatedAt: definition.updatedAt,
        author: definition.author || ''
      });
      
      // Handle tags
      if (definition.tags && definition.tags.length > 0) {
        for (const tag of definition.tags) {
          await txc.run(`
            MATCH (fd:FormDefinition {id: $defId})
            MERGE (t:Tag {name: $tag})
            MERGE (fd)-[:HAS_TAG]->(t)
            RETURN t
          `, {
            defId: definition.id,
            tag
          });
        }
      }
      
      // Handle entities
      if (definition.entities) {
        for (const [entityId, entity] of Object.entries(definition.entities)) {
          // Create entity node
          await txc.run(`
            MATCH (fd:FormDefinition {id: $defId})
            MERGE (e:FormEntity {id: $entityId})
            SET e.name = $name,
                e.description = $description,
                e.type = $type,
                e.schema = $schema,
                e.createdAt = datetime($createdAt),
                e.updatedAt = datetime($updatedAt),
                e.createdBy = $createdBy,
                e.contextId = $contextId
            MERGE (fd)-[:DEFINES_ENTITY]->(e)
            RETURN e
          `, {
            defId: definition.id,
            entityId: entity.id,
            name: entity.name,
            description: entity.description,
            type: entity.type,
            schema: JSON.stringify(entity.schema),
            createdAt: entity.createdAt ? entity.createdAt : Date.now(),
            updatedAt: entity.updatedAt ? entity.updatedAt : Date.now(),
            createdBy: entity.createdBy || '',
            contextId: entity.contextId || ''
          });
          
          // Handle entity tags
          if (entity.tags && entity.tags.length > 0) {
            for (const tag of entity.tags) {
              await txc.run(`
                MATCH (e:FormEntity {id: $entityId})
                MERGE (t:Tag {name: $tag})
                MERGE (e)-[:HAS_TAG]->(t)
                RETURN t
              `, {
                entityId: entity.id,
                tag
              });
            }
          }
        }
      }
      
      // Handle relations
      if (definition.relations) {
        for (const [relationId, relation] of Object.entries(definition.relations)) {
          // Create entity relation definition
          await txc.run(`
            MATCH (fd:FormDefinition {id: $defId})
            MERGE (r:RelationDefinition {id: $relationId})
            SET r.cardinality = $cardinality,
                r.traversalCost = $traversalCost
            
            // Set inverse info if present
            FOREACH (__ IN CASE WHEN $hasInverse THEN [1] ELSE [] END | 
              SET r.inverseType = $inverseType,
                  r.inverseName = $inverseName
            )
            
            MERGE (fd)-[:DEFINES_RELATION]->(r)
            RETURN r
          `, {
            defId: definition.id,
            relationId: relationId,
            cardinality: relation.cardinality || 'many-to-many',
            traversalCost: relation.traversalCost || 1,
            hasInverse: !!relation.inverse,
            inverseType: relation.inverse?.type || '',
            inverseName: relation.inverse?.name || ''
          });
        }
      }
      
      // Handle contexts
      if (definition.contexts) {
        for (const [contextId, context] of Object.entries(definition.contexts)) {
          await txc.run(`
            MATCH (fd:FormDefinition {id: $defId})
            MERGE (c:Context {id: $contextId})
            SET c.name = $name,
                c.description = $description,
                c.type = $type,
                c.priority = $priority,
                c.scope = $scope,
                c.createdAt = datetime($createdAt),
                c.updatedAt = datetime($updatedAt)
            MERGE (fd)-[:DEFINES_CONTEXT]->(c)
            
            // Set parent if exists
            FOREACH (__ IN CASE WHEN $hasParent THEN [1] ELSE [] END | 
              MERGE (parent:Context {id: $parentId})
              MERGE (c)-[:HAS_PARENT]->(parent)
            )
            
            RETURN c
          `, {
            defId: definition.id,
            contextId: contextId,
            name: context.name,
            description: context.description || '',
            type: context.type || 'default',
            priority: context.priority || 0,
            scope: context.scope || 'local',
            createdAt: context.createdAt ? context.createdAt : Date.now(),
            updatedAt: context.updatedAt ? context.updatedAt : Date.now(),
            hasParent: !!context.parentId,
            parentId: context.parentId || ''
          });
        }
      }
      
      // Handle extensions
      if (definition.extensions && definition.extensions.length > 0) {
        for (const extId of definition.extensions) {
          await txc.run(`
            MATCH (fd:FormDefinition {id: $defId})
            MERGE (ext:FormDefinition {id: $extId})
            MERGE (fd)-[:EXTENDS]->(ext)
            RETURN ext
          `, {
            defId: definition.id,
            extId: extId
          });
        }
      }
      
      // Commit transaction
      await txc.commit();
      
      return definition;
    } catch (error) {
      console.error(`Error saving form definition to Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Get a FormDefinition by ID
   */
  async getDefinitionById(id: string): Promise<FormDefinition | null> {
    const session = this.connection.getSession({ defaultAccessMode: 'READ' });
    
    try {
      // Get the basic definition
      const defResult = await session.run(`
        MATCH (fd:FormDefinition {id: $id})
        OPTIONAL MATCH (fd)-[:HAS_TAG]->(t:Tag)
        OPTIONAL MATCH (fd)-[:EXTENDS]->(ext:FormDefinition)
        RETURN fd, 
               collect(DISTINCT t.name) as tags,
               collect(DISTINCT ext.id) as extensions
      `, { id });
      
      if (defResult.records.length === 0) {
        return null;
      }
      
      const record = defResult.records[0];
      const fd = record.get('fd').properties;
      const tags = record.get('tags').filter((t: any) => t !== null);
      const extensions = record.get('extensions').filter((e: any) => e !== null);
      
      // Get entities
      const entitiesResult = await session.run(`
        MATCH (fd:FormDefinition {id: $id})-[:DEFINES_ENTITY]->(e:FormEntity)
        OPTIONAL MATCH (e)-[:HAS_TAG]->(t:Tag)
        RETURN e, collect(DISTINCT t.name) as tags
      `, { id });
      
      const entities: Record<string, any> = {};
      
      for (const entityRecord of entitiesResult.records) {
        const entity = entityRecord.get('e').properties;
        const entityTags = entityRecord.get('tags').filter((t: any) => t !== null);
        
        // Parse schema
        let schema = entity.schema;
        try {
          schema = JSON.parse(schema);
        } catch (e) {
          schema = {};
        }
        
        entities[entity.id] = {
          id: entity.id,
          name: entity.name,
          description: entity.description,
          type: entity.type,
          tags: entityTags,
          schema: schema,
          mapping: {
            storage: "neo4j",
            primaryKey: "id",
            fields: {}
          },
          createdAt: new Date(entity.createdAt),
          updatedAt: new Date(entity.updatedAt),
          createdBy: entity.createdBy,
          contextId: entity.contextId
        };
      }
      
      // Get relations
      const relationsResult = await session.run(`
        MATCH (fd:FormDefinition {id: $id})-[:DEFINES_RELATION]->(r:RelationDefinition)
        RETURN r
      `, { id });
      
      const relations: Record<string, any> = {};
      
      for (const relRecord of relationsResult.records) {
        const rel = relRecord.get('r').properties;
        
        // Create the relation definition with proper typing
        const relationDef: {
          cardinality: string;
          traversalCost: number;
          validation: any[];
          behaviors: any[];
          inverse?: {
            type: string;
            name: string;
          }
        } = {
          cardinality: rel.cardinality,
          traversalCost: parseFloat(rel.traversalCost),
          validation: [],
          behaviors: []
        };
        
        // Add inverse if it exists
        if (rel.inverseType) {
          relationDef.inverse = {
            type: rel.inverseType,
            name: rel.inverseName
          };
        }
        
        relations[rel.id] = relationDef;
      }      
      
      // Get contexts
      const contextsResult = await session.run(`
        MATCH (fd:FormDefinition {id: $id})-[:DEFINES_CONTEXT]->(c:Context)
        OPTIONAL MATCH (c)-[:HAS_PARENT]->(parent:Context)
        RETURN c, parent.id as parentId
      `, { id });
      
      const contexts: Record<string, any> = {};
      
      for (const contextRecord of contextsResult.records) {
        const context = contextRecord.get('c').properties;
        const parentId = contextRecord.get('parentId');
        
        contexts[context.id] = {
          id: context.id,
          name: context.name,
          description: context.description,
          type: context.type,
          priority: parseInt(context.priority),
          scope: context.scope,
          parentId: parentId,
          createdAt: new Date(context.createdAt),
          updatedAt: new Date(context.updatedAt)
        };
      }
      
      // Build the complete definition
      return {
        id: fd.id,
        name: fd.name,
        description: fd.description,
        type: fd.type,
        category: fd.category,
        tags: tags,
        entities: entities,
        relations: relations,
        contexts: contexts,
        schema: {},
        template: fd.template,
        abstract: fd.abstract,
        extensions: extensions,
        createdAt: fd.createdAt,
        updatedAt: fd.updatedAt,
        version: fd.version,
        author: fd.author
      };
    } catch (error) {
      console.error(`Error getting form definition from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Find FormDefinitions by criteria
   */
  async findDefinitions(criteria: {
    type?: string;
    category?: string;
    tag?: string;
    template?: boolean;
    abstract?: boolean;
  }): Promise<FormDefinition[]> {
    const session = this.connection.getSession({ defaultAccessMode: 'READ' });
    
    try {
      let query = `
        MATCH (fd:FormDefinition)
        WHERE 1=1
      `;
      
      const params: Record<string, any> = {};
      
      // Add filters based on criteria
      if (criteria.type) {
        query += ` AND fd.type = $type`;
        params.type = criteria.type;
      }
      
      if (criteria.category) {
        query += ` AND fd.category = $category`;
        params.category = criteria.category;
      }
      
      if (criteria.tag) {
        query += ` AND (fd)-[:HAS_TAG]->(:Tag {name: $tag})`;
        params.tag = criteria.tag;
      }
      
      if (criteria.template !== undefined) {
        query += ` AND fd.template = $template`;
        params.template = criteria.template;
      }
      
      if (criteria.abstract !== undefined) {
        query += ` AND fd.abstract = $abstract`;
        params.abstract = criteria.abstract;
      }
      
      query += ` RETURN fd.id as id`;
      
      const result = await session.run(query, params);
      
      // Get full definitions for each ID
      const definitions: FormDefinition[] = [];
      
      for (const record of result.records) {
        const id = record.get('id');
        const definition = await this.getDefinitionById(id);
        
        if (definition) {
          definitions.push(definition);
        }
      }
      
      return definitions;
    } catch (error) {
      console.error(`Error finding form definitions in Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Delete a FormDefinition by ID
   */
  async deleteDefinition(id: string): Promise<boolean> {
    const session = this.connection.getSession();
    
    try {
      const txc = session.beginTransaction();
      
      // First delete relationships to avoid orphaned nodes
      await txc.run(`
        MATCH (fd:FormDefinition {id: $id})
        OPTIONAL MATCH (fd)-[:DEFINES_ENTITY]->(e:FormEntity)
        OPTIONAL MATCH (fd)-[:DEFINES_RELATION]->(r:RelationDefinition)
        OPTIONAL MATCH (fd)-[:DEFINES_CONTEXT]->(c:Context)
        OPTIONAL MATCH (fd)-[:HAS_TAG]->(t:Tag)
        OPTIONAL MATCH (fd)-[:EXTENDS]->(ext:FormDefinition)
        
        // Delete specific relationships
        DELETE (fd)-[:DEFINES_ENTITY]->(e)
        DELETE (fd)-[:DEFINES_RELATION]->(r)
        DELETE (fd)-[:DEFINES_CONTEXT]->(c)
        DELETE (fd)-[:HAS_TAG]->(t)
        DELETE (fd)-[:EXTENDS]->(ext)
        
        // Finally delete the definition node
        DELETE fd
        
        RETURN count(*) as deleted
      `, { id });
      
      await txc.commit();
      
      return true;
    } catch (error) {
      console.error(`Error deleting form definition from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }
}