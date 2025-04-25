import { createCommand } from "@/form/modality/commands";
import { 
  TruncatedShape, 
  TruncatedField,
  TruncatedContext,
  TruncateTextMorph
} from "./truncate";
import { FilterField } from "./filter";

// Sample field data for testing different truncation scenarios
const sampleFields: FilterField[] = [
  // Regular text fields
  { 
    id: "shortText", 
    name: "Short Text", 
    type: "string", 
    value: "This is a short text that should not be truncated."
  },
  { 
    id: "longText", 
    name: "Long Text", 
    type: "string", 
    value: "This is a much longer text field that will definitely exceed the default truncation length. It contains multiple sentences with information that might be important but takes up too much space in the UI. We want to make sure this gets truncated properly while preserving word boundaries and adding the proper ellipsis at the end."
  },
  
  // Rich text fields
  { 
    id: "richTextContent", 
    name: "Rich Text Content", 
    type: "richtext", 
    value: "<h2>About Our Company</h2><p>Founded in 2010, our company has been at the forefront of innovation for over a decade. We specialize in cutting-edge technologies that help businesses transform their operations.</p><p>Our team of experts brings years of experience across multiple industries including:</p><ul><li>Finance</li><li>Healthcare</li><li>Education</li><li>Manufacturing</li></ul><p>Contact us today to learn more about our services!</p>"
  },
  
  // Multiline text
  { 
    id: "multilineText", 
    name: "Multiline Text", 
    type: "textarea", 
    value: "Line 1: This is the first line of a multiline text field.\nLine 2: This is the second line with different content.\nLine 3: More information continues here.\nLine 4: And here's yet another line of text.\nLine 5: This should be enough to trigger truncation."
  },
  
  // Markdown
  { 
    id: "markdownContent", 
    name: "Markdown Content", 
    type: "markdown", 
    value: "# Project Overview\n\n## Goals\n\n- Create a responsive interface\n- Implement user authentication\n- Develop API integration\n\n## Timeline\n\n1. Planning: 2 weeks\n2. Development: 8 weeks\n3. Testing: 3 weeks\n4. Deployment: 1 week\n\n## Resources\n\nTeam members assigned to this project include developers, designers, and QA specialists."
  },
  
  // Field types that shouldn't get truncated
  { 
    id: "numberField", 
    name: "Number Field", 
    type: "number", 
    value: 12345
  },
  { 
    id: "dateField", 
    name: "Date Field", 
    type: "date", 
    value: "2023-04-15"
  },
  { 
    id: "booleanField", 
    name: "Boolean Field", 
    type: "boolean", 
    value: true
  },
  
  // Empty field
  { 
    id: "emptyField", 
    name: "Empty Field", 
    type: "string", 
    value: ""
  }
];

// Create a sample form
const sampleForm: TruncatedShape = {
  id: "content-form",
  name: "contentForm",
  title: "Content Display",
  fields: sampleFields,
  truncationEnabled: false,
  truncatedFieldIds: []
};

// Command to test with truncation disabled
export const testTruncationDisabled = createCommand({
  name: "test-truncation-disabled",
  description: "Test the TruncateTextMorph with truncation disabled",
  handler: () => {
    // Context with truncation disabled
    const context: TruncatedContext = {
      id: "content-form",
      name: "contentForm",
      timestamp: Date.now(),
      truncation: {
        enabled: false
      }
    };
    
    const result = TruncateTextMorph.transform(sampleForm, context);
    
    console.log("=== Truncation Disabled Test ===");
    console.log("Truncation enabled:", result.truncationEnabled);
    console.log("Truncated fields count:", result.truncatedFieldIds?.length);
    
    // Verify no fields were truncated
    const longTextField = result.fields.find(f => f.id === "longText") as TruncatedField;
    
    console.log("\nLong text field check:");
    console.log("Field truncated:", longTextField.truncated);
    console.log("Original length preserved:", longTextField.originalLength);
    console.log("Display value unchanged:", longTextField.value === longTextField.displayValue);
    
    return { success: true, message: "Truncation disabled test completed" };
  }
});

