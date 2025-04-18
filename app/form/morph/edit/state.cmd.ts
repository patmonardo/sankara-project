import { FormShape, FormState } from "../../schema/form";
import { EditContext } from "../mode";
import { EditModePipeline, EditOutput } from "./pipeline";
import { EditStateManagerMorph } from "./state";

console.log("=== EDIT STATE MANAGER TESTS ===");

// --- Test Form with Validation Rules ---
const validationForm: FormShape = {
  id: "state-test-form",
  title: "State Test Form",
  fields: [
    {
      id: "name",
      type: "text",
      label: "Name",
      required: true,
      validation: {
        minLength: 2,
      },
    },
    {
      id: "email",
      type: "text",
      label: "Email",
      required: true,
      validation: {
        pattern: "^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$",
      },
    },
    {
      id: "comments",
      type: "text",
      label: "Comments",
      meta: {
        multiline: true,
      },
    },
  ],
};

// --- Sample Data for Testing ---
const validData = {
  name: "John Doe",
  email: "john@example.com",
  comments: "These are valid comments",
};

const invalidData = {
  name: "J", // Too short
  email: "not-an-email", // Invalid format
  comments: "These comments are fine but the other fields are invalid",
};

// --- Test 1: Basic State Management with Valid Data ---
console.log("\n--- TEST 1: State Management with Valid Data ---");

const validContext: EditContext = {
  id: "state-test-1",
  name: "Edit State Test - Valid",
  timestamp: Date.now(),
  mode: "edit",
  targetId: "valid-data",
  data: validData,
};

try {
  // First apply the standard edit pipeline
  const editOutput = EditModePipeline.apply(validationForm, validContext);

  // Then apply the state manager morph
  const result = EditStateManagerMorph.apply(editOutput, validContext);

  console.log("\n--- Basic State Properties ---");
  console.log(`State object exists: ${result.state !== undefined}`);
  if (result.state) {
    console.log(`Status: ${result.state.status}`);
    console.log(`Has message: ${result.state.message !== undefined}`);
    console.log(`Has errors: ${result.state.errors !== undefined}`);
  }

  // Check if change tracking is preserved
  console.log("\n--- Change Tracking ---");
  console.log(`Edit metadata preserved: ${result.meta?.edit !== undefined}`);
  if (result.meta?.edit) {
    console.log(
      `Original values preserved: ${
        result.meta.edit.originalValues !== undefined
      }`
    );
    console.log(
      `Changed fields tracking preserved: ${
        result.meta.edit.changedFields !== undefined
      }`
    );
  }
} catch (error) {
  console.error("\n--- Error in Valid State Test ---");
  console.error(error);
}

// --- Test 2: State Management with Invalid Data ---
console.log("\n\n--- TEST 2: State Management with Invalid Data ---");

const invalidContext: EditContext = {
  id: "state-test-2",
  name: "Edit State Test - Invalid",
  timestamp: Date.now(),
  mode: "edit",
  targetId: "invalid-data",
  data: invalidData,
};

try {
  // Apply pipelines
  const editOutput = EditModePipeline.apply(validationForm, invalidContext);

  // Simulate validation errors
  const withErrors = {
    ...editOutput,
    fields: editOutput.fields.map((field) => {
      if (field.id === "name") {
        return {
          ...field,
          validation: {
            ...field.validation,
            errors: ["Name must be at least 2 characters"],
          },
        };
      }
      if (field.id === "email") {
        return {
          ...field,
          validation: {
            ...field.validation,
            errors: ["Please enter a valid email address"],
          },
        };
      }
      return field;
    }),
    // Add a form state with error status
    state: {
      status: "error" as const,
      message: "Please fix the validation errors",
      errors: {
        name: ["Name must be at least 2 characters"],
        email: ["Please enter a valid email address"],
      },
    },
  };

  // Then apply the state manager morph
  const result = EditStateManagerMorph.apply(withErrors, invalidContext);

  console.log("\n--- Error State Properties ---");
  console.log(`State object exists: ${result.state !== undefined}`);

  if (result.state?.errors) {
    console.log("\n--- Field Errors ---");
    Object.entries(result.state.errors).forEach(([fieldId, errors]) => {
      console.log(`${fieldId}: ${errors.join(", ")}`);
    });
  }
} catch (error) {
  console.error("\n--- Error in Invalid State Test ---");
  console.error(error);
}

// --- Test 3: Change Tracking ---
console.log("\n\n--- TEST 3: Change Tracking ---");

try {
  // First get a basic form
  const editOutput = EditModePipeline.apply(validationForm, validContext);

  // Create the changes object with type assertion
  const withChanges = {
    ...editOutput,
    meta: {
      ...(editOutput.meta || {}),
      mode: "edit" as const, // const assertion for literal type
      timestamp: new Date().toISOString(),
      edit: {
        ...(editOutput.meta?.edit || {}),
        trackChanges: true,
        changedFields: ["name", "email"],
        originalValues: {
          name: "Original Name",
          email: "original@example.com",
        },
      },
    },
  } as EditOutput; // Explicitly assert this is an EditOutput

  // Apply state manager morph
  const result = EditStateManagerMorph.apply(withChanges, validContext);

  console.log("\n--- Change Tracking Preservation ---");
  console.log(
    `Changed fields preserved: ${Array.isArray(
      result.meta?.edit?.changedFields
    )}`
  );
  if (result.meta?.edit?.changedFields) {
    console.log(`Changed fields: ${result.meta.edit.changedFields.join(", ")}`);
  }
} catch (error) {
  console.error("\n--- Error in Change Tracking Test ---");
  console.error(error);
}

// --- Test 4: State Preservation ---
console.log("\n\n--- TEST 4: State Preservation ---");

try {
  // Get base form
  const editOutput = EditModePipeline.apply(validationForm, validContext);

  // Test different submission states
  const states: Array<"idle" | "submitting" | "success" | "error"> = [
    "submitting",
    "success",
    "error",
  ];

  for (const status of states) {
    // Create form with specific state
    const withState = {
      ...editOutput,
      state: {
        status,
        message:
          status === "success"
            ? "Form saved successfully!"
            : status === "error"
            ? "Error saving form."
            : "Submitting...",
      } as FormState,
    };

    const result = EditStateManagerMorph.apply(withState, validContext);

    console.log(`\n--- ${status.toUpperCase()} State ---`);
    console.log(`Status preserved: ${result.state?.status === status}`);
    console.log(`Message preserved: "${result.state?.message}"`);
  }
} catch (error) {
  console.error("\n--- Error in State Preservation Test ---");
  console.error(error);
}
