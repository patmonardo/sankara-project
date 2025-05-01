import { Neo4jConnection } from "../connection";
import {
  FormEntityDefinition,
  FormEntityValidation,
  FormEntityBehavior,
} from "@/form/schema/entity";
import { Session } from "neo4j-driver";

/**
 * EntityDefinitionRepository
 *
 * Manages the persistence of Entity Definitions in Neo4j.
 * These define the structure, rules, and behaviors for entity types.
 */
export class EntityDefinitionRepository {
  private connection: Neo4jConnection;

  constructor(connection: Neo4jConnection) {
    this.connection = connection;
  }

  /**
   * Save an entity definition to Neo4j
   *
   * Creates or updates an entity definition node and its relations
   */
  async saveEntityDefinition(
    entityDef: FormEntityDefinition
  ): Promise<FormEntityDefinition> {
    const session = this.connection.getSession({ defaultAccessMode: 'WRITE' });

    try {
      const txc = session.beginTransaction();

      // Create or update the entity definition node
      await txc.run(
        `
        MERGE (e:EntityDefinition {id: $id})
        SET e.name = $name,
            e.description = $description,
            e.type = $type,
            e.updatedAt = datetime() // Use Neo4j datetime

        // Set optional fields or remove if null
        SET e.createdAt = CASE WHEN $createdAt IS NOT NULL THEN datetime($createdAt) ELSE e.createdAt END, // Keep existing if null
            e.createdBy = $createdBy,
            e.contextId = $contextId,
            e.schema = CASE WHEN $schema IS NOT NULL THEN $schema ELSE null END, // Store as JSON string
            e.mapping = CASE WHEN $mapping IS NOT NULL THEN $mapping ELSE null END // Store as JSON string

        RETURN e
      `,
        {
          id: entityDef.id,
          name: entityDef.name,
          description: entityDef.description || null,
          type: entityDef.type,
          createdAt: entityDef.createdAt ? new Date(entityDef.createdAt).toISOString() : null, // Pass ISO string
          createdBy: entityDef.createdBy || null,
          contextId: entityDef.contextId || null,
          schema: entityDef.schema ? JSON.stringify(entityDef.schema) : null,
          mapping: entityDef.mapping ? JSON.stringify(entityDef.mapping) : null,
        }
      );

      // --- Handle Relationships and Sub-Nodes ---

      // Tags
      await this.syncTags(txc, entityDef.id, entityDef.tags);

      // Validation Rules
      await this.syncValidationRules(txc, entityDef.id, entityDef.validation);

      // Behaviors
      await this.syncBehaviors(txc, entityDef.id, entityDef.behaviors);

      // Indices
      await this.syncIndices(txc, entityDef.id, entityDef.indices);

      // Relations
      await this.syncRelations(txc, entityDef.id, entityDef.relations);

      await txc.commit();

      // Refetch to confirm save and get potentially updated dates
      const savedDef = await this.getEntityDefinitionById(entityDef.id);
      return savedDef!; // Assume it exists after successful save

    } catch (error) {
      console.error(`Error saving entity definition to Neo4j: ${error}`);
      // await txc.rollback(); // Consider explicit rollback
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get an entity definition by ID
   */
  async getEntityDefinitionById(
    id: string
  ): Promise<FormEntityDefinition | null> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      const result = await session.run(
        `
        MATCH (e:EntityDefinition {id: $id})
        OPTIONAL MATCH (e)-[:HAS_TAG]->(t:Tag)
        OPTIONAL MATCH (e)-[:HAS_VALIDATION]->(v:ValidationRule)
        OPTIONAL MATCH (e)-[:HAS_BEHAVIOR]->(b:FormEntityBehavior)
        OPTIONAL MATCH (e)-[:HAS_INDEX]->(i:EntityIndex)
        OPTIONAL MATCH (e)-[:HAS_RELATIONSHIP]->(r:RelationshipDef)
        RETURN e,
               collect(DISTINCT t.name) as tags,
               collect(DISTINCT v) as validationNodes,
               collect(DISTINCT b) as behaviorNodes,
               collect(DISTINCT i) as indexNodes,
               collect(DISTINCT r) as relationNodes
      `,
        { id }
      );

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      const entityNode = record.get("e").properties;
      const tags = record.get("tags") || [];
      const validationNodes = record.get("validationNodes") || [];
      const behaviorNodes = record.get("behaviorNodes") || [];
      const indexNodes = record.get("indexNodes") || [];
      const relationNodes = record.get("relationNodes") || [];

      // Parse complex properties
      const schema = entityNode.schema ? JSON.parse(entityNode.schema) : undefined;
      const mapping = entityNode.mapping ? JSON.parse(entityNode.mapping) : undefined;

      // Parse validation rules
      const validation: FormEntityValidation[] = validationNodes.map((node: any) => {
        const ruleProps = node.properties;
        let value = undefined;
        try {
          if (ruleProps.value) value = JSON.parse(ruleProps.value);
        } catch (e) { /* Keep undefined */ }
        return {
          field: ruleProps.field,
          rule: ruleProps.rule,
          value: value,
          message: ruleProps.message,
        };
      }).sort((a: any, b: any) => (a.order ?? Infinity) - (b.order ?? Infinity)); // Sort by order if available

      // Parse behaviors
      const behaviors: FormEntityBehavior[] = behaviorNodes.map((node: any) => {
        const behaviorProps = node.properties;
        let parameters = undefined;
        try {
          if (behaviorProps.parameters) parameters = JSON.parse(behaviorProps.parameters);
        } catch (e) { /* Keep undefined */ }
        return {
          name: behaviorProps.name,
          event: behaviorProps.event,
          handler: behaviorProps.handler, // Stored as string
          parameters: parameters,
          active: behaviorProps.active,
        };
      });

      // Parse indices
      const indices = indexNodes.map((node: any) => {
        const indexProps = node.properties;
        let fields = [];
        try {
          if (indexProps.fields) fields = JSON.parse(indexProps.fields);
        } catch (e) { /* Keep empty array */ }
        return {
          name: indexProps.name,
          fields: fields,
          unique: indexProps.unique,
        };
      });

      // Parse relations
      const relations = relationNodes.map((node: any) => {
        const relProps = node.properties;
        return {
          type: relProps.type,
          targetId: relProps.targetId, // Ensure correct property name used in save
          cardinality: relProps.cardinality,
          inverseName: relProps.inverseName,
        };
      });

      // Build the complete entity definition
      return {
        id: entityNode.id,
        name: entityNode.name,
        description: entityNode.description,
        type: entityNode.type,
        schema,
        mapping,
        tags,
        validation,
        behaviors,
        indices,
        relations,
        // Convert Neo4j DateTime to number (epoch milliseconds)
        createdAt: entityNode.createdAt ? new Date(entityNode.createdAt.toString()).getTime() : undefined,
        updatedAt: entityNode.updatedAt ? new Date(entityNode.updatedAt.toString()).getTime() : undefined,
        createdBy: entityNode.createdBy,
        contextId: entityNode.contextId,
      };
    } catch (error) {
      console.error(`Error getting entity definition from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Delete an entity definition by ID and all its sub-nodes
   */
  async deleteEntityDefinition(id: string): Promise<boolean> {
    const session = this.connection.getSession({ defaultAccessMode: 'WRITE' });

    try {
      // Use DETACH DELETE to remove the node and all its relationships
      // This implicitly handles deleting related validation rules, behaviors, etc.
      // if they are only connected to this definition.
      const result = await session.run(
        `
        MATCH (e:EntityDefinition {id: $id})
        DETACH DELETE e
        RETURN count(e) as deletedCount
      `,
        { id }
      );

      return result.records.length > 0; // Returns true if a node was matched and deleted

    } catch (error) {
      console.error(`Error deleting entity definition from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  // --- Helper methods for syncing relationships/sub-nodes ---

  private async syncTags(txc: any, entityDefId: string, tags: string[] | undefined) {
    // Remove existing tag relations
    await txc.run(`MATCH (e:EntityDefinition {id: $id})-[r:HAS_TAG]->() DELETE r`, { id: entityDefId });
    if (tags && tags.length > 0) {
      // Add new tags
      await txc.run(`
        UNWIND $tags as tagName
        MATCH (e:EntityDefinition {id: $id})
        MERGE (t:Tag {name: tagName})
        MERGE (e)-[:HAS_TAG]->(t)
      `, { id: entityDefId, tags: tags });
    }
  }

  private async syncValidationRules(txc: any, entityDefId: string, rules: FormEntityValidation[] | undefined) {
    // Remove existing validation rule nodes and relationships
    await txc.run(`MATCH (e:EntityDefinition {id: $id})-[r:HAS_VALIDATION]->(v:ValidationRule) DETACH DELETE v`, { id: entityDefId });
    if (rules && rules.length > 0) {
      // Add new validation rules
      await txc.run(`
        UNWIND $rules as ruleData
        MATCH (e:EntityDefinition {id: $id})
        CREATE (v:ValidationRule {
          id: $id + ':validation:' + ruleData.order, // Use index for unique ID part
          field: ruleData.field,
          rule: ruleData.rule,
          message: ruleData.message,
          value: ruleData.value, // Store stringified value
          order: ruleData.order
        })
        MERGE (e)-[:HAS_VALIDATION]->(v)
      `, {
        id: entityDefId,
        rules: rules.map((r, index) => ({
          ...r,
          value: r.value !== undefined ? JSON.stringify(r.value) : null,
          message: r.message || null,
          order: index // Add order for sorting on retrieval
        }))
      });
    }
  }

    private async syncBehaviors(txc: any, entityDefId: string, behaviors: FormEntityBehavior[] | undefined) {
        // Remove existing behavior nodes and relationships
        await txc.run(`MATCH (e:EntityDefinition {id: $id})-[r:HAS_BEHAVIOR]->(b:FormEntityBehavior) DETACH DELETE b`, { id: entityDefId });
        if (behaviors && behaviors.length > 0) {
            // Add new behaviors
            await txc.run(`
                UNWIND $behaviors as behaviorData
                MATCH (e:EntityDefinition {id: $id})
                CREATE (b:FormEntityBehavior {
                    id: $id + ':behavior:' + behaviorData.index, // Use index for unique ID part
                    name: behaviorData.name,
                    event: behaviorData.event,
                    handler: behaviorData.handler, // Store as string
                    parameters: behaviorData.parameters, // Store stringified value
                    active: behaviorData.active
                })
                MERGE (e)-[:HAS_BEHAVIOR]->(b)
            `, {
                id: entityDefId,
                behaviors: behaviors.map((b, index) => ({
                    ...b,
                    handler: typeof b.handler === 'function' ? b.handler.toString() : b.handler,
                    parameters: b.parameters !== undefined ? JSON.stringify(b.parameters) : null,
                    active: b.active ?? true, // Default to true if undefined
                    index: index
                }))
            });
        }
    }

    private async syncIndices(txc: any, entityDefId: string, indices: { name: string; fields: string[]; unique?: boolean }[] | undefined) {
        // Remove existing index nodes and relationships
        await txc.run(`MATCH (e:EntityDefinition {id: $id})-[r:HAS_INDEX]->(i:EntityIndex) DETACH DELETE i`, { id: entityDefId });
        if (indices && indices.length > 0) {
            // Add new indices
            await txc.run(`
                UNWIND $indices as indexData
                MATCH (e:EntityDefinition {id: $id})
                CREATE (i:EntityIndex {
                    id: $id + ':index:' + indexData.index, // Use index for unique ID part
                    name: indexData.name,
                    fields: indexData.fields, // Store stringified value
                    unique: indexData.unique
                })
                MERGE (e)-[:HAS_INDEX]->(i)
            `, {
                id: entityDefId,
                indices: indices.map((idx, index) => ({
                    ...idx,
                    fields: JSON.stringify(idx.fields || []),
                    unique: idx.unique ?? false, // Default to false
                    index: index
                }))
            });
        }
    }

    private async syncRelations(txc: any, entityDefId: string, relations: { type: string; targetId: string; cardinality: string; inverseName?: string }[] | undefined) {
        // Remove existing relationship definition nodes and relationships
        await txc.run(`MATCH (e:EntityDefinition {id: $id})-[r:HAS_RELATIONSHIP]->(rel:RelationshipDef) DETACH DELETE rel`, { id: entityDefId });
        if (relations && relations.length > 0) {
            // Add new relationship definitions
            await txc.run(`
                UNWIND $relations as relData
                MATCH (e:EntityDefinition {id: $id})
                CREATE (rel:RelationshipDef {
                    id: $id + ':relationship:' + relData.index, // Use index for unique ID part
                    type: relData.type,
                    targetId: relData.targetId,
                    cardinality: relData.cardinality,
                    inverseName: relData.inverseName
                })
                MERGE (e)-[:HAS_RELATIONSHIP]->(rel)
            `, {
                id: entityDefId,
                relations: relations.map((rel, index) => ({
                    ...rel,
                    inverseName: rel.inverseName || null,
                    index: index
                }))
            });
        }
    }

}