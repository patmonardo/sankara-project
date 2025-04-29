import neo4j, { Driver } from 'neo4j-driver';

declare global {
  var neo4jDriver: Driver | undefined
}

// Connection configuration using environment variables with defaults
const uri = process.env.NEO4J_URI || 'neo4j://localhost:7687';
const username = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'password';

// Create Neo4j driver instance
const createDriver = () => {
  return neo4j.driver(
    uri,
    neo4j.auth.basic(username, password),
    {
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 5000, // 5 seconds
      disableLosslessIntegers: true // Returns numbers instead of Neo4j Integer objects
    }
  );
};

// Create or reuse driver instance
const driver = global.neo4jDriver || createDriver();

// Save reference in development to prevent reconnection on hot reload
if (process.env.NODE_ENV !== 'production') {
  global.neo4jDriver = driver;
}

// Clean up resources on application exit
const registerShutdownHook = () => {
  const shutdown = async () => {
    if (driver) {
      await driver.close();
      console.log('Neo4j driver connection closed');
    }
  };

  // Handle various termination signals
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received');
    await shutdown();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    console.log('SIGINT signal received');
    await shutdown();
    process.exit(0);
  });
};

// Register shutdown hooks only in production
// In development, we rely on the global reference to persist
if (process.env.NODE_ENV === 'production') {
  registerShutdownHook();
}

export { driver as neo4jDriver };