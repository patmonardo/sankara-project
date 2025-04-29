import { Neo4jConnection } from "../connection";
import {
  FormEntity,
  FormEntityDefinition,
  FormEntityValidation,
  FormEntityBehavior,
} from "@/form/schema/entity";
import { Session } from "neo4j-driver";

/**
 * EntityRepository
 *
 * Manages the persistence of Entities in Neo4j.
 * Entities are the fundamental existents in the Form-Graph morphology system,
 * representing nodes in the knowledge representation.
 */
export class EntityRepository {
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
    const session = this.connection.getSession();

    try {
      const txc = session.beginTransaction();

      // Create or update the entity definition node
      await txc.run(
        `
        MERGE (e:EntityDefinition {id: $id})
        SET e.name = $name,
            e.description = $description,
            e.type = $type,
            e.updatedAt = datetime()
            
        FOREACH (__ IN CASE WHEN $createdAt IS NOT NULL THEN [1] ELSE [] END | 
          SET e.createdAt = datetime($createdAt))
            
        FOREACH (__ IN CASE WHEN $createdBy IS NOT NULL THEN [1] ELSE [] END | 
          SET e.createdBy = $createdBy)
            
        FOREACH (__ IN CASE WHEN $contextId IS NOT NULL THEN [1] ELSE [] END | 
          SET e.contextId = $contextId)
          
        RETURN e
      `,
        {
          id: entityDef.id,
          name: entityDef.name,
          description: entityDef.description || "",
          type: entityDef.type,
          createdAt: entityDef.createdAt
            ? entityDef.createdAt
            : Date.now(),
          createdBy: entityDef.createdBy || null,
          contextId: entityDef.contextId || null,
        }
      );

      // Handle schema
      if (entityDef.schema) {
        await txc.run(
          `
          MATCH (e:EntityDefinition {id: $id})
          SET e.schema = $schema
          RETURN e
        `,
          {
            id: entityDef.id,
            schema: JSON.stringify(entityDef.schema),
          }
        );
      }

      // Handle mapping
      if (entityDef.mapping) {
        await txc.run(
          `
          MATCH (e:EntityDefinition {id: $id})
          SET e.mapping = $mapping
          RETURN e
        `,
          {
            id: entityDef.id,
            mapping: JSON.stringify(entityDef.mapping),
          }
        );
      }

      // Handle tags
      if (entityDef.tags && entityDef.tags.length > 0) {
        // First remove existing tag relations
        await txc.run(
          `
          MATCH (e:EntityDefinition {id: $id})-[r:HAS_TAG]->()
          DELETE r
          RETURN e
        `,
          { id: entityDef.id }
        );

        // Add new tags
        for (const tag of entityDef.tags) {
          await txc.run(
            `
            MATCH (e:EntityDefinition {id: $id})
            MERGE (t:Tag {name: $tagName})
            MERGE (e)-[:HAS_TAG]->(t)
            RETURN t
          `,
            {
              id: entityDef.id,
              tagName: tag,
            }
          );
        }
      }

      // Handle validation rules
      if (entityDef.validation && entityDef.validation.length > 0) {
        // First delete existing validation rules
        await txc.run(
          `
          MATCH (e:EntityDefinition {id: $id})-[r:HAS_VALIDATION]->(v:ValidationRule)
          DETACH DELETE v
          RETURN e
        `,
          { id: entityDef.id }
        );

        // Add new validation rules
        for (let i = 0; i < entityDef.validation.length; i++) {
          const rule = entityDef.validation[i];

          await txc.run(
            `
            MATCH (e:EntityDefinition {id: $id})
            
            CREATE (v:ValidationRule {
              id: $ruleId,
              field: $field,
              rule: $ruleType,
              message: $message,
              order: $order
            })
            
            SET v.value = $value
            MERGE (e)-[:HAS_VALIDATION]->(v)
            RETURN v
          `,
            {
              id: entityDef.id,
              ruleId: `${entityDef.id}:validation:${i}`,
              field: rule.field,
              ruleType: rule.rule,
              message: rule.message || "",
              value:
                rule.value !== undefined ? JSON.stringify(rule.value) : null,
              order: i,
            }
          );
        }
      }

      // Handle behaviors
      if (entityDef.behaviors && entityDef.behaviors.length > 0) {
        // First delete existing behaviors
        await txc.run(
          `
          MATCH (e:EntityDefinition {id: $id})-[r:HAS_BEHAVIOR]->(b:FormEntityBehavior)
          DETACH DELETE b
          RETURN e
        `,
          { id: entityDef.id }
        );

        // Add new behaviors
        for (let i = 0; i < entityDef.behaviors.length; i++) {
          const behavior = entityDef.behaviors[i];

          // Convert function to string if it exists
          const handlerString =
            typeof behavior.handler === "function"
              ? behavior.handler.toString()
              : behavior.handler;

          await txc.run(
            `
            MATCH (e:EntityDefinition {id: $id})
            
            CREATE (b:FormEntityBehavior {
              id: $behaviorId,
              name: $name,
              event: $event,
              handler: $handler,
              active: $active
            })
            
            SET b.parameters = $parameters
            MERGE (e)-[:HAS_BEHAVIOR]->(b)
            RETURN b
          `,
            {
              id: entityDef.id,
              behaviorId: `${entityDef.id}:behavior:${i}`,
              name: behavior.name,
              event: behavior.event,
              handler: handlerString,
              active: behavior.active,
              parameters: behavior.parameters
                ? JSON.stringify(behavior.parameters)
                : null,
            }
          );
        }
      }

      // Handle indices
      if (entityDef.indices && entityDef.indices.length > 0) {
        // First delete existing indices
        await txc.run(
          `
          MATCH (e:EntityDefinition {id: $id})-[r:HAS_INDEX]->(i:EntityIndex)
          DETACH DELETE i
          RETURN e
        `,
          { id: entityDef.id }
        );

        // Add new indices
        for (let i = 0; i < entityDef.indices.length; i++) {
          const index = entityDef.indices[i];

          await txc.run(
            `
            MATCH (e:EntityDefinition {id: $id})
            
            CREATE (i:EntityIndex {
              id: $indexId,
              name: $name,
              unique: $unique
            })
            
            SET i.fields = $fields
            MERGE (e)-[:HAS_INDEX]->(i)
            RETURN i
          `,
            {
              id: entityDef.id,
              indexId: `${entityDef.id}:index:${i}`,
              name: index.name,
              unique: index.unique,
              fields: JSON.stringify(index.fields),
            }
          );
        }
      }

      // Handle relations
      if (entityDef.relations && entityDef.relations.length > 0) {
        // First delete existing relationship definitions
        await txc.run(
          `
          MATCH (e:EntityDefinition {id: $id})-[r:HAS_RELATIONSHIP]->(rel:RelationshipDef)
          DETACH DELETE rel
          RETURN e
        `,
          { id: entityDef.id }
        );

        // Add new relationship definitions
        for (let i = 0; i < entityDef.relations.length; i++) {
          const relationship = entityDef.relations[i];

          await txc.run(
            `
            MATCH (e:EntityDefinition {id: $id})
            
            CREATE (rel:RelationshipDef {
              id: $relId,
              type: $type,
              target: $target,
              cardinality: $cardinality,
              inverseName: $inverseName
            })
            
            MERGE (e)-[:HAS_RELATIONSHIP]->(rel)
            RETURN rel
          `,
            {
              id: entityDef.id,
              relId: `${entityDef.id}:relationship:${i}`,
              type: relationship.type,
              target: relationship.target,
              cardinality: relationship.cardinality,
              inverseName: relationship.inverseName || null,
            }
          );
        }
      }

      await txc.commit();

      return entityDef;
    } catch (error) {
      console.error(`Error saving entity definition to Neo4j: ${error}`);
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
        RETURN e
      `,
        { id }
      );

      if (result.records.length === 0) {
        return null;
      }

      const entityNode = result.records[0].get("e").properties;

      // Parse schema if exists
      let schema = {};
      if (entityNode.schema) {
        try {
          schema = JSON.parse(entityNode.schema);
        } catch (e) {
          console.error(`Error parsing entity schema: ${e}`);
        }
      }

      // Parse mapping if exists
      let mapping: any = {
        storage: "default",
        primaryKey: "id",
        fields: {},
      };

      if (entityNode.mapping) {
        try {
          mapping = JSON.parse(entityNode.mapping);
        } catch (e) {
          console.error(`Error parsing entity mapping: ${e}`);
        }
      }

      // Get tags
      const tagsResult = await session.run(
        `
        MATCH (e:EntityDefinition {id: $id})-[:HAS_TAG]->(t:Tag)
        RETURN t.name as tag
      `,
        { id }
      );

      const tags = tagsResult.records.map((record) => record.get("tag"));

      // Get validation rules
      const validationRules = await this.getEntityValidationRules(id, session);

      // Get behaviors
      const behaviors = await this.getEntityBehaviors(id, session);

      // Get indices
      const indicesResult = await session.run(
        `
        MATCH (e:EntityDefinition {id: $id})-[:HAS_INDEX]->(i:EntityIndex)
        RETURN i
      `,
        { id }
      );

      const indices = indicesResult.records.map((record) => {
        const indexNode = record.get("i").properties;
        let fields = [];

        try {
          fields = JSON.parse(indexNode.fields);
        } catch (e) {
          console.error(`Error parsing index fields: ${e}`);
        }

        return {
          name: indexNode.name,
          fields,
          unique: indexNode.unique,
        };
      });

      // Get relations
      const relationshipsResult = await session.run(
        `
        MATCH (e:EntityDefinition {id: $id})-[:HAS_RELATIONSHIP]->(r:RelationshipDef)
        RETURN r
      `,
        { id }
      );

      const relations = relationshipsResult.records.map((record) => {
        const relNode = record.get("r").properties;

        return {
          type: relNode.type,
          target: relNode.target,
          cardinality: relNode.cardinality,
          inverseName: relNode.inverseName,
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
        validation: validationRules,
        behaviors,
        indices,
        relations,
        createdAt: entityNode.createdAt ? entityNode.createdAt : Date.now(),
        updatedAt: entityNode.updatedAt ? entityNode.updatedAt : Date.now(),
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
   * Get validation rules for an entity definition
   */
  private async getEntityValidationRules(
    entityId: string,
    session: Session
  ): Promise<FormEntityValidation[]> {
    const rulesResult = await session.run(
      `
      MATCH (e:EntityDefinition {id: $entityId})-[:HAS_VALIDATION]->(v:ValidationRule)
      RETURN v ORDER BY v.order
    `,
      { entityId }
    );

    const validationRules: FormEntityValidation[] = [];

    for (const record of rulesResult.records) {
      const ruleNode = record.get("v").properties;
      let value = undefined;

      try {
        if (ruleNode.value) {
          value = JSON.parse(ruleNode.value);
        }
      } catch (e) {
        console.error(`Error parsing validation rule value: ${e}`);
      }

      validationRules.push({
        field: ruleNode.field,
        rule: ruleNode.rule,
        value,
        message: ruleNode.message,
      });
    }

    return validationRules;
  }

  /**
   * Get behaviors for an entity definition
   */
  private async getEntityBehaviors(
    entityId: string,
    session: Session
  ): Promise<FormEntityBehavior[]> {
    const behaviorsResult = await session.run(
      `
      MATCH (e:EntityDefinition {id: $entityId})-[:HAS_BEHAVIOR]->(b:FormEntityBehavior)
      RETURN b
    `,
      { entityId }
    );

    const behaviors: FormEntityBehavior[] = [];

    for (const record of behaviorsResult.records) {
      const behaviorNode = record.get("b").properties;
      let parameters = undefined;

      try {
        if (behaviorNode.parameters) {
          parameters = JSON.parse(behaviorNode.parameters);
        }
      } catch (e) {
        console.error(`Error parsing behavior parameters: ${e}`);
      }

      // Note: We store the handler as a string in the database
      // When retrieved, it will be returned as a string and needs to be evaluated if needed
      behaviors.push({
        name: behaviorNode.name,
        event: behaviorNode.event,
        handler: behaviorNode.handler,
        parameters,
        active: behaviorNode.active,
      });
    }

    return behaviors;
  }
  /**
   * Save an entity instance to Neo4j
   */
  async saveEntity(entity: FormEntity): Promise<FormEntity> {
    const session = this.connection.getSession();

    try {
      const txc = session.beginTransaction();

      // Determine entity label - use type as label
      const entityLabel = this.getSafeLabel(entity.type);

      // Create or update the entity instance
      const cypher = `
      MERGE (e:Entity:${entityLabel} {id: $id})
      SET e.name = $name,
          e.description = $description,
          e.updatedAt = datetime(),
          e.type = $type
          
      FOREACH (__ IN CASE WHEN $createdAt IS NOT NULL THEN [1] ELSE [] END | 
        SET e.createdAt = datetime($createdAt))
          
      FOREACH (__ IN CASE WHEN $createdBy IS NOT NULL THEN [1] ELSE [] END | 
        SET e.createdBy = $createdBy)
          
      FOREACH (__ IN CASE WHEN $contextId IS NOT NULL THEN [1] ELSE [] END | 
        SET e.contextId = $contextId)
          
      RETURN e
    `;

      await txc.run(cypher, {
        id: entity.id,
        name: entity.name,
        description: entity.description,
        type: entity.type,
        createdAt: entity.createdAt
          ? entity.createdAt
          : Date.now(),
        createdBy: entity.createdBy || null,
        contextId: entity.contextId || null,
      });

      // Handle schema data - store all fields defined in schema
      if (entity.schema) {
        // Create a strongly typed object to hold properties
        const properties: Record<string, any> = {};

        // Flatten the schema properties into top-level entity properties
        for (const [key, value] of Object.entries(
          entity.schema as Record<string, any>
        )) {
          if (value !== undefined && value !== null) {
            properties[key] = value;
          }
        }

        // Only if we have properties to update
        if (Object.keys(properties).length > 0) {
          let setClauses = Object.keys(properties)
            .map((key) => `e.${key} = $${key}`)
            .join(", ");

          await txc.run(
            `
          MATCH (e:Entity {id: $id})
          SET ${setClauses}
          RETURN e
        `,
            {
              id: entity.id,
              ...properties,
            }
          );
        }
      }

      // Handle tags
      if (entity.tags && entity.tags.length > 0) {
        // First remove existing tag relations
        await txc.run(
          `
          MATCH (e:Entity {id: $id})-[r:HAS_TAG]->()
          DELETE r
          RETURN e
        `,
          { id: entity.id }
        );

        // Add new tags
        for (const tag of entity.tags) {
          await txc.run(
            `
            MATCH (e:Entity {id: $id})
            MERGE (t:Tag {name: $tagName})
            MERGE (e)-[:HAS_TAG]->(t)
            RETURN t
          `,
            {
              id: entity.id,
              tagName: tag,
            }
          );
        }
      }

      await txc.commit();

      return entity;
    } catch (error) {
      console.error(`Error saving entity to Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }
  /**
   * Get an entity instance by ID
   */
  async getEntityById(id: string): Promise<FormEntity | null> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      const result = await session.run(
        `
        MATCH (e:Entity {id: $id})
        RETURN e
      `,
        { id }
      );

