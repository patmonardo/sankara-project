import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Mode Generator - Creates scaffolding for a new transformation mode
 * 
 * This embodies the concept of modality itself - the ability to generate
 * new modes of representation while preserving semantic meaning.
 */
class ModeGenerator {
  private baseDir: string;
  
  constructor(baseDir: string = '/home/pat/VSCode/sankara/app/form/morph') {
    this.baseDir = baseDir;
  }
  
  /**
   * Generate a new mode with all required files
   * 
   * @param modeName The name of the mode to create
   * @param options Configuration for the new mode
   */
  generateMode(modeName: string, options: {
    // What shape this mode extends
    extends: string;
    
    // Core operations this mode supports
    operations: string[];
    
    // Artifacts this mode generates
    artifacts: string[];
    
    // Description of this mode's purpose
    description: string;
  }) {
    const modeDir = path.join(this.baseDir, modeName.toLowerCase());
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(modeDir)) {
      fs.mkdirSync(modeDir, { recursive: true });
    }
    
    // Generate types.ts
    this.generateTypesFile(modeDir, modeName, options);
    
    // Generate core morph file
    this.generateCoreFile(modeDir, modeName, options);
    
    // Generate pipeline file
    this.generatePipelineFile(modeDir, modeName, options);
    
    // Generate cmd file for testing
    this.generateCmdFile(modeDir, modeName, options);
    
    console.log(`\n═════════════════════════════════════`);
    console.log(`     MODE GENERATOR: ${modeName.toUpperCase()}`);
    console.log(`═════════════════════════════════════`);
    console.log(`\n▸ Created new mode: ${modeName}`);
    console.log(`  • Directory: ${modeDir}`);
    console.log(`  • Extends: ${options.extends}`);
    console.log(`  • Operations: ${options.operations.join(", ")}`);
    console.log(`  • Files generated:`);
    console.log(`    - types.ts`);
    console.log(`    - ${modeName.toLowerCase()}.ts`);
    console.log(`    - pipeline.ts`);
    console.log(`    - ${modeName.toLowerCase()}.cmd.ts`);
    
