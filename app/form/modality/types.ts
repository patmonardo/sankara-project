import { FormExecutionContext } from '../schema/context';
import { FormPipeline } from "../morph/core/pipeline";

/**
 * Command - Abstract representation of intent
 */
export interface Command<TOutput> {
  readonly name: string;
  readonly description: string;
  execute(context: CommandContext<TOutput>): Promise<any>;
}

/**
 * Command context for execution
 */
export interface CommandContext<TOutput> {
  readonly pipeline: FormPipeline<TOutput>;
  readonly form: any; // Support both FormShape and GraphShape
  readonly options?: Record<string, any>;
  readonly executionContext?: FormExecutionContext;
}