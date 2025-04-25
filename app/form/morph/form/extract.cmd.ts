import { createCommand } from "@/form/modality/commands";
import { 
  ExtractedShape, 
  ExtractedField,
  ExtractedContext,
  ExtractedMorph,
  FilteredQualitiesMorph,
  QualitiesToDataMorph,
  determineDisplayType
} from "./extract";

// Sample field data for testing
const sampleQualities: ExtractedField[] = [
  { 
    id: "fullName", 
    label: "Full Name", 
    value: "John Doe", 
    type: "string", 
    displayType: "text" 
  },
  { 
    id: "age", 
    label: "Age", 
    value: 30, 
    type: "number", 
    displayType: "number" 
  },
  { 
    id: "email", 
    label: "Email Address", 
    value: "john@example.com", 
    type: "email", 
    displayType: "text" 
  },
  { 
    id: "birthdate", 
    label: "Date of Birth", 
    value: "1990-01-01", 
    type: "date", 
    displayType: "date",
    format: "yyyy-MM-dd"
  },
  { 
    id: "isSubscribed", 
    label: "Newsletter Subscription", 
    value: true, 
    type: "boolean", 
    displayType: "boolean" 
  },
  { 
    id: "address", 
    label: "Address", 
    value: "123 Main St", 
    type: "textarea", 
    displayType: "text",
    visible: false  // This should be excluded when filtering
  },
  { 
    id: "profilePic", 
    label: "Profile Picture", 
    value: "profile.jpg", 
    type: "image", 
    displayType: "file" 
  },
  { 
    id: "preferences", 
    label: "User Preferences", 
    value: { theme: "dark", notifications: true }, 
    type: "object", 
    displayType: "object" 
  },
];

// Create a sample extracted shape
const sampleShape: ExtractedShape = {
  id: "user-profile",
  qualities: sampleQualities,
  meta: {
    source: "user-database"
  }
};

// Command to test ExtractedMorph
export const testExtractedMorph = createCommand({
  name: "test-extracted-morph",
  description: "Test the ExtractedMorph with field values from context",
  handler: () => {
    // Create context with field values
    const context: ExtractedContext = {
      id: "user-profile",
      name: "userProfile",
      timestamp: Date.now(),
      data: { data: {} },
      fieldValues: {
        fullName: "Jane Smith",  // Override existing value
        age: 28,                 // Override existing value
        occupation: "Developer"  // New value that doesn't exist in shape
      }
    };
    
    const result = ExtractedMorph.transform(sampleShape, context);
    
    console.log("=== ExtractedMorph Test ===");
    console.log("Shape ID:", result.id);
    console.log("Qualities count:", result.qualities.length);
    
    // Check that field values were correctly extracted
    const nameField = result.qualities.find(q => q.id === "fullName");
    const ageField = result.qualities.find(q => q.id === "age");
    const emailField = result.qualities.find(q => q.id === "email");
    
    console.log("\nField value extraction:");
    console.log("Full Name:", nameField?.value); // Should keep original value, not use context value
    console.log("Age:", ageField?.value);        // Should keep original value, not use context value 
    console.log("Email:", emailField?.value);    // Should keep original value
    
    return { success: true, message: "ExtractedMorph test completed" };
  }
});

// Command to test FilteredQualitiesMorph with inclusion rules
export const testFilterInclusion = createCommand({
  name: "test-filter-inclusion",
  description: "Test the FilteredQualitiesMorph with inclusion rules",
  handler: () => {
    // Create context with include fields
    const context: ExtractedContext = {
      id: "user-profile",
      name: "userProfile",
      timestamp: Date.now(),
      data: { data: {} },
      includeFields: ["fullName", "email", "isSubscribed"]
    };
    
    const result = FilteredQualitiesMorph.transform(sampleShape, context);
    
    console.log("=== Filter Inclusion Test ===");
    console.log("Original qualities count:", sampleShape.qualities.length);
    console.log("Filtered qualities count:", result.qualities.length);
    console.log("Included field IDs:", result.qualities.map(q => q.id));
    
    // Check that only specified fields were included
    const hasName = result.qualities.some(q => q.id === "fullName");
    const hasEmail = result.qualities.some(q => q.id === "email");
    const hasAge = result.qualities.some(q => q.id === "age");
    
    console.log("\nFiltering results:");
    console.log("Includes fullName:", hasName);   // Should be true
    console.log("Includes email:", hasEmail);     // Should be true
    console.log("Includes age:", hasAge);         // Should be false
    
    // Check metadata
    console.log("\nFilter metadata:");
    console.log("includeFields:", result.meta?.filteredBy?.includeFields);
    
    return { success: true, message: "Filter inclusion test completed" };
  }
});

