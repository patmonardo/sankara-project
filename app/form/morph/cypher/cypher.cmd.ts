import { CypherMorph } from "./cypher";
import { CypherShape } from "./types";
import { inspect } from "util";

/**
 * Creates a sample input CypherShape for demonstration
 */
function createSampleInput(): CypherShape {
  return {
    id: "customerGraph",
    name: "Customer Graph",
    description: "A graph representation of customer data",
    fields: [
      { id: "id", type: "text", label: "ID", required: true },
      { id: "name", type: "text", label: "Customer Name", required: true },
      { id: "email", type: "email", label: "Email Address", required: true },
      { id: "phone", type: "text", label: "Phone Number" },
      { id: "referrer", type: "text", label: "Referred By" },
    ],
    entities: [
      {
        id: "Customer",
        labels: ["Customer"],
        properties: {
          _fieldSchema: {
            id: { type: "text", label: "ID", required: true },
            name: { type: "text", label: "Customer Name", required: true },
            email: { type: "email", label: "Email Address", required: true, index: true },
            phone: { type: "text", label: "Phone Number" },
          }
        },
        meta: {
          source: "FormShape",
          isNodeType: true
        }
      },
      {
        id: "Product",
        labels: ["Product"],
        properties: {
          _fieldSchema: {
            id: { type: "text", label: "Product ID", required: true },
            name: { type: "text", label: "Product Name", required: true },
            price: { type: "number", label: "Price" },
          }
        },
        meta: {
          source: "FormShape",
          isNodeType: true
        }
      }
    ],
    relationships: [
      {
        id: "rel-customer-purchased-product",
        fromId: "Customer",
        toId: "Product",
        type: "PURCHASED",
        properties: { _propertySchema: { quantity: { type: "number" } } },
        meta: { isRelationshipType: true }
      },
      {
        id: "rel-customer-referred-by-customer",
        fromId: "Customer",
        toId: "Customer",
        type: "REFERRED_BY",
        properties: { },
        meta: { isRelationshipType: true }
      }
    ],
    queries: [], // Start with empty queries array
    parameters: {}, // Start with empty parameters
    meta: {
      relationDefs: [
        {
          field: "referrer",
          type: "REFERRED_BY",
          target: "Customer",
          direction: "OUTGOING",
        },
      ],
      // Base meta
      generatedAt: new Date().toISOString(),
      entityCount: 2,
      relationshipCount: 2,
      
      // Cypher-specific configuration
      dialectVersion: "Neo4j 5.0",
      parameterized: true,
      labelPrefix: "",
      includeMetadata: true,
      defaultNodeLabel: "Entity",
      identifierProperties: ["id"],
      createTargets: true,
      queryCount: 0,
      sourceMorph: "FormToGraphSchemaMorph" // Previous morph in pipeline
    }
  };
}

/**
 * Runs the morph and displays results elegantly
 */
function runCypherMorph() {
  // Create input and run morph with the simpler run() method
  const input = createSampleInput();
  const output = CypherMorph.run(input);
  
  // Display results
  console.log("═════════════════════════════════════");
  console.log("            CYPHER MORPH             ");
  console.log("═════════════════════════════════════");

  // Input summary
  console.log("\n▸ Input:");
  console.log(`  • Shape: ${input.id}`);
  console.log(`  • Entities: ${input.entities.length}`);
  console.log(`  • Relationships: ${input.relationships.length}`);
  console.log(`  • Initial Queries: ${input.queries.length}`);
  
  // Output summary
  console.log("\n▸ Output:");
  console.log(`  • Generated At: ${output.meta.generatedAt}`);
  console.log(`  • Total Queries: ${output.queries.length}`);
  console.log(`  • Source Morph: ${output.meta.sourceMorph}`);
  
  // Query details
  console.log("\n▸ Generated Queries by Type:");
  
  // Group queries by purpose
  const queryGroups: Record<string, any[]> = {};
  output.queries.forEach(q => {
    if (!queryGroups[q.purpose]) queryGroups[q.purpose] = [];
    queryGroups[q.purpose].push(q);
  });
  
  // Show each group
  Object.entries(queryGroups).forEach(([purpose, queries]) => {
    console.log(`  • ${purpose.toUpperCase()} (${queries.length}):`);
    queries.forEach((q, i) => {
      console.log(`    ${i+1}. ${q.name}`);
    });
  });
  
  // Show sample queries
  if (output.queries.length > 0) {
    // CREATE query example
    const createQuery = output.queries.find(q => q.purpose === 'create' && q.query.includes('CREATE'));
    if (createQuery) {
      console.log("\n▸ Sample CREATE Query:");
      console.log("  ```cypher");
      console.log(`  ${createQuery.query.replace(/\n/g, "\n  ")}`);
      console.log("  ```");
    }
    
    // MATCH query example
    const matchQuery = output.queries.find(q => q.purpose === 'match' && q.query.includes('MATCH'));
    if (matchQuery) {
      console.log("\n▸ Sample MATCH Query:");
      console.log("  ```cypher");
      console.log(`  ${matchQuery.query.replace(/\n/g, "\n  ")}`);
      console.log("  ```");
    }
    
    // Schema query example
    const schemaQuery = output.queries.find(q => q.purpose === 'schema');
    if (schemaQuery) {
      console.log("\n▸ Sample SCHEMA Query:");
      console.log("  ```cypher");
      console.log(`  ${schemaQuery.query.replace(/\n/g, "\n  ")}`);
      console.log("  ```");
    }
  }
  
  // Query count summary
  console.log("\n▸ Query Count Summary:");
  let totalQueries = 0;
  Object.entries(queryGroups).forEach(([purpose, queries]) => {
    console.log(`  • ${purpose.toUpperCase()}: ${queries.length} queries`);
    totalQueries += queries.length;
  });
  console.log(`  • TOTAL: ${totalQueries} queries`);
  
  // Full structure - keeping colors for terminal output
  console.log("\n▸ Complete Structure:");
  console.log(inspect(output, { depth: 4, colors: true }));
}

// Just run it
runCypherMorph();