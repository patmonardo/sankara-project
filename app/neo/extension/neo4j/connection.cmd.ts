import { Neo4jConnection } from './connection';
import * as dotenv from 'dotenv';
import { isInt } from 'neo4j-driver'; // Import the isInt helper

// Load environment variables from .env file
dotenv.config();

/**
 * Simple command-line test for Neo4j connection
 */
async function testConnection() {
  console.log('Testing Neo4j connection...');
  
  // Log environment variable names (not values) to help debug
  console.log('Looking for environment variables:');
  console.log('NEO4J_URI present:', !!process.env.NEO4J_URI);
  console.log('NEO4J_USERNAME present:', !!process.env.NEO4J_USERNAME);
  console.log('NEO4J_PASSWORD present:', !!process.env.NEO4J_PASSWORD);
  
  // Create connection with explicit credentials from environment variables
  const connection = new Neo4jConnection({
    uri: process.env.NEO4J_URI || 'neo4j://localhost:7687',
    username: process.env.NEO4J_USERNAME || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'neo4j', // Default password, change in production!
    useDefaultDriver: false, // Don't use default driver when providing explicit credentials
  });
  
  try {
    // Initialize the connection
    console.log('Initializing connection...');
    await connection.initialize();
    
    if (connection.isInitialized()) {
      console.log('✅ Connection initialized successfully');
      
      // Test a simple query
      const session = connection.getSession();
      console.log('Running test query...');
      
      const result = await session.run(`
        MATCH (n) 
        RETURN count(n) as nodeCount
      `);
      
      // Safely handle the nodeCount value which might be Integer or number
      const nodeCountValue = result.records[0].get('nodeCount');
      const nodeCount = isInt(nodeCountValue) ? nodeCountValue.toNumber() : Number(nodeCountValue);
      
      console.log(`✅ Connected! Found ${nodeCount} nodes in the database`);
      
      // Additional test: check database name
      const dbInfoResult = await session.run('CALL db.info()');
      const dbName = dbInfoResult.records[0].get('name');
      console.log(`✅ Connected to database: ${dbName}`);
      
      await session.close();
    } else {
      console.log('❌ Connection failed to initialize');
    }
    
    // Close the connection
    await connection.close();
    console.log('Connection closed');
    
  } catch (error) {
    console.error('❌ Error testing connection:', error);
  }
}

// Execute the test function
testConnection()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Unhandled error:', err));