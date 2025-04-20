import { FormShape } from "../../schema/form";
import { ViewContext } from "../core/mode";
import { generateView, ViewOutput } from "./pipeline";
import { SummaryViewMorph } from "./summary";
import { FormatViewMorph } from "./format";

// --- 1. Sample Input FormShape ---
const sampleShape: FormShape = {
  id: "employeeProfileForm",
  title: "Employee Profile",
  description: "Complete employee information record",
  fields: [
    // Primary fields with high importance
    {
      id: "fullName",
      type: "text",
      label: "Full Name",
      required: true,
      meta: { importance: 100 },
    },
    // ...other fields as in previous version...
    {
      id: "jobTitle",
      type: "text",
      label: "Job Title",
      meta: { importance: 90 },
    },
    {
      id: "department",
      type: "select",
      label: "Department",
      options: [
        { value: "eng", label: "Engineering" },
        { value: "sales", label: "Sales" },
        { value: "hr", label: "Human Resources" },
        { value: "mkt", label: "Marketing" },
      ],
      meta: { importance: 85 },
    },
    {
      id: "email",
      type: "email",
      label: "Email Address",
      meta: { importance: 80 },
    },
    // Other fields as in previous example...
    {
      id: "phone",
      type: "tel",
      label: "Phone Number",
      meta: { importance: 70 },
    },
    {
      id: "hireDate",
      type: "date",
      label: "Hire Date",
      meta: { importance: 65 },
    },
    {
      id: "location",
      type: "text",
      label: "Office Location",
      meta: { importance: 60 },
    },
    // More fields...
    {
      id: "employeeId",
      type: "text",
      label: "Employee ID",
      meta: { importance: 5 },
    },
  ],
};

// --- 2. Sample Data ---
const sampleData = {
  fullName: "Jane Smith",
  jobTitle: "Senior Software Engineer",
  department: "eng",
  email: "jane.smith@company.com",
  phone: "+1 (555) 123-4567",
  hireDate: "2020-03-15T00:00:00.000Z",
  location: "New York Office",
  employeeId: "EMP-12345",
};

// --- 3. Test Summary Morph ---
console.log("===== SUMMARY VIEW MORPH TESTER =====\n");

// Create base context
const baseContext: ViewContext = {
  id: "summaryTestContext",
  name: "Summary Test Context",
  timestamp: Date.now(),
  mode:  "view",
  data: sampleData,
};

// --- Test 1: Default Summary (Top 5 Fields) ---
console.log("--- TEST 1: Default Summary ---");
console.log("Creates a summary with default settings (top 5 fields)\n");

try {
  // First generate a standard view
  const standardView = generateView(sampleShape, baseContext);

  const baseOutput: ViewOutput = {
    mode: "view",
    id: standardView.id,
    fields: standardView.groups.flatMap((g) => g.fields),
    // Add the missing properties to make it a proper ViewOutput
    format: "json", // or any default format
    meta: {
      ...standardView.meta, // carry over other metadata
      title: standardView.meta?.title || "Summary View",
    },
  };
  // Then apply the summary morph with default settings
  const defaultSummary = SummaryViewMorph.apply(baseOutput, baseContext);

  console.log(
    `✓ Generated default summary with ${defaultSummary.fields.length} fields`
  );
  console.log(
    `  Original had ${defaultSummary.meta.summary.originalFieldCount} fields\n`
  );

  console.log("Default Summary Fields:");
  defaultSummary.fields.forEach((field) => {
    console.log(`- ${field.label}: ${field.displayValue || "(empty)"}`);
  });
} catch (error) {
  console.error("Error generating default summary:", error);
}

// --- Test 2: Importance-Based Summary ---
console.log("\n--- TEST 2: Importance-Based Summary ---");
console.log(
  "Creates a summary by sorting fields based on importance metadata\n"
);

try {
  // Context with importance-based sorting
  const importanceContext: ViewContext = {
    ...baseContext,
    summary: {
      sortBy: "importance",
      maxFields: 5,
    },
  };

  // Generate a standard view
  const standardView = generateView(sampleShape, baseContext);

  const baseOutput: ViewOutput = {
    mode: "view",
    id: standardView.id,
    fields: standardView.groups.flatMap((g) => g.fields),
    // Add the missing properties to make it a proper ViewOutput
    format: "json", // or any default format
    meta: {
      ...standardView.meta, // carry over other metadata
      title: standardView.meta?.title || "Summary View",
    },
  };
  // Apply the summary morph
  const importanceSummary = SummaryViewMorph.apply(
    baseOutput, importanceContext
  );

  console.log(
    `✓ Generated importance-based summary with ${importanceSummary.fields.length} fields`
  );

  console.log("\nImportance-Sorted Fields:");
  importanceSummary.fields.forEach((field) => {
    const importance = field.meta?.importance || 0;
    console.log(
      `- ${field.label} (Importance: ${importance}): ${
        field.displayValue || "(empty)"
      }`
    );
  });
} catch (error) {
  console.error("Error generating importance summary:", error);
}

