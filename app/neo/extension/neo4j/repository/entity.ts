import { Neo4jConnection } from "../connection";
import { EntityShape, EntityShapeSchema } from "@/form/schema/entity";
import {
  ManagedTransaction,
  QueryResult,
  RecordShape,
  ResultSummary,
} from "neo4j-driver";
import { v4 as uuidv4 } from "uuid"; // Use uuid library

/**
 * EntityShapeRepository
 *
 * Manages the persistence of Entity Shapes (Instances) in Neo4j.
 */
export class EntityShapeRepository {
  private connection: Neo4jConnection;

  // No FormShapeRepository dependency
  constructor(connection: Neo4jConnection) {
    this.connection = connection;
  }

  /**
   * Saves an entity instance (EntityShape) to Neo4j.
   * Applies a dynamic label like :Entity:Kind based on the 'kind' property within entityData.
   * Stores metadata and instance values as node properties.
   *
   * @param entityData The entity instance data (metadata + values), must include 'kind'.
   */
  async saveEntity(entityData: Partial<EntityShape>): Promise<EntityShape> {
    // 1. Prepare entity object (expects 'kind' in entityData)
    const now = new Date();
    const entity: EntityShape = {
      id: entityData.id || uuidv4(),
      name: entityData.name || "",
      description: entityData.description || "",
      kind: entityData.kind!,
      formId: entityData.formId!,
      tags: entityData.tags || [],
      state: entityData.state || {},
      createdAt: entityData.createdAt || now.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (!entity.formId) {
      throw new Error("Cannot save EntityShape without a valid formId.");
    }
    if (!entity.kind) {
      throw new Error(
        "Cannot save EntityShape without a valid 'kind' property in entityData."
      );
    }
    // 2. Separate metadata from instance values
    const metadataKeys = Object.keys(EntityShapeSchema.shape);
    const propertiesToSave: Record<string, any> = {};
    // Populate metadata properties
    for (const key of metadataKeys) {
      if (key in entity && entity[key as keyof EntityShape] !== undefined) {
        const value = entity[key as keyof EntityShape];
        // *** Stringify the 'state' object ***
        if (key === "state" && typeof value === "object" && value !== null) {
          propertiesToSave[key] = JSON.stringify(value);
        } else {
          propertiesToSave[key] = value;
        }
      }
    }
    // Populate instance value properties (handle potential objects here too if needed)
    if ("fields" in entityData && Array.isArray(entityData.fields)) {
      // *** Make sure this loop exists and is correct ***
      for (const field of entityData.fields) {
        // Assuming ValueField type
        if (field && field.id && field.hasOwnProperty("value")) {
          // Use field.id as the property key
          const propertyKey = field.id;
          const propertyValue = field.value;

          // Basic check for complex objects (excluding arrays for now)
          if (
            typeof propertyValue === "object" &&
            propertyValue !== null &&
            !Array.isArray(propertyValue)
          ) {
            console.warn(
              `Field '${propertyKey}' value is an object. Stringifying.`
            );
            propertiesToSave[propertyKey] = JSON.stringify(propertyValue);
          } else {
            // Store primitive values or arrays of primitives directly
            propertiesToSave[propertyKey] = propertyValue;
          }
        }
      }
      // *** Crucially, do NOT add the 'fields' array itself to propertiesToSave ***
      // delete propertiesToSave['fields']; // Ensure 'fields' itself isn't saved if it got added somehow
    }

    const session = this.connection.getSession({ defaultAccessMode: "WRITE" });
    try {
      const entityKindLabel = this.getSafeLabel(entity.kind);
      const dynamicLabels = ["Entity", entityKindLabel];

      const savedId = await session.executeWrite(
        async (txc: ManagedTransaction) => {
          const mergeResult = await txc.run(
            `
          CALL apoc.merge.node($labels, {id: $props.id}) YIELD node AS es
          SET es += $props
          SET es.createdAt = datetime($props.createdAt)
          SET es.updatedAt = datetime($props.updatedAt)
          RETURN es.id as id
          `,
            { labels: dynamicLabels, props: propertiesToSave }
          );
          const nodeId = mergeResult.records[0]?.get("id");

          if (!nodeId) {
            throw new Error("Failed to merge entity node.");
          }

          await this.syncTags(txc, nodeId, entity.tags);

          const formKindLabel = entityKindLabel;
          await txc.run(
            `
            MATCH (es:${dynamicLabels.join(":")} {id: $entityId})
            MATCH (fs:Form:\`${formKindLabel}\` {id: $formId})
            MERGE (es)-[:INSTANCE_OF]->(fs)
        `,
            { entityId: nodeId, formId: entity.formId }
          );

          return nodeId;
        }
      );

      const savedEntityData = { ...entityData, ...entity };
      Object.keys(savedEntityData).forEach(
        (key) =>
          savedEntityData[key as keyof EntityShape] === undefined &&
          delete savedEntityData[key as keyof EntityShape]
      );
      return savedEntityData as EntityShape;
    } catch (error) {
      console.error(`Error saving entity shape to Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  async getEntityById(id: string): Promise<EntityShape | null> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });
    try {
      // Define the expected shape of the record returned by the query
      const result = await session.executeRead(
        async (txc: ManagedTransaction) => {
          // Fetch all properties and tags separately
          // Add generic type argument to txc.run for better type inference
          return await txc.run<{ props: Record<string, any>; tags: string[] }>(
            `
          MATCH (n:Entity {id: $id})
          OPTIONAL MATCH (n)-[:HAS_TAG]->(t:Tag)
          RETURN properties(n) as props, collect(t.name) as tags
          `,
            { id }
          );
        }
      );

      if (result.records.length === 0) {
        return null; // Not found
      }

      const rawProps = result.records[0].get("props");
      const tags = result.records[0].get("tags") || []; // Ensure tags is an array

      // 1. Initialize the reconstructed object
      const reconstructedEntity: Record<string, any> = {};

      // 2. Process known metadata properties based on schema
      const metadataKeys = Object.keys(EntityShapeSchema.shape);
      for (const key of metadataKeys) {
        if (rawProps.hasOwnProperty(key)) {
          let value = rawProps[key];
          // Convert Neo4j DateTime to ISO string
          if (
            (key === "createdAt" || key === "updatedAt") &&
            value &&
            typeof value === "object" &&
            "toString" in value
          ) {
            value = value.toString();
          }
          // Assign known metadata property
          reconstructedEntity[key] = value;
        }
      }
      // Ensure tags from the separate collection are assigned
      reconstructedEntity.tags = tags;
      // Ensure state is an object, default to empty if null/undefined
      reconstructedEntity.state = reconstructedEntity.state ?? {};

      // 3. Process remaining properties as instance values
      for (const key in rawProps) {
        if (rawProps.hasOwnProperty(key) && !metadataKeys.includes(key)) {
          let value = rawProps[key];
          // Basic Deserialization Example: Check if it looks like a JSON string
          // Adjust this logic based on how complex objects are actually saved
          if (
            typeof value === "string" &&
            value.startsWith("{") &&
            value.endsWith("}")
          ) {
            try {
              value = JSON.parse(value);
            } catch (e) {
              // Not valid JSON, keep as string or handle error
              console.warn(
                `Property '${key}' looked like JSON but failed to parse:`,
                e
              );
            }
          }
          // Assign instance value property
          reconstructedEntity[key] = value;
        }
      }

      // 4. Validate the reconstructed object against the schema
      // const parseResult = reconstructedEntity; // EntityShapeSchema.safeParse(reconstructedEntity);

      // if (!parseResult.success) {
      //   console.error(
      //     `Validation failed for entity ID ${id}:`,
      //     parseResult.error.errors
      //   );
      //   // Decide how to handle: throw error, return null, or return partial?
      //   // Throwing an error might be safest if data integrity is critical.
      //   throw new Error(`Failed to validate fetched entity data for ID ${id}.`);
      //   // return null; // Alternative: return null if validation fails
      // }

      // 5. Return the validated data
      return reconstructedEntity as EntityShape; // This should be the active return
    } catch (error) {
      // Log specific error or re-throw
      if (
        !(
          error instanceof Error &&
          error.message.startsWith("Failed to validate")
        )
      ) {
        console.error(
          `Error getting entity shape by ID (${id}) from Neo4j: ${error}`
        );
      }
      throw error; // Re-throw error after logging/handling
    } finally {
      await session.close();
    }
  }

  /**
   * Finds entity instances based on criteria.
   * Currently supports filtering by kind (required) and tags (optional).
   *
   * @param criteria Object containing search criteria. Requires 'kind', optionally 'tags'.
   * @returns An array of matching EntityShape objects.
   */
  async findEntities(criteria: {
    kind: string;
    tags?: string[];
  }): Promise<EntityShape[]> {
    if (!criteria || !criteria.kind) {
      throw new Error("Criteria must include 'kind' to find entities.");
    }

    const session = this.connection.getSession({ defaultAccessMode: "READ" });
    try {
      const entityKindLabel = this.getSafeLabel(criteria.kind);
      const params: Record<string, any> = { kindLabel: entityKindLabel };
      let matchClause = `MATCH (n:Entity:\`${entityKindLabel}\`)`;
      let whereClauses: string[] = [];
      let withClause = "WITH n"; // Start WITH clause to pass 'n'

      // Add tag filtering if provided
      if (criteria.tags && criteria.tags.length > 0) {
        params.tags = criteria.tags;
        // Match nodes that have ALL specified tags
        matchClause += `\nMATCH (t:Tag)`;
        whereClauses.push(`t.name IN $tags`);
        withClause += `, collect(t) as tagNodes`; // Collect tags matched so far
        // Ensure the entity node 'n' is connected to all required tags
        whereClauses.push(
          `ALL(tagNode IN tagNodes WHERE (n)-[:HAS_TAG]->(tagNode))`
        );
        // This is complex for partial matches, simpler for ALL match:
        // Re-adjusting for clarity: Match node, then filter by tags
        matchClause = `MATCH (n:Entity:\`${entityKindLabel}\`)`; // Reset match
        whereClauses = []; // Reset where
        withClause = "WITH n"; // Reset with
        params.tags = criteria.tags;
        // Add a WHERE clause for each tag
        criteria.tags.forEach((tag, index) => {
          const paramName = `tag${index}`;
          params[paramName] = tag;
          whereClauses.push(
            `EXISTS { MATCH (n)-[:HAS_TAG]->(:Tag {name: $${paramName}}) }`
          );
        });
      }

      // Construct the final query
      let cypher = matchClause;
      if (whereClauses.length > 0) {
        cypher += `\nWHERE ${whereClauses.join(" AND ")}`;
      }
      // Fetch properties and tags for the matched nodes
      cypher += `
        ${withClause} // Pass 'n' through
        OPTIONAL MATCH (n)-[:HAS_TAG]->(t:Tag)
        RETURN properties(n) as props, collect(t.name) as tags`;

      const result: QueryResult<RecordShape<"props" | "tags", any>> =
        await session.executeRead(async (txc: ManagedTransaction) => {
          return await txc.run(cypher, params);
        });

      // Reconstruct each entity
      const entities: EntityShape[] = [];
      for (const record of result.records) {
        const rawProps = record.get("props");
        const tags = record.get("tags") || [];
        const reconstructedEntity: Record<string, any> = {};

        // Process metadata (similar to getEntityById)
        const metadataKeys = Object.keys(EntityShapeSchema.shape);
        for (const key of metadataKeys) {
          if (rawProps.hasOwnProperty(key)) {
            let value = rawProps[key];
            if (
              (key === "createdAt" || key === "updatedAt") &&
              value &&
              typeof value === "object" &&
              "toString" in value
            ) {
              value = value.toString();
            }
            reconstructedEntity[key] = value;
          }
        }
        reconstructedEntity.tags = tags;
        reconstructedEntity.state = reconstructedEntity.state ?? {};

        // Process instance values (similar to getEntityById)
        for (const key in rawProps) {
          if (rawProps.hasOwnProperty(key) && !metadataKeys.includes(key)) {
            let value = rawProps[key];
            if (
              typeof value === "string" &&
              value.startsWith("{") &&
              value.endsWith("}")
            ) {
              try {
                value = JSON.parse(value);
              } catch (e) {
                console.warn(
                  `Property '${key}' looked like JSON but failed to parse:`,
                  e
                );
              }
            }
            reconstructedEntity[key] = value;
          }
        }

        // Validation (Commented out)
        /*
        const parseResult = EntityShapeSchema.safeParse(reconstructedEntity);
        if (!parseResult.success) {
          console.error(`Validation failed for found entity ID ${reconstructedEntity.id}:`, parseResult.error.errors);
          // Skip this entity or throw error? Skipping for now.
          continue;
        }
        entities.push(parseResult.data);
        */

        // Add reconstructed entity (without validation for now)
        entities.push(reconstructedEntity as EntityShape);
      }

      return entities;
    } catch (error) {
      console.error(`Error finding entity shapes from Neo4j: ${error}`);
      throw error; // Re-throw error after logging
    } finally {
      await session.close();
    }
  }

  /**
   * Deletes an entity instance by its ID.
   * Detaches the node from all relationships before deleting.
   *
   * @param id The unique ID of the entity instance to delete.
   * @returns True if the entity was deleted, false if it was not found.
   */
  async deleteEntity(id: string): Promise<boolean> {
    const session = this.connection.getSession({ defaultAccessMode: "WRITE" });
    try {
      const summary: ResultSummary = await session.executeWrite(
        async (txc: ManagedTransaction) => {
          // Match the node by ID using the base :Entity label
          // DETACH DELETE removes the node and all its relationships
          const result = await txc.run(
            `
          MATCH (n:Entity {id: $id})
          DETACH DELETE n
          `,
            { id }
          );
          // Return the summary which contains counters
          return result.summary;
        }
      );

      // Check if any nodes were actually deleted
      const nodesDeleted = summary.counters.updates().nodesDeleted;
      return nodesDeleted > 0;
    } catch (error) {
      console.error(
        `Error deleting entity shape with ID (${id}) from Neo4j: ${error}`
      );
      throw error; // Re-throw error after logging
    } finally {
      await session.close();
    }
  }

  // --- syncTags method ---
  private async syncTags(
    txc: ManagedTransaction,
    entityId: string,
    tags: string[] | undefined
  ) {
    await txc.run(`MATCH (e {id: $id})-[r:HAS_TAG]->() DELETE r`, {
      id: entityId,
    });
    if (tags && tags.length > 0) {
      await txc.run(
        `
        UNWIND $tags as tagName
        MATCH (e {id: $id})
        MERGE (t:Tag {name: tagName})
        MERGE (e)-[:HAS_TAG]->(t)
      `,
        { id: entityId, tags: tags }
      );
    }
  }

  // --- getSafeLabel method ---
  private getSafeLabel(name: string | undefined): string {
    if (!name) return "Unknown";
    let safeName = name.replace(/[^a-zA-Z0-9_]/g, "_");
    if (!safeName || !/^[a-zA-Z_]/.test(safeName)) {
      safeName = "_" + safeName;
    }
    return safeName || "Unknown";
  }
}
