import { createCommand } from "@/form/modality/commands";
import { 
  FieldShape, 
  FieldValue, 
  FieldContext,
  FieldInitMorph,
  FieldConstraintsMorph, 
  FieldHistoryMorph,
  FieldsPipeline 
} from "./value";

// Sample field data for testing
const sampleFields: FieldValue[] = [
  { id: "name", name: "Name", type: "string", value: "John Doe" },
  { id: "age", name: "Age", type: "number", value: 30 },
  { id: "email", name: "Email", type: "string" }, // No value - should use defaultValue
  { id: "active", name: "Active", type: "boolean",  defaultValue: true },
  { id: "role", name: "Role", type: "string", value: "user", defaultValue: "guest" },
  { id: "joined", name: "Join Date", type: "date", value: 1, readOnly: true },
  { id: "notes", name: "Notes", type: "text", visible: false,  value: "hi"},
];

// Create a sample form
const sampleForm: FieldShape = {
  id: "user-form",
  name: "userForm",
  title: "User Information",
  fields: sampleFields,
};

// Command to test FieldInitMorph
export const testFieldInit = createCommand({
  name: "test-field-init",
  description: "Test the FieldInitMorph with different field configurations",
  handler: () => {
    // Test with default context
    const defaultContext: FieldContext = {
      id: "user-form",
      name: "userForm",
      timestamp: Date.now(),
      data: { data: {} }
    };
    
    const defaultResult = FieldInitMorph.transform(sampleForm, defaultContext);
    
    console.log("=== Default Field Initialization ===");
    console.log("Fields count:", defaultResult.fields.length);
    
    // Check various field properties after initialization
    const nameField = defaultResult.fields.find(f => f.id === "name");
    const emailField = defaultResult.fields.find(f => f.id === "email");
    const activeField = defaultResult.fields.find(f => f.id === "active");
    
    console.log("\n=== Field Value Resolution ===");
    console.log("Name field (had value):", nameField?.value);
    console.log("Email field (had no value):", emailField?.value);
    console.log("Active field (used defaultValue):", activeField?.value);
    
    // Test with update values in context
    const updateContext: FieldContext = {
      id: "user-form",
      name: "userForm",
      timestamp: Date.now(),
      data: { data: {} },
      updateValues: {
        name: "Jane Smith",
        age: 28,
        role: "admin"
      }
    };
    
    const updateResult = FieldInitMorph.transform(sampleForm, updateContext);
    console.log("\n=== Field Initialization with Updates ===");
    
    // Check that update values were applied
    console.log("Updated name:", updateResult.fields.find(f => f.id === "name")?.value);
    console.log("Updated age:", updateResult.fields.find(f => f.id === "age")?.value);
    console.log("Updated role:", updateResult.fields.find(f => f.id === "role")?.value);
    
    return { success: true, message: "FieldInitMorph tests completed" };
  }
});

// Command to test FieldConstraintsMorph
export const testFieldConstraints = createCommand({
  name: "test-field-constraints",
  description: "Test the FieldConstraintsMorph with read-only constraints",
  handler: () => {
    // Create a form with initialized fields
    const initContext: FieldContext = {
      id: "user-form",
      name: "userForm",
      timestamp: Date.now(),
      data: { data: {} }
    };
    
    const initializedForm = FieldInitMorph.transform(sampleForm, initContext);
    
    // Test applying read-only constraints
    const constraintContext: FieldContext = {
      id: "user-form",
      name: "userForm",
      timestamp: Date.now(),
      data: { data: {} },
      readOnlyFields: ["name", "email"]
    };
    
    const constrainedResult = FieldConstraintsMorph.transform(initializedForm, constraintContext);
    console.log("=== Field Constraints Applied ===");
    
    // Check which fields are read-only
    const fields = constrainedResult.fields;
    console.log("Name field (should be readOnly):", fields.find(f => f.id === "name")?.readOnly);
    console.log("Email field (should be readOnly):", fields.find(f => f.id === "email")?.readOnly);
    console.log("Age field (should be editable):", fields.find(f => f.id === "age")?.readOnly);
    console.log("Joined field (had readOnly=true):", fields.find(f => f.id === "joined")?.readOnly);
    
    return { success: true, message: "FieldConstraintsMorph tests completed" };
  }
});

