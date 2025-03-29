import { describe, it, expect, beforeEach } from "vitest";
import type { OperationResult } from "@/lib/data/schema/base";
import type {
  FormMatter,
  FormMode,
  FormHandler,
  FormState,
  FormShape,
} from "@/ui/graphics/schema/form";
import { Form } from "@/ui/graphics/form/form";

// Concrete test implementation
class TestForm extends Form<FormShape> {
  // Allow test access to protected state
  public setState(newState: Partial<FormState>) {
    this.state = { ...this.state, ...newState };
  }

  protected create(): OperationResult<FormShape> {
    const shape: FormShape = {
      layout: {
        title: "Creation Form",
        columns: "single",
        actions: [
          {
            id: "submit",
            type: "submit",
            label: "Create",
            variant: "primary",
          },
        ],
      },
      fields: [
        {
          id: "essence",
          type: "text",
          label: "Essence",
          required: true,
          defaultValue: "",
        },
      ],
      state: this.state, // Use the current state
    };

    return {
      data: shape,
      status: "success",
      message: "Form created successfully"
    };
  }

  protected edit(): OperationResult<FormShape> {
    const shape: FormShape = {
      layout: {
        title: "Edit Form",
        columns: "single",
        actions: [
          {
            id: "submit",
            type: "submit",
            label: "Save",
            variant: "primary",
          },
        ],
      },
      fields: [
        {
          id: "essence",
          type: "text",
          label: "Modified Essence",
          required: true,
          defaultValue: this.data?.essence || "",
        },
      ],
      state: this.state,
    };

    return {
      data: shape,
      status: "success",
      message: "Form updated successfully"
    };
  }

  // For testing - get shape directly
  getFormShape(mode: FormMode): FormShape {
    const result = mode === "create" ? this.create() : this.edit();
    if (result.status === "error") {
      throw new Error(result.message);
    }
    return result.data as FormShape;
  }
}

describe("Form Base Class", () => {
  let form: TestForm;
  let testData: FormMatter;

  beforeEach(() => {
    testData = { essence: "Pure Being" };
    form = new TestForm(testData);
  });

  // Modified create mode test
  it("should handle create mode rendering", () => {
    const result = form.render("create", "jsx", {} as FormHandler);
    expect(result).toBeDefined();

    // Check for specific creation form elements
    const shape = form.getFormShape("create");
    expect(shape.layout.title).toBe("Creation Form");
    expect(shape.fields[0].label).toBe("Essence");
    expect(shape.layout.actions[0].label).toBe("Create");
  });

  // Modified edit mode test
  it("should handle edit mode rendering", () => {
    const result = form.render("edit", "jsx", {} as FormHandler);
    expect(result).toBeDefined();

    // Check for specific edit form elements
    const shape = form.getFormShape("edit");
    expect(shape.layout.title).toBe("Edit Form");
    expect(shape.fields[0].label).toBe("Modified Essence");
    expect(shape.layout.actions[0].label).toBe("Save");
  });

  it("should maintain state across renders", () => {
    form.setState({ status: "submitting" });
    const shape = form.getFormShape("create");
    expect(shape.state.status).toBe("submitting");
  });

  it("should handle format transformations", () => {
    const shape = form.getFormShape("create");

    // Basic existence checks
    expect(form.renderJSX(shape, testData, {} as FormHandler)).toBeDefined();
    expect(form.renderHTML(shape, testData, {} as FormHandler)).toBeDefined();
    //expect(form.renderJSON(shape, testData)).toBeDefined();
  });
});
