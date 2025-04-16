import { Form } from '../form';
import { Context } from '../context/context';
import { TransformationEngine } from '../morph/transformation';
import { RelationEngine } from '../relation/relation'; // Renamed from IntelligenceEngine
import { OrchestrationEngine } from '../orchestration/coordination';

/**
 * TrikaForm - Command-oriented intelligent form
 * 
 * A highly opinionated extension of Form designed specifically for
 * command-line scripting, automation, and programmatic interaction.
 * Integrates the trinity capabilities (transform, relate, orchestrate)
 * with comprehensive command history and scripting support.
 */
export class TrikaForm extends Form {
  // The trinity engines - explicitly focused on command processing
  protected transformation: TransformationEngine;
  protected relation: RelationEngine; // Renamed from intelligence
  protected orchestration: OrchestrationEngine;
  
  // Command state tracking
  protected activeMode: 'transform' | 'relate' | 'orchestrate' = 'transform'; // Updated
  protected commandHistory: Array<{
    timestamp: number;
    mode: string;
    command: string;
    args: string[];
    result?: any;
    error?: string;
    duration?: number;
  }> = [];
  
  // Script management
  protected scripts: Map<string, Array<string>> = new Map();
  protected currentScript?: {name: string, commands: string[], index: number};
  
  // Command documentation
  protected commandDocs: Map<string, {
    description: string,
    usage: string,
    examples: string[],
    aliases?: string[]
  }> = new Map();
  
  /**
   * Create a new command-oriented TrikaForm
   */
  constructor(formDefinition: any) {
    super(formDefinition);
    
    // Initialize the trinity engines
    this.initializeEngines();
    
    // Extend form with command capabilities
    this.extendFormDefinition();
    
    // Initialize command documentation
    this.initializeCommandDocs();
  }
  
  /**
   * Initialize the trinity engines
   */
  protected initializeEngines(): void {
    // Create engines with this form's context
    this.transformation = new TransformationEngine(this.context);
    this.relation = new RelationEngine(this.context); // Updated
    this.orchestration = new OrchestrationEngine(
      this.context, 
      this.transformation,
      this.relation // Updated
    );
  }
  
  /**
   * Extend form definition with command-specific fields
   */
  protected extendFormDefinition(): void {
    // Add fields for command functionality
    if (!this.vyākhyā.fields) {
      this.vyākhyā.fields = [];
    }
    
    // Command history field
    if (!this.vyākhyā.fields.find(f => f.name === 'commandHistory')) {
      this.vyākhyā.fields.push({
        name: 'commandHistory',
        type: 'array',
        defaultValue: []
      });
    }
    
    // Active mode field
    if (!this.vyākhyā.fields.find(f => f.name === 'activeMode')) {
      this.vyākhyā.fields.push({
        name: 'activeMode',
        type: 'string',
        defaultValue: 'transform'
      });
    }
    
    // Scripts storage field
    if (!this.vyākhyā.fields.find(f => f.name === 'scripts')) {
      this.vyākhyā.fields.push({
        name: 'scripts',
        type: 'object',
        defaultValue: {}
      });
    }
    
    // Command metadata
    if (!this.vyākhyā.metadata) {
      this.vyākhyā.metadata = {};
    }
    
    this.vyākhyā.metadata.isCommandEnvironment = true;
    this.vyākhyā.metadata.trikaVersion = '1.0';
    this.vyākhyā.metadata.commandModes = ['transform', 'relate', 'orchestrate']; // Updated
  }
  
