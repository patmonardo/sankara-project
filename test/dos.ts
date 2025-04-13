
import { createInterface } from 'readline';

/**
 * █▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
 * █  BRAHMAVIDYĀ-DOS v1.0                                               █
 * █  (C) 2025 Transcendental Computing Systems                          █
 * █  640K of consciousness should be enough for anybody                 █
 * █▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
 */

// Create the global context - the Ātman of our system
const globalContext = createBrahmavidyāContext({
  id: 'global',
  name: 'Global Brahmavidyā DOS Context',
  autoActivate: true
});

// Setup readline interface - our terminal communication channel
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes - the subtle body of our presentation
const COLORS = {
  RESET: "\x1b[0m",
  BRIGHT: "\x1b[1m",
  DIM: "\x1b[2m",
  UNDERSCORE: "\x1b[4m",
  BLINK: "\x1b[5m",
  REVERSE: "\x1b[7m",
  HIDDEN: "\x1b[8m",
  
  FG_BLACK: "\x1b[30m",
  FG_RED: "\x1b[31m",
  FG_GREEN: "\x1b[32m",
  FG_YELLOW: "\x1b[33m",
  FG_BLUE: "\x1b[34m",
  FG_MAGENTA: "\x1b[35m",
  FG_CYAN: "\x1b[36m",
  FG_WHITE: "\x1b[37m",
  
  BG_BLACK: "\x1b[40m",
  BG_RED: "\x1b[41m",
  BG_GREEN: "\x1b[42m",
  BG_YELLOW: "\x1b[43m",
  BG_BLUE: "\x1b[44m",
  BG_MAGENTA: "\x1b[45m",
  BG_CYAN: "\x1b[46m",
  BG_WHITE: "\x1b[47m"
};

/**
 * Clear the terminal screen - wipe the empirical manifold
 */
function clearScreen(): void {
  console.clear();
}

/**
 * Display the Brahmavidyā-DOS header - manifest the transcendental unity
 */
function displayHeader(): void {
  console.log(`${COLORS.BG_BLUE}${COLORS.FG_WHITE}${COLORS.BRIGHT}`);
  console.log(`▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄`);
  console.log(`█                    BRAHMAVIDYĀ-DOS v1.0                        █`);
  console.log(`█            TRANSCENDENTAL COMMAND LINE INTERFACE               █`);
  console.log(`█           (C) 2025 Pure Consciousness Systems                  █`);
  console.log(`▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀`);
  console.log(`${COLORS.RESET}`);
}

/**
 * Display current state - reflect the categories of understanding
 */
function displayState(): void {
  const { moment, category, aspect, mode } = globalContext.metadata;
  
  console.log(`${COLORS.FG_CYAN}┌───────────────────────────────────────────────┐${COLORS.RESET}`);
  console.log(`${COLORS.FG_CYAN}│${COLORS.FG_WHITE} CURRENT STATE:                               ${COLORS.FG_CYAN}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_CYAN}├───────────────────────────────────────────────┤${COLORS.RESET}`);
  console.log(`${COLORS.FG_CYAN}│${COLORS.FG_YELLOW} Moment:   ${COLORS.FG_WHITE}${moment.padEnd(25)}         ${COLORS.FG_CYAN}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_CYAN}│${COLORS.FG_YELLOW} Category: ${COLORS.FG_WHITE}${category.padEnd(25)}         ${COLORS.FG_CYAN}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_CYAN}│${COLORS.FG_YELLOW} Aspect:   ${COLORS.FG_WHITE}${aspect.padEnd(25)}         ${COLORS.FG_CYAN}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_CYAN}│${COLORS.FG_YELLOW} Mode:     ${COLORS.FG_WHITE}${mode.padEnd(25)}         ${COLORS.FG_CYAN}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_CYAN}└───────────────────────────────────────────────┘${COLORS.RESET}`);
  console.log();
}

/**
 * Display help menu - catalog the synthetic a priori
 */
