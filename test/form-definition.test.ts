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

describe('Form Definition Tests', () => {
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

  describe('Basic Form Structure', () => {
    it('should create a form with schema validation', async () => {
      // Skip this test if not connected to Neo4j
      if (!neo.driver) {
        console.log('Skipping test: No Neo4j connection');
        return;
      }
      
      const formDefinition = {
        name: 'User Profile Form',
        type: 'Form',
        schema: {
          type: 'object',
          properties: {
            username: { type: 'string', minLength: 3 },
            email: { type: 'string', format: 'email' },
            age: { type: 'integer', minimum: 18 }
          },
          required: ['username', 'email']
        },
        layout: {
          sections: [
            {
              title: 'Basic Info',
              fields: ['username', 'email']
            },
            {
              title: 'Additional Info',
              fields: ['age']
            }
          ]
        }
      };
      
      // Create the form
      const result = await neo.createEntity(formDefinition);
      expect(result).to.have.property('id');
      
      // Clean up
      await neo.deleteEntity(result.id);
    });
  });
  
  describe('Form with Field Definitions', () => {
    it('should create form fields as separate nodes linked to the form', async () => {
      // Skip this test if not connected to Neo4j
      if (!neo.driver) {
        console.log('Skipping test: No Neo4j connection');
        return;
      }

      // Create form
      const form = await neo.createEntity({
        name: 'Product Form',
        type: 'Form',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            price: { type: 'number' },
            category: { type: 'string', enum: ['Electronics', 'Clothing', 'Food'] }
          }
        }
      });

      // Create field definitions
      const nameField = await neo.createEntity({
        name: 'Product Name',
        type: 'FormField',
        properties: {
          fieldType: 'text',
          key: 'name',
          validation: JSON.stringify({
            required: true,
            minLength: 2
          })
        }
      });

      const priceField = await neo.createEntity({
        name: 'Product Price',
        type: 'FormField',
        properties: {
          fieldType: 'number',
          key: 'price',
          validation: JSON.stringify({
            required: true,
            min: 0
          })
        }
      });

      // Link fields to form
      await neo.createRelationship(
        form.id,
        nameField.id,
        'HAS_FIELD',
        { order: 0 }
      );

      await neo.createRelationship(
        form.id,
        priceField.id,
        'HAS_FIELD',
        { order: 1 }
      );

      // Query to verify
      const session = neo.driver.session();
      try {
        const result = await session.run(`
          MATCH (f:Entity {id: $id})-[r:HAS_FIELD]->(field:Entity)
          RETURN field.name as name, r.order as order
          ORDER BY r.order
        `, { id: form.id });
        
        expect(result.records.length).to.equal(2);
        expect(result.records[0].get('name')).to.equal('Product Name');
        expect(result.records[1].get('name')).to.equal('Product Price');
        
      } finally {
        await session.close();
      }

      // Clean up
      await neo.deleteEntity(form.id, true);
      await neo.deleteEntity(nameField.id);
      await neo.deleteEntity(priceField.id);
    });
  });
  
  describe('Form Inheritance and Extension', () => {
    it('should support forms inheriting from other forms', async () => {
      // Skip this test if not connected to Neo4j
      if (!neo.driver) {
        console.log('Skipping test: No Neo4j connection');
        return;
      }

      // Create base form
      const baseForm = await neo.createEntity({
        name: 'Base Contact Form',
        type: 'Form',
        schema: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            name: { type: 'string' }
          },
          required: ['email']
        }
      });

      // Create extended form
      const extendedForm = await neo.createEntity({
        name: 'Extended Contact Form',
        type: 'Form',
        schema: {
          type: 'object',
          properties: {
            phone: { type: 'string' },
            company: { type: 'string' }
          },
          required: ['phone']
        }
      });

      // Create inheritance relationship
      await neo.createRelationship(
        extendedForm.id,
        baseForm.id,
        'EXTENDS',
        { inheritedAt: new Date().toISOString() }
      );

      // Query to verify
      const session = neo.driver.session();
      try {
        const result = await session.run(`
          MATCH (ext:Entity {id: $id})-[r:EXTENDS]->(base:Entity)
          RETURN base.name as baseName
        `, { id: extendedForm.id });
        
        expect(result.records.length).to.equal(1);
        expect(result.records[0].get('baseName')).to.equal('Base Contact Form');
        
      } finally {
        await session.close();
      }

      // Clean up
      await neo.deleteEntity(baseForm.id);
      await neo.deleteEntity(extendedForm.id);
    });
  });
  
  describe('Form to Dashboard Mapping', () => {
    it('should map form fields to dashboard widget properties', async () => {
      // Skip this test if not connected to Neo4j
      if (!neo.driver) {
        console.log('Skipping test: No Neo4j connection');
        return;
      }

      // Create form
      const dataForm = await neo.createEntity({
        name: 'Sales Data Form',
        type: 'Form',
        schema: {
          type: 'object',
          properties: {
            product: { type: 'string' },
            revenue: { type: 'number' },
            quantity: { type: 'integer' }
          }
        }
      });

      // Create dashboard
      const dashboard = await neo.createEntity({
        name: 'Sales Dashboard',
        type: 'Dashboard',
        properties: {
          description: 'Overview of sales data'
        }
      });

      // Create chart widget
      const chartWidget = await neo.createEntity({
        name: 'Revenue Chart',
        type: 'Widget',
        properties: {
          widgetType: 'barChart',
          config: JSON.stringify({
            dataSource: 'salesData',
            xAxis: 'product',
            yAxis: 'revenue'
          })
        }
      });

      // Connect widget to dashboard
      await neo.createRelationship(
        dashboard.id,
        chartWidget.id,
        'CONTAINS',
        { position: 'main' }
      );

      // Connect form as data source
      await neo.createRelationship(
        chartWidget.id,
        dataForm.id,
        'USES_DATA_FROM',
        { 
          mapping: JSON.stringify({
            product: 'product',
            value: 'revenue'
          })
        }
      );

      // Query to verify
      const session = neo.driver.session();
      try {
        const result = await session.run(`
          MATCH (w:Entity {id: $id})-[r:USES_DATA_FROM]->(f:Entity)
          RETURN f.name as formName, r.mapping as mapping
        `, { id: chartWidget.id });
        
        expect(result.records.length).to.equal(1);
        expect(result.records[0].get('formName')).to.equal('Sales Data Form');
        expect(JSON.parse(result.records[0].get('mapping'))).to.have.property('product');
        
      } finally {
        await session.close();
      }

      // Clean up
      await neo.deleteEntity(dashboard.id, true);
      await neo.deleteEntity(chartWidget.id);
      await neo.deleteEntity(dataForm.id);
    });
  });
});