import { createCommand } from "@/form/modality/commands";
import { 
  ExpandedShape, 
  ExpandedField,
  ExpandedContext, 
  ExpandedMorph,
  ExpandedLevel
} from "./expand";
import { FilterField } from "./filter";

// Sample field data for testing different expansion scenarios
const sampleFields: FilterField[] = [
  // Simple fields
  { id: "name", name: "Full Name", type: "string", value: "Jane Smith" },
  { id: "age", name: "Age", type: "number", value: 32 },
  { id: "email", name: "Email", type: "string", value: "jane@example.com" },
  
  // Expandable fields
  { id: "address", name: "Address", type: "object", value: {
    street: "123 Main St",
    city: "Anytown",
    state: "CA",
    zip: "12345"
  }},
  
  { id: "hobbies", name: "Hobbies", type: "array", value: [
    "Reading", "Hiking", "Photography", "Coding"
  ]},
  
  { id: "config", name: "Configuration", type: "json", value: {
    theme: "dark",
    notifications: true,
    privacy: {
      shareData: false,
      cookieConsent: true
    }
  }},
  
  { id: "bio", name: "Biography", type: "markdown", value: 
    "# About Jane\n\nJane is a **software engineer** with expertise in:\n\n- TypeScript\n- React\n- Node.js" 
  },
  
  { id: "snippet", name: "Code Snippet", type: "code", value: 
    "function greeting(name) {\n  return `Hello, ${name}!`;\n}",
    format: "javascript"
  },
  
  // Field with meta information
  { id: "salary", name: "Salary", type: "number", value: 85000, format: "currency", 
  }
];

// Create a sample form
const sampleForm: ExpandedShape = {
  id: "employee-profile",
  name: "employeeProfile",
  title: "Employee Information",
  fields: sampleFields,
  level: "standard" as ExpandedLevel,
};

// Command to test minimal detail level
export const testMinimalExpand = createCommand({
  name: "test-minimal-expand",
  description: "Test the ExpandedMorph with minimal detail level",
  handler: () => {
    const context: ExpandedContext = {
      id: "employee-profile",
      name: "employeeProfile",
      timestamp: Date.now(),
      data: { data: {} },
      detail: {
        level: "minimal"
      }
    };
    
    const result = ExpandedMorph.transform(sampleForm, context);
    
    console.log("=== Minimal Detail Level Test ===");
    console.log("Detail level:", result.level);
    console.log("Total fields:", result.fields.length);
    console.log("Expanded fields:", result.fields.length);
    
    // No fields should be auto-expanded at minimal level
    console.log("\nAuto-expanded fields:", result.fields);
    
    return { success: true, message: "Minimal expand test completed" };
  }
});

// Command to test standard detail level
export const testStandardExpand = createCommand({
  name: "test-standard-expand",
  description: "Test the ExpandedMorph with standard detail level",
  handler: () => {
    const context: ExpandedContext = {
      id: "employee-profile",
      name: "employeeProfile",
      timestamp: Date.now(),
      data: { data: {} },
      detail: {
        level: "standard"
      }
    };
    
    const result = ExpandedMorph.transform(sampleForm, context);
    
    console.log("=== Standard Detail Level Test ===");
    console.log("Detail level:", result.level);
    console.log("Expanded fields count:", result.fields.length);
    
    // Check that no fields are auto-expanded at standard level
    console.log("\nNo fields should be auto-expanded:");
    console.log("Auto-expanded fields:", result.fields);
    
    return { success: true, message: "Standard expand test completed" };
  }
});

