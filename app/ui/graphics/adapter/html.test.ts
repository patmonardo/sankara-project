import { describe, it, expect } from "vitest";
import { ShapeToHTMLAdapter } from "./html";

describe("ShapeToHTMLAdapter", () => {
  // Text input test
  it("should render a text input with label", () => {
    const field = {
      id: "name",
      type: "text" as const,
      label: "Name",
      required: true,
      defaultValue: "",
    };

    const data = {
      name: "John Doe",
    };

    const result = ShapeToHTMLAdapter.renderText(field, data);

    // HTML output should be a string
    expect(typeof result).toBe("string");

    // Basic HTML structure checks
    expect(result).toContain("<div>");
    expect(result).toContain('<label for="name">Name</label>');
    expect(result).toContain('<input type="text"');
    expect(result).toContain("required");
    expect(result).toContain('id="name"');
    expect(result).toContain('value="John Doe"');

    console.log("HTML Element:", result);
  });

  // Email input test
  it("should render an email input with label", () => {
    const field = {
      id: "email",
      type: "email" as const,
      label: "Email",
      required: true,
      defaultValue: "",
    };

    const data = {
      email: "john@example.com",
    };

    const result = ShapeToHTMLAdapter.renderEmail(field, data);

    // HTML output should be a string
    expect(typeof result).toBe("string");

    // Basic HTML structure checks
    expect(result).toContain("<div>");
    expect(result).toContain('<label for="email">Email</label>');
    expect(result).toContain('<input type="email"');
    expect(result).toContain("required");
    expect(result).toContain('id="email"');

    console.log("HTML Element:", result);
  });

  // Number input test
  it("should render a number input with label", () => {
    const field = {
      id: "age",
      type: "number" as const,
      label: "Age",
      required: true,
      defaultValue: "",
    };

    const data = {
      age: "30",
    };

    const result = ShapeToHTMLAdapter.renderNumber(field, data);

    // HTML output should be a string
    expect(typeof result).toBe("string");

    // Basic HTML structure checks
    expect(result).toContain("<div>");
    expect(result).toContain('<label for="age">Age</label>');
    expect(result).toContain('<input type="number"');
    expect(result).toContain("required");
    expect(result).toContain('id="age"');
    expect(result).toContain('value="30"');

    console.log("HTML Element:", result);
  });

  // Date input test
  it("should render a date input with label", () => {
    const field = {
      id: "birthdate",
      type: "date" as const,
      label: "Birthdate",
      required: true,
      defaultValue: "",
    };

    const data = {
      birthdate: "2023-10-01",
    };

    const result = ShapeToHTMLAdapter.renderDate(field, data);

    // HTML output should be a string
    expect(typeof result).toBe("string");

    // Basic HTML structure checks
    expect(result).toContain("<div>");
    expect(result).toContain('<label for="birthdate">Birthdate</label>');
    expect(result).toContain('<input type="date"');
    expect(result).toContain("required");
    expect(result).toContain('id="birthdate"');
    expect(result).toContain('value="2023-10-01"');

    console.log("HTML Element:", result);
  });
  // Select input test
  it("should render a select input with label and selected value", () => {
    const field = {
      id: "country",
      type: "select" as const,
      label: "Country",
      required: true,
      defaultValue: "",
      options: [
        { value: "us", label: "United States" },
        { value: "ca", label: "Canada" },
      ],
    };

    const data = {
      country: "us", // This should make the US option selected
    };

    const result = ShapeToHTMLAdapter.renderSelect(field, data);

    // Basic structure checks
    expect(typeof result).toBe("string");
    expect(result).toContain("<div>");
    expect(result).toContain('<label for="country">Country</label>');
    expect(result).toContain("<select");
    expect(result).toContain("required");
    expect(result).toContain('id="country"');

    // Options checks
    expect(result).toContain('<option value="us" selected>United States</option>');
    expect(result).toContain('<option value="ca">Canada</option>');

    // Selected state check
    expect(result).toContain('value="us" selected'); // Check for selected attribute
    expect(result).not.toContain('value="ca" selected'); // Make sure other option isn't selected

    console.log("HTML Element:", result);
  });
});
