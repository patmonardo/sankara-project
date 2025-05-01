import { Neo4jConnection } from "../connection";
import {
  FormRelationCardinality,
  FormRelationConstraint,
  FormRelationBehavior,
  FormRelationDefinition,
} from "@/form/schema/relation";
import neo4j, { Transaction } from "neo4j-driver";

/**
 * RelationDefinitionRepository
 *
 * Manages the persistence of Relation Definitions (blueprints) in Neo4j.
 */
export class RelationDefinitionRepository {
  private connection: Neo4jConnection;

  constructor(connection: Neo4jConnection) {
    this.connection = connection;
  }

  /**
   * Save a relation definition to Neo4j
   */
  async saveRelationDefinition(
    definition: FormRelationDefinition
  ): Promise<FormRelationDefinition> {
    const session = this.connection.getSession({ defaultAccessMode: "WRITE" });
    const txc = session.beginTransaction();

    try {
      if (!definition.id) {
        throw new Error("Relation definition must have an ID");
      }

      const now = Date.now(); // Use numeric timestamp
      const props = {
        id: definition.id,
        name: definition.name,
        description: definition.description || null,
        type:
          definition.type ||
          definition.name?.toUpperCase().replace(/\s+/g, "_") ||
          "RELATION",
        cardinality: definition.cardinality || "many-to-many",
        // Pass numeric timestamp or null
        createdAt: definition.createdAt || null, // Use the number or null
        updatedAt: now, // Always use current time as number
        traversalCost: definition.traversalCost ?? null,
        inverseType: definition.inverse?.type || null,
        inverseName: definition.inverse?.name || null,
      };

      // Create or update the relation definition node
      await txc.run(
        `
        MERGE (r:RelationDefinition {id: $id})
        SET r.name = $name,
            r.description = $description,
            r.type = $type,
            r.cardinality = $cardinality,
            r.traversalCost = $traversalCost,
            r.inverseType = $inverseType,
            r.inverseName = $inverseName
        RETURN r
      `,
        props
      );

      // Handle constraints
      await this.syncConstraints(txc, definition.id, definition.constraints);

      // Handle behaviors
      await this.syncBehaviors(txc, definition.id, definition.behaviors);

      // Handle tags
      await this.syncTags(txc, definition.id, definition.tags);

      // Handle validation rules if they exist on the definition
      // await this.syncValidationRules(txc, definition.id, definition.validation);

      await txc.commit();

      // Refetch to confirm save and get potentially updated dates/related nodes
      const savedDef = await this.getRelationDefinitionById(definition.id);
      if (!savedDef) {
        // This case should ideally not happen after a successful commit, but good for robustness
        throw new Error(
          `Failed to refetch relation definition ${definition.id} after save.`
        );
      }
      return savedDef;
    } catch (error) {
      console.error(`Error saving relation definition to Neo4j: ${error}`);
      // Ensure rollback happens on error
      if (txc && txc.isOpen()) {
        try {
          await txc.rollback();
        } catch (rollbackError) {
          console.error(`Error rolling back transaction: ${rollbackError}`);
        }
      }
      throw error; // Re-throw the original error
    } finally {
      // Ensure session is closed even if commit/rollback fails
      if (session) {
        try {
          await session.close();
        } catch (closeError) {
          console.error(`Error closing session: ${closeError}`);
        }
      }
    }
  }

  private async syncTags(
    txc: Transaction,
    definitionId: string,
    tags: string[] | undefined
  ) {
    // Remove existing tag relationships
    await txc.run(
      `MATCH (r:RelationDefinition {id: $id})-[rel:HAS_TAG]->() DELETE rel`,
      { id: definitionId }
    );
    if (tags && tags.length > 0) {
      // Ensure tags are unique before processing
      const uniqueTags = [...new Set(tags)];
      await txc.run(
        `
        UNWIND $tags as tagName
        MATCH (r:RelationDefinition {id: $id})
        MERGE (t:Tag {name: tagName}) // Merge tags to avoid duplicates
        MERGE (r)-[:HAS_TAG]->(t) // Merge relationship
      `,
        { id: definitionId, tags: uniqueTags }
      );
    }
  }

  // ... rest of the class methods (getRelationDefinitionById, findRelationDefinitions, etc.)
  // ... syncConstraints, syncTags, syncBehaviors methods
  // --- Helper methods for syncing related nodes ---

