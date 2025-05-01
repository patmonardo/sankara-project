import { Neo4jConnection } from "../connection";
import { FormRepository } from "./form.shape";
import {
  FormShape,
  FormField,
  FormLayout,
  FormSection,
  FormAction,
  FormOption,
} from "@/form/schema/shape"; // Adjust path if needed
import * as dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

// Load environment variables
dotenv.config();

/**
 * Test FormRepository operations
 */
async function testFormRepository() {
  console.log("Testing FormRepository operations...");
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
    const formRepo = new FormRepository(connection);

    // --- Test Data ---
    const formId = uuidv4();
    const fieldId1 = uuidv4();
    const fieldId2 = uuidv4();
    const sectionId1 = uuidv4();
    const actionId1 = uuidv4();

    // 1. CREATE FORM
    console.log("\n==== FORM OPERATIONS ====");
    console.log("\n📝 CREATING FORM:");

    const sampleForm: FormShape = {
      id: formId,
      name: "UserProfileForm",
      title: "User Profile",
      description: "Form to collect user profile information.",
      fields: [
        {
          id: fieldId1,
          type: "text",
          name: "username",
          label: "Username",
          required: true,
          placeholder: "Enter your username",
          validation: { minLength: 3 }, // Stored as JSON string
          defaultValue: "user_" + Date.now(), // Stored as string/number
        },
        {
          id: fieldId2,
          type: "select",
          name: "role",
          label: "Role",
          options: [
            // Stored as nodes + relationships
            { label: "Admin", value: "admin" },
            { label: "Editor", value: "editor" },
            { label: "Viewer", value: "viewer" },
          ],
        },
      ],
      layout: {
        // Stored as nodes + relationships
        title: "Profile Layout",
        columns: "single",
        sections: [
          {
            id: sectionId1,
            name: "basicInfo",
            title: "Basic Information",
            fields: [fieldId1, fieldId2], // References field IDs
          },
        ],
        actions: [
          {
            id: actionId1,
            type: "submit",
            label: "Save Profile",
            primary: true,
          },
        ],
      },
      data: {
        // Stored as JSON string
        initialUsername: "prefilled_user",
      },
      state: {
        // Stored as JSON string
        status: "idle",
      },
      // meta: { // Assuming meta is not directly stored on Form node based on saveForm query
      //   createdBy: 'system',
      // },
      // matter: { // Example matter, stored as JSON string
      //   sourceId: { type: 'entity', entityRef: { entity: 'someSchemaId', id: formId } }
      // }
    };

    console.log("Form to save:", JSON.stringify(sampleForm, null, 2));
    const savedForm = await formRepo.saveForm(sampleForm);
    console.log("✅ Saved form:", savedForm.id);

    // 2. GET FORM BY ID
    console.log("\n🔍 GETTING FORM BY ID:");
    const fetchedForm = await formRepo.getFormById(formId);
    if (fetchedForm) {
      console.log("Fetched form:", JSON.stringify(fetchedForm, null, 2));
      // Check parsing of JSON fields
      console.log(
        "  - Parsed data type:",
        typeof fetchedForm.data,
        fetchedForm.data
      );
      console.log(
        "  - Parsed state type:",
        typeof fetchedForm.state,
        fetchedForm.state
      );
      console.log("  - Fetched fields count:", fetchedForm.fields.length);
      console.log(
        "  - Fetched layout sections count:",
        fetchedForm.layout?.sections?.length ?? 0
      );
      console.log(
        "  - Fetched layout actions count:",
        fetchedForm.layout?.actions?.length ?? 0
      );
      console.log(
        "  - Fetched field options count (field 2):",
        fetchedForm.fields[1]?.options?.length ?? 0
      );
    } else {
      console.log("❌ Form not found!");
    }

    // 3. FIND FORMS
    console.log("\n🔍 FINDING FORMS:");
    // Find by name (adjust criteria as needed)
    const foundForms = await formRepo.findForms({ name: "UserProfileForm" });
    console.log(
      `Found ${foundForms.length} forms matching name 'UserProfileForm':`
    );
    foundForms.forEach((f) => console.log(`  - ID: ${f.id}, Name: ${f.name}`));

    // 4. DELETE FORM
    console.log("\n==== DELETE OPERATION ====");
    console.log("\n🗑️ DELETING FORM:");
    const deleted = await formRepo.deleteForm(formId);
    console.log(`Form ${formId} deleted: ${deleted}`);
    // Verify deletion
    const verifyForm = await formRepo.getFormById(formId);
    console.log(`Verification - Form ${formId} found: ${!!verifyForm}`);
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
testFormRepository()
  .then(() => console.log("\nForm repository test completed"))
  .catch((err) =>
    console.error("\nUnhandled error during test execution:", err)
  );
