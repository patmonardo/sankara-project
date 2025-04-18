import { FormShape } from "../../schema/form";
import { CreateContext } from "../mode";
import { applyTemplate } from "./template";

// --- Test Data ---

// Sample form shape
const sampleShape: FormShape = {
  id: "profile-form",
  title: "User Profile",
  description: "User profile information form",
  fields: [
    {
      id: "firstName",
      type: "string",
      label: "First Name",
      required: true,
      defaultValue: ""
    },
    {
      id: "lastName",
      type: "string",
      label: "Last Name",
      required: true,
      defaultValue: ""
    },
    {
      id: "email",
      type: "string",
      label: "Email",
      required: true,
      meta: {
        format: "email"
      },
      defaultValue: ""
    },
    {
      id: "department",
      type: "string",
      label: "Department",
      defaultValue: "",
      meta: {
        templateReadOnly: true // Will be read-only if provided by template
      }
    },
    {
      id: "startDate",
      type: "date",
      label: "Start Date",
      defaultValue: null
    },
    {
      id: "role",
      type: "string",
      label: "Role",
      defaultValue: "",
      meta: {
        excludeTemplate: true // Will never use template value
      }
    }
  ]
};

// Sample template
const sampleTemplate = {
  id: "new-employee",
  name: "New Employee Template",
  description: "Standard template for adding new employees",
  values: {
    firstName: "New",
    lastName: "Employee",
    email: "new.employee@company.com",
    department: "Engineering",
    startDate: new Date().toISOString().split('T')[0] // Today's date
  },
  meta: {
    category: "HR",
    tags: ["onboarding", "employee"]
  }
};

// Standard context
const baseContext: CreateContext = {
  id: "template-test-context",
  name: "Template Test Context",
  timestamp: Date.now(),
  mode: "create"
};

// --- Tests ---

console.log("=== TEMPLATE SYSTEM TESTS ===");

// Test 1: Basic Template Application
console.log("\n--- TEST 1: Basic Template Application ---");
try {
  const result = applyTemplate(sampleShape, sampleTemplate, baseContext);
  
  console.log("Template application successful:", result !== null);
  console.log("Form fields count:", result.fields?.length || 0);
  
  // Check if template values were applied
  const firstNameField = result.fields?.find(f => f.id === "firstName");
  const lastNameField = result.fields?.find(f => f.id === "lastName");
  const emailField = result.fields?.find(f => f.id === "email");
  
  console.log("\nTemplate Values Applied:");
  console.log(`First Name: "${firstNameField?.value}" (expected: "New")`);
  console.log(`Last Name: "${lastNameField?.value}" (expected: "Employee")`);
  console.log(`Email: "${emailField?.value}" (expected: "new.employee@company.com")`);
  
  // Check form metadata - just check what exists, don't assume structure
  console.log("\nTemplate Metadata:");
  console.log("Form meta:", result.meta ? Object.keys(result.meta).join(", ") : "none");
  
  // Title handling
  console.log(`Form title: "${result.meta?.title || "<none>"}"`);
} catch (error) {
  console.error("Error in basic template test:", error);
}

// Test 2: Template ReadOnly Fields
console.log("\n--- TEST 2: Template ReadOnly Fields ---");
try {
  const result = applyTemplate(sampleShape, sampleTemplate, baseContext);
  
  // Check readOnly based on templateReadOnly flag
  const departmentField = result.fields?.find(f => f.id === "department");
  const emailField = result.fields?.find(f => f.id === "email");
  
  console.log("ReadOnly field handling:");
  console.log(`Department field meta keys: ${departmentField?.meta ? Object.keys(departmentField.meta).join(", ") : "none"}`);
  console.log(`Department is readOnly: ${departmentField?.readOnly === true}`);
  console.log(`Email is readOnly: ${emailField?.readOnly === true}`);
} catch (error) {
  console.error("Error in readOnly test:", error);
}

// Test 3: excludeTemplate Fields
console.log("\n--- TEST 3: excludeTemplate Fields ---");
try {
  const result = applyTemplate(sampleShape, sampleTemplate, baseContext);
  
  // Check fields with excludeTemplate
  const roleField = result.fields?.find(f => f.id === "role");
  
  console.log("excludeTemplate field handling:");
  console.log(`Role field meta keys: ${roleField?.meta ? Object.keys(roleField.meta).join(", ") : "none"}`);
  console.log(`Role value: "${roleField?.value}" (should be default, not from template)`);
} catch (error) {
  console.error("Error in excludeTemplate test:", error);
}

// Test 4: Custom Title
console.log("\n--- TEST 4: Custom Title Override ---");
try {
  // Context with title override
  const titleContext: CreateContext = {
    ...baseContext,
    title: "Custom Employee Form"
  };
  
  const result = applyTemplate(sampleShape, sampleTemplate, titleContext);
  
  console.log("Title handling with override:");
  console.log(`Form title: "${result.meta?.title || "<none>"}"`);
} catch (error) {
  console.error("Error in title override test:", error);
}

// Test 5: Field Metadata Examination
console.log("\n--- TEST 5: Field Metadata Examination ---");
try {
  const result = applyTemplate(sampleShape, sampleTemplate, baseContext);
  
  // Examine a field that received a template value
  const firstNameField = result.fields?.find(f => f.id === "firstName");
  
  console.log("Field metadata examination:");
  console.log(`First Name field meta keys: ${firstNameField?.meta ? Object.keys(firstNameField.meta).join(", ") : "none"}`);
  console.log(`First Name value: "${firstNameField?.value}"`);
} catch (error) {
  console.error("Error in metadata examination test:", error);
}

// Test 6: Partial Template
console.log("\n--- TEST 6: Partial Template ---");
try {
  // Template with only some fields
  const partialTemplate = {
    id: "partial-template",
    name: "Partial Employee Template",
    values: {
      firstName: "Partial",
      email: "partial@example.com"
      // No lastName, department, etc.
    }
  };
  
  const result = applyTemplate(sampleShape, partialTemplate, baseContext);
  
  // Check values of various fields
  const firstNameField = result.fields?.find(f => f.id === "firstName");
  const lastNameField = result.fields?.find(f => f.id === "lastName");
  const emailField = result.fields?.find(f => f.id === "email");
  
  console.log("Partial template values:");
  console.log(`First Name value: "${firstNameField?.value}" (should be from template)`);
  console.log(`Last Name value: "${lastNameField?.value}" (should be default)`);
  console.log(`Email value: "${emailField?.value}" (should be from template)`);
} catch (error) {
  console.error("Error in partial template test:", error);
}