// Command to test expanded detail level
export const testExpandedLevel = createCommand({
  name: "test-expanded-level",
  description: "Test the ExpandedMorph with expanded detail level",
  handler: () => {
    const context: ExpandedContext = {
      id: "employee-profile",
      name: "employeeProfile",
      timestamp: Date.now(),
      data: { data: {} },
      detail: {
        level: "expanded"
      }
    };
    
    const result = ExpandedMorph.transform(sampleForm, context);
    
    console.log("=== Expanded Detail Level Test ===");
    console.log("Detail level:", result.level);
    console.log("Expanded fields count:", result.fields.length);
    
    // Log which fields were automatically expanded
    console.log("\nAutomatically expanded fields:");
    console.log(result.fields);
    
    // Check if complex fields were expanded
    const objectField = result.fields.find(f => f.id === "address");
    const arrayField = result.fields.find(f => f.id === "hobbies");
    const jsonField = result.fields.find(f => f.id === "config");
    const markdownField = result.fields.find(f => f.id === "bio");
    
    console.log("\nComplex field expansion check:");
    console.log("Address (object) expanded:", Boolean(objectField?.expanded));
    console.log("Hobbies (array) expanded:", Boolean(arrayField?.expanded));
    console.log("Config (json) expanded:", Boolean(jsonField?.expanded));
    console.log("Bio (markdown) expanded:", Boolean(markdownField?.expanded));
    
    // Check if additional info was added at expanded level
    const salaryField = result.fields.find(f => f.id === "salary");
    console.log("\nAdditional info for salary field:", 
      salaryField?.additionalInfo ? "Present" : "Not present");
    
    return { success: true, message: "Expanded level test completed" };
  }
});

// Command to test complete detail level
export const testCompleteLevel = createCommand({
  name: "test-complete-level",
  description: "Test the ExpandedMorph with complete detail level",
  handler: () => {
    const context: ExpandedContext = {
      id: "employee-profile",
      name: "employeeProfile",
      timestamp: Date.now(),
      data: { data: {} },
      detail: {
        level: "complete"
      }
    };
    
    const result = ExpandedMorph.transform(sampleForm, context);
    
    console.log("=== Complete Detail Level Test ===");
    console.log("Detail level:", result.level);
    console.log("Expanded fields count:", result.fields.length);
    
    // Check for complete expanded info
    const salaryField = result.fields.find(f => f.id === "salary") as ExpandedField;
    
    console.log("\nComplete detail for salary field:");
    console.log("Format info:", salaryField?.additionalInfo?.format ? "Present" : "Not present");
    console.log("Validation info:", salaryField?.additionalInfo?.validation ? "Present" : "Not present");
    console.log("History info:", salaryField?.additionalInfo?.history ? "Present" : "Not present");
    console.log("Source info:", salaryField?.additionalInfo?.source ? "Present" : "Not present");
    console.log("Constraints info:", salaryField?.additionalInfo?.constraints ? "Present" : "Not present");
    
    // Check code field rendering
    const codeField = result.fields.find(f => f.id === "snippet") as ExpandedField;
    console.log("\nCode field expansion:");
    console.log("Language:", codeField?.language);
    console.log("Show line numbers:", codeField?.showLineNumbers);
    
    return { success: true, message: "Complete level test completed" };
  }
});

// Command to test forced field expansion
export const testForcedExpansion = createCommand({
  name: "test-forced-expansion",
  description: "Test forcing specific fields to be expanded",
  handler: () => {
    const context: ExpandedContext = {
      id: "employee-profile",
      name: "employeeProfile",
      timestamp: Date.now(),
      data: { data: {} },
      detail: {
        level: "minimal", // Normally nothing would expand
        expandedFields: ["salary", "name"] // But we force these to expand
      }
    };
    
    const result = ExpandedMorph.transform(sampleForm, context);
    
    console.log("=== Forced Field Expansion Test ===");
    console.log("Detail level:", result.level);
    console.log("Total expanded fields:", result.fields.length);
    console.log("Expanded field IDs:", result.fields);
    
    // Verify specific fields were expanded
    const nameField = result.fields.find(f => f.id === "name");
    const salaryField = result.fields.find(f => f.id === "salary");
    const addressField = result.fields.find(f => f.id === "address");
    
    console.log("\nForced expansion verification:");
    console.log("Name field expanded:", Boolean(nameField?.expanded));
    console.log("Salary field expanded:", Boolean(salaryField?.expanded));
    console.log("Address field NOT expanded:", !addressField?.expanded);
    
    return { success: true, message: "Forced expansion test completed" };
  }
});

