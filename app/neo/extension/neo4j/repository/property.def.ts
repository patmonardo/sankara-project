import { Neo4jConnection } from '../connection';
import { FormPropertyDefinition } from '@/form/schema/property';

/**
 * PropertyDefinitionRepository
 *
 * Manages the persistence of Property Definitions (Scripts/Computations) in Neo4j.
 * These define HOW a property's value might be derived or computed.
 */
export class PropertyDefinitionRepository {
  private connection: Neo4jConnection;

  constructor(connection: Neo4jConnection) {
    this.connection = connection;
  }

  /**
   * Save a property definition (script) to Neo4j
   */
  async savePropertyDefinition(definition: FormPropertyDefinition): Promise<FormPropertyDefinition> {
    const session = this.connection.getSession({ defaultAccessMode: 'WRITE' });

    try {
      const txc = session.beginTransaction();

      // Create/Update definition node
      await txc.run(`
        MERGE (def:FormPropertyDefinition {id: $id})
        SET def.name = $name,
            def.description = $description,
            def.scriptType = $scriptType,
            def.contextId = $contextId,
            def.propertyId = $propertyId,
            def.created = datetime($created),
            def.updated = datetime($updated)

        // Set optional fields
        FOREACH (__ IN CASE WHEN $formId IS NOT NULL THEN [1] ELSE [] END |
          SET def.formId = $formId)

        FOREACH (__ IN CASE WHEN $entityId IS NOT NULL THEN [1] ELSE [] END |
          SET def.entityId = $entityId)

        FOREACH (__ IN CASE WHEN $relationId IS NOT NULL THEN [1] ELSE [] END |
          SET def.relationId = $relationId)

        FOREACH (__ IN CASE WHEN $hasInput THEN [1] ELSE [] END |
          SET def.input = $input)

        FOREACH (__ IN CASE WHEN $hasOutput THEN [1] ELSE [] END |
          SET def.output = $output)

        FOREACH (__ IN CASE WHEN $cachingEnabled THEN [1] ELSE [] END |
          SET def.cachingEnabled = $cachingEnabled,
              def.cachingTtl = $cachingTtl)

        RETURN def
      `, {
        id: definition.id,
        name: definition.name,
        description: definition.description || '',
        scriptType: definition.scriptType,
        contextId: definition.contextId,
        propertyId: definition.propertyId,
        formId: definition.formId || null,
        entityId: definition.entityId || null,
        relationId: definition.relationId || null,
        hasInput: definition.input !== undefined,
        input: definition.input !== undefined ? JSON.stringify(definition.input) : null,
        hasOutput: definition.output !== undefined,
        output: definition.output !== undefined ? JSON.stringify(definition.output) : null,
        cachingEnabled: definition.caching?.enabled || false,
        cachingTtl: definition.caching?.ttl || null,
        created: definition.created.toISOString(),
        updated: definition.updated.toISOString()
      });

      // Store code as a separate node to handle large scripts better
      await txc.run(`
        MATCH (def:FormPropertyDefinition {id: $definitionId})
        MERGE (code:DefinitionCode {definitionId: $definitionId}) // Link code to definition ID
        SET code.code = $code
        MERGE (def)-[:HAS_CODE]->(code)
        RETURN code
      `, {
        definitionId: definition.id,
        code: definition.code.toString() // Assuming code is stored directly
      });

      // Connect to context
      await txc.run(`
        MATCH (def:FormPropertyDefinition {id: $definitionId})
        MERGE (c:FormContext {id: $contextId}) // Assuming FormContext node exists
        MERGE (def)-[:RUNS_IN]->(c)
        RETURN c
      `, {
        definitionId: definition.id,
        contextId: definition.contextId
      });

      // Connect to property it computes
      await txc.run(`
        MATCH (def:FormPropertyDefinition {id: $definitionId})
        MERGE (p:FormProperty {id: $propertyId}) // Assuming FormProperty node exists
        MERGE (def)-[:COMPUTES]->(p)
        RETURN p
      `, {
        definitionId: definition.id,
        propertyId: definition.propertyId
      });

      // Handle dependencies (assuming dependencies are other FormProperty instances)
      if (definition.dependencies && definition.dependencies.length > 0) {
        for (const depId of definition.dependencies) {
          await txc.run(`
            MATCH (def:FormPropertyDefinition {id: $definitionId})
            MERGE (dep:FormProperty {id: $depId}) // Dependency is a FormProperty
            MERGE (def)-[:DEPENDS_ON]->(dep)
            RETURN dep
          `, {
            definitionId: definition.id,
            depId: depId
          });
        }
      }

      await txc.commit();

      return definition;
    } catch (error) {
      console.error(`Error saving property definition to Neo4j: ${error}`);
      // Consider rolling back transaction if commit failed or error occurred before commit
      // await txc.rollback(); // Neo4j driver might handle this implicitly on error depending on usage
      throw error;
    } finally {
      await session.close();
    }
  }

  // Add methods like getPropertyDefinitionById, findPropertyDefinitionsByContext etc. if needed
}