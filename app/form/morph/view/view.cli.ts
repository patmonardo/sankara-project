import { Command } from 'commander';
import chalk from 'chalk';
import { handleViewMode, handleViewForm } from './view.cmd';

/**
 * Register view mode commands
 */
export function registerViewCommands(program: Command) {
  // Main view mode command
  const viewCommand = program
    .command('view')
    .description('Form view mode operations');
    
  // View mode with interactive shell
  viewCommand
    .command('mode')
    .description('Enter interactive view mode shell')
    .option('-f, --file <path>', 'Form schema file path')
    .option('-d, --data <path>', 'Data file path')
    .option('-o, --output <path>', 'Output file path')
    .option('--pretty', 'Pretty print output')
    .action(async (options) => {
      await handleViewMode(options);
    });
    
  // Generate a view form from schema
  viewCommand
    .command('form')
    .description('Generate a view form from schema and data')
    .requiredOption('-f, --file <path>', 'Form schema file path')
    .requiredOption('-d, --data <path>', 'Data file path')
    .option('-o, --output <path>', 'Output file path')
    .option('--pretty', 'Pretty print output')
    .option('--no-actions', 'Disable actions generation')
    .option('--no-format', 'Disable value formatting')
    .option('--no-validate', 'Disable data validation')
    .action(async (options) => {
      await handleViewForm(options);
    });
    
  return viewCommand;
}