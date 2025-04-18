import { CreateModePipeline } from "./pipeline";
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

// --- 2. Create Context with Initial Values ---
const contextWithValues: CreateContext = {
  id: "createContext1",
  name: "Create Context with Initial Values",
  timestamp: Date.now(),
  mode: "create",
  initialValues: {
    firstName: "John",
    email: "john@example.com",
  },
};

console.log("=== PIPELINE TEST 1: Create with Initial Values ===");
console.log("--- Input Shape ---");
console.log(JSON.stringify(sampleShape, null, 2));
console.log("\n--- Context ---");
console.log(JSON.stringify(contextWithValues, null, 2));

try {
  // Test PrepareCreateMorph individually
  const resultShape = CreateModePipeline.apply(sampleShape, contextWithValues);
  
  console.log("\n--- Pipeline Output ---");
  console.log(JSON.stringify(resultShape, null, 2));
  
  // Validate specific pipeline functionality
  console.log("\n--- Pipeline-Specific Validation ---");
  console.log(`Mode correctly set: ${resultShape.mode === 'create'}`);
  console.log(`Fields transformed to CreateFields: ${resultShape.fields.every(f => 'inputType' in f)}`);
  console.log(`Initial values applied: ${resultShape.fields.find(f => f.id === 'firstName')?.value === 'John'}`);
  console.log(`Field meta contains mode='create': ${resultShape.fields.every(f => f.meta?.mode === 'create')}`);
  console.log(`Form meta contains fieldsInitialized: ${Array.isArray(resultShape.meta?.fieldsInitialized)}`);
  console.log(`Fields initialized count: ${resultShape.meta?.fieldsInitialized?.length || 0}`);
  
} catch (error) {
  console.error("\n--- Error in Pipeline Execution ---");
  console.error(error);
}

// --- 3. Empty Context (No Initial Values) ---
console.log("\n\n=== PIPELINE TEST 2: Create with No Initial Values ===");

const emptyContext: CreateContext = {
  id: "createContext2",
  name: "Empty Create Context",
  timestamp: Date.now(),
  mode: "create",
  // No initialValues
};

try {
  const emptyResult = CreateModePipeline.apply(sampleShape, emptyContext);
  
  console.log("\n--- Pipeline Output with Empty Context ---");
  console.log(JSON.stringify(emptyResult, null, 2));
  
  // Validate default value behavior
  console.log("\n--- Default Value Validation ---");
  console.log(`All fields have value property: ${emptyResult.fields.every(f => 'value' in f)}`);
  console.log(`Text field (firstName) default: ${JSON.stringify(emptyResult.fields.find(f => f.id === 'firstName')?.value)}`);
  console.log(`Number field (age) default: ${JSON.stringify(emptyResult.fields.find(f => f.id === 'age')?.value)}`);
  console.log(`Field with format (email) default: ${JSON.stringify(emptyResult.fields.find(f => f.id === 'email')?.value)}`);
  
} catch (error) {
  console.error("\n--- Error in Empty Context Pipeline Execution ---");
  console.error(error);
}

// --- 4. Test for Field Type Processing ---
console.log("\n\n=== PIPELINE TEST 3: Field Type Processing ===");

// Create a form with more diverse field types
const diverseFieldsShape: FormShape = {
  id: "diverseForm",
  fields: [
    { id: "textField", type: "text", label: "Text Field" },
    { id: "numberField", type: "number", label: "Number Field" },
    { id: "booleanField", type: "boolean", label: "Boolean Field" },
    { id: "dateField", type: "date", label: "Date Field" },
    { id: "emailField", type: "string", label: "Email Field", meta: { format: "email" } },
    { id: "passwordField", type: "string", label: "Password Field", meta: { format: "password" } },
    { id: "multilineField", type: "string", label: "Multiline Field", meta: { multiline: true } },
  ],
};

try {
  const typeResult = CreateModePipeline.apply(diverseFieldsShape, emptyContext);
  
  console.log("\n--- Input Type Resolution ---");
  typeResult.fields.forEach(field => {
    console.log(`${field.id}: type=${field.type}, inputType=${field.inputType}`);
  });
  
  // Validate input type determination
  console.log("\n--- Input Type Validation ---");
  console.log(`Text field has inputType='text': ${typeResult.fields.find(f => f.id === 'textField')?.inputType === 'text'}`);
  console.log(`Number field has inputType='number': ${typeResult.fields.find(f => f.id === 'numberField')?.inputType === 'number'}`);
  console.log(`Boolean field has inputType='checkbox': ${typeResult.fields.find(f => f.id === 'booleanField')?.inputType === 'checkbox'}`);
  console.log(`Date field has inputType='date': ${typeResult.fields.find(f => f.id === 'dateField')?.inputType === 'date'}`);
  console.log(`Email field has inputType='email': ${typeResult.fields.find(f => f.id === 'emailField')?.inputType === 'email'}`);
  console.log(`Password field has inputType='password': ${typeResult.fields.find(f => f.id === 'passwordField')?.inputType === 'password'}`);
  console.log(`Multiline field has inputType='textarea': ${typeResult.fields.find(f => f.id === 'multilineField')?.inputType === 'textarea'}`);
  
} catch (error) {
  console.error("\n--- Error in Field Type Processing ---");
  console.error(error);
}

// --- 5. Test Field Inclusion/Exclusion ---
console.log("\n\n=== PIPELINE TEST 4: Field Inclusion/Exclusion ===");

// Create context with include/exclude lists
const filterContext: CreateContext = {
  id: "filterContext",
  name: "Context with Field Filtering",
  timestamp: Date.now(),
  mode: "create",
  includeFields: ["firstName", "email"], // Include only these fields
  excludeFields: ["age"], // Exclude these fields (redundant with include in this case)
};

try {
  const filterResult = CreateModePipeline.apply(sampleShape, filterContext);
  
  console.log("\n--- Fields After Filtering ---");
  console.log(filterResult.fields.map(f => f.id));
  
  // Validate filtering
  console.log("\n--- Filtering Validation ---");
  console.log(`Includes firstName: ${filterResult.fields.some(f => f.id === 'firstName')}`);
  console.log(`Includes email: ${filterResult.fields.some(f => f.id === 'email')}`);
  console.log(`Excludes age: ${!filterResult.fields.some(f => f.id === 'age')}`);
  console.log(`Total fields after filtering: ${filterResult.fields.length}`);
  
} catch (error) {
  console.error("\n--- Error in Field Filtering Test ---");
  console.error(error);
}

console.log("\n\n=== All Pipeline Tests Complete ===");
console.log("CreateModePipeline has been thoroughly tested");