      if (result.records.length === 0) {
        return null;
      }

      const entityNode = result.records[0].get("e").properties;

      // Get tags
      const tagsResult = await session.run(
        `
        MATCH (e:Entity {id: $id})-[:HAS_TAG]->(t:Tag)
        RETURN t.name as tag
      `,
        { id }
      );

      const tags = tagsResult.records.map((record) => record.get("tag"));

      // Extract schema data - all properties that aren't special reserved properties
      const reservedProps = [
        "id",
        "name",
        "description",
        "type",
        "createdAt",
        "updatedAt",
        "createdBy",
        "contextId",
      ];
      const schema: Record<string, any> = {};

      for (const [key, value] of Object.entries(
        entityNode as Record<string, any>
      )) {
        if (!reservedProps.includes(key)) {
          schema[key] = value;
        }
      }

      // Build the entity mapping
      // For simplicity, creating a default mapping - in a real system,
      // you might want to retrieve the actual mapping from the entity definition
      const mapping = {
        storage: "neo4j",
        primaryKey: "id",
        fields: {},
        versioning: false,
      };

      // Build the complete entity
      return {
        id: entityNode.id,
        name: entityNode.name,
        description: entityNode.description,
        type: entityNode.type,
        schema,
        mapping,
        tags,
        createdAt: entityNode.createdAt ? entityNode.createdAt : Date.now(),
        updatedAt: entityNode.updatedAt ? entityNode.updatedAt : Date.now(),
        createdBy: entityNode.createdBy,
        contextId: entityNode.contextId,
      };

