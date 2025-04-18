import { CreateModePipeline } from "./pipeline";
import { CreateSystemPipeline } from "./system";
import { CreateOutput } from "./pipeline";
import { CreateContext } from "../mode";
import { FormShape } from "../../schema/form";

// --- 1. Minimal Sample Input Shape ---
const sampleShape: FormShape = {
  id: "simpleForm1",
  fields: [
    {
      id: "firstName",
      type: "text",
      label: "First Name",
      // No inputType here as it should be determined by pipeline
      visible: true,
      required: true,
      meta: {
        description: "Your legal first name",
      },
    },
    {
      id: "age",
      type: "number",
      label: "Age",
      required: false,
      meta: {
        description: "Your current age in years",
        min: 0,
        max: 120,
      },
    },
    {
      id: "email",
      type: "string",
      label: "Email Address",
      required: true,
      meta: {
        format: "email",
        description: "Your contact email",
      },
    },
  ],
  layout: {
    sections: [
      {
        id: "main",
        title: "Personal Information",
        fields: ["firstName", "age", "email"],
      },
    ],
  },
};

// --- 2. Minimal Create Context ---
const sampleContext: CreateContext = {
  id: "createContext1",
  name: "Create Context for Simple Form",
  timestamp: Date.now(),
  mode: "create", // Explicitly set mode
  prakāra: "sṛṣṭi", // Internal representation
  initialValues: {
    firstName: "John", // Pre-populated value
    email: "john@example.com", // Pre-populated value
  },
};

// --- 3. Execute the Standard Create Pipeline ---
console.log("--- Input Shape ---");
console.log(JSON.stringify(sampleShape, null, 2));
console.log("\n--- Context ---");
console.log(JSON.stringify(sampleContext, null, 2));

try {
  // Execute the pipeline with our sample shape and context
  const resultShape = CreateSystemPipeline.apply(sampleShape, sampleContext);
  
  console.log("\n--- Output Shape ---");
  console.log(JSON.stringify(resultShape, null, 2));
  
  // Validate key aspects of the result to confirm correct transformation
  console.log("\n--- Validation Checks ---");
  console.log(`Mode correctly set: ${resultShape.mode === 'create'}`);
  console.log(`Fields initialized: ${resultShape.meta?.fieldsInitialized?.length || 0} of ${resultShape.fields.length}`);
  console.log(`First name value set: ${resultShape.fields.find(f => f.id === 'firstName')?.value === 'John'}`);
  console.log(`Age initialized with default: ${resultShape.fields.find(f => f.id === 'age')?.value === null}`);
  console.log(`Email value set: ${resultShape.fields.find(f => f.id === 'email')?.value === 'john@example.com'}`);
  console.log(`Input types correctly determined: ${
    resultShape.fields.every(f => f.inputType !== undefined)
  }`);
  
} catch (error) {
  console.error("\n--- Error during Morph Execution ---");
  console.error(error);
}

// --- 4. Additional Test: Create with No Initial Values ---
console.log("\n\n=== TEST 2: Create with No Initial Values ===");

const emptyContext: CreateContext = {
  id: "createContext2",
  name: "Empty Create Context",
  timestamp: Date.now(),
  mode: "create",
  // No initialValues provided
};

try {
  const emptyResult = CreateSystemPipeline.apply(sampleShape, emptyContext);
  
  console.log("\n--- Output with Empty Context ---");
  console.log(JSON.stringify(emptyResult, null, 2));
  
  // Validate that default values were properly applied
  console.log("\n--- Empty Context Validation Checks ---");
  console.log(`All fields initialized: ${emptyResult.fields.every(f => f.hasOwnProperty('value'))}`);
  console.log(`Required fields validated: ${
    emptyResult.fields
      .filter(f => f.required)
      .every(f => emptyResult.meta?.validation?.invalidFields?.includes(f.id))
  }`);
  
} catch (error) {
  console.error("\n--- Error during Empty Context Execution ---");
  console.error(error);
}

// --- 5. Run the tests ---
console.log("\n\n=== All Tests Complete ===");
console.log("Use these tests to verify create mode transformations are working correctly");