function displayHelp(): void {
  console.log(`${COLORS.FG_GREEN}┌───────────────────────────────────────────────┐${COLORS.RESET}`);
  console.log(`${COLORS.FG_GREEN}│${COLORS.FG_WHITE} BRAHMAVIDYĀ-DOS COMMANDS:                   ${COLORS.FG_GREEN}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_GREEN}├───────────────────────────────────────────────┤${COLORS.RESET}`);
  console.log(`${COLORS.FG_GREEN}│${COLORS.FG_WHITE} HELP      - Display this help screen        ${COLORS.FG_GREEN}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_GREEN}│${COLORS.FG_WHITE} CLS       - Clear the screen                ${COLORS.FG_GREEN}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_GREEN}│${COLORS.FG_WHITE} STATE     - Show current dialectical state  ${COLORS.FG_GREEN}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_GREEN}│${COLORS.FG_WHITE} ADVANCE   - Advance the dialectic           ${COLORS.FG_GREEN}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_GREEN}│${COLORS.FG_WHITE} LIST OPS  - List all operations             ${COLORS.FG_GREEN}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_GREEN}│${COLORS.FG_WHITE} SET MOM   - Set moment                      ${COLORS.FG_GREEN}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_GREEN}│${COLORS.FG_WHITE} SET CAT   - Set category                    ${COLORS.FG_GREEN}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_GREEN}│${COLORS.FG_WHITE} SET ASP   - Set aspect                      ${COLORS.FG_GREEN}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_GREEN}│${COLORS.FG_WHITE} SET MODE  - Set mode                        ${COLORS.FG_GREEN}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_GREEN}│${COLORS.FG_WHITE} EXEC op   - Execute operation [op]          ${COLORS.FG_GREEN}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_GREEN}│${COLORS.FG_WHITE} EXIT      - Exit to higher consciousness    ${COLORS.FG_GREEN}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_GREEN}└───────────────────────────────────────────────┘${COLORS.RESET}`);
  console.log();
}

/**
 * List all operations - enumerate the categories of judgment
 */
function listOperations(): void {
  console.log(`${COLORS.FG_MAGENTA}┌───────────────────────────────────────────────┐${COLORS.RESET}`);
  console.log(`${COLORS.FG_MAGENTA}│${COLORS.FG_WHITE} AVAILABLE OPERATIONS:                      ${COLORS.FG_MAGENTA}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_MAGENTA}├───────────────────────────────────────────────┤${COLORS.RESET}`);
  
  let count = 0;
  const operations = Object.keys(operationTaxonomy);
  
  for (const op of operations) {
    count++;
    const taxonomy = operationTaxonomy[op as Operation];
    console.log(`${COLORS.FG_MAGENTA}│${COLORS.FG_YELLOW} ${op.padEnd(12)}${COLORS.FG_WHITE} - ${taxonomy.genera.padEnd(22)} ${COLORS.FG_MAGENTA}│${COLORS.RESET}`);
    
    if (count % 15 === 0 && count < operations.length) {
      console.log(`${COLORS.FG_MAGENTA}├───────────────────────────────────────────────┤${COLORS.RESET}`);
      console.log(`${COLORS.FG_MAGENTA}│${COLORS.FG_WHITE} Press any key to continue...                  ${COLORS.FG_MAGENTA}│${COLORS.RESET}`);
      console.log(`${COLORS.FG_MAGENTA}└───────────────────────────────────────────────┘${COLORS.RESET}`);
      
      // In a real implementation, we'd wait for a keypress
      console.log();
      
      console.log(`${COLORS.FG_MAGENTA}┌───────────────────────────────────────────────┐${COLORS.RESET}`);
      console.log(`${COLORS.FG_MAGENTA}│${COLORS.FG_WHITE} AVAILABLE OPERATIONS (continued):            ${COLORS.FG_MAGENTA}│${COLORS.RESET}`);
      console.log(`${COLORS.FG_MAGENTA}├───────────────────────────────────────────────┤${COLORS.RESET}`);
    }
  }
  
  console.log(`${COLORS.FG_MAGENTA}└───────────────────────────────────────────────┘${COLORS.RESET}`);
  console.log();
}

/**
 * Execute an operation - perform the transcendental synthesis
 */
