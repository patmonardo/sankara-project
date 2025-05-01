import { Driver } from 'neo4j-driver';
import { Neo4jConnection } from './connection';
import { Neo4jSchemaManager } from './schema';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Test Neo4j schema initialization
 */
async function testSchema() {
  console.log('Testing Neo4j schema initialization...');
  let connection;
  
  try {
    // Create and initialize connection
    connection = new Neo4jConnection({
      uri: process.env.NEO4J_URI || 'neo4j://localhost:7687',
      username: process.env.NEO4J_USERNAME || 'neo4j',
      password: process.env.NEO4J_PASSWORD || 'neo4j',
      useDefaultDriver: false,
    });
    
    console.log('Initializing connection...');
    await connection.initialize();
    console.log('✅ Connected to Neo4j');
    
    // Create schema manager
    const driver = connection.getDriver();
    const schemaManager = new Neo4jSchemaManager(driver);
    
    // Check current state
    console.log('\n📊 CHECKING CURRENT SCHEMA STATE:');
    await checkConstraintsAndIndexes(driver);
    
    // Test all schema methods
    console.log('\n🔧 INITIALIZING SCHEMA:');
    await schemaManager.initializeSchema();
    console.log('✅ Schema initialized');
    
    console.log('\n🔄 DEFINING RELATIONSHIP TYPES:');
    await schemaManager.defineRelationshipTypes();
    console.log('✅ Relationship types defined');
    
    console.log('\n📝 CREATING PROPERTY TYPE NODES:');
    await schemaManager.createPropertyTypeNodes();
    console.log('✅ Property type nodes created');
    
    console.log('\n📊 CHECKING SCHEMA AFTER INITIALIZATION:');
    await checkConstraintsAndIndexes(driver);
    
    console.log('\n✅ VALIDATING CONSTRAINTS:');
    const validation = await schemaManager.validateConstraints();
    console.log('Validation result:', validation);
    
  } catch (error: any) {
    if (error instanceof Error) {
        console.error('❌ ERROR OCCURRED:', error.message);
        console.error('Error name:', error.name);
        console.error('Stack trace:');
        console.error(error.stack);
    }    
    // For Neo4j specific errors
    if ('code' in error) {
      console.error('Error code:', (error as any).code);
    }
  } finally {
    // Clean up
    if (connection) {
      await connection.close();
      console.log('Connection closed');
    }
  }
}

/**
 * Helper function to check constraints and indexes
 */
async function checkConstraintsAndIndexes(driver: Driver) {
  const session = driver.session();
  try {
    console.log('Checking constraints...');
    const constraintsResult = await session.run('SHOW CONSTRAINTS');
    
    if (constraintsResult.records.length === 0) {
      console.log('No constraints found');
    } else {
      console.log(`Found ${constraintsResult.records.length} constraints:`);
      for (const record of constraintsResult.records) {
        const name = record.get('name') || 'unnamed';
        const description = "hi"; //record.get('description') || 'no description';
        console.log(`- ${name}: ${description}`);
      }
    }
    
    console.log('\nChecking indexes...');
    const indexesResult = await session.run('SHOW INDEXES');
    
    if (indexesResult.records.length === 0) {
      console.log('No indexes found');
    } else {
      console.log(`Found ${indexesResult.records.length} indexes:`);
      for (const record of indexesResult.records) {
        const name = record.get('name') || 'unnamed';
        const description = "hi"; //record.get('description') || 'no description';
        console.log(`- ${name}: ${description}`);
      }
    }
  } finally {
    await session.close();
  }
}

// Run the test
testSchema().catch(err => console.error('Unhandled error:', err));