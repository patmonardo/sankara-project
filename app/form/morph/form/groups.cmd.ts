import { createCommand } from "@/form/modality/commands";
import { 
  GroupedShape, 
  GroupedField,
  GroupedContext, 
  GroupingOptions,
  ApplyGroupMorph,
  withGrouping
} from "./groups";
import { FieldValue } from "./value";

// Sample field data for testing
const sampleFields: FieldValue[] = [
  { id: "firstName", name: "First Name", type: "string", value: "John" },
  { id: "lastName", name: "Last Name", type: "string", value: "Doe" },
  { id: "email", name: "Email Address", type: "string", value: "john@example.com" },
  { id: "phone", name: "Phone Number", type: "string", value: "555-1234" },
  { id: "companyName", name: "Company", type: "string", value: "Acme Corp" },
  { id: "jobTitle", name: "Job Title", type: "string", value: "Developer" },
  { id: "department", name: "Department", type: "string", value: "Engineering" },
  { id: "username", name: "Username", type: "string", value: "john_doe" },
  { id: "password", name: "Password", type: "password" },
  { id: "confirmPassword", name: "Confirm Password", type: "password" },
  { id: "acceptTerms", name: "Accept Terms", type: "boolean", value: false },
];

// Create a sample form
const sampleForm: GroupedShape = {
  id: "registration-form",
  name: "registrationForm",
  title: "User Registration",
  fields: sampleFields,
  groupedFields: []
};

// Command to test basic grouping
export const testBasicGrouping = createCommand({
  name: "test-basic-grouping",
  description: "Test basic field grouping with default options",
  handler: () => {
    // Create a basic grouping context
    const groupingOptions: GroupingOptions = {
      defaultGroup: "general",
    };
    
    const context = withGrouping(
      { 
        id: "registration-form",
        name: "registrationForm",
        timestamp: Date.now()
      }, 
      groupingOptions
    );
    
    // Apply grouping
    const result = ApplyGroupMorph.transform(sampleForm, context);
    
    console.log("=== Basic Grouping Test ===");
    console.log("Grouping enabled:", result.meta?.grouping.enabled);
    console.log("Group count:", result.meta?.grouping.count);
    
    // Check that all fields were assigned to the default group
    const defaultGroupFields = result.groupedFields.filter(f => 
      f.group === "general" && f.meta?.grouping?.groupId === "general");
    
    console.log("Fields in default group:", defaultGroupFields.length);
    console.log("All fields assigned to default group:", 
      defaultGroupFields.length === sampleFields.length);
    
    // Check an individual field's group metadata
    const sampleField = result.groupedFields[0];
    console.log("\nSample field group structure:");
    console.log("Field ID:", sampleField.id);
    console.log("Group ID:", sampleField.group);
    console.log("Group Title:", sampleField.meta?.grouping?.groupTitle);
    
    return { success: true, message: "Basic grouping test completed" };
  }
});

// Command to test custom group assignment
export const testCustomGroupAssignment = createCommand({
  name: "test-custom-groups",
  description: "Test assigning fields to custom groups",
  handler: () => {
    // Create grouping options with predefined groups and field assignments
    const groupingOptions: GroupingOptions = {
      defaultGroup: "other",
      groups: [
        { id: "personal", title: "Personal Information" },
        { id: "contact", title: "Contact Details" },
        { id: "work", title: "Work Information" },
        { id: "account", title: "Account Setup" },
      ],
      fieldGroups: {
        firstName: "personal",
        lastName: "personal",
        email: "contact",
        phone: "contact",
        companyName: "work",
        jobTitle: "work",
        department: "work",
        username: "account",
        password: "account",
        confirmPassword: "account",
        acceptTerms: "account",
      }
    };
    
    const context = withGrouping(
      { 
        id: "registration-form",
        name: "registrationForm",
        timestamp: Date.now()
      }, 
      groupingOptions
    );
    
    // Apply grouping
    const result = ApplyGroupMorph.transform(sampleForm, context);
    
    console.log("=== Custom Groups Test ===");
    console.log("Group count:", result.meta?.grouping.count);
    
    // Count fields in each group
    const groups: Record<string, number> = {};
    result.groupedFields.forEach(field => {
      const groupId = field.group!;
      groups[groupId] = (groups[groupId] || 0) + 1;
    });
    
    console.log("\nField distribution by group:");
    Object.entries(groups).forEach(([groupId, count]) => {
      console.log(`- ${groupId}: ${count} fields`);
    });
    
    // Verify some specific assignments
    console.log("\nVerifying field assignments:");
    const emailField = result.groupedFields.find(f => f.id === "email");
    const usernameField = result.groupedFields.find(f => f.id === "username");
    
    console.log("Email field in contact group:", emailField?.group === "contact");
    console.log("Email group title:", emailField?.meta?.grouping?.groupTitle);
    console.log("Username field in account group:", usernameField?.group === "account");
    
    return { success: true, message: "Custom groups test completed" };
  }
});