  /**
   * Initialize command documentation
   */
  protected initializeCommandDocs(): void {
    // Transform commands
    this.commandDocs.set('transform', {
      description: 'Transform this form or its data to another format',
      usage: 'transform <outputType> [options]',
      examples: [
        'transform json',
        'transform xml',
        'transform yaml {"pretty": true}'
      ]
    });
    
    this.commandDocs.set('pipeline', {
      description: 'Create a transformation pipeline',
      usage: 'pipeline <name> <step1> <step2> ...',
      examples: [
        'pipeline exportProcess validate transform export'
      ]
    });
    
    // Relate commands (formerly analyze)
    this.commandDocs.set('relate', {
      description: 'Establish and explore relations between this form and others',
      usage: 'relate <relationType> [options]',
      examples: [
        'relate structure',
        'relate dependencies',
        'relate context {"deep": true}'
      ]
    });
    
    // Adding more relation-specific commands
    this.commandDocs.set('connect', {
      description: 'Connect this form to another through a specified relation',
      usage: 'connect <targetFormId> <relationType> [metadata]',
      examples: [
        'connect customer-123 contains',
        'connect invoice-456 references {"bidirectional": true}'
      ]
    });
    
    this.commandDocs.set('properties', {
      description: 'Examine or define properties that mediate between this form and others',
      usage: 'properties (list|add|remove|update) [name] [value]',
      examples: [
        'properties list',
        'properties add totalValue "sum(items.price)"',
        'properties update status "resolved"'
      ]
    });
    
    // Orchestrate commands
    this.commandDocs.set('orchestrate', {
      description: 'Orchestrate this form with others',
      usage: 'orchestrate <action> [target1] [target2] ...',
      examples: [
        'orchestrate connect form1 form2',
        'orchestrate trigger workflow1'
      ]
    });
    
    // Script commands
    this.commandDocs.set('script', {
      description: 'Create, list, or run a script of commands',
      usage: 'script (create|list|run|delete) [scriptName] [commands...]',
      examples: [
        'script create myScript "transform json" "relate structure"', // Updated
        'script run myScript',
        'script list'
      ]
    });
  }
  
  /* COMMAND EXECUTION */
  
  /**
   * Execute a command string
   * 
   * This is the main entry point for script-like interaction with the form
   */
  async executeCommand(commandLine: string): Promise<any> {
    const [command, ...args] = commandLine.trim().split(' ');
    
    // Record command in history before execution
    this.recordCommand(command, args);
    
    try {
      let result;
      const startTime = Date.now();
      
      // Execute based on mode
      switch (this.activeMode) {
        case 'transform':
          result = await this.executeTransformCommand(command, args);
          break;
          
        case 'relate': // Updated from 'analyze'
          result = await this.executeRelateCommand(command, args); // Updated method name
          break;
          
        case 'orchestrate':
          result = await this.executeOrchestrateCommand(command, args);
          break;
      }
      
      // Calculate duration
      const duration = Date.now() - startTime;
      
      // Record successful result
      this.recordCommandSuccess(result, duration);
      
      return result;
      
    } catch (error) {
      // Record error
      this.recordCommandError(error.message);
      throw error;
    }
  }
  
  /**
   * Execute a transform command
   */
  protected async executeTransformCommand(command: string, args: string[]): Promise<any> {
    // Implementation remains largely the same
    switch (command) {
      case 'transform':
        if (args.length < 1) {
          throw new Error('Missing output type. Usage: transform <outputType> [options]');
        }
        
        const outputType = args[0];
        const options = args.length > 1 ? JSON.parse(args[1]) : undefined;
        
        return this.transform(outputType, options);
        
      case 'pipeline':
        if (args.length < 2) {
          throw new Error('Missing pipeline name or steps. Usage: pipeline <name> <step1> <step2> ...');
        }
        
        const [name, ...steps] = args;
        return this.createPipeline(name, steps);
        
      case 'execute':
      case 'run-pipeline':
        if (args.length < 1) {
          throw new Error('Missing pipeline name. Usage: execute <pipelineName> [input]');
        }
        
        const pipelineName = args[0];
        const input = args.length > 1 ? JSON.parse(args[1]) : undefined;
        
        return this.executePipeline(pipelineName, input);
        
      case 'help':
        if (args.length > 0) {
          return this.getCommandHelp(args[0]);
        }
        return this.getTransformCommandList();
        
      default:
        throw new Error(`Unknown transform command: ${command}`);
    }
  }
  
