import { Command, CommandContext } from "./types";
import { FormPipeline } from "../morph/core/pipeline";

/**
 * Command registry for storing and retrieving commands
 */
export class CommandRegistry {
  private commands = new Map<string, Command<any>>();

  /**
   * Register a command
   */
  register<TOutput>(command: Command<TOutput>): void {
    if (this.commands.has(command.name)) {
      console.warn(
        `Command "${command.name}" already registered. Overwriting.`
      );
    }
    this.commands.set(command.name, command);
  }

  /**
   * Get a command by name
   */
  get<TOutput>(name: string): Command<TOutput> | undefined {
    return this.commands.get(name) as Command<TOutput> | undefined;
  }

  /**
   * List all available commands
   */
  listCommands(): Array<{ name: string; description: string }> {
    return Array.from(this.commands.entries()).map(([name, command]) => ({
      name,
      description: command.description,
    }));
  }
}

/**
 * Commander - Main class for executing commands
 */
export class Commander {
  private registry = new CommandRegistry();

  constructor(private defaultPipeline?: FormPipeline<any>) {}

  /**
   * Register a command
   */
  register<TOutput>(command: Command<TOutput>): this {
    this.registry.register(command);
    return this;
  }

  /**
   * Execute a command by name
   */
  async execute<TOutput>(
    commandName: string,
    form: any,
    options: Record<string, any> = {},
    pipeline?: FormPipeline<TOutput>
  ): Promise<any> {
    const command = this.registry.get<TOutput>(commandName);

    if (!command) {
      throw new Error(`Command "${commandName}" not found.`);
    }

    const usePipeline =
      pipeline || (this.defaultPipeline as FormPipeline<TOutput>);

    if (!usePipeline) {
      throw new Error(`No pipeline provided for command "${commandName}".`);
    }

    const context: CommandContext<TOutput> = {
      pipeline: usePipeline,
      form,
      options,
      executionContext: {
        id: `cmd-${commandName}-${Date.now()}`,
        timestamp: Date.now(),
        data: { options },
      },
    };

    return command.execute(context);
  }

  /**
   * List all available commands
   */
  listCommands(): Array<{ name: string; description: string }> {
    return this.registry.listCommands();
  }
}

/**
 * CLI Interface for the commander
 */
export class CommanderCLI {
  constructor(private commander: Commander) {}

  /**
   * Parse and execute a command from CLI args
   */
  async parseAndExecute(args: string[]): Promise<any> {
    if (args.length < 1) {
      return this.showHelp();
    }

    const commandName = args[0];

    if (commandName === "help" || commandName === "--help") {
      return this.showHelp();
    }

    if (commandName === "list" || commandName === "ls") {
      return this.listCommands();
    }

    // Parse options
    const options: Record<string, any> = {};
    let formPath: string | undefined;

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];

      if (arg.startsWith("--")) {
        // Handle --key=value format
        const parts = arg.substring(2).split("=");
        if (parts.length === 2) {
          options[parts[0]] = this.parseValue(parts[1]);
        } else {
          // Boolean flag
          options[parts[0]] = true;
        }
      } else if (arg.startsWith("-")) {
        // Handle -k value format
        const key = arg.substring(1);
        const nextArg = args[i + 1];
        if (nextArg && !nextArg.startsWith("-")) {
          options[key] = this.parseValue(nextArg);
          i++; // Skip next arg since we've used it
        } else {
          options[key] = true;
        }
      } else if (!formPath) {
        // First non-option arg is the form path
        formPath = arg;
      }
    }

    if (!formPath) {
      console.error("Error: No form specified.");
      return this.showHelp();
    }

    // Load form data
    let formData;
    try {
      const fs = require("fs");
      const formContent = fs.readFileSync(formPath, "utf8");
      formData = JSON.parse(formContent);
    } catch (error) {
      console.error(`Error loading form from ${formPath}:`);
      console.error(error);
      return 1;
    }

    try {
      const result = await this.commander.execute(
        commandName,
        formData,
        options
      );
      return result;
    } catch (error) {
      console.error(`Error executing command "${commandName}":`);
      console.error(error);
      return 1;
    }
  }

  /**
   * Parse string values into appropriate types
   */
  private parseValue(value: string): any {
    // Try to parse as number
    if (!isNaN(Number(value))) {
      return Number(value);
    }

    // Try to parse as boolean
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;

    // Default to string
    return value;
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log("Form Modality Command Line Interface");
    console.log("-----------------------------------");
    console.log("Usage: modality <command> <form-path> [options]");
    console.log("\nCommands:");

    const commands = this.commander.listCommands();
    commands.forEach((cmd) => {
      console.log(`  ${cmd.name.padEnd(15)} - ${cmd.description}`);
    });

    console.log("\nOptions:");
    console.log("  --key=value       Set option with value");
    console.log("  -k value          Set option with value");
    console.log("  --flag            Set boolean flag to true");

    console.log("\nExamples:");
    console.log("  modality graph path/to/form.json --test-data");
    console.log("  modality analyze path/to/graph.json -c true");
  }

  /**
   * List all available commands
   */
  private listCommands(): void {
    console.log("Available commands:");
    const commands = this.commander.listCommands();
    commands.forEach((cmd) => {
      console.log(`  ${cmd.name.padEnd(15)} - ${cmd.description}`);
    });
  }
}

/**
 * Create a standard commander with default configuration
 */
export function createCommander(
  defaultPipeline?: FormPipeline<any>
): Commander {
  const commander = new Commander(defaultPipeline);

  // Here we could pre-register standard commands if needed
  // This pattern allows for customization while providing sensible defaults

  return commander;
}

/**
 * Create a standalone CLI entry point
 */
export function createCommanderCLI(): CommanderCLI {
  // Now use the createCommander function
  const commander = createCommander();
  return new CommanderCLI(commander);
}
