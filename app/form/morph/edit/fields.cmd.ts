import { FormShape } from "../../schema/form";
import { EditContext } from "../core/mode";
import {
  EditFieldValuesMorph,
  EditFieldConstraintsMorph,
  EditFieldHistoryMorph,
  EditFieldsPipeline,
} from "./fields";
import { EditModePipeline, EditOutput } from "./pipeline";

console.log("=== EDIT FIELD MORPHS TESTS ===");

// --- Sample Form Schema ---
const testForm: FormShape = {
  id: "field-test-form",
  title: "Field Test Form",
  fields: [
    {
      id: "name",
      type: "text",
      label: "Name",
      required: true,
      defaultValue: "Default Name",
    },
    {
      id: "email",
      type: "text",
      label: "Email",
      meta: {
        format: "email",
      },
    },
    {
      id: "age",
      type: "number",
      label: "Age",
      defaultValue: 25,
    },
    {
      id: "notes",
      type: "text",
      label: "Notes",
      meta: {
        multiline: true,
      },
    },
    {
      id: "readOnlyField",
      type: "text",
      label: "Read-Only Field",
      meta: {
        editReadOnly: true,
      },
    },
  ],
};

// --- Test 1: Field Values Morph ---
console.log("\n--- TEST 1: EditFieldValuesMorph ---");

// Context with data for some fields
const valueContext: EditContext = {
  id: "field-values-test",
  name: "field-values-test",
  mode: "edit",
  targetId: "test-entity-123",
  timestamp: Date.now(),
  data: {
    name: "John Doe",
    email: "john@example.com",
    // No age or notes, should use defaults
  },
};

try {
  // Get basic edit output to work with
  const editOutput = EditModePipeline.apply(testForm, valueContext);

  // Apply field values morph
  const result = EditFieldValuesMorph.apply(editOutput, valueContext);

  console.log("\n--- Field Values Check ---");
  result.fields.forEach((field) => {
    console.log(`${field.id}: ${JSON.stringify(field.value)}`);
  });

  console.log("\n--- Field Value Sources ---");
  console.log(
    `From data: ${
      result.fields.find((f) => f.id === "name")?.value === "John Doe"
    }`
  );
  console.log(
    `From data: ${
      result.fields.find((f) => f.id === "email")?.value === "john@example.com"
    }`
  );
  console.log(
    `From default: ${result.fields.find((f) => f.id === "age")?.value === 25}`
  );
  console.log(
    `No default provided: ${
      result.fields.find((f) => f.id === "notes")?.value === undefined
    }`
  );

  console.log("\n--- Metadata Initialization ---");
  const nameField = result.fields.find((f) => f.id === "name");
  console.log(`Field has mode: ${nameField?.meta?.mode === "edit"}`);
  console.log(`Field has pristine: ${nameField?.meta?.pristine === true}`);
  console.log(`Field has touched: ${nameField?.meta?.touched === false}`);
} catch (error) {
  console.error("\n--- Error in Field Values Test ---");
  console.error(error);
}

// --- Test 2: Field Constraints Morph ---
console.log("\n\n--- TEST 2: EditFieldConstraintsMorph ---");

// Context with readOnly fields
const constraintContext: EditContext = {
  id: "field-constraints-test",
  name: "field-constraints-test",
  mode: "edit",
  timestamp: Date.now(),
  targetId: "entity-123", // Required for edit mode
  data: {},
  readOnlyFields: ["email"], // Make email field read-only
};

try {
  // Get basic edit output with values
  const editOutput = EditModePipeline.apply(testForm, constraintContext);
  const withValues = EditFieldValuesMorph.apply(editOutput, constraintContext);

  // Apply constraints
  const result = EditFieldConstraintsMorph.apply(withValues, constraintContext);

  console.log("\n--- ReadOnly Fields Check ---");
  console.log(
    `Email (from context): ${
      result.fields.find((f) => f.id === "email")?.readOnly === true
    }`
  );
  console.log(
    `ReadOnlyField (from meta): ${
      result.fields.find((f) => f.id === "readOnlyField")?.readOnly === true
    }`
  );
  console.log(
    `Name (editable): ${
      result.fields.find((f) => f.id === "name")?.readOnly !== true
    }`
  );

  console.log("\n--- Validation Check ---");
  console.log(
    `Has validation: ${
      result.fields.find((f) => f.id === "name")?.validation !== undefined
    }`
  );
  console.log(
    `Edit mode flag: ${
      result.fields.find((f) => f.id === "name")?.validation?.editMode === true
    }`
  );
} catch (error) {
  console.error("\n--- Error in Field Constraints Test ---");
  console.error(error);
}