  private async syncConstraints(
    txc: Transaction,
    definitionId: string,
    constraints: FormRelationConstraint[] | undefined
  ) {
    // Remove existing constraints nodes and relationships
    await txc.run(
      `MATCH (r:RelationDefinition {id: $id})-[rel:HAS_CONSTRAINT]->(c:FormRelationConstraint) DETACH DELETE c`,
      { id: definitionId }
    );
    if (constraints && constraints.length > 0) {
      await txc.run(
        `
        UNWIND $constraints as constraintData
        MATCH (r:RelationDefinition {id: $id})
        CREATE (c:FormRelationConstraint {
          id: coalesce(constraintData.id, $id + ':constraint:' + constraintData.order), // Use provided ID or generate one
          name: constraintData.name,
          type: constraintData.type,
          description: constraintData.description,
          property: constraintData.property,
          value: constraintData.value, // Stored stringified
          message: constraintData.message
        })
        MERGE (r)-[rel:HAS_CONSTRAINT {order: constraintData.order}]->(c)
      `,
        {
          id: definitionId,
          constraints: constraints.map((c, index) => ({
            ...c,
            id: c.id || null, // Pass ID if available
            value: c.value !== undefined ? JSON.stringify(c.value) : null,
            message: c.message || null,
            order: index, // Use index for ordering relationship
          })),
        }
      );
    }
  }

  private async syncBehaviors(
    txc: Transaction,
    definitionId: string,
    behaviors: FormRelationBehavior[] | undefined
  ) {
    // Remove existing behavior nodes and relationships
    await txc.run(
      `MATCH (r:RelationDefinition {id: $id})-[rel:HAS_BEHAVIOR]->(b:FormRelationBehavior) DETACH DELETE b`,
      { id: definitionId }
    );
    if (behaviors && behaviors.length > 0) {
      await txc.run(
        `
        UNWIND $behaviors as behaviorData
        MATCH (r:RelationDefinition {id: $id})
        CREATE (b:FormRelationBehavior {
          id: coalesce(behaviorData.id, $id + ':behavior:' + behaviorData.order), // Use provided ID or generate one
          name: behaviorData.name,
          description: behaviorData.description,
          type: behaviorData.type,
          event: behaviorData.event,
          handler: behaviorData.handler, // Stored string
          parameters: behaviorData.parameters, // Stored stringified
          active: behaviorData.active
        })
        MERGE (r)-[rel:HAS_BEHAVIOR {order: behaviorData.order}]->(b)
      `,
        {
          id: definitionId,
          behaviors: behaviors.map((b, index) => ({
            ...b,
            id: b.id || null, // Pass ID if available
            handler:
              typeof b.handler === "function"
                ? b.handler.toString() // Convert function to string if needed
                : b.handler,
            parameters:
              b.parameters !== undefined ? JSON.stringify(b.parameters) : null,
            active: b.active ?? true, // Default active to true
            order: index, // Use index for ordering relationship
          })),
        }
      );
    }
  }

  /**
   * Get a relation definition by ID
   */
  async getRelationDefinitionById(
    id: string
  ): Promise<FormRelationDefinition | null> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      // Fetch definition and all related nodes in one go
      const result = await session.run(
        `
        MATCH (r:RelationDefinition {id: $id})
        
        // Collect Tags
        OPTIONAL MATCH (r)-[:HAS_TAG]->(t:Tag)
        WITH r, constraintData, collect(DISTINCT t.name) as tags // Collect distinct tag names

        // Collect Constraints, ordered by relationship property
        OPTIONAL MATCH (r)-[rel_con:HAS_CONSTRAINT]->(c:FormRelationConstraint)
        WITH r, c, rel_con.order as constraintOrder
        ORDER BY constraintOrder // Order constraints BEFORE collecting
        WITH r, collect({node: c, order: constraintOrder}) as constraintData

        // Collect Behaviors, ordered by relationship property
        OPTIONAL MATCH (r)-[rel_beh:HAS_BEHAVIOR]->(b:FormRelationBehavior)
        WITH r, constraintData, tags, b, rel_beh.order as behaviorOrder
        ORDER BY behaviorOrder // Order behaviors BEFORE collecting
        WITH r, constraintData, tags, collect({node: b, order: behaviorOrder}) as behaviorData

        // Add OPTIONAL MATCH for validation rules if stored separately
        // OPTIONAL MATCH (r)-[...]-(v:ValidationRule) ... etc ...

        RETURN r,
               // Filter out potential null placeholders from OPTIONAL MATCH if no constraints/behaviors found
               [item IN constraintData WHERE item.node IS NOT NULL] as constraintData,
               tags,
               [item IN behaviorData WHERE item.node IS NOT NULL] as behaviorData
      `,
        { id }
      );

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      const definitionNode = record.get("r").properties;
      const constraintData = record.get("constraintData") || [];
      const tags = record.get("tags") || [];
      const behaviorData = record.get("behaviorData") || [];

