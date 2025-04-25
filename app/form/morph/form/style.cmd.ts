import { createCommand } from "@/form/modality/commands";
import { 
  StyleShape, 
  StyleField,
  StyleContext, 
  StyleMorph
} from "./style";
import { FieldValue } from "./value";

// Sample field data for testing
const sampleFields: FieldValue[] = [
  { id: "name", name: "Full Name", type: "string", value: "John Doe" },
  { id: "email", name: "Email", type: "string", value: "john@example.com" },
  { id: "age", name: "Age", type: "number", value: 32 },
  { id: "bio", name: "Biography", type: "textarea", value: "Software engineer with 5 years experience..." },
];

// Create a sample form
const sampleForm: StyleShape = {
  id: "profile-form",
  name: "profileForm",
  title: "User Profile",
  fields: sampleFields
};

// Command to test default styling
export const testDefaultStyle = createCommand({
  name: "test-default-style",
  description: "Test the StyleMorph with default settings",
  handler: () => {
    const context: StyleContext = {
      id: "profile-form",
      name: "profileForm",
      timestamp: Date.now(),
      data: { data: {} }
    };
    
    const result = StyleMorph.transform(sampleForm, context);
    
    console.log("=== Default Style Test ===");
    console.log("Container style defined:", Boolean(result.  styles?.container));
    
    // Check field styling
    const firstField = result.fields[0] as StyleField;
    console.log("\nField styling verification:");
    console.log("Container style:", Boolean(firstField.styles?.container));
    console.log("Label style:", Boolean(firstField.styles?.label));
    console.log("Value style:", Boolean(firstField.styles?.value));
    
    // Show some specific style values
    console.log("\nSelected style values:");
    console.log("Container background:", result.styles?.container?.backgroundColor);
    console.log("Field padding:", firstField.styles?.container?.padding);
    console.log("Label font size:", firstField.styles?.label?.fontSize);
    
    return { success: true, message: "Default style test completed" };
  }
});

// Command to test card variant
export const testCardVariant = createCommand({
  name: "test-card-variant",
  description: "Test the StyleMorph with card variant",
  handler: () => {
    const context: StyleContext = {
      id: "profile-form",
      name: "profileForm",
      timestamp: Date.now(),
      data: { data: {} },
      variant: "card"
    };
    
    const result = StyleMorph.transform(sampleForm, context);
    
    console.log("=== Card Variant Test ===");
    console.log("Container background:", result.styles?.container?.backgroundColor);
    console.log("Border radius:", result.styles?.container?.borderRadius);
    console.log("Box shadow:", result.styles?.container?.boxShadow);
    
    return { success: true, message: "Card variant test completed" };
  }
});

// Command to test different densities
export const testDensity = createCommand({
  name: "test-density-options",
  description: "Test the StyleMorph with different density settings",
  handler: () => {
    const contexts: StyleContext[] = [
      {
        id: "profile-form",
        name: "profileForm",
        timestamp: Date.now(),
        data: { data: {} },
        density: "compact"
      },
      {
        id: "profile-form",
        name: "profileForm",
        timestamp: Date.now(),
        data: { data: {} },
        density: "normal"
      },
      {
        id: "profile-form",
        name: "profileForm",
        timestamp: Date.now(),
        data: { data: {} },
        density: "comfortable"
      }
    ];
    
    console.log("=== Density Options Test ===");
    
    contexts.forEach(context => {
      const result = StyleMorph.transform(sampleForm, context);
      const firstField = result.fields[0] as StyleField;
      
      console.log(`\nDensity: ${context.density}`);
      console.log("Field padding:", firstField.styles?.container?.padding);
      console.log("Field margin:", firstField.styles?.container?.margin);
      console.log("Label font size:", firstField.styles?.label?.fontSize);
    });
    
    return { success: true, message: "Density options test completed" };
  }
});

// Command to test custom padding
export const testCustomPadding = createCommand({
  name: "test-custom-padding",
  description: "Test the StyleMorph with custom padding override",
  handler: () => {
    const context: StyleContext = {
      id: "profile-form",
      name: "profileForm",
      timestamp: Date.now(),
      data: { data: {} },
      padding: "24px 32px"
    };
    
    const result = StyleMorph.transform(sampleForm, context);
    
    console.log("=== Custom Padding Test ===");
    console.log("Container padding:", result.styles?.container?.padding);
    
    return { success: true, message: "Custom padding test completed" };
  }
});

// Command to test with pre-existing field styles
export const testPreexistingStyles = createCommand({
  name: "test-preexisting-styles",
  description: "Test the StyleMorph with fields that already have styles",
  handler: () => {
    // Create fields with pre-existing styles
    const styledFields = sampleFields.map(field => {
      if (field.id === "name") {
        return {
          ...field,
          styles: {
            container: {
              backgroundColor: "var(--highlight-bg, #f5f5f5)",
              borderLeft: "3px solid var(--primary-color, #2196f3)"
            },
            label: {
              color: "var(--primary-color, #2196f3)"
            }
          }
        };
      }
      return field;
    });
    
    const customForm: StyleShape = {
      ...sampleForm,
      fields: styledFields
    };
    
    const context: StyleContext = {
      id: "profile-form",
      name: "profileForm",
      timestamp: Date.now(),
      data: { data: {} }
    };
    
    const result = StyleMorph.transform(customForm, context);
    
    console.log("=== Pre-existing Styles Test ===");
    const nameField = result.fields.find(f => f.id === "name") as StyleField;
    const emailField = result.fields.find(f => f.id === "email") as StyleField;
    
    console.log("\nMerged styles check:");
    console.log("Name field background:", nameField.styles?.container?.backgroundColor);
    console.log("Name field border:", nameField.styles?.container?.borderLeft);
    console.log("Name field label color:", nameField.styles?.label?.color);
    
    console.log("\nStandard field check:");
    console.log("Email field has added styles:", Boolean(emailField.styles));
    console.log("Email field background:", emailField.styles?.container?.backgroundColor);
    
    return { success: true, message: "Pre-existing styles test completed" };
  }
});

// Export all commands
export default [
  testDefaultStyle,
  testCardVariant,
  testDensity,
  testCustomPadding,
  testPreexistingStyles
];

// Run the test you want
async function run() {
  console.log("Running filter tests...");
  
  try {
    // Pick one or uncomment all of them to run sequentially
    await testDefaultStyle.execute({} as any);
    await testCardVariant.execute({} as any);
    await testDensity.execute({} as any);
    await testCustomPadding.execute({} as any);
    await testPreexistingStyles.execute({} as any);
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

run();