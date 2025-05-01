import { Neo4jConnection } from './connection';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Reset Neo4j database to empty state
 */
async function resetDatabase() {
  console.log('🚨 RESETTING NEO4J DATABASE 🚨');
  console.log('This will delete ALL nodes and relationships.');
  console.log('Press Ctrl+C within 5 seconds to abort...');
  
  // Safety delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const connection = new Neo4jConnection({
    uri: process.env.NEO4J_URI || 'neo4j://localhost:7687',
    username: process.env.NEO4J_USERNAME || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'neo4j',
    useDefaultDriver: false,
  });
  
  try {
    // Initialize the connection
    console.log('Initializing connection...');
    await connection.initialize();
    
    if (!connection.isInitialized()) {
      throw new Error('Failed to initialize Neo4j connection');
    }
    
    console.log('✅ Connected to Neo4j');
    
    const session = connection.getSession();
    
    // Count existing nodes and relationships before reset
    const countResult = await session.run(`
      MATCH (n)
      OPTIONAL MATCH (n)-[r]-()
      RETURN count(DISTINCT n) as nodeCount, count(DISTINCT r) as relCount
    `);
    
    const record = countResult.records[0];
    const nodeCount = record.get('nodeCount').toNumber ? 
                      record.get('nodeCount').toNumber() : 
                      Number(record.get('nodeCount'));
    const relCount = record.get('relCount').toNumber ? 
                    record.get('relCount').toNumber() : 
                    Number(record.get('relCount'));
                    
    console.log(`Database currently has ${nodeCount} nodes and ${relCount} relationships`);
    
    // Delete all nodes and relationships
    console.log('Deleting all nodes and relationships...');
    
    const deleteResult = await session.run(`
      MATCH (n)
      DETACH DELETE n
    `);
    
    // Verify database is empty
    const verifyResult = await session.run(`
      MATCH (n)
      RETURN count(n) as count
    `);
    
    const emptyCount = verifyResult.records[0].get('count').toNumber ?
                       verifyResult.records[0].get('count').toNumber() :
                       Number(verifyResult.records[0].get('count'));
    
    if (emptyCount === 0) {
      console.log('✅ Database reset successful! Database is now empty.');
    } else {
      console.error(`❌ Reset incomplete. ${emptyCount} nodes still remain.`);
    }
    
    await session.close();
    await connection.close();
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  }
}

// Execute the reset function
resetDatabase()
  .then(() => console.log('Reset operation completed'))
  .catch(err => console.error('Unhandled error:', err));