      // Parse constraints
      const constraints: FormRelationConstraint[] = constraintData
        .filter((data: any) => data.node) // Filter out potential nulls if OPTIONAL MATCH yielded nothing
        .map((data: any) => {
          const nodeProps = data.node.properties;
          let value: any;
          try {
            // Check if value is a string before trying to parse JSON
            value =
              typeof nodeProps.value === "string" && nodeProps.value !== null
                ? JSON.parse(nodeProps.value)
                : nodeProps.value; // Keep original value if not string or null
          } catch (e) {
            value = nodeProps.value; // Fallback to raw value on parse error
          }
          return {
            id: nodeProps.id,
            name: nodeProps.name,
            type: nodeProps.type,
            description: nodeProps.description,
            property: nodeProps.property,
            value: value,
            message: nodeProps.message,
          };
        });

      // Parse behaviors
      const behaviors: FormRelationBehavior[] = behaviorData
        .filter((data: any) => data.node)
        .map((data: any) => {
          const nodeProps = data.node.properties;
          let parameters: Record<string, any> | undefined;
          try {
            // Check if parameters is a string before trying to parse JSON
            parameters =
              typeof nodeProps.parameters === "string" &&
              nodeProps.parameters !== null
                ? JSON.parse(nodeProps.parameters)
                : undefined;
          } catch (e) {
            parameters = undefined; // Set to undefined on parse error
          }
          return {
            id: nodeProps.id,
            name: nodeProps.name,
            description: nodeProps.description,
            type: nodeProps.type,
            event: nodeProps.event,
            handler: nodeProps.handler, // Keep as string
            parameters: parameters,
            active: nodeProps.active,
          };
        });

      // Build the complete FormRelationDefinition object
      const definition: FormRelationDefinition = {
        id: definitionNode.id,
        name: definitionNode.name,
        description: definitionNode.description,
        type: definitionNode.type,
        cardinality: definitionNode.cardinality as FormRelationCardinality,
        traversalCost: definitionNode.traversalCost,
        inverse:
          definitionNode.inverseType || definitionNode.inverseName
            ? {
                type: definitionNode.inverseType,
                name: definitionNode.inverseName,
              }
            : undefined,
        constraints: constraints.length > 0 ? constraints : undefined,
        tags: tags.length > 0 ? tags : undefined,
        behaviors: behaviors.length > 0 ? behaviors : undefined,
        validation: undefined, // Add logic if validation rules are stored separately
        // Convert Neo4j DateTime object to numeric timestamp
        createdAt: definitionNode.createdAt
          ? new Date(definitionNode.createdAt.toString()).getTime()
          : undefined,
        updatedAt: definitionNode.updatedAt
          ? new Date(definitionNode.updatedAt.toString()).getTime()
          : undefined,
        createdBy: definitionNode.createdBy,
        // contextId: definitionNode.contextId, // Add if contextId is stored on definition
      };

