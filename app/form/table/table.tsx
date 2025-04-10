
import { ReactNode } from "react";
import { Form } from "@/form/form/form";
import {
  TableMode,
  TableContent,
  TableColumn,
  TableShape,
  TableState,
} from "@/form/schema/table";

/**
 * Abstract base class for all tables
 */
export abstract class Table<T extends TableShape> {
// extends Form<T> {
  private _cachedShape: T | null = null;
  protected readonly data: any[];

  constructor(data: any[]) {
    //super(data);
    this.data = data;
  }

  /**
   * Get the table shape - implemented by subclasses
   */
  protected abstract defineShape(): T;

  /**
   * Get the cached table shape or create a new one
   */
  getTableShape(): T {
    if (!this._cachedShape) {
      this._cachedShape = this.defineShape();
    }
    return this._cachedShape;
  }

  /**
   * Apply transformations to the shape
   */
  withTransformations(...transforms: Array<(shape: T) => void>): this {
    const shape = this.getTableShape();
    transforms.forEach((transform) => transform(shape));
    return this;
  }

  /**
   * Render the table
   */
  public async render(
    mode: TableMode = "list",
    content: TableContent = "jsx"
  ): Promise<ReactNode | string> {
    try {
      const shape = this.getTableShape();

      let result: ReactNode | string;
      switch (content) {
        case "jsx":
          result = await this.renderJSX(shape, this.data);
          break;
        case "json":
          result = this.renderJSON(shape, this.data);
          break;
        default:
          throw new Error(`Unsupported content format: ${content}`);
      }

      return result;
    } catch (error) {
      console.error("Error rendering table:", error);
      return null;
    }
  }

  /**
   * Default cell renderer - can be overridden
   */
  public renderCell(column: TableColumn, item: any): ReactNode {
    const value = item[column.key];
    return value !== undefined && value !== null ? String(value) : "";
  }

  /**
   * Default mobile card renderer - can be overridden
   */
  public renderMobileCard(item: any): ReactNode {
    return null; // Default implementation
  }

  /**
   * Default actions renderer - can be overridden
   */
  public renderActions(item: any, actions: any[]): ReactNode {
    // Default implementation that can be overridden
    return null;
  }

  /**
   * Render as JSX - implemented by adapter
   */
  public async renderJSX(shape: T, items: any[]): Promise<ReactNode> {
    // Import the adapter at runtime to avoid circular dependencies
    const { TableShapeAdapter } = await import("@/form/table/adapter");
    return TableShapeAdapter.toJSX(this, shape, items);
  }

  /**
   * Render as JSON - simple implementation
   */
  public renderJSON(shape: T, items: any[]): string {
    return JSON.stringify(
      {
        shape,
        items,
        totalItems: items.length,
      },
      null,
      2
    );
  }

  /**
   * Update table state
   */
  setState(newState: Partial<TableState>): void {
    const shape = this.getTableShape();
    shape.state = {
      ...shape.state,
      ...newState,
    };
  }
}
