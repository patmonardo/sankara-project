import { Neo4jConnection } from "../connection";
import {
  FormRelation,
  FormRelationType,
  FormRelationCardinality,
  FormRelationConstraint,
  FormRelationBehavior,
  FormRelationDefinition,
} from "@/form/schema/relation";
import { v4 as uuidv4 } from "uuid";

/**
 * RelationRepository
 */
export class RelationRepository {
  private connection: Neo4jConnection;

  constructor(connection: Neo4jConnection) {
    this.connection = connection;
  }

  /**
   * Save a relation definition to Neo4j
   *
   * Creates or updates a relation definition (blueprint) and its properties.
   * Renamed from saveRelation.
   */
  async saveRelationDefinition(
    definition: FormRelationDefinition
  ): Promise<FormRelationDefinition> {
    // Return the definition
    const session = this.connection.getSession();

    try {
      const txc = session.beginTransaction();

      // Create or update the relation definition node
      // Use fields from the 'definition' parameter
      await txc.run(
        `
        MERGE (r:RelationDefinition {id: $id})
        SET r.name = $name,
            r.description = $description,
            // r.type = $type, // 'type' might be implicitly the definition ID or name, review if needed
            r.cardinality = $cardinality,
            r.traversalCost = $traversalCost, // Add traversalCost if in schema
            r.updatedAt = timestamp() // Use Neo4j timestamp() for update

        // Set createdAt only if it doesn't exist or is explicitly provided
        // Use number timestamp (milliseconds since epoch)
        ON CREATE SET r.createdAt = $createdAt
        ON MATCH SET r.createdAt = COALESCE(r.createdAt, $createdAt)

        FOREACH (__ IN CASE WHEN $createdBy IS NOT NULL THEN [1] ELSE [] END |
          SET r.createdBy = $createdBy)

        // Handle inverse object from definition schema
        FOREACH (__ IN CASE WHEN $inverseType IS NOT NULL THEN [1] ELSE [] END |
          SET r.inverseType = $inverseType)
        FOREACH (__ IN CASE WHEN $inverseName IS NOT NULL THEN [1] ELSE [] END |
          SET r.inverseName = $inverseName)

        // Remove properties that might have been incorrectly set before
        REMOVE r.properties, r.meta, r.sourceType, r.targetType

        RETURN r
      `,
        {
          id: definition.id,
          name: definition.name,
          description: definition.description || "",
          // type: definition.type, // Review if 'type' field is needed on the definition node itself
          cardinality: definition.cardinality || "many-to-many",
          traversalCost: definition.traversalCost || 1,
          // Use number timestamp
          createdAt: definition.createdAt || Date.now(),
          createdBy: definition.createdBy || null,
          // Extract from inverse object
          inverseType: definition.inverse?.type || null,
          inverseName: definition.inverse?.name || null,
        }
      );

      // // Handle source and target entity types (Assuming they should be on the definition)
      // // Check if your FormRelationDefinition schema includes source/target types
      // // If not, this part might need to be removed or the schema updated
      // if (definition.sourceType && definition.targetType) { // Example check
      //   await txc.run(
      //     `
      //     MATCH (r:RelationDefinition {id: $id})
      //     SET r.sourceType = $sourceType,
      //         r.targetType = $targetType
      //     RETURN r
      //   `,
      //     {
      //       id: definition.id,
      //       sourceType: definition.sourceType, // Replace with actual field if exists
      //       targetType: definition.targetType, // Replace with actual field if exists
      //     }
      //   );
      // }

      // Handle constraints (Assuming FormRelationConstraintSchema is correct)
      // This part seems logically correct for definitions
      if (definition.constraints && definition.constraints.length > 0) {
        // First delete existing constraints relationships
        await txc.run(
          `
          MATCH (r:RelationDefinition {id: $id})-[rel:HAS_CONSTRAINT]->(c:FormRelationConstraint)
          DETACH DELETE c // Delete the constraint node itself
          RETURN count(c)
        `,
          { id: definition.id }
        );

        // Add new constraints
        for (let i = 0; i < definition.constraints.length; i++) {
          const constraint = definition.constraints[i];
          const constraintId = `${definition.id}_constraint_${i}_${uuidv4()}`; // Ensure unique ID

          await txc.run(
            `
            MATCH (r:RelationDefinition {id: $id})

            CREATE (c:FormRelationConstraint {
              id: $constraintId,
              // Assuming these fields exist on FormRelationConstraintSchema
              property: $property,
              value: $value, // Need to handle 'any' type - maybe stringify?
              message: $message
              // custom function cannot be stored directly
            })

            MERGE (r)-[:HAS_CONSTRAINT {order: $order}]->(c)
            RETURN c
          `,
            {
              id: definition.id,
              constraintId: constraintId,
              property: constraint.property || null,
              value:
                constraint.value !== undefined
                  ? JSON.stringify(constraint.value)
                  : null, // Stringify 'any' value
              message: constraint.message || "",
              order: i,
            }
          );
        }
      } else {
        // Ensure constraints are removed if the array is empty/null
        await txc.run(
          `
          MATCH (r:RelationDefinition {id: $id})-[rel:HAS_CONSTRAINT]->(c:FormRelationConstraint)
          DETACH DELETE c
          RETURN count(c)
        `,
          { id: definition.id }
        );
      }

      // Handle tags (This part seems logically correct for definitions)
      // First remove existing tag relationships
      await txc.run(
        `
        MATCH (r:RelationDefinition {id: $id})-[rel:HAS_TAG]->(t:Tag)
        DELETE rel
        RETURN count(rel)
      `,
        { id: definition.id }
      );
      // Add new tags if they exist
      if (definition.tags && definition.tags.length > 0) {
        for (const tag of definition.tags) {
          await txc.run(
            `
            MATCH (r:RelationDefinition {id: $id})
            MERGE (t:Tag {name: $tagName}) // Use MERGE for tags to avoid duplicates
            MERGE (r)-[:HAS_TAG]->(t) // Use MERGE for relationship
            RETURN t
          `,
            {
              id: definition.id,
              tagName: tag,
            }
          );
        }
      }

      // Handle behaviors (Store as separate nodes, similar to constraints)
      // This part needs implementation if behaviors should be stored
      if (definition.behaviors && definition.behaviors.length > 0) {
        // First delete existing behaviors relationships
        await txc.run(
          `
          MATCH (r:RelationDefinition {id: $id})-[rel:HAS_BEHAVIOR]->(b:FormRelationBehavior)
          DETACH DELETE b
          RETURN count(b)
        `,
          { id: definition.id }
        );
        // Add new behaviors
        for (let i = 0; i < definition.behaviors.length; i++) {
          const behavior = definition.behaviors[i];
          const behaviorId = `${definition.id}_behavior_${i}_${uuidv4()}`;
          await txc.run(
            `
             MATCH (r:RelationDefinition {id: $id})
             CREATE (b:FormRelationBehavior {
               id: $behaviorId,
               name: $name,
               event: $event,
               handler: $handler, // Store function as string
               parameters: $parameters, // Store parameters as JSON string
               active: $active
             })
             MERGE (r)-[:HAS_BEHAVIOR {order: $order}]->(b)
             RETURN b
           `,
            {
              id: definition.id,
              behaviorId: behaviorId,
              name: behavior.name,
              event: behavior.event,
              handler:
                typeof behavior.handler === "function"
                  ? behavior.handler.toString()
                  : behavior.handler,
              parameters: behavior.parameters
                ? JSON.stringify(behavior.parameters)
                : null,
              active: behavior.active,
              order: i,
            }
          );
        }
      } else {
        // Ensure behaviors are removed if the array is empty/null
        await txc.run(
          `
          MATCH (r:RelationDefinition {id: $id})-[rel:HAS_BEHAVIOR]->(b:FormRelationBehavior)
          DETACH DELETE b
          RETURN count(b)
        `,
          { id: definition.id }
        );
      }

      // // Handle metadata - Decide if meta belongs on definition
      // if (definition.meta && Object.keys(definition.meta).length > 0) {
      //   await txc.run(
      //     `
      //     MATCH (r:RelationDefinition {id: $id})
      //     SET r.meta = $meta
      //     RETURN r
      //   `,
      //     {
      //       id: definition.id,
      //       meta: JSON.stringify(definition.meta),
      //     }
      //   );
      // } else {
      //    // Remove meta if not provided
      //    await txc.run(
      //     `
      //     MATCH (r:RelationDefinition {id: $id})
      //     REMOVE r.meta
      //     RETURN r
      //   `, { id: definition.id });
      // }

      await txc.commit();

      // Return the input definition object as confirmation
      return definition;
    } catch (error) {
      console.error(`Error saving relation definition to Neo4j: ${error}`);
      // Rollback transaction on error
      // await txc.rollback(); // Neo4j driver might handle this implicitly on session close with error
      throw error; // Re-throw the error
    } finally {
      // Ensure session is always closed
      await session.close();
    }
  }

