import {
  SystemEvent,
  EventEmitter,
  SystemPropertyHandler,
} from "../../../core/system/property";
import { OperationResult } from "./schema/base";

/**
 * Base service with common functionality for system services
 */
export abstract class BaseService<
  T,
  E extends SystemEvent
> extends EventEmitter<E> {
  /**
   * Filter a collection by property filters
   */
  protected filterByProperties<I = T>(
    items: I[],
    propertyFilters: Record<string, any> | undefined,
    getProperties: (item: I) => Record<string, any> | undefined
  ): I[] {
    return SystemPropertyHandler.filterByProperties(
      items,
      propertyFilters,
      getProperties
    );
  }

  /**
   * Create a success result
   */
  protected createSuccessResult<D = any>(
    data: D,
    message: string = "Operation successful"
  ): OperationResult<D> {
    return {
      status: "success",
      message,
      data,
    };
  }

  /**
   * Create an error result
   */
  protected createErrorResult<D = any>(
    message: string,
    error?: Error
  ): OperationResult<D> {
    return {
      status: "error",
      message: error ? `${message}: ${error.message}` : message,
      data: null,
    };
  }

  /**
   * Execute an operation with error handling
   */
  protected async executeOperation<D = any>(
    operation: () => Promise<D> | D,
    successMessage: string = "Operation successful",
    errorMessage: string = "Operation failed"
  ): Promise<OperationResult<D>> {
    try {
      const result = await operation();
      return this.createSuccessResult(result, successMessage);
    } catch (error) {
      return this.createErrorResult(errorMessage, error as Error);
    }
  }
}
