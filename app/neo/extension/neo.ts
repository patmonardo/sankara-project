import { NeoCore, NeoExtension as INeoExtension } from '../neo';
import { NeoEvent } from '../event';
import neo4j from 'neo4j-driver';

/**
 * Resource Handle - Serializable reference to a resource
 */
export interface ResourceHandle {
  id: string;         // Unique identifier for the handle
  type: string;       // Resource type (agent, task, model, etc.)
  name: string;       // Resource name
  reference: {        // Serializable reference information
    id: string;       // Implementation-specific ID
    [key: string]: any; // Additional reference properties
  };
}

/**
 * Transcendental Form Definition
 */
export interface FormDefinition {
  id: string;
  type: 'entity' | 'relation' | 'context';
  name: string;
  schema: {
    properties: Record<string, {
      type: string;
      required?: boolean;
      default?: any;
      description?: string;
    }>;
    relations?: Array<{
      name: string;
      target: string;
      cardinality: 'one' | 'many';
      description?: string;
    }>;
  };
  metadata?: Record<string, any>;
}

/**
 * Neo Extension - Transcendental Form Management
 * 
 * Handles:
 * - Transcendental Forms (Entity, Relation, Context definitions)
 * - Neo4j graph database integration
 * - Resource handle management
 */
export class NeoExtension implements INeoExtension {
  id = 'neo';
  type = 'transcendental';
  capabilities = [
    'form.management',    // Form definition management
    'graph.storage',      // Graph data storage
    'graph.query',        // Graph querying 
    'resource.management' // Resource handle management
  ];
  
  private core: NeoCore | null = null;
  private driver: neo4j.Driver | null = null;
  private resources = new ResourceRegistry();
  
  constructor(private config: {
    neo4j: {
      uri: string;
      user: string; 
      password: string;
      database?: string;
    }
  }) {}
  
  /**
   * Initialize with Neo core
   */
  async initialize(core: NeoCore): Promise<void> {
    this.core = core;
    
    console.log('[Neo] Initializing Transcendental Form Manager');
    
    // Connect to Neo4j
    try {
      this.driver = neo4j.driver(
        this.config.neo4j.uri,
        neo4j.auth.basic(this.config.neo4j.user, this.config.neo4j.password),
        { maxConnectionPoolSize: 50 }
      );
      
      // Verify connection
      const session = this.driver.session({
        database: this.config.neo4j.database || 'neo4j'
      });
      
      try {
        await session.run('RETURN 1 AS result');
        console.log('[Neo] Connected to Neo4j successfully');
      } finally {
        await session.close();
      }
      
      // Set up constraints and indexes
      await this.initializeSchema();
    } catch (error) {
      console.error('[Neo] Failed to connect to Neo4j:', error);
      throw error;
    }
    
    // Set up event handlers
    this.setupEventHandlers();
    
    console.log('[Neo] Transcendental Form Manager initialized');
  }
  