// --- Test 3: Field History Morph ---
console.log("\n\n--- TEST 3: EditFieldHistoryMorph ---");

try {
  // Setup: Create basic edit output with values
  const editBasic = EditModePipeline.apply(testForm, valueContext);

  // Setup: Create original values in meta
  const withOriginalValues: EditOutput = {
    ...editBasic,
    meta: {
      ...(editBasic.meta || {}),
      mode: "edit",
      timestamp: new Date().toISOString(),
      edit: {
        ...(editBasic.meta?.edit || {}),
        trackChanges: true,
        originalValues: {
          name: "Original Name", // Different from current "John Doe"
          email: "john@example.com", // Same as current value
        },
      },
    },
  };

  // Apply history morph
  const result = EditFieldHistoryMorph.apply(withOriginalValues, valueContext);

  console.log("\n--- Field History Check ---");

  // Check changed field
  const nameField = result.fields.find((f) => f.id === "name");
  console.log(`Name has history: ${nameField?.meta?.history !== undefined}`);
  console.log(`Name original value: ${nameField?.meta?.history?.original}`);
  console.log(
    `Name marked as changed: ${nameField?.meta?.history?.changed === true}`
  );
  console.log(
    `Name has lastModified: ${
      nameField?.meta?.history?.lastModified !== undefined
    }`
  );

  // Check unchanged field
  const emailField = result.fields.find((f) => f.id === "email");
  console.log(`Email has history: ${emailField?.meta?.history !== undefined}`);
  console.log(
    `Email marked as unchanged: ${emailField?.meta?.history?.changed === false}`
  );

  // Check field without history
  const ageField = result.fields.find((f) => f.id === "age");
  console.log(
    `Age history original same as current: ${
      ageField?.meta?.history?.original === ageField?.value
    }`
  );
} catch (error) {
  console.error("\n--- Error in Field History Test ---");
  console.error(error);
}

// --- Test 4: Complete Fields Pipeline ---
console.log("\n\n--- TEST 4: Complete EditFieldsPipeline ---");

// Context with multiple features
const fullContext: EditContext = {
  id: "complete-fields-test",
  name: "complete-fields-test",
  mode: "edit",
  timestamp: Date.now(),
  targetId: "entity-123", // Required for edit mode

  data: {
    name: "Jane Smith",
    email: "jane@example.com",
    notes: "These are some notes",
  },
  readOnlyFields: ["notes"],
  trackHistory: true,
};

try {
  // Get basic edit output
  const editOutput = EditModePipeline.apply(testForm, fullContext);

  // Create original values for history tracking
  const withOriginals: EditOutput = {
    ...editOutput,
    meta: {
      ...(editOutput.meta || {}),
      mode: "edit",
      timestamp: new Date().toISOString(),
      edit: {
        ...(editOutput.meta?.edit || {}),
        trackChanges: true,
        originalValues: {
          name: "Different Name", // Changed
          email: "jane@example.com", // Same
          notes: "Original notes", // Changed
        },
      },
    },
  };

  // Apply complete pipeline
  const result = EditFieldsPipeline.apply(withOriginals, fullContext);

  console.log("\n--- Complete Pipeline Results ---");
  console.log(`Field count: ${result.fields.length}`);

  // Check if all morphs were applied
  console.log("\n--- Values Applied ---");
  console.log(
    `Name from data: ${
      result.fields.find((f) => f.id === "name")?.value === "Jane Smith"
    }`
  );

  console.log("\n--- Constraints Applied ---");
  console.log(
    `Notes read-only: ${
      result.fields.find((f) => f.id === "notes")?.readOnly === true
    }`
  );

  console.log("\n--- History Applied ---");
  console.log(
    `Name changed: ${
      result.fields.find((f) => f.id === "name")?.meta?.history?.changed ===
      true
    }`
  );
  console.log(
    `Email unchanged: ${
      result.fields.find((f) => f.id === "email")?.meta?.history?.changed ===
      false
    }`
  );
} catch (error) {
  console.error("\n--- Error in Complete Pipeline Test ---");
  console.error(error);
}
