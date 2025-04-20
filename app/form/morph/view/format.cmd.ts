import { FormShape } from "../../schema/form";
import { ViewContext } from "../core/mode";
import { ViewFormatMorph, AnyFormattedViewOutput } from "./format";
import { generateView } from "./pipeline";
import { GroupedViewOutput } from "./group";

// --- 1. Sample Input FormShape (Same as cmd.ts) ---
const sampleShape: FormShape = {
  id: "profileViewForm",
  title: "User Profile",
  description: "Read-only view of user information.",
  fields: [
    {
      id: "userId",
      type: "string",
      label: "User ID",
      defaultValue: "N/A",
      excludeFromView: true,
    },
    {
      id: "fullName",
      type: "text",
      label: "Full Name",
      defaultValue: "Unknown",
    },
    {
      id: "email",
      type: "email",
      label: "Email Address",
      format: "mailto",
    },
    {
      id: "age",
      type: "number",
      label: "Age",
    },
    {
      id: "status",
      type: "select",
      label: "Account Status",
      options: [
        { label: "Pending Activation", value: "PEND" },
        { label: "Active", value: "ACTV" },
        { label: "Suspended", value: "SUSP" },
      ],
    },
    {
      id: "isAdmin",
      type: "boolean",
      label: "Administrator",
      format: "yes-no",
    },
    {
      id: "lastLogin",
      type: "datetime",
      label: "Last Login",
      format: "relative",
    },
  ],
};

// --- 2. Base Context (will be modified for each format) ---
const baseContext: ViewContext = {
  id: "formatContext",
  name: "Format Test Context",
  timestamp: Date.now(),
  mode:  "view",
  data: {
    fullName: "Alice Wonderland",
    email: "alice@example.com",
    status: "ACTV",
    isAdmin: true,
    lastLogin: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  mode: "view",
};

// --- 3. Test All Format Types ---
async function testAllFormats() {
  console.log("===== VIEW FORMAT MORPH TESTER =====\n");
  
  // First generate the view output using the standard pipeline
  console.log("Generating base view output...");
  const viewOutput: GroupedViewOutput = generateView(sampleShape, baseContext);
  console.log("✓ Base view generated\n");
  
  // List of formats to test
  const formats: Array<{
    format: ViewContext["outputFormat"];
    name: string;
  }> = [
    { format: "jsx", name: "JSX (React Component)" },
    { format: "json", name: "JSON" },
    { format: "text", name: "Plain Text" },
    { format: "csv", name: "CSV (Comma Separated Values)" },
    { format: "html", name: "HTML" },
    { format: "markdown", name: "Markdown" },
    { format: "prisma", name: "Prisma Schema" },
  ];
  
  // Test each format
  for (const { format, name } of formats) {
    console.log(`\n----- TESTING FORMAT: ${name} -----`);
    
    // Create a context with the desired output format
    const formatContext: ViewContext = {
      ...baseContext,
      outputFormat: format,
      // Add format-specific options
      ...(format === "json" && { jsonPrettyPrint: true }),
    };
    
    try {
      // Apply the ViewFormatMorph
      const formattedOutput: AnyFormattedViewOutput = ViewFormatMorph.apply(
        viewOutput, 
        formatContext
      );
      
      // Log the output type
      console.log(`✓ Generated ${format?.toUpperCase()} output`);
      
      // For content that's a string, print a preview
      if (typeof formattedOutput.content === "string") {
        // For lengthy outputs, truncate to preview
        const contentPreview = truncateString(formattedOutput.content, 500);
        console.log("\nContent Preview:");
        console.log("----------------------------------------");
        console.log(contentPreview);
        console.log("----------------------------------------");
        console.log(`Full length: ${formattedOutput.content.length} characters`);
      } 
      // For structured content (like JSX), show the structure
      else {
        console.log("\nContent Structure:");
        console.log(JSON.stringify(formattedOutput.content, null, 2));
      }
      
      // Log metadata
      console.log("\nMetadata:");
      console.log(JSON.stringify(formattedOutput.meta, null, 2));
      
    } catch (error) {
      console.error(`✗ Error generating ${format} output:`, error);
    }
  }
  
  console.log("\n===== TEST COMPLETE =====");
}

// Helper to truncate strings for preview
function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...\n[truncated]";
}

// Run the tests
testAllFormats().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});

// Helper for exit message
process.on('exit', () => {
  console.log("\nFormat testing complete");
});