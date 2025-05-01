import { Neo4jConnection } from "../connection";
import {
  FormContext,
  FormContextRule,
  FormContextType,
} from "@/form/schema/context";
import { Session } from "neo4j-driver";

/**
 * ContextRepository
 *
 * Manages the persistence of Contexts in Neo4j.
 * Contexts define the boundaries and conditions under which forms and entities
 * are interpreted and processed, establishing a framework for meaning.
 */
export class ContextRepository {
  private connection: Neo4jConnection;

  constructor(connection: Neo4jConnection) {
    this.connection = connection;
  }

  /**
   * Save a context to Neo4j
   *
   * Creates or updates a context and its relationships
   */
  async saveContext(context: FormContext): Promise<FormContext> {
    const session = this.connection.getSession();

    try {
      const txc = session.beginTransaction();

      // Create or update the context node
      await txc.run(
        `
        MERGE (c:FormContext {id: $id})
        SET c.name = $name,
            c.description = $description,
            c.type = $type,
            c.scope = $scope,
            c.priority = $priority,
            c.active = $active,
            c.updatedAt = datetime().epochMillis
            
        FOREACH (__ IN CASE WHEN $createdAt IS NOT NULL THEN [1] ELSE [] END | 
          SET c.createdAt = $createdAt)
        
        RETURN c
      `,
        {
          id: context.id,
          name: context.name || "",
          description: context.description || "",
          type: context.type || "system",
          scope: context.scope || "global",
          priority: context.priority || 0,
          active: context.active !== false, // Default to true
          createdAt: context.createdAt ? context.createdAt : Date.now(),
        }
      );

      // Handle parent relationship
      if (context.parentId) {
        await txc.run(
          `
          MATCH (c:FormContext {id: $id})
          MATCH (parent:FormContext {id: $parentId})
          MERGE (c)-[:HAS_PARENT]->(parent)
          RETURN parent
        `,
          {
            id: context.id,
            parentId: context.parentId,
          }
        );
      } else {
        // If no parent is specified, remove any existing parent relationship
        await txc.run(
          `
          MATCH (c:FormContext {id: $id})-[r:HAS_PARENT]->()
          DELETE r
          RETURN c
        `,
          { id: context.id }
        );
      }

      // Handle properties
      if (context.properties && Object.keys(context.properties).length > 0) {
        await txc.run(
          `
          MATCH (c:FormContext {id: $id})
          SET c.properties = $properties
          RETURN c
        `,
          {
            id: context.id,
            properties: JSON.stringify(context.properties),
          }
        );
      }
      // Handle rules - first delete existing rules
      await txc.run(
        `
          MATCH (c:FormContext {id: $id})-[r:HAS_RULE]->(:FormContextRule)
          DELETE r
          RETURN c
        `,
        { id: context.id }
      );

      await txc.run(
        `
          MATCH (c:FormContext {id: $id})-[r:HAS_RULE]->(:FormContextRule)
          DETACH DELETE r
          RETURN c
        `,
        { id: context.id }
      );

      // Add new rules if they exist
      if (context.rules && context.rules.length > 0) {
        for (let i = 0; i < context.rules.length; i++) {
          const rule = context.rules[i];

          await txc.run(
            `
      MATCH (c:FormContext {id: $id})
      
      CREATE (r:FormContextRule {
        id: $ruleId,
        name: $name,
        type: $type,
        description: $description,
        priority: $priority,
        active: $active
      })
      
      SET r.conditionType = $conditionType,
          r.condition = $condition,
          r.actionType = $actionType,
          r.action = $action
          
      MERGE (c)-[:HAS_RULE {order: $order}]->(r)
      
      RETURN r
    `,
            {
              id: context.id,
              ruleId: rule.id || `${context.id}_rule_${i}`,
              name: rule.name || `Rule ${i + 1}`,
              type: rule.type,
              description: rule.description || "",
              priority: rule.priority || 0,
              active: rule.active !== false, // Default to true

              // Store both the type and the value
              conditionType:
                typeof rule.condition === "function" ? "function" : "json",
              condition:
                typeof rule.condition === "function"
                  ? rule.condition.toString()
                  : rule.condition
                  ? JSON.stringify(rule.condition)
                  : "{}",

              actionType:
                typeof rule.action === "function" ? "function" : "json",
              action:
                typeof rule.action === "function"
                  ? rule.action.toString()
                  : rule.action
                  ? JSON.stringify(rule.action)
                  : "{}",

              order: i,
            }
          );
        }
      }
      // Handle entity inclusions
      if (context.entities) {
        // First remove existing entity relationships
        await txc.run(
          `
          MATCH (c:FormContext {id: $id})-[r:INCLUDES_ENTITY]->()
          DELETE r
          RETURN c
        `,
          { id: context.id }
        );

        // Add new entity relationships
        for (const entityId of context.entities) {
          await txc.run(
            `
            MATCH (c:FormContext {id: $id})
            MERGE (e:Entity {id: $entityId})
            MERGE (c)-[:INCLUDES_ENTITY]->(e)
            RETURN e
          `,
            {
              id: context.id,
              entityId: entityId,
            }
          );
        }
      }

      // Handle form inclusions
      if (context.forms) {
        // First remove existing form relationships
        await txc.run(
          `
          MATCH (c:FormContext {id: $id})-[r:INCLUDES_FORM]->()
          DELETE r
          RETURN c
        `,
          { id: context.id }
        );

        // Add new form relationships
        for (const formId of context.forms) {
          await txc.run(
            `
            MATCH (c:FormContext {id: $id})
            MERGE (f:Form {id: $formId})
            MERGE (c)-[:INCLUDES_FORM]->(f)
            RETURN f
          `,
            {
              id: context.id,
              formId: formId,
            }
          );
        }
      }

      // Handle tags
      if (context.tags && context.tags.length > 0) {
        // First remove existing tags
        await txc.run(
          `
          MATCH (c:FormContext {id: $id})-[r:HAS_TAG]->()
          DELETE r
          RETURN c
        `,
          { id: context.id }
        );

        // Add new tags
        for (const tag of context.tags) {
          await txc.run(
            `
            MATCH (c:FormContext {id: $id})
            MERGE (t:Tag {name: $tagName})
            MERGE (c)-[:HAS_TAG]->(t)
            RETURN t
          `,
            {
              id: context.id,
              tagName: tag,
            }
          );
        }
      }

      // Handle metadata
      if (context.meta && Object.keys(context.meta).length > 0) {
        await txc.run(
          `
          MATCH (c:FormContext {id: $id})
          SET c.meta = $meta
          RETURN c
        `,
          {
            id: context.id,
            meta: JSON.stringify(context.meta),
          }
        );
      }

      await txc.commit();

      return context;
    } catch (error) {
      console.error(`Error saving context to Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get a context by ID
   *
   * Retrieves a complete context and its relationships from Neo4j
   */
  async getContextById(id: string): Promise<FormContext | null> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      // Get basic context information
      const contextResult = await session.run(
        `
        MATCH (c:FormContext {id: $id})
        OPTIONAL MATCH (c)-[:HAS_PARENT]->(parent:FormContext)
        RETURN c, parent.id as parentId
      `,
        { id }
      );

      if (contextResult.records.length === 0) {
        return null;
      }

      const contextNode = contextResult.records[0].get("c").properties;
      const parentId = contextResult.records[0].get("parentId");

      // Parse properties
      let properties = {};
      if (contextNode.properties) {
        try {
          properties = JSON.parse(contextNode.properties);
        } catch (e) {
          console.error(`Error parsing context properties: ${e}`);
        }
      }

      // Parse metadata
      let meta = undefined;
      if (contextNode.meta) {
        try {
          meta = JSON.parse(contextNode.meta);
        } catch (e) {
          console.error(`Error parsing context metadata: ${e}`);
        }
      }

      // Get rules
      const rules = await this.getContextRules(id, session);

      // Get entity inclusions
      const entitiesResult = await session.run(
        `
        MATCH (c:FormContext {id: $id})-[:INCLUDES_ENTITY]->(e:Entity)
        RETURN e.id as entityId
      `,
        { id }
      );

      const entities = entitiesResult.records.map((record) =>
        record.get("entityId")
      );

      // Get form inclusions
      const formsResult = await session.run(
        `
        MATCH (c:FormContext {id: $id})-[:INCLUDES_FORM]->(f:Form)
        RETURN f.id as formId
      `,
        { id }
      );

      const forms = formsResult.records.map((record) => record.get("formId"));

      // Get tags
      const tagsResult = await session.run(
        `
        MATCH (c:FormContext {id: $id})-[:HAS_TAG]->(t:Tag)
        RETURN t.name as tag
      `,
        { id }
      );

      const tags = tagsResult.records.map((record) => record.get("tag"));

      // Build the complete context object
      return {
        id: contextNode.id,
        name: contextNode.name,
        description: contextNode.description,
        type: contextNode.type as FormContextType,
        scope: contextNode.scope,
        priority:
          typeof contextNode.priority === "number"
            ? contextNode.priority
            : parseInt(contextNode.priority || "0"),
        active: contextNode.active,
        parentId: parentId || undefined,
        properties,
        rules,
        entities: entities.length > 0 ? entities : undefined,
        tags: tags.length > 0 ? tags : undefined,
        transactionState: contextNode.transactionState,
        meta,
        timestamp: contextNode.timestamp ? contextNode.timestamp : Date.now(),
        createdAt: contextNode.createdAt ? contextNode.createdAt : Date.now(),
        updatedAt: contextNode.updatedAt ? contextNode.updatedAt : Date.now(),
      };
    } catch (error) {
      console.error(`Error getting context from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get rules for a context
   */

  private async getContextRules(
    contextId: string,
    session: Session
  ): Promise<FormContextRule[]> {
    const rulesResult = await session.run(
      `
    MATCH (c:FormContext {id: $contextId})-[rel:HAS_RULE]->(r:FormContextRule)
    WITH r, rel.order as ruleOrder
    ORDER BY ruleOrder
    RETURN r
  `,
      { contextId }
    );

    const rules: FormContextRule[] = [];

    for (const record of rulesResult.records) {
      const ruleNode = record.get("r").properties;

      // Parse condition based on its type
      let condition: any = {};
      if (ruleNode.conditionType === "function") {
        // Handle function - stored as string representation
        try {
          // Create a function from string using Function constructor
          // Note: This has security implications if the string comes from untrusted sources
          condition = new Function("return " + ruleNode.condition)();
        } catch (e) {
          console.error(`Error parsing rule condition function: ${e}`);
          // Fallback to string
          condition = ruleNode.condition;
        }
      } else {
        // Handle JSON object
        try {
          condition = JSON.parse(ruleNode.condition || "{}");
        } catch (e) {
          console.error(`Error parsing rule condition: ${e}`);
          condition = {};
        }
      }

      // Similar approach for action
      let action: any = {};
      if (ruleNode.actionType === "function") {
        try {
          action = new Function("return " + ruleNode.action)();
        } catch (e) {
          console.error(`Error parsing rule action function: ${e}`);
          action = ruleNode.action;
        }
      } else {
        try {
          action = JSON.parse(ruleNode.action || "{}");
        } catch (e) {
          console.error(`Error parsing rule action: ${e}`);
          action = {};
        }
      }

      rules.push({
        id: ruleNode.id,
        name: ruleNode.name,
        type: ruleNode.type,
        description: ruleNode.description,
        priority:
          typeof ruleNode.priority === "number"
            ? ruleNode.priority
            : parseInt(ruleNode.priority || "0"),
        active: ruleNode.active,
        condition,
        action,
      });
    }

    return rules;
  }

  /**
   * Find contexts by criteria
   */
  async findContexts(
    criteria: {
      type?: FormContextType | FormContextType[];
      scope?: string;
      parentId?: string;
      active?: boolean;
      name?: string;
      tag?: string;
      entityId?: string;
      formId?: string;
    } = {}
  ): Promise<FormContext[]> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      let query = `
        MATCH (c:FormContext)
        WHERE 1=1
      `;

      const params: Record<string, any> = {};

      if (criteria.type) {
        if (Array.isArray(criteria.type)) {
          query += ` AND c.type IN $types`;
          params.types = criteria.type;
        } else {
          query += ` AND c.type = $type`;
          params.type = criteria.type;
        }
      }

      if (criteria.scope) {
        query += ` AND c.scope = $scope`;
        params.scope = criteria.scope;
      }

      if (criteria.parentId) {
        query += ` AND (c)-[:HAS_PARENT]->(:FormContext {id: $parentId})`;
        params.parentId = criteria.parentId;
      }

      if (criteria.active !== undefined) {
        query += ` AND c.active = $active`;
        params.active = criteria.active;
      }

      if (criteria.name) {
        query += ` AND c.name CONTAINS $name`;
        params.name = criteria.name;
      }

      if (criteria.tag) {
        query += ` AND (c)-[:HAS_TAG]->(:Tag {name: $tag})`;
        params.tag = criteria.tag;
      }

      if (criteria.entityId) {
        query += ` AND (c)-[:INCLUDES_ENTITY]->(:Entity {id: $entityId})`;
        params.entityId = criteria.entityId;
      }

      if (criteria.formId) {
        query += ` AND (c)-[:INCLUDES_FORM]->(:Form {id: $formId})`;
        params.formId = criteria.formId;
      }

      query += ` RETURN c.id as id ORDER BY c.priority DESC`;

      const result = await session.run(query, params);

      // Get complete context objects
      const contexts: FormContext[] = [];

      for (const record of result.records) {
        const contextId = record.get("id");
        const context = await this.getContextById(contextId);

        if (context) {
          contexts.push(context);
        }
      }

      return contexts;
    } catch (error) {
      console.error(`Error finding contexts in Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get context hierarchy (ancestors)
   *
   * Returns the complete hierarchy of contexts from the specified context up to the root
   */
  async getContextHierarchy(contextId: string): Promise<FormContext[]> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      const result = await session.run(
        `
        MATCH (c:FormContext {id: $contextId})
        MATCH path = (c)-[:HAS_PARENT*0..]->(ancestor:FormContext)
        WITH ancestor
        ORDER BY length(path)
        RETURN ancestor.id as id
      `,
        { contextId }
      );

      // Get complete context objects
      const contexts: FormContext[] = [];

      for (const record of result.records) {
        const id = record.get("id");
        const context = await this.getContextById(id);

        if (context) {
          contexts.push(context);
        }
      }

      return contexts;
    } catch (error) {
      console.error(`Error getting context hierarchy from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get contexts that apply to a specific entity or form
   */
  async getApplicableContexts(options: {
    entityId?: string;
    formId?: string;
    activeOnly?: boolean;
  }): Promise<FormContext[]> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      let query = ``;
      const params: Record<string, any> = {};

      // Find contexts that directly include the entity/form or include a parent context that does
      if (options.entityId) {
        query = `
          MATCH (e:Entity {id: $targetId})
          MATCH (c:FormContext)-[:INCLUDES_ENTITY]->(e)
          WHERE 1=1
        `;
        params.targetId = options.entityId;
      } else if (options.formId) {
        query = `
          MATCH (f:Form {id: $targetId})
          MATCH (c:FormContext)-[:INCLUDES_FORM]->(f)
          WHERE 1=1
        `;
        params.targetId = options.formId;
      } else {
        throw new Error("Either entityId or formId must be specified");
      }

      if (options.activeOnly !== false) {
        query += ` AND c.active = true`;
      }

      query += ` RETURN c.id as id ORDER BY c.priority DESC`;

      const result = await session.run(query, params);

      // Get complete context objects
      const contexts: FormContext[] = [];

      for (const record of result.records) {
        const contextId = record.get("id");
        const context = await this.getContextById(contextId);

        if (context) {
          contexts.push(context);
        }
      }

      return contexts;
    } catch (error) {
      console.error(`Error getting applicable contexts from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create a context inheritance relationship
   */
  async setContextParent(
    contextId: string,
    parentId: string
  ): Promise<boolean> {
    const session = this.connection.getSession();

    try {
      // Check for circular dependencies
      const circularCheck = await session.run(
        `
        MATCH path = (:FormContext {id: $parentId})-[:HAS_PARENT*0..]->(c:FormContext {id: $contextId})
        RETURN count(path) as pathCount
      `,
        { contextId, parentId }
      );

      const pathCount = circularCheck.records[0].get("pathCount");
      if (pathCount > 0) {
        throw new Error(
          `Cannot set context parent: circular dependency detected`
        );
      }

      // Set the parent
      await session.run(
        `
        MATCH (c:FormContext {id: $contextId})
        MATCH (parent:FormContext {id: $parentId})
        MERGE (c)-[:HAS_PARENT]->(parent)
        RETURN c, parent
      `,
        { contextId, parentId }
      );

      return true;
    } catch (error) {
      console.error(`Error setting context parent in Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Remove context parent
   */
  async removeContextParent(contextId: string): Promise<boolean> {
    const session = this.connection.getSession();

    try {
      await session.run(
        `
        MATCH (c:FormContext {id: $contextId})-[r:HAS_PARENT]->()
        DELETE r
        RETURN c
      `,
        { contextId }
      );

      return true;
    } catch (error) {
      console.error(`Error removing context parent in Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get child contexts
   *
   * Returns contexts that directly inherit from the specified context
   */
  async getChildContexts(contextId: string): Promise<FormContext[]> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      const result = await session.run(
        `
        MATCH (child:FormContext)-[:HAS_PARENT]->(c:FormContext {id: $contextId})
        RETURN child.id as id
      `,
        { contextId }
      );

      // Get complete context objects
      const contexts: FormContext[] = [];

      for (const record of result.records) {
        const childId = record.get("id");
        const context = await this.getContextById(childId);

        if (context) {
          contexts.push(context);
        }
      }

      return contexts;
    } catch (error) {
      console.error(`Error getting child contexts from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Delete a context by ID
   */
  async deleteContext(id: string): Promise<boolean> {
    const session = this.connection.getSession();

    try {
      const txc = session.beginTransaction();

      // Check if the context has children
      const childCheck = await txc.run(
        `
        MATCH (child:FormContext)-[:HAS_PARENT]->(c:FormContext {id: $id})
        RETURN count(child) as childCount
      `,
        { id }
      );

      const childCount = childCheck.records[0].get("childCount");
      if (childCount > 0) {
        throw new Error(
          `Cannot delete context: it has ${childCount} child contexts`
        );
      }

      // Delete rules first
      await txc.run(
        `
        MATCH (c:FormContext {id: $id})-[:HAS_RULE]->(r:FormContextRule)
        DETACH DELETE r
        RETURN c
      `,
        { id }
      );

      // Delete the context itself
      await txc.run(
        `
        MATCH (c:FormContext {id: $id})
        DETACH DELETE c
        RETURN count(*) as deleted
      `,
        { id }
      );

      await txc.commit();

      return true;
    } catch (error) {
      console.error(`Error deleting context from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get context statistics
   */
  async getContextStats(): Promise<{
    totalContexts: number;
    activeContexts: number;
    byType: Record<string, number>;
    byScope: Record<string, number>;
    topRules: Array<{
      contextId: string;
      contextName: string;
      ruleCount: number;
    }>;
  }> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      // Get counts
      const countsResult = await session.run(`
        MATCH (c:FormContext)
        RETURN count(c) as total, 
               sum(CASE WHEN c.active = true THEN 1 ELSE 0 END) as active
      `);

      const totalContexts = countsResult.records[0].get("total").toNumber();
      const activeContexts = countsResult.records[0].get("active").toNumber();

      // Get counts by type
      const typeResult = await session.run(`
        MATCH (c:FormContext)
        RETURN c.type as type, count(c) as count
        ORDER BY count DESC
      `);

      const byType: Record<string, number> = {};
      for (const record of typeResult.records) {
        const type = record.get("type");
        const count = record.get("count").toNumber();
        if (type) byType[type] = count;
      }

      // Get counts by scope
      const scopeResult = await session.run(`
        MATCH (c:FormContext)
        RETURN c.scope as scope, count(c) as count
        ORDER BY count DESC
      `);

      const byScope: Record<string, number> = {};
      for (const record of scopeResult.records) {
        const scope = record.get("scope");
        const count = record.get("count").toNumber();
        if (scope) byScope[scope] = count;
      }

      // Get contexts with most rules
      const rulesResult = await session.run(`
        MATCH (c:FormContext)-[:HAS_RULE]->(r:FormContextRule)
        WITH c, count(r) as ruleCount
        ORDER BY ruleCount DESC
        LIMIT 5
        RETURN c.id as contextId, c.name as contextName, ruleCount
      `);

      const topRules = rulesResult.records.map((record) => ({
        contextId: record.get("contextId"),
        contextName: record.get("contextName"),
        ruleCount: record.get("ruleCount").toNumber(),
      }));

      return {
        totalContexts,
        activeContexts,
        byType,
        byScope,
        topRules,
      };
    } catch (error) {
      console.error(`Error getting context stats from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }
}
