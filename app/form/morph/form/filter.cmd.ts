import { createCommand } from "@/form/modality/commands";
import { ValuePipeline } from "@./values";
import {
  FilterShape,
  FilterContext,
  FilterField,
  FilterWhereMorph,
  FilterOrderMorph,
  FilterLimitMorph,
} from "./filter";

// Sample field data for testing
const sampleFields: FilterField[] = [
  { id: "name", name: "Name", type: "string", value: "John Doe" },
  { id: "age", name: "Age", type: "number", value: 30 },
  { id: "email", name: "Email", type: "string", value: "john@example.com" },
  { id: "active", name: "Active", type: "boolean", value: true },
  { id: "role", name: "Role", type: "string", value: "admin" },
  { id: "joined", name: "Join Date", type: "date", value: "2022-01-15" },
  { id: "notes", name: "Notes", type: "text", value: "Some notes about John" },
];

// Create a sample form
const sampleForm: FilterShape = {
  id: "user-form",
  name: "userForm",
  title: "User Information",
  fields: sampleFields,
};

// Command to test FilterWhereMorph
export const testFilterWhere = createCommand({
  name: "test-filter-where",
  description: "Test the FilterWhereMorph with different conditions",
  handler: () => {
    // Test 1: Include only specific fields
    const includeContext: FilterContext = {
      id: "user-form",
      name: "userForm",
      timestamp: 0,
      data: { data: {} },
      filterFields: ["name", "email", "role"],
    };

    const includeResult = FilterWhereMorph.transform(
      sampleForm,
      includeContext
    );
    console.log("=== Include only specific fields ===");
    console.log("Fields count:", includeResult.fields.length);
    console.log(
      "Field IDs:",
      includeResult.fields.map((f) => f.id)
    );
    console.log("Filter Applied:", includeResult.filterApplied);
    console.log("Filter Criteria:", includeResult.filterCriteria);

    // Test 2: Field value condition
    const valueContext: FilterContext = {
      id: "user-form",
      name: "userForm",
      timestamp: 0,
      data: { data: {} },
      filterValues: { active: true },
    };

    const valueResult = FilterWhereMorph.transform(sampleForm, valueContext);
    console.log("\n=== Filter by field value ===");
    console.log("Fields count:", valueResult.fields.length);
    console.log(
      "Field IDs:",
      valueResult.fields.map((f) => f.id)
    );
    console.log("Filter Applied:", valueResult.filterApplied);

    // Test 3: Where conditions
    const whereContext: FilterContext = {
      id: "user-form",
      name: "userForm",
      timestamp: 0,
      data: { data: {} },
      filterWhere: ["age:>:25", "name:contains:John"],
    };

    const whereResult = FilterWhereMorph.transform(sampleForm, whereContext);
    console.log("\n=== Filter by where conditions ===");
    console.log("Fields count:", whereResult.fields.length);
    console.log(
      "Field IDs:",
      whereResult.fields.map((f) => f.id)
    );
    console.log("Filter Criteria:", whereResult.filterCriteria);

    // Check field metadata
    const nameField = whereResult.fields.find((f) => f.id === "name");
    console.log("\n=== Field metadata for 'name' field ===");
    console.log("Filter Applied:", nameField?.filterApplied);
    console.log("Filter Reasons:", nameField?.filterReasons);

    return { success: true, message: "FilterWhereMorph tests completed" };
  },
});

// Command to test FilterOrderMorph
export const testFilterOrder = createCommand({
  name: "test-filter-order",
  description: "Test the FilterOrderMorph with different ordering",
  handler: () => {
    // Test ordering by multiple fields
    const orderContext: FilterContext = {
      id: "user-form",
      name: "userForm",
      timestamp: 0,
      data: { data: {} },
      filterOrder: ["role:asc", "name:desc"],
    };

    const orderResult = FilterOrderMorph.transform(sampleForm, orderContext);
    console.log("=== Order fields by role (asc) then name (desc) ===");
    console.log(
      "Field order:",
      orderResult.fields.map((f) => f.id)
    );
    console.log("Order Applied:", orderResult.orderApplied);
    console.log("Order Criteria:", orderResult.orderCriteria);

    // Check field metadata
    const firstField = orderResult.fields[0];
    console.log("\n=== First field in order ===");
    console.log("Field ID:", firstField.id);
    console.log("Order Position:", firstField.orderPosition);
    console.log("Order Direction:", firstField.orderDirection);

    return { success: true, message: "FilterOrderMorph tests completed" };
  },
});

