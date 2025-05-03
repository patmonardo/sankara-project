import { Neo4jConnection } from './connection'; // Assuming real connection for seeding
import { FormDefinitionRepository } from './repository/schema';
import { EntityRepository } from './repository/entity';
import { ContextRepository } from './repository/context';
import { FormRepository } from './repository/form';
// Import other repositories if needed (Property, Relation)

// Import necessary Types and Zod Schemas from app/form/schema/*
import { FormDefinition } from '@/form/schema/schema';
import { FormEntity } from '@/form/schema/entity';
import { FormContext } from '@/form/schema/context';
import { FormShape } from '@/form/schema/shape'; // Assuming FormShape type exists
// Import other types as needed

import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  let connection: Neo4jConnection | null = null;

  try {
    // --- 1. Establish Connection ---
    connection = new Neo4jConnection();
    const neo4jUri = process.env.NEO4J_URI;
    const neo4jUser = process.env.NEO4J_USERNAME;
    const neo4jPassword = process.env.NEO4J_PASSWORD;

    if (!neo4jUri || !neo4jUser || !neo4jPassword) {
      throw new Error('Missing Neo4j connection details in .env file');
    }

    console.log(`Connecting to Neo4j at ${neo4jUri}...`);
    await connection.initialize(neo4jUri, neo4jUser, neo4jPassword);
    console.log('✅ Neo4j connection established.');

    // --- Optional: Clear existing data (Use with extreme caution!) ---
    // console.warn('⚠️ Clearing existing data...');
    // const clearSession = connection.getSession({ defaultAccessMode: 'WRITE' });
    // try {
    //   await clearSession.run('MATCH (n) DETACH DELETE n');
    //   console.log('✅ Existing data cleared.');
    // } finally {
    //   await clearSession.close();
    // }
    // console.warn('⚠️ Data clearing complete.');

    // --- 2. Initialize Repositories ---
    const formDefRepo = new FormDefinitionRepository(connection);
    const entityRepo = new EntityRepository(connection);
    const contextRepo = new ContextRepository(connection);
    const formRepo = new FormRepository(connection);
    // Initialize other repos...

    // --- 3. Define Sample Data ---

    // Sample Context
    const contextId1 = `ctx-${uuidv4()}`;
    const sampleContext1: Context = {
      id: contextId1,
      name: 'User Profile Context',
      type: 'UserProfile',
      description: 'Context for viewing/editing a user profile',
      properties: JSON.stringify({ role: 'admin', region: 'us-west' }), // Example properties
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Sample FormEntity Definition (within a Form Definition)
    const entityDefId1 = `ent-def-${uuidv4()}`;
    const entityDef1 = { // Assuming structure based on FormEntityDefinitionSchema
        id: entityDefId1,
        name: 'User',
        type: 'Person',
        description: 'Represents a system user',
        schema: { // Example schema properties
            username: { type: 'string', required: true },
            email: { type: 'string', format: 'email' },
            isActive: { type: 'boolean', default: true }
        }
        // Add properties, relations as needed by FormEntityDefinitionSchema
    };

    // Sample Form Definition
    const formDefId1 = `form-def-${uuidv4()}`;
    const sampleFormDefinition: FormDefinition = {
      id: formDefId1,
      name: 'UserProfileDefinition',
      type: 'Profile',
      description: 'Defines the structure for user profiles',
      entities: {
        [entityDefId1]: entityDef1
      },
      contexts: {
        [contextId1]: { // Assuming structure based on FormContextSchema
            id: contextId1,
            name: sampleContext1.name,
            type: sampleContext1.type,
            description: sampleContext1.description
            // Add parentId, priority, scope if needed
        }
      },
      // Add relations, schema, etc. as needed
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Sample FormEntity Shape (Instance)
    const entityId1 = `ent-${uuidv4()}`;
    const sampleEntity1: FormEntity = {
      id: entityId1,
      definitionId: entityDefId1, // Link to definition
      contextId: contextId1,     // Link to context
      name: 'Alice Example',
      type: 'Person', // Matches definition type
      properties: JSON.stringify({ // Instance properties
        username: 'alice_e',
        email: 'alice@example.com',
        isActive: true,
        lastLogin: '2025-05-01T10:00:00Z' // Property not in definition schema
      }),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      // createdBy, etc.
    };

    // Sample Form Shape (Instance) - Assuming a simple structure for now
    const formShapeId1 = `form-${uuidv4()}`;
    const sampleFormShape: FormShape = { // Adjust based on your actual FormShape type
        id: formShapeId1,
        definitionId: formDefId1, // Link to definition
        contextId: contextId1,     // Link to context
        name: 'Alice Profile Form',
        title: 'Alice Example - Profile',
        data: JSON.stringify({ // Instance data for the form fields
            username: 'alice_e', // Could be pre-filled
            email: 'alice@example.com'
        }),
        state: JSON.stringify({ isValid: true, isDirty: false }),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        // Add fields, layout, actions etc. based on FormShape definition
    };


    // --- 4. Save Data using Repositories ---
    console.log('💾 Saving Form Definition...');
    await formDefRepo.saveDefinition(sampleFormDefinition);
    console.log(`✅ Saved Form Definition: ${formDefId1}`);

    console.log('💾 Saving Context Shape...');
    await contextRepo.saveContext(sampleContext1);
    console.log(`✅ Saved Context Shape: ${contextId1}`);

    console.log('💾 Saving FormEntity Shape...');
    await entityRepo.saveEntity(sampleEntity1);
    console.log(`✅ Saved FormEntity Shape: ${entityId1}`);

    console.log('💾 Saving Form Shape...');
    await formRepo.saveForm(sampleFormShape); // Assuming saveForm exists
    console.log(`✅ Saved Form Shape: ${formShapeId1}`);

    // Add calls to save properties, relations etc. if needed

    console.log('🌱 Database seeding completed successfully!');

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Seeding failed:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('❌ Unknown error during seeding:', error);
    }
  } finally {
    if (connection) {
      await connection.close();
      console.log('🔌 Neo4j connection closed.');
    }
  }
}

// Run the seeding function
seedDatabase();