// Command to test expansion rendering
export const testExpansionRendering = createCommand({
  name: "test-expansion-rendering",
  description: "Test different rendering modes for expanded fields",
  handler: () => {
    // Test two different detail levels to see rendering differences
    const standardContext: ExpandedContext = {
      id: "employee-profile",
      name: "employeeProfile",
      timestamp: Date.now(),
      data: { data: {} },
      detail: {
        level: "expanded",
        expandedFields: ["address", "config", "bio", "snippet"]
      }
    };
    
    const completeContext: ExpandedContext = {
      id: "employee-profile",
      name: "employeeProfile",
      timestamp: Date.now(),
      data: { data: {} },
      detail: {
        level: "complete",
        expandedFields: ["address", "config", "bio", "snippet"]
      }
    };
    
    const standardResult = ExpandedMorph.transform(sampleForm, standardContext);
    const completeResult = ExpandedMorph.transform(sampleForm, completeContext);
    
    console.log("=== Expansion Rendering Test ===");
    
    // Compare rendering differences between detail levels
    const standardObject = standardResult.fields.find(f => f.id === "address") as ExpandedField;
    const completeObject = completeResult.fields.find(f => f.id === "address") as ExpandedField;
    
    console.log("\nObject field rendering differences:");
    console.log("Standard level rendered as:", standardObject?.renderedAs);
    console.log("Complete level rendered as:", completeObject?.renderedAs);
    
    const standardCode = standardResult.fields.find(f => f.id === "snippet") as ExpandedField;
    const completeCode = completeResult.fields.find(f => f.id === "snippet") as ExpandedField;
    
    console.log("\nCode field rendering differences:");
    console.log("Standard level show line numbers:", standardCode?.showLineNumbers);
    console.log("Complete level show line numbers:", completeCode?.showLineNumbers);
    
    return { 
      success: true, 
      message: "Expansion rendering test completed" 
    };
  }
});

// Command to display a fully expanded field
export const displayFullExpansion = createCommand({
  name: "display-full-expansion",
  description: "Display a fully expanded complex field",
  handler: () => {
    const context: ExpandedContext = {
      id: "employee-profile",
      name: "employeeProfile",
      timestamp: Date.now(),
      data: { data: {} },
      detail: {
        level: "complete",
        expandedFields: ["config"]
      }
    };
    
    const result = ExpandedMorph.transform(sampleForm, context);
    
    // Get a fully expanded complex field
    const configField = result.fields.find(f => f.id === "config") as ExpandedField;
    
    console.log("=== Full Expansion Structure ===");
    console.log("Field ID:", configField.id);
    console.log("Field Type:", configField.type);
    
    console.log("\nExpanded structure:");
    console.log(JSON.stringify(configField.expanded, null, 2));
    
    console.log("\nAdditional info:");
    console.log(JSON.stringify(configField.additionalInfo, null, 2));
    
    // Check for any unexpected properties
    const fieldKeys = Object.keys(configField);
    const expectedKeys = [
      "id", "name", "type", "value", "expanded", "additionalInfo", "meta"
    ];
    
    const unexpectedKeys = fieldKeys.filter(key => !expectedKeys.includes(key));
    console.log("\n=== Unexpected properties check ===");
    console.log("Unexpected keys:", unexpectedKeys.length > 0 ? unexpectedKeys : "None");
    
    return { 
      success: true, 
      message: "Full expansion display completed",
      data: configField
    };
  }
});

// Export all commands
export default [
  testMinimalExpand,
  testStandardExpand,
  testExpandedLevel,
  testCompleteLevel,
  testForcedExpansion,
  testExpansionRendering,
  displayFullExpansion
];

// Run the test you want
async function run() {
  console.log("Running filter tests...");
  
  try {
    // Pick one or uncomment all of them to run sequentially
    await testMinimalExpand.execute({} as any);
    await testStandardExpand.execute({} as any);
    await testExpandedLevel.execute({} as any);
    await testCompleteLevel.execute({} as any);
    await testForcedExpansion.execute({} as any);
    await testExpansionRendering.execute({} as any);
    await displayFullExpansion.execute({} as any);
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

run();