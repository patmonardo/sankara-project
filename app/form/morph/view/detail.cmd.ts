import { FormShape } from "../../schema/form";
import { ViewContext } from "../mode";
import { generateView } from "./pipeline";
import { GroupedViewOutput } from "./group";
import { DetailLevel } from "./detail";
import { ViewFormatMorph } from "./format";

// --- 1. Sample Input FormShape with Complex Data Types ---
const sampleShape: FormShape = {
  id: "complexDataForm",
  title: "Complex Data Demo",
  description: "Demonstrates various detail levels for complex data types",
  fields: [
    // Regular field types
    {
      id: "userName",
      type: "text",
      label: "User Name",
      defaultValue: "Jane Smith",
    },
    
    // Object field
    {
      id: "userObject",
      type: "object",
      label: "User Object",
      description: "Demonstrates object expansion",
    },
    
    // Array field
    {
      id: "tags",
      type: "array",
      label: "Tags",
      description: "Demonstrates array expansion",
    },
    
    // JSON field
    {
      id: "config",
      type: "json",
      label: "Configuration",
      description: "Demonstrates JSON expansion",
    },
    
    // Code field
    {
      id: "snippet",
      type: "code",
      label: "Code Snippet",
      format: "typescript",
      description: "Demonstrates code block expansion",
    },
    
    // Rich text field
    {
      id: "notes",
      type: "richtext",
      label: "Rich Text Notes",
      description: "Demonstrates rich text expansion",
    },
    
    // Markdown field
    {
      id: "markdown",
      type: "markdown",
      label: "Markdown Content",
      description: "Demonstrates markdown expansion",
    },
    
    // Field marked as expandable via meta
    {
      id: "customExpandable",
      type: "text",
      label: "Custom Expandable",
      description: "Not normally expandable but marked as such",
      meta: {
        expandable: true
      }
    }
  ],
};

// --- 2. Data for Complex Fields ---
const sampleData = {
  userName: "Jane Smith",
  userObject: {
    id: "usr_123",
    email: "jane@example.com",
    preferences: {
      theme: "dark",
      notifications: {
        email: true,
        push: false,
        sms: true
      }
    },
    roles: ["admin", "editor"]
  },
  tags: ["important", "needs-review", "documentation", "frontend", "api"],
  config: {
    apiEndpoint: "https://api.example.com/v2",
    timeout: 30000,
    retryCount: 3,
    features: {
      darkMode: true,
      betaFeatures: false
    }
  },
  snippet: `function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
}`,
  notes: "<h2>Project Notes</h2><p>This is a <strong>very important</strong> note about the project.</p><ul><li>First point</li><li>Second point</li></ul>",
  markdown: "# Meeting Notes\n\n## Action Items\n\n- [ ] Review PR #123\n- [x] Deploy to staging\n- [ ] Update documentation\n\n> Important quote from the meeting",
  customExpandable: "This is a long text that would normally not be expanded, but we've marked it as expandable in the field metadata."
};

