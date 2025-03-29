//@/ui/graphics/adapter/xml.ts
import type { FormMatter, FormField, FormShape,  } from '@/ui/graphics/schema/form';

export class ShapeToXMLAdapter {
  static toXML(shape: FormShape, data: FormMatter): string {
    let xml = `<form title="${shape.layout.title}">\n`;

    shape.fields.forEach(field => {
      xml += `  <field id="${field.id}" type="${field.type}" label="${field.label}">\n`;
      xml += `    <value>${data?.[field.id] || ''}</value>\n`;
      xml += `  </field>\n`;
    });

    xml += `</form>`;
    return xml;
  }
}