// Command to test FilterLimitMorph
export const testFilterLimit = createCommand({
  name: "test-filter-limit",
  description: "Test the FilterLimitMorph with pagination",
  handler: () => {
    // Test limiting results
    const limitContext: FilterContext = {
      id: "user-form",
      name: "userForm",
      timestamp: 0,
      data: { data: {} },
      filterLimit: 3,
      filterSkip: 2,
    };

    const limitResult = FilterLimitMorph.transform(sampleForm, limitContext);
    console.log("=== Limit to 3 fields, skipping first 2 ===");
    console.log("Original field count:", sampleForm.fields.length);
    console.log("Limited field count:", limitResult.fields.length);
    console.log(
      "Field IDs after limit:",
      limitResult.fields.map((f) => f.id)
    );
    console.log("Pagination Before:", limitResult.paginationBefore);
    console.log("Pagination After:", limitResult.paginationAfter);
    console.log("Pagination Skip:", limitResult.paginationSkip);
    console.log("Pagination Limit:", limitResult.paginationLimit);

    // Check field metadata
    const firstField = limitResult.fields[0];
    console.log("\n=== First field pagination info ===");
    console.log("Field ID:", firstField.id);
    console.log("Limit Applied:", firstField.limitApplied);
    console.log("Skip Value:", firstField.skipValue);
    console.log("Limit Value:", firstField.limitValue);

    return { success: true, message: "FilterLimitMorph tests completed" };
  },
});

// Command to test the full pipeline
export const testFullPipeline = createCommand({
  name: "test-filter-pipeline",
  description: "Test the complete field values pipeline",
  handler: () => {
    // Create a complex context that applies filtering, ordering and limiting
    const complexContext: FilterContext = {
      id: "user-form",
      name: "userForm",
      timestamp: 0,
      data: { data: {} },
      filterFields: ["name", "age", "email", "role", "active"],
      filterWhere: ["age:>:25"],
      filterOrder: ["role:asc", "name:asc"],
      filterLimit: 2,
      filterSkip: 1,
    };

    // Apply the full pipeline
    const result = FieldValuesPipeline.run(sampleForm, complexContext);

    console.log("=== Full Pipeline Result ===");
    console.log("Original field count:", sampleForm.fields.length);
    console.log("Result field count:", result.fields.length);
    console.log(
      "Result field IDs:",
      result.fields.map((f) => f.id)
    );

    // Check filter attributes
    console.log("\n=== Filter attributes ===");
    console.log("Filter Applied:", result.filterApplied);
    console.log("Filter Criteria:", result.filterCriteria);

    // Check order attributes
    console.log("\n=== Order attributes ===");
    console.log("Order Applied:", result.orderApplied);
    console.log("Order Criteria:", result.orderCriteria);

    // Check pagination attributes
    console.log("\n=== Pagination attributes ===");
    console.log("Pagination Before:", result.paginationBefore);
    console.log("Pagination After:", result.paginationAfter);
    console.log("Pagination Skip:", result.paginationSkip);
    console.log("Pagination Limit:", result.paginationLimit);

    // Validate first field has all the expected properties
    const firstField = result.fields[0];
    console.log(firstField);
    console.log("\n=== First field complete attributes ===");
    //console.log("Field ID:", firstField.id);
    //console.log("Filter Applied:", firstField.filterApplied);
    //console.log("Filter Reasons:", firstField.filterReasons);
    //console.log("Order Position:", firstField.orderPosition);
    //console.log("Order Direction:", firstField.orderDirection);
    //console.log("Limit Applied:", firstField.limitApplied);
    //console.log("Skip Value:", firstField.skipValue);
    //console.log("Limit Value:", firstField.limitValue);

    // Check if any undeclared properties exist
    const fieldKeys = Object.keys(firstField);
    const expectedKeys = [
      "id",
      "title",
      "type",
      "value",
      "filterApplied",
      "filterReasons",
      "orderPosition",
      "orderDirection",
      "limitApplied",
      "skipValue",
      "limitValue",
    ];

    const unexpectedKeys = fieldKeys.filter(
      (key) => !expectedKeys.includes(key)
    );
    console.log("\n=== Unexpected properties check ===");
    console.log(
      "Unexpected keys:",
      unexpectedKeys.length > 0 ? unexpectedKeys : "None"
    );

    return {
      success: true,
      message: "Full filter pipeline test completed",
      data: result,
    };
  },
});

// Export all commands
export default [
  testFilterWhere,
  testFilterOrder,
  testFilterLimit,
  testFullPipeline,
];

// Run the test you want
async function run() {
  console.log("Running filter tests...");
  
  try {
    // Pick one or uncomment all of them to run sequentially
    await testFilterWhere.execute({} as any);
    await testFilterOrder.execute({} as any);
    await testFilterLimit.execute({} as any);
    await testFullPipeline.execute({} as any);
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

run();