// --- 3. Test Different Detail Levels ---
async function testDetailLevels() {
  console.log("===== DETAIL VIEW MORPH TESTER =====\n");
  
  // List of detail levels to test
  const detailLevels: DetailLevel[] = ['minimal', 'standard', 'expanded', 'complete'];
  
  // Test each detail level
  for (const level of detailLevels) {
    console.log(`\n----- TESTING DETAIL LEVEL: ${level.toUpperCase()} -----`);
    
    // Create a context with the current detail level
    const viewContext: ViewContext = {
      id: `detail-${level}-context`,
      name: `Detail ${level} context`,
      timestamp: Date.now(),
      mode:  "view",
      data: sampleData,
      mode: "view",
      detail: {
        level: level,
        // Explicitly expand one field regardless of level
        expandedFields: level === 'minimal' ? ['customExpandable'] : []
      },
      // Format as JSON for easy inspection of expansion details
      outputFormat: 'json',
      jsonPrettyPrint: true,
    };
    
    try {
      // Generate view output
      const viewOutput: GroupedViewOutput = generateView(sampleShape, viewContext);
      console.log(`✓ Generated view with detail level: ${level}`);
      
      // Format for display - use JSON for easy inspection
      const formattedOutput = ViewFormatMorph.apply(viewOutput, viewContext);
      
      // Display key parts of the output that demonstrate detail level features
      console.log("\nKey Features:");
      console.log("----------------------------------------");
      
      // Extract and format key information about expanded fields
      const groupFields = viewOutput.groups[0].fields;
      
      // Count expanded fields
      const expandedFields = groupFields.filter(f => f.meta?.expanded);
      console.log(`- Expanded fields: ${expandedFields.length} of ${groupFields.length}`);
      
      // List which fields were expanded
      if (expandedFields.length > 0) {
        console.log("- Fields expanded:");
        expandedFields.forEach(field => {
          console.log(`  • ${field.label} (${field.id}): ${field.meta?.expandedView?.type || 'basic'}`);
        });
      }
      
      // Show if additional info was added
      const fieldsWithAdditionalInfo = groupFields.filter(f => f.meta?.additionalInfo);
      if (fieldsWithAdditionalInfo.length > 0) {
        console.log("- Fields with additional info:");
        fieldsWithAdditionalInfo.forEach(field => {
          const infoTypes = Object.keys(field.meta?.additionalInfo || {});
          console.log(`  • ${field.label}: ${infoTypes.join(', ')}`);
        });
      }
      
      // Show a sample expanded field in full detail if any
      if (expandedFields.length > 0) {
        const sampleField = expandedFields[0];
        console.log("\nSample Expanded Field Detail:");
        console.log(JSON.stringify(sampleField.meta, null, 2));
      }
      
      console.log("----------------------------------------");
      
      // Show the detail info from the output meta
      console.log("\nDetail Configuration from meta:");
      console.log(JSON.stringify(viewOutput.meta.detail, null, 2));
      
    } catch (error) {
      console.error(`✗ Error generating view with detail level ${level}:`, error);
    }
  }
  
  // --- Test specific expanded fields ---
  console.log("\n\n----- TESTING SPECIFIC EXPANDED FIELDS -----");
  
  const specificContext: ViewContext = {
    id: "specific-expansion-context",
    name: "Specific fields expansion context",
    timestamp: Date.now(),
    mode:  "view",
    data: sampleData,
    mode: "view",
    detail: {
      level: 'standard', // Standard level but with explicit expansions
      expandedFields: ['userObject', 'snippet', 'customExpandable']
    },
    outputFormat: 'markdown',
  };
  
  try {
    // Generate view and format as markdown
    const viewOutput: GroupedViewOutput = generateView(sampleShape, specificContext);
    const formattedOutput = ViewFormatMorph.apply(viewOutput, specificContext);
    
    console.log("✓ Generated view with specific expanded fields");
    console.log("\nExpanded Fields:");
    viewOutput.groups[0].fields
      .filter(f => f.meta?.expanded)
      .forEach(field => {
        console.log(`- ${field.label} (${field.id})`);
      });
    
    // Show the markdown output for a rich presentation
    console.log("\nMarkdown Output Preview:");
    console.log("----------------------------------------");
    if (typeof formattedOutput.content === 'string') {
      // Only show the first part to keep output manageable
      console.log(formattedOutput.content.substring(0, 800) + "...");
    }
    console.log("----------------------------------------");
    
  } catch (error) {
    console.error("✗ Error testing specific expanded fields:", error);
  }
  
  console.log("\n===== TEST COMPLETE =====");
}

// Helper to truncate strings for preview
function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...\n[truncated]";
}

// Run the tests
testDetailLevels().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});

// Helper for exit message
process.on('exit', () => {
  console.log("\nDetail testing complete");
});