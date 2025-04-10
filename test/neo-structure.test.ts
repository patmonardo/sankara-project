import { expect } from 'chai';
import { NeoExtension } from '../app/neo/extension/neo';
import { ConfigurationManager } from '../app/shared/configuration-manager';

// Mock configuration to avoid loading real config during tests
const mockConfig = {
  neo4j: {
    uri: 'bolt://localhost:7687',
    user: 'neo4j',
    password: 'test'
  }
};

describe('Neo4j Structure Tests', () => {
  let neo: NeoExtension;
  
  before(async () => {
    // Create a test instance of NeoExtension with mock config
    const configManager = new ConfigurationManager();
    configManager.config = mockConfig;
    neo = new NeoExtension(configManager);
    
    // Initialize the Neo4j connection for testing
    // Comment this out if you want to run without an actual Neo4j connection
    // await neo.initialize();
  });
  
  after(async () => {
    // Clean up connection if initialized
    if (neo && neo.driver) {
      await neo.driver.close();
    }
  });
  
  describe('Basic Node Structure', () => {
    it('should create and retrieve a simple node', async () => {
      // Skip this test if not connected to Neo4j
      if (!neo.driver) {
        console.log('Skipping test: No Neo4j connection');
        return;
      }
      
      const testNode = {
        name: 'Test Node',
        type: 'TestEntity',
        properties: {
          testProp: 'value'
        }
      };
      
      // Create the node
      const result = await neo.createEntity(testNode);
      expect(result).to.have.property('id');
      
      // Retrieve the node
      const retrieved = await neo.getEntity(result.id);
      expect(retrieved).to.have.property('name', 'Test Node');
      
      // Clean up
      await neo.deleteEntity(result.id);
    });
  });
  
  describe('Form Definition Structure', () => {
    it('should create and retrieve a form definition', async () => {
      // Skip this test if not connected to Neo4j
      if (!neo.driver) {
        console.log('Skipping test: No Neo4j connection');
        return;
      }
      
      const testForm = {
        name: 'Test Form',
        type: 'Form',
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' }
          },
          required: ['title']
        }
      };
      
      // Create the form
      const result = await neo.createEntity(testForm);
      expect(result).to.have.property('id');
      
      // Retrieve the form
      const retrieved = await neo.getEntity(result.id);
      expect(retrieved).to.have.property('name', 'Test Form');
      expect(retrieved).to.have.property('schema');
      
      // Clean up
      await neo.deleteEntity(result.id);
    });
  });
  
  describe('Relationship Structure', () => {
    it('should create and retrieve a relationship between nodes', async () => {
      // Skip this test if not connected to Neo4j
      if (!neo.driver) {
        console.log('Skipping test: No Neo4j connection');
        return;
      }
      
      // Create two nodes
      const sourceNode = await neo.createEntity({
        name: 'Source Node',
        type: 'TestEntity'
      });
      
      const targetNode = await neo.createEntity({
        name: 'Target Node',
        type: 'TestEntity'
      });
      
      // Create relationship
      const relationship = await neo.createRelationship(
        sourceNode.id,
        targetNode.id,
        'CONNECTS_TO',
        { weight: 5 }
      );
      
      expect(relationship).to.have.property('id');
      expect(relationship).to.have.property('type', 'CONNECTS_TO');
      
      // Verify relationship exists
      const relationships = await neo.getRelationships(sourceNode.id);
      expect(relationships).to.be.an('array');
      expect(relationships.length).to.be.at.least(1);
      
      // Clean up
      await neo.deleteRelationship(relationship.id);
      await neo.deleteEntity(sourceNode.id);
      await neo.deleteEntity(targetNode.id);
    });
  });
  
  describe('Dashboard Structure', () => {
    it('should represent a dashboard as a graph structure', async () => {
      // Skip this test if not connected to Neo4j
      if (!neo.driver) {
        console.log('Skipping test: No Neo4j connection');
        return;
      }
      
      // Create a dashboard node
      const dashboard = await neo.createEntity({
        name: 'Test Dashboard',
        type: 'Dashboard',
        properties: {
          description: 'A test dashboard'
        }
      });
      
      // Create widget nodes
      const widget1 = await neo.createEntity({
        name: 'Chart Widget',
        type: 'Widget',
        properties: {
          widgetType: 'chart',
          config: JSON.stringify({
            chartType: 'bar',
            dataSource: 'sample-data'
          })
        }
      });
      
      const widget2 = await neo.createEntity({
        name: 'Table Widget',
        type: 'Widget',
        properties: {
          widgetType: 'table',
          config: JSON.stringify({
            columns: ['name', 'value'],
            dataSource: 'sample-data'
          })
        }
      });
      
      // Connect widgets to dashboard
      await neo.createRelationship(
        dashboard.id,
        widget1.id,
        'CONTAINS',
        { position: 'top-left' }
      );
      
      await neo.createRelationship(
        dashboard.id,
        widget2.id,
        'CONTAINS',
        { position: 'bottom-right' }
      );
      
      // Verify dashboard has widgets
      const session = neo.driver.session();
      try {
        const result = await session.run(`
          MATCH (d:Entity {id: $id})-[r:CONTAINS]->(w:Entity)
          RETURN w.name as name, r.position as position
        `, { id: dashboard.id });
        
        expect(result.records.length).to.equal(2);
        
      } finally {
        await session.close();
      }
      
      // Clean up
      await neo.deleteEntity(dashboard.id, true); // cascade delete relationships
      await neo.deleteEntity(widget1.id);
      await neo.deleteEntity(widget2.id);
    });
  });
});