// Command to test FilteredQualitiesMorph with exclusion rules
export const testFilterExclusion = createCommand({
  name: "test-filter-exclusion",
  description: "Test the FilteredQualitiesMorph with exclusion rules",
  handler: () => {
    // Create context with exclude fields
    const context: ExtractedContext = {
      id: "user-profile",
      name: "userProfile",
      timestamp: Date.now(),
      data: { data: {} },
      excludeFields: ["age", "profilePic", "preferences"]
    };
    
    const result = FilteredQualitiesMorph.transform(sampleShape, context);
    
    console.log("=== Filter Exclusion Test ===");
    console.log("Original qualities count:", sampleShape.qualities.length);
    console.log("Filtered qualities count:", result.qualities.length);
    console.log("Included field IDs:", result.qualities.map(q => q.id));
    
    // Check that specified fields were excluded
    const hasName = result.qualities.some(q => q.id === "fullName");
    const hasAge = result.qualities.some(q => q.id === "age");
    const hasProfilePic = result.qualities.some(q => q.id === "profilePic");
    
    console.log("\nFiltering results:");
    console.log("Includes fullName:", hasName);       // Should be true
    console.log("Includes age:", hasAge);             // Should be false
    console.log("Includes profilePic:", hasProfilePic); // Should be false
    
    // Check metadata
    console.log("\nFilter metadata:");
    console.log("excludeFields:", result.meta?.filteredBy?.excludeFields);
    
    return { success: true, message: "Filter exclusion test completed" };
  }
});

// Command to test FilteredQualitiesMorph with visibility rules
export const testFilterVisibility = createCommand({
  name: "test-filter-visibility",
  description: "Test the FilteredQualitiesMorph with field visibility",
  handler: () => {
    // Basic context without include/exclude rules
    const context: ExtractedContext = {
      id: "user-profile",
      name: "userProfile",
      timestamp: Date.now(),
      data: { data: {} }
    };
    
    const result = FilteredQualitiesMorph.transform(sampleShape, context);
    
    console.log("=== Filter Visibility Test ===");
    console.log("Original qualities count:", sampleShape.qualities.length);
    console.log("Filtered qualities count:", result.qualities.length);
    
    // Check if invisible fields were filtered out
    const invisibleFields = sampleShape.qualities.filter(f => f.visible === false);
    const hasInvisibleFields = result.qualities.some(q => 
      invisibleFields.some(f => f.id === q.id));
    
    console.log("\nInvisible fields filtered out:", !hasInvisibleFields);
    console.log("Invisible fields in original:", invisibleFields.map(f => f.id));
    
    return { success: true, message: "Filter visibility test completed" };
  }
});

// Command to test QualitiesToDataMorph
export const testQualitiesToData = createCommand({
  name: "test-qualities-to-data",
  description: "Test the QualitiesToDataMorph",
  handler: () => {
    // First filter to get a subset of qualities
    const filterContext: ExtractedContext = {
      id: "user-profile",
      name: "userProfile",
      timestamp: Date.now(),
      data: { data: {} },
      includeFields: ["fullName", "email", "age", "isSubscribed"]
    };
    
    const filteredShape = FilteredQualitiesMorph.transform(sampleShape, filterContext);
    
    // Then convert to data object
    const data = QualitiesToDataMorph.transform(filteredShape, filterContext);
    
    console.log("=== QualitiesToData Test ===");
    console.log("Filtered qualities count:", filteredShape.qualities.length);
    console.log("Data keys count:", Object.keys(data).length);
    
    // Display the data object
    console.log("\nExtracted data object:");
    console.log(JSON.stringify(data, null, 2));
    
    // Verify key properties
    console.log("\nKey properties verification:");
    console.log("Has fullName:", "fullName" in data);
    console.log("Has email:", "email" in data);
    console.log("fullName value:", data.fullName);
    console.log("age value:", data.age);
    
    return { 
      success: true, 
      message: "QualitiesToData test completed",
      data
    };
  }
});

// Command to test display type determination
export const testDisplayTypes = createCommand({
  name: "test-display-types",
  description: "Test the determineDisplayType function",
  handler: () => {
    // Create test fields with various types
    const testTypes = [
      "string", "text", "email", "password", "textarea", "markdown",
      "number", "integer", "float", "currency", "percent",
      "boolean", "checkbox", "toggle",
      "date", "datetime", "time",
      "select", "radio", "multiselect",
      "object", "json", "array", "list", "tags",
      "file", "image",
      "custom-type" // unknown type
    ];
    
    console.log("=== Display Type Determination Test ===");
    
    // Test each type and group by display type
    const displayGroups: Record<string, string[]> = {};
    
    testTypes.forEach(type => {
      const displayType = determineDisplayType({ 
        id: `test-${type}`, 
        label: `Test ${type}`, 
        value: null, 
        type, 
        displayType: "" 
      });
      
      if (!displayGroups[displayType]) {
        displayGroups[displayType] = [];
      }
      displayGroups[displayType].push(type);
    });
    
    console.log("Display type groupings:");
    Object.entries(displayGroups).forEach(([displayType, types]) => {
      console.log(`\n${displayType}:`);
      types.forEach(type => console.log(`- ${type}`));
    });
    
    return { success: true, message: "Display types test completed" };
  }
});

// Export all commands
export default [
  testExtractedMorph,
  testFilterInclusion,
  testFilterExclusion,
  testFilterVisibility,
  testQualitiesToData,
  testDisplayTypes
];

// Run the test you want
async function run() {
  console.log("Running filter tests...");
  
  try {
    // Pick one or uncomment all of them to run sequentially
    await testExtractedMorph.execute({} as any);
    await testFilterInclusion.execute({} as any);
    await testFilterExclusion.execute({} as any);
    await testFilterVisibility.execute({} as any);
    await testQualitiesToData.execute({} as any);
    await testDisplayTypes.execute({} as any);
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

run();