// --- Test 3: Explicit Field Selection ---
console.log("\n--- TEST 3: Explicit Field Selection ---");
console.log("Creates a summary with explicitly selected fields\n");

try {
  // Context with explicit field selection
  const selectionContext: ViewContext = {
    ...baseContext,
    summary: {
      mode: "include",
      fields: ["fullName", "jobTitle", "email", "department", "hireDate"],
      sortBy: "label", // Sort alphabetically by label
    },
  };

  // Generate a standard view
  const standardView = generateView(sampleShape, baseContext);

  const baseOutput: ViewOutput = {
    mode: "view",
    id: standardView.id,
    fields: standardView.groups.flatMap((g) => g.fields),
    // Add the missing properties to make it a proper ViewOutput
    format: "json", // or any default format
    meta: {
      ...standardView.meta, // carry over other metadata
      title: standardView.meta?.title || "Summary View",
    },
  };
  // Apply the summary morph
  const explicitSummary = SummaryViewMorph.apply(
    baseOutput, selectionContext
  );

  console.log(
    `✓ Generated explicit selection summary with ${explicitSummary.fields.length} fields`
  );
  console.log(
    `  Requested ${selectionContext.summary?.fields?.length} fields\n`
  );

  console.log("Explicitly Selected Fields (sorted by label):");
  explicitSummary.fields.forEach((field) => {
    console.log(`- ${field.label}: ${field.displayValue || "(empty)"}`);
  });
} catch (error) {
  console.error("Error generating explicit selection summary:", error);
}

// --- Test 4: Exclusion Mode ---
console.log("\n--- TEST 4: Exclusion Mode ---");
console.log("Creates a summary by excluding specific fields\n");

try {
  // Context with exclusion mode
  const exclusionContext: ViewContext = {
    ...baseContext,
    summary: {
      mode: "exclude",
      fields: ["phone", "location", "employeeId"],
      maxFields: 5,
    },
  };

  // Generate a standard view
  const standardView = generateView(sampleShape, baseContext);

  const baseOutput: ViewOutput = {
    mode: "view",
    id: standardView.id,
    fields: standardView.groups.flatMap((g) => g.fields),
    // Add the missing properties to make it a proper ViewOutput
    format: "json", // or any default format
    meta: {
      ...standardView.meta, // carry over other metadata
      title: standardView.meta?.title || "Summary View",
    },
  };

  // Apply the summary morph
  const exclusionSummary = SummaryViewMorph.apply(baseOutput, exclusionContext);

  console.log(
    `✓ Generated exclusion-based summary with ${exclusionSummary.fields.length} fields`
  );
  console.log(
    `  Excluded ${exclusionContext.summary?.fields?.length} fields\n`
  );

  console.log("Remaining Fields (after exclusion):");
  exclusionSummary.fields.forEach((field) => {
    console.log(`- ${field.label}: ${field.displayValue || "(empty)"}`);
  });
} catch (error) {
  console.error("Error generating exclusion summary:", error);
}

// --- Test 5: Formatting Summaries ---
console.log("\n--- TEST 5: Formatting Summaries ---");
console.log("Shows how summaries can be formatted for different outputs\n");

try {
  // Generate a standard view
  const standardView = generateView(sampleShape, baseContext);

  const baseOutput: ViewOutput = {
    mode: "view",
    id: standardView.id,
    fields: standardView.groups.flatMap((g) => g.fields),
    // Add the missing properties to make it a proper ViewOutput
    format: "json", // or any default format
    meta: {
      ...standardView.meta, // carry over other metadata
      title: standardView.meta?.title || "Summary View",
    },
  };

  // Create an importance-based summary
  const summaryContext: ViewContext = {
    ...baseContext,
    summary: {
      sortBy: "importance",
      maxFields: 4,
    },
  };

  const summary = SummaryViewMorph.apply(baseOutput, summaryContext);

  // Format as text and markdown
  const formats = ["text", "markdown"] as const;

  for (const format of formats) {
    const formatContext: ViewContext = {
      ...baseContext,
      outputFormat: format,
    };

    const formatted = FormatViewMorph.apply(summary, formatContext);

    console.log(`\n${format.toUpperCase()} Format Output:\n`);
    if (typeof formatted.content === "string") {
      console.log("----------------------------------------");
      console.log(formatted.content);
      console.log("----------------------------------------");
    } else {
      console.log(JSON.stringify(formatted.content, null, 2));
    }
  }
} catch (error) {
  console.error("Error formatting summaries:", error);
}

console.log("\n===== SUMMARY TESTS COMPLETE =====");