    console.log(`\n▸ Next steps:`);
    console.log(`  • Implement the ${modeName}Morph in ${modeName.toLowerCase()}.ts`);
    console.log(`  • Add specific artifacts to the ${modeName}Shape in types.ts`);
    console.log(`  • Customize the pipeline configuration in pipeline.ts`);
    console.log(`  • Test your implementation with: ts-node ${modeName.toLowerCase()}.cmd.ts`);
  }
  
  /**
   * Generate the types.ts file for this mode
   */
  private generateTypesFile(modeDir: string, modeName: string, options: any) {
    const capitalizedName = this.capitalize(modeName);
    
    const typesContent = `// filepath: ${modeDir}/types.ts
import { FormMeta } from "../../schema/form";
import { ${options.extends} } from "../${options.extends.toLowerCase() === 'formshape' ? 'schema/form' : options.extends.toLowerCase().replace('shape', '') + '/types'}";

/**
 * Represents a form that has been transformed into ${options.description}
 * This is the output of ${capitalizedName}Morph
 */
export interface ${capitalizedName}Shape extends ${options.extends} {
  /** Generated ${modeName} artifacts */
  ${options.artifacts.map(art => `${art}: ${capitalizedName}${this.capitalize(art)}[];`).join('\n  ')}
  
  /** Additional configuration parameters */
  parameters: Record<string, any>;
  
  /** Metadata specific to ${modeName} generation */
  meta: FormMeta & ${capitalizedName}Meta;
}

/**
 * Metadata specific to ${modeName} generation, including configuration
 */
export interface ${capitalizedName}Meta {
  /** When the ${modeName} was generated */
  generatedAt?: string;
  
  /** Source morph that generated this shape */
  sourceMorph?: string;
  
  ${options.operations.map(op => `/** Whether to generate ${op} operations */\n  generate${this.capitalize(op)}?: boolean;`).join('\n\n  ')}
  
  /** Custom extension point for additional metadata */
  [key: string]: any;
}

${options.artifacts.map(art => `/**
 * Represents a ${art} in the ${modeName} domain
 */
export interface ${capitalizedName}${this.capitalize(art)} {
  /** Unique identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Related entity or relationship ID */
  sourceId?: string;
  
  /** Content of this ${art} */
  content: string;
  
  /** Purpose of this ${art} */
  purpose: string;
  
  /** Execution or processing order */
  order?: number;
  
  /** Additional metadata */
  meta?: Record<string, any>;
}`).join('\n\n')}
`;

    fs.writeFileSync(path.join(modeDir, 'types.ts'), typesContent);
  }
  
  /**
   * Generate the core morph file for this mode
   */
  private generateCoreFile(modeDir: string, modeName: string, options: any) {
    const capitalizedName = this.capitalize(modeName);
    const fileName = modeName.toLowerCase() + '.ts';
    
    const coreContent = `// filepath: ${modeDir}/${fileName}
import { SimpleMorph } from "../morph";
import { ${capitalizedName}Shape } from "./types";

/**
 * Transforms a ${capitalizedName}Shape to an enhanced ${capitalizedName}Shape
 * Generates ${options.description}
 */
export const ${capitalizedName}Morph = new SimpleMorph<${capitalizedName}Shape, ${capitalizedName}Shape>(
  "${capitalizedName}Morph",
  (shape) => {
    // Validate input
    if (!shape || !shape.id) {
      throw new Error("Invalid shape provided to ${capitalizedName}Morph");
    }

    // Create a new shape to avoid mutations
    const enhancedShape: ${capitalizedName}Shape = {
      ...shape,
      // Initialize or maintain artifacts arrays
      ${options.artifacts.map(art => `${art}: [...(shape.${art} || []),]`).join(',\n      ')},
      parameters: { ...(shape.parameters || {}) },
      meta: {
        ...(shape.meta || {}),
        // Add timestamp but preserve any existing value
        generatedAt: shape.meta?.generatedAt || new Date().toISOString(),
        sourceMorph: "${capitalizedName}Morph",
      }
    };

    // Generate artifacts based on entities
    if (enhancedShape.entities) {
      enhancedShape.entities.forEach(entity => {
        ${options.operations.map(op => `// Generate ${op} artifacts
        generate${this.capitalize(op)}Artifacts(entity, enhancedShape);`).join('\n        ')}
      });
    }
    
    // Generate artifacts based on relationships
    if (enhancedShape.relationships) {
      enhancedShape.relationships.forEach(rel => {
        generateRelationshipArtifacts(rel, enhancedShape);
      });
    }

    // Update artifact counts in meta
    ${options.artifacts.map(art => `enhancedShape.meta.${art}Count = enhancedShape.${art}.length;`).join('\n    ')}

    return enhancedShape;
  },
  {
    pure: false, // Due to Date() when generatedAt not provided
    fusible: true,
    cost: 3,
    memoizable: false // Due to potential Date()
  }
);

${options.operations.map(op => `/**
 * Generate ${op} artifacts for an entity
 */
function generate${this.capitalize(op)}Artifacts(entity: any, shape: ${capitalizedName}Shape): void {
  // TODO: Implement generation logic for ${op} operations
  // This is where you'll add the specific logic for generating ${op} artifacts
  // based on the entity structure
}`).join('\n\n')}

/**
 * Generate artifacts for relationships
 */
function generateRelationshipArtifacts(relationship: any, shape: ${capitalizedName}Shape): void {
  // TODO: Implement relationship artifact generation
  // This is where you'll handle artifacts that involve relationships between entities
}
`;

    fs.writeFileSync(path.join(modeDir, fileName), coreContent);
  }
  
  /**
   * Generate the pipeline file for this mode
   */
  private generatePipelineFile(modeDir: string, modeName: string, options: any) {
    const capitalizedName = this.capitalize(modeName);
    const sourceMode = options.extends.replace('Shape', '');
    const sourceMorph = sourceMode === 'Form' ? 'FormToGraphSchemaMorph' : `${sourceMode}Morph`;
    const sourceImport = sourceMode === 'Form' 
      ? 'import { FormToGraphSchemaMorph } from "../graph/graph";'
      : `import { ${sourceMorph} } from "../${sourceMode.toLowerCase()}/${sourceMode.toLowerCase()}";`;
    
    const pipelineContent = `// filepath: ${modeDir}/pipeline.ts
import { SimpleMorph, MorphPipeline } from "../morph";
import { FormShape } from "../../schema/form";
import { ${options.extends} } from "../${options.extends.toLowerCase() === 'formshape' ? 'schema/form' : options.extends.toLowerCase().replace('shape', '') + '/types'}";
import { ${capitalizedName}Shape } from "./types";
import { ${capitalizedName}Morph } from "./${modeName.toLowerCase()}";
${sourceImport}

/**
 * Configuration for the ${capitalizedName} pipeline
 */
export interface ${capitalizedName}PipelineConfig {
  ${options.operations.map(op => `/** Whether to generate ${op} operations */\n  generate${this.capitalize(op)}?: boolean;`).join('\n\n  ')}
  
  /** Additional configuration options */
  [key: string]: any;
}

/**
 * ${capitalizedName}Pipeline - A specialized pipeline for generating ${options.description}
 * 
 * This pipeline handles context/config at the root level, allowing individual morphs
 * to focus on their specific transformations by reading from meta properties.
 */
export class ${capitalizedName}Pipeline {
  private pipeline: MorphPipeline<FormShape, ${capitalizedName}Shape>;
  private config: ${capitalizedName}PipelineConfig;
  
  /**
   * Create a new ${capitalizedName}Pipeline with optional configuration
   */
  constructor(config: ${capitalizedName}PipelineConfig = {}) {
    // Store configuration with defaults
    this.config = {
      ${options.operations.map(op => `generate${this.capitalize(op)}: config.generate${this.capitalize(op)} !== false`).join(',\n      ')}
    };
    
    // Create the core pipeline
    this.pipeline = new MorphPipeline<FormShape, ${capitalizedName}Shape>();
    
    // Add the form-to-source transformation
    this.pipeline.add(${sourceMorph});
    
    // Add the cross-domain bridge (handles the mode transition)
    this.pipeline.add(new SimpleMorph<${options.extends}, ${capitalizedName}Shape>(
      "${options.extends}To${capitalizedName}Bridge",
      (sourceShape) => {
        // Initialize the ${capitalizedName}Shape with config values in meta
        return {
          ...sourceShape,
          ${options.artifacts.map(art => `${art}: [],`).join('\n          ')}
          parameters: {},
          meta: {
            ...sourceShape.meta,
            // Root pipeline injects config into meta
            ${options.operations.map(op => `generate${this.capitalize(op)}: this.config.generate${this.capitalize(op)}`).join(',\n            ')}
          }
        } as ${capitalizedName}Shape;
      }
    ));
    
    // Add the artifact generator
    this.pipeline.add(${capitalizedName}Morph);
  }
  
  /**
   * Generate ${modeName} artifacts from a form definition
   * 
   * @param form The form definition to transform
   * @returns A ${capitalizedName}Shape with generated artifacts
   */
  generate(form: FormShape): ${capitalizedName}Shape {
    return this.pipeline.run(form);
  }
  
  /**
   * Get diagnostic information about the pipeline execution
   * 
   * @param form The form to process
   * @returns Diagnostic information for each stage
   */
  explain(form: FormShape): Array<{
    stage: string;
    entityCount: number;
    relationshipCount: number;
    artifactCounts?: Record<string, number>;
  }> {
    const result = [];
    
    // Form stage
    result.push({
      stage: "Form Definition",
      entityCount: 0, 
      relationshipCount: 0
    });
    
    // Source stage
    const sourceShape = ${sourceMorph}.run(form);
    result.push({
      stage: "${options.extends} Structure",
      entityCount: sourceShape.entities?.length || 0,
      relationshipCount: sourceShape.relationships?.length || 0
    });
    
    // Bridge stage (before artifact generation)
    const bridgeMorph = new SimpleMorph<${options.extends}, ${capitalizedName}Shape>(
      "${options.extends}To${capitalizedName}Bridge",
      (sourceShape) => {
        return {
          ...sourceShape,
          ${options.artifacts.map(art => `${art}: [],`).join('\n          ')}
          parameters: {},
          meta: {
            ...sourceShape.meta,
            ${options.operations.map(op => `generate${this.capitalize(op)}: this.config.generate${this.capitalize(op)}`).join(',\n            ')}
          }
        } as ${capitalizedName}Shape;
      }
    );
    const bridgedShape = bridgeMorph.run(sourceShape);
    result.push({
      stage: "${capitalizedName} Container",
      entityCount: bridgedShape.entities?.length || 0,
      relationshipCount: bridgedShape.relationships?.length || 0,
      artifactCounts: {
        ${options.artifacts.map(art => `${art}: 0`).join(',\n        ')}
      }
    });
    
    // Final stage with artifacts
    const finalShape = ${capitalizedName}Morph.run(bridgedShape);
    result.push({
      stage: "${capitalizedName} Complete",
      entityCount: finalShape.entities?.length || 0,
      relationshipCount: finalShape.relationships?.length || 0,
      artifactCounts: {
        ${options.artifacts.map(art => `${art}: finalShape.${art}?.length || 0`).join(',\n        ')}
      }
    });
    
    return result;
  }
}

/**
 * Quick helper function to generate ${modeName} artifacts from a form
 */
export function generate${capitalizedName}(form: FormShape, config?: ${capitalizedName}PipelineConfig): ${capitalizedName}Shape {
  return new ${capitalizedName}Pipeline(config).generate(form);
}
`;

    fs.writeFileSync(path.join(modeDir, 'pipeline.ts'), pipelineContent);
  }
  
  /**
   * Generate the command file for testing
   */
  private generateCmdFile(modeDir: string, modeName: string, options: any) {
    const capitalizedName = this.capitalize(modeName);
    const fileName = modeName.toLowerCase() + '.cmd.ts';
    
    const cmdContent = `// filepath: ${modeDir}/${fileName}
import { ${capitalizedName}Pipeline, ${capitalizedName}PipelineConfig, generate${capitalizedName} } from "./pipeline";
import { inspect } from "util";

/**
 * Create a sample form for testing
 */
function createSampleForm() {
  return {
    id: "productCatalog",
    title: "Product Catalog",
    description: "A form for managing product information",
    fields: [
      { id: "id", type: "text", label: "Product ID", required: true },
      { id: "name", type: "text", label: "Product Name", required: true },
      { id: "description", type: "textarea", label: "Description" },
      { id: "price", type: "number", label: "Price", required: true },
      { id: "category", type: "select", label: "Category", options: ["electronics", "clothing", "food"] },
      { id: "tags", type: "array", label: "Tags" },
      { id: "stock", type: "number", label: "Stock Level", required: true },
      { id: "supplier", type: "text", label: "Supplier" },
    ],
    meta: {
      entityDefs: [
        { entity: "Product", fields: ["id", "name", "description", "price", "stock"] },
        { entity: "Category", fields: ["id", "name"] },
        { entity: "Supplier", fields: ["id", "name"] }
      ],
      relationDefs: [
        { field: "category", type: "BELONGS_TO", target: "Category" },
        { field: "supplier", type: "SUPPLIED_BY", target: "Supplier" },
        { field: "tags", type: "HAS_TAG", target: "Tag", isArray: true }
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
  console.log("    ${capitalizedName.toUpperCase()} PIPELINE TEST RUN       ");
  console.log("═════════════════════════════════════");
  
  // Create sample form
  const form = createSampleForm();
  
  // Create pipeline with custom config
  const config: ${capitalizedName}PipelineConfig = {
    ${options.operations.map(op => `generate${this.capitalize(op)}: true`).join(',\n    ')}
  };
  
  const pipeline = new ${capitalizedName}Pipeline(config);
  
  // Get explanation of the process
  console.log("\\n▸ Pipeline Process Explanation:");
  const explanation = pipeline.explain(form);
  explanation.forEach((stage, i) => {
    console.log(\`  • Stage \${i+1}: \${stage.stage}\`);
    console.log(\`    - Entities: \${stage.entityCount}\`);
    console.log(\`    - Relationships: \${stage.relationshipCount}\`);
    if (stage.artifactCounts) {
      console.log("    - Artifacts:");
      Object.entries(stage.artifactCounts).forEach(([type, count]) => {
        console.log(\`      • \${type}: \${count}\`);
      });
    }
  });
  
  // Run the pipeline
  console.log("\\n▸ Running Pipeline...");
  const result = pipeline.generate(form);
  
  // Show artifact counts
  console.log("\\n▸ Generated Artifacts:");
  ${options.artifacts.map(art => `console.log(\`  • \${result.${art}.length} ${art}\`);`).join('\n  ')}
  
  // Show some sample artifacts
  ${options.artifacts.map(art => `if (result.${art}.length > 0) {
    console.log(\`\\n▸ Sample ${this.capitalize(art)}:\`);
    const sample = result.${art}[0];
    console.log(\`  • ID: \${sample.id}\`);
    console.log(\`  • Name: \${sample.name}\`);
    console.log(\`  • Purpose: \${sample.purpose}\`);
    console.log("  • Content:");
    console.log(\`    \${sample.content.replace(/\\n/g, "\\n    ")}\`);
  }`).join('\n\n  ')}
  
  // Show the final shape structure (limited depth)
  console.log("\\n▸ Final Shape Structure:");
  console.log(inspect({
    id: result.id,
    title: result.title,
    entities: result.entities?.map(e => ({ id: e.id })),
    relationships: result.relationships?.map(r => ({ 
      id: r.id, 
      type: r.type, 
      fromId: r.fromId, 
      toId: r.toId 
    })),
    ${options.artifacts.map(art => `${art}: result.${art}.map(a => ({ id: a.id, name: a.name, purpose: a.purpose }))`).join(',\n    ')},
    meta: {
      generatedAt: result.meta.generatedAt,
      sourceMorph: result.meta.sourceMorph,
      ${options.artifacts.map(art => `${art}Count: result.meta.${art}Count`).join(',\n      ')}
    }
  }, { depth: 3, colors: true }));
  
  // Also test the convenience function
  console.log("\\n▸ Testing Convenience Function:");
  const quickResult = generate${capitalizedName}(form);
  ${options.artifacts.map(art => `console.log(\`  • generate${capitalizedName}() produced \${quickResult.${art}.length} ${art}\`);`).join('\n  ')}
}

// Run the test
runPipeline();
`;

    fs.writeFileSync(path.join(modeDir, fileName), cmdContent);
  }
  
  /**
   * Capitalize the first letter of a string
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Main function to run the mode generator
 */
function main() {
  const generator = new ModeGenerator();
  
  // Example: Generate a REST API mode
  generator.generateMode("rest", {
    extends: "GraphShape",
    operations: ["create", "read", "update", "delete", "list"],
    artifacts: ["routes", "controllers", "validators", "tests"],
    description: "REST API components"
  });
  
  // Uncomment to generate additional modes:
  /*
  // Generate GraphQL mode
  generator.generateMode("graphql", {
    extends: "GraphShape",
    operations: ["query", "mutation", "subscription"],
    artifacts: ["types", "resolvers", "schemas"],
    description: "GraphQL API components"
  });
  
  // Generate UI mode
  generator.generateMode("ui", {
    extends: "FormShape",
    operations: ["render", "validate", "submit"],
    artifacts: ["components", "styles", "hooks"],
    description: "UI components"
  });
  */
}

// Execute the generator
main();