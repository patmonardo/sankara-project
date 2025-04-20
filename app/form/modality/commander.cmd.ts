import { FormExecutionContext } from "../schema/context";
import { GraphShape } from "../morph/graph/types";
import { FormModalPipeline } from "./pipeline";
import { createCommander } from "./commander";
import util from "util";
import chalk from "chalk";

/**
 * ChakraTestPipeline - A test pipeline that implements FormModalPipeline interface
 */
class ChakraTestPipeline extends FormModalPipeline<any> {
  constructor(config: Record<string, any> = {}) {
    super({
      chakraLevel: config.chakraLevel || "muladhara",
      energyFlow: config.energyFlow || "ascending",
      ...config,
    });
  }

  // Override generate method for our test implementation
  generate(shape: GraphShape, context?: FormExecutionContext): any {
    const chakraMapping = {
      muladhara: { color: "red", element: "earth", focus: "stability" },
      svadhisthana: { color: "orange", element: "water", focus: "creativity" },
      manipura: { color: "yellow", element: "fire", focus: "willpower" },
      anahata: { color: "green", element: "air", focus: "love" },
      vishuddha: { color: "blue", element: "ether", focus: "expression" },
      ajna: { color: "indigo", element: "light", focus: "intuition" },
      sahasrara: {
        color: "violet",
        element: "thought",
        focus: "consciousness",
      },
    };

    const selectedChakra = this.config.chakraLevel;
    const chakraInfo =
      chakraMapping[selectedChakra as keyof typeof chakraMapping] ||
      chakraMapping.muladhara;

    return {
      id: shape.id,
      name: shape.name || "Unnamed Graph",
      chakraOutput: {
        level: selectedChakra,
        ...chakraInfo,
        timestamp: new Date().toISOString(),
        sourceFields: Object.keys(shape).length,
        energyFlow: this.config.energyFlow,
        resonance: Math.random() * 100,
        balanceState: "harmonizing",
      },
      transformationResult: {
        inputForm: shape.id,
        outputGenerated: true,
        processComplete: true,
      },
      meta: {
        ...shape.meta,
        processedBy: "ChakraTestPipeline",
        modalTransformation: "form → energy → consciousness",
      },
    };
  }

  // In the ChakraTestPipeline class:
  generateWithConfig(
    form: GraphShape,
    runtimeConfig: Record<string, any> = {},
    context?: FormExecutionContext
  ): any {
    // Store original config
    const originalConfig = { ...this.config };

    try {
      // Apply runtime config with proper merging
      this.config = {
        ...this.config,
        ...runtimeConfig,
      };

      console.log(
        `DEBUG: Config updated to chakra level: ${this.config.chakraLevel}`
      );

      // Generate with updated config
      const result = this.generate(form, context);

      // Ensure we're returning the transformed result with chakraOutput
      if (!result.chakraOutput) {
        console.warn(
          "Warning: generate() did not produce chakraOutput, creating it now"
        );

        // Get chakra info based on current config
        const chakraMapping = {
          muladhara: { color: "red", element: "earth", focus: "stability" },
          svadhisthana: {
            color: "orange",
            element: "water",
            focus: "creativity",
          },
          manipura: { color: "yellow", element: "fire", focus: "willpower" },
          anahata: { color: "green", element: "air", focus: "love" },
          vishuddha: { color: "blue", element: "ether", focus: "expression" },
          ajna: { color: "indigo", element: "light", focus: "intuition" },
          sahasrara: {
            color: "violet",
            element: "thought",
            focus: "consciousness",
          },
        };

        const selectedChakra = this.config.chakraLevel;
        const chakraInfo =
          chakraMapping[selectedChakra as keyof typeof chakraMapping] ||
          chakraMapping.muladhara;

        // Add chakra output if missing
        result.chakraOutput = {
          level: selectedChakra,
          ...chakraInfo,
          timestamp: new Date().toISOString(),
          sourceFields: Object.keys(form).length,
          energyFlow: this.config.energyFlow,
          resonance: Math.random() * 100,
          balanceState: "harmonizing",
        };
      }

      return result;
    } catch (error) {
      console.error(`Error in generateWithConfig: ${error}`);
      throw error;
    } finally {
      // Restore original config
      this.config = originalConfig;
    }
  }
  // Override stats to provide test morphs
  stats(): { morphCount: number; morphNames: string[] } {
    return {
      morphCount: 5,
      morphNames: [
        "InputReceiver",
        "EnergyTransformer",
        "VibrationElevator",
        "ConsciousnessBridge",
        "OutputManifestor",
      ],
    };
  }
}
/**
 * Create a sample test graph
 */