// Command to test FieldHistoryMorph
export const testFieldHistory = createCommand({
  name: "test-field-history",
  description: "Test the FieldHistoryMorph for tracking changes",
  handler: () => {
    // Create a form with initialized fields
    const initContext: FieldContext = {
      id: "user-form",
      name: "userForm",
      timestamp: Date.now(),
      data: { data: {} }
    };
    
    let workingForm = FieldInitMorph.transform(sampleForm, initContext);
    
    // Apply history tracking once (should record original values)
    workingForm = FieldHistoryMorph.transform(workingForm, initContext);
    
    console.log("=== Initial History State ===");
    const nameField = workingForm.fields.find(f => f.id === "name");
    console.log("Name field originalValue:", nameField?.originalValue);
    console.log("Name field changed flag:", nameField?.changed);
    
    // Simulate changing a field value
    const updatedFields = workingForm.fields.map(f => 
      f.id === "name" ? { ...f, value: "Changed Name" } : f
    );
    
    workingForm = {
      ...workingForm,
      fields: updatedFields
    };
    
    // Apply history tracking again (should detect changes)
    const updatedResult = FieldHistoryMorph.transform(workingForm, initContext);
    
    console.log("\n=== After Field Value Change ===");
    const changedNameField = updatedResult.fields.find(f => f.id === "name");
    console.log("Name field value:", changedNameField?.value);
    console.log("Name field originalValue:", changedNameField?.originalValue);
    console.log("Name field changed flag:", changedNameField?.changed);
    console.log("Name field lastModified:", changedNameField?.lastModified ? "Set" : "Not set");
    
    // Test disabling change tracking
    const noTrackingContext: FieldContext = {
      id: "user-form",
      name: "userForm",
      timestamp: Date.now(),
      data: { data: {} },
      trackChanges: false
    };
    
    const noTrackingResult = FieldHistoryMorph.transform(workingForm, noTrackingContext);
    console.log("\n=== With Change Tracking Disabled ===");
    console.log("Fields should be unchanged:", 
      noTrackingResult.fields[0] === workingForm.fields[0] ? "Yes" : "No");
    
    return { success: true, message: "FieldHistoryMorph tests completed" };
  }
});

// Command to test the full FieldsPipeline
export const testFieldsPipeline = createCommand({
  name: "test-fields-pipeline",
  description: "Test the complete fields pipeline",
  handler: () => {
    // Create a comprehensive context
    const complexContext: FieldContext = {
      id: "user-form",
      name: "userForm",
      timestamp: Date.now(),
      data: { data: {} },
      updateValues: { name: "Pipeline Test", role: "tester" },
      readOnlyFields: ["email", "joined"],
      trackChanges: true
    };
    
    // Apply the full pipeline
    const result = FieldsPipeline.run(sampleForm, complexContext);
    
    console.log("=== Full Pipeline Result ===");
    console.log("Fields count:", result.fields.length);
    
    // Check that all transformations were applied
    const nameField = result.fields.find(f => f.id === "name");
    const emailField = result.fields.find(f => f.id === "email");
    
    console.log("\n=== Field Transformations ===");
    console.log("Name field value (from updateValues):", nameField?.value);
    console.log("Name field originalValue set:", nameField?.originalValue !== undefined);
    console.log("Email field readOnly (from readOnlyFields):", emailField?.readOnly);
    
    // Show complete structure of a field
    console.log("\n=== Complete Field Structure ===");
    console.log(JSON.stringify(nameField, null, 2));
    
    // Check for unexpected properties
    const fieldKeys = Object.keys(nameField || {});
    const expectedKeys = [
      "id", "name", "type", "value", "originalValue", 
      "displayValue", "inputType", "visible", "disabled", 
      "readOnly", "changed", "lastModified"
    ];
    
    const unexpectedKeys = fieldKeys.filter(key => !expectedKeys.includes(key));
    console.log("\n=== Unexpected properties check ===");
    console.log("Unexpected keys:", unexpectedKeys.length > 0 ? unexpectedKeys : "None");
    
    return { 
      success: true, 
      message: "Full fields pipeline test completed"
    };
  }
});

// Export all commands
export default [testFieldInit, testFieldConstraints, testFieldHistory, testFieldsPipeline];


// Run the test you want
async function run() {
  console.log("Running filter tests...");
  
  try {
    // Pick one or uncomment all of them to run sequentially
    await testFieldInit.execute({} as any);
    await testFieldConstraints.execute({} as any);
    await testFieldHistory.execute({} as any);
    await testFieldsPipeline.execute({} as any);
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

run();