// Command to test pre-defined field groups
export const testPreassignedGroups = createCommand({
  name: "test-preassigned-groups",
  description: "Test fields with pre-assigned groups",
  handler: () => {
    // Create fields with pre-assigned groups
    const fieldsWithGroups = sampleFields.map(field => {
      if (field.id === "firstName" || field.id === "lastName") {
        return { ...field, group: "profile" };
      }
      if (field.id === "username" || field.id === "password" || field.id === "confirmPassword") {
        return { ...field, group: "security" };
      }
      return field;
    });
    
    const customForm: GroupedShape = {
      ...sampleForm,
      fields: fieldsWithGroups,
      groupedFields: []
    };
    
    // Simple context with default options
    const context = withGrouping(
      { 
        id: "registration-form",
        name: "registrationForm",
        timestamp: Date.now()
      },
      { 
        defaultGroup: "general",
        removeEmpty: false
      }
    );
    
    // Apply grouping
    const result = ApplyGroupMorph.transform(customForm, context);
    
    console.log("=== Pre-assigned Groups Test ===");
    console.log("Group count:", result.meta?.grouping.count);
    
    // Count fields in each group
    const groups: Record<string, number> = {};
    result.groupedFields.forEach(field => {
      const groupId = field.group!;
      groups[groupId] = (groups[groupId] || 0) + 1;
    });
    
    console.log("\nField distribution by group:");
    Object.entries(groups).forEach(([groupId, count]) => {
      console.log(`- ${groupId}: ${count} fields`);
    });
    
    // Verify pre-assigned groups were respected
    console.log("\nVerifying pre-assigned groups:");
    const nameField = result.groupedFields.find(f => f.id === "firstName");
    const passwordField = result.groupedFields.find(f => f.id === "password");
    
    console.log("First name field in profile group:", nameField?.group === "profile");
    console.log("Password field in security group:", passwordField?.group === "security");
    
    return { success: true, message: "Pre-assigned groups test completed" };
  }
});

// Command to test group ordering and empty group removal
export const testGroupOptions = createCommand({
  name: "test-group-options",
  description: "Test group ordering and empty group removal",
  handler: () => {
    // Create grouping options with ordering and empty removal
    const groupingOptions: GroupingOptions = {
      defaultGroup: "other",
      groups: [
        { id: "personal", title: "Personal Information" },
        { id: "contact", title: "Contact Details" },
        { id: "empty", title: "Empty Group" }, // This should get removed
        { id: "account", title: "Account Setup" },
      ],
      fieldGroups: {
        firstName: "personal",
        lastName: "personal",
        email: "contact",
        phone: "contact",
        username: "account",
        password: "account",
        confirmPassword: "account",
      },
      removeEmpty: true,
      groupOrder: ["account", "personal", "contact", "other"] // Specific order
    };
    
    const context = withGrouping(
      { 
        id: "registration-form",
        name: "registrationForm",
        timestamp: Date.now()
      }, 
      groupingOptions
    );
    
    // Apply grouping
    const result = ApplyGroupMorph.transform(sampleForm, context);
    
    console.log("=== Group Options Test ===");
    
    // Check if empty group was removed
    const hasEmptyGroup = result.groupedFields.some(f => f.group === "empty");
    console.log("Empty group removed:", !hasEmptyGroup);
    
    // Get unique groups in order they appear
    const groupOrder: string[] = [];
    result.groupedFields.forEach(field => {
      const groupId = field.group!;
      if (!groupOrder.includes(groupId)) {
        groupOrder.push(groupId);
      }
    });
    
    console.log("\nGroup order as they appear:");
    console.log(groupOrder);
    console.log("\nMatches specified order:", 
      JSON.stringify(groupOrder) === JSON.stringify(["account", "personal", "contact", "other"]));
    
    return { success: true, message: "Group options test completed" };
  }
});

