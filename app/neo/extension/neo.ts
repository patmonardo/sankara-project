import { Driver, Session, Result, Record, Node, Relationship, auth, driver as neo4jDriver } from 'neo4j-driver';
import { NeoExtension, NeoCore, NeoComponentId, NeoEvent, NeoEntity, NeoRelation } from '../types';

export class Neo4jExtension implements NeoExtension {
  id: NeoComponentId = {
    id: 'neo4j-extension',
    type: 'neo:extension:persistence',
    name: 'Neo4j Database Extension'
  };
  
  type: string = 'persistence';
  capabilities: string[] = ['graph-persistence', 'cypher-query', 'index-management'];
  
  // Neo4j driver instance with proper typing
  private driver: Driver;
  
  // Track persisted entities/relations
  private persistedEntities: Set<string> = new Set();
  private persistedRelations: Set<string> = new Set();
  
  // Map to store active transactions
  private activeTransactions: Map<string, Session> = new Map();
  
  // Reference to Neo core
  private core: NeoCore;
  
  /**
   * Initialize Neo4j extension
   */
  async initialize(core: NeoCore): Promise<void> {
    this.core = core;
    
    // Get Neo4j connection details from config
    const config = core.getConfig('neo4j', {
      uri: 'neo4j://localhost:7687',
      username: 'neo4j',
      password: 'password'
    });
    
    // Connect to Neo4j using proper TypeScript imports
    this.driver = neo4jDriver(
      config.uri,
      auth.basic(config.username, config.password),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2000 // 2 seconds
      }
    );
    
    // Verify connectivity
    try {
      const session = this.driver.session();
      try {
        await session.run('RETURN 1 AS result');
        this.core.logger.info('Neo4j connection established successfully');
      } finally {
        await session.close();
      }
    } catch (error) {
      this.core.logger.error('Failed to connect to Neo4j:', error);
      throw error;
    }
    
    // Set up event listeners for entity/relation changes
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for entity/relation changes
   */
  private setupEventListeners(): void {
    // Listen for entity events
    this.core.on('entity', (event) => {
      if (event.subtype === 'created' || event.subtype === 'updated') {
        this.persistEntity(event.content.entityId);
      } else if (event.subtype === 'removed') {
        this.removeEntityFromNeo4j(event.content.entityId);
      }
    });
    
    // Listen for relation events
    this.core.on('relation', (event) => {
      if (event.subtype === 'created' || event.subtype === 'updated') {
        this.persistRelation(event.content.relationId);
      } else if (event.subtype === 'removed') {
        this.removeRelationFromNeo4j(event.content.relationId);
      }
    });
    
    // Listen for transaction events
    this.core.on('transaction', (event) => {
      if (event.subtype === 'begin') {
        this.beginNeo4jTransaction(event.content.contextId);
      } else if (event.subtype === 'commit') {
        this.commitNeo4jTransaction(event.content.contextId);
      } else if (event.subtype === 'rollback') {
        this.rollbackNeo4jTransaction(event.content.contextId);
      }
    });
  }
  
  /**
   * Persist an entity to Neo4j
   */
  async persistEntity(entityId: string): Promise<void> {
    const entity = NeoEntity.getEntity(entityId);
    if (!entity) return;
    
    // Start a session
    const session = this.driver.session();
    
    try {
      // Create Cypher query for this entity
      const query = `
        MERGE (e:Entity {id: $id})
        SET e.type = $type
        SET e += $properties
        SET e:${this.getCypherSafeLabel(entity.type)}
        RETURN e
      `;
      
      // Execute query
      await session.run(query, {
        id: entity.id,
        type: entity.type,
        properties: this.sanitizeProperties(entity.properties)
      });
      
      // Track as persisted
      this.persistedEntities.add(entityId);
    } finally {
      await session.close();
    }
  }
  
