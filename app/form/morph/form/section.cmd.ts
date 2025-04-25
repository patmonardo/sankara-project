import { createCommand } from "@/form/modality/commands";
import { FieldValue } from "./value";
import { 
  SectionShape, 
  SectionContext, 
  SectionsOptions,
  ApplySectionsMorph,
} from "./sections";

// Sample fields for testing
const sampleFields: FieldValue[] = [
  { id: "name", name: "Name", type: "string", value: "John Doe" },
  { id: "email", name: "Email", type: "string", value: "john@example.com" },
  { id: "phone", name: "Phone", type: "string", value: "555-1234" },
  { id: "address", name: "Address", type: "string", value: "123 Main St" },
  { id: "city", name: "City", type: "string", value: "Anytown" },
  { id: "state", name: "State", type: "string", value: "CA" },
  { id: "zip", name: "Zip Code", type: "string", value: "12345" },
  { id: "username", name: "Username", type: "string", value: "johndoe" },
  { id: "password", name: "Password", type: "password" },
  { id: "bio", name: "Biography", type: "text", value: "Lorem ipsum..." },
];

// Sample form with pre-defined layout sections
const formWithLayout: SectionShape = {
  id: "user-form",
  name: "userForm",
  title: "User Information",
  fields: sampleFields,
  layout: {
    sections: [
      { id: "personal", name: "Personal Information" },
      { id: "contact", name: "Contact Details" },
      { id: "account", name: "Account Settings" }
    ]
  }
};

// Sample form without layout sections
const formWithoutLayout: SectionShape = {
  id: "simple-form",
  name: "simpleForm",
  title: "Simple Form",
  fields: sampleFields,
};

// Command to test basic section assignment
export const testBasicSections = createCommand({
  name: "test-basic-sections",
  description: "Test the ApplySectionsMorph with basic assignments",
  handler: () => {
    // Define section assignment options
    const sectionsOptions: SectionsOptions = {
      fieldSections: {
        name: "personal",
        email: "contact",
        phone: "contact",
        address: "contact",
        city: "contact",
        state: "contact",
        zip: "contact",
        username: "account",
        password: "account",
        bio: "personal"
      }
    };
    
    const context: SectionContext = {
      id: "user-form",
      name: "userForm",
      timestamp: Date.now(),
      data: { data: {} },
      sectionsOptions
    };
    
    // Apply sections to the form with layout
    const result = ApplySectionsMorph.transform(formWithLayout, context);
    
    console.log("=== Basic Section Assignment ===");
    console.log("Sections enabled:", result.sectionsEnabled);
    console.log("Section count:", result.sectionCount);
    
    // Print out sections and their fields
    if (result.sections) {
      result.sections.forEach(section => {
        console.log(`\nSection: ${section.id} - ${section.title}`);
        console.log("Fields:", section.fields);
      });
    }
    
    return { success: true, message: "Basic sections test completed" };
  }
});

// Command to test default section creation
export const testDefaultSection = createCommand({
  name: "test-default-section",
  description: "Test the ApplySectionsMorph with no pre-defined sections",
  handler: () => {
    // No specific section assignments
    const context: SectionContext = {
      id: "simple-form",
      name: "simpleForm",
      timestamp: Date.now(),
      data: { data: {} }
    };
    
    // Apply sections to the form without layout
    const result = ApplySectionsMorph.transform(formWithoutLayout, context);
    
    console.log("=== Default Section Creation ===");
    console.log("Sections enabled:", result.sectionsEnabled);
    console.log("Section count:", result.sectionCount);
    
    // Print default section
    if (result.sections && result.sections.length > 0) {
      const defaultSection = result.sections[0];
      console.log(`\nDefault Section: ${defaultSection.id} - ${defaultSection.title}`);
      console.log("Fields count:", defaultSection.fields?.length);
      console.log("Fields:", defaultSection.fields);
    }
    
    return { success: true, message: "Default section test completed" };
  }
});

// Command to test section ordering and empty section handling
export const testSectionOptions = createCommand({
  name: "test-section-options",
  description: "Test the ApplySectionsMorph with ordering and empty section removal",
  handler: () => {
    // Define section options with ordering and empty removal
    const sectionsOptions: SectionsOptions = {
      fieldSections: {
        name: "personal",
        email: "contact",
        // Note: No fields assigned to "account" section
      },
      sectionOrder: ["contact", "personal", "account"],
      removeEmpty: true
    };
    
    const context: SectionContext = {
      id: "user-form",
      name: "userForm",
      timestamp: Date.now(),
      data: { data: {} },
      sectionsOptions
    };
    
    // Apply sections to the form with layout
    const result = ApplySectionsMorph.transform(formWithLayout, context);
    
    console.log("=== Section Ordering and Empty Section Removal ===");
    console.log("Sections enabled:", result.sectionsEnabled);
    console.log("Section count:", result.sectionCount);
    
    // Check if ordered correctly and empty sections removed
    if (result.sections) {
      console.log("\nSection order:");
      result.sections.forEach((section, index) => {
        console.log(`${index + 1}. ${section.id} - ${section.title}`);
        console.log("   Fields:", section.fields);
      });
      
      // Verify "account" section removed (if empty section removal worked)
      const hasAccountSection = result.sections.some(s => s.id === "account");
      console.log("\nAccount section removed:", !hasAccountSection);
    }
    
    return { success: true, message: "Section options test completed" };
  }
});

// Command to test with fields that have pre-assigned sections
export const testPreassignedSections = createCommand({
  name: "test-preassigned-sections",
  description: "Test the ApplySectionsMorph with fields that have sectionId",
  handler: () => {
    // Create fields with pre-assigned sectionId
    const fieldsWithSections = sampleFields.map(field => {
      if (field.id === "name" || field.id === "bio") {
        return { ...field, sectionId: "custom" };
      }
      return field;
    });
    
    const customForm: SectionShape = {
      ...formWithLayout,
      fields: fieldsWithSections
    };
    
    // No specific section assignments in context
    const context: SectionContext = {
      id: "custom-form",
      name: "customForm",
      timestamp: Date.now(),
      data: { data: {} }
    };
    
    // Apply sections
    const result = ApplySectionsMorph.transform(customForm, context);
    
    console.log("=== Pre-assigned Section Test ===");
    console.log("Sections enabled:", result.sectionsEnabled);
    console.log("Section count:", result.sectionCount);
    
    // Find custom section
    const customSection = result.sections?.find(s => s.id === "custom");
    
    console.log("\nCustom section exists:", Boolean(customSection));
    if (customSection) {
      console.log("Custom section fields:", customSection.fields);
      console.log("Contains 'name':", customSection.fields?.includes("name"));
      console.log("Contains 'bio':", customSection.fields?.includes("bio"));
    }
    
    return { success: true, message: "Pre-assigned sections test completed" };
  }
});

// Export all commands
export default [
  testBasicSections, 
  testDefaultSection, 
  testSectionOptions, 
  testPreassignedSections
];

// Run the test you want
async function run() {
  console.log("Running filter tests...");
  
  try {
    // Pick one or uncomment all of them to run sequentially
    await testBasicSections.execute({} as any);
    await testDefaultSection.execute({} as any);
    await testSectionOptions.execute({} as any);
    await testPreassignedSections.execute({} as any);
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

run();