function createTestGraph(): GraphShape {
  return {
    id: "consciousness-elevation-graph",
    name: "Consciousness Elevation Schema",
    description: "A graph for mapping consciousness transformation",
    fields: [],
    entities: [
      {
        id: "seeker-1",
        labels: ["Seeker", "Person"],
        properties: {
          id: "seeker-1",
          name: "Spiritual Aspirant",
          consciousnessLevel: 7,
          primaryChakra: "anahata",
        },
      },
      {
        id: "practice-1",
        labels: ["Practice", "Meditation"],
        properties: {
          id: "practice-1",
          name: "Heart Chakra Meditation",
          chakraFocus: "anahata",
          duration: 30,
        },
      },
    ],
    relationships: [
      {
        id: "seeker-practice-1",
        fromId: "seeker-1",
        toId: "practice-1",
        type: "ENGAGES_IN",
        properties: {
          frequency: "daily",
          duration: 30,
        },
      },
    ],
    // This is now correct for GraphShape
    meta: {
      generatedAt: new Date().toISOString(),
      sourceMorph: "ConsciousnessFormToGraphMorph",
      labelPrefix: "Chakra_",
      includeMetadata: true,
      entityCount: 2,
      relationshipCount: 1,
      version: 1,
      tags: ["consciousness", "middle-way", "chakra"],
    },
  };
}

/**
 * Format section header with sacred geometry-inspired separators
 */
function formatHeader(title: string): string {
  const sacred = "✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧";
  return `\n${sacred}\n  ${chalk.bold.cyan(
    title.toUpperCase()
  )}  \n${sacred}\n`;
}

/**
 * CommandContext interface for our test
 */
interface CommandContext<TOutput> {
  readonly pipeline: any;
  readonly form: GraphShape;
  readonly options?: Record<string, any>;
  readonly executionContext?: FormExecutionContext;
}

/**
 * Command interface for our test
 */
interface Command<TOutput> {
  readonly name: string;
  readonly description: string;
  execute(context: CommandContext<TOutput>): Promise<any>;
}

/**
 * Run tests for the Commander pattern
 */
