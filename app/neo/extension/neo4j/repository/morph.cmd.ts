import { Neo4jConnection } from "../connection";
import { MorphRepository } from "./morph.shape";
import { FormMorph, FormMorphPipeline } from "@/form/schema/morph";
import * as dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

// Load environment variables
dotenv.config();

/**
 * Test MorphRepository operations
 */
async function testMorphRepository() {
  console.log("Testing MorphRepository operations...");
  let connection;

  try {
    // Create and initialize connection
    connection = new Neo4jConnection({
      uri: process.env.NEO4J_URI || "neo4j://localhost:7687",
      username: process.env.NEO4J_USERNAME || "neo4j",
      password: process.env.NEO4J_PASSWORD || "neo4j",
      useDefaultDriver: false,
    });

    console.log("Initializing connection...");
    await connection.initialize();
    console.log("✅ Connected to Neo4j");

    // Create repository
    const morphRepo = new MorphRepository(connection);

    // 1. BASIC MORPH OPERATIONS
    console.log("\n==== BASIC MORPH OPERATIONS ====");

    // 1.1. Create a simple morph
    console.log("\n📝 CREATING SIMPLE MORPH:");
    const simpleMorphId = uuidv4();
    const simpleMorph: FormMorph = {
      id: simpleMorphId,
      name: "Test Uppercase Morph",
      description: "Converts text to uppercase",
      inputType: "string",
      outputType: "string",
      transformFn: "function transform(input) { return input.toUpperCase(); }",
      config: {
        preserveWhitespace: true,
      },
    };

    console.log("Simple morph to save:", JSON.stringify(simpleMorph, null, 2));
    const savedSimpleMorph = await morphRepo.saveMorph(simpleMorph);
    console.log("✅ Saved simple morph:", savedSimpleMorph.id);

    // 1.2. Get the morph by ID
    console.log("\n🔍 GETTING MORPH BY ID:");
    const fetchedSimpleMorph = await morphRepo.getMorphById(simpleMorphId);
    console.log(
      "Fetched simple morph:",
      JSON.stringify(fetchedSimpleMorph, null, 2)
    );

    // 1.3. Create a composite morph
    console.log("\n📝 CREATING COMPOSITE MORPH:");
    const compositeMorphId = uuidv4();
    const nonExistentMorphId = uuidv4(); 
    const compositeMorph: FormMorph = {
      id: compositeMorphId,
      name: "Test String Processing Morph",
      description: "Processes strings with multiple steps",
      inputType: "string",
      outputType: "string",
      transformFn: "function transform(input) { return input.toUpperCase(); }",
      composition: {
        type: "composite", // Indicates this is a composite morph definition
        compositionType: "sequential", // How the composed morphs run
        morphs: [ // Array of morph IDs that make up this composite morph
          simpleMorphId, 
          nonExistentMorphId 
        ] 
      },
    };

    console.log(
      "Composite morph to save:",
      JSON.stringify(compositeMorph, null, 2)
    );
    try {
      const savedCompositeMorph = await morphRepo.saveMorph(compositeMorph);
      console.log("✅ Saved composite morph:", savedCompositeMorph.id);
    } catch (error) {
      console.error("❌ Error saving composite morph:", error);
    }

    // 1.4. Find morphs by criteria
    console.log("\n🔍 FINDING MORPHS BY CRITERIA:");
    const foundMorphs = await morphRepo.findMorphs({
      inputType: "string",
      outputType: "string",
    });
    console.log("Found morphs:", JSON.stringify(foundMorphs, null, 2));

    // 2. MORPH PIPELINE OPERATIONS
    console.log("\n==== MORPH PIPELINE OPERATIONS ====");

    // 2.1. Create a morph pipeline
    console.log("\n📝 CREATING MORPH PIPELINE:");
    const pipelineId = uuidv4();
    const pipeline: FormMorphPipeline = {
      id: pipelineId,
      name: "Test Text Processing Pipeline",
      description: "A pipeline for processing text data",
      morphs: [simpleMorphId],
      inputType: "string",
      outputType: "string",
      optimized: false,
      config: {
        validationMode: "strict",
      },
    };

    console.log("Pipeline to save:", JSON.stringify(pipeline, null, 2));
    const savedPipeline = await morphRepo.saveMorphPipeline(pipeline);
    console.log("✅ Saved pipeline:", savedPipeline.id);

    // 2.2. Get the pipeline by ID
    console.log("\n🔍 GETTING PIPELINE BY ID:");
    const fetchedPipeline = await morphRepo.getPipelineById(pipelineId);
    console.log("Fetched pipeline:", JSON.stringify(fetchedPipeline, null, 2));

    // 3. DEBUGGING OPERATIONS
    console.log("\n==== DEBUGGING OPERATIONS ====");

    // 3.1. Direct query to verify morph structure
    console.log("\n🔍 DIRECT QUERY FOR MORPH:");
    const debugSession = connection.getSession();
    try {
      const result = await debugSession.run(
        `
        MATCH (m:Morph {id: $id})
        RETURN m
      `,
        { id: simpleMorphId }
      );

      if (result.records.length > 0) {
        console.log("Direct query result:");
        const props = result.records[0].get("m").properties;
        console.log("- Properties:", JSON.stringify(props, null, 2));

        // Check if config was properly stored
        console.log("- Config stored as:", typeof props.config, props.config);
        if (typeof props.config === "string") {
          try {
            const parsedConfig = JSON.parse(props.config);
            console.log("- Parsed config:", parsedConfig);
          } catch (e) {
            console.error("- Could not parse config:", e);
          }
        }
      } else {
        console.log("❌ No morph found with direct query");
      }
    } finally {
      await debugSession.close();
    }
  } catch (error: unknown) {
    // Error handling
    if (error instanceof Error) {
      console.error("\n❌ ERROR OCCURRED:", error.message);
      console.error("Error name:", error.name);
      console.error("Stack trace:");
      console.error(error.stack);

      // For Neo4j specific errors
      if ("code" in error) {
        console.error("Error code:", (error as any).code);
      }
    } else {
      console.error("\n❌ UNKNOWN ERROR:", error);
    }
  } finally {
    // Clean up
    if (connection) {
      await connection.close();
      console.log("\nConnection closed");
    }
  }
}

// Run the test
testMorphRepository()
  .then(() => console.log("Morph repository test completed"))
  .catch((err) => console.error("Unhandled error:", err));
