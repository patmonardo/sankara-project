import React from "react";
import { StyleContext } from "../schema/context";
import { CreateOutput } from "../morph/create/create";
import { EditOutput } from "../morph/edit/edit";
import { ViewOutput } from "../morph/view/display";
import { StyleMorph } from "../style/style";
import { renderField } from "./modality-field";

/**
 * Form data object
 */
export type FormMatter = Record<string, any>;

/**
 * Form event handlers
 */
export interface FormHandler {
  onChange?: (fieldId: string, value: any) => void;
  onSubmit?: (data: FormMatter) => void;
  onCancel?: () => void;
  onAction?: (actionId: string) => void;
}

/**
 * ShapeAdapter - Converts morphed shapes into React components
 */
export class ShapeAdapter {
  /**
   * Convert a morphed form shape to JSX
   */
  static toJSX(shape: any, data: FormMatter, handler: FormHandler): React.ReactNode {
    // Handle different output types from morphs
    if (shape.mode === 'view') {
      return this.viewOutputToJSX(shape as ViewOutput, data, handler);
    } else if (shape.mode === 'edit') {
      return this.editOutputToJSX(shape as EditOutput, data, handler);
    } else if (shape.mode === 'create') {
      return this.createOutputToJSX(shape as CreateOutput, data, handler);
    }
    
    // Fallback to generic rendering
    return this.genericShapeToJSX(shape, data, handler);
  }

  /**
   * Get container styles using style morphism
   */
  private static getContainerStyles(mode: string, shape: any): { className: string; style: React.CSSProperties } {
    // Create context for style morphism
    const context: StyleContext = {
      mode: mode as 'view' | 'edit' | 'create',
      domain: 'form',
      intent: shape.meta?.intent,
      state: shape.meta?.state || 'idle',
      responsive: true,
      animation: true
    };
    
    // Apply style morph
    const result = StyleMorph.apply(context);
    
    // Convert CSS variables to React inline style
    const style: React.CSSProperties = {};
    if (result.cssVars) {
      Object.entries(result.cssVars).forEach(([key, value]) => {
        style[key as any] = value;
      });
    }
    
    return {
      className: `form-${mode} ${result.className}`,
      style
    };
  }

  /**
   * Convert ViewOutput to JSX
   */
  private static viewOutputToJSX(shape: ViewOutput, data: FormMatter, handler: FormHandler): React.ReactNode {
    const styles = this.getContainerStyles('view', shape);
    
    return (
      <div className={styles.className} style={styles.style}>
        <div className="form-view-header">
          {shape.meta?.title && (
            <h2 className="form-title">{shape.meta.title}</h2>
          )}
          {shape.meta?.description && (
            <p className="form-description">{shape.meta.description}</p>
          )}
        </div>

        <div className="form-view-fields">
          {shape.fields.map(field => renderField({
            field,
            mode: 'view',
            value: data?.[field.id],
            onChange: (value) => handler.onChange?.(field.id, value)
          }))}
        </div>

        {shape.actions && (
          <div className="form-view-actions">
            {shape.actions.map(action => (
              <button
                key={action.id}
                className={`form-action ${action.type}`}
                onClick={() => handler.onAction?.(action.id)}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Other methods (editOutputToJSX, createOutputToJSX, etc.) would be similar
}
