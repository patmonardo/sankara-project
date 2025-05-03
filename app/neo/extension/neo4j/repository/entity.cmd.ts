import dotenv from 'dotenv';
import { Neo4jConnection } from '../connection'; // Adjust path as needed
import { EntityShapeRepository } from './entity'; // Adjust path as needed
import { EntityShape } from '@/form/schema/entity'; // Adjust path as needed
import { ValueShape, ValueField } from '@/form/morph/form/value'; // Adjust path as needed

dotenv.config(); // Load .env file

async function runEntityTests() {
  console.log('Starting EntityShapeRepository tests...');
  let connection: Neo4jConnection | null = null;
  let entityRepo: EntityShapeRepository | null = null;
  let testEntityId: string | undefined;

  try {
    connection = new Neo4jConnection({
      uri: process.env.NEO4J_URI || "neo4j://localhost:7687",
      username: process.env.NEO4J_USERNAME || "neo4j",
      password: process.env.NEO4J_PASSWORD || "neo4j",
      useDefaultDriver: false,
    });

    console.log("Initializing connection...");
    await connection.initialize();
    console.log("✅ Connected to Neo4j");

    entityRepo = new EntityShapeRepository(connection);

    const testFormId = 'form-cmd-test-001';
    const testKind = 'Value'; // Assuming the FormShape kind is 'Value'

    // Ensure the prerequisite Form node exists. Run this manually in Neo4j Browser if needed:
    // MERGE (f:Form:Value {id: 'form-cmd-test-001', kind: 'Value', name: 'Test Form for Cmd'})

    console.log(`Assuming FormShape with id: ${testFormId} and kind: ${testKind} exists.`);

    // --- Test 1: saveEntity (Create with fields array) ---
    console.log('\n--- Testing saveEntity (Create with fields) ---');
    // Define sample ValueFields - structure matches FormField + ValueField extensions
    const sampleFields: ValueField[] = [
        {
            id: 'email', // Corresponds to a field definition in the FormShape
            value: 'test@example.com', // The instance value to be saved as 'email' property
            //label: 'Email Address', // Included for completeness, but not saved by repo
            //required: true,         // Included for completeness, but not saved by repo
            //originalValue: 'test@example.com', // Example state, not directly saved by current repo logic
            //changed: false,                    // Example state, not directly saved by current repo logic
        },
        {
            id: 'age',
            //label: 'Age',
            value: 30, // The instance value to be saved as 'age' property
            //originalValue: 30,
            //changed: false,
        }
    ];

    // Create data conforming to ValueShape (EntityShape + fields)
    const newEntityData: Partial<ValueShape> = {
      formId: testFormId,
      kind: testKind,
      tags: ['test', 'cmd', 'with-fields'],
      state: { status: 'new', count: 1 }, // Will be stringified
      name: 'Test Entity With Fields',
      description: 'Testing fields array persistence',
      fields: sampleFields, // Include the fields array
    };

    console.log('Attempting to save entity with fields array...');
    // saveEntity should now succeed and store 'email' and 'age' as properties
    const savedEntity = await entityRepo.saveEntity(newEntityData);
    testEntityId = savedEntity.id;
    // The returned 'savedEntity' reflects the input + defaults, including the fields array
    console.log('Saved Entity (Returned by saveEntity):', JSON.stringify(savedEntity, null, 2));
    if (!testEntityId) throw new Error('Failed to get ID from saved entity.');
    console.log(`✅ Entity created/merged with ID: ${testEntityId}`);

    // --- Test 2: getEntityById ---
    console.log('\n--- Testing getEntityById ---');
    // This will currently fetch the node but won't reconstruct the 'fields' array correctly
    // It will return the base EntityShape + the 'email' and 'age' properties directly
    const fetchedEntity = await entityRepo.getEntityById(testEntityId);
    if (!fetchedEntity) {
        console.error(`Error: Could not fetch entity with ID: ${testEntityId}`);
    } else {
        console.log('Fetched Entity (Current getEntityById):', JSON.stringify(fetchedEntity, null, 2));
        const valueEntity = fetchedEntity as ValueShape; // Type assertion for clarity
        // Check if the direct properties exist
        // if (fetchedEntity.email !== 'test@example.com' || fetchedEntity.age !== 30) {
        //     console.warn('Warning: Fetched entity direct properties mismatch!');
        // }
        // Check metadata
        if (fetchedEntity.name !== 'Test Entity With Fields') {
            console.warn('Warning: Fetched entity name mismatch!');
        }
        // Note: fetchedEntity.fields will be missing or incorrect until getEntityById is updated
    }

     // --- Test 3: saveEntity (Update with fields array) ---
    console.log('\n--- Testing saveEntity (Update with fields) ---');
     const updatedFields: ValueField[] = [
        {
            id: 'email',
            label: 'Email Address',
            type: 'email',
            required: true,
            value: 'updated@example.com', // Updated value
            originalValue: 'test@example.com',
            changed: true,
            lastModified: new Date().toISOString(),
        },
        {
            id: 'age',
            label: 'Age',
            type: 'number',
            value: 31, // Updated value
            originalValue: 30,
            changed: true,
            lastModified: new Date().toISOString(),
        }
        // Note: If a field is omitted here, saveEntity won't remove its property
        // Explicitly setting a field value to null/undefined might be needed for removal
    ];
    const updatedData: Partial<ValueShape> = {
      id: testEntityId, // Must provide ID for update
      formId: testFormId, // Usually needed for context, though repo might not use it directly on update
      kind: testKind,     // Usually needed for context
      tags: ['test', 'cmd', 'with-fields', 'updated'], // Update tags
      state: { status: 'updated', count: 2 }, // Update state
      name: 'Test Entity With Fields - Updated', // Update name
      description: 'Test Value Updated', // Update description
      fields: updatedFields, // Include updated fields array
    };

    console.log('Attempting to update entity with fields array...');
    const updatedEntity = await entityRepo.saveEntity(updatedData);
    console.log('Updated Entity (Returned by saveEntity):', JSON.stringify(updatedEntity, null, 2));
    console.log(`✅ Entity updated with ID: ${testEntityId}`);


    // --- Test 4: getEntityById (After Update) ---
    console.log('\n--- Testing getEntityById (After Update) ---');
    const fetchedUpdatedEntity = await entityRepo.getEntityById(testEntityId);
     if (!fetchedUpdatedEntity) {
      console.error(`Error: Could not fetch updated entity with ID: ${testEntityId}`);
    } else {
      console.log('Fetched Updated Entity (Current getEntityById):', JSON.stringify(fetchedUpdatedEntity, null, 2));
       // Check updated direct properties
       if (fetchedUpdatedEntity['email'] !== 'updated@example.com' || fetchedUpdatedEntity['age'] !== 31) {
         console.warn('Warning: Fetched updated entity direct properties mismatch!');
       }
       // Check updated metadata
       if (fetchedUpdatedEntity.name !== 'Test Entity With Fields - Updated' ||
           fetchedUpdatedEntity.tags?.length !== 4 ||
           !fetchedUpdatedEntity.tags?.includes('updated')) {
            console.warn('Warning: Fetched updated entity metadata mismatch!');
       }
       // Note: fetchedUpdatedEntity.fields will still be missing/incorrect
    }

    // --- Test 5: findEntities ---
    console.log('\n--- Testing findEntities ---');
    // This will currently fetch nodes but won't reconstruct the 'fields' array correctly
    const foundByKind = await entityRepo.findEntities({ kind: testKind });
    console.log(`Found ${foundByKind.length} entities by kind '${testKind}'.`);
    if (foundByKind.length > 0) {
        console.log('First Found Entity (Current findEntities):', JSON.stringify(foundByKind[0], null, 2));
    }

    const foundByKindAndTags = await entityRepo.findEntities({ kind: testKind, tags: ['test', 'updated'] });
    console.log(`Found ${foundByKindAndTags.length} entities by kind '${testKind}' and tags ['test', 'updated'].`);
    if (foundByKindAndTags.length === 0 || foundByKindAndTags[0].id !== testEntityId) {
        console.warn('Warning: findEntities by kind and tag did not return expected entity.');
    } else {
        console.log('Found Tagged Entity (Current findEntities):', JSON.stringify(foundByKindAndTags[0], null, 2));
        if (foundByKindAndTags[0]['email'] !== 'updated@example.com') {
             console.warn('Warning: Found tagged entity direct property mismatch!');
        }
    }

    // --- Test 6: deleteEntity ---
    console.log('\n--- Testing deleteEntity ---');
    const deleted = await entityRepo.deleteEntity(testEntityId);
    console.log(`Delete operation for ID ${testEntityId} returned: ${deleted}`);
    if (!deleted) {
        console.warn(`Warning: deleteEntity reported false for ID ${testEntityId}`);
    }
    // Verify deletion
    const verifyFetch = await entityRepo.getEntityById(testEntityId);
    if (verifyFetch === null) {
      console.log(`✅ Verified: Entity ${testEntityId} successfully deleted.`);
    } else {
      console.error(`Error: Entity ${testEntityId} still exists after delete operation.`);
      // Attempt cleanup again if delete failed but entity exists
      console.log(`Attempting cleanup delete for ID: ${testEntityId}`);
      await entityRepo.deleteEntity(testEntityId);
    }

    console.log('\nEntityShapeRepository tests completed successfully (with known limitations in read methods).');

  } catch (error) {
    console.error('\n--- Test Run Failed ---');
    console.error(error);
    // Cleanup attempt if error occurred after creation
    if (testEntityId && entityRepo) {
        try {
            console.log(`\nAttempting cleanup delete after error for ID: ${testEntityId}`);
            await entityRepo.deleteEntity(testEntityId);
        } catch (cleanupError) {
            console.error('Error during error cleanup:', cleanupError);
        }
    }
  } finally {
    if (connection) {
      await connection.close();
      console.log('\nNeo4j connection closed.');
    }
  }
}

runEntityTests();