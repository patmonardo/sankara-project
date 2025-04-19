import { CypherPipeline, CypherPipelineConfig, generateCypher, getCypherStats } from "./pipeline";
import { inspect } from "util";

/**
 * Create a sample form for testing
 */
function createSampleForm() {
  return {
    id: "customerOrderForm",
    title: "Customer Order Form",
    description: "A form for tracking customer orders",
    fields: [
      { id: "id", type: "text", label: "ID", required: true },
      { id: "name", type: "text", label: "Customer Name", required: true },
      { id: "email", type: "email", label: "Email Address", required: true },
      { id: "orderId", type: "text", label: "Order ID", required: true },
      { id: "orderDate", type: "date", label: "Order Date", required: true },
      { id: "products", type: "array", label: "Products", required: true },
      { id: "total", type: "number", label: "Order Total", required: true },
      { id: "status", type: "select", label: "Status", options: ["pending", "shipped", "delivered"] },
    ],
    meta: {
      entityDefs: [
        { entity: "Customer", fields: ["id", "name", "email"] },
        { entity: "Order", fields: ["orderId", "orderDate", "total", "status"] }
      ],
      relationDefs: [
        { field: "products", type: "CONTAINS", target: "Product", isArray: true },
        { type: "PLACED_BY", source: "Order", target: "Customer" }
      ],
      source: "FormShape"
    }
  };
}

/**
 * Run the pipeline and display results
 */
function runPipeline() {
  console.log("═════════════════════════════════════");
  console.log("      CYPHER PIPELINE TEST RUN       ");
  console.log("═════════════════════════════════════");
  
  // Create sample form
  const form = createSampleForm();
  
  // Create pipeline with custom config
  const config: CypherPipelineConfig = {
    dialectVersion: "Neo4j 5.0",
    labelPrefix: "App_",
    includeMetadata: true,
    identifierProperties: ["id", "orderId"]
  };
  
  const pipeline = new CypherPipeline(config);
  
  // Get explanation of the process
  console.log("\n▸ Pipeline Process Explanation:");
  const explanation = pipeline.explain(form);
  explanation.forEach((stage, i) => {
    console.log(`  • Stage ${i+1}: ${stage.stage}`);
    console.log(`    - Entities: ${stage.entityCount}`);
    console.log(`    - Relationships: ${stage.relationshipCount}`);
    if (stage.queryCount !== undefined) {
      console.log(`    - Queries: ${stage.queryCount}`);
    }
  });
  
  // Run the pipeline
  console.log("\n▸ Running Pipeline...");
  const result = pipeline.generate(form);
  
  // Show query stats
  console.log("\n▸ Query Statistics:");
  const stats = pipeline.queryStats(result);
  console.log(`  • Total Queries: ${stats.total}`);
  console.log("  • By Purpose:");
  Object.entries(stats.byPurpose).forEach(([purpose, count]) => {
    console.log(`    - ${purpose.toUpperCase()}: ${count}`);
  });
  console.log("  • By Entity:");
  Object.entries(stats.byEntityCount).forEach(([entity, count]) => {
    console.log(`    - ${entity}: ${count}`);
  });
  
  // Show some sample queries
  if (result.queries.length > 0) {
    // Find a sample of each query type
    const queryTypes = Array.from(new Set(result.queries.map(q => q.purpose)));
    
    console.log("\n▸ Sample Queries:");
    queryTypes.forEach(type => {
      const sample = result.queries.find(q => q.purpose === type);
      if (sample) {
        console.log(`  • ${type.toUpperCase()} QUERY:`);
        console.log("  ```cypher");
        console.log(`  ${sample.query.replace(/\n/g, "\n  ")}`);
        console.log("  ```\n");
      }
    });
  }
  
  // Show the final shape structure (limited depth)
  console.log("\n▸ Final Shape Structure:");
  console.log(inspect({
    id: result.id,
    title: result.title,
    entities: result.entities?.map(e => ({ id: e.id, labels: e.labels })),
    relationships: result.relationships?.map(r => ({ 
      id: r.id, 
      type: r.type, 
      fromId: r.fromId, 
      toId: r.toId 
    })),
    queries: result.queries.map(q => ({ id: q.id, name: q.name, purpose: q.purpose })),
    meta: {
      dialectVersion: result.meta.dialectVersion,
      labelPrefix: result.meta.labelPrefix,
      queryCount: result.meta.queryCount
    }
  }, { depth: 3, colors: true }));
  
  // Also test the convenience functions
  console.log("\n▸ Testing Convenience Functions:");
  const quickResult = generateCypher(form, { labelPrefix: "Quick_" });
  console.log(`  • generateCypher() produced ${quickResult.queries.length} queries`);
  
  const quickStats = getCypherStats(form);
  console.log(`  • getCypherStats() found ${Object.keys(quickStats.byPurpose).length} query types`);
}

// Run the test
runPipeline();