// Command to test with basic truncation
export const testBasicTruncation = createCommand({
  name: "test-basic-truncation",
  description: "Test the TruncateTextMorph with default settings",
  handler: () => {
    // Context with truncation enabled using defaults
    const context: TruncatedContext = {
      id: "content-form",
      name: "contentForm",
      timestamp: Date.now(),
      truncation: {
        enabled: true,
        maxLength: 100, // Shorter for testing
        preserveWords: true
      }
    };
    
    const result = TruncateTextMorph.transform(sampleForm, context);
    
    console.log("=== Basic Truncation Test ===");
    console.log("Truncation enabled:", result.truncationEnabled);
    console.log("Truncated fields count:", result.truncatedFieldIds?.length);
    console.log("Truncated field IDs:", result.truncatedFieldIds);
    
    // Check specific fields
    const shortField = result.fields.find(f => f.id === "shortText") as TruncatedField;
    const longField = result.fields.find(f => f.id === "longText") as TruncatedField;
    
    console.log("\nShort text field (should not be truncated):");
    console.log("Field truncated:", shortField.truncated);
    console.log("Original length:", shortField.originalLength);
    
    console.log("\nLong text field (should be truncated):");
    console.log("Field truncated:", longField.truncated);
    console.log("Original length:", longField.originalLength);
    console.log("Displayed length:", longField.displayedLength);
    console.log("Has more content:", longField.hasMore);
    console.log("Display value:", longField.displayValue?.substring(0, 50) + "...");
    
    // Check that truncation happened at word boundary
    const lastChar = longField.displayValue?.charAt(longField.displayValue.length - 2);
    console.log("Last character before ellipsis:", lastChar);
    console.log("Truncated at word boundary:", lastChar === " ");
    
    return { success: true, message: "Basic truncation test completed" };
  }
});

// Command to test field type specific truncation
export const testFieldTypeSpecificTruncation = createCommand({
  name: "test-field-type-truncation",
  description: "Test truncation with different settings for each field type",
  handler: () => {
    // Context with field type specific settings
    const context: TruncatedContext = {
      id: "content-form",
      name: "contentForm",
      timestamp: Date.now(),
      truncation: {
        enabled: true,
        maxLength: 100, // Default
        byFieldType: {
          string: 50,        // Very short for regular text
          textarea: 150,     // Medium for multiline
          richtext: 200,     // Longer for rich content
          markdown: 250      // Even longer for markdown
        }
      }
    };
    
    const result = TruncateTextMorph.transform(sampleForm, context);
    
    console.log("=== Field Type Specific Truncation Test ===");
    
    // Check each type of field
    const stringField = result.fields.find(f => f.id === "longText") as TruncatedField;
    const textareaField = result.fields.find(f => f.id === "multilineText") as TruncatedField;
    const richtextField = result.fields.find(f => f.id === "richTextContent") as TruncatedField;
    const markdownField = result.fields.find(f => f.id === "markdownContent") as TruncatedField;
    const numberField = result.fields.find(f => f.id === "numberField") as TruncatedField;
    
    console.log("\nString field (max 50):");
    console.log("Truncated:", stringField.truncated);
    console.log("Display length:", stringField.displayedLength);
    
    console.log("\nTextarea field (max 150):");
    console.log("Truncated:", textareaField.truncated);
    console.log("Display length:", textareaField.displayedLength);
    
    console.log("\nRichtext field (max 200):");
    console.log("Truncated:", richtextField.truncated);
    console.log("Display length:", richtextField.displayedLength);
    
    console.log("\nMarkdown field (max 250):");
    console.log("Truncated:", markdownField.truncated);
    console.log("Display length:", markdownField.displayedLength);
    
    console.log("\nNumber field (should not be truncated):");
    console.log("Truncated:", numberField.truncated);
    
    return { success: true, message: "Field type specific truncation test completed" };
  }
});

