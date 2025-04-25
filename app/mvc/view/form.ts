//@/ui/view/form.ts
import { ReactNode } from "react";
import type { OperationResult } from "@/form/data/schema/base";
import type {
  FormShape,
  FormMode,
  FormContent,
  FormHandler,
} from "@/form/schema/form";
import { Form } from "@/form/form/form";

export class FormView<T extends FormShape> {
  constructor(protected readonly form?: Form<T>) {}

  /**
   * Display a form with the given mode and handler
   */
  public async display(
    mode: FormMode,
    content: FormContent = "jsx",
    handler: FormHandler
  ): Promise<OperationResult<ReactNode | string>> {
    if (!this.form) {
      return {
        status: "error",
        data: null,
        message: "No form available for display",
      };
    }

    try {
      const rendered = await this.form.render(mode, content, handler);
      return {
        status: "success",
        data: rendered,
        message: "Form rendered successfully",
      };
    } catch (error) {
      return {
        status: "error",
        data: null,
        message: `Form render error: ${error}`,
      };
    }
  }
}
