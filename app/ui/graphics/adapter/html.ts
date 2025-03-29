//@/ui/graphics/adapter/html.ts
import { FormMatter, FormField, FormShape } from "@/ui/graphics/schema/form";

export class ShapeToHTMLAdapter {
  static toHTML(shape: FormShape, data: FormMatter): string {
    let html = `<div><h1>${shape.layout.title}</h1>`;

    shape.fields.forEach((field) => {
      switch (field.type) {
        case "text":
          html += ShapeToHTMLAdapter.renderText(field, data);
          break;
        case "email":
          html += ShapeToHTMLAdapter.renderEmail(field, data);
          break;
        case "number":
          html += ShapeToHTMLAdapter.renderNumber(field, data);
          break;
        case "date":
          html += ShapeToHTMLAdapter.renderDate(field, data);
          break;
        case "select":
          html += ShapeToHTMLAdapter.renderSelect(field, data);
          break;
      }
    });

    html += `</div>`;
    return html;
  }

  static renderText(field: FormField, data: FormMatter): string {
    const value = data?.[field.id] || field.defaultValue;
    return `<div><label for="${field.id}">${field.label}</label><input type="text" id="${field.id}" name="${field.id}" ${field.required ? 'required' : ''} value="${value}" /></div>`;
  }

  static renderEmail(field: FormField, data: FormMatter): string {
    const value = data?.[field.id] || field.defaultValue;
    return `<div><label for="${field.id}">${field.label}</label><input type="email" id="${field.id}" name="${field.id}" ${field.required ? 'required' : ''} value="${value}" /></div>`;
  }

  static renderNumber(field: FormField, data: FormMatter): string {
    const value = data?.[field.id] || field.defaultValue;
    return `<div><label for="${field.id}">${field.label}</label><input type="number" id="${field.id}" name="${field.id}" ${field.required ? 'required' : ''} value="${value}" /></div>`;
  }

  static renderDate(field: FormField, data: FormMatter): string {
    const value = data?.[field.id] || field.defaultValue;
    return `<div><label for="${field.id}">${field.label}</label><input type="date" id="${field.id}" name="${field.id}" ${field.required ? 'required' : ''} value="${value}" /></div>`;
  }

  static renderSelect(field: FormField, data: FormMatter): string {
    if (!field.options?.length) {
      console.warn(`Select field ${field.id} has no options`);
      return '';
    }

    const selectedValue = data?.[field.id] || field.defaultValue;

    // Build options with proper selected attribute
    const options = field.options.map(option =>
      `<option value="${option.value}"${option.value === selectedValue ? ' selected' : ''}>${option.label}</option>`
    ).join('');

    return `<div>
      <label for="${field.id}">${field.label}</label>
      <select id="${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>
        ${options}
      </select>
    </div>`.replace(/\s+/g, ' ').trim();
  }
}