// Command to test character-based truncation (non-word preserving)
export const testCharacterTruncation = createCommand({
  name: "test-character-truncation",
  description: "Test truncation without preserving word boundaries",
  handler: () => {
    // Context with word preservation disabled
    const context: TruncatedContext = {
      id: "content-form",
      name: "contentForm",
      timestamp: Date.now(),
      truncation: {
        enabled: true,
        maxLength: 100,
        preserveWords: false,
        ellipsis: "..."
      }
    };
    
    const result = TruncateTextMorph.transform(sampleForm, context);
    
    console.log("=== Character Truncation Test ===");
    
    const longField = result.fields.find(f => f.id === "longText") as TruncatedField;
    
    console.log("\nLong text with character truncation:");
    console.log("Truncated:", longField.truncated);
    console.log("Original length:", longField.originalLength);
    console.log("Displayed length:", longField.displayedLength);
    
    // Check that truncation happened exactly at maxLength
    console.log("Truncated at exact character count:", 
      longField.displayValue?.length === 100 + 3); // 100 chars + 3 for "..."
    
    // Display truncated text
    console.log("Truncated text (first 50 chars):", 
      longField.displayValue?.substring(0, 50) + "...");
    
    return { success: true, message: "Character truncation test completed" };
  }
});

// Command to test custom ellipsis
export const testCustomEllipsis = createCommand({
  name: "test-custom-ellipsis",
  description: "Test truncation with custom ellipsis",
  handler: () => {
    // Context with custom ellipsis
    const context: TruncatedContext = {
      id: "content-form",
      name: "contentForm",
      timestamp: Date.now(),
      truncation: {
        enabled: true,
        maxLength: 100,
        ellipsis: " [Read More]"
      }
    };
    
    const result = TruncateTextMorph.transform(sampleForm, context);
    
    console.log("=== Custom Ellipsis Test ===");
    
    const longField = result.fields.find(f => f.id === "longText") as TruncatedField;
    const text = longField.displayValue || "";
    
    console.log("\nLong text with custom ellipsis:");
    console.log("Custom ellipsis present:", text.endsWith("[Read More]"));
    
    console.log("\nTruncated text sample:");
    console.log(text.substring(0, 50) + "...");
    
    return { success: true, message: "Custom ellipsis test completed" };
  }
});

// Command to display full field structure
export const displayFullStructure = createCommand({
  name: "display-full-structure",
  description: "Display the full structure of a truncated field",
  handler: () => {
    // Context with standard settings
    const context: TruncatedContext = {
      id: "content-form",
      name: "contentForm",
      timestamp: Date.now(),
      truncation: {
        enabled: true,
        maxLength: 100
      }
    };
    
    const result = TruncateTextMorph.transform(sampleForm, context);
    
    console.log("=== Full Truncated Field Structure ===");
    
    const longField = result.fields.find(f => f.id === "longText") as TruncatedField;
    
    console.log("\nTruncated field structure:");
    console.log("Field ID:", longField.id);
    console.log("Field Type:", longField.type);
    console.log("Original value length:", String(longField.value).length);
    console.log("Display value length:", longField.displayValue?.length);
    
    console.log("\nTruncation properties:");
    console.log("- truncated:", longField.truncated);
    console.log("- originalLength:", longField.originalLength);
    console.log("- displayedLength:", longField.displayedLength);
    console.log("- hasMore:", longField.hasMore);
    console.log("- readMoreAction:", longField.readMoreAction);
    
    // Check for any unexpected properties
    const fieldKeys = Object.keys(longField);
    const expectedKeys = [
      "id", "name", "type", "value", "displayValue", "truncated",
      "originalLength", "displayedLength", "hasMore", "fullContent", "readMoreAction"
    ];
    
    const unexpectedKeys = fieldKeys.filter(key => 
      !expectedKeys.includes(key) && key !== "meta");
    
    console.log("\n=== Structure validation ===");
    console.log("Unexpected keys:", unexpectedKeys.length > 0 ? unexpectedKeys : "None");
    console.log("Using flat structure (no meta.truncation):", !longField.truncated);
    
    return { 
      success: true, 
      message: "Full structure display completed",
      data: longField
    };
  }
});

// Export all commands
export default [
  testTruncationDisabled,
  testBasicTruncation,
  testFieldTypeSpecificTruncation,
  testCharacterTruncation,
  testCustomEllipsis,
  displayFullStructure
];


// Run the test you want
async function run() {
  console.log("Running filter tests...");

  try {
    // Pick one or uncomment all of them to run sequentially
    await testTruncationDisabled.execute({} as any);
    await testBasicTruncation.execute({} as any);
    await testFieldTypeSpecificTruncation.execute({} as any);
    await testCharacterTruncation.execute({} as any);
    await testCustomEllipsis.execute({} as any);
    await displayFullStructure.execute({} as any);
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

run();