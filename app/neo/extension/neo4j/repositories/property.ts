import { Neo4jConnection } from '../connection';
import { FormProperty, FormPropertyDefinition } from '@/form/schema/property';

/**
 * PropertyRepository
 * 
 * Manages the persistence of Properties in Neo4j,
 * representing the contextual determinations of what entities ARE
 * within bounded contexts.
 */
export class PropertyRepository {
  private connection: Neo4jConnection;
  
  constructor(connection: Neo4jConnection) {
    this.connection = connection;
  }
  
  /**
   * Save a property to Neo4j
   */
  async saveProperty(property: FormProperty): Promise<FormProperty> {
    const session = this.connection.getSession();
    
    try {
      const txc = session.beginTransaction();
      
      // Create property node
      await txc.run(`
        MERGE (p:FormProperty {id: $id})
        SET p.name = $name,
            p.description = $description,
            p.propertyType = $propertyType,
            p.contextId = $contextId,
            p.created = datetime($created),
            p.updated = datetime($updated)
            
        // Set optional fields
        FOREACH (__ IN CASE WHEN $entityId IS NOT NULL THEN [1] ELSE [] END | 
          SET p.entityId = $entityId)
        
        FOREACH (__ IN CASE WHEN $relationId IS NOT NULL THEN [1] ELSE [] END | 
          SET p.relationId = $relationId)
          
        FOREACH (__ IN CASE WHEN $hasStaticValue THEN [1] ELSE [] END | 
          SET p.staticValue = $staticValue)
          
        FOREACH (__ IN CASE WHEN $derivedFrom IS NOT NULL THEN [1] ELSE [] END | 
          SET p.derivedFrom = $derivedFrom)
          
        FOREACH (__ IN CASE WHEN $scriptId IS NOT NULL THEN [1] ELSE [] END | 
          SET p.scriptId = $scriptId)
        
        RETURN p
      `, {
        id: property.id,
        name: property.name,
        description: property.description || '',
        propertyType: property.propertyType,
        contextId: property.contextId,
        entityId: property.entityId || null,
        relationId: property.relationId || null,
        hasStaticValue: property.staticValue !== undefined,
        staticValue: property.staticValue !== undefined ? 
          (typeof property.staticValue === 'object' ? 
            JSON.stringify(property.staticValue) : 
            property.staticValue) : 
          null,
        derivedFrom: property.derivedFrom || null,
        scriptId: property.scriptId || null,
        created: property.created.toISOString(),
        updated: property.updated.toISOString()
      });
      
      // Handle qualitative characteristics
      if (property.qualitative) {
        await txc.run(`
          MATCH (p:FormProperty {id: $id})
          SET p.qualitative_essential = $essential,
              p.qualitative_observable = $observable,
              p.qualitative_mutable = $mutable,
              p.qualitative_inherent = $inherent
          RETURN p
        `, {
          id: property.id,
          essential: property.qualitative.essential || false,
          observable: property.qualitative.observable || false,
          mutable: property.qualitative.mutable || false,
          inherent: property.qualitative.inherent || false
        });
      }
      
      // Handle quantitative characteristics
      if (property.quantitative) {
        await txc.run(`
          MATCH (p:FormProperty {id: $id})
          
          // Set data type, unit and precision
          FOREACH (__ IN CASE WHEN $dataType IS NOT NULL THEN [1] ELSE [] END | 
            SET p.quantitative_dataType = $dataType)
            
          FOREACH (__ IN CASE WHEN $unit IS NOT NULL THEN [1] ELSE [] END | 
            SET p.quantitative_unit = $unit)
            
          FOREACH (__ IN CASE WHEN $precision IS NOT NULL THEN [1] ELSE [] END | 
            SET p.quantitative_precision = $precision)
          
          // Set range if provided
          FOREACH (__ IN CASE WHEN $hasMin THEN [1] ELSE [] END | 
            SET p.quantitative_min = $min)
            
          FOREACH (__ IN CASE WHEN $hasMax THEN [1] ELSE [] END | 
            SET p.quantitative_max = $max)
            
          RETURN p
        `, {
          id: property.id,
          dataType: property.quantitative.dataType || null,
          unit: property.quantitative.unit || null,
          precision: property.quantitative.precision || null,
          hasMin: property.quantitative.range?.min !== undefined,
          min: property.quantitative.range?.min !== undefined ? 
            (typeof property.quantitative.range.min === 'object' ? 
              JSON.stringify(property.quantitative.range.min) : 
              property.quantitative.range.min) : 
            null,
          hasMax: property.quantitative.range?.max !== undefined,
          max: property.quantitative.range?.max !== undefined ? 
            (typeof property.quantitative.range.max === 'object' ? 
              JSON.stringify(property.quantitative.range.max) : 
              property.quantitative.range.max) : 
            null
        });
      }
      
      // Connect to context
      await txc.run(`
        MATCH (p:FormProperty {id: $propId})
        MERGE (c:Context {id: $contextId})
        MERGE (p)-[:DEFINED_IN]->(c)
        RETURN c
      `, {
        propId: property.id,
        contextId: property.contextId
      });
      
      // Connect to entity if specified
      if (property.entityId) {
        await txc.run(`
          MATCH (p:FormProperty {id: $propId})
          MERGE (e:Entity {id: $entityId})
          MERGE (p)-[:BELONGS_TO_ENTITY]->(e)
          RETURN e
        `, {
          propId: property.id,
          entityId: property.entityId
        });
      }
      
      // Connect to relation if specified
      if (property.relationId) {
        await txc.run(`
          MATCH (p:FormProperty {id: $propId})
          MERGE (r:Relation {id: $relationId})
          MERGE (p)-[:BELONGS_TO_RELATION]->(r)
          RETURN r
        `, {
          propId: property.id,
          relationId: property.relationId
        });
      }
      
      // Connect to derived property if specified
      if (property.derivedFrom) {
        await txc.run(`
          MATCH (p:FormProperty {id: $propId})
          MERGE (source:FormProperty {id: $sourceId})
          MERGE (p)-[:DERIVED_FROM]->(source)
          RETURN source
        `, {
          propId: property.id,
          sourceId: property.derivedFrom
        });
      }
      
      // Connect to script if specified
      if (property.scriptId) {
        await txc.run(`
          MATCH (p:FormProperty {id: $propId})
          MERGE (script:FormPropertyDefinition {id: $scriptId})
          MERGE (p)-[:COMPUTED_BY]->(script)
          RETURN script
        `, {
          propId: property.id,
          scriptId: property.scriptId
        });
      }
      
      await txc.commit();
      
      return property;
    } catch (error) {
      console.error(`Error saving property to Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Save a property script to Neo4j
   */
  async savePropertyDefinition(script: FormPropertyDefinition): Promise<FormPropertyDefinition> {
    const session = this.connection.getSession();
    
    try {
      const txc = session.beginTransaction();
      
      // Create script node
      await txc.run(`
        MERGE (s:FormPropertyDefinition {id: $id})
        SET s.name = $name,
            s.description = $description,
            s.scriptType = $scriptType,
            s.contextId = $contextId,
            s.propertyId = $propertyId,
            s.created = datetime($created),
            s.updated = datetime($updated)
            
        // Set optional fields
        FOREACH (__ IN CASE WHEN $formId IS NOT NULL THEN [1] ELSE [] END | 
          SET s.formId = $formId)
          
        FOREACH (__ IN CASE WHEN $entityId IS NOT NULL THEN [1] ELSE [] END | 
          SET s.entityId = $entityId)
          
        FOREACH (__ IN CASE WHEN $relationId IS NOT NULL THEN [1] ELSE [] END | 
          SET s.relationId = $relationId)
          
        FOREACH (__ IN CASE WHEN $hasInput THEN [1] ELSE [] END | 
          SET s.input = $input)
          
        FOREACH (__ IN CASE WHEN $hasOutput THEN [1] ELSE [] END | 
          SET s.output = $output)
          
        FOREACH (__ IN CASE WHEN $cachingEnabled THEN [1] ELSE [] END | 
          SET s.cachingEnabled = $cachingEnabled,
              s.cachingTtl = $cachingTtl)
        
        RETURN s
      `, {
        id: script.id,
        name: script.name,
        description: script.description || '',
        scriptType: script.scriptType,
        contextId: script.contextId,
        propertyId: script.propertyId,
        formId: script.formId || null,
        entityId: script.entityId || null,
        relationId: script.relationId || null,
        hasInput: script.input !== undefined,
        input: script.input !== undefined ? JSON.stringify(script.input) : null,
        hasOutput: script.output !== undefined,
        output: script.output !== undefined ? JSON.stringify(script.output) : null,
        cachingEnabled: script.caching?.enabled || false,
        cachingTtl: script.caching?.ttl || null,
        created: script.created.toISOString(),
        updated: script.updated.toISOString()
      });
      
      // Store code as a separate node to handle large scripts better
      await txc.run(`
        MATCH (s:FormPropertyDefinition {id: $scriptId})
        MERGE (c:DefinitionCode {scriptId: $scriptId})
        SET c.code = $code
        MERGE (s)-[:HAS_CODE]->(c)
        RETURN c
      `, {
        scriptId: script.id,
        code: script.code.toString()
      });
      
      // Connect to context
      await txc.run(`
        MATCH (s:FormPropertyDefinition {id: $scriptId})
        MERGE (c:Context {id: $contextId})
        MERGE (s)-[:RUNS_IN]->(c)
        RETURN c
      `, {
        scriptId: script.id,
        contextId: script.contextId
      });
      
      // Connect to property
      await txc.run(`
        MATCH (s:FormPropertyDefinition {id: $scriptId})
        MERGE (p:FormProperty {id: $propertyId})
        MERGE (s)-[:COMPUTES]->(p)
        RETURN p
      `, {
        scriptId: script.id,
        propertyId: script.propertyId
      });
      
      // Handle dependencies
      if (script.dependencies && script.dependencies.length > 0) {
        for (const depId of script.dependencies) {
          await txc.run(`
            MATCH (s:FormPropertyDefinition {id: $scriptId})
            MERGE (dep:FormProperty {id: $depId})
            MERGE (s)-[:DEPENDS_ON]->(dep)
            RETURN dep
          `, {
            scriptId: script.id,
            depId: depId
          });
        }
      }
      
      await txc.commit();
      
      return script;
    } catch (error) {
      console.error(`Error saving property script to Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Get a property by ID
   */
  async getPropertyById(id: string): Promise<FormProperty | null> {
    const session = this.connection.getSession({ defaultAccessMode: 'READ' });
    
    try {
      const result = await session.run(`
        MATCH (p:FormProperty {id: $id})
        OPTIONAL MATCH (p)-[:BELONGS_TO_ENTITY]->(e:Entity)
        OPTIONAL MATCH (p)-[:BELONGS_TO_RELATION]->(r:Relation)
        OPTIONAL MATCH (p)-[:DERIVED_FROM]->(source:FormProperty)
        OPTIONAL MATCH (p)-[:COMPUTED_BY]->(script:FormPropertyDefinition)
        RETURN p, e.id as entityId, r.id as relationId, 
               source.id as derivedFrom, script.id as scriptId
      `, { id });
      
      if (result.records.length === 0) {
        return null;
      }
      
      const record = result.records[0];
      const prop = record.get('p').properties;
      const entityId = record.get('entityId');
      const relationId = record.get('relationId');
      const derivedFrom = record.get('derivedFrom');
      const scriptId = record.get('scriptId');
      
      // Parse static value if stored as string
      let staticValue = prop.staticValue;
      try {
        if (typeof staticValue === 'string' && 
            (staticValue.startsWith('{') || staticValue.startsWith('['))) {
          staticValue = JSON.parse(staticValue);
        }
      } catch (e) {
        // Keep as string if parsing fails
      }
      
      // Build qualitative object if any qualitative fields exist
      const qualitative: any = {};
      if (prop.qualitative_essential !== undefined) qualitative.essential = prop.qualitative_essential;
      if (prop.qualitative_observable !== undefined) qualitative.observable = prop.qualitative_observable;
      if (prop.qualitative_mutable !== undefined) qualitative.mutable = prop.qualitative_mutable;
      if (prop.qualitative_inherent !== undefined) qualitative.inherent = prop.qualitative_inherent;
      
      // Build quantitative object if any quantitative fields exist
      const quantitative: any = {};
      if (prop.quantitative_dataType !== undefined) quantitative.dataType = prop.quantitative_dataType;
      if (prop.quantitative_unit !== undefined) quantitative.unit = prop.quantitative_unit;
      if (prop.quantitative_precision !== undefined) {
        quantitative.precision = parseFloat(prop.quantitative_precision);
      }
      
      // Parse range values if they exist
      if (prop.quantitative_min !== undefined || prop.quantitative_max !== undefined) {
        let min = prop.quantitative_min;
        let max = prop.quantitative_max;
        
        try {
          if (typeof min === 'string' && (min.startsWith('{') || min.startsWith('['))) {
            min = JSON.parse(min);
          }
        } catch (e) { /* Keep as string */ }
        
        try {
          if (typeof max === 'string' && (max.startsWith('{') || max.startsWith('['))) {
            max = JSON.parse(max);
          }
        } catch (e) { /* Keep as string */ }
        
        quantitative.range = {
          min,
          max
        };
      }
      
      return {
        id: prop.id,
        name: prop.name,
        description: prop.description,
        propertyType: prop.propertyType,
        contextId: prop.contextId,
        entityId: entityId,
        relationId: relationId,
        staticValue: staticValue,
        derivedFrom: derivedFrom,
        scriptId: scriptId,
        qualitative: Object.keys(qualitative).length > 0 ? qualitative : undefined,
        quantitative: Object.keys(quantitative).length > 0 ? quantitative : undefined,
        created: new Date(prop.created),
        updated: new Date(prop.updated)
      };
    } catch (error) {
      console.error(`Error getting property from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Find properties by context
   */
  async findPropertiesByContext(contextId: string): Promise<FormProperty[]> {
    const session = this.connection.getSession({ defaultAccessMode: 'READ' });
    
    try {
      const result = await session.run(`
        MATCH (p:FormProperty {contextId: $contextId})
        RETURN p.id as id
      `, { contextId });
      
      const properties: FormProperty[] = [];
      
      for (const record of result.records) {
        const id = record.get('id');
        const property = await this.getPropertyById(id);
        
        if (property) {
          properties.push(property);
        }
      }
      
      return properties;
    } catch (error) {
      console.error(`Error finding properties by context in Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Find properties by entity
   */
  async findPropertiesByEntity(entityId: string): Promise<FormProperty[]> {
    const session = this.connection.getSession({ defaultAccessMode: 'READ' });
    
    try {
      const result = await session.run(`
        MATCH (p:FormProperty)-[:BELONGS_TO_ENTITY]->(:Entity {id: $entityId})
        RETURN p.id as id
      `, { entityId });
      
      const properties: FormProperty[] = [];
      
      for (const record of result.records) {
        const id = record.get('id');
        const property = await this.getPropertyById(id);
        
        if (property) {
          properties.push(property);
        }
      }
      
      return properties;
    } catch (error) {
      console.error(`Error finding properties by entity in Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }
}