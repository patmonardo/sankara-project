import { Neo4jConnection } from "../connection";
import { FormProperty } from "@/form/schema/property";

/**
 * PropertyShapeRepository
 *
 * Manages the persistence of Property Shapes (Instances) in Neo4j,
 * representing the contextual determinations of what entities ARE
 * within bounded contexts.
 */
export class PropertyShapeRepository {
  // Renamed class
  private connection: Neo4jConnection;

  constructor(connection: Neo4jConnection) {
    this.connection = connection;
  }

  /**
   * Save a property shape to Neo4j
   */
  async saveProperty(property: FormProperty): Promise<FormProperty> {
    const session = this.connection.getSession({ defaultAccessMode: "WRITE" }); // Use WRITE mode
    const txc = session.beginTransaction();
    const now = Date.now(); // Use a consistent timestamp for update

    try {
      // Create/Update property node
      await txc.run(
        `
        MERGE (p:FormProperty {id: $id})
        SET p.name = $name,
            p.description = $description,
            p.propertyType = $propertyType,
            p.contextId = $contextId

        // Set optional fields directly if not null, otherwise remove
        SET p.entityId = $entityId,
            p.relationId = $relationId,
            p.derivedFrom = $derivedFrom,
            p.scriptId = $scriptId

        // Handle staticValue carefully
        FOREACH (__ IN CASE WHEN $hasStaticValue THEN [1] ELSE [] END |
          SET p.staticValue = $staticValue)
        FOREACH (__ IN CASE WHEN NOT $hasStaticValue THEN [1] ELSE [] END |
          REMOVE p.staticValue)

        // Handle qualitative characteristics
        SET p.qualitative_essential = $essential,
            p.qualitative_observable = $observable,
            p.qualitative_mutable = $mutable,
            p.qualitative_inherent = $inherent

        // Handle quantitative characteristics
        SET p.quantitative_dataType = $dataType,
            p.quantitative_unit = $unit,
            p.quantitative_precision = $precision,
            p.quantitative_min = $min, // Store directly, handle nulls
            p.quantitative_max = $max  // Store directly, handle nulls

        RETURN p
      `,
        {
          id: property.id,
          name: property.name,
          description: property.description || "",
          propertyType: property.propertyType,
          contextId: property.contextId,
          entityId: property.entityId || null,
          relationId: property.relationId || null,
          hasStaticValue:
            property.staticValue !== undefined && property.staticValue !== null,
          staticValue:
            property.staticValue !== undefined && property.staticValue !== null
              ? typeof property.staticValue === "object"
                ? JSON.stringify(property.staticValue)
                : property.staticValue
              : null,
          derivedFrom: property.derivedFrom || null,
          scriptId: property.scriptId || null,
          // Pass numeric timestamps directly
          createdAt: property.createdAt || now, // Use now if createdAt is missing
          updatedAt: now, // Always use current time for updatedAt
          // Qualitative
          essential: property.qualitative?.essential || false,
          observable: property.qualitative?.observable || false,
          mutable: property.qualitative?.mutable || false,
          inherent: property.qualitative?.inherent || false,
          // Quantitative
          dataType: property.quantitative?.dataType || null,
          unit: property.quantitative?.unit || null,
          precision: property.quantitative?.precision ?? null, // Use ?? for 0 precision
          min:
            property.quantitative?.range?.min !== undefined
              ? typeof property.quantitative.range.min === "object"
                ? JSON.stringify(property.quantitative.range.min)
                : property.quantitative.range.min
              : null,
          max:
            property.quantitative?.range?.max !== undefined
              ? typeof property.quantitative.range.max === "object"
                ? JSON.stringify(property.quantitative.range.max)
                : property.quantitative.range.max
              : null,
        }
      );

      // ... (rest of the relationship connection logic remains the same) ...
      // Connect to context
      await txc.run(
        `
        MATCH (p:FormProperty {id: $propId})
        MERGE (c:FormContext {id: $contextId}) // Assuming FormContext node exists
        MERGE (p)-[:DEFINED_IN]->(c)
        RETURN c
      `,
        {
          propId: property.id,
          contextId: property.contextId,
        }
      );

      // Connect to entity if specified
      if (property.entityId) {
        await txc.run(
          `
          MATCH (p:FormProperty {id: $propId})
          MERGE (e:FormEntity {id: $entityId}) // Assuming FormEntity node exists
          MERGE (p)-[:BELONGS_TO_ENTITY]->(e)
          RETURN e
        `,
          {
            propId: property.id,
            entityId: property.entityId,
          }
        );
      } else {
        // Optional: Remove relationship if entityId is null/undefined
        await txc.run(
          `
           MATCH (p:FormProperty {id: $propId})-[r:BELONGS_TO_ENTITY]->()
           DELETE r
         `,
          { propId: property.id }
        );
      }

      // Connect to relation if specified
      if (property.relationId) {
        await txc.run(
          `
          MATCH (p:FormProperty {id: $propId})
          MERGE (r:Relation {id: $relationId}) // Assuming Relation node exists
          MERGE (p)-[:BELONGS_TO_RELATION]->(r)
          RETURN r
        `,
          {
            propId: property.id,
            relationId: property.relationId,
          }
        );
      } else {
        // Optional: Remove relationship if relationId is null/undefined
        await txc.run(
          `
           MATCH (p:FormProperty {id: $propId})-[r:BELONGS_TO_RELATION]->()
           DELETE r
         `,
          { propId: property.id }
        );
      }

      // Connect to derived property if specified
      if (property.derivedFrom) {
        await txc.run(
          `
          MATCH (p:FormProperty {id: $propId})
          MERGE (source:FormProperty {id: $sourceId}) // Assuming source FormProperty node exists
          MERGE (p)-[:DERIVED_FROM]->(source)
          RETURN source
        `,
          {
            propId: property.id,
            sourceId: property.derivedFrom,
          }
        );
      } else {
        // Optional: Remove relationship if derivedFrom is null/undefined
        await txc.run(
          `
           MATCH (p:FormProperty {id: $propId})-[r:DERIVED_FROM]->()
           DELETE r
         `,
          { propId: property.id }
        );
      }

      // Connect to script if specified (Property DEFINED_BY Script)
      if (property.scriptId) {
        await txc.run(
          `
          MATCH (p:FormProperty {id: $propId})
          MERGE (script:FormPropertyDefinition {id: $scriptId}) // Assuming definition node exists
          MERGE (p)-[:DEFINED_BY]->(script) // Or COMPUTED_BY? Use DEFINED_BY for consistency?
          RETURN script
        `,
          {
            propId: property.id,
            scriptId: property.scriptId,
          }
        );
      } else {
        // Optional: Remove relationship if scriptId is null/undefined
        await txc.run(
          `
           MATCH (p:FormProperty {id: $propId})-[r:DEFINED_BY]->() // Or COMPUTED_BY?
           DELETE r
         `,
          { propId: property.id }
        );
      }

      await txc.commit();

      // Refetch the property to ensure all data is consistent after save
      const savedProperty = await this.getPropertyById(property.id);
      return savedProperty!; // Assuming getPropertyById returns the saved property or throws
    } catch (error) {
      console.error(`Error saving property shape to Neo4j: ${error}`);
      await txc.rollback();
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get a property shape by ID
   */
  async getPropertyById(id: string): Promise<FormProperty | null> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      // Simplified query focusing on FormProperty and its direct links
      const result = await session.run(
        `
        MATCH (p:FormProperty {id: $id})
        RETURN p
      `,
        { id }
      );

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      const prop = record.get("p").properties;

      // Parse static value if stored as string
      let staticValue = prop.staticValue;
      try {
        if (
          typeof staticValue === "string" &&
          (staticValue.startsWith("{") || staticValue.startsWith("["))
        ) {
          staticValue = JSON.parse(staticValue);
        }
      } catch (e) {
        /* Keep as string */
      }

      // Build qualitative object
      const qualitative: any = {};
      if (
        prop.qualitative_essential !== undefined &&
        prop.qualitative_essential !== null
      )
        qualitative.essential = prop.qualitative_essential;
      if (
        prop.qualitative_observable !== undefined &&
        prop.qualitative_observable !== null
      )
        qualitative.observable = prop.qualitative_observable;
      if (
        prop.qualitative_mutable !== undefined &&
        prop.qualitative_mutable !== null
      )
        qualitative.mutable = prop.qualitative_mutable;
      if (
        prop.qualitative_inherent !== undefined &&
        prop.qualitative_inherent !== null
      )
        qualitative.inherent = prop.qualitative_inherent;

      // Build quantitative object
      const quantitative: any = {};
      if (
        prop.quantitative_dataType !== undefined &&
        prop.quantitative_dataType !== null
      )
        quantitative.dataType = prop.quantitative_dataType;
      if (
        prop.quantitative_unit !== undefined &&
        prop.quantitative_unit !== null
      )
        quantitative.unit = prop.quantitative_unit;
      if (
        prop.quantitative_precision !== undefined &&
        prop.quantitative_precision !== null
      ) {
        // Neo4j might return Integer or Float, ensure it's a number
        quantitative.precision =
          typeof prop.quantitative_precision === "number"
            ? prop.quantitative_precision
            : parseFloat(prop.quantitative_precision);
      }

      // Parse range values
      if (
        prop.quantitative_min !== undefined ||
        prop.quantitative_max !== undefined
      ) {
        let min = prop.quantitative_min;
        let max = prop.quantitative_max;

        try {
          if (
            typeof min === "string" &&
            (min.startsWith("{") || min.startsWith("["))
          ) {
            min = JSON.parse(min);
          }
        } catch (e) {
          /* Keep as string */
        }

        try {
          if (
            typeof max === "string" &&
            (max.startsWith("{") || max.startsWith("["))
          ) {
            max = JSON.parse(max);
          }
        } catch (e) {
          /* Keep as string */
        }

        quantitative.range = {};
        if (min !== undefined && min !== null) quantitative.range.min = min;
        if (max !== undefined && max !== null) quantitative.range.max = max;
      }

      return {
        id: prop.id,
        name: prop.name,
        description: prop.description,
        propertyType: prop.propertyType,
        contextId: prop.contextId, // Direct property
        entityId: prop.entityId, // Direct property
        relationId: prop.relationId, // Direct property
        staticValue: staticValue,
        derivedFrom: prop.derivedFrom, // Direct property
        scriptId: prop.scriptId, // Direct property
        qualitative:
          Object.keys(qualitative).length > 0 ? qualitative : undefined,
        quantitative:
          Object.keys(quantitative).length > 0 ? quantitative : undefined,
        // Ensure dates are parsed correctly from Neo4j DateTime objects to number
        createdAt: prop.createdAt
          ? new Date(prop.createdAt.toString()).getTime()
          : Date.now(),
        updatedAt: prop.updatedAt
          ? new Date(prop.updatedAt.toString()).getTime()
          : Date.now(),
      };
    } catch (error) {
      console.error(`Error getting property shape from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Find property shapes by context
   */
  async findPropertiesByFormContext(
    contextId: string
  ): Promise<FormProperty[]> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      // Fetch full property data directly instead of just IDs
      const result = await session.run(
        `
        MATCH (p:FormProperty {contextId: $contextId})
        RETURN p
      `,
        { contextId }
      );

      const properties: FormProperty[] = [];
      for (const record of result.records) {
        // Re-use parsing logic from getPropertyById (consider extracting to helper)
        const prop = record.get("p").properties;
        let staticValue = prop.staticValue;
        try {
          if (
            typeof staticValue === "string" &&
            (staticValue.startsWith("{") || staticValue.startsWith("["))
          ) {
            staticValue = JSON.parse(staticValue);
          }
        } catch (e) {}
        const qualitative: any = {};
        if (
          prop.qualitative_essential !== undefined &&
          prop.qualitative_essential !== null
        )
          qualitative.essential = prop.qualitative_essential;
        // ... (add other qualitative/quantitative parsing) ...
        const quantitative: any = {};
        if (
          prop.quantitative_dataType !== undefined &&
          prop.quantitative_dataType !== null
        )
          quantitative.dataType = prop.quantitative_dataType;
        // ...

        properties.push({
          id: prop.id,
          name: prop.name,
          description: prop.description,
          propertyType: prop.propertyType,
          contextId: prop.contextId,
          entityId: prop.entityId,
          relationId: prop.relationId,
          staticValue: staticValue,
          derivedFrom: prop.derivedFrom,
          scriptId: prop.scriptId,
          qualitative:
            Object.keys(qualitative).length > 0 ? qualitative : undefined,
          quantitative:
            Object.keys(quantitative).length > 0 ? quantitative : undefined,
          // Use getTime() for consistency
          createdAt: prop.createdAt
            ? new Date(prop.createdAt.toString()).getTime()
            : Date.now(),
          updatedAt: prop.updatedAt
            ? new Date(prop.updatedAt.toString()).getTime()
            : Date.now(),
        });
      }
      return properties;
    } catch (error) {
      console.error(
        `Error finding property shapes by context in Neo4j: ${error}`
      );
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Find property shapes by entity
   */
  async findPropertiesByFormEntity(entityId: string): Promise<FormProperty[]> {
    const session = this.connection.getSession({ defaultAccessMode: "READ" });

    try {
      // Fetch full property data directly
      const result = await session.run(
        `
        MATCH (p:FormProperty {entityId: $entityId}) // Simpler match if entityId is direct property
        RETURN p
      `,
        { entityId }
      );

      const properties: FormProperty[] = [];
      for (const record of result.records) {
        // Re-use parsing logic from getPropertyById (consider extracting to helper)
        const prop = record.get("p").properties;
        let staticValue = prop.staticValue;
        try {
          if (
            typeof staticValue === "string" &&
            (staticValue.startsWith("{") || staticValue.startsWith("["))
          ) {
            staticValue = JSON.parse(staticValue);
          }
        } catch (e) {}
        const qualitative: any = {};
        if (
          prop.qualitative_essential !== undefined &&
          prop.qualitative_essential !== null
        )
          qualitative.essential = prop.qualitative_essential;
        // ... (add other qualitative/quantitative parsing) ...
        const quantitative: any = {};
        if (
          prop.quantitative_dataType !== undefined &&
          prop.quantitative_dataType !== null
        )
          quantitative.dataType = prop.quantitative_dataType;
        // ...

        properties.push({
          id: prop.id,
          name: prop.name,
          description: prop.description,
          propertyType: prop.propertyType,
          contextId: prop.contextId,
          entityId: prop.entityId,
          relationId: prop.relationId,
          staticValue: staticValue,
          derivedFrom: prop.derivedFrom,
          scriptId: prop.scriptId,
          qualitative:
            Object.keys(qualitative).length > 0 ? qualitative : undefined,
          quantitative:
            Object.keys(quantitative).length > 0 ? quantitative : undefined,
          // Use getTime() for consistency
          createdAt: prop.createdAt
            ? new Date(prop.createdAt.toString()).getTime()
            : Date.now(),
          updatedAt: prop.updatedAt
            ? new Date(prop.updatedAt.toString()).getTime()
            : Date.now(),
        });
      }
      return properties;
    } catch (error) {
      console.error(
        `Error finding property shapes by entity in Neo4j: ${error}`
      );
      throw error;
    } finally {
      await session.close();
    }
  }

  // Consider extracting the parsing logic into a private helper method
  // private _mapNodeToProps(prop: Record<string, any>): FormProperty { ... }
}