      // Rest of the method remains the same...
    } catch (error) {
      console.error(`Error getting entity from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Find entities by criteria
   */
  async findEntities(
    criteria: {
      type?: string;
      name?: string;
      tag?: string;
      contextId?: string;
      createdBy?: string;
      property?: {
        name: string;
        value: any;
      };
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<FormEntity[]> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      let query = `
        MATCH (e:Entity)
        WHERE 1=1
      `;

      const params: Record<string, any> = {};

      if (criteria.type) {
        query += ` AND e.type = $type`;
        params.type = criteria.type;
      }

      if (criteria.name) {
        query += ` AND e.name CONTAINS $name`;
        params.name = criteria.name;
      }

      if (criteria.tag) {
        query += ` AND (e)-[:HAS_TAG]->(:Tag {name: $tag})`;
        params.tag = criteria.tag;
      }

      if (criteria.contextId) {
        query += ` AND e.contextId = $contextId`;
        params.contextId = criteria.contextId;
      }

      if (criteria.createdBy) {
        query += ` AND e.createdBy = $createdBy`;
        params.createdBy = criteria.createdBy;
      }

      if (criteria.property) {
        query += ` AND e.${criteria.property.name} = $propertyValue`;
        params.propertyValue = criteria.property.value;
      }

      // Add pagination
      query += ` RETURN e.id as id`;

      if (criteria.limit) {
        query += ` LIMIT $limit`;
        params.limit = criteria.limit;
      }

      if (criteria.offset) {
        query += ` SKIP $offset`;
        params.offset = criteria.offset;
      }

      const result = await session.run(query, params);

      // Get complete entity objects
      const entities: FormEntity[] = [];

      for (const record of result.records) {
        const entityId = record.get("id");
        const entity = await this.getEntityById(entityId);

        if (entity) {
          entities.push(entity);
        }
      }

      return entities;
    } catch (error) {
      console.error(`Error finding entities in Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Count entities by criteria
   */
  async countEntities(
    criteria: {
      type?: string;
      tag?: string;
      contextId?: string;
    } = {}
  ): Promise<number> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      let query = `
        MATCH (e:Entity)
        WHERE 1=1
      `;

      const params: Record<string, any> = {};

      if (criteria.type) {
        query += ` AND e.type = $type`;
        params.type = criteria.type;
      }

      if (criteria.tag) {
        query += ` AND (e)-[:HAS_TAG]->(:Tag {name: $tag})`;
        params.tag = criteria.tag;
      }

      if (criteria.contextId) {
        query += ` AND e.contextId = $contextId`;
        params.contextId = criteria.contextId;
      }

      query += ` RETURN count(e) as count`;

      const result = await session.run(query, params);

      return result.records[0].get("count").toNumber();
    } catch (error) {
      console.error(`Error counting entities in Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Delete an entity by ID
   */
  async deleteEntity(id: string): Promise<boolean> {
    const session = this.connection.getSession();

    try {
      // First check for related entities
      const relatedCheck = await session.run(
        `
        MATCH (e:Entity {id: $id})-[]-(related)
        RETURN count(related) as relatedCount
      `,
        { id }
      );

      const relatedCount = relatedCheck.records[0]
        .get("relatedCount")
        .toNumber();

      // Begin transaction
      const txc = session.beginTransaction();

      // First remove tag relations
      await txc.run(
        `
        MATCH (e:Entity {id: $id})-[r:HAS_TAG]->()
        DELETE r
        RETURN e
      `,
        { id }
      );

      // Delete the entity
      await txc.run(
        `
        MATCH (e:Entity {id: $id})
        DELETE e
        RETURN count(*) as deleted
      `,
        { id }
      );

      await txc.commit();

      return true;
    } catch (error) {
      console.error(`Error deleting entity from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Delete an entity definition by ID
   */
  async deleteEntityDefinition(id: string): Promise<boolean> {
    const session = this.connection.getSession();

    try {
      const txc = session.beginTransaction();

      // Delete validation rules
      await txc.run(
        `
        MATCH (e:EntityDefinition {id: $id})-[:HAS_VALIDATION]->(v:ValidationRule)
        DETACH DELETE v
        RETURN e
      `,
        { id }
      );

      // Delete behaviors
      await txc.run(
        `
        MATCH (e:EntityDefinition {id: $id})-[:HAS_BEHAVIOR]->(b:FormEntityBehavior)
        DETACH DELETE b
        RETURN e
      `,
        { id }
      );

      // Delete indices
      await txc.run(
        `
        MATCH (e:EntityDefinition {id: $id})-[:HAS_INDEX]->(i:EntityIndex)
        DETACH DELETE i
        RETURN e
      `,
        { id }
      );

      // Delete relationship definitions
      await txc.run(
        `
        MATCH (e:EntityDefinition {id: $id})-[:HAS_RELATIONSHIP]->(r:RelationshipDef)
        DETACH DELETE r
        RETURN e
      `,
        { id }
      );

      // Delete tag relations
      await txc.run(
        `
        MATCH (e:EntityDefinition {id: $id})-[r:HAS_TAG]->()
        DELETE r
        RETURN e
      `,
        { id }
      );

      // Delete the entity definition
      await txc.run(
        `
        MATCH (e:EntityDefinition {id: $id})
        DELETE e
        RETURN count(*) as deleted
      `,
        { id }
      );

      await txc.commit();

      return true;
    } catch (error) {
      console.error(`Error deleting entity definition from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get a Neo4j-safe label name
   */
  private getSafeLabel(name: string): string {
    // Remove invalid characters and ensure starts with a letter
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
  }
}
