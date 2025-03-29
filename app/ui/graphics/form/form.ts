//@/ui/graphics/form/form.tsx
import React from "react";
import type {
  FormMatter,
  FormMode,
  FormContent,
  FormHandler,
  FormState,
  FormShape,
} from "@/ui/graphics/schema/form";
import { FormShapeAdapter } from "@/ui/graphics/adapter";

export abstract class Form<T extends FormShape> {
  protected state: FormState = {
    status: "idle",
  };

  constructor(protected readonly data?: FormMatter) {}

  protected abstract createForm(): Promise<T>;
  protected abstract editForm(): Promise<T>;

  async render(
    mode: FormMode,
    content: FormContent,
    handler: FormHandler
  ): Promise<React.ReactNode | string> {
    let shape: T;

    try {
      // Get the form shape based on mode
      switch (mode) {
        case "create":
          shape = await this.createForm();
          break;
        case "edit":
          shape = await this.editForm();
          break;
        default:
          throw new Error(`Unsupported mode: ${mode}`);
      }

      // Render the form in the requested format
      let form: React.ReactNode | string;
      switch (content) {
        case "jsx":
          form = this.renderJSX(shape, this.data, handler);
          break;
        case "json":
          form = this.renderJSON(shape, this.data, handler);
          break;
        case "html":
          form = this.renderHTML(shape, this.data, handler);
          break;
        case "xml":
          form = this.renderXML(shape, this.data, handler);
          break;
        default:
          throw new Error(`Unsupported format: ${content}`);
      }
      return form;
    } catch (error) {
      console.error("Error rendering form:", error);
      return null;
    }
  }

  renderJSX(shape: T, data: FormMatter, handler: FormHandler): React.ReactNode {
    return FormShapeAdapter.toJSX(shape, data, handler);
  }

  renderJSON(shape: T, data: FormMatter, handler: FormHandler): string {
    return FormShapeAdapter.toJSON(shape, data);
  }

  renderHTML(shape: T, data: FormMatter, handler: FormHandler): string {
    return FormShapeAdapter.toHTML(shape, data);
  }

  renderXML(shape: T, data: FormMatter, handler: FormHandler): string {
    return FormShapeAdapter.toXML(shape, data);
  }

  setState(state: Partial<FormState>) {
    this.state = {
      ...this.state,
      ...state,
    };
  }
}
