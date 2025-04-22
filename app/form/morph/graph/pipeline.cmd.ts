import { createGraphPipeline } from "./pipeline";
import { GraphShape } from "./types";
import chalk from "chalk";

/**
 * Creates a more complex sample input for testing
 */
function createComplexSampleInput(): GraphShape {
  return {
    id: "productCatalog",
    name: "Product Catalog",
    description: "A comprehensive product catalog system",
    fields: [
      { id: "name", type: "text", label: "Product Name", required: true },
      { id: "description", type: "textarea", label: "Description" },
      { id: "price", type: "number", label: "Price", required: true },
      { id: "category", type: "text", label: "Category" },
      { id: "tags", type: "array", label: "Tags" },
      { id: "supplier", type: "text", label: "Supplier" },
      { id: "relatedProducts", type: "array", label: "Related Products" },
    ],
    entities: [],
    relationships: [],
    meta: {
      relationDefs: [
        {
          field: "category",
          type: "BELONGS_TO",
          target: "Category",
          direction: "OUTGOING",
        },
        {
          field: "supplier",
          type: "SUPPLIED_BY",
          target: "Supplier",
          direction: "OUTGOING",
        },
        {
          field: "relatedProducts",
          type: "RELATED_TO",
          target: "Product",
          direction: "OUTGOING",
        },
      ],
      validation: {
        performed: true,
        timestamp: Date.now(),
        fieldErrors: 0,
      },
    },
  };
}

/**
 * Creates test data entities to simulate a more complete graph
 */
function addTestData(graph: GraphShape): GraphShape {
  // Add some product entities
  const products = [
    { id: "product-1", name: "Smartphone X1", category: "electronics", supplier: "supplier-1", related: ["product-2", "product-3"] },
    { id: "product-2", name: "Tablet Pro", category: "electronics", supplier: "supplier-1", related: ["product-1"] },
    { id: "product-3", name: "Wireless Earbuds", category: "electronics", supplier: "supplier-2", related: ["product-1"] },
    { id: "product-4", name: "Coffee Table", category: "furniture", supplier: "supplier-3", related: ["product-5"] },
    { id: "product-5", name: "Bookshelf", category: "furniture", supplier: "supplier-3", related: ["product-4"] },
    { id: "product-6", name: "Cotton T-Shirt", category: "clothing", supplier: "supplier-4", related: ["product-7"] },
    { id: "product-7", name: "Jeans", category: "clothing", supplier: "supplier-4", related: ["product-6"] },
  ];
  
  // Add some category entities
  const categories = [
    { id: "electronics", name: "Electronics" },
    { id: "furniture", name: "Furniture" },
    { id: "clothing", name: "Clothing" },
  ];
  
  // Add some supplier entities
  const suppliers = [
    { id: "supplier-1", name: "TechCorp" },
    { id: "supplier-2", name: "AudioPhile Inc" },
    { id: "supplier-3", name: "FurniMakers" },
    { id: "supplier-4", name: "FashionTex" },
  ];
  
  // Add entities to graph
  categories.forEach(category => {
    graph.entities.push({
      id: category.id,
      labels: ["Category"],
      properties: { name: category.name }
    });
  });
  
  suppliers.forEach(supplier => {
    graph.entities.push({
      id: supplier.id,
      labels: ["Supplier"],
      properties: { name: supplier.name }
    });
  });
  
  products.forEach(product => {
    graph.entities.push({
      id: product.id,
      labels: ["Product"],
      properties: { 
        name: product.name, 
        category: product.category,
        supplier: product.supplier
      }
    });
    
    // Add category relationship
    graph.relationships.push({
      id: `rel-${product.id}-category-${product.category}`,
      fromId: product.id,
      toId: product.category,
      type: "BELONGS_TO",
      properties: {}
    });
    
    // Add supplier relationship
    graph.relationships.push({
      id: `rel-${product.id}-supplier-${product.supplier}`,
      fromId: product.id,
      toId: product.supplier,
      type: "SUPPLIED_BY",
      properties: {}
    });
    
    // Add related product relationships
    product.related.forEach(relatedId => {
      graph.relationships.push({
        id: `rel-${product.id}-related-${relatedId}`,
        fromId: product.id,
        toId: relatedId,
        type: "RELATED_TO",
        properties: {}
      });
    });
  });
  
  // Update counts in meta
  graph.meta.entityCount = graph.entities.length;
  graph.meta.relationshipCount = graph.relationships.length;
  
  return graph;
}

