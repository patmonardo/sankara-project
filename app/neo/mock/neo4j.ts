import fs from 'fs';
import util from 'util';
import { Session, Transaction } from 'neo4j-driver'; // Import original types for interface compliance

const CYPHER_LOG_FILE = 'generated_cypher.log';

// Helper to format log entries
function logCypher(type: string, query: string, params?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const logEntry = `
// --- ${timestamp} - ${type} ---
// Query:
${query.trim()}

// Params:
${util.inspect(params || {}, { depth: null })}
// -------------------------\n
`;
  try {
    fs.appendFileSync(CYPHER_LOG_FILE, logEntry);
  } catch (err) {
    console.error("Failed to write to cypher log file:", err);
  }
}

class MockNeo4jTransaction implements Partial<Transaction> {
  // Mock the run method to log
  async run(query: string, params?: Record<string, any>): Promise<any> {
    logCypher('Transaction RUN', query, params);
    // Return a minimal mock result to satisfy repository code
    return Promise.resolve({ records: [], summary: {} });
  }

  // Mock commit and rollback
  async commit(): Promise<void> {
    logCypher('Transaction COMMIT', '-- COMMIT --', {});
    return Promise.resolve();
  }
  async rollback(): Promise<void> {
    logCypher('Transaction ROLLBACK', '-- ROLLBACK --', {});
    return Promise.resolve();
  }
  // Add other methods if your code uses them, returning dummy values
  isOpen = () => true;
  close = () => Promise.resolve();
}

class MockNeo4jSession implements Partial<Session> {
  private accessMode: string;

  constructor(options?: { defaultAccessMode?: string }) {
    this.accessMode = options?.defaultAccessMode || 'WRITE';
  }

  // Mock beginTransaction to return the mock transaction
  beginTransaction(): MockNeo4jTransaction {
    logCypher('Session', '-- BEGIN TRANSACTION --', {});
    return new MockNeo4jTransaction();
  }

  // Mock the run method to log
  async run(query: string, params?: Record<string, any>): Promise<any> {
    logCypher(`Session RUN (${this.accessMode})`, query, params);
    // Return a minimal mock result
    return Promise.resolve({ records: [], summary: {} });
  }

  // Mock close
  async close(): Promise<void> {
    logCypher('Session', '-- SESSION CLOSE --', {});
    return Promise.resolve();
  }
  // Add other methods if your code uses them, returning dummy values
  lastBookmark = () => null;
  // ... other Session methods if needed
}

// Mock Connection class
export class MockNeo4jConnection {
  // Mock initialize and close if needed by your setup
  async initialize(): Promise<void> {
    console.log('Mock Neo4j Connection Initialized.');
    // Clear log file at start (optional)
    try {
      fs.writeFileSync(CYPHER_LOG_FILE, `// Cypher Log Started: ${new Date().toISOString()}\n`);
    } catch (err) {
       console.error("Failed to clear cypher log file:", err);
    }
  }
  async close(): Promise<void> {
     console.log('Mock Neo4j Connection Closed.');
  }

  // Return the mock session
  getSession(options?: { defaultAccessMode?: string }): MockNeo4jSession {
    return new MockNeo4jSession(options);
  }
}