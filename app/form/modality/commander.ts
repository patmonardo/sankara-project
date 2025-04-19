import { FormModalPipeline } from "./pipeline";
import { FormExecutionContext } from "../schema/context";

/**
 * Command context for execution
 */
export interface CommandContext<TOutput> {
  readonly pipeline: FormModalPipeline<TOutput>;
  readonly form: any; // Support both FormShape and GraphShape
  readonly options?: Record<string, any>;
  readonly executionContext?: FormExecutionContext;
}

/**
 * Command - Abstract representation of intent
 */
export interface Command<TOutput> {
  readonly name: string;
  readonly description: string;
  execute(context: CommandContext<TOutput>): Promise<any>;
}

/**
 * Modal Command - A command that transforms between different modes of representation
 */
export abstract class ModalCommand<TOutput> implements Command<TOutput> {
  abstract readonly name: string;
  abstract readonly description: string;

  /**
   * Create execution context for this command
   */
  protected createExecutionContext(
    options?: Record<string, any>
  ): FormExecutionContext {
    return {
      id: `${this.name}-${Date.now()}`,
      timestamp: Date.now(),
      data: {
        config: options || {},
        metrics: {
          startTime: Date.now(),
        },
      },
      mark: {
        command: this.name,
        pipeline: { morphs: [] },
      },
    };
  }

  /**
   * Execute this command with the given context
   */
  abstract execute(context: CommandContext<TOutput>): Promise<any>;
}

/**
 * Generate Command - Basic generation operation
 */
export class GenerateCommand<TOutput> extends ModalCommand<TOutput> {
  readonly name = "generate";
  readonly description = "Generate output from a form using the pipeline";

  async execute(context: CommandContext<TOutput>): Promise<TOutput> {
    const { pipeline, form, options, executionContext } = context;

    // Use provided execution context or create new one
    const runContext = executionContext || this.createExecutionContext(options);

    try {
      // Important: Return the actual transformed result!
      if (options) {
        if (typeof pipeline.generateWithConfig === "function") {
          return pipeline.generateWithConfig(form, options);
        } else if (typeof pipeline.runWithConfig === "function") {
          return pipeline.runWithConfig(form, options);
        } else {
          return pipeline.generate(form);
        }
      } else {
        return pipeline.generate(form);
      }
    } catch (error) {
      console.error(`Error in GenerateCommand: ${error}`);
      throw error;
    }
  }
}

/**
 * Diagnostics Command - Generate with detailed diagnostics
 */
export class DiagnosticsCommand<TOutput> extends ModalCommand<TOutput> {
  readonly name = "diagnostics";
  readonly description = "Generate output with detailed diagnostics";

  async execute(context: CommandContext<TOutput>): Promise<{
    result: TOutput;
    diagnostics: {
      executionTime: number;
      morphCount: number;
      morphNames: string[];
      timestamp: number;
    };
  }> {
    const { pipeline, form, options } = context;

    // Create custom context
    const runContext = this.createExecutionContext(options);

    // Start timing
    const start = performance.now();

    // Run the pipeline
    let result;
    try {
      if (typeof pipeline.generateWithConfig === "function") {
        result = pipeline.generateWithConfig(form, options);
      } else if (typeof pipeline.runWithConfig === "function") {
        // Fix: Pass correct parameters to runWithConfig
        result = pipeline.runWithConfig(form, options); // <-- Remove the bind approach
      } else {
        result = pipeline.generate(form);
      }
    } catch (error) {
      console.error(`Error in DiagnosticsCommand: ${error}`);
      throw error;
    }

    // Calculate execution time
    const executionTime = performance.now() - start;

    // Get pipeline stats
    const stats = pipeline.stats();

    return {
      result,
      diagnostics: {
        executionTime,
        morphCount: stats.morphCount,
        morphNames: stats.morphNames,
        timestamp: runContext.timestamp,
      },
    };
  }
}

/**
 * Explain Command - Provides pipeline explanation
 */
export class ExplainCommand<TOutput> extends ModalCommand<TOutput> {
  readonly name = "explain";
  readonly description = "Explain how the pipeline will process the form";

  async execute(context: CommandContext<TOutput>): Promise<{
    morphCount: number;
    morphNames: string[];
    config: Record<string, any>;
    explanation: string;
  }> {
    const { pipeline, form } = context;

    const stats = pipeline.stats();
    const config = pipeline.getConfig();

    // Handle both FormShape and GraphShape by checking for both name and title
    const formName = form.name || form.title || "Unnamed";

    // Generate explanation of the pipeline
    const explanation = `This pipeline will process the form "${formName}" using ${
      stats.morphCount
    } morphs:
${stats.morphNames.map((name, i) => `${i + 1}. ${name}`).join("\n")}

Configuration:
${Object.entries(config)
  .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
  .join("\n")}`;

    return {
      morphCount: stats.morphCount,
      morphNames: stats.morphNames,
      config: config,
      explanation,
    };
  }
}

/**
 * Commander - Orchestrates commands execution
 */
export class Commander<TOutput> {
  private commands: Map<string, Command<TOutput>> = new Map();

  constructor(private readonly pipeline: FormModalPipeline<TOutput>) {
    // Register default commands
    this.registerCommand(new GenerateCommand());
    this.registerCommand(new DiagnosticsCommand());
    this.registerCommand(new ExplainCommand());
  }

  /**
   * Register a new command
   */
  registerCommand(command: Command<TOutput>): void {
    this.commands.set(command.name, command);
  }

  /**
   * Execute a command by name
   */
  async execute(
    commandName: string,
    form: any, // Support both FormShape and GraphShape
    options?: Record<string, any>,
    executionContext?: FormExecutionContext
  ): Promise<any> {
    const command = this.commands.get(commandName);

    if (!command) {
      throw new Error(`Unknown command: ${commandName}`);
    }

    // Create command context
    const context: CommandContext<TOutput> = {
      pipeline: this.pipeline,
      form,
      options,
      executionContext,
    };

    return command.execute(context);
  }

  /**
   * Get available commands
   */
  getAvailableCommands(): { name: string; description: string }[] {
    return Array.from(this.commands.values()).map((cmd) => ({
      name: cmd.name,
      description: cmd.description,
    }));
  }
}

/**
 * Create a commander for a pipeline
 */
export function createCommander<TOutput>(
  pipeline: FormModalPipeline<TOutput>
): Commander<TOutput> {
  return new Commander<TOutput>(pipeline);
}
