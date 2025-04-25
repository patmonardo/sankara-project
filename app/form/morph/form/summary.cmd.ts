import { createCommand } from "@/form/modality/commands";
import {
  SummaryShape,
  SummaryField,
  SummaryContext,
  SummaryConfig,
  SummaryMorph,
} from "./summary";
import { FilterField } from "./filter";

// Sample field data for testing
const sampleFields: (FilterField & SummaryField)[] = [
  {
    id: "fullName",
    label: "Full Name",
    type: "string",
    value: "John Smith",
    importance: 90,
    order: 1,
  },
  {
    id: "email",
    label: "Email Address",
    type: "string",
    value: "john@example.com",
    importance: 85,
    order: 2,
  },
  {
    id: "phone",
    label: "Phone Number",
    type: "string",
    value: "555-1234",
    importance: 70,
    order: 3,
  },
  {
    id: "jobTitle",
    label: "Job Title",
    type: "string",
    value: "Senior Developer",
    importance: 60,
    order: 4,
  },
  {
    id: "department",
    label: "Department",
    type: "string",
    value: "Engineering",
    importance: 65,
    order: 5,
  },
  {
    id: "salary",
    label: "Salary",
    type: "number",
    value: 95000,
    importance: 75,
    order: 6,
  },
  {
    id: "startDate",
    label: "Start Date",
    type: "date",
    value: "2020-03-15",
    importance: 60,
    order: 7,
  },
  {
    id: "manager",
    label: "Manager",
    type: "string",
    value: "Jane Doe",
    importance: 50,
    order: 8,
  },
  {
    id: "address",
    label: "Address",
    type: "string",
    value: "123 Main St",
    importance: 40,
    order: 9,
  },
  {
    id: "skills",
    label: "Skills",
    type: "array",
    value: ["JavaScript", "TypeScript", "React"],
    importance: 55,
    order: 10,
  },
  {
    id: "notes",
    label: "Notes",
    type: "text",
    value: "Excellent team player",
    importance: 30,
    order: 11,
  },
  {
    id: "profilePic",
    label: "Profile Picture",
    type: "image",
    value: "profile.jpg",
    importance: 20,
    order: 12,
  },
];

// Create a sample form
const sampleForm: SummaryShape = {
  id: "employee-profile",
  name: "employeeProfile",
  title: "Employee Information",
  fields: sampleFields,
  originalFieldCount: 0,
  includedFieldCount: 0,
};

// Command to test basic summary with include mode
export const testIncludeSummary = createCommand({
  name: "test-include-summary",
  description: "Test the SummaryMorph with include mode",
  handler: () => {
    // Create summary config with include mode
    const summaryConfig: SummaryConfig = {
      mode: "include",
      fields: ["fullName", "email", "jobTitle", "salary"],
      showValues: true,
    };

    const context: SummaryContext = {
      id: "employee-profile",
      name: "employeeProfile",
      timestamp: Date.now(),
      summary: summaryConfig,
    };

    const result = SummaryMorph.transform(sampleForm, context);

    console.log("=== Include Mode Summary Test ===");
    console.log("Original field count:", sampleForm.fields.length);
    console.log("Summary field count:", result.fields.length);

    // Check that only specified fields are included
    const fieldIds = result.fields.map((f) => f.id);
    console.log("\nIncluded fields:", fieldIds);
    console.log(
      "All specified fields included:",
      summaryConfig.fields?.every((id) => fieldIds.includes(id))
    );

    return { success: true, message: "Include summary test completed" };
  },
});

// Command to test exclude mode
export const testExcludeSummary = createCommand({
  name: "test-exclude-summary",
  description: "Test the SummaryMorph with exclude mode",
  handler: () => {
    // Create summary config with exclude mode
    const summaryConfig: SummaryConfig = {
      mode: "exclude",
      fields: ["notes", "address", "profilePic", "skills", "manager"],
      showValues: true,
    };

    const context: SummaryContext = {
      id: "employee-profile",
      name: "employeeProfile",
      timestamp: Date.now(),
      summary: summaryConfig,
    };

    const result = SummaryMorph.transform(sampleForm, context);

    console.log("=== Exclude Mode Summary Test ===");
    console.log("Original field count:", sampleForm.fields.length);
    console.log("Summary field count:", result.fields.length);

    // Check that specified fields are excluded
    const fieldIds = result.fields.map((f) => f.id);
    console.log("\nIncluded fields:", fieldIds);
    console.log(
      "All excluded fields removed:",
      summaryConfig.fields?.every((id) => !fieldIds.includes(id))
    );

    return { success: true, message: "Exclude summary test completed" };
  },
});

// Command to test importance-based sorting
export const testImportanceSorting = createCommand({
  name: "test-importance-sorting",
  description: "Test the SummaryMorph with importance-based sorting",
  handler: () => {
    // Create summary config with importance sorting
    const summaryConfig: SummaryConfig = {
      maxFields: 5,
      sortBy: "importance",
      showValues: true,
    };

    const context: SummaryContext = {
      id: "employee-profile",
      name: "employeeProfile",
      timestamp: Date.now(),
      data: {
        data: {},
        summary: summaryConfig,
      },
    };

    const result = SummaryMorph.transform(sampleForm, context);

    console.log("=== Importance Sorting Test ===");
    console.log("Fields limited to:", summaryConfig.maxFields);

    // Check field order by importance
    console.log("\nFields in importance order:");
    result.fields.forEach((field, index) => {
      console.log(
        `${index + 1}. ${field.label} (${field.id}) - Importance: ${
          (field as SummaryField).importance
        }`
      );
    });

    // Verify sorting is correct
    const importanceValues = result.fields.map(
      (f) => (f as SummaryField).importance || 0
    );
    const isSorted = importanceValues.every(
      (val, i) => i === 0 || val <= importanceValues[i - 1]
    );

    console.log("\nCorrectly sorted by importance:", isSorted);

    return { success: true, message: "Importance sorting test completed" };
  },
});

