import { ReactNode } from 'react';
import { FormMode, FormContent, FormHandler } from '@/ui/graphics/schema/form';
import { ButtonShape } from '@/ui/graphics/schema/button';
import { ButtonShapeAdapter } from './adapter';
import { Form } from '@/ui/graphics/form/form';

/**
 * Abstract base class for all button types
 */
export abstract class Button<T extends ButtonShape> extends Form<T> {
  /**
   * Get the button shape configuration
   */
  protected abstract getButtonShape(): T;

  /**
   * Render the button as a React component
   */
  async render(
      mode: FormMode,
      content: FormContent,
      handler: FormHandler
    ): Promise<React.ReactNode | string> {
    const shape = this.getButtonShape();
    return this.renderButton(shape);
  }

  /**
   * Render implementation - uses adapter
   */
  protected renderButton(shape: T): ReactNode {
    return ButtonShapeAdapter.toJSX(shape);
  }
}
