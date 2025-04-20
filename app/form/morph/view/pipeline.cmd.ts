import { FormShape, FormField } from "../../schema/form";
import { ViewContext } from "../core/mode";
import { ViewSystemPipeline, ViewOutput, ViewField } from "./pipeline"; // Assuming ViewField is exported

// --- Sample Data ---

// More robust sample form shape
const sampleForm: ViewOutput = {
  id: "sample-form-v2",
  mode: "view",
  fields: [
    {
      id: "name",
      type: "string",
      label: "Full Name",
      description: "Your complete name",
      required: true,
      placeholder: "e.g., Jane Doe",
    },
    {
      id: "email",
      type: "email", // Specific type for formatting/validation hints
      label: "Email Address",
      required: true,
    },
    {
      id: "age",
      type: "number",
      label: "Age",
      description: "Your age in years",
      format: "integer", // Example format hint
    },
    {
      id: "bio",
      type: "text", // Use 'text' for long content
      label: "Biography",
      description: "Tell us about yourself",
      multiline: true, // Hint for display type determination
    },
    {
      id: "website",
      type: "url",
      label: "Website",
      // No value provided in context, should be handled gracefully
    },
    {
      id: "createdDate",
      type: "date",
      label: "Account Created",
      format: "MM/DD/YYYY", // Specific date format
      readOnly: true, // Example metadata
    },
    {
      id: "notes",
      type: "richtext",
      label: "Notes",
      description: "Additional notes with formatting",
      // Default value in shape (if desired, otherwise remove)
      // value: "<p>Default notes</p>" 
    }
  ],
};

// Sample context with corresponding data
const sampleContext: ViewContext = {
  id: "test-view-context-v2",
  mode: "view",
  name: "Test View V2",
  timestamp: Date.now(),
  // Provide data for most fields
  data: {
    name: "Jane Doe",
    email: "jane.doe@example.com",
    age: 35,
    bio: "A software engineer with a passion for open source and building robust systems. This biography is intentionally made longer to test the truncation functionality within the view pipeline.",
    createdDate: new Date('2023-01-15T10:00:00Z'),
    notes: "<p>User provided <strong>rich text</strong> notes.</p>" // Override any default
  },
  // Configure truncation for the test
  truncation: {
    enabled: true,
    maxLength: 50, // Set a specific length for testing
    preserveWords: true,
    ellipsis: "...",
  },
  // Add other context fields if your pipeline uses them (even if styling is off)
  // variant: 'default',
  // density: 'normal',
};

// --- Test Execution ---

async function main() {
  console.log("=== Testing View System Pipeline V2 ===\n");

  try {
    // Apply the pipeline morph
    const result = ViewSystemPipeline.apply(sampleForm, sampleContext);

    // --- Overall Output Summary ---
    console.log(`Pipeline Output ID: ${result.id}`);
    console.log(`Mode: ${result.mode}`);
    console.log(`Timestamp: ${new Date(result.timestamp).toISOString()}`); // Use timestamp from result
    console.log(`Number of Fields Processed: ${result.fields.length}`);
    console.log(`Truncation Enabled: ${result.meta?.truncation?.enabled ?? 'N/A'}`);
    console.log(`Truncated Fields Count: ${result.meta?.truncation?.truncatedFields?.length ?? 0}`);
    console.log("\n--- Field Details ---");

    // --- Detailed Field Output ---
    result.fields.forEach((field: ViewField) => { // Use ViewField type if available
      const originalField = sampleForm.fields.find(f => f.id === field.id);

      console.log(`\n[Field: ${field.id}]`);
      console.log(`  Label:          ${field.label}`);
      console.log(`  Original Type:  ${field.meta?.originalType} (from schema)`);
      console.log(`  Display Type:   ${field.type} (determined for UI)`);
      console.log(`  Raw Value:      ${JSON.stringify(field.value)}`);
      console.log(`  Display Value:  "${field.displayValue}" (formatted)`);
      console.log(`  Format Used:    ${field.format || '(default)'}`);
      console.log(`  Required:       ${field.required ?? false}`);
      console.log(`  Read Only:      ${field.readOnly ?? false}`);

      // Display Truncation Info (if present)
      if (field.meta?.truncation) {
        const t = field.meta.truncation;
        console.log(`  Truncation:`);
        console.log(`    Is Truncated:   ${t.isTruncated}`);
        if (t.isTruncated) {
          console.log(`    Original Len:   ${t.originalLength}`);
          console.log(`    Displayed Len:  ${t.displayedLength}`);
        }
      } else {
        console.log(`  Truncation:     (Not Applicable or Disabled)`);
      }

      // Display Validation State (if present)
      if (field.meta?.validationState) {
         console.log(`  Validation State: ${field.meta.validationState}`);
      }

    });

  } catch (error) {
    console.error("\n--- PIPELINE ERROR ---");
    if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
        console.error(error.stack);
    } else {
        console.error("An unknown error occurred:", error);
    }
  }
}

// --- Run Main ---
if (require.main === module) {
  main().catch(console.error); // Catch potential async errors during execution
}