  /**
   * Persist a relation to Neo4j
   */
  async persistRelation(relationId: string): Promise<void> {
    const relation = NeoRelation.getRelation(relationId);
    if (!relation) return;
    
    // Ensure source and target are persisted first
    if (relation.source && !this.persistedEntities.has(relation.source.id)) {
      await this.persistEntity(relation.source.id);
    }
    
    if (relation.target && !this.persistedEntities.has(relation.target.id)) {
      await this.persistEntity(relation.target.id);
    }
    
    // Start a session
    const session = this.driver.session();
    
    try {
      // Create Cypher query for this relation
      const query = `
        MATCH (source:Entity {id: $sourceId})
        MATCH (target:Entity {id: $targetId})
        MERGE (source)-[r:${this.getCypherSafeRelType(relation.type)} {id: $id}]->(target)
        SET r.type = $type
        SET r.subtype = $subtype
        SET r += $properties
        RETURN r
      `;
      
      // Execute query
      await session.run(query, {
        id: relation.id,
        sourceId: relation.source?.id,
        targetId: relation.target?.id,
        type: relation.type,
        subtype: relation.subtype,
        properties: this.sanitizeProperties(relation.content || {})
      });
      
      // Track as persisted
      this.persistedRelations.add(relationId);
    } finally {
      await session.close();
    }
  }
  
  /**
   * Remove an entity from Neo4j
   */
  async removeEntityFromNeo4j(entityId: string): Promise<void> {
    const session = this.driver.session();
    
    try {
      await session.run(
        `MATCH (e:Entity {id: $id}) DETACH DELETE e`,
        { id: entityId }
      );
      
      this.persistedEntities.delete(entityId);
    } finally {
      await session.close();
    }
  }
  
  /**
   * Remove a relation from Neo4j
   */
  async removeRelationFromNeo4j(relationId: string): Promise<void> {
    const session = this.driver.session();
    
    try {
      await session.run(
        `MATCH ()-[r {id: $id}]->() DELETE r`,
        { id: relationId }
      );
      
      this.persistedRelations.delete(relationId);
    } finally {
      await session.close();
    }
  }
  
  /**
   * Handle event for this extension
   */
  handleEvent(event: NeoEvent): void {
    // Handle extension-specific events
    if (event.type === 'extension' && event.target?.id === this.id.id) {
      if (event.subtype === 'query') {
        this.handleQueryRequest(event);
      }
    }
  }
  
  /**
   * Handle a Cypher query request
   */
  private async handleQueryRequest(event: NeoEvent): Promise<void> {
    const { query, parameters, contextId } = event.content || {};
    
    if (!query) {
      this.sendErrorResponse(event, 'No query provided');
      return;
    }
    
    try {
      // Execute the query
      const result = await this.runCypherQuery(query, parameters, contextId);
      
      // Send response
      this.core.emit({
        id: `query-response:${Date.now()}`,
        type: 'extension',
        subtype: 'query-result',
        source: this.id,
        target: event.source,
        content: {
          requestId: event.id,
          result,
          query,
          parameters
        }
      });
    } catch (error) {
      this.sendErrorResponse(event, error instanceof Error ? error.message : String(error));
    }
  }
  
  /**
   * Send an error response for a request
   */
  private sendErrorResponse(request: NeoEvent, errorMessage: string): void {
    this.core.emit({
      id: `error:${Date.now()}`,
      type: 'extension',
      subtype: 'error',
      source: this.id,
      target: request.source,
      content: {
        requestId: request.id,
        error: errorMessage
      }
    });
  }
  
  /**
   * Run a Cypher query
   */
  async runCypherQuery(
    query: string, 
    parameters?: Record<string, any>,
    contextId?: string
  ): Promise<any> {
    // Use transaction if available
    if (contextId && this.activeTransactions.has(contextId)) {
      const tx = this.activeTransactions.get(contextId)!;
      const result = await tx.run(query, parameters || {});
      return this.transformNeo4jResult(result);
    }
    
    // Otherwise use a new session
    const session = this.driver.session();
    try {
      const result = await session.run(query, parameters || {});
      return this.transformNeo4jResult(result);
    } finally {
      await session.close();
    }
  }
  
