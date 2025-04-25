import { createCommand } from "@/form/modality/commands";
import {
  ValidationShape,
  ValidationField,
  ValidationContext,
  ValidationMorph,
  SetupValidationMorph,
} from "./validation";

// Sample field data for testing validation
const sampleFields = [
  {
    id: "username",
    name: "Username",
    type: "string",
    value: "user123",
    validation: {
      required: true,
      minLength: 5,
      maxLength: 20,
      pattern: "^[a-zA-Z0-9_-]+$",
    },
  },
  {
    id: "email",
    name: "Email",
    type: "string",
    value: "invalid-email",
    validation: {
      required: true,
      pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
      message: "Please enter a valid email address",
    },
  },
  {
    id: "age",
    name: "Age",
    type: "number",
    value: 16,
    validation: {
      required: true,
      min: 18,
      max: 100,
    },
  },
  {
    id: "bio",
    name: "Biography",
    type: "textarea",
    value: "Very short",
    validation: {
      minLength: 20,
      message: "Biography must be detailed (at least 20 characters)",
    },
  },
  {
    id: "password",
    name: "Password",
    type: "password",
    value: "pass",
    validation: {
      required: true,
      minLength: 8,
      pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
      message:
        "Password must be at least 8 characters with uppercase, lowercase and numbers",
    },
  },
  {
    id: "terms",
    name: "Terms Accepted",
    type: "boolean",
    value: false,
    validation: {
      required: true,
      message: "You must accept the terms",
    },
  },
  {
    id: "optionalField",
    name: "Optional Field",
    type: "string",
    value: "",
  },
];

// Create a sample form
const sampleForm: ValidationShape = {
  id: "registration-form",
  name: "registrationForm",
  title: "User Registration",
  fields: sampleFields,

  valid: false,
};

// Command to test basic validation
export const testBasicValidation = createCommand({
  name: "test-basic-validation",
  description: "Test the ValidationMorph with basic validation rules",
  handler: () => {
    // Context with validation enabled
    const context: ValidationContext = {
      id: "registration-form",
      name: "registrationForm",
      timestamp: Date.now(),
      validateAllFields: true,
    };

    const result = ValidationMorph.transform(sampleForm, context);

    console.log("=== Basic Validation Test ===");
    console.log("Form valid:", result.valid);
    console.log("Field error count:", result.fieldErrorCount);

    // Check specific fields for validation results
    const usernameField = result.fields.find(
      (f) => f.id === "username"
    ) as ValidationField;
    const emailField = result.fields.find(
      (f) => f.id === "email"
    ) as ValidationField;
    const ageField = result.fields.find(
      (f) => f.id === "age"
    ) as ValidationField;
    const bioField = result.fields.find(
      (f) => f.id === "bio"
    ) as ValidationField;
    const passwordField = result.fields.find(
      (f) => f.id === "password"
    ) as ValidationField;
    const termsField = result.fields.find(
      (f) => f.id === "terms"
    ) as ValidationField;
    const optionalField = result.fields.find(
      (f) => f.id === "optionalField"
    ) as ValidationField;

    console.log("\nValidation results by field:");
    console.log("Username valid:", usernameField.valid);
    console.log(
      "Email valid:",
      emailField.valid,
      "- Errors:",
      emailField.errors
    );
    console.log("Age valid:", ageField.valid, "- Errors:", ageField.errors);
    console.log("Bio valid:", bioField.valid, "- Errors:", bioField.errors);
    console.log(
      "Password valid:",
      passwordField.valid,
      "- Errors:",
      passwordField.errors
    );
    console.log(
      "Terms valid:",
      termsField.valid,
      "- Errors:",
      termsField.errors
    );
    console.log("Optional field valid:", optionalField.valid);

    return { success: true, message: "Basic validation test completed" };
  },
});

// Command to test custom validation rules
export const testCustomValidation = createCommand({
  name: "test-custom-validation",
  description: "Test the ValidationMorph with custom validation rules",
  handler: () => {
    // Context with custom validation rules
    const context: ValidationContext = {
      id: "registration-form",
      name: "registrationForm",
      timestamp: Date.now(),
      validateAllFields: true,
      validationRules: {
        // Custom username validation - must not contain admin
        username: (field) => {
          if (field.value?.toString().toLowerCase().includes("admin")) {
            return ["Username cannot contain 'admin'"];
          }
          return [];
        },
        // Custom password confirmation rule
        password: (field, shape) => {
          // In a real app, you'd have a confirmPassword field to compare with
          if (field.value?.toString().length < 10) {
            return [
              "For better security, consider using at least 10 characters",
            ];
          }
          return [];
        },
      },
    };

    // Create a form with admin in username
    const customForm = {
      ...sampleForm,
      fields: [
        ...sampleForm.fields.filter((f) => f.id !== "username"),
        {
          id: "username",
          name: "Username",
          type: "string",
          value: "admin_user",
          validation: {
            required: true,
            minLength: 5,
            maxLength: 20,
          },
        },
      ],
    };

    const result = ValidationMorph.transform(customForm, context);

    console.log("=== Custom Validation Rules Test ===");
    console.log("Form valid:", result.valid);

    // Check username with custom validation
    const usernameField = result.fields.find(
      (f) => f.id === "username"
    ) as ValidationField;
    const passwordField = result.fields.find(
      (f) => f.id === "password"
    ) as ValidationField;

    console.log("\nCustom validation results:");
    console.log("Username valid:", usernameField.valid);
    console.log("Username errors:", usernameField.errors);
    console.log("Password valid:", passwordField.valid);
    console.log("Password warnings:", passwordField.errors);

    return { success: true, message: "Custom validation test completed" };
  },
});