// Command to test order-based sorting
export const testOrderSorting = createCommand({
  name: "test-order-sorting",
  description: "Test the SummaryMorph with order-based sorting",
  handler: () => {
    // Create summary config with order sorting
    const summaryConfig: SummaryConfig = {
      maxFields: 6,
      sortBy: "order",
      showValues: true,
    };

    const context: SummaryContext = {
      id: "employee-profile",
      name: "employeeProfile",
      timestamp: Date.now(),
      summary: summaryConfig,
    };

    const result = SummaryMorph.transform(sampleForm, context);

    console.log("=== Order Sorting Test ===");
    console.log("Fields limited to:", summaryConfig.maxFields);

    // Check field order by explicit order property
    console.log("\nFields in explicit order:");
    result.fields.forEach((field, index) => {
      console.log(
        `${index + 1}. ${field.label} (${field.id}) - Order: ${
          (field as SummaryField).order
        }`
      );
    });

    // Verify sorting is correct
    const orderValues = result.fields.map(
      (f) => (f as SummaryField).order || 0
    );
    const isSorted = orderValues.every(
      (val, i) => i === 0 || val >= orderValues[i - 1]
    );

    console.log("\nCorrectly sorted by order:", isSorted);

    return { success: true, message: "Order sorting test completed" };
  },
});

// Command to test label-based sorting
export const testLabelSorting = createCommand({
  name: "test-label-sorting",
  description: "Test the SummaryMorph with label-based sorting",
  handler: () => {
    // Create summary config with label sorting
    const summaryConfig: SummaryConfig = {
      maxFields: 8,
      sortBy: "label",
      showValues: true,
    };

    const context: SummaryContext = {
      id: "employee-profile",
      name: "employeeProfile",
      timestamp: Date.now(),
      summary: summaryConfig,
    };

    const result = SummaryMorph.transform(sampleForm, context);

    console.log("=== Label Sorting Test ===");
    console.log("Fields limited to:", summaryConfig.maxFields);

    // Check field order by label
    console.log("\nFields in alphabetical order by label:");
    result.fields.forEach((field, index) => {
      console.log(`${index + 1}. ${field.label} (${field.id})`);
    });

    // Verify sorting is correct
    const labels = result.fields.map((f) => f.label || "");
    const sortedLabels = [...labels].sort();
    const isSorted = labels.every((label, i) => label === sortedLabels[i]);

    console.log("\nCorrectly sorted alphabetically:", isSorted);

    return { success: true, message: "Label sorting test completed" };
  },
});

// Command to test max fields limitation
export const testMaxFields = createCommand({
  name: "test-max-fields",
  description: "Test the SummaryMorph with maxFields limitation",
  handler: () => {
    // Test with different maxFields values
    const maxFieldsValues = [3, 5, 10];

    console.log("=== Max Fields Limitation Test ===");

    maxFieldsValues.forEach((maxFields) => {
      const summaryConfig: SummaryConfig = {
        maxFields,
        sortBy: "importance",
      };

      const context: SummaryContext = {
        id: "employee-profile",
        name: "employeeProfile",
        timestamp: Date.now(),
        summary: summaryConfig,
      };

      const result = SummaryMorph.transform(sampleForm, context);

      console.log(`\nWith maxFields = ${maxFields}:`);
      console.log("Fields in summary:", result.fields.length);
      console.log("Adheres to limit:", result.fields.length <= maxFields);
    });

    return { success: true, message: "Max fields test completed" };
  },
});

// Command to display metadata
export const testSummaryMetadata = createCommand({
  name: "test-summary-metadata",
  description: "Test the metadata generated by SummaryMorph",
  handler: () => {
    // Create standard summary config
    const summaryConfig: SummaryConfig = {
      maxFields: 5,
      sortBy: "importance",
    };

    const context: SummaryContext = {
      id: "employee-profile",
      name: "employeeProfile",
      timestamp: Date.now(),
      summary: summaryConfig,
    };

    const result = SummaryMorph.transform(sampleForm, context);

    console.log("=== Summary Metadata Test ===");
    console.log("Original field count:", sampleForm.fields.length);
    console.log("Included field count:", result.fields.length);

    // Check metadata in result
    console.log("\nMetadata verification:");
    console.log("meta.summary exists:", Boolean(result.summary));
    console.log("Original field count in meta:", result.originalFieldCount);
    console.log("Included field count in meta:", result.includedFieldCount);

    return {
      success: true,
      message: "Summary metadata test completed",
      data: result.meta,
    };
  },
});

// Export all commands
export default [
  testIncludeSummary,
  testExcludeSummary,
  testImportanceSorting,
  testOrderSorting,
  testLabelSorting,
  testMaxFields,
  testSummaryMetadata,
];

// Run the test you want
async function run() {
  console.log("Running filter tests...");

  try {
    // Pick one or uncomment all of them to run sequentially
    await testIncludeSummary.execute({} as any);
    await testExcludeSummary.execute({} as any);
    await testImportanceSorting.execute({} as any);
    await testOrderSorting.execute({} as any);
    await testLabelSorting.execute({} as any);
    await testMaxFields.execute({} as any);
    await testSummaryMetadata.execute({} as any);
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

run();