  /**
   * Transform Neo4j result to a more usable format
   */
  private transformNeo4jResult(result: Result): any {
    const records = result.records.map(record => {
      const transformed: Record<string, any> = {};
      
      record.keys.forEach(key => {
        const value = record.get(key);
        
        if (value instanceof Node) {
          transformed[key] = {
            id: value.properties.id,
            type: value.properties.type,
            properties: {...value.properties},
            labels: value.labels
          };
        } else if (value instanceof Relationship) {
          transformed[key] = {
            id: value.properties.id,
            type: value.type,
            properties: {...value.properties},
            source: value.startNodeElementId,
            target: value.endNodeElementId
          };
        } else {
          transformed[key] = value;
        }
      });
      
      return transformed;
    });
    
    return {
      records,
      summary: {
        counters: result.summary.counters.updates(),
        resultAvailableAfter: result.summary.resultAvailableAfter.toNumber(),
        resultConsumedAfter: result.summary.resultConsumedAfter.toNumber()
      }
    };
  }
  
  /**
   * Begin a Neo4j transaction for a context
   */
  async beginNeo4jTransaction(contextId: string): Promise<void> {
    if (this.activeTransactions.has(contextId)) {
      // Close existing transaction if one exists
      await this.activeTransactions.get(contextId)!.close();
    }
    
    const session = this.driver.session();
    this.activeTransactions.set(contextId, session);
    
    this.core.logger.debug(`Neo4j transaction started for context: ${contextId}`);
  }
  
  /**
   * Commit a Neo4j transaction for a context
   */
  async commitNeo4jTransaction(contextId: string): Promise<void> {
    if (!this.activeTransactions.has(contextId)) {
      this.core.logger.warn(`No active transaction found for context: ${contextId}`);
      return;
    }
    
    const session = this.activeTransactions.get(contextId)!;
    await session.close();
    this.activeTransactions.delete(contextId);
    
    this.core.logger.debug(`Neo4j transaction committed for context: ${contextId}`);
  }
  
  /**
   * Rollback a Neo4j transaction for a context
   */
  async rollbackNeo4jTransaction(contextId: string): Promise<void> {
    if (!this.activeTransactions.has(contextId)) {
      this.core.logger.warn(`No active transaction found for context: ${contextId}`);
      return;
    }
    
    const session = this.activeTransactions.get(contextId)!;
    await session.close();
    this.activeTransactions.delete(contextId);
    
    this.core.logger.debug(`Neo4j transaction rolled back for context: ${contextId}`);
  }
  
  /**
   * Get a Cypher-safe label
   */
  private getCypherSafeLabel(label: string): string {
    // Replace invalid characters for Neo4j labels
    return label.replace(/[^a-zA-Z0-9_]/g, '_');
  }
  
  /**
   * Get a Cypher-safe relationship type
   */
  private getCypherSafeRelType(type: string): string {
    // Replace invalid characters for Neo4j relationship types
    return type.replace(/[^a-zA-Z0-9_]/g, '_');
  }
  
  /**
   * Sanitize properties for Neo4j
   */
  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    if (!properties) return {};
    
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined) {
        continue; // Skip null/undefined values
      }
      
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          // Handle arrays
          result[key] = value.filter(item => item !== null && item !== undefined);
        } else if (value instanceof Date) {
          // Handle dates
          result[key] = value.toISOString();
        } else {
          // Handle nested objects - stringify them
          result[key] = JSON.stringify(value);
        }
      } else {
        // Handle primitive values
        result[key] = value;
      }
    }
    
    return result;
  }
  
  /**
   * Shutdown the extension
   */
  async shutdown(): Promise<void> {
    // Close all active transactions
    for (const [contextId, session] of this.activeTransactions.entries()) {
      try {
        await session.close();
        this.core.logger.debug(`Closed transaction for context: ${contextId}`);
      } catch (error) {
        this.core.logger.error(`Error closing transaction for context ${contextId}:`, error);
      }
    }
    
    this.activeTransactions.clear();
    
    // Close the driver connection
    if (this.driver) {
      await this.driver.close();
      this.core.logger.info('Neo4j driver closed successfully');
    }
  }
}