// Command to test validation for changed fields only
export const testChangedFieldsValidation = createCommand({
  name: "test-changed-fields-validation",
  description: "Test the ValidationMorph with only changed fields validated",
  handler: () => {
    // Create form with some changed fields
    const formWithChanges = {
      ...sampleForm,
      fields: sampleForm.fields.map((field) => {
        if (field.id === "email" || field.id === "password") {
          return { ...field, changed: true };
        }
        return field;
      }),
    };

    // Context that only validates changed fields
    const context: ValidationContext = {
      id: "registration-form",
      name: "registrationForm",
      timestamp: Date.now(),
      validateAllFields: false,
    };

    const result = ValidationMorph.transform(formWithChanges, context);

    console.log("=== Changed Fields Only Validation Test ===");
    console.log("Form valid:", result.valid);
    console.log("Field error count:", result.fieldErrorCount);

    // Check which fields were validated
    const emailField = result.fields.find(
      (f) => f.id === "email"
    ) as ValidationField;
    const passwordField = result.fields.find(
      (f) => f.id === "password"
    ) as ValidationField;
    const ageField = result.fields.find(
      (f) => f.id === "age"
    ) as ValidationField;

    console.log("\nValidation status:");
    console.log(
      "Email (changed) - Validated:",
      emailField.touched,
      "- Errors:",
      emailField.errors?.length
    );
    console.log(
      "Password (changed) - Validated:",
      passwordField.touched,
      "- Errors:",
      passwordField.errors?.length || 0
    );
    console.log(
      "Age (unchanged) - Validated:",
      ageField.touched === true,
      "- No validation should occur"
    );

    return {
      success: true,
      message: "Changed fields validation test completed",
    };
  },
});

// Command to test setup validation
export const testSetupValidation = createCommand({
  name: "test-setup-validation",
  description: "Test the SetupValidationMorph",
  handler: () => {
    // Context with validation setup
    const setupContext = {
      id: "registration-form",
      name: "registrationForm",
      timestamp: Date.now(),
      validateOnChange: true,
    };

    const result = SetupValidationMorph.transform(sampleForm, setupContext);

    console.log("=== Setup Validation Test ===");

    // Check if fields have validation properties
    const emailField = result.fields.find((f) => f.id === "email");

    console.log(
      "Fields received validation setup:",
      Boolean(emailField?.validateOnChange)
    );
    console.log("Email validation messages:", emailField?.validationMessages);

    return { success: true, message: "Setup validation test completed" };
  },
});

// Command to test structure of validation results
export const testValidationStructure = createCommand({
  name: "test-validation-structure",
  description: "Test the structure of validated fields",
  handler: () => {
    // Context with validation enabled
    const context: ValidationContext = {
      id: "registration-form",
      name: "registrationForm",
      timestamp: Date.now(),
      validateAllFields: true,
    };

    const result = ValidationMorph.transform(sampleForm, context);
    const emailField = result.fields.find(
      (f) => f.id === "email"
    ) as ValidationField;

    console.log("=== Validation Structure Test ===");
    console.log("\nForm-level validation properties:");
    console.log("- valid:", typeof result.valid);
    console.log("- fieldErrorCount:", typeof result.fieldErrorCount);

    console.log("\nField-level validation properties:");
    console.log("- valid:", typeof emailField.valid);
    console.log("- errors:", Array.isArray(emailField.errors));
    console.log("- touched:", typeof emailField.touched);
    console.log("- dirty:", typeof emailField.dirty);

    // Check for any unexpected nesting
    console.log("\nNo meta nesting check:");
    const hasMetaValidation = !!(emailField as any).meta?.validation;
    console.log(
      "Using flat structure (no meta.validation):",
      !hasMetaValidation
    );

    return {
      success: true,
      message: "Validation structure test completed",
      data: { formValid: result.valid, fieldErrors: emailField.errors },
    };
  },
});

// Export all commands
export default [
  testBasicValidation,
  testCustomValidation,
  testChangedFieldsValidation,
  testSetupValidation,
  testValidationStructure,
];

// Run the test you want
async function run() {
  console.log("Running filter tests...");

  try {
    // Pick one or uncomment all of them to run sequentially
    await testBasicValidation.execute({} as any);
    await testCustomValidation.execute({} as any);
    await testChangedFieldsValidation.execute({} as any);
    await testSetupValidation.execute({} as any);
    await testValidationStructure.execute({} as any);
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

run();