import { BaseTransformer } from "../../schema/transform";
import { TransformContext } from "../../schema/transform";

/**
 * ViewRenderTransformer - Prepares data for rendering in the UI
 *
 * This transformer finishes the transformation process by adding
 * rendering-specific properties.
 */
export class ViewRenderTransformer extends BaseTransformer<any, any> {
  constructor() {
    super("ViewRenderTransformer");
  }

  transform(input: any, context: TransformContext): any {
    // Add rendering attributes to each field
    const renderedFields = input.fields.map(field => ({
      ...field,
      component: this.determineComponent(field.type, context),
      props: this.determineProps(field, context),
      interactive: false
    }));

    // Create the final render structure
    return {
      id: input.id,
      fields: renderedFields,
      layout: this.determineLayout(input, context),
      mode: 'view',
      format: context.format || 'jsx'
    };
  }

  /**
   * Determine the appropriate component for a field
   */
  private determineComponent(type: string, context: TransformContext): string {
    // Map field types to components
    switch (type) {
      case 'text':
        return 'Text';
      case 'number':
        return 'Number';
      case 'date':
        return 'DateTime';
      case 'boolean':
        return 'Boolean';
      case 'array':
        return 'List';
      case 'object':
        return 'ObjectView';
      default:
        return 'Text';
    }
  }

  /**
   * Determine props for a component
   */
  private determineProps(field: any, context: TransformContext): any {
    // Base props for all components
    const props: any = {
      readOnly: true,
      className: `field-${field.id}`,
    };

    // Type-specific props
    switch (field.type) {
      case 'text':
        props.displayMode = 'inline';
        break;
      case 'date':
        props.format = 'medium';
        break;
      case 'boolean':
        props.displayAsText = true;
        break;
    }

    return props;
  }

  /**
   * Determine layout for the form
   */
  private determineLayout(input: any, context: TransformContext): any {
    // Default layout
    return {
      type: 'stacked',
      labelPosition: 'top',
      spacing: 'comfortable'
    };
  }
}
