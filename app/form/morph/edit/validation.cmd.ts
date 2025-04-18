import { FormShape } from "../../schema/form";
import { EditContext } from "../mode";
import { EditModePipeline, EditOutput } from "./pipeline";
import {
  EditValidationMorph,
  EditValidationUIMorph,
  EditValidationPipeline,
} from "./validation";

console.log("=== EDIT VALIDATION MORPHS TESTS ===");

// --- Sample Form Schema with Validation Rules ---
const validationForm: FormShape = {
  id: "validation-test-form",
  title: "Validation Test Form",
  fields: [
    {
      id: "name",
      type: "text",
      label: "Name",
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    {
      id: "email",
      type: "text",
      label: "Email",
      required: true,
      pattern: "^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$",
    },
    {
      id: "age",
      type: "number",
      label: "Age",
      min: 18,
      max: 100,
    },
    {
      id: "phone",
      type: "text",
      label: "Phone",
      pattern: "^[0-9]{10}$",
      required: false,
    },
    {
      id: "notes",
      type: "text",
      label: "Notes",
      meta: {
        multiline: true,
      },
    },
  ],
};

// --- Valid and Invalid Data ---
const validData = {
  name: "John Doe",
  email: "john@example.com",
  age: 30,
  phone: "1234567890",
  notes: "These are some notes",
};

const invalidData = {
  name: "J", // Too short
  email: "not-an-email",
  age: 15, // Below min
  phone: "123", // Doesn't match pattern
  notes: "Valid notes",
};

// --- Test 1: Required Field Validation ---
console.log("\n--- TEST 1: Required Field Validation ---");

const basicContext: EditContext = {
  id: "required-validation-test",
  timestamp: Date.now(),
  mode: "edit",
  targetId: "user-123",
  data: {
    name: "", // Empty required field
    email: "john@example.com",
    notes: "These notes are fine",
  },
};

try {
  // Get edit output with values
  const editOutput = EditModePipeline.apply(validationForm, basicContext);

  // Apply validation morph
  const result = EditValidationMorph.apply(editOutput, basicContext);

  console.log("\n--- Required Field Validation ---");
  const nameField = result.fields.find((f) => f.id === "name");

  console.log(
    `Name field is invalid: ${nameField?.validation?.valid === false}`
  );
  if (nameField?.validation?.errors) {
    console.log(`Name field errors: ${nameField.validation.errors.join(", ")}`);
  }

  // Check form-level validation
  console.log(`Form is invalid: ${result.isValid === false}`);
} catch (error) {
  console.error("\n--- Error in Required Field Test ---");
  console.error(error);
}

// --- Test 2: Type-Specific Validations ---
console.log("\n\n--- TEST 2: Type-Specific Validations ---");

const typeContext: EditContext = {
  id: "type-validation-test",
  timestamp: Date.now(),
  mode: "edit",
  targetId: "user-456",
  data: invalidData,
  validateAllFields: true, // Force validation of all fields
};

try {
  // Get edit output with values
  const editOutput = EditModePipeline.apply(validationForm, typeContext);

  // Apply validation morph
  const result = EditValidationMorph.apply(editOutput, typeContext);

  console.log("\n--- Type-Specific Validation Results ---");

  // Text length validation
  const nameField = result.fields.find((f) => f.id === "name");
  console.log(
    `Name has length error: ${
      nameField?.validation?.errors?.some((e: string) =>
        e.includes("characters")
      ) === true
    }`
  );

  // Pattern validation
  const emailField = result.fields.find((f) => f.id === "email");
  console.log(
    `Email has format error: ${
      emailField?.validation?.errors?.some((e: string) =>
        e.includes("format")
      ) === true
    }`
  );

  // Number range validation
  const ageField = result.fields.find((f) => f.id === "age");
  console.log(
    `Age has range error: ${
      ageField?.validation?.errors?.some((e: string) =>
        e.includes("at least")
      ) === true
    }`
  );

  // Pattern validation on optional field
  const phoneField = result.fields.find((f) => f.id === "phone");
  console.log(
    `Phone has pattern error: ${
      phoneField?.validation?.errors?.some((e: string) =>
        e.includes("format")
      ) === true
    }`
  );
  // Optional field without errors
  const notesField = result.fields.find((f) => f.id === "notes");
  console.log(`Notes is valid: ${notesField?.validation?.valid !== false}`);

  // Form-level validation
  console.log(`Form is invalid: ${result.isValid === false}`);
} catch (error) {
  console.error("\n--- Error in Type-Specific Validation Test ---");
  console.error(error);
}

// --- Test 3: Custom Validation Rules ---
console.log("\n\n--- TEST 3: Custom Validation Rules ---");

const customValidationContext: EditContext = {
  id: "custom-validation-test",
  timestamp: Date.now(),
  mode: "edit",
  targetId: "user-789",
  data: validData,
  validateAllFields: true,
  validationRules: {
    // Custom rule for password match
    name: (field) => {
      if (field.value === "Admin") {
        return ["Username cannot be 'Admin'"];
      }
      return [];
    },
    // Custom rule that references another field
    email: (field, form) => {
      const nameField = form.fields.find((f) => f.id === "name");
      if (nameField?.value && field.value.includes(nameField.value)) {
        return ["Email cannot contain your name"];
      }
      return [];
    },
  },
};

try {
  // Create edit output with custom validation-triggering values
  const editOutput = EditModePipeline.apply(
    validationForm,
    customValidationContext
  );

  // Override values to trigger custom validations
  const withCustomValues = {
    ...editOutput,
    fields: editOutput.fields.map((field) => {
      if (field.id === "name") {
        return { ...field, value: "Admin" };
      }
      if (field.id === "email") {
        return { ...field, value: "john@admin.com" };
      }
      return field;
    }),
  };

  // Apply validation morph
  const result = EditValidationMorph.apply(
    withCustomValues,
    customValidationContext
  );

  console.log("\n--- Custom Validation Results ---");

  // Check custom validation on name
  const nameField = result.fields.find((f) => f.id === "name");
  console.log(
    `Name has custom error: ${
      nameField?.validation?.errors?.some((e: string) => e.includes("Admin")) === true
    }`
  );
  if (nameField?.validation?.errors) {
    console.log(
      `Name custom errors: ${nameField.validation.errors.join(", ")}`
    );
  }

  // Check custom validation on email (referencing another field)
  const emailField = result.fields.find((f) => f.id === "email");
  console.log(
    `Email has custom error: ${
      emailField?.validation?.errors?.some((e: string) => e.includes("name")) === true
    }`
  );
  if (emailField?.validation?.errors) {
    console.log(
      `Email custom errors: ${emailField.validation.errors.join(", ")}`
    );
  }
} catch (error) {
  console.error("\n--- Error in Custom Validation Test ---");
  console.error(error);
}

// --- Test 4: Validation UI Integration ---
console.log("\n\n--- TEST 4: Validation UI Integration ---");

try {
  // Get edit output with validation errors
  const editOutput = EditModePipeline.apply(validationForm, typeContext);
  const validatedOutput = EditValidationMorph.apply(editOutput, typeContext);

  // Apply validation UI morph
  const result = EditValidationUIMorph.apply(validatedOutput, typeContext);

  console.log("\n--- Validation UI Elements ---");

  // Check UI elements on field with errors
  const nameField = result.fields.find((f) => f.id === "name");
  console.log(
    `Name has UI validation status: ${nameField?.meta?.ui?.validationStatus}`
  );
  console.log(`Name shows errors: ${nameField?.meta?.ui?.showErrors}`);

  // Check form-level validation metadata
  console.log(`\n--- Form Validation Metadata ---`);
  console.log(`Validation performed: ${result.meta?.validation?.performed}`);
  console.log(`Field errors count: ${result.meta?.validation?.fieldErrors}`);
  console.log(
    `Has validation timestamp: ${
      result.meta?.validation?.timestamp !== undefined
    }`
  );
} catch (error) {
  console.error("\n--- Error in Validation UI Test ---");
  console.error(error);
}

// --- Test 5: Selective Field Validation ---
console.log("\n\n--- TEST 5: Selective Field Validation ---");

// Context with changed fields but validateAllFields = false
const selectiveContext: EditContext = {
  id: "selective-validation-test",
  timestamp: Date.now(),
  mode: "edit",
  targetId: "user-101",
  data: invalidData,
  validateAllFields: false, // Only validate changed fields
};

try {
  // Get edit output
  const editOutput = EditModePipeline.apply(validationForm, selectiveContext);

  // Add changed fields to meta
  const withChanges = {
    ...editOutput,
    meta: {
      ...(editOutput.meta || {}),
      mode: "edit" as const,
      timestamp: new Date().toISOString(),
      edit: {
        ...(editOutput.meta?.edit || {}),
        trackChanges: true,
        changedFields: ["name", "email"], // Only these fields are changed
      },
    },
  } as EditOutput;

  // Apply validation morph
  const result = EditValidationMorph.apply(withChanges, selectiveContext);

  console.log("\n--- Selective Validation Results ---");

  // Changed fields should be validated
  const nameField = result.fields.find((f) => f.id === "name");
  const emailField = result.fields.find((f) => f.id === "email");

  console.log(
    `Name is changed and validated: ${nameField?.validation?.valid === false}`
  );
  console.log(
    `Email is changed and validated: ${emailField?.validation?.valid === false}`
  );

  // Unchanged fields should not be validated
  const ageField = result.fields.find((f) => f.id === "age");
  const phoneField = result.fields.find((f) => f.id === "phone");

  console.log(
    `Age is unchanged and not validated: ${
      ageField?.validation?.valid !== false
    }`
  );
  console.log(
    `Phone is unchanged and not validated: ${
      phoneField?.validation?.valid !== false
    }`
  );
} catch (error) {
  console.error("\n--- Error in Selective Validation Test ---");
  console.error(error);
}

// --- Test 6: Complete Validation Pipeline ---
console.log("\n\n--- TEST 6: Complete Validation Pipeline ---");

try {
  // Get edit output with values
  const editOutput = EditModePipeline.apply(validationForm, typeContext);

  // Apply complete validation pipeline
  const result = EditValidationPipeline.apply(editOutput, typeContext);

  console.log("\n--- Complete Pipeline Results ---");

  // Check both validation and UI effects
  console.log(`Form is invalid: ${result.isValid === false}`);
  console.log(
    `Validation metadata exists: ${result.meta?.validation !== undefined}`
  );

  // Check field-level validation
  const invalidFields = result.fields.filter(
    (f) => f.validation?.valid === false
  );
  console.log(`Number of invalid fields: ${invalidFields.length}`);
  console.log(`Invalid fields: ${invalidFields.map((f) => f.id).join(", ")}`);

  // Check UI elements
  const fieldsWithUI = result.fields.filter(
    (f) => f.meta?.ui?.validationStatus === "error"
  );
  console.log(`Fields with UI errors: ${fieldsWithUI.length}`);
} catch (error) {
  console.error("\n--- Error in Complete Pipeline Test ---");
  console.error(error);
}
