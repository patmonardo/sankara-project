import readline from 'readline';
import chalk from 'chalk';
import { Command } from 'commander';
import { CypherPipeline } from '../../form/morph/cypher/pipeline';
import { FormShape } from '../../form/schema/form';
import { executeQuery, connectToNeo4j } from '../neo4j/client';

/**
 * Cypher Mode CLI - Interactive environment for working with Cypher
 */
export function registerCypherMode(program: Command) {
  program
    .command('cypher')
    .description('Enter interactive Cypher mode')
    .option('-c, --connect <url>', 'Connect to Neo4j database')
    .option('-f, --file <path>', 'Load graph from file')
    .action(async (options) => {
      await enterCypherMode(options);
    });
}

/**
 * Enter interactive Cypher mode
 */
async function enterCypherMode(options: any) {
  // Display welcome banner
  console.log(chalk.cyan('╔════════════════════════════════════════╗'));
  console.log(chalk.cyan('║           CYPHER MODE                  ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════╝'));
  console.log(chalk.yellow('Type "help" for available commands, "exit" to quit'));
  console.log();

  // Current active graph/form for generating queries
  let activeGraph: any = null;
  let dbConnection: any = null;

  // Connect to database if requested
  if (options.connect) {
    try {
      console.log(chalk.yellow(`Connecting to Neo4j at ${options.connect}...`));
      dbConnection = await connectToNeo4j(options.connect);
      console.log(chalk.green('Connected to Neo4j database'));
    } catch (error) {
      console.error(chalk.red(`Failed to connect to Neo4j: ${error.message}`));
    }
  }

  // Load form if file provided
  if (options.file) {
    try {
      const fs = require('fs');
      const formData = JSON.parse(fs.readFileSync(options.file, 'utf8'));
      activeGraph = formData;
      console.log(chalk.green(`Loaded form: ${formData.name || formData.id}`));
    } catch (error) {
      console.error(chalk.red(`Failed to load form: ${error.message}`));
    }
  }

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan('cypher> ')
  });

  // Process commands
  rl.prompt();
  rl.on('line', async (line) => {
    const input = line.trim();
    
    // Handle exit
    if (input === 'exit' || input === 'quit') {
      if (dbConnection) {
        await dbConnection.close();
      }
      rl.close();
      return;
    }

    // Handle empty line
    if (!input) {
      rl.prompt();
      return;
    }

    try {
      // Handle special commands
      if (input.startsWith('.') || input === 'help') {
        await handleSpecialCommand(input, { rl, activeGraph, dbConnection });
      } 
      // Process as Cypher query
      else {
        if (dbConnection) {
          // Execute against database
          const result = await executeQuery(dbConnection, input);
          displayResults(result);
        } else {
          // Process as query generation request
          await processQueryGeneration(input, activeGraph);
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }

    rl.prompt();
  }).on('close', () => {
    console.log(chalk.green('Exiting Cypher mode'));
    process.exit(0);
  });
}

/**
 * Handle special dot commands
 */
async function handleSpecialCommand(input: string, context: any) {
  const { rl, activeGraph, dbConnection } = context;
  
  // Remove leading dot if present
  const command = input.startsWith('.') ? input.substring(1) : input;
  
  switch (command) {
    case 'help':
      displayHelp();
      break;
      
    case 'load':
      rl.question(chalk.yellow('Enter path to form file: '), async (path) => {
        try {
          const fs = require('fs');
          const formData = JSON.parse(fs.readFileSync(path, 'utf8'));
          context.activeGraph = formData;
          console.log(chalk.green(`Loaded form: ${formData.name || formData.id}`));
          rl.prompt();
        } catch (error) {
          console.error(chalk.red(`Failed to load form: ${error.message}`));
          rl.prompt();
        }
      });
      break;
      
    case 'connect':
      rl.question(chalk.yellow('Enter Neo4j connection URL: '), async (url) => {
        try {
          console.log(chalk.yellow(`Connecting to Neo4j at ${url}...`));
          context.dbConnection = await connectToNeo4j(url);
          console.log(chalk.green('Connected to Neo4j database'));
          rl.prompt();
        } catch (error) {
          console.error(chalk.red(`Failed to connect to Neo4j: ${error.message}`));
          rl.prompt();
        }
      });
      break;
      
    case 'generate':
      if (activeGraph) {
        await generateQueriesFromForm(activeGraph);
      } else {
        console.log(chalk.yellow('No active form loaded. Use ".load" to load a form.'));
      }
      break;
      
    case 'info':
      displayInfo(activeGraph, dbConnection);
      break;
      
    default:
      console.log(chalk.yellow(`Unknown command: ${command}`));
      displayHelp();
  }
}

/**
 * Display available commands
 */
function displayHelp() {
  console.log(chalk.cyan('\nAvailable Commands:'));
  console.log(chalk.white('  help       - Show this help message'));
  console.log(chalk.white('  .load      - Load a form from file'));
  console.log(chalk.white('  .connect   - Connect to Neo4j database'));
  console.log(chalk.white('  .generate  - Generate queries from current form'));
  console.log(chalk.white('  .info      - Display information about current state'));
  console.log(chalk.white('  exit/quit  - Exit Cypher mode'));
  console.log(chalk.yellow('\nDirect Cypher:'));
  console.log(chalk.white('  Type any Cypher query to execute it (if connected)'));
  console.log(chalk.white('  Example: MATCH (n) RETURN n LIMIT 5'));
}

/**
 * Display information about current state
 */
function displayInfo(activeGraph: any, dbConnection: any) {
  console.log(chalk.cyan('\nCurrent State:'));
  
  if (activeGraph) {
    console.log(chalk.white(`Active Form: ${activeGraph.name || activeGraph.id}`));
    console.log(chalk.white(`  Fields: ${activeGraph.fields?.length || 0}`));
    console.log(chalk.white(`  Entities: ${activeGraph.entities?.length || 0}`));
    console.log(chalk.white(`  Relationships: ${activeGraph.relationships?.length || 0}`));
  } else {
    console.log(chalk.yellow('No active form loaded'));
  }
  
  if (dbConnection) {
    console.log(chalk.white(`Connected to database: ${dbConnection.url}`));
  } else {
    console.log(chalk.yellow('Not connected to database'));
  }
}

/**
 * Generate queries from current form
 */
async function generateQueriesFromForm(form: FormShape) {
  try {
    const pipeline = new CypherPipeline();
    const result = pipeline.generateCypher(form);
    
    console.log(chalk.green(`\nGenerated ${result.queries.length} queries:`));
    
    result.queries.forEach((query, index) => {
      console.log(chalk.cyan(`\n-- Query ${index + 1}: ${query.name} --`));
      console.log(chalk.white(query.cypher));
    });
  } catch (error) {
    console.error(chalk.red(`Error generating queries: ${error.message}`));
  }
}

/**
 * Process a query generation request
 */
async function processQueryGeneration(input: string, activeGraph: any) {
  if (!activeGraph) {
    console.log(chalk.yellow('No active form loaded. Use ".load" to load a form.'));
    return;
  }
  
  // Determine what type of query to generate
  const queryType = determineQueryType(input.toLowerCase());
  
  try {
    const pipeline = new CypherPipeline();
    const result = pipeline.generateCypherWithConfig(activeGraph, {
      queryTypes: [queryType],
      customCypher: input
    });
    
    if (result.queries && result.queries.length > 0) {
      const query = result.queries[result.queries.length - 1];
      console.log(chalk.cyan(`\n-- Generated ${queryType} query --`));
      console.log(chalk.white(query.cypher));
    } else {
      console.log(chalk.yellow('Could not generate a query for the given input'));
    }
  } catch (error) {
    console.error(chalk.red(`Error generating query: ${error.message}`));
  }
}

/**
 * Determine query type from input
 */
function determineQueryType(input: string): string {
  if (input.includes('create')) return 'CREATE';
  if (input.includes('match') || input.includes('find') || input.includes('get')) return 'MATCH';
  if (input.includes('update') || input.includes('set')) return 'UPDATE';
  if (input.includes('delete') || input.includes('remove')) return 'DELETE';
  if (input.includes('merge')) return 'MERGE';
  
  // Default to MATCH
  return 'MATCH';
}

/**
 * Display query execution results
 */
function displayResults(results: any) {
  if (!results || !results.records) {
    console.log(chalk.green('Query executed successfully. No results returned.'));
    return;
  }
  
  console.log(chalk.green(`\nResults (${results.records.length} records):`));
  
  // Display as table if possible
  if (results.records.length > 0) {
    const keys = results.records[0].keys;
    const rows = results.records.map((record: any) => {
      const row: any = {};
      keys.forEach((key: string) => {
        const value = record.get(key);
        row[key] = typeof value === 'object' ? JSON.stringify(value) : value;
      });
      return row;
    });
    
    console.table(rows);
  }
}