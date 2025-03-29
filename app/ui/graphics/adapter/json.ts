//@/ui/graphics/adapter/json.ts
import type { FormMatter, FormShape } from '@/ui/graphics/schema/form';

export class ShapeToJSONAdapter {
  static toJSON(shape: FormShape, data: FormMatter): string {
    const json = {
      layout: {
        title: shape.layout.title,
      },
      fields: shape.fields.map((field) => ({
        id: field.id,
        label: field.label,
        value: data?.[field.id] || '', // Use data to populate the value
      })),
    };
    return JSON.stringify(json, null, 2);
  }
}
