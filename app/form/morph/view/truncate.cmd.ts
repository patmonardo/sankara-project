import { TruncateTextMorph } from "./truncate";
import { ViewOutput } from "./pipeline";
import { ViewContext } from "../mode";

// Sample view with different field types and content lengths
const sampleView: ViewOutput = {
  id: "truncation-test-view",
  mode: "view",
  fields: [
    {
      id: "shortText",
      label: "Short Text",
      type: "string",
      value: "This is a short text that won't be truncated.",
      meta: {},
    },
    {
      id: "longText",
      label: "Long Text",
      type: "string",
      value:
        "This is a very long text field that should be truncated because it exceeds the default maximum length. It contains multiple sentences that will demonstrate how the truncation logic works, especially when we configure it to preserve word boundaries. We want to make sure the ellipsis is added correctly and the truncation metadata is properly attached to the field.",
      meta: {},
    },
    {
      id: "richText",
      label: "Rich Text",
      type: "richtext",
      value:
        "<h2>Rich Text Content</h2><p>This is some <strong>formatted</strong> content with <em>styling</em> that should be truncated differently than plain text. Rich text fields typically have higher length limits because they contain markup tags which aren't visible to the user.</p><p>Let's see how the truncation works with this type of content.</p>",
      meta: {},
    },
    {
      id: "numberField",
      label: "Number Field",
      type: "number",
      value: 12345,
      meta: {},
    },
    {
      id: "emptyField",
      label: "Empty Field",
      type: "string",
      value: "",
      meta: {},
    },
  ],
  meta: {},
};

/**
 * Run tests with different configuration options
 */
async function runTruncationTests() {
  // Test cases with different configs
  const testCases = [
    {
      name: "Default truncation",
      config: {
        enabled: true,
      },
    },
    {
      name: "Short limits",
      config: {
        enabled: true,
        maxLength: 30,
        preserveWords: true,
        ellipsis: "...",
      },
    },
    {
      name: "Character truncation (no word preservation)",
      config: {
        enabled: true,
        maxLength: 50,
        preserveWords: false,
        ellipsis: " (more)",
      },
    },
    {
      name: "Custom limits by field type",
      config: {
        enabled: true,
        maxLength: 100,
        byFieldType: {
          string: 40,
          richtext: 60,
        },
      },
    },
    {
      name: "Truncation disabled",
      config: {
        enabled: false,
      },
    },
  ];

  // Run each test case
  for (const test of testCases) {
    console.log(`\n=== TEST: ${test.name} ===`);

    const context: ViewContext = {
      id: "test-context",
      mode: "view",
      name: "Truncation Test Context",
      description: "Testing truncation morph with various configurations",
      timestamp: 0,
      truncation: test.config,
    };

    const result = await TruncateTextMorph.apply(sampleView, context);

    // Print summary
    console.log("Truncation enabled:", result.meta.truncation.enabled);
    console.log("Truncated fields:", result.meta.truncation.truncatedFields);

    // Print field details
    result.fields.forEach((field) => {
      console.log(`\nField: ${field.id} (${field.type})`);
      if (field.meta.truncation) {
        const t = field.meta.truncation;
        console.log(`- Truncated: ${t.isTruncated}`);
        console.log(`- Original length: ${t.originalLength}`);
        console.log(`- Displayed length: ${t.displayedLength}`);

        if (t.isTruncated) {
          // Show first 40 chars of display value
          const displayPreview = field.displayValue?.substring(0, 40) + "...";
          console.log(`- Display value: ${displayPreview}`);
        }
      }
    });
  }
}

async function main() {
  await runTruncationTests();
}

if (require.main === module) {
  main().catch(console.error);
}
