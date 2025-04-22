import { GraphMorph } from "./graph";
import { GraphShape } from "./types";
import { inspect } from "util";

/**
 * Creates a sample input shape for demonstration
 */
function createSampleInput(): GraphShape {
  return {
    id: "customerForm",
    name: "Customer Form",
    description: "A form for customer data",
    fields: [
      { id: "name", type: "text", label: "Customer Name", required: true },
      { id: "email", type: "email", label: "Email Address", required: true },
      { id: "phone", type: "text", label: "Phone Number" },
      { id: "referrer", type: "text", label: "Referred By" },
      { id: "notes", type: "textarea", label: "Additional Notes" },
    ],
    entities: [],
    relationships: [],
    meta: {
      relationDefs: [
        {
          field: "referrer",
          type: "REFERRED_BY",
          target: "Customer",
          direction: "OUTGOING",
        },
      ],
      validation: {
        performed: true,
        timestamp: Date.now(),
        fieldErrors: 0,
      },
      labelPrefix: "",
      includeMetadata: true,
    },
  };
}

/**
 * Runs the morph and displays results elegantly
 */
function runGraphMorph() {
  // Create input and run morph with the simpler run() method
  const input = createSampleInput();
  const output = GraphMorph.transform(input); // Much cleaner!
  
  // Display results - keeping your preferred Unicode characters
  console.log("═════════════════════════════════════");
  console.log("            GRAPH MORPH              ");
  console.log("═════════════════════════════════════");

  // Input summary
  console.log("\n▸ Input:");
  console.log(`  • Form: ${input.id} (${input.fields.length} fields)`);
  console.log(`  • Relationship Definitions: ${input.meta.relationDefs?.length}`);
  
  // Output summary
  console.log("\n▸ Output:");
  console.log(`  • Generated At: ${output.meta.generatedAt}`);
  console.log(`  • Entities: ${output.entities.length}`);
  console.log(`  • Relationships: ${output.relationships.length}`);
  
  // Entity details
  console.log("\n▸ Entity Types:");
  output.entities.forEach((entity, i) => {
    console.log(`  ${i+1}. ${entity.id} [${entity.labels.join(", ")}]`);
    
    // Show field schema if available
    if (entity.properties._fieldSchema) {
      const fieldCount = Object.keys(entity.properties._fieldSchema).length;
      console.log(`     ↳ ${fieldCount} fields defined`);
    }
  });
  
  // Relationship details
  console.log("\n▸ Relationship Types:");
  if (output.relationships.length === 0) {
    console.log("  • No relationships defined");
  } else {
    output.relationships.forEach((rel, i) => {
      console.log(`  ${i+1}. ${rel.fromId} -[${rel.type}]→ ${rel.toId}`);
    });
  }
  
  // Full structure - keeping colors for terminal output
  console.log("\n▸ Complete Structure:");
  console.log(inspect(output, { depth: 6, colors: true }));
}

// Just run it
runGraphMorph();