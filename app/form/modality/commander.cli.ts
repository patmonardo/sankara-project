import { Commander, CommanderCLI } from './commander';
import { FormPipeline } from '../morph/core/pipeline';
import { GraphCommand, AddEntityCommand, ConnectCommand } from '../morph/graph/types';

/**
 * Create configured commander with all commands
 */
function createCommander() {
  const commander = new Commander(new FormPipeline());
  
  // Register all commands
  commander.register(new GraphCommand());
  commander.register(new AddEntityCommand());
  commander.register(new ConnectCommand());
  // Register other commands
  
  return commander;
}

/**
 * Execute modality commands programmatically
 */
export async function execute(args: string[], options: {
  file?: string;
  output?: string;
  json?: boolean;
}) {
  // If file option provided, insert it as first argument after command
  if (options.file && args.length > 0) {
    args = [args[0], options.file, ...args.slice(1)];
  }
  
  // Create and configure CLI
  const commander = createCommander();
  const cli = new CommanderCLI(commander);
  
  // Execute command
  const result = await cli.parseAndExecute(args);
  
  // Handle output
  if (options.output && result) {
    const fs = require('fs');
    const outputData = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    fs.writeFileSync(options.output, outputData);
    console.log(`Output written to ${options.output}`);
  }
  
  return result;
}