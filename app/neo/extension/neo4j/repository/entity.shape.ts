import { Neo4jConnection } from "../connection";
import { FormEntity } from "@/form/schema/entity";
import neo4j from "neo4j-driver";

/**
 * EntityShapeRepository
 *
 * Manages the persistence of Entity Shapes (Instances) in Neo4j.
 * Represents the actual nodes in the knowledge graph.
 */
export class EntityShapeRepository {
  private connection: Neo4jConnection;

  constructor(connection: Neo4jConnection) {
    this.connection = connection;
  }

  /**
   * Save an entity instance to Neo4j
   */
  async saveEntity(entity: FormEntity): Promise<FormEntity> {
    const session = this.connection.getSession({ defaultAccessMode: "WRITE" });

    try {
      const txc = session.beginTransaction();

      // Determine entity label - use type as label, ensure it's safe
      const entityLabel = this.getSafeLabel(entity.type);

      // Prepare properties: reserved fields + schema fields
      const propertiesToSave: Record<string, any> = {
        id: entity.id,
        name: entity.name,
        description: entity.description || null,
        type: entity.type,
        createdAt: entity.createdAt
          ? new Date(entity.createdAt).toISOString()
          : new Date().toISOString(),
        updatedAt: new Date().getTime(), // Always set on save
        createdBy: entity.createdBy || null,
        contextId: entity.contextId || null,
        definitionId: entity.definitionId || null, // Assuming definitionId is on FormEntity
      };

      // Add schema properties, ensuring no overwrite of reserved props
      if (entity.schema) {
        for (const [key, value] of Object.entries(entity.schema)) {
          if (!(key in propertiesToSave) && value !== undefined) {
            // Convert complex objects/arrays to JSON strings if necessary,
            // or handle specific types like Dates appropriately.
            // Simple approach: JSON stringify non-primitive types.
            propertiesToSave[key] =
              typeof value === "object" && value !== null
                ? JSON.stringify(value)
                : value;
          }
        }
      }

      // Build SET clauses dynamically
      const setClauses = Object.keys(propertiesToSave)
        .map((key) => `e.\`${key}\` = $props.\`${key}\``) // Use backticks for safety
        .join(", ");

      // Create or update the entity instance using dynamic labels and properties
      const cypher = `
        MERGE (e:Entity {id: $props.id})
        ON CREATE SET e:${entityLabel} // Add specific type label on create
        ON MATCH SET e:${entityLabel}  // Ensure specific type label exists on match
        SET ${setClauses}
        RETURN e
      `;

      await txc.run(cypher, { props: propertiesToSave });

      // Handle tags (sync)
      await this.syncTags(txc, entity.id, entity.tags);

      await txc.commit();

      // Refetch to confirm save
      const savedEntity = await this.getEntityById(entity.id);
      return savedEntity!; // Assume it exists
    } catch (error) {
      console.error(`Error saving entity shape to Neo4j: ${error}`);
      // await txc.rollback();
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
      // Fetch entity node and its tags
      const result = await session.run(
        `
        MATCH (e:Entity {id: $id})
        OPTIONAL MATCH (e)-[:HAS_TAG]->(t:Tag)
        RETURN e, collect(DISTINCT t.name) as tags
      `,
        { id }
      );

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      const entityNode = record.get("e").properties;
      const tags = record.get("tags") || [];

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
        "definitionId", // Add definitionId if it's a direct prop
      ];
      const schema: Record<string, any> = {};

      for (const [key, value] of Object.entries(entityNode)) {
        if (!reservedProps.includes(key)) {
          // Attempt to parse if it looks like JSON
          if (
            typeof value === "string" &&
            (value.startsWith("{") || value.startsWith("["))
          ) {
            try {
              schema[key] = JSON.parse(value);
            } catch (e) {
              schema[key] = value; // Keep as string if parsing fails
            }
          } else {
            schema[key] = value;
          }
        }
      }

      // Build the complete entity
      // Mapping might need to be inferred or fetched from definition if needed downstream
      return {
        id: entityNode.id,
        name: entityNode.name,
        description: entityNode.description,
        type: entityNode.type,
        schema,
        // mapping: entityNode.mapping ? JSON.parse(entityNode.mapping) : undefined, // If mapping is stored on shape
        tags,
        createdAt: entityNode.createdAt
          ? new Date(entityNode.createdAt.toString()).getTime()
          : Date.now(),
        updatedAt: entityNode.updatedAt
          ? new Date(entityNode.updatedAt.toString()).getTime()
          : Date.now(),
        createdBy: entityNode.createdBy,
        contextId: entityNode.contextId,
        definitionId: entityNode.definitionId, // Include if stored
      };
    } catch (error) {
      console.error(`Error getting entity shape from Neo4j: ${error}`);
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
      definitionId?: string;
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
      let matchClause = `MATCH (e:Entity)`;
      if (criteria.type) {
        matchClause = `MATCH (e:Entity:\`${this.getSafeLabel(
          criteria.type
        )}\`)`;
      }

      let whereClauses: string[] = [];
      const params: Record<string, any> = {};

      // --- Build WHERE clauses and params (same as before) ---
      if (criteria.name) {
        whereClauses.push(`e.name CONTAINS $name`);
        params.name = criteria.name;
      }
      // Add tag matching to WHERE clause using pattern comprehension for efficiency
      if (criteria.tag) {
        whereClauses.push(
          `EXISTS { MATCH (e)-[:HAS_TAG]->(:Tag {name: $tag}) }`
        );
        params.tag = criteria.tag;
      }
      if (criteria.contextId) {
        whereClauses.push(`e.contextId = $contextId`);
        params.contextId = criteria.contextId;
      }
      if (criteria.definitionId) {
        whereClauses.push(`e.definitionId = $definitionId`);
        params.definitionId = criteria.definitionId;
      }
      if (criteria.createdBy) {
        whereClauses.push(`e.createdBy = $createdBy`);
        params.createdBy = criteria.createdBy;
      }
      if (criteria.property) {
        whereClauses.push(`e.\`${criteria.property.name}\` = $propertyValue`);
        params.propertyValue =
          typeof criteria.property.value === "object" &&
          criteria.property.value !== null
            ? JSON.stringify(criteria.property.value)
            : criteria.property.value;
      }
      // --- End WHERE clause building ---

      const whereQuery =
        whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

      // --- Modify RETURN clause ---
      // Return the entity node and collect its tags directly
      const returnClause = `
        WITH e // Pass entity 'e' after WHERE
        OPTIONAL MATCH (e)-[:HAS_TAG]->(t:Tag) // Match tags for the filtered entities
        RETURN e, collect(DISTINCT t.name) as tags // Return node and tags
        ORDER BY e.name // Apply ordering
        SKIP $offset
        LIMIT $limit
      `;
      // --- End RETURN clause modification ---

      params.limit = neo4j.int(criteria.limit ?? 100);
      params.offset = neo4j.int(criteria.offset ?? 0); // Corrected offset usage

      const fullQuery = `${matchClause} ${whereQuery} ${returnClause}`;

      // --- Execute the single, more complete query ---
      const result = await session.run(fullQuery, params);

      // --- Map results directly using a helper (similar to getEntityById) ---
      return result.records
        .map((record) => {
          const entityNode = record.get("e").properties;
          const tags = record.get("tags") || [];
          // Use the same mapping logic as in getEntityById
          return this._mapNodeToFormEntity(entityNode, tags);
        })
        .filter((e): e is FormEntity => e !== null); // Filter out nulls if mapping fails
    } catch (error) {
      console.error(`Error finding entity shapes in Neo4j: ${error}`);
      // Consider logging the query and params for debugging
      // console.error("Query:", fullQuery);
      // console.error("Params:", params);
      throw error;
    } finally {
      await session.close();
    }
  }

  private _mapNodeToFormEntity(
    entityNode: Record<string, any>,
    tags: string[]
  ): FormEntity | null {
    if (!entityNode || !entityNode.id) return null;

    const reservedProps = [
      "id",
      "name",
      "description",
      "type",
      "createdAt",
      "updatedAt",
      "createdBy",
      "contextId",
      "definitionId",
    ];
    const schema: Record<string, any> = {};

    for (const [key, value] of Object.entries(entityNode)) {
      if (!reservedProps.includes(key)) {
        if (
          typeof value === "string" &&
          (value.startsWith("{") || value.startsWith("["))
        ) {
          try {
            schema[key] = JSON.parse(value);
          } catch (e) {
            schema[key] = value;
          }
        } else {
          schema[key] = value;
        }
      }
    }

    // Helper to safely convert Neo4j DateTime or timestamp string/number to epoch milliseconds
    const parseTimestamp = (ts: any): number => {
      if (!ts) return Date.now();
      if (typeof ts === "number") return ts; // Already epoch ms
      if (ts.epochMillis) return ts.epochMillis; // Neo4j Integer object for large numbers
      if (ts.low !== undefined && ts.high !== undefined)
        return neo4j.integer.toNumber(ts); // Neo4j Integer
      try {
        return new Date(ts.toString()).getTime(); // Neo4j DateTime or ISO String
      } catch {
        return Date.now(); // Fallback
      }
    };

    return {
      id: entityNode.id,
      name: entityNode.name,
      description: entityNode.description,
      type: entityNode.type,
      schema,
      tags,
      createdAt: parseTimestamp(entityNode.createdAt),
      updatedAt: parseTimestamp(entityNode.updatedAt),
      createdBy: entityNode.createdBy,
      contextId: entityNode.contextId,
      definitionId: entityNode.definitionId,
    };
  }

  /**
   * Count entities by criteria
   */
  async countEntities(
    criteria: {
      type?: string;
      tag?: string;
      contextId?: string;
      definitionId?: string;
      // Add other relevant criteria for counting
    } = {}
  ): Promise<number> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      let matchClause = `MATCH (e:Entity)`;
      if (criteria.type) {
        matchClause = `MATCH (e:Entity:\`${this.getSafeLabel(
          criteria.type
        )}\`)`;
      }

      let whereClauses: string[] = [];
      const params: Record<string, any> = {};

      if (criteria.tag) {
        matchClause += ` MATCH (e)-[:HAS_TAG]->(:Tag {name: $tag})`;
        params.tag = criteria.tag;
      }

      if (criteria.contextId) {
        whereClauses.push(`e.contextId = $contextId`);
        params.contextId = criteria.contextId;
      }

      if (criteria.definitionId) {
        whereClauses.push(`e.definitionId = $definitionId`);
        params.definitionId = criteria.definitionId;
      }
      // Add other criteria...

      const whereQuery =
        whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
      const countQuery = `RETURN count(e) as count`;

      const fullQuery = `${matchClause} ${whereQuery} ${countQuery}`;
      const result = await session.run(fullQuery, params);

      if (result.records.length > 0) {
        // Directly use the value returned by get('count')
        // It will be a standard JavaScript number because count() returns a small integer
        const count = result.records[0]?.get("count");
        // Ensure count is treated as a number, provide 0 as fallback
        return typeof count === 'number' ? count : (count?.low ?? 0); 
      } else {
        return 0;
      }
    } catch (error) {
      console.error(`Error counting entity shapes in Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Delete an entity instance by ID
   */
  async deleteEntity(id: string): Promise<boolean> {
    const session = this.connection.getSession({ defaultAccessMode: "WRITE" });

    try {
      // Use DETACH DELETE to remove the node and its relationships
      const result = await session.run(
        `
        MATCH (e:Entity {id: $id})
        DETACH DELETE e
        RETURN count(e) as deletedCount
      `,
        { id }
      );

      // Check if a node was actually deleted
      return result.records.length > 0;
    } catch (error) {
      console.error(`Error deleting entity shape from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Helper to sync tags for an entity shape
   */
  private async syncTags(
    txc: any,
    entityId: string,
    tags: string[] | undefined
  ) {
    // Remove existing tag relations
    await txc.run(`MATCH (e:Entity {id: $id})-[r:HAS_TAG]->() DELETE r`, {
      id: entityId,
    });
    if (tags && tags.length > 0) {
      // Add new tags
      await txc.run(
        `
        UNWIND $tags as tagName
        MATCH (e:Entity {id: $id})
        MERGE (t:Tag {name: tagName})
        MERGE (e)-[:HAS_TAG]->(t)
      `,
        { id: entityId, tags: tags }
      );
    }
  }

  /**
   * Get a Neo4j-safe label name
   */
  private getSafeLabel(name: string | undefined): string {
    if (!name) return "Unknown"; // Default label if type is missing
    // Remove invalid characters, ensure starts with letter or underscore, handle empty strings
    let safeName = name.replace(/[^a-zA-Z0-9_]/g, "_");
    if (!safeName || !/^[a-zA-Z_]/.test(safeName)) {
      safeName = "_" + safeName;
    }
    return safeName || "Unknown"; // Final fallback
  }
}
