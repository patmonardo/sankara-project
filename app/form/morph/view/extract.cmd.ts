import { FormShape } from "../../schema/form";
import { FormExecutionContext } from "../../schema/context";
import { ViewContext } from "../mode";
import { 
  ExtractQualitiesMorph, 
  FilteredQualitiesMorph, 
  defineFieldExtractor,
  QualitiesToDataMorph,
  ExtractedQualities 
} from "./extract";

// --- 1. Sample Input FormShape ---
const sampleShape: FormShape = {
  id: "userProfileForm",
  title: "User Profile Form",
  description: "Comprehensive user information",
  fields: [
    // Basic text fields
    {
      id: "firstName",
      type: "text",
      label: "First Name",
      required: true,
    },
    {
      id: "lastName",
      type: "text",
      label: "Last Name",
      required: true,
    },
    // Field with default value
    {
      id: "email",
      type: "email",
      label: "Email Address",
      required: true,
      defaultValue: "example@domain.com"
    },
    // Numeric field
    {
      id: "age",
      type: "number",
      label: "Age",
      format: "0", // No decimal places
    },
    // Currency field
    {
      id: "salary",
      type: "currency",
      label: "Annual Salary",
      format: "USD",
    },
    // Boolean field
    {
      id: "isActive",
      type: "boolean",
      label: "Active Account",
      defaultValue: true,
    },
    // Date field
    {
      id: "birthDate",
      type: "date",
      label: "Date of Birth",
      format: "medium",
    },
    // Select field with options
    {
      id: "department",
      type: "select",
      label: "Department",
      options: [
        { value: "eng", label: "Engineering" },
        { value: "hr", label: "Human Resources" },
        { value: "sales", label: "Sales" },
        { value: "mkt", label: "Marketing" }
      ],
    },
    // Field with specific metadata
    {
      id: "profileImgUrl",
      type: "url",
      label: "Profile Image URL",
      meta: {
        displayAsImage: true,
        imageSize: "thumbnail"
      },
    },
    // Field that should be excluded from view
    {
      id: "internalNotes",
      type: "textarea",
      label: "Internal Notes",
      excludeFromView: true,
    },
    // Hidden field
    {
      id: "userId",
      type: "string",
      label: "User ID",
      visible: false,
    },
    // Field with custom display type
    {
      id: "skills",
      type: "array",
      label: "Skills",
      format: "tags",
      meta: {
        itemType: "string"
      }
    },
  ],
  meta: {
  }
};

// --- 2. Sample Data ---
const sampleData = {
  firstName: "John",
  lastName: "Smith",
  email: "john.smith@company.com",
  age: 42,
  salary: 85000,
  isActive: true,
  birthDate: "1983-04-12T00:00:00.000Z",
  department: "eng",
  profileImgUrl: "https://example.com/profiles/jsmith.jpg",
  internalNotes: "Promoted twice in last year. Consider for management.",
  userId: "usr_12345",
  skills: ["JavaScript", "TypeScript", "React", "Node.js"]
};

// --- 3. Test Extraction Morphs ---
console.log("===== EXTRACTION MORPHS TESTER =====\n");

// Create base contexts
const baseContext: FormExecutionContext = {
  id: "extractionTestContext",
  name: "Extraction Test Context",
  timestamp: Date.now(),
  mode:  "view", // Add the missing required property
  data: sampleData
};

const viewContext: ViewContext = {
  ...baseContext,
  mode: "view",
  includeFields: ["firstName", "lastName", "email", "department", "isActive", "skills"],
};

// --- Test 1: Basic Extraction ---
console.log("\n--- TEST 1: Basic Field Quality Extraction ---");
console.log("Extracts all fields without filtering or transformation\n");

try {
  const basicExtraction = ExtractQualitiesMorph.apply(sampleShape, baseContext);
  
  console.log(`✓ Extracted ${basicExtraction.qualities.length} field qualities`);
  
  // Show a sample of the extracted fields
  console.log("\nSample Extracted Fields:");
  basicExtraction.qualities.slice(0, 3).forEach(field => {
    console.log(`- ${field.id} (${field.displayType}): ${field.value || '(empty)'}`);
  });
  
  // Show counts by displayType
  const typeCount: Record<string, number> = {};
  basicExtraction.qualities.forEach(q => {
    typeCount[q.displayType] = (typeCount[q.displayType] || 0) + 1;
  });
  
  console.log("\nField Types Breakdown:");
  Object.entries(typeCount).forEach(([type, count]) => {
    console.log(`- ${type}: ${count} fields`);
  });
  
} catch (error) {
  console.error("Error in basic extraction:", error);
}

// --- Test 2: Filtered Extraction ---
console.log("\n--- TEST 2: Filtered Field Extraction ---");
console.log("Applies ViewContext filters to include/exclude fields\n");

try {
  const filteredExtraction = FilteredQualitiesMorph.apply(sampleShape, viewContext);
  
  console.log(`✓ Extracted ${filteredExtraction.qualities.length} fields after filtering`);
  console.log(`  Original shape had ${sampleShape.fields.length} fields`);
  
  // Calculate which fields were filtered out
  const allIds = sampleShape.fields.map(f => f.id);
  const extractedIds = filteredExtraction.qualities.map(q => q.id);
  const missingIds = allIds.filter(id => !extractedIds.includes(id));
  
  console.log("\nIncluded Fields:");
  filteredExtraction.qualities.forEach(field => {
    console.log(`- ${field.id} (${field.label}): ${field.value || '(empty)'}`);
  });
  
  console.log("\nExcluded/Filtered Fields:");
  missingIds.forEach(id => {
    const originalField = sampleShape.fields.find(f => f.id === id);
    if (originalField) {
      console.log(`- ${id} (${originalField.label})`);
      
      // Explain why it was excluded
      if (originalField.excludeFromView) {
        console.log(`  Reason: Field has excludeFromView=true`);
      } else if (originalField.visible === false) {
        console.log(`  Reason: Field has visible=false`);
      } else if (viewContext.includeFields && !viewContext.includeFields.includes(id)) {
        console.log(`  Reason: Field not in includeFields list`);
      } else if (viewContext.excludeFields && viewContext.excludeFields.includes(id)) {
        console.log(`  Reason: Field in excludeFields list`);
      } else {
        console.log(`  Reason: Unknown`);
      }
    }
  });
  
} catch (error) {
  console.error("Error in filtered extraction:", error);
}