  /**
   * Save a relation instance to Neo4j
   *
   * Creates or updates an actual relationship between two entities based on a FormRelation object.
   * This is the correct method for handling instances.
   */
  async saveRelationInstance(relation: FormRelation): Promise<FormRelation> {
    const session = this.connection.getSession();
    const txc = session.beginTransaction();

    try {
      // Validate required fields
      if (
        !relation.id ||
        !relation.definitionId ||
        !relation.source ||
        !relation.target ||
        !relation.type
      ) {
        throw new Error(
          "FormRelation object is missing required fields (id, definitionId, source, target, type)"
        );
      }

      // Ensure source/target are strings if they were objects in the schema
      const sourceId = relation.source;
      const targetId = relation.target;

      // Prepare properties for the Neo4j relationship
      // Include essential IDs and timestamps, plus custom properties
      const neo4jProperties = {
        ...relation.properties, // Start with custom properties
        id: relation.id, // Instance ID
        definitionId: relation.definitionId, // Link to the definition
        createdAt: relation.createdAt || Date.now(), // Ensure createdAt exists
        updatedAt: Date.now(), // Always update updatedAt timestamp
        // Add other relevant fields from FormRelation if needed as properties
        contextId: relation.contextId || null,
        createdBy: relation.createdBy || null,
        weight: relation.weight || null,
        active: relation.active !== false, // Default to true
      };

      // Use a sanitized version of the relation type for Neo4j relationship type
      const safeRelationType = this.getSafeRelationName(relation.type);

      // MERGE the relationship. Use ON CREATE/ON MATCH for timestamps.
      // We match based on the instance ID stored as a property.
      const result = await txc.run(
        `
        MATCH (s:Entity {id: $sourceId})
        MATCH (t:Entity {id: $targetId})
        MERGE (s)-[r:${safeRelationType} {id: $instanceId}]->(t)
        SET r = $props // Overwrite all properties on MERGE
        RETURN r
      `,
        {
          sourceId: sourceId,
          targetId: targetId,
          instanceId: relation.id,
          props: neo4jProperties,
        }
      );

      if (result.records.length === 0) {
        // This should ideally not happen with MERGE if entities exist, but check just in case
        throw new Error(
          `Failed to create or update relation instance ${relation.id}. Source or target entity might be missing.`
        );
      }

      // Handle inverse relationship if inverseName is provided
      if (relation.inverseName) {
        const safeInverseType = this.getSafeRelationName(relation.inverseName);
        // Create or update the inverse relationship, marking it as inverse
        // Store minimal properties on the inverse side
        await txc.run(
          `
          MATCH (s:Entity {id: $sourceId})
          MATCH (t:Entity {id: $targetId})
          MERGE (t)-[inv_r:${safeInverseType} {id: $instanceId}]->(s)
          SET inv_r.definitionId = $definitionId,
              inv_r.inverse = true, // Mark this as the inverse side
              inv_r.createdAt = $createdAt, // Keep timestamps consistent
              inv_r.updatedAt = $updatedAt
          RETURN inv_r
          `,
          {
            sourceId: sourceId,
            targetId: targetId,
            instanceId: relation.id, // Use the same ID for both directions
            definitionId: relation.definitionId,
            createdAt: neo4jProperties.createdAt,
            updatedAt: neo4jProperties.updatedAt,
          }
        );
      } else {
        // If inverseName is NOT provided, ensure no inverse relationship exists with this ID
        await txc.run(
          `
           MATCH ()-[inv_r {id: $instanceId}]->()
           WHERE inv_r.inverse = true
           DELETE inv_r
           `,
          { instanceId: relation.id }
        );
      }

      await txc.commit();

      // Return the input relation object as confirmation
      // Update the updatedAt timestamp in the returned object
      return { ...relation, updatedAt: neo4jProperties.updatedAt };
    } catch (error) {
      console.error(`Error saving relation instance to Neo4j: ${error}`);
      await txc.rollback(); // Rollback on error
      throw error; // Re-throw the error
    } finally {
      // Ensure session is always closed
      await session.close();
    }
  }

