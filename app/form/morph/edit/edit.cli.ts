import { Command } from 'commander';
import chalk from 'chalk';
import { handleEditMode, handleEditForm } from './edit.cmd';

/**
 * Register edit mode commands
 */
export function registerEditCommands(program: Command) {
  // Main edit mode command
  const editCommand = program
    .command('edit')
    .description('Form edit mode operations');
    
  // Edit mode with interactive shell
  editCommand
    .command('mode')
    .description('Enter interactive edit mode shell')
    .option('-f, --file <path>', 'Form schema file path')
    .option('-d, --data <path>', 'Initial data file path')
    .option('-o, --output <path>', 'Output file path')
    .action(async (options) => {
      await handleEditMode(options);
    });
    
  // Generate an edit form from schema
  editCommand
    .command('form')
    .description('Generate an edit form from schema')
    .requiredOption('-f, --file <path>', 'Form schema file path')
    .option('-d, --data <path>', 'Initial data file path')
    .option('-o, --output <path>', 'Output file path')
    .option('--pretty', 'Pretty print output')
    .action(async (options) => {
      await handleEditForm(options);
    });
}