async function executeOperation(operation: string, input: string = ""): Promise<void> {
  if (!Object.keys(operationTaxonomy).includes(operation as any)) {
    console.log(`${COLORS.FG_RED}ERROR: Unknown operation '${operation}'${COLORS.RESET}`);
    return;
  }
  
  // If no input was provided, prompt for it
  if (!input) {
    input = await new Promise((resolve) => {
      rl.question(`${COLORS.FG_YELLOW}Enter input for ${operation}:${COLORS.RESET} `, (answer) => {
        resolve(answer);
      });
    });
  }
  
  console.log(`${COLORS.FG_BLUE}Executing operation: ${operation}...${COLORS.RESET}`);
  
  const result = globalContext.execute(operation as Operation, () => {
    // Implementation of each operation would go here
    switch (operation) {
      case 'sthāpana':
        return { posited: input };
      case 'lakṣaṇa':
        return { determined: input, qualities: input.split(' ') };
      case 'abhijñāna':
        return { identified: input, identity: input.toUpperCase() };
      case 'gaṇana':
        try {
          return { calculated: eval(input) };
        } catch {
          return { error: 'Invalid expression' };
        }
      case 'māpana':
        return { measured: input, length: input.length };
      case 'anumiti':
        const parts = input.split(',');
        return {
          major: parts[0] || '',
          minor: parts[1] || '',
          conclusion: parts[2] || 'Therefore...'
        };
      case 'brahmajñāna':
        return {
          absolute: true,
          original: input,
          transcended: `Brahman contains: ${input}`
        };
      default:
        return { 
          input,
          operation,
          timestamp: new Date().toISOString() 
        };
    }
  });
  
  // Display the result in DOS-style box
  console.log(`${COLORS.FG_WHITE}┌───────────────────────────────────────────────┐${COLORS.RESET}`);
  console.log(`${COLORS.FG_WHITE}│${COLORS.FG_GREEN} OPERATION RESULT:                           ${COLORS.FG_WHITE}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_WHITE}├───────────────────────────────────────────────┤${COLORS.RESET}`);
  console.log(`${COLORS.FG_WHITE}│${COLORS.FG_YELLOW} Operation: ${COLORS.FG_CYAN}${result.operation.padEnd(30)}   ${COLORS.FG_WHITE}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_WHITE}│${COLORS.FG_YELLOW} Genera:    ${COLORS.FG_CYAN}${result.genera.padEnd(30)}   ${COLORS.FG_WHITE}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_WHITE}│${COLORS.FG_YELLOW} Mode:      ${COLORS.FG_CYAN}${result.mode.padEnd(30)}   ${COLORS.FG_WHITE}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_WHITE}│${COLORS.FG_YELLOW} Success:   ${COLORS.FG_CYAN}${result.success ? 'Yes' : 'No'}${' '.repeat(30)}   ${COLORS.FG_WHITE}│${COLORS.RESET}`);
  console.log(`${COLORS.FG_WHITE}├───────────────────────────────────────────────┤${COLORS.RESET}`);
  console.log(`${COLORS.FG_WHITE}│${COLORS.FG_GREEN} Value:                                      ${COLORS.FG_WHITE}│${COLORS.RESET}`);
  
  // Format the result value
  const resultStr = JSON.stringify(result.value, null, 2);
  const lines = resultStr.split('\n');
  for (const line of lines) {
    if (line.length > 45) {
      // Split long lines
      for (let i = 0; i < line.length; i += 45) {
        console.log(`${COLORS.FG_WHITE}│${COLORS.FG_CYAN} ${line.substring(i, i + 45).padEnd(45)} ${COLORS.FG_WHITE}│${COLORS.RESET}`);
      }
    } else {
      console.log(`${COLORS.FG_WHITE}│${COLORS.FG_CYAN} ${line.padEnd(45)} ${COLORS.FG_WHITE}│${COLORS.RESET}`);
    }
  }
  
  if (result.error) {
    console.log(`${COLORS.FG_WHITE}├───────────────────────────────────────────────┤${COLORS.RESET}`);
    console.log(`${COLORS.FG_WHITE}│${COLORS.FG_RED} ERROR: ${result.error.message.padEnd(37)} ${COLORS.FG_WHITE}│${COLORS.RESET}`);
  }
  
  console.log(`${COLORS.FG_WHITE}└───────────────────────────────────────────────┘${COLORS.RESET}`);
  console.log();
}

/**
 * Set a context parameter - modify the transcendental conditions
 */
async function setParameter(param: string): Promise<void> {
  let prompt = '';
  let options: string[] = [];
  let setter: (value: any) => void = () => {};
  
  switch (param.toUpperCase()) {
    case 'MOM':
    case 'MOMENT':
      prompt = 'Enter moment (svarūpa, vimarśa, pūrṇatva): ';
      options = ['svarūpa', 'vimarśa', 'pūrṇatva'];
      setter = (value) => globalContext.setState({ moment: value });
      break;
      
    case 'CAT':
    case 'CATEGORY':
      prompt = 'Enter category (sat, prakāśa, ānanda): ';
      options = ['sat', 'prakāśa', 'ānanda'];
      setter = (value) => globalContext.setState({ category: value });
      break;
      
    case 'ASP':
    case 'ASPECT':
      prompt = 'Enter aspect (sākṣāt, vyavahāra, samādhi): ';
      options = ['sākṣāt', 'vyavahāra', 'samādhi'];
      setter = (value) => globalContext.setState({ aspect: value });
      break;
      
    case 'MODE':
      prompt = 'Enter mode (pratyakṣa, anumāna, śabda): ';
      options = ['pratyakṣa', 'anumāna', 'śabda'];
      setter = (value) => globalContext.setState({ mode: value });
      break;
      
    default:
      console.log(`${COLORS.FG_RED}ERROR: Unknown parameter '${param}'${COLORS.RESET}`);
      return;
  }
  
  // Display options
  console.log(`${COLORS.FG_CYAN}Available options:${COLORS.RESET}`);
  for (const option of options) {
    console.log(`  ${COLORS.FG_YELLOW}${option}${COLORS.RESET}`);
  }
  
  // Get user input
  const value = await new Promise<string>((resolve) => {
    rl.question(`${COLORS.FG_GREEN}${prompt}${COLORS.RESET}`, (answer) => {
      resolve(answer);
    });
  });
  
  if (options.includes(value)) {
    setter(value);
    console.log(`${COLORS.FG_GREEN}Parameter set successfully.${COLORS.RESET}`);
    displayState();
  } else {
    console.log(`${COLORS.FG_RED}ERROR: Invalid value. Must be one of: ${options.join(', ')}${COLORS.RESET}`);
  }
}

