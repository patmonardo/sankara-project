import { createCommand } from "@/form/modality/commands";
import { createPipeline } from "../core";

// Import all your form components
import { 
  FieldShape, FieldValue, FieldContext,
  FieldInitMorph, FieldConstraintsMorph, FieldHistoryMorph
} from "./value";

import {
  FilterShape, FilterContext, FilterField,
  FilterWhereMorph, FilterOrderMorph, FilterLimitMorph
} from "./filter";

// Sample field data for testing
const sampleFields: (FieldValue & FilterField)[] = [
  { id: "name", name: "Name", type: "string", value: "John Doe" },
  { id: "age", name: "Age", type: "number", value: 30 },
  { id: "email", name: "Email", type: "string", value: "john@example.com" },
  { id: "active", name: "Active", type: "boolean", value: true },
  { id: "role", name: "Role", type: "string", value: "admin" },
  { id: "joined", name: "Join Date", type: "date", value: "2022-01-15", readOnly: true },
  { id: "notes", name: "Notes", type: "text", value: "Some notes about John" },
];

// Create a sample form
const sampleForm: FieldShape & FilterShape = {
  id: "user-form",
  name: "userForm",
  title: "User Information",
  fields: sampleFields,
};

// Create a Universal Form Pipeline that combines both field and filter processing
export const UniversalFormPipeline = createPipeline<any>("UniversalFormPipeline")
  // Field processing
  .pipe(FieldInitMorph)
  .pipe(FieldConstraintsMorph)
  .pipe(FieldHistoryMorph)
  // Filter processing
  .pipe(FilterWhereMorph)
  .pipe(FilterOrderMorph)
  .pipe(FilterLimitMorph)
  .build({
    description: "Combined universal form pipeline",
    category: "form",
    tags: ["form", "fields", "filter"],
    inputType: "FormShape",
    outputType: "FormShape",
  });

// Command to test CREATE mode
export const testCreateMode = createCommand({
  name: "test-create-mode",
  description: "Test the universal form pipeline in CREATE mode",
  handler: () => {
    // CREATE mode context
    const createContext: FieldContext & FilterContext = {
      id: "user-form",
      name: "userForm",
      timestamp: Date.now(),
      data: { data: {} },
      
      // Field options for CREATE mode
      updateValues: {}, // Start with empty values
      trackChanges: false, // No change tracking in create mode
      
      // Filter options for CREATE mode
      filterFields: ["name", "email", "role", "active"], // Only show essential fields for creation
      filterOrder: ["name:asc", "email:asc", "role:asc"] // Logical creation order
    };
    
    const createResult = UniversalFormPipeline.run(sampleForm, createContext);
    
    console.log("=== CREATE MODE ===");
    console.log("Field count:", createResult.fields.length);
    console.log("Fields included:", createResult.fields.map(f => f.id));
    
    // Verify CREATE mode specifics
    console.log("\nCREATE mode specifics:");
    console.log("- Values initialized:", createResult.fields.every(f => 'value' in f));
    console.log("- Change tracking disabled:", !createResult.fields.some(f => f.changed));
    
    return { success: true, message: "CREATE mode test completed" };
  }
});

// Command to test EDIT mode
export const testEditMode = createCommand({
  name: "test-edit-mode",
  description: "Test the universal form pipeline in EDIT mode",
  handler: () => {
    // EDIT mode context
    const editContext: FieldContext & FilterContext = {
      id: "user-form",
      name: "userForm",
      timestamp: Date.now(),
      data: { data: {} },
      
      // Field options for EDIT mode
      updateValues: { name: "Jane Smith", role: "manager" }, // Update some values
      trackChanges: true, // Track changes in edit mode
      readOnlyFields: ["email"], // Some fields are read-only
      
      // Filter options for EDIT mode
      filterOrder: ["name:asc", "email:asc", "role:asc", "active:asc", "notes:asc"] // Logical edit order
    };
    
    const editResult = UniversalFormPipeline.run(sampleForm, editContext);
    
    console.log("=== EDIT MODE ===");
    console.log("Field count:", editResult.fields.length);
    
    // Verify EDIT mode specifics
    console.log("\nEDIT mode specifics:");
    
    // Check updated values
    const nameField = editResult.fields.find(f => f.id === "name");
    console.log("- Name updated:", nameField?.value);
    console.log("- Name marked as changed:", nameField?.changed);
    console.log("- Name has originalValue:", nameField?.originalValue);
    
    // Check read-only fields
    const emailField = editResult.fields.find(f => f.id === "email");
    const joinedField = editResult.fields.find(f => f.id === "joined");
    console.log("- Email field readOnly (from context):", emailField?.readOnly);
    console.log("- Joined field readOnly (from field property):", joinedField?.readOnly);
    
    return { success: true, message: "EDIT mode test completed" };
  }
});