async function runCommanderTests() {
  console.log(formatHeader("Modal Chakra Command System Test"));

  // Create our test pipeline
  const pipeline = new ChakraTestPipeline({
    chakraLevel: "anahata", // Heart chakra - balanced middle way
    energyFlow: "bidirectional", // Both ascending and descending paths
  });

  // Create the commander
  const commander = createCommander(pipeline);

  // Create test graph
  const graph = createTestGraph();

  console.log(chalk.yellow("► Available Commands:"));
  const commands = commander.getAvailableCommands();
  commands.forEach((cmd) => {
    console.log(
      `  ${chalk.green("•")} ${chalk.bold(cmd.name)}: ${cmd.description}`
    );
  });

  // TEST 1: Run the explain command
  console.log(formatHeader("Test 1: Explain Command"));
  try {
    const explanation = await commander.execute("explain", graph);
    console.log(chalk.bold("Pipeline Explanation:"));
    console.log(chalk.italic(explanation.explanation));
    console.log(`\nMorphs: ${explanation.morphCount}`);
    console.log(`Configuration: ${Object.keys(explanation.config).join(", ")}`);
  } catch (error) {
    console.error(chalk.red(`Error running explain command: ${error}`));
  }

  // TEST 2: Generate with default config
  console.log(formatHeader("Test 2: Generate Command (Default Config)"));
  try {
    const result = await commander.execute("generate", graph);
    console.log(`Result for graph: ${result.name}`);
    console.log(
      `Chakra Level: ${result.chakraOutput.level} (${result.chakraOutput.focus})`
    );
    console.log(
      `Element: ${result.chakraOutput.element}, Color: ${result.chakraOutput.color}`
    );
    console.log(`Energy Flow: ${result.chakraOutput.energyFlow}`);
    console.log(
      `Resonance Level: ${result.chakraOutput.resonance.toFixed(2)}%`
    );
  } catch (error) {
    console.error(chalk.red(`Error running generate command: ${error}`));
  }

  // TEST 3: Run with custom context and config
  console.log(
    formatHeader("Test 3: Generate Command (Custom Config & Context)")
  );
  try {
    // Create custom context
    const customContext: FormExecutionContext = {
      id: `chakra-test-${Date.now()}`,
      timestamp: Date.now(),
      data: {
        intention: "illumination",
        practiceLevel: "advanced",
      },
      mark: {
        sacred: true,
        vibrationLevel: 528, // Healing frequency
      },
    };

    // Custom runtime config for highest chakra
    const runtimeConfig = {
      chakraLevel: "sahasrara", // Crown chakra
      energyFlow: "integrative",
      intensityLevel: 9,
    };

    const result = await commander.execute(
      "generate",
      graph,
      runtimeConfig,
      customContext
    );
    console.log(`Result for graph: ${result.name}`);
    console.log(
      `Chakra Level: ${result.chakraOutput.level} (${result.chakraOutput.focus})`
    );
    console.log(
      `Element: ${result.chakraOutput.element}, Color: ${result.chakraOutput.color}`
    );
    console.log(`Energy Flow: ${result.chakraOutput.energyFlow}`);
    console.log(
      `Resonance Level: ${result.chakraOutput.resonance.toFixed(2)}%`
    );
  } catch (error) {
    console.error(
      chalk.red(`Error running generate command with custom config: ${error}`)
    );
  }

  // TEST 4: Diagnostics command
  console.log(formatHeader("Test 4: Diagnostics Command"));
  try {
    const diagnostics = await commander.execute("diagnostics", graph);
    console.log(
      `Execution Time: ${diagnostics.diagnostics.executionTime.toFixed(2)}ms`
    );
    console.log(`Morphs Executed: ${diagnostics.diagnostics.morphCount}`);
    console.log(
      `Morph Chain: ${diagnostics.diagnostics.morphNames.join(" → ")}`
    );
    console.log(`\nResult Preview:`);
    console.log(util.inspect(diagnostics.result, { colors: true, depth: 1 }));
  } catch (error) {
    console.error(chalk.red(`Error running diagnostics command: ${error}`));
  }

  // TEST 5: Error handling - invalid command
  console.log(formatHeader("Test 5: Error Handling - Invalid Command"));
  try {
    // @ts-ignore - Intentional error for testing
    await commander.execute("invalidCommand", graph);
  } catch (error) {
    console.error(chalk.yellow(`Expected error caught: ${error}`));
    console.log(chalk.green("✓ Error handling works properly"));
  }

  // Register custom command
  console.log(formatHeader("Test 6: Custom Command Registration"));

  // Create a custom command class
  class ChakraBalanceCommand implements Command<any> {
    readonly name = "balance";
    readonly description = "Balance chakra energies across the system";

    async execute(context: CommandContext<any>): Promise<any> {
      const { pipeline, form } = context;

      // Generate base result
      const baseResult = pipeline.generate(form);

      // Add balancing information
      return {
        ...baseResult,
        chakraBalance: {
          balanceAchieved: true,
          harmonizationLevel: 92.7,
          alignedChakras: [
            "muladhara",
            "svadhisthana",
            "manipura",
            "anahata",
            "vishuddha",
            "ajna",
            "sahasrara",
          ],
          dominantFlow: "middleway",
          message:
            "The Middle Way has been found. Integration of opposites achieved.",
        },
      };
    }
  }

  // Register the custom command
  commander.registerCommand(new ChakraBalanceCommand());

  // Test the new command
  try {
    const balanceResult = await commander.execute("balance", graph);
    console.log(
      `Balance achieved: ${balanceResult.chakraBalance.balanceAchieved}`
    );
    console.log(
      `Harmonization: ${balanceResult.chakraBalance.harmonizationLevel}%`
    );
    console.log(`Dominant Flow: ${balanceResult.chakraBalance.dominantFlow}`);
    console.log(
      `Message: ${chalk.bold.green(balanceResult.chakraBalance.message)}`
    );
  } catch (error) {
    console.error(chalk.red(`Error running balance command: ${error}`));
  }

  console.log(formatHeader("Test Complete - The Middle Way Emerges"));
}

// Run the tests
runCommanderTests().catch((error) => {
  console.error(chalk.red("Fatal error in test execution:"), error);
});