// Command to display a complete grouped form structure
export const displayFullStructure = createCommand({
  name: "display-full-structure",
  description: "Display the full structure of a grouped form",
  handler: () => {
    // Create comprehensive grouping options 
    const groupingOptions: GroupingOptions = {
      defaultGroup: "other",
      groups: [
        { id: "personal", title: "Personal Information", description: "Your personal details" },
        { id: "contact", title: "Contact Information", description: "How we can reach you" },
        { id: "work", title: "Employment Details", description: "Your work information" },
        { id: "account", title: "Account Setup", description: "Set up your login credentials" },
      ],
      fieldGroups: {
        firstName: "personal",
        lastName: "personal",
        email: "contact",
        phone: "contact",
        companyName: "work",
        jobTitle: "work",
        department: "work",
        username: "account",
        password: "account",
        confirmPassword: "account",
        acceptTerms: "account",
      },
      groupOrder: ["personal", "contact", "work", "account", "other"]
    };
    
    const context = withGrouping(
      { 
        id: "registration-form",
        name: "registrationForm",
        timestamp: Date.now()
      }, 
      groupingOptions
    );
    
    // Apply grouping
    const result = ApplyGroupMorph.transform(sampleForm, context);
    
    console.log("=== Complete Grouped Form Structure ===");
    console.log("Form ID:", result.id);
    console.log("Form Title:", result.title);
    console.log("Groups enabled:", result.meta?.grouping.enabled);
    console.log("Group count:", result.meta?.grouping.count);
    
    // Organize fields by group for display
    const groupedOutput: Record<string, any> = {};
    result.groupedFields.forEach(field => {
      const groupId = field.group!;
      const groupTitle = field.meta?.grouping?.groupTitle;
      
      if (!groupedOutput[groupId]) {
        groupedOutput[groupId] = {
          id: groupId,
          title: groupTitle,
          fields: []
        };
      }
      
      groupedOutput[groupId].fields.push({
        id: field.id,
        name: field.name,
        type: field.type
      });
    });
    
    console.log("\nOrganized form structure:");
    Object.values(groupedOutput).forEach(group => {
      console.log(`\nGroup: ${group.title} (${group.id})`);
      console.log("Fields:");
      group.fields.forEach((f: any) => {
        console.log(`- ${f.name} (${f.id}): ${f.type}`);
      });
    });
    
    // Check for any unexpected properties in the result
    const fieldKeys = Object.keys(result.groupedFields[0] || {});
    const expectedKeys = [
      "id", "name", "type", "value", "group", "meta"
    ];
    
    const unexpectedKeys = fieldKeys.filter(key => !expectedKeys.includes(key));
    console.log("\n=== Unexpected properties check ===");
    console.log("Unexpected keys:", unexpectedKeys.length > 0 ? unexpectedKeys : "None");
    
    return { 
      success: true, 
      message: "Full structure display completed",
      data: result
    };
  }
});

// Export all commands
export default [
  testBasicGrouping, 
  testCustomGroupAssignment, 
  testPreassignedGroups, 
  testGroupOptions,
  displayFullStructure
];


// Run the test you want
async function run() {
  console.log("Running filter tests...");
  
  try {
    // Pick one or uncomment all of them to run sequentially
    await testBasicGrouping.execute({} as any);
    await testCustomGroupAssignment.execute({} as any);
    await testPreassignedGroups.execute({} as any);
    await testGroupOptions.execute({} as any);
    await displayFullStructure.execute({} as any);
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

run();