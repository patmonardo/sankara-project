import { Neo4jConnection } from '../connection';
import { EntityDefinitionRepository } from './entity.def';
import { EntityShapeRepository } from './entity.shape';
import { FormEntityDefinition } from '@/form/schema/entity';
import { FormEntity } from '@/form/schema/entity';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from "dotenv";

dotenv.config();

const NEO4J_URI = process.env.NEO4J_URI || 'neo4j://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

async function testEntityRepositories() {
  console.log('🚀 Starting Entity Repository Test Script...');
  const connection = new Neo4jConnection({
    uri: process.env.NEO4J_URI || "neo4j://localhost:7687",
    username: process.env.NEO4J_USERNAME || "neo4j",
    password: process.env.NEO4J_PASSWORD || "neo4j",
    useDefaultDriver: false,
  });
  const defRepo = new EntityDefinitionRepository(connection);
  const shapeRepo = new EntityShapeRepository(connection);

  const testContextId = `ctx-${uuidv4()}`;
  const testDefinitionId = `edef-${uuidv4()}`;
  const testEntityId = `ent-${uuidv4()}`;

  try {
    await connection.initialize();
    console.log('✅ Neo4j Connection Established');

    // --- Create prerequisite context node ---
    const session = connection.getSession({ defaultAccessMode: 'WRITE' });
    try {
      await session.run('MERGE (c:FormContext {id: $id}) SET c.name = $name', {
        id: testContextId,
        name: "Test Context"
      });
      console.log(`   - Created Context ID: ${testContextId}`);
    } finally {
      await session.close();
    }

    // --- Test EntityDefinitionRepository ---
    console.log('\n🧪 Testing EntityDefinitionRepository...');
    const now = new Date();
    const entityDef: FormEntityDefinition = {
      id: testDefinitionId,
      name: 'Test Entity Def',
      description: 'A test entity definition',
      type: 'TestType',
      schema: { foo: 'bar' },
      tags: ['test', 'entity'],
      validation: [],
      behaviors: [],
      indices: [],
      relations: [],
      createdBy: 'tester',
      contextId: testContextId,
    };
    const savedDef = await defRepo.saveEntityDefinition(entityDef);
    console.log(`   ✅ Created entity definition: ${savedDef.id}`);

    // Fetch definition by ID
    const fetchedDef = await defRepo.getEntityDefinitionById(testDefinitionId);
    if (fetchedDef && fetchedDef.id === testDefinitionId) {
      console.log(`   ✅ Fetched entity definition: ${fetchedDef.name}`);
    } else {
      throw new Error('❌ Failed to fetch entity definition by ID');
    }

    // --- Test EntityShapeRepository ---
    console.log('\n🧪 Testing EntityShapeRepository...');
    const entity: FormEntity = {
      id: testEntityId,
      name: 'Test Entity',
      description: 'A test entity instance',
      type: 'TestType',
      schema: { foo: 'bar', num: 42 },
      tags: ['test', 'instance'],
      createdAt: now.getTime(),
      updatedAt: now.getTime(),
      createdBy: 'tester',
      contextId: testContextId,
      definitionId: testDefinitionId,
    };
    const savedEntity = await shapeRepo.saveEntity(entity);
    console.log(`   ✅ Created entity: ${savedEntity.id}`);

    // Fetch entity by ID
    const fetchedEntity = await shapeRepo.getEntityById(testEntityId);
    if (fetchedEntity && fetchedEntity.id === testEntityId) {
      console.log(`   ✅ Fetched entity: ${fetchedEntity.name}`);
    } else {
      throw new Error('❌ Failed to fetch entity by ID');
    }

    // Find entities by type
    const foundEntities = await shapeRepo.findEntities({ name: 'Test Entity', limit: 10 });
    if (foundEntities.some(e => e.id === testEntityId)) {
      console.log(`   ✅ Found entity by type`);
    } else {
      throw new Error('❌ Failed to find entity by type');
    }

    // Count entities by type
    const entityCount = await shapeRepo.countEntities({ type: 'TestType' });
    console.log(`   ✅ Counted entities of type 'TestType': ${entityCount}`);

    // --- Cleanup ---
    console.log('\n🧹 Cleaning up test data...');
    await shapeRepo.deleteEntity(testEntityId);
    console.log('   ✅ Deleted test entity');
    await defRepo.deleteEntityDefinition(testDefinitionId);
    console.log('   ✅ Deleted test entity definition');

    // Optionally delete context node if desired
    // const cleanupSession = connection.getSession({ defaultAccessMode: 'WRITE' });
    // await cleanupSession.run('MATCH (c:FormContext {id: $id}) DETACH DELETE c', { id: testContextId });
    // await cleanupSession.close();

    console.log('\n🎉 Entity Repository Test Script Completed Successfully!');
  } catch (error) {
    console.error('\n❌ ERROR DURING ENTITY REPOSITORY TEST:', error);
  } finally {
    await connection.close();
    console.log('\nClosing connection...');
    console.log('✅ Connection closed.');
  }
}

testEntityRepositories();