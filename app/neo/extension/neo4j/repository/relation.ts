import { Neo4jConnection } from "../connection";
import { FormRelation, FormRelationCriteria } from "@/form/schema/relation";
import { RelationDefinitionRepository } from "./relation.def";
import { v4 as uuidv4 } from "uuid";
import neo4j, { Node, Relationship } from "neo4j-driver";

/**
 * RelationShapeRepository
 *
 * Manages the persistence of Relation Shapes in Neo4j.
 */
export class RelationShapeRepository {
  private connection: Neo4jConnection;
  private definitionRepo: RelationDefinitionRepository; // Keep reference for validation

  constructor(connection: Neo4jConnection) {
    this.connection = connection;
    // Instantiate definition repo - assumes connection is shared or passed appropriately
    this.definitionRepo = new RelationDefinitionRepository(connection);
  }

  /**
   * Save a relation instance to Neo4j
   */
  async saveRelation(relation: FormRelation): Promise<FormRelation> {
    const session = this.connection.getSession({ defaultAccessMode: "WRITE" });
    const txc = session.beginTransaction();

    try {
      if (
        !relation.id ||
        !relation.definitionId ||
        !relation.sourceId ||
        !relation.targetId ||
        !relation.type
      ) {
        throw new Error(
          "FormRelation object is missing required fields (id, definitionId, sourceId, targetId, type)"
        );
      }

      const now = Date.now();
      const neo4jProperties = {
        ...(relation.properties || {}), // Flatten custom properties
        id: relation.id,
        name: relation.name,
        type: relation.type,
        definitionId: relation.definitionId,
        createdAt: relation.createdAt || now,
        updatedAt: now,
        contextId: relation.contextId || null,
        createdBy: relation.createdBy || null,
        weight: relation.weight ?? null, // Use null coalescing
        active: relation.active !== false,
        // Add other instance-specific fields like directional if needed
        directional: relation.directional ?? true, // Default to true
      };

      const safeRelationType = this.getSafeRelationName(relation.type);

      // MERGE the relationship based on instance ID
      await txc.run(
        `
        MATCH (source:Entity {id: $sourceId})
        MATCH (target:Entity {id: $targetId})
        MERGE (source)-[r:${safeRelationType} {id: $instanceId}]->(target)
        SET r = $props // Overwrite all properties on MERGE
        SET r.sourceId = source.id, r.targetId = target.id // Ensure these are set if needed
        RETURN r
      `,
        {
          sourceId: relation.sourceId,
          targetId: relation.targetId,
          instanceId: relation.id,
          props: neo4jProperties,
        }
      );

      // Handle inverse relationship
      if (relation.inverseName) {
        const safeInverseType = this.getSafeRelationName(relation.inverseName);
        await txc.run(
          `
          MATCH (source:Entity {id: $sourceId})
          MATCH (target:Entity {id: $targetId})
          MERGE (target)-[inv_r:${safeInverseType} {id: $instanceId}]->(source)
          SET inv_r.definitionId = $definitionId,
              inv_r.inverse = true,
              inv_r.createdAt = datetime($createdAt), // Use datetime for consistency
              inv_r.updatedAt = datetime($updatedAt)
          RETURN inv_r
          `,
          {
            sourceId: relation.sourceId,
            targetId: relation.targetId,
            instanceId: relation.id,
            definitionId: relation.definitionId,
            createdAt: new Date(neo4jProperties.createdAt).toISOString(),
            updatedAt: new Date(neo4jProperties.updatedAt).toISOString(),
          }
        );
      } else {
        // Ensure no inverse exists if inverseName is not provided
        await txc.run(
          `MATCH ()-[inv_r {id: $instanceId}]->() WHERE inv_r.inverse = true DELETE inv_r`,
          { instanceId: relation.id }
        );
      }

      await txc.commit();
      return { ...relation, updatedAt: neo4jProperties.updatedAt }; // Return updated object
    } catch (error) {
      console.error(`Error saving relation instance to Neo4j: ${error}`);
      await txc.rollback();
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get a relation instance by its unique ID property.
   */
  async getRelationById(id: string): Promise<FormRelation | null> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });
    try {
      // Match the relationship directly by its 'id' property
      const result = await session.run(
        `
        MATCH (source)-[r]->(target)
        WHERE r.id = $id
        RETURN r, source, target
        LIMIT 1
        `,
        { id }
      );

      if (result.records.length === 0) {
        console.warn(
          `Relation instance with ID ${id} not found in getRelationInstanceById.`
        ); // Added warning
        return null; // Not found
      }

      const record = result.records[0];
      const relationship = record.get("r");
      const sourceNode = record.get("source");
      const targetNode = record.get("target");

      // Add checks for robustness
      if (!relationship || !sourceNode || !targetNode) {
        console.error(
          `Incomplete data returned for relation instance ID ${id}. Rel, Source, or Target missing.`
        );
        return null;
      }

      // Assuming _mapRelationshipToFormRelation exists and is correct
      return this._mapRelationshipToFormRelation(
        relationship,
        sourceNode,
        targetNode
      );
    } catch (error) {
      console.error(
        `Error in getRelationInstanceById for ID (${id}): ${error}`
      );
      throw error;
    } finally {
      await session.close();
    }
  }

  // Make sure _mapRelationshipToFormRelation correctly parses dates and properties
  private _mapRelationshipToFormRelation(
    relationship: Relationship,
    sourceNode: Node,
    targetNode: Node
  ): FormRelation | null {
    // ... (ensure properties like createdAt/updatedAt are parsed using .getTime()) ...
    // ... (ensure relationship.properties.id is mapped to FormRelation.id) ...
    // ... (ensure sourceNode.properties.id and targetNode.properties.id are mapped) ...

    const props = relationship.properties;
    let parsedRelProps = {};
    // Example: Safely parse 'properties' field if it's stored as JSON string
    if (props.properties && typeof props.properties === "string") {
      try {
        parsedRelProps = JSON.parse(props.properties);
      } catch (e) {
        console.warn(
          `Failed to parse relationship properties JSON for rel ID ${props.id}: ${props.properties}`
        );
      }
    } else if (props.properties && typeof props.properties === "object") {
      parsedRelProps = props.properties; // Assume already object
    }

    return {
      id: props.id, // Essential: Map the relationship's ID property
      definitionId: props.definitionId,
      type: relationship.type, // The actual Neo4j relationship type
      sourceId: sourceNode.properties.id, // Assuming nodes have 'id'
      targetId: targetNode.properties.id, // Assuming nodes have 'id'
      properties:
        Object.keys(parsedRelProps).length > 0 ? parsedRelProps : undefined,
      weight: props.weight,
      active: props.active ?? true, // Default to true if not set?
      directional: props.directional ?? true, // Default to true?
      contextId: props.contextId,
      createdBy: props.createdBy,
      createdAt: props.createdAt
        ? new Date(props.createdAt.toString()).getTime()
        : Date.now(),
      updatedAt: props.updatedAt
        ? new Date(props.updatedAt.toString()).getTime()
        : Date.now(),
      name: props.name,
      description: props.description,
      inverseName: props.inverseName,
    };
  }

  /**
   * Find relation instances based on various criteria defined in FormRelationCriteria.
   */
  async findRelations(criteria: FormRelationCriteria): Promise<FormRelation[]> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });
    try {
      let query = `MATCH (source)-[r]->(target)`;
      const whereConditions: string[] = [];
      const params: Record<string, any> = {};

      // --- Basic Filters ---
      if (criteria.definitionId) {
        whereConditions.push(`r.definitionId = $definitionId`);
        params.definitionId = criteria.definitionId;
      }
      if (criteria.type) {
        // IMPORTANT: Using criteria.type to match the Neo4j relationship type.
        // Ensure this matches how relationships are created (e.g., using definition.type).
        query = `MATCH (source)-[r:\`${criteria.type}\`]->(target)`; // Use backticks for safety
      }
      if (criteria.sourceId) {
        // Assuming source nodes have an 'id' property
        whereConditions.push(`source.id = $sourceId`);
        params.sourceId = criteria.sourceId;
      }
      if (criteria.targetId) {
        // Assuming target nodes have an 'id' property
        whereConditions.push(`target.id = $targetId`);
        params.targetId = criteria.targetId;
      }
      if (criteria.contextId) {
        whereConditions.push(`r.contextId = $contextId`);
        params.contextId = criteria.contextId;
      }
      if (criteria.active !== undefined) {
        whereConditions.push(`r.active = $active`);
        params.active = criteria.active;
      }

      // --- Property Filters (from criteria.properties) ---
      if (criteria.properties) {
        Object.entries(criteria.properties).forEach(([key, value], index) => {
          // Sanitize key to prevent injection and handle potential special characters
          // A simple approach: allow only alphanumeric and underscore
          const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, "");
          if (sanitizedKey !== key || !sanitizedKey) {
            console.warn(`Skipping invalid property filter key: ${key}`);
            return; // Skip potentially unsafe keys
          }
          const paramName = `prop_${sanitizedKey}_${index}`; // Unique param name

          // Assuming properties are stored directly on the relationship 'r'
          // If they are nested under r.properties, change to `r.properties.\`${sanitizedKey}\``
          whereConditions.push(`r.\`${sanitizedKey}\` = $${paramName}`);
          params[paramName] = value;
        });
      }

      // --- Combine WHERE clauses ---
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(" AND ")}`;
      }

      // --- Return, Order, Skip, Limit ---
      query += ` RETURN r, source, target`;

      // Handle Sorting (Basic example: sort by one field)
      if (criteria.sort && criteria.sort.length > 0) {
        // Basic sort by the first field specified. Needs sanitization.
        const sortField = criteria.sort[0].replace(/[^a-zA-Z0-9_]/g, ""); // Basic sanitize
        if (sortField) {
          const direction =
            criteria.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";
          // Assuming sort field is on the relationship 'r'
          query += ` ORDER BY r.\`${sortField}\` ${direction}`;
        }
      } else {
        // Default sort order if none specified
        query += ` ORDER BY r.createdAt DESC`;
      }

      // Handle Offset (SKIP)
      if (criteria.offset !== undefined && criteria.offset > 0) {
        query += ` SKIP $offset`;
        params.offset = neo4j.int(criteria.offset); // Use neo4j.int
      }

      // Handle Limit
      query += ` LIMIT $limit`;
      params.limit = neo4j.int(criteria.limit ?? 100); // Use neo4j.int

      // --- Execute Query ---
      const result = await session.run(query, params);

      // --- Map Results ---
      return result.records
        .map((record) =>
          this._mapRelationshipToFormRelation(
            record.get("r"),
            record.get("source"),
            record.get("target")
          )
        )
        .filter((rel): rel is FormRelation => rel !== null);
    } catch (error) {
      console.error(`Error finding relation instances in Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create a relation instance between entities based on a definition ID.
   */
  async createRelation(params: {
    definitionId: string;
    sourceId: string;
    targetId: string;
    properties?: Record<string, any>;
    contextId?: string;
    createdBy?: string;
  }): Promise<FormRelation> {
    const {
      definitionId,
      sourceId,
      targetId,
      properties = {},
      contextId,
      createdBy,
    } = params;
    const session = this.connection.getSession({ defaultAccessMode: "WRITE" });
    const txc = session.beginTransaction();

    try {
      // Get definition for validation and details
      const definition = await this.definitionRepo.getRelationDefinitionById(
        definitionId
      );
      if (!definition) {
        throw new Error(`Relation definition not found: ${definitionId}`);
      }

      // --- Validation (within transaction) ---
      // 1. Check entities exist
      const entityCheck = await txc.run(
        `
        OPTIONAL MATCH (s:Entity {id: $sourceId})
        OPTIONAL MATCH (t:Entity {id: $targetId})
        RETURN s IS NOT NULL as sourceExists, t IS NOT NULL as targetExists
      `,
        { sourceId, targetId }
      );
      if (
        !entityCheck.records[0]?.get("sourceExists") ||
        !entityCheck.records[0]?.get("targetExists")
      ) {
        await txc.rollback();
        throw new Error("Source or target entity not found");
      }

      // 2. Check cardinality
      const safeRelationType = this.getSafeRelationName(definition.type); // Use definition type
      if (
        definition.cardinality === "one-to-one" ||
        definition.cardinality === "many-to-one"
      ) {
        const targetCheck = await txc.run(
          `MATCH (:Entity {id: $targetId})<-[r:${safeRelationType}]-() WHERE r.definitionId = $definitionId AND NOT r.inverse = true RETURN count(r) as c`,
          { targetId, definitionId }
        );
        if (targetCheck.records[0]?.get("c")?.toNumber() > 0) {
          await txc.rollback();
          throw new Error(
            `Target ${definition.cardinality} cardinality violation`
          );
        }
      }
      if (
        definition.cardinality === "one-to-one" ||
        definition.cardinality === "one-to-many"
      ) {
        const sourceCheck = await txc.run(
          `MATCH (:Entity {id: $sourceId})-[r:${safeRelationType}]->() WHERE r.definitionId = $definitionId AND NOT r.inverse = true RETURN count(r) as c`,
          { sourceId, definitionId }
        );
        if (sourceCheck.records[0]?.get("c")?.toNumber() > 0) {
          await txc.rollback();
          throw new Error(
            `Source ${definition.cardinality} cardinality violation`
          );
        }
      }
      // --- End Validation ---

      const instanceId = uuidv4();
      const now = Date.now();
      const neo4jProperties = {
        ...properties,
        id: instanceId,
        name: definition.name, // Inherit name from definition
        type: definition.type, // Inherit type from definition
        definitionId: definitionId,
        createdAt: now,
        updatedAt: now,
        contextId: contextId || null,
        createdBy: createdBy || null,
        active: true,
        directional: true, // Assuming default
      };

      // Create the main relation instance
      await txc.run(
        `
        MATCH (s:Entity {id: $sourceId})
        MATCH (t:Entity {id: $targetId})
        CREATE (s)-[r:${safeRelationType} $props]->(t)
        RETURN r
      `,
        { sourceId, targetId, props: neo4jProperties }
      );

      // Create inverse if defined
      if (definition.inverse?.type) {
        const safeInverseType = this.getSafeRelationName(
          definition.inverse.type
        );
        await txc.run(
          `
           MATCH (s:Entity {id: $sourceId})
           MATCH (t:Entity {id: $targetId})
           CREATE (t)-[inv_r:${safeInverseType} {
             id: $instanceId, definitionId: $definitionId, inverse: true,
             createdAt: datetime($createdAt), updatedAt: datetime($updatedAt)
           }]->(s)
         `,
          {
            sourceId,
            targetId,
            instanceId,
            definitionId,
            createdAt: new Date(now).toISOString(),
            updatedAt: new Date(now).toISOString(),
          }
        );
      }

      await txc.commit();

      // Construct and return the FormRelation object
      const createdRelation: FormRelation = {
        id: instanceId,
        name: definition.name,
        description: definition.description,
        definitionId: definitionId,
        type: definition.type || "Unknown",
        sourceId: sourceId,
        targetId: targetId,
        properties: Object.keys(properties).length > 0 ? properties : undefined,
        directional: true,
        inverseName: definition.inverse?.name,
        active: true,
        createdAt: now,
        updatedAt: now,
        createdBy: createdBy,
        contextId: contextId,
      };
      return createdRelation;
    } catch (error) {
      console.error(`Error creating relation instance in Neo4j: ${error}`);
      // Ensure rollback happens if not already done
      //if (txc && txc.isOpen())
      await txc.rollback();
      throw error;
    } finally {
      if (session) await session.close();
    }
  }

  /**
   * Get all relations connected to a specific entity.
   */
  async getEntityRelations(
    entityId: string,
    options: {
      direction?: "outgoing" | "incoming" | "both";
      relationType?: string; // Neo4j type
      definitionId?: string;
      limit?: number;
    } = {}
  ): Promise<FormRelation[]> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });
    const {
      direction = "both",
      relationType,
      definitionId,
      limit = 100,
    } = options;

    try {
      const relTypeFilter = relationType
        ? `:${this.getSafeRelationName(relationType)}`
        : "";
      const queryParams: Record<string, any> = {
        entityId,
        limit: neo4j.int(limit),
      };
      const whereClauses: string[] = []; // Start with empty clauses

      // Corrected WHERE clause for inverse check
      const inverseCheck = "r.inverse IS NULL OR r.inverse = false";

      if (definitionId) {
        whereClauses.push("r.definitionId = $definitionId");
        queryParams.definitionId = definitionId;
      }

      let matchQuery = "";

      // Build outgoing match
      if (direction === "outgoing" || direction === "both") {
        const outgoingWhere = [inverseCheck, ...whereClauses].join(" AND ");
        matchQuery += `MATCH (e:Entity {id: $entityId})-[r${relTypeFilter}]->(other) 
                      WHERE ${outgoingWhere} RETURN r, e as source, other as target`;
      }

      // Build incoming match
      if (direction === "incoming" || direction === "both") {
        if (matchQuery) matchQuery += " UNION ";
        const incomingWhere = [inverseCheck, ...whereClauses].join(" AND ");
        matchQuery += `MATCH (other)-[r${relTypeFilter}]->(e:Entity {id: $entityId})
                      WHERE ${incomingWhere} RETURN r, other as source, e as target`;
      }

      if (!matchQuery) return []; // No valid direction

      const finalQuery = `${matchQuery} LIMIT $limit`;
      const result = await session.run(finalQuery, queryParams);

      return result.records
        .map((record) =>
          this._mapRelationshipToFormRelation(
            record.get("r"),
            record.get("source"),
            record.get("target")
          )
        )
        .filter((rel): rel is FormRelation => rel !== null);
    } catch (error) {
      console.error(
        `Error getting entity relations for (${entityId}): ${error}`
      );
      throw error;
    } finally {
      await session.close();
    }
  }

  async updateRelation(
    id: string,
    updates: Partial<FormRelation>
  ): Promise<FormRelation | null> {
    const session = this.connection.getSession({ defaultAccessMode: "WRITE" });
    const txc = session.beginTransaction();

    try {
      // Start transaction immediately

      const now = Date.now();
      const params: Record<string, any> = {
        id,
        updatedAt: neo4j.int(now),
      };
      const setClauses: string[] = [
        //"r.updatedAt = datetime({epochMillis: $updatedAt})",
        "r.updatedAt = $updatedAt",
      ];

      // Build SET clauses dynamically from updates
      if (updates.weight !== undefined) {
        setClauses.push("r.weight = $weight");
        // If weight could be a very large number, use neo4j.int() here:
        // params.weight = neo4j.int(updates.weight);
        // Otherwise, a standard number is usually fine:
        params.weight = updates.weight;
      }
      // ... other update clauses ...
      if (updates.properties) {
        setClauses.push("r += $propertiesUpdate");
        // Ensure properties are stringified if they are objects/arrays
        const propsToUpdate: Record<string, any> = {};
        for (const [key, value] of Object.entries(updates.properties)) {
          propsToUpdate[key] =
            typeof value === "object" && value !== null
              ? JSON.stringify(value)
              : value;
        }
        params.propertiesUpdate = propsToUpdate;
      }

      // Match the relation, ensuring it's not the inverse, then update
      const result = await txc.run(
        // Use txc.run
        `
        MATCH (source)-[r {id: $id}]->(target)
        WHERE r.inverse IS NULL OR r.inverse = false
        SET ${setClauses.join(", ")}
        RETURN r, source, target
        `,
        params
      );

      if (result.records.length === 0) {
        console.warn(`Relation instance not found or is inverse: ${id}`);
        await txc.rollback();
        return null;
      }

      // Commit the transaction
      await txc.commit();

      const record = result.records[0];
      return this._mapRelationshipToFormRelation(
        record.get("r"),
        record.get("source"),
        record.get("target")
      );
    } catch (error) {
      console.error(`Error updating relation instance (${id}): ${error}`);
      // Rollback on error if transaction is open
      if (txc && txc.isOpen()) {
        await txc.rollback();
      }
      throw error;
    } finally {
      // Always close the session
      if (session) {
        await session.close();
      }
    }
  }

  /**
   * Delete a relation instance by its unique ID.
   */
  async deleteRelation(instanceId: string): Promise<boolean> {
    const session = this.connection.getSession({ defaultAccessMode: "WRITE" });
    const txc = session.beginTransaction();

    try {
      // Delete all relationships (direct and inverse) matching the ID
      const result = await txc.run(
        `MATCH ()-[r {id: $instanceId}]-() DELETE r RETURN count(r) as deletedCount`,
        { instanceId }
      );
      const deletedCount = result.records[0]?.get("deletedCount");
      await txc.commit();
      return deletedCount > 0; // True if anything was deleted
    } catch (error) {
      console.error(`Error deleting relation instance from Neo4j: ${error}`);
      await txc.rollback();
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Find entities connected by relations, traversing the graph.
   */
  async findConnectedEntities(params: {
    startEntityId: string;
    relationType?: string; // Neo4j type
    definitionId?: string;
    direction?: "outgoing" | "incoming" | "both";
    limit?: number;
  }): Promise<
    Array<{
      /* return type */
    }>
  > {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });
    const {
      startEntityId,
      relationType,
      definitionId,
      direction = "outgoing",
      limit = 10,
    } = params;

    try {
      const relTypeFilter = relationType
        ? `:${this.getSafeRelationName(relationType)}`
        : "";
      const queryParams: Record<string, any> = {
        startId: startEntityId,
        limit: neo4j.int(limit),
      };
      const baseWhereClauses: string[] = []; // Base clauses like definitionId

      // Corrected WHERE clause for inverse check
      const inverseCheck = "r.inverse IS NULL OR r.inverse = false";

      if (definitionId) {
        baseWhereClauses.push("r.definitionId = $definitionId");
        queryParams.definitionId = definitionId;
      }

      let matchPattern = "";

      // Build outgoing match
      if (direction === "outgoing" || direction === "both") {
        const outgoingWhere = [inverseCheck, ...baseWhereClauses].join(" AND ");
        matchPattern += `MATCH (start:Entity {id: $startId})-[r${relTypeFilter}]->(entity:Entity) WHERE ${outgoingWhere} RETURN DISTINCT entity, r.id as relationId, type(r) as relationType`;
      }

      // Build incoming match
      if (direction === "incoming" || direction === "both") {
        if (matchPattern) matchPattern += " UNION ";
        const incomingWhere = [inverseCheck, ...baseWhereClauses].join(" AND ");
        matchPattern += `MATCH (entity:Entity)-[r${relTypeFilter}]->(start:Entity {id: $startId}) 
          WHERE ${incomingWhere} 
          RETURN DISTINCT entity, r.id as relationId, type(r) as relationType`;
      }

      if (!matchPattern) return []; // No valid direction

      const finalQuery = `${matchPattern} LIMIT $limit`;
      const result = await session.run(finalQuery, queryParams);

      // ... mapping logic ...
      return result.records
        .map((record) => {
          const entityNode = record.get("entity");
          if (!entityNode) return null;
          const entity = entityNode.properties;
          return {
            id: entity.id,
            type: entity.type || "Unknown",
            name: entity.name,
            relationId: record.get("relationId"),
            relationType: record.get("relationType"),
          };
        })
        .filter((item) => item !== null) as Array<{
        /* return type */
      }>;
    } catch (error) {
      console.error(`Error finding connected entities: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get relation statistics
   */
  async getRelationStats(): Promise<{
    /* return type */
  }> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });
    const txc = session.beginTransaction();

    try {
      const [
        countsResult,
        defTypeResult,
        instTypeResult,
        mostUsedResult,
        topConnectedResult,
      ] = await Promise.all([
        // Query 1: Replace exists(inst.id)
        txc.run(
          `MATCH (def:RelationDefinition) WITH count(def) as defCount
           MATCH ()-[inst]->()
           WHERE inst.id IS NOT NULL AND (inst.inverse IS NULL OR inst.inverse = false)
           RETURN defCount, count(inst) as instCount`
        ),
        // Query 2: (No exists() used here)
        txc.run(
          `MATCH (def:RelationDefinition) WHERE def.type IS NOT NULL
           RETURN def.type as type, count(def) as count ORDER BY count DESC`
        ),
        // Query 3: Replace exists(inst.id)
        txc.run(
          `MATCH ()-[inst]->()
           WHERE inst.id IS NOT NULL AND (inst.inverse IS NULL OR inst.inverse = false)
           RETURN type(inst) as type, count(inst) as count ORDER BY count DESC`
        ),
        // Query 4: Replace exists(inst.definitionId)
        txc.run(
          `MATCH ()-[inst]->()
           WHERE inst.definitionId IS NOT NULL AND (inst.inverse IS NULL OR inst.inverse = false)
           WITH inst.definitionId as defId, count(inst) as instanceCount
           ORDER BY instanceCount DESC LIMIT 10
           MATCH (def:RelationDefinition {id: defId})
           RETURN def.id as definitionId, def.name as name, instanceCount`
        ),
        // Query 5: Replace exists(rel.id)
        txc.run(
          `MATCH (e:Entity)-[rel]-()
           WHERE rel.id IS NOT NULL AND (rel.inverse IS NULL OR rel.inverse = false)
           WITH e, count(rel) as relCount
           ORDER BY relCount DESC LIMIT 10
           RETURN e.id as entityId, e.name as entityName, relCount`
        ),
      ]);

      // --- Close transaction ---
      if (txc) {
        await txc.close();
      }

      // --- Mapping Logic (remains the same) ---
      const totalDefinitions = countsResult.records[0]?.get("defCount") ?? 0;
      const totals = countsResult.records[0]?.get("instCount") ?? 0;
      // ... rest of mapping logic ...
      const byDefinitionType = Object.fromEntries(
        defTypeResult.records.map((r) => [r.get("type"), r.get("count") ?? 0])
      );
      const byType = Object.fromEntries(
        instTypeResult.records.map((r) => [r.get("type"), r.get("count") ?? 0])
      );
      const mostUsedDefinitions = mostUsedResult.records.map((r) => ({
        definitionId: r.get("definitionId"),
        name: r.get("name"),
        instanceCount: r.get("instanceCount") ?? 0,
      }));
      const topConnectedEntities = topConnectedResult.records.map((r) => ({
        entityId: r.get("entityId"),
        entityName: r.get("entityName"),
        relationCount: r.get("relCount") ?? 0,
      }));

      return {
        totalDefinitions:
          typeof totalDefinitions === "number"
            ? totalDefinitions
            : totalDefinitions.low,
        totals: typeof totals === "number" ? totals : totals.low,
        byDefinitionType,
        byType,
        mostUsedDefinitions,
        topConnectedEntities,
      };
      // --- End Mapping Logic ---
    } catch (error) {
      console.error(`Error getting relation stats from Neo4j: ${error}`);
      if (txc && txc.isOpen()) {
        try {
          await txc.close();
        } catch (closeError) {
          console.error(
            `Error closing read transaction on error: ${closeError}`
          );
        }
      }
      throw error;
    } finally {
      if (session) {
        try {
          await session.close();
        } catch (closeError) {
          console.error(
            `Error closing session in getRelationStats: ${closeError}`
          );
        }
      }
    }
  }

  /**
   * Get a Neo4j-safe relation name
   */
  private getSafeRelationName(name: string | undefined): string {
    if (!name) return "RELATED_TO"; // Default if name is missing
    // Basic sanitization: replace non-alphanumeric with underscore, uppercase
    return name.replace(/[^a-zA-Z0-9_]/g, "_").toUpperCase();
  }
}