// --- Test 3: Custom Field Extractor ---
console.log("\n--- TEST 3: Custom Field Extractor ---");
console.log("Creates a specific extractor for selected fields\n");

// Define a custom field extractor for contact information
const ContactInfoExtractor = defineFieldExtractor(["firstName", "lastName", "email"]);

try {
  const contactInfo = ContactInfoExtractor.apply(sampleShape, baseContext);
  
  console.log(`✓ Extracted ${contactInfo.qualities.length} contact fields`);
  
  console.log("\nContact Information:");
  contactInfo.qualities.forEach(field => {
    console.log(`- ${field.label}: ${field.value || '(empty)'}`);
  });
  
} catch (error) {
  console.error("Error in custom field extraction:", error);
}

// --- Test 4: Qualities to Data ---
console.log("\n--- TEST 4: Qualities to Data Transformation ---");
console.log("Transforms extracted qualities back to a simple data object\n");

try {
  // First extract the fields
  const profileExtraction = defineFieldExtractor([
    "firstName", "lastName", "email", "department", "isActive"
  ]).apply(sampleShape, baseContext);
  
  // Then transform to data
  const profileData = QualitiesToDataMorph.apply(profileExtraction, baseContext);
  
  console.log("✓ Transformed qualities to data object");
  console.log("\nProfile Data:");
  console.log(JSON.stringify(profileData, null, 2));
  
  // Compare to original data
  console.log("\nDifferences from original data:");
  let differences = 0;
  
  Object.entries(profileData).forEach(([key, value]) => {
    if (baseContext.data && baseContext.data[key] !== value) {
      console.log(`- ${key}: ${JSON.stringify(value)} (original: ${JSON.stringify(baseContext.data[key])})`);
      differences++;
    }
  });
  
  if (differences === 0) {
    console.log("- No differences found - extraction preserves original values");
  }
  
} catch (error) {
  console.error("Error in qualities to data transformation:", error);
}

// --- Test 5: Display Type Mapping ---
console.log("\n--- TEST 5: Display Type Mapping ---");
console.log("Shows how different field types map to display types\n");

try {
  // Use the already extracted fields
  const allFields = ExtractQualitiesMorph.apply(sampleShape, baseContext);
  
  // Group by original type and display type
  const mapping: Record<string, Set<string>> = {};
  
  allFields.qualities.forEach(field => {
    if (!mapping[field.type]) {
      mapping[field.type] = new Set();
    }
    mapping[field.type].add(field.displayType);
  });
  
  console.log("Field Type to Display Type Mapping:");
  Object.entries(mapping).forEach(([type, displayTypes]) => {
    console.log(`- ${type} → ${Array.from(displayTypes).join(', ')}`);
  });
  
  // Create a table of all fields showing the mapping
  console.log("\nField Mapping Table:");
  console.log("ID | Label | Field Type | Display Type | Format");
  console.log("---|-------|------------|--------------|-------");
  allFields.qualities.forEach(q => {
    console.log(`${q.id} | ${q.label} | ${q.type} | ${q.displayType} | ${q.format || 'default'}`);
  });
  
} catch (error) {
  console.error("Error in display type mapping test:", error);
}

// --- Test 6: Performance Test ---
console.log("\n--- TEST 6: Performance Test ---");
console.log("Measures extraction performance with larger dataset\n");

try {
  // Create a larger form with many fields
  const largeForm: FormShape = {
    id: "largeForm",
    title: "Large Form",
    fields: Array(100).fill(0).map((_, i) => ({
      id: `field${i}`,
      type: i % 5 === 0 ? "number" : 
            i % 5 === 1 ? "text" : 
            i % 5 === 2 ? "select" :
            i % 5 === 3 ? "boolean" : "date",
      label: `Field ${i}`,
    }))
  };
  
  // Create large dataset
  const largeData: Record<string, any> = {};
  largeForm.fields.forEach((field, i) => {
    if (field.type === "number") largeData[field.id] = i * 10;
    else if (field.type === "text") largeData[field.id] = `Value ${i}`;
    else if (field.type === "select") largeData[field.id] = `option${i % 3}`;
    else if (field.type === "boolean") largeData[field.id] = i % 2 === 0;
    else if (field.type === "date") largeData[field.id] = new Date().toISOString();
  });
  
  const perfContext: FormExecutionContext = {
    ...baseContext,
    data: largeData
  };
  
  console.log(`Testing with form containing ${largeForm.fields.length} fields`);
  
  // Time the extraction
  const startTime = performance.now();
  const extracted = ExtractQualitiesMorph.apply(largeForm, perfContext);
  const endTime = performance.now();
  
  console.log(`✓ Extracted ${extracted.qualities.length} fields in ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`  Average: ${((endTime - startTime) / largeForm.fields.length).toFixed(3)}ms per field`);
  
} catch (error) {
  console.error("Error in performance test:", error);
}

console.log("\n===== EXTRACTION TESTS COMPLETE =====");