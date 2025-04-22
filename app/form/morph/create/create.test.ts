import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { handleCreateForm, createFormFromSchema } from "./create.cmd";
import { CreateFormContext } from "./types";

// Paths for test fixtures and outputs
const FIXTURES_DIR = path.join(__dirname, "../../../../test/fixtures/form");
const OUTPUT_DIR = path.join(__dirname, "../../../../test/output/form");
const BASIC_SCHEMA = path.join(FIXTURES_DIR, "basic-form.json");

// Ensure output directory exists
beforeAll(() => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Ensure basic test fixture exists
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  if (!fs.existsSync(BASIC_SCHEMA)) {
    const basicSchema = {
      id: "test-form",
      name: "Test Form",
      fields: [
        { id: "name", label: "Full Name", type: "text", required: true },
        { id: "email", label: "Email Address", type: "email", required: true },
      ],
    };
    fs.writeFileSync(BASIC_SCHEMA, JSON.stringify(basicSchema, null, 2));
  }
});

describe("Create Form End-to-End", () => {
  // Test the full pipeline using the command handler
  it("should generate a create form with handleCreateForm", async () => {
    const OUTPUT_FILE = path.join(OUTPUT_DIR, "cmd-test-output.json");

    // Call the command handler
    const result = await handleCreateForm({
      file: BASIC_SCHEMA,
      output: OUTPUT_FILE,
      pretty: true,
    });

    // Verify the result
    expect(result).toBeDefined();
    expect(result.mode).toBe("create");
    expect(result.fields.length).toBe(2);

    // Check that the output file was created
    expect(fs.existsSync(OUTPUT_FILE)).toBe(true);

    // Clean up
    fs.unlinkSync(OUTPUT_FILE);
  });

  // Test programmatic API
  it("should generate a create form with createFormFromSchema", () => {
    // Load schema
    const schema = JSON.parse(fs.readFileSync(BASIC_SCHEMA, "utf8"));

    // Call the API function
    const result = createFormFromSchema(schema, {
      initialValues: { name: "Test User" },
      submitLabel: "Create New",
    });

    // Verify result
    expect(result).toBeDefined();
    expect(result.mode).toBe("create");
    expect(result.fields.find((f) => f.id === "name")?.value).toBe("Test User");
    expect(result.submitButton?.label).toBe("Create New");
  });

  // Test CLI execution
  it("should work with CLI command", () => {
    const OUTPUT_FILE = path.join(OUTPUT_DIR, "cli-test-output.json");
    const CLI_PATH = path.join(__dirname, "../../../../cli.js");

    // Execute CLI command (synchronously for simplicity)
    try {
      execSync(
        `node ${CLI_PATH} create form --file ${BASIC_SCHEMA} --output ${OUTPUT_FILE} --pretty`,
        { stdio: "pipe" }
      );

      // Verify output
      expect(fs.existsSync(OUTPUT_FILE)).toBe(true);
      const output = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
      expect(output.mode).toBe("create");

      // Clean up
      fs.unlinkSync(OUTPUT_FILE);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Failed to process form: ${error.message}`);
        // Can also log the stack trace for debugging
        console.debug(error.stack);
      } else {
        console.error(`Unknown error occurred: ${error}`);
      }
      process.exit(1);
    }
  });
});
