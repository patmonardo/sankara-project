import { Neo4jConnection } from "../connection";
import { ContextRepository } from "./context.shape"; // Assuming the file is context.ts
import { FormContext } from "@/form/schema/context"; // Adjust path if needed
import * as dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

// Load environment variables
dotenv.config();

/**
 * Test ContextRepository operations
 */
async function testContextRepository() {
  console.log("Testing ContextRepository operations...");
  let connection: Neo4jConnection | null = null;

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
    const contextRepo = new ContextRepository(connection);

    // --- Test Data ---
    const contextId = uuidv4();
    const userId = "user-" + Date.now(); // Example related ID

    // 1. CREATE CONTEXT
    console.log("\n==== CONTEXT OPERATIONS ====");
    console.log("\n📝 CREATING CONTEXT:");

    const sampleContext: FormContext = {
      id: contextId,
      name: "User Session FormContext",
      description: `FormContext for user ${userId}`,
      type: "workflow", // Example context type
      scope: "session", // Example scope
      priority: 1,
      active: true,
      timestamp: Date.now(),
      parentId: undefined, // No parent context
      transactionState: "none",
      // Assuming properties are stored directly or as a JSON string
      properties: {
        userId: userId,
        loginTime: new Date().toISOString(),
        ipAddress: "192.168.1.100",
        permissions: ["read", "write"],
      },
      createdAt: Date.now(), // Assuming ISO string based on potential save logic
      updatedAt: Date.now(),
      // meta: { // Optional, if supported
      //   source: 'auth-service'
      // }
    };

    console.log("FormContext to save:", JSON.stringify(sampleContext, null, 2));
    const savedContext = await contextRepo.saveContext(sampleContext);
    console.log("✅ Saved context:", savedContext.id);

    // 2. GET CONTEXT BY ID
    console.log("\n🔍 GETTING CONTEXT BY ID:");
    const fetchedContext = await contextRepo.getContextById(contextId);
    if (fetchedContext) {
      console.log("Fetched context:", JSON.stringify(fetchedContext, null, 2));
      // Check how properties were retrieved (direct vs. parsed JSON)
      console.log(
        "  - Retrieved properties type:",
        typeof fetchedContext.properties,
        fetchedContext.properties
      );
      // Check timestamps if retrieved
      console.log("  - Retrieved createdAt:", fetchedContext.createdAt);
      console.log("  - Retrieved updatedAt:", fetchedContext.updatedAt);
    } else {
      console.log("❌ FormContext not found!");
    }

    // 3. FIND CONTEXTS (Example: Find by type)
    console.log("\n🔍 FINDING CONTEXTS:");
    const foundContexts = await contextRepo.findContexts({
      type: "workflow",
    });
    console.log(
      `Found ${foundContexts.length} contexts of type 'UserSession':`
    );
    foundContexts.forEach((c) =>
      console.log(`  - ID: ${c.id}, Name: ${c.name}`)
    );

    // 4. DELETE CONTEXT
    console.log("\n==== DELETE OPERATION ====");
    console.log("\n🗑️ DELETING CONTEXT:");
    const deleted = await contextRepo.deleteContext(contextId);
    console.log(`FormContext ${contextId} deleted: ${deleted}`);
    // Verify deletion
    const verifyContext = await contextRepo.getContextById(contextId);
    console.log(
      `Verification - FormContext ${contextId} found: ${!!verifyContext}`
    );
  } catch (error: unknown) {
    // Error handling
    if (error instanceof Error) {
      console.error("\n❌ ERROR OCCURRED:", error.message);
      console.error("Stack trace:", error.stack);
      if ("code" in error) console.error("Error code:", (error as any).code);
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
testContextRepository()
  .then(() => console.log("\nContext repository test completed"))
  .catch((err) =>
    console.error("\nUnhandled error during test execution:", err)
  );