/**
 * Main command loop - the eternal return of the same
 */
async function mainLoop(): Promise<void> {
  let running = true;
  
  clearScreen();
  displayHeader();
  displayState();
  
  console.log(`${COLORS.FG_GREEN}Type HELP for commands${COLORS.RESET}`);
  
  while (running) {
    const command = await new Promise<string>((resolve) => {
      rl.question(`${COLORS.BG_BLUE}${COLORS.FG_WHITE}Brahmavidyā>${COLORS.RESET} `, (answer) => {
        resolve(answer.trim());
      });
    });
    
    const parts = command.split(' ');
    const cmd = parts[0].toUpperCase();
    const args = parts.slice(1);
    
    switch (cmd) {
      case 'HELP':
        displayHelp();
        break;
        
      case 'CLS':
        clearScreen();
        displayHeader();
        break;
        
      case 'STATE':
        displayState();
        break;
        
      case 'ADVANCE':
        globalContext.advance();
        console.log(`${COLORS.FG_GREEN}Dialectic advanced.${COLORS.RESET}`);
        displayState();
        break;
        
      case 'LIST':
        if (args[0]?.toUpperCase() === 'OPS') {
          listOperations();
        } else {
          console.log(`${COLORS.FG_RED}ERROR: Unknown list command. Try LIST OPS${COLORS.RESET}`);
        }
        break;
        
      case 'SET':
        if (args.length > 0) {
          await setParameter(args[0]);
        } else {
          console.log(`${COLORS.FG_RED}ERROR: SET requires a parameter (MOM, CAT, ASP, MODE)${COLORS.RESET}`);
        }
        break;
        
      case 'EXEC':
        if (args.length > 0) {
          const operation = args[0];
          const input = args.slice(1).join(' ');
          await executeOperation(operation, input);
        } else {
          console.log(`${COLORS.FG_RED}ERROR: EXEC requires an operation parameter${COLORS.RESET}`);
        }
        break;
        
      case 'EXIT':
        console.log(`${COLORS.FG_CYAN}Exiting to higher consciousness...${COLORS.RESET}`);
        running = false;
        break;
        
      case '':
        // Do nothing for empty command
        break;
        
      default:
        console.log(`${COLORS.FG_RED}ERROR: Unknown command '${cmd}'${COLORS.RESET}`);
        console.log(`${COLORS.FG_GREEN}Type HELP for available commands${COLORS.RESET}`);
    }
  }
  
  rl.close();
  console.log(`${COLORS.FG_MAGENTA}Brahmavidyā-DOS terminated.${COLORS.RESET}`);
}

/**
 * Boot sequence - the coming-into-being of the system
 */
async function bootSequence(): Promise<void> {
  clearScreen();
  
  console.log(`${COLORS.FG_CYAN}Initializing Brahmavidyā-DOS...${COLORS.RESET}`);
  
  // Simulate DOS-style boot sequence
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`${COLORS.FG_WHITE}Loading transcendental framework...${COLORS.RESET}`);
  await new Promise(resolve => setTimeout(resolve, 700));
  console.log(`${COLORS.FG_WHITE}Initializing dialectical structures...${COLORS.RESET}`);
  await new Promise(resolve => setTimeout(resolve, 600));
  console.log(`${COLORS.FG_WHITE}Setting up categories of understanding...${COLORS.RESET}`);
  await new Promise(resolve => setTimeout(resolve, 800));
  console.log(`${COLORS.FG_WHITE}Establishing synthetic unity of apperception...${COLORS.RESET}`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log(`${COLORS.FG_GREEN}Boot complete.${COLORS.RESET}`);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Start main command loop
  await mainLoop();
}

// Start the Brahmavidyā-DOS system
bootSequence().catch(error => {
  console.error(`${COLORS.BG_RED}${COLORS.FG_WHITE}FATAL ERROR: ${error.message}${COLORS.RESET}`);
  rl.close();
});

/**
 * Execute directly from command line
 */
export function runBrahmavidyāDOS(): void {
  bootSequence().catch(error => {
    console.error(`FATAL ERROR: ${error.message}`);
    process.exit(1);
  });
}

// If called directly
if (require.main === module) {
  runBrahmavidyāDOS();
}