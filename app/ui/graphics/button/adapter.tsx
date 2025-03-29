import { ReactNode } from 'react';
import { ButtonShape } from '@/ui/graphics/schema/button';
import { ButtonRenderer } from './renderer'; // Import from client file

/**
 * ButtonShapeAdapter - Server Component
 * Adapts button shapes into React components without client-side functionality
 */
export class ButtonShapeAdapter {
  static toJSX(shape: ButtonShape): ReactNode {
    // Simply delegate rendering to the client component
    return <ButtonRenderer shape={shape} />;
  }
}
