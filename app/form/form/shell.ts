import { FormSystem } from './system';
import { FormContext } from '../context/context';
import { TrikaForm } from './trika';

/**
 * TrikaShell - Interactive command-line interface for TrikaForm
 * 
 * Provides a terminal-based shell environment for interacting with 
 * a TrikaForm instance. The shell is a thin wrapper that delegates
 * all actual command processing to the underlying TrikaForm.
 */
export class TrikaShell {
  private trikaForm: TrikaForm;
  
  // Shell-specific state
  private activeComponent: 'shell' | 'transform' | 'analyze' | 'orchestrate' = 'shell';
  private prompt: string = 'trika> ';
  private shellHistory: string[] = [];
  private lastExitCode: number = 0;
  
  constructor(trikaFormOrId: TrikaForm | string) {
    const formSystem = FormSystem.getInstance();
    
    // Initialize with existing form or create new one
    if (typeof trikaFormOrId === 'string') {
      const form = formSystem.getForm(trikaFormOrId);
      if (form instanceof TrikaForm) {
        this.trikaForm = form;
      } else {
        throw new Error(`Form ${trikaFormOrId} is not a TrikaForm`);
      }
    } else if (trikaFormOrId instanceof TrikaForm) {
      this.trikaForm = trikaFormOrId;
    } else {
      // Create a new TrikaForm if none provided
      this.trikaForm = new TrikaForm({
        id: `trika-${Date.now()}`,
        name: 'TrikaShell Form',
        type: 'trika-shell'
      });
    }
    
    // Set initial prompt based on form's mode
    this.updatePromptFromMode(this.trikaForm.getMode());
  }
  
  /**
   * Get the TrikaForm this shell is using
   */
  getForm(): TrikaForm {
    return this.trikaForm;
  }
  
  /**
   * Start the interactive shell
   */
  async start(): Promise<void> {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                        TRIKA SHELL                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('Command-line interface to TrikaForm command environment');
    console.log(`Form: ${this.trikaForm.vyākhyā.name} (${this.trikaForm.id})`);
    console.log('Type "help" for available commands.');
    
    // Loop forever until exit
    let running = true;
    
    while (running) {
      const line = await new Promise<string>(resolve => {
        rl.question(this.prompt, resolve);
      });
      
      // Handle shell exit
      if (line.trim() === 'exit') {
        running = false;
        continue;
      }
      
      // Add to shell history
      this.shellHistory.push(line);
      
      try {
        // Handle mode switching with @ prefix
        if (line.startsWith('@')) {
          const component = line.substring(1).trim();
          await this.switchMode(component);
        } 
        // Handle shell commands with ! prefix
        else if (line.startsWith('!')) {
          const shellCommand = line.substring(1).trim();
          await this.executeShellCommand(shellCommand);
        }
        // Execute form command
        else {
          const result = await this.trikaForm.executeCommand(line);
          console.log(JSON.stringify(result, null, 2));
          this.lastExitCode = 0;
        }
      } catch (error) {
        console.error(`Error: ${error.message}`);
        this.lastExitCode = 1;
      }
    }
    
    console.log('Exiting Trika Shell');
    rl.close();
  }
  
  /**
   * Switch the active mode
   */
  private async switchMode(mode: string): Promise<void> {
    switch (mode.toLowerCase()) {
      case 'transform':
        this.trikaForm.setMode('transform');
        this.updatePromptFromMode('transform');
        console.log('Switched to transform mode');
        break;
        
      case 'analyze':
        this.trikaForm.setMode('analyze');
        this.updatePromptFromMode('analyze');
        console.log('Switched to analyze mode');
        break;
        
      case 'orchestrate':
        this.trikaForm.setMode('orchestrate');
        this.updatePromptFromMode('orchestrate');
        console.log('Switched to orchestrate mode');
        break;
        
      case 'shell':
        // Just switch the prompt back to shell
        this.activeComponent = 'shell';
        this.prompt = 'trika> ';
        console.log('Switched to shell command mode');
        break;
        
      default:
        console.error(`Unknown mode: ${mode}`);
    }
  }
  
  /**
   * Update the prompt based on the active mode
   */
  private updatePromptFromMode(mode: string): void {
    switch (mode) {
      case 'transform':
        this.prompt = '\x1b[32mtransform>\x1b[0m ';
        this.activeComponent = 'transform';
        break;
        
      case 'analyze':
        this.prompt = '\x1b[34manalyze>\x1b[0m ';
        this.activeComponent = 'analyze';
        break;
        
      case 'orchestrate':
        this.prompt = '\x1b[35morchestrate>\x1b[0m ';
        this.activeComponent = 'orchestrate';
        break;
        
      default:
        this.prompt = 'trika> ';
        this.activeComponent = 'shell';
    }
  }
  
  /**
   * Execute a shell-specific command
   */
  private async executeShellCommand(command: string): Promise<void> {
    const [cmd, ...args] = command.trim().split(' ');
    
    switch (cmd) {
      case 'history':
        this.showHistory();
        break;
        
      case 'clear':
        console.clear();
        break;
        
      case 'status':
        this.showStatus();
        break;
        
      case 'info':
        const info = this.trikaForm.getEnvironmentInfo();
        console.log(JSON.stringify(info, null, 2));
        break;
        
      case 'run-script':
        if (args.length < 1) {
          console.error('Missing script name. Usage: !run-script <scriptName>');
          break;
        }
        
        try {
          const results = await this.trikaForm.runScript(args[0]);
          console.log(`Script ${args[0]} executed with ${results.length} commands`);
          console.log('Last result:');
          console.log(JSON.stringify(results[results.length - 1], null, 2));
        } catch (error) {
          console.error(`Script failed: ${error.message}`);
        }
        break;
        
      case 'help':
        this.showShellHelp();
        break;
        
      default:
        console.error(`Unknown shell command: ${cmd}`);
    }
  }
  
  /**
   * Show shell command history
   */
  private showHistory(): void {
    console.log('Command History:');
    
    this.shellHistory.forEach((cmd, i) => {
      console.log(`${i + 1}: ${cmd}`);
    });
  }
  
  /**
   * Show shell status
   */
  private showStatus(): void {
    console.log('Shell Status:');
    console.log(`Form: ${this.trikaForm.vyākhyā.name} (${this.trikaForm.id})`);
    console.log(`Mode: ${this.trikaForm.getMode()}`);
    console.log(`Last Exit Code: ${this.lastExitCode}`);
    console.log(`Command Count: ${this.trikaForm.getCommandHistory().length}`);
  }
  
  /**
   * Show shell help
   */
  private showShellHelp(): void {
    console.log('Shell Commands:');
    console.log('  !history       Show command history');
    console.log('  !clear         Clear the screen');
    console.log('  !status        Show shell status');
    console.log('  !info          Show form information');
    console.log('  !run-script    Run a saved script');
    console.log('  !help          Show this help');
    console.log('');
    console.log('Mode Switching:');
    console.log('  @transform     Switch to transform mode');
    console.log('  @analyze       Switch to analyze mode');
    console.log('  @orchestrate   Switch to orchestrate mode');
    console.log('  @shell         Switch to shell mode');
    console.log('');
    console.log('Other Commands:');
    console.log('  exit           Exit the shell');
    console.log('  help           Show form command help');
  }
}