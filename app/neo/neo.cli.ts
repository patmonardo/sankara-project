#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { version } from '../../package.json';

// Import command modules
import * as modal from '../form/modality/cli-module';
import * as graph from '../form/morph/graph/cli-module';
import * as cypher from '../form/morph/cypher/cli-module';
import * as trika from '../neo/trika/cli-module';

/**
 * Neo - Central developer shell for all Sankara modules
 */
async function main() {
  // Display branding
  console.log(
    chalk.cyan(
      figlet.textSync('NEO', { font: 'ANSI Shadow' })
    )
  );
  console.log(chalk.cyan('Developer Command Hub - v' + version));
  console.log();

  // Setup main program
  program
    .name('neo')
    .description('Unified developer shell for Sankara modules')
    .version(version);

  // Register modal commands
  program
    .command('mod')
    .alias('modal')
    .alias('modality')
    .description('Form modality system for transformations')
    .argument('[command]', 'Command to execute')
    .option('-f, --file <path>', 'Form file path')
    .option('-o, --output <path>', 'Output file path')
    .option('--json', 'Output as JSON')
    .allowUnknownOption() // Pass through other options to modal
    .action(async (cmd, options, command) => {
      // Extract additional args to pass to modal
      const additionalArgs = command.args.slice(1);
      const passOptions = command.parseOptions(command.parent.args.slice(2)).unknown;
      
      // Execute modal with the command and options
      await modal.execute([cmd, ...additionalArgs, ...passOptions], {
        file: options.file,
        output: options.output,
        json: options.json,
      });
    });

  // Register graph commands directly at top level for convenience
  program
    .command('graph')
    .description('Generate a graph from a form')
    .argument('<file>', 'Form file path')
    .option('-o, --output <path>', 'Output file path')
    .option('-a, --analyze', 'Perform analysis')
    .option('-v, --visualize', 'Generate visualization')
    .action(async (file, options) => {
      await graph.execute(['create', file], options);
    });

  // Register cypher commands
  program
    .command('cypher')
    .description('Generate Cypher queries from a graph')
    .argument('<file>', 'Graph file path')
    .option('-o, --output <path>', 'Output file path')
    .option('-t, --type <type>', 'Query type (create, match, update, delete)')
    .action(async (file, options) => {
      await cypher.execute([options.type || 'create', file], options);
    });

  // Register trika commands
  program
    .command('trika')
    .description('Advanced shell system with transcendental capabilities')
    .argument('[command]', 'Trika command to execute')
    .allowUnknownOption() // Pass through options to trika
    .action(async (cmd, command) => {
      // Extract additional args to pass to trika
      const additionalArgs = command.args.slice(1);
      const passOptions = command.parseOptions(command.parent.args.slice(2)).unknown;
      
      await trika.execute([cmd, ...additionalArgs, ...passOptions]);
    });
  
  // Special command for launching interactive shell
  program
    .command('shell')
    .description('Launch interactive Neo shell')
    .action(async () => {
      await launchInteractiveShell();
    });

  // Parse arguments and execute
  await program.parseAsync();
}

/**
 * Launch an interactive shell
 */
async function launchInteractiveShell() {
  const readline = require('readline');
  const { execSync } = require('child_process');
  
  console.log(chalk.green('Launching Neo interactive shell...'));
  console.log(chalk.yellow('Type "exit" to quit, "help" for available commands'));
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan('neo> ')
  });
  
  rl.prompt();
  
  rl.on('line', async (line: string) => {
    const input = line.trim();
    
    if (input === 'exit' || input === 'quit') {
      rl.close();
      return;
    }
    
    if (input === '') {
      rl.prompt();
      return;
    }
    
    if (input === 'help') {
      execSync('neo --help', { stdio: 'inherit' });
      rl.prompt();
      return;
    }
    
    try {
      // Execute the command through the neo CLI
      execSync(`neo ${input}`, { stdio: 'inherit' });
    } catch (err) {
      // Command execution failed, but we continue the shell
    }
    
    rl.prompt();
  }).on('close', () => {
    console.log(chalk.green('Neo shell terminated.'));
    process.exit(0);
  });
}

// Execute the main function
main().catch((error) => {
  console.error(chalk.red('Error:'), error.message);
  process.exit(1);
});