  /**
   * Execute a relate command (formerly analyzeCommand)
   */
  protected async executeRelateCommand(command: string, args: string[]): Promise<any> {
    switch (command) {
      case 'relate':
        if (args.length < 1) {
          throw new Error('Missing relation type. Usage: relate <type> [options]');
        }
        
        const relationType = args[0];
        const options = args.length > 1 ? JSON.parse(args[1]) : undefined;
        
        return this.relate(relationType, options);
        
      case 'connect':
        if (args.length < 2) {
          throw new Error('Missing target or relation type. Usage: connect <targetFormId> <relationType> [metadata]');
        }
        
        const targetId = args[0];
        const connectionType = args[1];
        const metadata = args.length > 2 ? JSON.parse(args[2]) : undefined;
        
        return this.connectTo(targetId, connectionType, metadata);
        
      case 'properties':
        if (args.length < 1) {
          throw new Error('Missing property action. Usage: properties (list|add|remove|update) [name] [value]');
        }
        
        const action = args[0];
        
        switch (action) {
          case 'list':
            return this.listProperties();
            
          case 'add':
            if (args.length < 3) {
              throw new Error('Missing property name or value. Usage: properties add <name> <value>');
            }
            return this.addProperty(args[1], args[2]);
            
          case 'remove':
            if (args.length < 2) {
              throw new Error('Missing property name. Usage: properties remove <name>');
            }
            return this.removeProperty(args[1]);
            
          case 'update':
            if (args.length < 3) {
              throw new Error('Missing property name or value. Usage: properties update <name> <value>');
            }
            return this.updateProperty(args[1], args[2]);
            
          default:
            throw new Error(`Unknown property action: ${action}`);
        }
        
      case 'validate':
        const rules = args.length > 0 ? JSON.parse(args[0]) : undefined;
        return this.validate(rules);
        
      case 'help':
        if (args.length > 0) {
          return this.getCommandHelp(args[0]);
        }
        return this.getRelateCommandList(); // Updated from getAnalyzeCommandList
        
      default:
        throw new Error(`Unknown relate command: ${command}`);
    }
  }
  
  /**
   * Execute an orchestrate command
   */
  protected async executeOrchestrateCommand(command: string, args: string[]): Promise<any> {
    // Implementation remains largely the same
    switch (command) {
      case 'orchestrate':
        if (args.length < 1) {
          throw new Error('Missing action. Usage: orchestrate <action> [targets...]');
        }
        
        const [action, ...targets] = args;
        return this.orchestrate(action, targets);
        
      case 'workflow':
      case 'create-workflow':
        if (args.length < 2) {
          throw new Error('Missing workflow name or steps. Usage: workflow <name> <step1> <step2> ...');
        }
        
        const [name, ...steps] = args;
        return this.createWorkflow(name, steps);
        
      case 'execute':
      case 'run-workflow':
        if (args.length < 1) {
          throw new Error('Missing workflow name. Usage: execute <workflowName> [input]');
        }
        
        const workflowName = args[0];
        const input = args.length > 1 ? JSON.parse(args[1]) : undefined;
        
        return this.executeWorkflow(workflowName, input);
        
      case 'help':
        if (args.length > 0) {
          return this.getCommandHelp(args[0]);
        }
        return this.getOrchestrateCommandList();
        
      default:
        throw new Error(`Unknown orchestrate command: ${command}`);
    }
  }
  
  /* NEW RELATION METHODS */
  
  /**
   * Relate this form to others or explore its relations
   * 
   * This replaces the former 'analyze' method with a more
   * essence-logical approach focused on relations and properties
   */
  async relate(relationType: string, options?: any): Promise<any> {
    return this.relation.createRelation(this.id, relationType, options);
  }
  
  /**
   * Connect this form to another through a specified relation
   */
  async connectTo(targetId: string, relationType: string, metadata?: any): Promise<any> {
    return this.relation.connect(this.id, targetId, relationType, metadata);
  }
  
  /**
   * List all properties of this form
   */
  async listProperties(): Promise<any> {
    return this.relation.getProperties(this.id);
  }
  
  /**
   * Add a property to this form
   */
  async addProperty(name: string, value: any): Promise<any> {
    return this.relation.addProperty(this.id, name, value);
  }
  
  /**
   * Remove a property from this form
   */
  async removeProperty(name: string): Promise<any> {
    return this.relation.removeProperty(this.id, name);
  }
  
  /**
   * Update a property of this form
   */
  async updateProperty(name: string, value: any): Promise<any> {
    return this.relation.updateProperty(this.id, name, value);
  }
  
  /**
   * Get list of relate commands
   */
  getRelateCommandList(): any {
    const commands = [];
    
    for (const [cmd, doc] of this.commandDocs.entries()) {
      if (['relate', 'connect', 'properties', 'validate'].includes(cmd)) {
        commands.push({
          name: cmd,
          description: doc.description
        });
      }
    }
    
    return {
      mode: 'relate',
      commands
    };
  }
}