  /**
   * Get a relation definition by ID
   * Renamed from getRelationById
   */
  async getRelationDefinitionById(
    id: string
  ): Promise<FormRelationDefinition | null> {
    // Updated return type
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      // Fetch the main definition node
      const result = await session.run(
        `
        MATCH (r:RelationDefinition {id: $id})
        RETURN r
      `,
        { id }
      );

      if (result.records.length === 0) {
        return null;
      }

      const definitionNode = result.records[0].get("r").properties;

      // Fetch associated constraints
      const constraintsResult = await session.run(
        `
        MATCH (r:RelationDefinition {id: $id})-[rel:HAS_CONSTRAINT]->(c:FormRelationConstraint)
        WITH c, rel.order as constraintOrder
        ORDER BY constraintOrder
        RETURN c.id as id, c.property as property, c.value as value, c.message as message
      `,
        { id }
      );

      const constraints: FormRelationConstraint[] =
        constraintsResult.records.map((record) => {
          let value: any;
          try {
            // Attempt to parse the stored JSON string value
            value =
              record.get("value") !== null
                ? JSON.parse(record.get("value"))
                : undefined;
          } catch (e) {
            console.warn(
              `Could not parse constraint value for ${record.get(
                "id"
              )}: ${record.get("value")}`
            );
            value = record.get("value"); // Fallback to raw string if parsing fails
          }
          return {
            // Assuming FormRelationConstraintSchema has these fields
            // id: record.get("id"), // ID might not be part of the schema definition itself
            property: record.get("property"),
            value: value,
            message: record.get("message"),
            // custom function cannot be retrieved
          };
        });

      // Fetch associated tags
      const tagsResult = await session.run(
        `
        MATCH (r:RelationDefinition {id: $id})-[:HAS_TAG]->(t:Tag)
        RETURN t.name as tag
      `,
        { id }
      );
      const tags = tagsResult.records.map((record) => record.get("tag"));

      // Fetch associated behaviors
      const behaviorsResult = await session.run(
        `
        MATCH (r:RelationDefinition {id: $id})-[rel:HAS_BEHAVIOR]->(b:FormRelationBehavior)
        WITH b, rel.order as behaviorOrder
        ORDER BY behaviorOrder
        RETURN b.id as id, b.name as name, b.event as event, b.handler as handler, b.parameters as parameters, b.active as active
      `,
        { id }
      );

      const behaviors: FormRelationBehavior[] = behaviorsResult.records.map(
        (record) => {
          let parameters: Record<string, any> | undefined;
          try {
            parameters = record.get("parameters")
              ? JSON.parse(record.get("parameters"))
              : undefined;
          } catch (e) {
            console.warn(
              `Could not parse behavior parameters for ${record.get(
                "id"
              )}: ${record.get("parameters")}`
            );
            parameters = undefined;
          }
          // Note: handler function is stored as string, cannot easily convert back to function here
          return {
            name: record.get("name"),
            event: record.get("event"),
            handler: record.get("handler"), // Keep as string
            parameters: parameters,
            active: record.get("active"),
          };
        }
      );

      // Build the complete FormRelationDefinition object
      const definition: FormRelationDefinition = {
        id: definitionNode.id,
        name: definitionNode.name,
        description: definitionNode.description,
        // type: definitionNode.type, // Add if type is stored on definition node
        cardinality: definitionNode.cardinality as FormRelationCardinality,
        traversalCost: definitionNode.traversalCost,
        inverse:
          definitionNode.inverseType || definitionNode.inverseName
            ? {
                // Reconstruct inverse object
                type: definitionNode.inverseType,
                name: definitionNode.inverseName,
              }
            : undefined,
        constraints: constraints.length > 0 ? constraints : undefined,
        tags: tags.length > 0 ? tags : undefined,
        behaviors: behaviors.length > 0 ? behaviors : undefined,
        validation: undefined, // Add logic if validation rules are stored separately
        createdAt: definitionNode.createdAt
          ? Number(definitionNode.createdAt)
          : Date.now(),
        updatedAt: definitionNode.updatedAt
          ? Number(definitionNode.updatedAt)
          : Date.now(),
        createdBy: definitionNode.createdBy,
        // contextId: definitionNode.contextId, // Add if contextId is stored on definition
      };

      return definition;
    } catch (error) {
      console.error(`Error getting relation definition from Neo4j: ${error}`);
      throw error; // Re-throw the error
    } finally {
      await session.close();
    }
  }

  /**
   * Get a relation instance by its unique ID
   */
  async getRelationInstanceById(
    instanceId: string
  ): Promise<FormRelation | null> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      // Fetch the relationship instance by its 'id' property
      // Also fetch source and target nodes to get their IDs
      const result = await session.run(
        `
        MATCH (s:Entity)-[r {id: $instanceId}]->(t:Entity)
        WHERE NOT r.inverse = true // Exclude inverse relationships by default
        RETURN r, s.id as sourceId, t.id as targetId, type(r) as relationNeoType
      `,
        { instanceId }
      );

      if (result.records.length === 0) {
        return null; // Instance not found or it was an inverse relationship
      }

      const record = result.records[0];
      const relationProps = record.get("r").properties;
      const sourceId = record.get("sourceId");
      const targetId = record.get("targetId");
      const relationNeoType = record.get("relationNeoType"); // Actual Neo4j type

      // Extract custom properties, excluding the ones managed explicitly
      const customProperties: Record<string, any> = {};
      const managedProps = new Set([
        "id",
        "definitionId",
        "createdAt",
        "updatedAt",
        "contextId",
        "createdBy",
        "weight",
        "active",
        "inverse",
      ]);
      for (const key in relationProps) {
        if (
          Object.prototype.hasOwnProperty.call(relationProps, key) &&
          !managedProps.has(key)
        ) {
          customProperties[key] = relationProps[key];
        }
      }

      // Fetch the definition to get the inverseName if needed (optional, could be stored on instance)
      // This adds an extra query but ensures consistency. Alternatively, store inverseName on the instance.
      let inverseName: string | undefined = undefined;
      if (relationProps.definitionId) {
        const def = await this.getRelationDefinitionById(
          relationProps.definitionId
        );
        inverseName = def?.inverse?.name;
      }

      // Build the FormRelation object
      const relationInstance: FormRelation = {
        id: relationProps.id,
        name: relationProps.name, // Use stored name if available
        // name: relationProps.name, // Name is usually on definition, not instance relationship
        // description: relationProps.description, // Usually on definition
        definitionId: relationProps.definitionId,
        type: relationProps.type || relationNeoType, // Use stored type if available, else Neo4j type

        source: sourceId, // Use fetched source ID
        target: targetId, // Use fetched target ID

        properties:
          Object.keys(customProperties).length > 0
            ? customProperties
            : undefined,

        // mapping: undefined, // Add if mapping info is stored
        directional: true, // Assuming default
        // direction: 'outgoing', // Can be inferred but might not be needed on the object itself
        inverseName: inverseName, // Get from definition or store on instance
        weight: relationProps.weight,
        active: relationProps.active,

        createdAt: relationProps.createdAt
          ? Number(relationProps.createdAt)
          : Date.now(), // Ensure number
        updatedAt: relationProps.updatedAt
          ? Number(relationProps.updatedAt)
          : Date.now(), // Ensure number
        createdBy: relationProps.createdBy,
        contextId: relationProps.contextId,
      };

      // Attempt to find a name from the definition if not stored on instance
      if (!relationInstance.name && relationInstance.definitionId) {
        const def = await this.getRelationDefinitionById(
          relationInstance.definitionId
        );
        relationInstance.name = def?.name || relationInstance.type; // Fallback to type
      } else if (!relationInstance.name) {
        relationInstance.name = relationInstance.type; // Fallback if no definition found
      }

      return relationInstance;
    } catch (error) {
      console.error(`Error getting relation instance from Neo4j: ${error}`);
      throw error; // Re-throw the error
    } finally {
      await session.close();
    }
  }

  /**
   * Find relation definitions by criteria
   */
  async findRelationDefinitions(
    criteria: {
      type?: string; // Assuming type is stored on definition node
      name?: string;
      // sourceType?: string; // Add if sourceType/targetType are stored on definition
      // targetType?: string;
      tag?: string;
      cardinality?: FormRelationCardinality;
    } = {}
  ): Promise<FormRelationDefinition[]> {
    // Updated return type
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      let query = `
        MATCH (r:RelationDefinition)
        WHERE 1=1
      `;
      const params: Record<string, any> = {};

      // Apply criteria based on RelationDefinition properties
      if (criteria.type) {
        // Assuming 'type' is a property on RelationDefinition node, adjust if needed
        query += ` AND r.type = $type`;
        params.type = criteria.type;
      }
      if (criteria.name) {
        query += ` AND r.name CONTAINS $name`; // Use CONTAINS for partial matching? Or = for exact?
        params.name = criteria.name;
      }
      // Add sourceType/targetType if they are stored on the definition node
      // if (criteria.sourceType) { ... }
      // if (criteria.targetType) { ... }
      if (criteria.cardinality) {
        query += ` AND r.cardinality = $cardinality`;
        params.cardinality = criteria.cardinality;
      }
      if (criteria.tag) {
        // Match definitions that have the specified tag
        query += ` AND EXISTS { (r)-[:HAS_TAG]->(:Tag {name: $tag}) }`;
        params.tag = criteria.tag;
      }

      // Return only the ID, we'll fetch the full object later for consistency
      // Alternatively, return 'r' and map here, but fetching by ID reuses logic
      query += ` RETURN r.id as id`;

      const result = await session.run(query, params);

      // Fetch full definition objects using the IDs found
      const definitions: FormRelationDefinition[] = [];
      for (const record of result.records) {
        const definitionId = record.get("id");
        if (definitionId) {
          // Reuse the existing method to get the full definition object
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
   * Find relation instances by criteria
   *
   * Finds actual relationships in the graph matching criteria
   */
  async findRelationInstances(
    criteria: {
      definitionId?: string; // Find instances of a specific definition
      relationType?: string; // Find instances by Neo4j relationship type
      sourceId?: string;
      targetId?: string;
      // sourceType?: string; // Filter by source/target entity type
      // targetType?: string;
      property?: {
        // Filter by a specific property value on the relationship
        name: string;
        value: any;
      };
      contextId?: string; // Filter by context
      active?: boolean; // Filter by active status
    } = {}
  ): Promise<FormRelation[]> {
    // Updated return type
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      // Build the query based on criteria
      let relationTypeFilter = "";
      const whereConditions: string[] = [];
      const params: Record<string, any> = {};

      // Filter by Neo4j relationship type if provided
      if (criteria.relationType) {
        relationTypeFilter = `:${this.getSafeRelationName(
          criteria.relationType
        )}`;
      }

      // Build MATCH pattern
      const sourceMatch = criteria.sourceId
        ? "(s:Entity {id: $sourceId})"
        : "(s:Entity)";
      const targetMatch = criteria.targetId
        ? "(t:Entity {id: $targetId})"
        : "(t:Entity)";
      let query = `MATCH ${sourceMatch}-[r${relationTypeFilter}]->${targetMatch}`;

      // Always exclude inverse relationships unless explicitly requested
      whereConditions.push("NOT r.inverse = true");

      // Apply criteria based on relationship properties
      if (criteria.definitionId) {
        whereConditions.push("r.definitionId = $definitionId");
        params.definitionId = criteria.definitionId;
      }
      if (criteria.sourceId) {
        params.sourceId = criteria.sourceId; // Parameter already used in MATCH
      }
      if (criteria.targetId) {
        params.targetId = criteria.targetId; // Parameter already used in MATCH
      }
      // Add sourceType/targetType if needed
      // if (criteria.sourceType) { whereConditions.push("s.type = $sourceType"); params.sourceType = criteria.sourceType; }
      // if (criteria.targetType) { whereConditions.push("t.type = $targetType"); params.targetType = criteria.targetType; }

      if (criteria.property) {
        // Use dynamic property access carefully or validate property name
        const propName = criteria.property.name.replace(/[^a-zA-Z0-9_]/g, "_"); // Basic sanitization
        whereConditions.push(`r.\`${propName}\` = $propValue`); // Use backticks for safety
        params.propValue = criteria.property.value;
      }
      if (criteria.contextId) {
        whereConditions.push("r.contextId = $contextId");
        params.contextId = criteria.contextId;
      }
      if (criteria.active !== undefined) {
        whereConditions.push("r.active = $active");
        params.active = criteria.active;
      }

      // Combine WHERE clause
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(" AND ")}`;
      }

      // Return only the instance ID, fetch full object later
      query += ` RETURN r.id as id`;

      const result = await session.run(query, params);

      // Fetch full instance objects using the IDs found
      const instances: FormRelation[] = [];
      for (const record of result.records) {
        const instanceId = record.get("id");
        if (instanceId) {
          // Reuse the existing method to get the full instance object
          const instance = await this.getRelationInstanceById(instanceId);
          if (instance) {
            instances.push(instance);
          }
        }
      }

      return instances;
    } catch (error) {
      console.error(`Error finding relation instances in Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create a relation instance between entities based on a definition ID.
   *
   * This fetches the definition, validates, generates a new instance ID,
   * and creates the relationship in the graph.
   */
  async createRelationInstance(params: {
    definitionId: string; // Renamed from relationId
    sourceId: string;
    targetId: string;
    properties?: Record<string, any>;
    contextId?: string; // Optional context
    createdBy?: string; // Optional creator
  }): Promise<FormRelation> {
    // Return the created FormRelation object
    const {
      definitionId,
      sourceId,
      targetId,
      properties = {},
      contextId,
      createdBy,
    } = params;
    const session = this.connection.getSession();

    try {
      // First, get the relation definition to validate and get details
      const definition = await this.getRelationDefinitionById(definitionId);

      if (!definition) {
        throw new Error(
          `Relation definition not found with ID: ${definitionId}`
        );
      }

      // Generate a unique ID for the new relation instance using UUID
      const instanceId = uuidv4(); // Use uuidv4 for better uniqueness

      const txc = session.beginTransaction();

      // --- Validation Steps ---
      // 1. Check if the source and target entities exist
      // (Optional: Can be done here or rely on MATCH in CREATE failing)
      const entityCheck = await txc.run(
        `
        OPTIONAL MATCH (s:Entity {id: $sourceId})
        OPTIONAL MATCH (t:Entity {id: $targetId})
        RETURN s IS NOT NULL as sourceExists, t IS NOT NULL as targetExists // , s.type as sourceType, t.type as targetType
      `,
        { sourceId, targetId }
      );

      const checkRecord = entityCheck.records[0];
      if (
        !checkRecord ||
        !checkRecord.get("sourceExists") ||
        !checkRecord.get("targetExists")
      ) {
        await txc.rollback(); // Rollback before throwing
        throw new Error("Source or target entity not found");
      }

      // 2. Validate entity types against the relation definition (if types are defined)
      //    NOTE: This assumes sourceType/targetType constraints are stored directly on the definition node.
      //    Adjust if they are stored differently (e.g., in constraints array).
      // const sourceType = checkRecord.get("sourceType");
      // const targetType = checkRecord.get("targetType");
      // if (definition.sourceType && sourceType !== definition.sourceType) { // Replace definition.sourceType with actual field if exists
      //   await txc.rollback();
      //   throw new Error(`Source entity type (${sourceType}) does not match relation definition`);
      // }
      // if (definition.targetType && targetType !== definition.targetType) { // Replace definition.targetType with actual field if exists
      //   await txc.rollback();
      //   throw new Error(`Target entity type (${targetType}) does not match relation definition`);
      // }

      // 3. Check cardinality constraints based on the definition
      const safeRelationType = this.getSafeRelationName(definition.name); // Use definition name for type
      if (
        definition.cardinality === "one-to-one" ||
        definition.cardinality === "many-to-one"
      ) {
        // Check if target already has an incoming relationship of this type
        const existingTargetCheck = await txc.run(
          `
          MATCH (t:Entity {id: $targetId})<-[r:${safeRelationType}]-()
          WHERE r.definitionId = $definitionId AND NOT r.inverse = true
          RETURN count(r) as relCount
        `,
          { targetId, definitionId }
        );
        if (existingTargetCheck.records[0].get("relCount").toNumber() > 0) {
          await txc.rollback();
          throw new Error(
            `Creating this relation would violate the target ${definition.cardinality} cardinality constraint`
          );
        }
      }
      if (
        definition.cardinality === "one-to-one" ||
        definition.cardinality === "one-to-many"
      ) {
        // Check if source already has an outgoing relationship of this type
        const existingSourceCheck = await txc.run(
          `
           MATCH (s:Entity {id: $sourceId})-[r:${safeRelationType}]->()
           WHERE r.definitionId = $definitionId AND NOT r.inverse = true
           RETURN count(r) as relCount
         `,
          { sourceId, definitionId }
        );
        if (existingSourceCheck.records[0].get("relCount").toNumber() > 0) {
          await txc.rollback();
          throw new Error(
            `Creating this relation would violate the source ${definition.cardinality} cardinality constraint`
          );
        }
      }
      // --- End Validation Steps ---

      // Prepare properties for the new relationship instance
      const now = Date.now();
      const neo4jProperties = {
        ...properties, // Start with custom properties provided
        id: instanceId, // The newly generated instance ID
        definitionId: definitionId, // Link to the definition
        createdAt: now,
        updatedAt: now,
        contextId: contextId || null,
        createdBy: createdBy || null,
        active: true, // Default new relations to active
        // weight: null, // Set default weight if applicable
      };

      // Create the relation instance using CREATE
      await txc.run(
        `
        MATCH (s:Entity {id: $sourceId})
        MATCH (t:Entity {id: $targetId})
        CREATE (s)-[r:${safeRelationType} $props]->(t)
        RETURN r
      `,
        {
          sourceId,
          targetId,
          props: neo4jProperties,
        }
      );

      // If the definition has an inverse, create the inverse relationship
      if (definition.inverse?.type) {
        const safeInverseType = this.getSafeRelationName(
          definition.inverse.type
        );
        await txc.run(
          `
           MATCH (s:Entity {id: $sourceId})
           MATCH (t:Entity {id: $targetId})
           CREATE (t)-[inv_r:${safeInverseType} {
             id: $instanceId,
             definitionId: $definitionId,
             inverse: true,
             createdAt: $createdAt,
             updatedAt: $updatedAt
           }]->(s)
           RETURN inv_r
         `,
          {
            sourceId,
            targetId,
            instanceId: instanceId, // Use the same ID
            definitionId: definitionId,
            createdAt: now,
            updatedAt: now,
          }
        );
      }

      await txc.commit();

      // Construct the FormRelation object to return
      const createdRelation: FormRelation = {
        id: instanceId,
        name: definition.name, // Inherit name from definition
        description: definition.description, // Inherit description
        definitionId: definitionId,
        type: definition.name, // Use definition name as type? Or definition.type if exists?
        source: sourceId,
        target: targetId,
        properties: Object.keys(properties).length > 0 ? properties : undefined,
        directional: true, // Assuming default
        inverseName: definition.inverse?.name, // Get from definition
        active: true,
        createdAt: now,
        updatedAt: now,
        createdBy: createdBy,
        contextId: contextId,
        // weight: undefined, // Set if applicable
        // directional: true, // Set based on definition if needed
        // mapping: undefined, // Set if applicable
      };

      return createdRelation;
    } catch (error) {
      console.error(`Error creating relation instance in Neo4j: ${error}`);
      // Ensure rollback happens if not already done in validation checks
      // await txc.rollback(); // Might be redundant if session.close handles it on error
      throw error; // Re-throw the error
    } finally {
      await session.close();
    }
  }

  /**
   * Get relation instances for a specific entity
   *
   * Returns all relations where the entity is either source or target
   */
  async getEntityRelations(
    entityId: string,
    options: {
      direction?: "outgoing" | "incoming" | "both";
      definitionId?: string; // Filter by definition ID
      relationType?: string; // Filter by Neo4j relationship type
    } = {}
  ): Promise<FormRelation[]> {
    // Updated return type
    const session = this.connection.getSession({ defaultAccessMode: "READ" });
    const { direction = "both", definitionId, relationType } = options;

    try {
      const relationTypeFilter = relationType
        ? `:${this.getSafeRelationName(relationType)}`
        : "";
      const params: Record<string, any> = { entityId };
      const whereClauses: string[] = ["NOT r.inverse = true"]; // Always exclude inverse

      if (definitionId) {
        whereClauses.push("r.definitionId = $definitionId");
        params.definitionId = definitionId;
      }

      const whereString =
        whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

      let query = "";
      const instanceIds = new Set<string>(); // Use a Set to avoid duplicates if direction is 'both'

      // Build the appropriate query based on direction
      if (direction === "outgoing" || direction === "both") {
        const outgoingQuery = `
          MATCH (s:Entity {id: $entityId})-[r${relationTypeFilter}]->(t:Entity)
          ${whereString}
          RETURN r.id as instanceId
        `;
        const outgoingResult = await session.run(outgoingQuery, params);
        outgoingResult.records.forEach((record) =>
          instanceIds.add(record.get("instanceId"))
        );
      }

      if (direction === "incoming" || direction === "both") {
        const incomingQuery = `
          MATCH (s:Entity)-[r${relationTypeFilter}]->(t:Entity {id: $entityId})
          ${whereString}
          RETURN r.id as instanceId
        `;
        const incomingResult = await session.run(incomingQuery, params);
        incomingResult.records.forEach((record) =>
          instanceIds.add(record.get("instanceId"))
        );
      }

      // Fetch full instance objects using the IDs found
      const instances: FormRelation[] = [];
      for (const instanceId of instanceIds) {
        if (instanceId) {
          // Reuse the existing method to get the full instance object
          const instance = await this.getRelationInstanceById(instanceId);
          if (instance) {
            instances.push(instance);
          }
        }
      }

      return instances;
    } catch (error) {
      console.error(`Error getting entity relations from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Update specific fields of a relation definition.
   *
   * Allows partial updates to a definition's properties.
   * Handles updates to constraints, tags, and behaviors by replacing them.
   * Automatically updates the 'updatedAt' timestamp.
   */
  async updateRelationDefinition(
    definitionId: string,
    updates: Partial<Omit<FormRelationDefinition, "id" | "createdAt">> // Exclude id/createdAt from updates
  ): Promise<FormRelationDefinition | null> {
    const session = this.connection.getSession();

    try {
      // Fetch the current definition first to merge updates
      const currentDefinition = await this.getRelationDefinitionById(
        definitionId
      );

      if (!currentDefinition) {
        console.warn(`Relation definition not found: ${definitionId}`);
        return null;
      }

      // Merge updates with current definition
      // Note: For arrays like constraints, tags, behaviors, this replaces the entire array if provided in updates.
      const updatedDefinitionData: FormRelationDefinition = {
        ...currentDefinition,
        ...updates,
        id: definitionId, // Ensure ID remains the same
        createdAt: currentDefinition.createdAt, // Keep original createdAt
        updatedAt: Date.now(), // Set new updatedAt timestamp
      };

      // Use the existing save method to handle the update logic
      // saveRelationDefinition handles MERGE and updates to related nodes (constraints, tags, behaviors)
      const savedDefinition = await this.saveRelationDefinition(
        updatedDefinitionData
      );

      return savedDefinition; // saveRelationDefinition returns the full object
    } catch (error) {
      console.error(`Error updating relation definition in Neo4j: ${error}`);
      // No transaction to rollback here as saveRelationDefinition handles its own
      throw error; // Re-throw the error
    } finally {
      await session.close(); // Close session used by getRelationDefinitionById if it wasn't closed internally
    }
  }

  /**
   * Update relation instance properties and specific fields.
   *
   * Allows updating custom properties within the 'properties' field,
   * as well as 'active', 'weight', and 'contextId'.
   * Automatically updates the 'updatedAt' timestamp.
   */
  async updateRelationInstance(
    instanceId: string,
    updates: Partial<
      Pick<FormRelation, "active" | "weight" | "contextId" | "properties">
    >
  ): Promise<FormRelation | null> {
    // Return updated instance or null
    const session = this.connection.getSession();
    const txc = session.beginTransaction();

    try {
      // Find the relation to verify it exists and get its definitionId
      const findResult = await txc.run(
        `
        MATCH (s:Entity)-[r {id: $instanceId}]->(t:Entity)
        WHERE NOT r.inverse = true // Ensure we target the main relation
        RETURN r.id as id, r.definitionId as definitionId
      `,
        { instanceId }
      );

      if (findResult.records.length === 0) {
        await txc.rollback(); // Rollback before throwing
        // Return null instead of throwing? Or keep throwing? Let's return null for now.
        console.warn(
          `Relation instance not found or is inverse: ${instanceId}`
        );
        return null;
        // throw new Error(`FormRelation instance not found with ID: ${instanceId}`);
      }

      const definitionId = findResult.records[0].get("definitionId"); // Needed for inverse handling
      const now = Date.now();
      const setClauses: string[] = [];
      const updateParams: Record<string, any> = { instanceId, updatedAt: now };

      // Handle top-level field updates
      if (updates.active !== undefined) {
        setClauses.push("r.active = $active");
        updateParams.active = updates.active;
      }
      if (updates.weight !== undefined) {
        setClauses.push("r.weight = $weight");
        updateParams.weight = updates.weight;
      }
      if (updates.contextId !== undefined) {
        setClauses.push("r.contextId = $contextId");
        updateParams.contextId = updates.contextId;
      }

      // Handle custom properties updates (merge/overwrite)
      if (updates.properties && Object.keys(updates.properties).length > 0) {
        // Option 1: Overwrite specific properties provided
        for (const key in updates.properties) {
          if (Object.prototype.hasOwnProperty.call(updates.properties, key)) {
            // Sanitize key? Or assume keys are safe?
            const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "_");
            setClauses.push(`r.\`${safeKey}\` = $prop_${safeKey}`);
            updateParams[`prop_${safeKey}`] = updates.properties[key];
          }
        }
        // Option 2: Merge properties (keeps existing, adds/updates new)
        // setClauses.push("r += $properties");
        // updateParams.properties = updates.properties;
      }

      // Always update the timestamp
      setClauses.push("r.updatedAt = $updatedAt");

      if (setClauses.length === 0) {
        // No actual updates provided besides timestamp
        await txc.rollback();
        console.warn(
          "No update fields provided for relation instance:",
          instanceId
        );
        return this.getRelationInstanceById(instanceId); // Return current state
      }

      // Update the main relationship
      await txc.run(
        `
        MATCH ()-[r {id: $instanceId}]->()
        WHERE NOT r.inverse = true
        SET ${setClauses.join(", ")}
        RETURN r
      `,
        updateParams
      );

      // Update the inverse relationship's timestamp if it exists
      if (definitionId) {
        const definition = await this.getRelationDefinitionById(definitionId);
        if (definition?.inverse?.type) {
          const safeInverseType = this.getSafeRelationName(
            definition.inverse.type
          );
          await txc.run(
            `
              MATCH ()<-[inv_r:${safeInverseType} {id: $instanceId}]-()
              WHERE inv_r.inverse = true
              SET inv_r.updatedAt = $updatedAt
              RETURN inv_r
              `,
            { instanceId, updatedAt: now }
          );
        }
      }

      await txc.commit();

      // Fetch and return the updated instance
      return this.getRelationInstanceById(instanceId);
    } catch (error) {
      console.error(`Error updating relation instance in Neo4j: ${error}`);
      await txc.rollback(); // Ensure rollback on error
      throw error; // Re-throw the error
    } finally {
      await session.close();
    }
  }

  /**
   * Delete a relation definition by ID
   *
   * Also deletes associated constraints, tags, and behaviors.
   * If force=true, it will also delete all relation instances based on this definition.
   */
  async deleteRelationDefinition(
    definitionId: string,
    force: boolean = false
  ): Promise<boolean> {
    const session = this.connection.getSession();
    const txc = session.beginTransaction(); // Use transaction for all operations

    try {
      // Check if the definition exists first (optional, MATCH in delete will handle it)
      const definition = await this.getRelationDefinitionById(definitionId);
      if (!definition) {
        await txc.rollback(); // Rollback if definition doesn't exist
        console.warn(`Relation definition not found: ${definitionId}`);
        return false; // Return false as nothing was deleted
      }

      // Check for existing instances if force is false
      if (!force) {
        const instanceCheck = await txc.run(
          `
          MATCH ()-[r]-() WHERE r.definitionId = $definitionId
          RETURN count(r) as instanceCount
        `,
          { definitionId } // Use definitionId
        );

        const instanceCount =
          instanceCheck.records[0]?.get("instanceCount")?.toNumber() ?? 0;

        if (instanceCount > 0) {
          await txc.rollback(); // Rollback before throwing
          throw new Error(
            `Cannot delete relation definition: ${instanceCount} instances exist. Use force=true to delete them as well.`
          );
        }
      } else {
        // Force delete: Delete all instances (both direct and inverse) using definitionId
        await txc.run(
          `
          MATCH ()-[r]-() WHERE r.definitionId = $definitionId
          DELETE r
          RETURN count(r) as deletedCount
        `,
          { definitionId } // Use definitionId
        );
        // Note: Consider batching deletes for very large numbers of instances
      }

      // Delete associated constraints, tags, and behaviors using DETACH DELETE on the definition node
      // This simplifies cleanup by removing the definition and all its direct relationships
      // to constraints, tags, and behaviors, and the related nodes themselves if they become detached.
      await txc.run(
        `
        MATCH (r:RelationDefinition {id: $definitionId})
        DETACH DELETE r
        RETURN count(r) as deletedCount
      `,
        { definitionId }
      );

      /* // Alternative: Explicitly delete related nodes first (more verbose)
      // Delete constraints
      await txc.run(
        `
        MATCH (r:RelationDefinition {id: $definitionId})-[rel:HAS_CONSTRAINT]->(c:FormRelationConstraint)
        DETACH DELETE c // Delete constraint node and relationship
      `, { definitionId });

      // Delete tags relationships (don't delete Tag nodes unless they are orphaned)
      await txc.run(
        `
        MATCH (r:RelationDefinition {id: $definitionId})-[rel:HAS_TAG]->(t:Tag)
        DELETE rel
      `, { definitionId });

      // Delete behaviors
      await txc.run(
        `
        MATCH (r:RelationDefinition {id: $definitionId})-[rel:HAS_BEHAVIOR]->(b:FormRelationBehavior)
        DETACH DELETE b // Delete behavior node and relationship
      `, { definitionId });

      // Finally, delete the definition node itself
      await txc.run(
        `
        MATCH (r:RelationDefinition {id: $definitionId})
        DELETE r
      `, { definitionId });
      */

      await txc.commit();
      return true; // Successfully deleted
    } catch (error) {
      console.error(`Error deleting relation definition from Neo4j: ${error}`);
      await txc.rollback(); // Ensure rollback on any error
      throw error; // Re-throw the error
    } finally {
      await session.close();
    }
  }

  /**
   * Delete a relation instance by its unique ID.
   *
   * This will delete both the main relationship and its inverse (if it exists)
   * as they share the same instance ID.
   */
  async deleteRelationInstance(instanceId: string): Promise<boolean> {
    const session = this.connection.getSession();
    const txc = session.beginTransaction(); // Use transaction

    try {
      // Delete all relationships (direct and inverse) matching the instance ID
      const result = await txc.run(
        `
        MATCH ()-[r {id: $instanceId}]-()
        DELETE r
        RETURN count(r) as deletedCount
      `,
        { instanceId }
      );

      const deletedCount =
        result.records[0]?.get("deletedCount")?.toNumber() ?? 0;

      await txc.commit();

      // Return true if at least one relationship was deleted
      return deletedCount > 0;
    } catch (error) {
      console.error(`Error deleting relation instance from Neo4j: ${error}`);
      await txc.rollback(); // Ensure rollback on error
      throw error; // Re-throw the error
    } finally {
      await session.close();
    }
  }

  /**
   * Find entities connected by relations, traversing the graph.
   *
   * Allows filtering by relation type (Neo4j type) and/or definition ID.
   * Excludes paths that traverse relationships marked as inverse.
   */
  async findConnectedEntities(params: {
    startEntityId: string;
    relationType?: string; // Filter by Neo4j relationship type (e.g., "KNOWS")
    definitionId?: string; // Filter relationships by their definition ID
    targetType?: string; // Filter end node by its type property
    maxDepth?: number;
    direction?: "outgoing" | "incoming" | "both";
  }): Promise<
    Array<{
      entityId: string; // ID of the connected entity found
      entityType?: string; // Type of the connected entity
      entityName?: string; // Name of the connected entity
      path: Array<{
        instanceId: string; // The unique ID of the relation instance in the path
        definitionId?: string; // The definition ID of the relation instance
        relationType: string; // The Neo4j type of the relationship
        sourceId: string;
        targetId: string;
        direction: "outgoing" | "incoming"; // Direction relative to the start node of the segment
      }>;
      depth: number; // Length of the path (number of relationships)
    }>
  > {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });
    const {
      startEntityId,
      relationType, // Renamed from relationName for clarity
      definitionId, // Renamed from relationId
      targetType,
      maxDepth = 5,
      direction = "outgoing",
    } = params;

    try {
      // Build the relationship type filter for Cypher path
      const cypherRelTypeFilter = relationType
        ? `:${this.getSafeRelationName(relationType)}`
        : "";

      // Build the direction pattern
      let directionPattern = "";
      if (direction === "outgoing") {
        directionPattern = `-[rels${cypherRelTypeFilter}*1..${maxDepth}]->`;
      } else if (direction === "incoming") {
        directionPattern = `<-[rels${cypherRelTypeFilter}*1..${maxDepth}]-`;
      } else {
        // Both directions
        directionPattern = `-[rels${cypherRelTypeFilter}*1..${maxDepth}]-`;
      }

      // Build WHERE clauses
      const whereClauses: string[] = ["start <> end"]; // Don't match the start node itself
      const queryParams: Record<string, any> = { startId: startEntityId };

      // Add filter for end node type
      if (targetType) {
        whereClauses.push("end.type = $targetType");
        queryParams.targetType = targetType;
      }

      // Add filter for definitionId on ALL relationships in the path
      if (definitionId) {
        whereClauses.push(
          "all(r IN rels WHERE r.definitionId = $definitionId)"
        );
        queryParams.definitionId = definitionId;
      }

      // Always exclude paths containing inverse relationships
      whereClauses.push("all(r IN rels WHERE NOT r.inverse = true)");

      const query = `
        MATCH path = (start:Entity {id: $startId})${directionPattern}(end:Entity)
        WHERE ${whereClauses.join(" AND ")}
        RETURN path, length(path) as depth
        ORDER BY depth
        LIMIT 100 // Add a limit for safety
      `;

      const result = await session.run(query, queryParams);

      // Map results to the desired output structure
      return result.records.map((record) => {
        const path = record.get("path");
        const depth = record.get("depth").toNumber();
        const endEntity = path.end.properties; // Properties of the final node in the path

        const segments: Array<{
          instanceId: string;
          definitionId?: string;
          relationType: string;
          sourceId: string;
          targetId: string;
          direction: "outgoing" | "incoming";
        }> = [];

        // Iterate through path segments (node, relationship, node)
        for (const segment of path.segments) {
          const rel = segment.relationship;
          const relProps = rel.properties;
          const startNodeProps = segment.start.properties;
          const endNodeProps = segment.end.properties;

          // Determine direction relative to the start of this specific segment
          const segmentDirection =
            startNodeProps.id === segment.start.properties.id
              ? "outgoing"
              : "incoming";

          segments.push({
            instanceId: relProps.id, // Use the actual instance ID
            definitionId: relProps.definitionId, // Include definition ID
            relationType: rel.type, // Neo4j relationship type
            sourceId: startNodeProps.id,
            targetId: endNodeProps.id,
            direction: segmentDirection,
          });
        }

        return {
          entityId: endEntity.id,
          entityType: endEntity.type,
          entityName: endEntity.name,
          path: segments,
          depth,
        };
      });
    } catch (error) {
      console.error(`Error finding connected entities in Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get relation statistics
   */
  async getRelationStats(): Promise<{
    totalDefinitions: number;
    totalInstances: number; // Count of non-inverse relationship instances
    byDefinitionType: Record<string, number>; // Count of definitions by their 'type' property
    byInstanceType: Record<string, number>; // Count of instances by Neo4j relationship type
    mostUsedDefinitions: Array<{ // Renamed from mostUsedRelations
      definitionId: string; // Changed from id
      name: string;
      instanceCount: number;
    }>;
    topConnectedEntities: Array<{
      entityId: string;
      entityName?: string; // Name might be optional
      relationCount: number; // Count of non-inverse relationships connected
    }>;
  }> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      // Get counts of definitions and non-inverse instances
      const countsResult = await session.run(`
        MATCH (def:RelationDefinition)
        WITH count(def) as defCount
        MATCH ()-[inst]->() WHERE exists(inst.id) AND NOT inst.inverse = true
        RETURN defCount, count(inst) as instCount
      `); // Corrected instance match

      const totalDefinitions = countsResult.records[0]?.get("defCount")?.toNumber() ?? 0;
      const totalInstances = countsResult.records[0]?.get("instCount")?.toNumber() ?? 0;


      // Get counts of definitions by their 'type' property (if it exists and is meaningful)
      const defTypeResult = await session.run(`
        MATCH (def:RelationDefinition)
        WHERE def.type IS NOT NULL // Only count if type property exists
        RETURN def.type as type, count(def) as count
        ORDER BY count DESC
      `);

      const byDefinitionType: Record<string, number> = {};
      defTypeResult.records.forEach(record => {
        byDefinitionType[record.get("type")] = record.get("count").toNumber();
      });


      // Get counts of instances by Neo4j relationship type
      const instTypeResult = await session.run(`
        MATCH ()-[inst]->() WHERE exists(inst.id) AND NOT inst.inverse = true
        RETURN type(inst) as type, count(inst) as count
        ORDER BY count DESC
      `);

      const byInstanceType: Record<string, number> = {};
      instTypeResult.records.forEach(record => {
        byInstanceType[record.get("type")] = record.get("count").toNumber();
      });


      // Get most used relation definitions (by instance count)
      const mostUsedResult = await session.run(`
        MATCH ()-[inst]->()
        WHERE exists(inst.definitionId) AND NOT inst.inverse = true // Use definitionId and exclude inverse
        WITH inst.definitionId as defId, count(inst) as instanceCount
        ORDER BY instanceCount DESC
        LIMIT 10 // Increased limit slightly
        MATCH (def:RelationDefinition {id: defId})
        RETURN def.id as definitionId, def.name as name, instanceCount
      `); // Corrected query

      const mostUsedDefinitions = mostUsedResult.records.map((record) => ({
        definitionId: record.get("definitionId"), // Use definitionId
        name: record.get("name"),
        instanceCount: record.get("instanceCount").toNumber(),
      }));


      // Get most connected entities (counting non-inverse relationships)
      const topConnectedResult = await session.run(`
        MATCH (e:Entity)-[rel]-() // Match incoming or outgoing
        WHERE exists(rel.id) AND NOT rel.inverse = true // Check instance ID and exclude inverse
        WITH e, count(rel) as relCount
        ORDER BY relCount DESC
        LIMIT 10 // Increased limit slightly
        RETURN e.id as entityId, e.name as entityName, relCount
      `); // Corrected query

      const topConnectedEntities = topConnectedResult.records.map((record) => ({
        entityId: record.get("entityId"),
        entityName: record.get("entityName"), // Name might be null
        relationCount: record.get("relCount").toNumber(),
      }));

      return {
        totalDefinitions,
        totalInstances,
        byDefinitionType,
        byInstanceType,
        mostUsedDefinitions,
        topConnectedEntities,
      };
    } catch (error) {
      console.error(`Error getting relation stats from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get a Neo4j-safe relation name
   */
  private getSafeRelationName(name: string): string {
    // Remove invalid characters and ensure starts with a letter
    return name.replace(/[^a-zA-Z0-9_]/g, "_").toUpperCase();
  }
}