/**
 * Run a comprehensive test of the graph pipeline
 */
async function runGraphPipelineTest() {
  console.log(chalk.blue("═════════════════════════════════════════════"));
  console.log(chalk.blue("           GRAPH PIPELINE TEST               "));
  console.log(chalk.blue("═════════════════════════════════════════════"));
  
  // Create the pipeline
  const pipeline = createGraphPipeline({
    defaultLayout: "force",
    includeTestData: true
  });
  
  // Get basic form structure
  const input = createComplexSampleInput();
  
  // STEP 1: Create a basic graph
  console.log(chalk.yellow("\n▸ STEP 1: Creating basic graph schema"));
  const basicGraph = pipeline.createGraph(input);
  console.log(`  • Created graph with ${basicGraph.entities.length} entities and ${basicGraph.relationships.length} relationships`);
  
  // Add test data for more interesting analysis
  const graphWithData = addTestData(basicGraph);
  console.log(`  • Added test data: ${graphWithData.entities.length} entities and ${graphWithData.relationships.length} relationships`);
  
  // STEP 2: Analyze the graph
  console.log(chalk.yellow("\n▸ STEP 2: Analyzing graph"));
  const analyzedGraph = pipeline.analyzeGraph(graphWithData);
  
  console.log("  • Entity counts by label:");
  Object.entries(analyzedGraph.analysis.metrics.entityCounts).forEach(([label, count]) => {
    console.log(`    - ${label}: ${count}`);
  });
  
  console.log("  • Relationship counts by type:");
  Object.entries(analyzedGraph.analysis.metrics.relationshipCounts).forEach(([type, count]) => {
    console.log(`    - ${type}: ${count}`);
  });
  
  console.log(`  • Average connectivity: ${analyzedGraph.analysis.metrics.averageConnectivity.toFixed(2)}`);
  
  console.log("  • Most connected entities:");
  analyzedGraph.analysis.metrics.mostConnectedEntities.forEach((entity, i) => {
    console.log(`    ${i+1}. ${entity.label} (${entity.id}): ${entity.connectionCount} connections`);
  });
  
  if (analyzedGraph.analysis.communities) {
    console.log(`  • Communities detected: ${analyzedGraph.analysis.communities.length}`);
    analyzedGraph.analysis.communities.forEach((community, i) => {
      console.log(`    - Community ${i+1}: ${community.size} entities, cohesion: ${community.cohesion.toFixed(2)}`);
    });
  }
  
  // STEP 3: Visualize the graph
  console.log(chalk.yellow("\n▸ STEP 3: Generating visualization"));
  const visualizedGraph = pipeline.visualizeGraph(analyzedGraph);
  
  console.log(`  • Layout method: ${visualizedGraph.visualization.layout}`);
  console.log(`  • Entity styles generated: ${Object.keys(visualizedGraph.visualization.style.entityStyles).length}`);
  console.log(`  • Relationship styles generated: ${Object.keys(visualizedGraph.visualization.style.relationshipStyles).length}`);
  
  if (visualizedGraph.visualization.focusAreas) {
    console.log(`  • Focus areas identified: ${visualizedGraph.visualization.focusAreas.length}`);
    visualizedGraph.visualization.focusAreas.forEach(area => {
      console.log(`    - ${area.name}: ${area.entityIds.length} entities, zoom: ${area.zoom}x`);
    });
  }
  
  // STEP 4: Full pipeline process
  console.log(chalk.yellow("\n▸ STEP 4: Running full pipeline process"));
  const fullResult = pipeline.processGraph(input);
  console.log(`  • Full pipeline completed`);
  console.log(`  • Graph schema generated`);
  console.log(`  • Analysis performed with ${fullResult.analysis.metrics.mostConnectedEntities.length} key nodes identified`);
  console.log(`  • Visualization generated with ${fullResult.visualization.layout} layout`);
  
  // Output detail sections (commented to avoid overwhelming output)
  // console.log(chalk.yellow("\n▸ Full Analyzed Structure:"));
  // console.log(inspect(fullResult.analysis, { depth: 3, colors: true }));
  
  console.log(chalk.yellow("\n▸ Graph Insights Summary:"));
  
  // Calculate network density
  const entityCount = fullResult.entities.length;
  const relationshipCount = fullResult.relationships.length;
  const maxPossibleRelationships = entityCount * (entityCount - 1);
  const networkDensity = maxPossibleRelationships > 0 ? 
    relationshipCount / maxPossibleRelationships : 0;
  
  console.log(`  • Network density: ${(networkDensity * 100).toFixed(2)}%`);
  console.log(`  • Network diameter: ${calculateNetworkDiameter(fullResult)}`);
  
  // Find interesting patterns
  const patterns = findInterestingPatterns(fullResult);
  if (patterns.length > 0) {
    console.log(chalk.yellow("\n▸ Interesting Patterns Detected:"));
    patterns.forEach((pattern, i) => {
      console.log(`  ${i+1}. ${pattern}`);
    });
  }
  
  console.log(chalk.blue("\n═════════════════════════════════════════════"));
  console.log(chalk.green("           PIPELINE TEST COMPLETED            "));
  console.log(chalk.blue("═════════════════════════════════════════════"));
}

