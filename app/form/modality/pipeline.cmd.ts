import { FormShape } from "../schema/form";
import { FormExecutionContext } from "../schema/context";
import { FormModalPipeline } from "./pipeline";

/**
 * Command interface for pipeline operations
 */
export interface PipelineCommand<TOutput> {
  readonly name: string;
  readonly description: string;
  execute(pipeline: FormModalPipeline<TOutput>, form: FormShape, options?: Record<string, any>): Promise<TOutput>;
}

/**
 * Basic generation command
 */
export class GeneratePipelineCommand<TOutput> implements PipelineCommand<TOutput> {
  readonly name = "generate";
  readonly description = "Generate output from a form using the pipeline";

  async execute(
    pipeline: FormModalPipeline<TOutput>, 
    form: FormShape, 
    options?: Record<string, any>
  ): Promise<TOutput> {
    if (options) {
      return pipeline.generateWithConfig(form, options);
    } else {
      return pipeline.generate(form);
    }
  }
}

/**
 * Generate with detailed diagnostics
 */
export class DiagnosticsPipelineCommand<TOutput> implements PipelineCommand<TOutput> {
  readonly name = "diagnostics";
  readonly description = "Generate output with detailed diagnostics";

  async execute(
    pipeline: FormModalPipeline<TOutput>, 
    form: FormShape, 
    options?: Record<string, any>
  ): Promise<{ 
    result: TOutput; 
    diagnostics: {
      executionTime: number;
      morphCount: number;
      morphNames: string[];
      timestamp: number;
    } 
  }> {
    // Create custom context to track execution
    const context: FormExecutionContext = {
      id: `diagnostics-${Date.now()}`,
      timestamp: Date.now(),
      data: {
        config: options || {},
        metrics: {
          startTime: Date.now()
        }
      },
      mark: {
        pipeline: { morphs: [] }
      }
    };

    // Start timing
    const start = performance.now();
    
    // Run the pipeline
    const result = options 
      ? pipeline.generateWithConfig(form, options, context)
      : pipeline.generate(form, context);
    
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
        timestamp: context.timestamp
      }
    };
  }
}

/**
 * Explain pipeline command
 */
export class ExplainPipelineCommand<TOutput> implements PipelineCommand<TOutput> {
  readonly name = "explain";
  readonly description = "Explain how the pipeline will process the form";

  async execute(
    pipeline: FormModalPipeline<TOutput>, 
    form: FormShape
  ): Promise<{
    morphCount: number;
    morphNames: string[];
    config: Record<string, any>;
    explanation: string;
  }> {
    const stats = pipeline.stats();
    const config = pipeline.getConfig();
    
    // Generate explanation of the pipeline
    const explanation = `This pipeline will process the form "${form.name || 'Unnamed'}" using ${stats.morphCount} morphs:
${stats.morphNames.map((name, i) => `${i+1}. ${name}`).join('\n')}

Configuration:
${Object.entries(config).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}`;
    
    return {
      morphCount: stats.morphCount,
      morphNames: stats.morphNames,
      config: config,
      explanation
    };
  }
}

/**
 * Pipeline command executor - runs commands against pipelines
 */
export class PipelineCommandExecutor<TOutput> {
  private commands: Map<string, PipelineCommand<TOutput>> = new Map();
  
  constructor(private readonly pipeline: FormModalPipeline<TOutput>) {
    // Register default commands
    this.registerCommand(new GeneratePipelineCommand());
    this.registerCommand(new DiagnosticsPipelineCommand());
    this.registerCommand(new ExplainPipelineCommand());
  }
  
  registerCommand(command: PipelineCommand<TOutput>): void {
    this.commands.set(command.name, command);
  }
  
  async execute(commandName: string, form: FormShape, options?: Record<string, any>): Promise<any> {
    const command = this.commands.get(commandName);
    
    if (!command) {
      throw new Error(`Unknown command: ${commandName}`);
    }
    
    return command.execute(this.pipeline, form, options);
  }
  
  getAvailableCommands(): { name: string; description: string }[] {
    return Array.from(this.commands.values()).map(cmd => ({
      name: cmd.name,
      description: cmd.description
    }));
  }
}

/**
 * Create a pipeline command executor
 */
export function createPipelineExecutor<TOutput>(pipeline: FormModalPipeline<TOutput>): PipelineCommandExecutor<TOutput> {
  return new PipelineCommandExecutor<TOutput>(pipeline);
}