      return definition;
    } catch (error) {
      console.error(`Error getting relation definition from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Find relation definitions by criteria
   */
  async findRelationDefinitions(
    criteria: {
      type?: string;
      name?: string;
      tag?: string;
      limit?: number;
      cardinality?: FormRelationCardinality;
    } = {}
  ): Promise<FormRelationDefinition[]> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      let query = `MATCH (r:RelationDefinition)`;
      const whereConditions: string[] = [];
      const params: Record<string, any> = {};

      if (criteria.type) {
        whereConditions.push(`r.type = $type`);
        params.type = criteria.type;
      }
      if (criteria.name) {
        // Use case-insensitive CONTAINS for name search
        whereConditions.push(`toLower(r.name) CONTAINS toLower($name)`);
        params.name = criteria.name;
      }
      if (criteria.cardinality) {
        whereConditions.push(`r.cardinality = $cardinality`);
        params.cardinality = criteria.cardinality;
      }
      if (criteria.tag) {
        // Use relationship existence check for tags
        query += ` MATCH (r)-[:HAS_TAG]->(:Tag {name: $tag})`;
        params.tag = criteria.tag;
      }

      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(" AND ")}`;
      }

      // Return only the ID to avoid fetching full data for potentially many nodes
      query += ` RETURN r.id as id`;
      query += ` ORDER BY r.name`; // Add ordering
      query += ` LIMIT $limit`;
      params.limit = neo4j.int(criteria.limit ?? 100); // Default limit

      const result = await session.run(query, params);

      // Fetch full definition objects using the IDs found
      // Consider performance implications if many definitions are returned
      const definitions: FormRelationDefinition[] = [];
      for (const record of result.records) {
        const definitionId = record.get("id");
        if (definitionId) {
          const definition = await this.getRelationDefinitionById(definitionId);
          if (definition) {
            definitions.push(definition);
          }
        }
      }
      return definitions;
    } catch (error) {
      console.error(`Error finding relation definitions in Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Update specific fields of a relation definition.
   * Note: This replaces arrays like constraints/tags/behaviors entirely.
   * For partial updates to arrays, separate methods would be needed.
   */
  async updateRelationDefinition(
    definitionId: string,
    updates: Partial<Omit<FormRelationDefinition, "id" | "createdAt">>
  ): Promise<FormRelationDefinition | null> {
    // Fetch current definition first to ensure it exists
    const currentDefinition = await this.getRelationDefinitionById(
      definitionId
    );
    if (!currentDefinition) {
      console.warn(`Relation definition not found for update: ${definitionId}`);
      return null;
    }

    // Merge updates - note this replaces arrays like constraints/tags/behaviors entirely
    const updatedDefinitionData: FormRelationDefinition = {
      ...currentDefinition, // Start with existing data
      ...updates, // Apply updates
      id: definitionId, // Ensure ID remains
      createdAt: currentDefinition.createdAt, // Keep original createdAt
      updatedAt: Date.now(), // Set new updatedAt timestamp
    };

    // Use the save method which handles MERGE and related node syncing
    // This ensures consistency in how definitions are saved/updated
    return this.saveRelationDefinition(updatedDefinitionData);
  }

  /**
   * Delete a relation definition by ID
   */
  async deleteRelationDefinition(
    definitionId: string,
    force: boolean = false
  ): Promise<boolean> {
    const session = this.connection.getSession({ defaultAccessMode: "WRITE" });
    const txc = session.beginTransaction();

    try {
      // Check if the definition exists first
      const defCheck = await txc.run(
        `MATCH (r:RelationDefinition {id: $id}) RETURN count(r) as count`,
        { id: definitionId }
      );
      if (defCheck.records[0]?.get("count") === 0) {
        console.warn(
          `Relation definition not found for deletion: ${definitionId}`
        );
        // No need to rollback if nothing was found/done
        return false;
      }

      // Check for existing instances if force is false
      if (!force) {
        // Check for instances using the definitionId property on the relationship
        const instanceCheck = await txc.run(
          `MATCH ()-[r]-() WHERE r.definitionId = $definitionId RETURN count(r) as instanceCount LIMIT 1`, // LIMIT 1 for efficiency
          { definitionId }
        );
        const instanceCount = instanceCheck.records[0]?.get("instanceCount");
        if (instanceCount > 0) {
          await txc.rollback(); // Rollback before throwing
          throw new Error(
            `Cannot delete relation definition: ${instanceCount} instance(s) exist. Use force=true.`
          );
        }
      } else {
        // Force delete: Delete all instances associated with this definition
        // This assumes instances store definitionId as a property
        await txc.run(
          `MATCH ()-[r]-() WHERE r.definitionId = $definitionId DELETE r`,
          { definitionId }
        );
      }

      // Delete the definition node and its direct relationships (to constraints, tags, behaviors)
      // DETACH DELETE handles removing the node and its relationships cleanly.
      await txc.run(`MATCH (r:RelationDefinition {id: $id}) DETACH DELETE r`, {
        id: definitionId,
      });

      await txc.commit();
      return true; // Successfully deleted
    } catch (error) {
      console.error(`Error deleting relation definition from Neo4j: ${error}`);
      // Ensure rollback happens on error
      if (txc && txc.isOpen()) {
        try {
          await txc.rollback();
        } catch (rollbackError) {
          console.error(`Error rolling back transaction: ${rollbackError}`);
        }
      }
      // Re-throw the original error or a more specific one if needed
      throw error;
    } finally {
      // Ensure session is closed
      if (session) {
        try {
          await session.close();
        } catch (closeError) {
          console.error(`Error closing session: ${closeError}`);
        }
      }
    }
  }
} // End of class RelationDefinitionRepository