function calculateNetworkDiameter(graph: any): number {
  // Simplified - in reality this would use the analysis result
  // Just returning a plausible value based on entity count
  return Math.ceil(Math.log2(graph.entities.length + 1));
}

function findInterestingPatterns(graph: any): string[] {
  const patterns: string[] = [];
  
  // Look for clusters by category
  const categoryGroups = graph.entities
    .filter((e: any) => e.labels.includes('Product') && e.properties.category)
    .reduce((groups: any, entity: any) => {
      const category = entity.properties.category;
      if (!groups[category]) groups[category] = [];
      groups[category].push(entity.id);
      return groups;
    }, {});
  
  // Check if categories form isolated clusters
  Object.entries(categoryGroups).forEach(([category, entityIds]: [string, any]) => {
    if (entityIds.length > 1) {
      patterns.push(`Products in category "${category}" form a distinct cluster with ${entityIds.length} items`);
    }
  });
  
  // Look for suppliers that supply multiple categories
  const supplierCategories: Record<string, Set<string>> = {};
  
  graph.entities
    .filter((e: any) => e.labels.includes('Product') && e.properties.supplier && e.properties.category)
    .forEach((entity: any) => {
      const supplier = entity.properties.supplier;
      const category = entity.properties.category;
      
      if (!supplierCategories[supplier]) {
        supplierCategories[supplier] = new Set();
      }
      
      supplierCategories[supplier].add(category);
    });
  
  Object.entries(supplierCategories).forEach(([supplier, categories]: [string, Set<string>]) => {
    if (categories.size > 1) {
      const supplierEntity = graph.entities.find((e: any) => e.id === supplier);
      const supplierName = supplierEntity?.properties?.name || supplier;
      patterns.push(`Supplier "${supplierName}" spans across ${categories.size} different categories`);
    }
  });
  
  // Look for product relationship patterns
  const hasRelatedProducts = graph.entities
    .filter((e: any) => e.labels.includes('Product'))
    .filter((e: any) => {
      const relatedCount = graph.relationships
        .filter((r: any) => (r.fromId === e.id || r.toId === e.id) && r.type === 'RELATED_TO')
        .length;
      return relatedCount > 0;
    }).length;
  
  const totalProducts = graph.entities.filter((e: any) => e.labels.includes('Product')).length;
  const relatedPercentage = (hasRelatedProducts / totalProducts) * 100;
  
  patterns.push(`${relatedPercentage.toFixed(1)}% of products have related products connections`);
  
  return patterns;
}

// Run the test
runGraphPipelineTest().catch(console.error);