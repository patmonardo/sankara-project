import React from 'react';
import type { FormMatter, FormHandler, FormShape } from '@/ui/graphics/schema/form';
import { ShapeToJSONAdapter } from './json';
import { ShapeToHTMLAdapter } from './html';
import { ShapeToXMLAdapter } from './xml';
import { ShapeToJSXAdapter } from './jsx';

export class FormShapeAdapter {
  static toJSX(shape: FormShape, data: FormMatter, handler: FormHandler): React.ReactNode {
    return ShapeToJSXAdapter.toJSX(shape, data, handler);
  }

  static toJSON(shape: FormShape, data: FormMatter): string {
    return ShapeToJSONAdapter.toJSON(shape, data);
  }

  static toHTML(shape: FormShape, data: FormMatter): string {
    return ShapeToHTMLAdapter.toHTML(shape, data);
  }

  static toXML(shape: FormShape, data: FormMatter): string {
    return ShapeToXMLAdapter.toXML(shape, data);
  }
}