  /**
   * Initialize Neo4j schema (constraints and indexes)
   */
  private async initializeSchema(): Promise<void> {
    if (!this.driver) return;
    
    const session = this.driver.session({
      database: this.config.neo4j.database || 'neo4j'
    });
    
    try {
      // Create constraints for entities
      await session.run(`
        CREATE CONSTRAINT form_id IF NOT EXISTS
        FOR (f:Form)
        REQUIRE f.id IS UNIQUE
      `);
      
      await session.run(`
        CREATE CONSTRAINT entity_id IF NOT EXISTS
        FOR (e:Entity)
        REQUIRE e.id IS UNIQUE
      `);
      
      await session.run(`
        CREATE CONSTRAINT relation_id IF NOT EXISTS
        FOR (r:Relation)
        REQUIRE r.id IS UNIQUE
      `);
      
      await session.run(`
        CREATE CONSTRAINT context_id IF NOT EXISTS
        FOR (c:Context)
        REQUIRE c.id IS UNIQUE
      `);
      
      // Create indexes for name properties
      await session.run(`
        CREATE INDEX form_name IF NOT EXISTS
        FOR (f:Form)
        ON (f.name)
      `);
      
      await session.run(`
        CREATE INDEX entity_type IF NOT EXISTS
        FOR (e:Entity)
        ON (e.type)
      `);
      
      console.log('[Neo] Neo4j schema initialized');
    } catch (error) {
      console.error('[Neo] Failed to initialize Neo4j schema:', error);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    if (!this.core) return;
    
    // Form operations
    this.core.dialectic.onEvent('neo.form.create', this.handleFormCreate.bind(this));
    this.core.dialectic.onEvent('neo.form.get', this.handleFormGet.bind(this));
    this.core.dialectic.onEvent('neo.form.update', this.handleFormUpdate.bind(this));
    this.core.dialectic.onEvent('neo.form.delete', this.handleFormDelete.bind(this));
    this.core.dialectic.onEvent('neo.form.list', this.handleFormList.bind(this));
    
    // Entity operations
    this.core.dialectic.onEvent('neo.entity.create', this.handleEntityCreate.bind(this));
    this.core.dialectic.onEvent('neo.entity.get', this.handleEntityGet.bind(this));
    this.core.dialectic.onEvent('neo.entity.update', this.handleEntityUpdate.bind(this));
    this.core.dialectic.onEvent('neo.entity.delete', this.handleEntityDelete.bind(this));
    this.core.dialectic.onEvent('neo.entity.list', this.handleEntityList.bind(this));
    
    // Relation operations
    this.core.dialectic.onEvent('neo.relation.create', this.handleRelationCreate.bind(this));
    this.core.dialectic.onEvent('neo.relation.get', this.handleRelationGet.bind(this));
    
    // Context operations
    this.core.dialectic.onEvent('neo.context.create', this.handleContextCreate.bind(this));
    this.core.dialectic.onEvent('neo.context.get', this.handleContextGet.bind(this));
    
    // Graph operations
    this.core.dialectic.onEvent('neo.graph.query', this.handleGraphQuery.bind(this));
    this.core.dialectic.onEvent('neo.graph.update', this.handleGraphUpdate.bind(this));
    
    // Resource operations
    this.core.dialectic.onEvent('neo.resource.get', this.handleResourceGet.bind(this));
  }

  /**
   * Handle form creation
   */
  private async handleFormCreate(event: NeoEvent): Promise<void> {
    if (!this.driver) {
      this.emitError(event, 'Neo4j driver not initialized');
      return;
    }

    try {
      const formDef: FormDefinition = event.content;
      
      if (!formDef.id) {
        formDef.id = `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Validate form definition
      this.validateFormDefinition(formDef);
      
      const session = this.driver.session({
        database: this.config.neo4j.database || 'neo4j'
      });
      
      try {
        // Store form definition in Neo4j
        const result = await session.run(
          `
          CREATE (f:Form:Transcendental {
            id: $id,
            type: $type,
            name: $name,
            schema: $schema,
            metadata: $metadata,
            created: datetime(),
            createdBy: $createdBy
          })
          RETURN f
          `,
          {
            id: formDef.id,
            type: formDef.type,
            name: formDef.name,
            schema: JSON.stringify(formDef.schema),
            metadata: JSON.stringify(formDef.metadata || {}),
            createdBy: event.source || 'system'
          }
        );
        
        if (result.records.length === 0) {
          throw new Error('Failed to create form');
        }
        
        // Register as a resource
        const handle = this.resources.register('form', formDef, formDef.name);
        
        this.emitSuccess(event, {
          form: formDef,
          handle
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      this.emitError(event, `Form creation error: ${error.message}`);
    }
  }

  /**
   * Validate form definition
   */
  private validateFormDefinition(formDef: FormDefinition): void {
    if (!formDef.name) {
      throw new Error('Form name is required');
    }
    
    if (!formDef.type || !['entity', 'relation', 'context'].includes(formDef.type)) {
      throw new Error('Form type must be entity, relation, or context');
    }
    
    if (!formDef.schema || !formDef.schema.properties) {
      throw new Error('Form schema with properties is required');
    }
    
    // Validate properties
    for (const [key, prop] of Object.entries(formDef.schema.properties)) {
      if (!prop.type) {
        throw new Error(`Property ${key} must have a type`);
      }
    }
    
    // Additional validation for relation forms
    if (formDef.type === 'relation' && !formDef.schema.relations) {
      throw new Error('Relations schema is required for relation forms');
    }
  }

  /**
   * Handle form retrieval
   */
  private async handleFormGet(event: NeoEvent): Promise<void> {
    if (!this.driver) {
      this.emitError(event, 'Neo4j driver not initialized');
      return;
    }
    
    try {
      const { id } = event.content;
      
      if (!id) {
        this.emitError(event, 'Form ID is required');
        return;
      }
      
      const session = this.driver.session({
        database: this.config.neo4j.database || 'neo4j'
      });
      
      try {
        const result = await session.run(
          `
          MATCH (f:Form {id: $id})
          RETURN f
          `,
          { id }
        );
        
        if (result.records.length === 0) {
          this.emitError(event, `Form not found: ${id}`);
          return;
        }
        
        const formNode = result.records[0].get('f');
        const form: FormDefinition = {
          id: formNode.properties.id,
          type: formNode.properties.type,
          name: formNode.properties.name,
          schema: JSON.parse(formNode.properties.schema),
          metadata: formNode.properties.metadata ? JSON.parse(formNode.properties.metadata) : {}
        };
        
        this.emitSuccess(event, { form });
      } finally {
        await session.close();
      }
    } catch (error) {
      this.emitError(event, `Form retrieval error: ${error.message}`);
    }
  }

  /**
   * Handle form update
   */
  private async handleFormUpdate(event: NeoEvent): Promise<void> {
    if (!this.driver) {
      this.emitError(event, 'Neo4j driver not initialized');
      return;
    }
    
    try {
      const { id, updates } = event.content;
      
      if (!id) {
        this.emitError(event, 'Form ID is required');
        return;
      }
      
      if (!updates) {
        this.emitError(event, 'Updates are required');
        return;
      }
      
      const session = this.driver.session({
        database: this.config.neo4j.database || 'neo4j'
      });
      
      try {
        // Build update query
        const updateProps: string[] = [];
        const params: Record<string, any> = { id };
        
        if (updates.name) {
          updateProps.push('f.name = $name');
          params.name = updates.name;
        }
        
        if (updates.schema) {
          updateProps.push('f.schema = $schema');
          params.schema = JSON.stringify(updates.schema);
        }
        
        if (updates.metadata) {
          updateProps.push('f.metadata = $metadata');
          params.metadata = JSON.stringify(updates.metadata);
        }
        
        if (updateProps.length === 0) {
          this.emitError(event, 'No valid updates provided');
          return;
        }
        
        // Add updated timestamp
        updateProps.push('f.updated = datetime()');
        updateProps.push('f.updatedBy = $updatedBy');
        params.updatedBy = event.source || 'system';
        
        const result = await session.run(
          `
          MATCH (f:Form {id: $id})
          SET ${updateProps.join(', ')}
          RETURN f
          `,
          params
        );
        
        if (result.records.length === 0) {
          this.emitError(event, `Form not found: ${id}`);
          return;
        }
        
        const formNode = result.records[0].get('f');
        const form: FormDefinition = {
          id: formNode.properties.id,
          type: formNode.properties.type,
          name: formNode.properties.name,
          schema: JSON.parse(formNode.properties.schema),
          metadata: formNode.properties.metadata ? JSON.parse(formNode.properties.metadata) : {}
        };
        
        this.emitSuccess(event, { form });
      } finally {
        await session.close();
      }
    } catch (error) {
      this.emitError(event, `Form update error: ${error.message}`);
    }
  }

  /**
   * Handle form deletion
   */
  private async handleFormDelete(event: NeoEvent): Promise<void> {
    if (!this.driver) {
      this.emitError(event, 'Neo4j driver not initialized');
      return;
    }
    
    try {
      const { id } = event.content;
      
      if (!id) {
        this.emitError(event, 'Form ID is required');
        return;
      }
      
      const session = this.driver.session({
        database: this.config.neo4j.database || 'neo4j'
      });
      
      try {
        const result = await session.run(
          `
          MATCH (f:Form {id: $id})
          DETACH DELETE f
          RETURN count(*) as deleted
          `,
          { id }
        );
        
        const deleted = result.records[0].get('deleted').toInt();
        
        if (deleted === 0) {
          this.emitError(event, `Form not found: ${id}`);
          return;
        }
        
        // Remove from resource registry if registered
        this.resources.remove(id);
        
        this.emitSuccess(event, { deleted: true });
      } finally {
        await session.close();
      }
    } catch (error) {
      this.emitError(event, `Form deletion error: ${error.message}`);
    }
  }

  /**
   * Handle form listing
   */
  private async handleFormList(event: NeoEvent): Promise<void> {
    if (!this.driver) {
      this.emitError(event, 'Neo4j driver not initialized');
      return;
    }
    
    try {
      const { type, limit = 100, offset = 0 } = event.content || {};
      
      const session = this.driver.session({
        database: this.config.neo4j.database || 'neo4j'
      });
      
      try {
        let query = `
          MATCH (f:Form)
        `;
        
        const params: Record<string, any> = {
          limit: parseInt(limit),
          offset: parseInt(offset)
        };
        
        if (type) {
          query += `WHERE f.type = $type `;
          params.type = type;
        }
        
        query += `
          RETURN f
          ORDER BY f.name
          SKIP $offset
          LIMIT $limit
        `;
        
        const result = await session.run(query, params);
        
        const forms = result.records.map(record => {
          const formNode = record.get('f');
          return {
            id: formNode.properties.id,
            type: formNode.properties.type,
            name: formNode.properties.name,
            schema: JSON.parse(formNode.properties.schema),
            metadata: formNode.properties.metadata ? JSON.parse(formNode.properties.metadata) : {}
          };
        });
        
        // Get total count
        const countResult = await session.run(
          `
          MATCH (f:Form)
          ${type ? 'WHERE f.type = $type' : ''}
          RETURN count(f) as total
          `,
          type ? { type } : {}
        );
        
        const total = countResult.records[0].get('total').toInt();
        
        this.emitSuccess(event, { 
          forms,
          pagination: {
            total,
            limit: params.limit,
            offset: params.offset,
            page: Math.floor(params.offset / params.limit) + 1,
            pages: Math.ceil(total / params.limit)
          }
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      this.emitError(event, `Form list error: ${error.message}`);
    }
  }

  /**
   * Handle entity creation
   */
  private async handleEntityCreate(event: NeoEvent): Promise<void> {
    if (!this.driver) {
      this.emitError(event, 'Neo4j driver not initialized');
      return;
    }
    
    try {
      const { formId, data } = event.content;
      
      if (!formId) {
        this.emitError(event, 'Form ID is required');
        return;
      }
      
      if (!data) {
        this.emitError(event, 'Entity data is required');
        return;
      }
      
      const session = this.driver.session({
        database: this.config.neo4j.database || 'neo4j'
      });
      
      try {
        // Get form definition
        const formResult = await session.run(
          `
          MATCH (f:Form {id: $formId})
          RETURN f
          `,
          { formId }
        );
        
        if (formResult.records.length === 0) {
          this.emitError(event, `Form not found: ${formId}`);
          return;
        }
        
        const formNode = formResult.records[0].get('f');
        const form: FormDefinition = {
          id: formNode.properties.id,
          type: formNode.properties.type,
          name: formNode.properties.name,
          schema: JSON.parse(formNode.properties.schema),
          metadata: formNode.properties.metadata ? JSON.parse(formNode.properties.metadata) : {}
        };
        
        if (form.type !== 'entity') {
          this.emitError(event, `Form ${formId} is not an entity form`);
          return;
        }
        
        // Validate data against schema
        this.validateEntityData(data, form);
        
        // Generate entity ID if not provided
        const entityId = data.id || `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Store entity in Neo4j
        const entityResult = await session.run(
          `
          CREATE (e:Entity {
            id: $id,
            formId: $formId,
            type: $type,
            data: $data,
            created: datetime(),
            createdBy: $createdBy
          })
          WITH e
          MATCH (f:Form {id: $formId})
          CREATE (e)-[:DEFINED_BY]->(f)
          RETURN e
          `,
          {
            id: entityId,
            formId,
            type: form.name,
            data: JSON.stringify(data),
            createdBy: event.source || 'system'
          }
        );
        
        if (entityResult.records.length === 0) {
          throw new Error('Failed to create entity');
        }
        
        const entityNode = entityResult.records[0].get('e');
        const entity = {
          id: entityNode.properties.id,
          formId: entityNode.properties.formId,
          type: entityNode.properties.type,
          data: JSON.parse(entityNode.properties.data)
        };
        
        // Register as a resource
        const handle = this.resources.register('entity', entity, 
          data.name || `Entity-${entity.id.substring(0, 8)}`);
        
        this.emitSuccess(event, {
          entity,
          handle,
          form
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      this.emitError(event, `Entity creation error: ${error.message}`);
    }
  }

  /**
   * Validate entity data against schema
   */
  private validateEntityData(data: any, form: FormDefinition): void {
    const { properties } = form.schema;
    
    // Check required properties
    for (const [key, prop] of Object.entries(properties)) {
      if (prop.required && data[key] === undefined) {
        throw new Error(`Required property ${key} is missing`);
      }
      
      if (data[key] !== undefined) {
        // Type checking
        const valueType = typeof data[key];
        
        if (prop.type === 'string' && valueType !== 'string') {
          throw new Error(`Property ${key} must be a string`);
        } else if (prop.type === 'number' && valueType !== 'number') {
          throw new Error(`Property ${key} must be a number`);
        } else if (prop.type === 'boolean' && valueType !== 'boolean') {
          throw new Error(`Property ${key} must be a boolean`);
        } else if (prop.type === 'object' && (valueType !== 'object' || Array.isArray(data[key]))) {
          throw new Error(`Property ${key} must be an object`);
        } else if (prop.type === 'array' && !Array.isArray(data[key])) {
          throw new Error(`Property ${key} must be an array`);
        }
      }
    }
  }

  /**
   * Handle entity retrieval
   */
  private async handleEntityGet(event: NeoEvent): Promise<void> {
    if (!this.driver) {
      this.emitError(event, 'Neo4j driver not initialized');
      return;
    }
    
    try {
      const { id } = event.content;
      
      if (!id) {
        this.emitError(event, 'Entity ID is required');
        return;
      }
      
      const session = this.driver.session({
        database: this.config.neo4j.database || 'neo4j'
      });
      
      try {
        const result = await session.run(
          `
          MATCH (e:Entity {id: $id})-[:DEFINED_BY]->(f:Form)
          RETURN e, f
          `,
          { id }
        );
        
        if (result.records.length === 0) {
          this.emitError(event, `Entity not found: ${id}`);
          return;
        }
        
        const entityNode = result.records[0].get('e');
        const formNode = result.records[0].get('f');
        
        const entity = {
          id: entityNode.properties.id,
          formId: entityNode.properties.formId,
          type: entityNode.properties.type,
          data: JSON.parse(entityNode.properties.data)
        };
        
        const form: FormDefinition = {
          id: formNode.properties.id,
          type: formNode.properties.type,
          name: formNode.properties.name,
          schema: JSON.parse(formNode.properties.schema),
          metadata: formNode.properties.metadata ? JSON.parse(formNode.properties.metadata) : {}
        };
        
        this.emitSuccess(event, { 
          entity,
          form
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      this.emitError(event, `Entity retrieval error: ${error.message}`);
    }
  }

  /**
   * Handle entity update
   */
  private async handleEntityUpdate(event: NeoEvent): Promise<void> {
    if (!this.driver) {
      this.emitError(event, 'Neo4j driver not initialized');
      return;
    }
    
    try {
      const { id, data } = event.content;
      
      if (!id) {
        this.emitError(event, 'Entity ID is required');
        return;
      }
      
      if (!data) {
        this.emitError(event, 'Update data is required');
        return;
      }
      
      const session = this.driver.session({
        database: this.config.neo4j.database || 'neo4j'
      });
      
      try {
        // Get entity and form
        const entityResult = await session.run(
          `
          MATCH (e:Entity {id: $id})-[:DEFINED_BY]->(f:Form)
          RETURN e, f
          `,
          { id }
        );
        
        if (entityResult.records.length === 0) {
          this.emitError(event, `Entity not found: ${id}`);
          return;
        }
        
        const entityNode = entityResult.records[0].get('e');
        const formNode = entityResult.records[0].get('f');
        
        const currentData = JSON.parse(entityNode.properties.data);
        const form: FormDefinition = {
          id: formNode.properties.id,
          type: formNode.properties.type,
          name: formNode.properties.name,
          schema: JSON.parse(formNode.properties.schema),
          metadata: formNode.properties.metadata ? JSON.parse(formNode.properties.metadata) : {}
        };
        
        // Merge current data with updates
        const updatedData = { ...currentData, ...data };
        
        // Validate updated data against schema
        this.validateEntityData(updatedData, form);
        
        // Update entity in Neo4j
        const updateResult = await session.run(
          `
          MATCH (e:Entity {id: $id})
          SET e.data = $data, 
              e.updated = datetime(),
              e.updatedBy = $updatedBy
          RETURN e
          `,
          {
            id,
            data: JSON.stringify(updatedData),
            updatedBy: event.source || 'system'
          }
        );
        
        if (updateResult.records.length === 0) {
          throw new Error('Failed to update entity');
        }
        
        const updatedNode = updateResult.records[0].get('e');
        const entity = {
          id: updatedNode.properties.id,
          formId: updatedNode.properties.formId,
          type: updatedNode.properties.type,
          data: JSON.parse(updatedNode.properties.data)
        };
        
        this.emitSuccess(event, {
          entity,
          form
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      this.emitError(event, `Entity update error: ${error.message}`);
    }
  }

  /**
   * Handle entity deletion
   */
  private async handleEntityDelete(event: NeoEvent): Promise<void> {
    if (!this.driver) {
      this.emitError(event, 'Neo4j driver not initialized');
      return;
    }
    
    try {
      const { id } = event.content;
      
      if (!id) {
        this.emitError(event, 'Entity ID is required');
        return;
      }
      
      const session = this.driver.session({
        database: this.config.neo4j.database || 'neo4j'
      });
      
      try {
        const result = await session.run(
          `
          MATCH (e:Entity {id: $id})
          DETACH DELETE e
          RETURN count(*) as deleted
          `,
          { id }
        );
        
        const deleted = result.records[0].get('deleted').toInt();
        
        if (deleted === 0) {
          this.emitError(event, `Entity not found: ${id}`);
          return;
        }
        
        // Remove from resource registry if registered
        this.resources.remove(id);
        
        this.emitSuccess(event, { deleted: true });
      } finally {
        await session.close();
      }
    } catch (error) {
      this.emitError(event, `Entity deletion error: ${error.message}`);
    }
  }

  /**
   * Handle entity listing
   */
  private async handleEntityList(event: NeoEvent): Promise<void> {
    if (!this.driver) {
      this.emitError(event, 'Neo4j driver not initialized');
      return;
    }
    
    try {
      const { formId, type, limit = 100, offset = 0 } = event.content || {};
      
      const session = this.driver.session({
        database: this.config.neo4j.database || 'neo4j'
      });
      
      try {
        let query = `
          MATCH (e:Entity)
        `;
        
        const params: Record<string, any> = {
          limit: parseInt(limit),
          offset: parseInt(offset)
        };
        
        if (formId) {
          query += `WHERE e.formId = $formId `;
          params.formId = formId;
        } else if (type) {
          query += `WHERE e.type = $type `;
          params.type = type;
        }
        
        query += `
          RETURN e
          ORDER BY e.created DESC
          SKIP $offset
          LIMIT $limit
        `;
        
        const result = await session.run(query, params);
        
        const entities = result.records.map(record => {
          const entityNode = record.get('e');
          return {
            id: entityNode.properties.id,
            formId: entityNode.properties.formId,
            type: entityNode.properties.type,
            data: JSON.parse(entityNode.properties.data),
            created: entityNode.properties.created,
            updated: entityNode.properties.updated
          };
        });
        
        // Get total count
        let countQuery = `
          MATCH (e:Entity)
        `;
        
        const countParams: Record<string, any> = {};
        
        if (formId) {
          countQuery += `WHERE e.formId = $formId `;
          countParams.formId = formId;
        } else if (type) {
          countQuery += `WHERE e.type = $type `;
          countParams.type = type;
        }
        
        countQuery += `RETURN count(e) as total`;
        
        const countResult = await session.run(countQuery, countParams);
        const total = countResult.records[0].get('total').toInt();
        
        this.emitSuccess(event, { 
          entities,
          pagination: {
            total,
            limit: params.limit,
            offset: params.offset,
            page: Math.floor(params.offset / params.limit) + 1,
            pages: Math.ceil(total / params.limit)
          }
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      this.emitError(event, `Entity list error: ${error.message}`);
    }
  }

  /**
   * Handle relation creation
   */
  private async handleRelationCreate(event: NeoEvent): Promise<void> {
    if (!this.driver) {
      this.emitError(event, 'Neo4j driver not initialized');
      return;
    }
    
    try {
      const { formId, sourceId, targetId, data } = event.content;
      
      if (!formId) {
        this.emitError(event, 'Form ID is required');
        return;
      }
      
      if (!sourceId) {
        this.emitError(event, 'Source entity ID is required');
        return;
      }
      
      if (!targetId) {
        this.emitError(event, 'Target entity ID is required');
        return;
      }
      
      const session = this.driver.session({
        database: this.config.neo4j.database || 'neo4j'
      });
      
      try {
        // Get relation form
        const formResult = await session.run(
          `
          MATCH (f:Form {id: $formId})
          RETURN f
          `,
          { formId }
        );
        
        if (formResult.records.length === 0) {
          this.emitError(event, `Form not found: ${formId}`);
          return;
        }
        
        const formNode = formResult.records[0].get('f');
        const form: FormDefinition = {
          id: formNode.properties.id,
          type: formNode.properties.type,
          name: formNode.properties.name,
          schema: JSON.parse(formNode.properties.schema),
          metadata: formNode.properties.metadata ? JSON.parse(formNode.properties.metadata) : {}
        };
        
        if (form.type !== 'relation') {
          this.emitError(event, `Form ${formId} is not a relation form`);
          return;
        }
        
        // Check if source and target entities exist
        const entitiesResult = await session.run(
          `
          MATCH (source:Entity {id: $sourceId}), (target:Entity {id: $targetId})
          RETURN source, target
          `,
          { sourceId, targetId }
        );
        
        if (entitiesResult.records.length === 0) {
          this.emitError(event, 'Source or target entity not found');
          return;
        }
        
        // Generate relation ID
        const relationId = `relation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create relation in Neo4j
        const relationResult = await session.run(
          `
          MATCH (source:Entity {id: $sourceId}), (target:Entity {id: $targetId}), (form:Form {id: $formId})
          CREATE (r:Relation {
            id: $id,
            formId: $formId,
            type: $type,
            data: $data,
            sourceId: $sourceId,
            targetId: $targetId,
            created: datetime(),
            createdBy: $createdBy
          })
          CREATE (source)-[rel:${form.name} {relationId: $id}]->(target)
          CREATE (r)-[:DEFINED_BY]->(form)
          CREATE (r)-[:SOURCE]->(source)
          CREATE (r)-[:TARGET]->(target)
          RETURN r, source, target, form
          `,
          {
            id: relationId,
            formId,
            type: form.name,
            data: JSON.stringify(data || {}),
            sourceId,
            targetId,
            createdBy: event.source || 'system'
          }
        );
        
        if (relationResult.records.length === 0) {
          throw new Error('Failed to create relation');
        }
        
        const relationNode = relationResult.records[0].get('r');
        const sourceNode = relationResult.records[0].get('source');
        const targetNode = relationResult.records[0].get('target');
        
        const relation = {
          id: relationNode.properties.id,
          formId: relationNode.properties.formId,
          type: relationNode.properties.type,
          data: JSON.parse(relationNode.properties.data),
          sourceId: relationNode.properties.sourceId,
          targetId: relationNode.properties.targetId,
          source: {
            id: sourceNode.properties.id,
            type: sourceNode.properties.type
          },
          target: {
            id: targetNode.properties.id,
            type: targetNode.properties.type
          }
        };
        
        // Register as a resource
        const handle = this.resources.register('relation', relation, 
          `${form.name}-${relation.id.substring(0, 8)}`);
        
        this.emitSuccess(event, {
          relation,
          handle,
          form
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      this.emitError(event, `Relation creation error: ${error.message}`);
    }
  }

  /**
   * Handle relation retrieval
   */
  private async handleRelationGet(event: NeoEvent): Promise<void> {
    if (!this.driver) {
      this.emitError(event, 'Neo4j driver not initialized');
      return;
    }
    
    try {
      const { id } = event.content;
      
      if (!id) {
        this.emitError(event, 'Relation ID is required');
        return;
      }
      
      const session = this.driver.session({
        database: this.config.neo4j.database || 'neo4j'
      });
      
      try {
        const result = await session.run(
          `
          MATCH (r:Relation {id: $id})-[:DEFINED_BY]->(f:Form)
          MATCH (r)-[:SOURCE]->(source:Entity)
          MATCH (r)-[:TARGET]->(target:Entity)
          RETURN r, f, source, target
          `,
          { id }
        );
        
        if (result.records.length === 0) {
          this.emitError(event, `Relation not found: ${id}`);
          return;
        }
        
        const relationNode = result.records[0].get('r');
        const formNode = result.records[0].get('f');
        const sourceNode = result.records[0].get('source');
        const targetNode = result.records[0].get('target');
        
        const relation = {
          id: relationNode.properties.id,
          formId: relationNode.properties.formId,
          type: relationNode.properties.type,
          data: JSON.parse(relationNode.properties.data),
          sourceId: relationNode.properties.sourceId,
          targetId: relationNode.properties.targetId,
          source: {
            id: sourceNode.properties.id,
            type: sourceNode.properties.type,
            data: JSON.parse(sourceNode.properties.data)
          },
          target: {
            id: targetNode.properties.id,
            type: targetNode.properties.type,
            data: JSON.parse(targetNode.properties.data)
          }
        };
        
        const form: FormDefinition = {
          id: formNode.properties.id,
          type: formNode.properties.type,
          name: formNode.properties.name,
          schema: JSON.parse(formNode.properties.schema),
          metadata: formNode.properties.metadata ? JSON.parse(formNode.properties.metadata) : {}
        };
        
        this.emitSuccess(event, { 
          relation,
          form
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      this.emitError(event, `Relation retrieval error: ${error.message}`);
    }
  }

  /**
   * Handle context creation
   */
  private async handleContextCreate(event: NeoEvent): Promise<void> {
    if (!this.driver) {
      this.emitError(event, 'Neo4j driver not initialized');
      return;
    }
    
    try {
      const { formId, name, entities, relations, data } = event.content;
      
      if (!formId) {
        this.emitError(event, 'Form ID is required');
        return;
      }
      
      if (!name) {
        this.emitError(event, 'Context name is required');
        return;
      }
      
      const session = this.driver.session({
        database: this.config.neo4j.database || 'neo4j'
      });
      
      try {
        // Get context form
        const formResult = await session.run(
          `
          MATCH (f:Form {id: $formId})
          RETURN f
          `,
          { formId }
        );
        
        if (formResult.records.length === 0) {
          this.emitError(event, `Form not found: ${formId}`);
          return;
        }
        
        const formNode = formResult.records[0].get('f');
        const form: FormDefinition = {
          id: formNode.properties.id,
          type: formNode.properties.type,
          name: formNode.properties.name,
          schema: JSON.parse(formNode.properties.schema),
          metadata: formNode.properties.metadata ? JSON.parse(formNode.properties.metadata) : {}
        };
        
        if (form.type !== 'context') {
          this.emitError(event, `Form ${formId} is not a context form`);
          return;
        }
        
        // Generate context ID
        const contextId = `context-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create context in Neo4j
        const contextResult = await session.run(
          `
          CREATE (c:Context {
            id: $id,
            formId: $formId,
            name: $name,
            type: $type,
            data: $data,
            created: datetime(),
            createdBy: $createdBy
          })
          WITH c
          MATCH (f:Form {id: $formId})
          CREATE (c)-[:DEFINED_BY]->(f)
          RETURN c
          `,
          {
            id: contextId,
            formId,
            name,
            type: form.name,
            data: JSON.stringify(data || {}),
            createdBy: event.source || 'system'
          }
        );
        
        if (contextResult.records.length === 0) {
          throw new Error('Failed to create context');
        }
        
        // If entities are provided, link them to the context
        if (entities && Array.isArray(entities) && entities.length > 0) {
          for (const entityId of entities) {
            await session.run(
              `
              MATCH (c:Context {id: $contextId}), (e:Entity {id: $entityId})
              CREATE (c)-[:CONTAINS]->(e)
              `,
              { contextId, entityId }
            );
          }
        }
        
        // If relations are provided, link them to the context
        if (relations && Array.isArray(relations) && relations.length > 0) {
          for (const relationId of relations) {
            await session.run(
              `
              MATCH (c:Context {id: $contextId}), (r:Relation {id: $relationId})
              CREATE (c)-[:CONTAINS_RELATION]->(r)
              `,
              { contextId, relationId }
            );
          }
        }
        
        const contextNode = contextResult.records[0].get('c');
        
        const context = {
          id: contextNode.properties.id,
          formId: contextNode.properties.formId,
          name: contextNode.properties.name,
          type: contextNode.properties.type,
          data: JSON.parse(contextNode.properties.data)
        };
        
        // Register as a resource
        const handle = this.resources.register('context', context, name);
        
        this.emitSuccess(event, {
          context,
          handle,
          form
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      this.emitError(event, `Context creation error: ${error.message}`);
    }
  }

  /**
   * Handle context retrieval
   */
  private async handleContextGet(event: NeoEvent): Promise<void> {
    if (!this.driver) {
      this.emitError(event, 'Neo4j driver not initialized');
      return;
    }
    
    try {
      const { id } = event.content;
      
      if (!id) {
        this.emitError(event, 'Context ID is required');
        return;
      }
      
      const session = this.driver.session({
        database: this.config.neo4j.database || 'neo4j'
      });
      
      try {
        const result = await session.run(
          `
          MATCH (c:Context {id: $id})-[:DEFINED_BY]->(f:Form)
          OPTIONAL MATCH (c)-[:CONTAINS]->(e:Entity)
          OPTIONAL MATCH (c)-[:CONTAINS_RELATION]->(r:Relation)
          RETURN c, f, collect(DISTINCT e) as entities, collect(DISTINCT r) as relations
          `,
          { id }
        );
        
        if (result.records.length === 0) {
          this.emitError(event, `Context not found: ${id}`);
          return;
        }
        
        const contextNode = result.records[0].get('c');
        const formNode = result.records[0].get('f');
        const entityNodes = result.records[0].get('entities');
        const relationNodes = result.records[0].get('relations');
        
        const context = {
          id: contextNode.properties.id,
          formId: contextNode.properties.formId,
          name: contextNode.properties.name,
          type: contextNode.properties.type,
          data: JSON.parse(contextNode.properties.data),
          entities: entityNodes.map((node: any) => ({
            id: node.properties.id,
            type: node.properties.type,
            data: JSON.parse(node.properties.data)
          })),
          relations: relationNodes.map((node: any) => ({
            id: node.properties.id,
            type: node.properties.type,
            sourceId: node.properties.sourceId,
            targetId: node.properties.targetId,
            data: JSON.parse(node.properties.data)
          }))
        };
        
        const form: FormDefinition = {
          id: formNode.properties.id,
          type: formNode.properties.type,
          name: formNode.properties.name,
          schema: JSON.parse(formNode.properties.schema),
          metadata: formNode.properties.metadata ? JSON.parse(formNode.properties.metadata) : {}
        };
        
        this.emitSuccess(event, { 
          context,
          form
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      this.emitError(event, `Context retrieval error: ${error.message}`);
    }
  }

  /**
   * Handle generic Neo4j graph query
   */
  private async handleGraphQuery(event: NeoEvent): Promise<void> {
    if (!this.driver) {
      this.emitError(event, 'Neo4j driver not initialized');
      return;
    }
    
    try {
      const { query, params } = event.content;
      
      if (!query) {
        this.emitError(event, 'Query is required');
        return;
      }
      
      const session = this.driver.session({
        database: this.config.neo4j.database || 'neo4j'
      });
      
      try {
        const result = await session.run(query, params || {});
        
        // Process results
        const processed = this.processNeo4jResult(result);
        
        this.emitSuccess(event, { result: processed });
      } finally {
        await session.close();
      }
    } catch (error) {
      this.emitError(event, `Graph query error: ${error.message}`);
    }
  }

  /**
   * Process Neo4j result into plain objects
   */
  private processNeo4jResult(result: neo4j.QueryResult): any[] {
    const records: any[] = [];
    
    for (const record of result.records) {
      const obj: any = {};
      
      for (const key of record.keys) {
        const value = record.get(key);
        
        if (neo4j.isInt(value)) {
          // Convert Neo4j integers to JavaScript numbers
          obj[key] = value.toNumber();
        } else if (neo4j.isNode(value)) {
          // Process Neo4j nodes
          obj[key] = {
            id: value.identity.toString(),
            labels: value.labels,
            properties: this.processNodeProperties(value.properties)
          };
        } else if (neo4j.isRelationship(value)) {
          // Process Neo4j relationships
          obj[key] = {
            id: value.identity.toString(),
            type: value.type,
            start: value.start.toString(),
            end: value.end.toString(),
            properties: this.processNodeProperties(value.properties)
          };
        } else if (neo4j.isPath(value)) {
          // Process Neo4j paths
          obj[key] = {
            segments: value.segments.map((segment: any) => ({
              start: this.processNodeProperties(segment.start.properties),
              relationship: {
                id: segment.relationship.identity.toString(),
                type: segment.relationship.type,
                properties: this.processNodeProperties(segment.relationship.properties)
              },
              end: this.processNodeProperties(segment.end.properties)
            }))
          };
        } else if (Array.isArray(value)) {
          // Process arrays
          obj[key] = value.map((item: any) => 
            neo4j.isNode(item) ? 
              { 
                id: item.identity.toString(), 
                labels: item.labels, 
                properties: this.processNodeProperties(item.properties) 
              } : 
              neo4j.isRelationship(item) ?
                {
                  id: item.identity.toString(),
                  type: item.type,
                  start: item.start.toString(),
                  end: item.end.toString(),
                  properties: this.processNodeProperties(item.properties)
                } :
                item
          );
        } else {
          obj[key] = value;
        }
      }
      
      records.push(obj);
    }
    
    return records;
  }
  
  /**
   * Process Neo4j node properties
   */
  private processNodeProperties(properties: Record<string, any>): Record<string, any> {
    const processed: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(properties)) {
      if (neo4j.isInt(value)) {
        processed[key] = value.toNumber();
      } else if (typeof value === 'string' && 
                (key === 'data' || key === 'schema' || key === 'metadata')) {
        try {
          processed[key] = JSON.parse(value);
        } catch {
          processed[key] = value;
        }
      } else {
        processed[key] = value;
      }
    }
    
    return processed;
  }

  /**
   * Handle Neo4j graph update
   */
  private async handleGraphUpdate(event: NeoEvent): Promise<void> {
    if (!this.driver) {
      this.emitError(event, 'Neo4j driver not initialized');
      return;
    }
    
    try {
      const { query, params } = event.content;
      
      if (!query) {
        this.emitError(event, 'Query is required');
        return;
      }
      
      const session = this.driver.session({
        database: this.config.neo4j.database || 'neo4j'
      });
      
      try {
        const result = await session.run(query, params || {});
        
        const summary = {
          counters: {
            nodesCreated: result.summary.counters.updates().nodesCreated,
            nodesDeleted: result.summary.counters.updates().nodesDeleted,
            relationshipsCreated: result.summary.counters.updates().relationshipsCreated,
            relationshipsDeleted: result.summary.counters.updates().relationshipsDeleted,
            propertiesSet: result.summary.counters.updates().propertiesSet
          }
        };
        
        this.emitSuccess(event, { 
          result: this.processNeo4jResult(result),
          summary
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      this.emitError(event, `Graph update error: ${error.message}`);
    }
  }

  /**
   * Handle resource retrieval
   */
  private async handleResourceGet(event: NeoEvent): Promise<void> {
    try {
      const { id } = event.content;
      
      if (!id) {
        this.emitError(event, 'Resource ID is required');
        return;
      }
      
      const resource = this.resources.get(id);
      
      if (!resource) {
        this.emitError(event, `Resource not found: ${id}`);
        return;
      }
      
      this.emitSuccess(event, { resource });
    } catch (error) {
      this.emitError(event, `Resource retrieval error: ${error.message}`);
    }
  }

  /**
   * Emit success response
   */
  private emitSuccess(event: NeoEvent, content: any): void {
    // Extract the base event type (e.g., 'neo.form.create' -> 'neo.form')
    const baseParts = event.type.split('.');
    const baseType = baseParts.slice(0, 2).join('.');
    
    this.core?.dialectic.emit({
      type: `${baseType}.response`,
      subtype: 'success',
      content,
      relations: { requestId: event.id }
    });
  }

  /**
   * Emit error response
   */
  private emitError(event: NeoEvent, error: string): void {
    // Extract the base event type (e.g., 'neo.form.create' -> 'neo.form')
    const baseParts = event.type.split('.');
    const baseType = baseParts.slice(0, 2).join('.');
    
    this.core?.dialectic.emit({
      type: `${baseType}.response`,
      subtype: 'error',
      content: { error },
      relations: { requestId: event.id }
    });
  }
}

/**
 * Resource Registry for managing handles to resources
 */
class ResourceRegistry {
  private resources: Map<string, any> = new Map();
  
  /**
   * Register a resource and return a handle
   */
  register(type: string, resource: any, name: string = 'unnamed'): ResourceHandle {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.resources.set(id, resource);
    
    const handle: ResourceHandle = {
      id,
      type,
      name: name || (resource.name || 'unnamed'),
      reference: this.createReference(type, resource)
    };
    
    return handle;
  }
  
  /**
   * Get a resource by handle ID
   */
  get(id: string): any {
    return this.resources.get(id);
  }
  
  /**
   * Remove a resource
   */
  remove(id: string): boolean {
    return this.resources.delete(id);
  }
  
  /**
   * Create a serializable reference for a resource
   */
  private createReference(type: string, resource: any): any {
    if (!resource) return { id: 'null' };
    
    // Extract essential properties based on resource type
    switch (type) {
      case 'form':
        return {
          id: resource.id,
          name: resource.name,
          type: resource.type,
          implementationType: 'transcendental'
        };
        
      case 'entity':
        return {
          id: resource.id,
          formId: resource.formId,
          type: resource.type,
          implementationType: 'transcendental'
        };
        
      case 'relation':
        return {
          id: resource.id,
          formId: resource.formId,
          type: resource.type,
          sourceId: resource.sourceId,
          targetId: resource.targetId,
          implementationType: 'transcendental'
        };
        
      case 'context':
        return {
          id: resource.id,
          formId: resource.formId,
          name: resource.name,
          type: resource.type,
          implementationType: 'transcendental'
        };
        
      default:
        return {
          id: typeof resource === 'object' && resource.id ? resource.id : 'unknown',
          implementationType: 'transcendental'
        };
    }
  }
}

/**
 * Create a Neo Extension
 */
export function createNeoExtension(config: any): NeoExtension {
  return new NeoExtension(config);
}