// Command to test VIEW mode
export const testViewMode = createCommand({
  name: "test-view-mode",
  description: "Test the universal form pipeline in VIEW mode",
  handler: () => {
    // VIEW mode context
    const viewContext: FieldContext & FilterContext = {
      id: "user-form",
      name: "userForm",
      timestamp: Date.now(),
      data: { data: {} },
      
      // Field options for VIEW mode
      readOnlyFields: ["*"], // Everything is read-only in view mode
      trackChanges: false, // No change tracking in view mode
      
      // Filter options for VIEW mode - show everything in a logical order
      filterOrder: ["name:asc", "email:asc", "role:asc"] // Display order
    };
    
    const viewResult = UniversalFormPipeline.run(sampleForm, viewContext);
    
    console.log("=== VIEW MODE ===");
    console.log("Field count:", viewResult.fields.length);
    
    // Verify VIEW mode specifics
    console.log("\nVIEW mode specifics:");
    console.log("- All fields read-only:", viewResult.fields.every(f => f.readOnly));
    
    // Check ordering
    console.log("- Fields in order:", viewResult.fields.slice(0, 3).map(f => f.id));
    
    return { success: true, message: "VIEW mode test completed" };
  }
});

// Command to test a CUSTOM mode - search/filter mode
export const testCustomMode = createCommand({
  name: "test-custom-mode",
  description: "Test the universal form pipeline with a custom SEARCH mode",
  handler: () => {
    // SEARCH mode context - a custom mode for searching
    const searchContext: FieldContext & FilterContext = {
      id: "user-form",
      name: "userForm",
      timestamp: Date.now(),
      data: { data: {} },
      
      // Field options for SEARCH mode - empty values for search criteria
      updateValues: {},
      trackChanges: false,
      
      // Filter options for SEARCH mode - only include searchable fields
      filterFields: ["name", "email", "role", "joined"],
      filterOrder: ["name:asc", "email:asc", "role:asc", "joined:asc"]
    };
    
    const searchResult = UniversalFormPipeline.run(sampleForm, searchContext);
    
    console.log("=== CUSTOM SEARCH MODE ===");
    console.log("Field count:", searchResult.fields.length);
    console.log("Search fields included:", searchResult.fields.map(f => f.id));
    
    // Verify SEARCH mode specifics
    console.log("\nSEARCH mode specifics:");
    console.log("- Only searchable fields included:", 
      !searchResult.fields.some(f => !["name", "email", "role", "joined"].includes(f.id as string)));
    
    return { success: true, message: "CUSTOM mode test completed" };
  }
});

// Command to test multiple chained transformations
export const testChainedTransformations = createCommand({
  name: "test-chained",
  description: "Test applying different contexts to the same form in sequence",
  handler: () => {
    // Start with CREATE mode
    const createContext: FieldContext & FilterContext = {
      id: "user-form",
      name: "userForm",
      timestamp: Date.now(),
      data: { data: {} },
      updateValues: { name: "New User" },
      filterFields: ["name", "email", "role"]
    };
    
    let form = UniversalFormPipeline.run(sampleForm, createContext);
    console.log("=== CREATE → EDIT → VIEW CHAIN ===");
    console.log("After CREATE:");
    console.log("- Fields:", form.fields.map(f => f.id));
    console.log("- Name value:", form.fields.find(f => f.id === "name")?.value);
    
    // Then apply EDIT mode to the result
    const editContext: FieldContext & FilterContext = {
      id: "user-form",
      name: "userForm",
      timestamp: Date.now(),
      data: { data: {} },
      updateValues: { role: "editor" },
      trackChanges: true
    };
    
    form = UniversalFormPipeline.run(form, editContext);
    console.log("\nAfter EDIT:");
    console.log("- Name value unchanged:", form.fields.find(f => f.id === "name")?.value);
    console.log("- Role value updated:", form.fields.find(f => f.id === "role")?.value);
    console.log("- Role marked as changed:", form.fields.find(f => f.id === "role")?.changed);
    
    // Finally apply VIEW mode
    const viewContext: FieldContext & FilterContext = {
      id: "user-form",
      name: "userForm",
      timestamp: Date.now(),
      data: { data: {} },
      readOnlyFields: ["*"]
    };
    
    form = UniversalFormPipeline.run(form, viewContext);
    console.log("\nAfter VIEW:");
    console.log("- All fields read-only:", form.fields.every(f => f.readOnly));
    console.log("- Change flags preserved:", form.fields.find(f => f.id === "role")?.changed);
    
    return { success: true, message: "Chained transformation test completed" };
  }
});

// Export all commands
export default [
  testCreateMode, 
  testEditMode, 
  testViewMode, 
  testCustomMode, 
  testChainedTransformations
];

// Run the test you want
async function run() {
  console.log("Running filter tests...");
  
  try {
    // Pick one or uncomment all of them to run sequentially
    await testCreateMode.execute({} as any);
    await testEditMode.execute({} as any);
    await testViewMode.execute({} as any);
    await testCustomMode.execute({} as any);
    await testChainedTransformations.execute({} as any);
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

run();