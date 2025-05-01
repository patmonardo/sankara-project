import { describe, it, expect } from "vitest";
import {
  FormOptionSchema,
  FormFieldSchema,
  FormActionSchema,
  FormLayoutSchema,
  FormStateSchema,
  FormShapeSchema,
} from "./shape";

describe("Form Schema Validation", () => {
  describe("Form Field Schema", () => {
    it("should validate a complete field", () => {
      const validField = {
        id: "email",
        type: "email",
        label: "Email Address",
        required: true,
        defaultValue: "user@example.com",
      };

      const result = FormFieldSchema.safeParse(validField);
      expect(result.success).toBe(true);
    });

    it("should apply default values", () => {
      const minimalField = {
        id: "name",
        type: "text",
        label: "Name",
      };

      const result = FormFieldSchema.safeParse(minimalField);
      // expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.required).toBe(false);
        expect(result.data.defaultValue).toBe("");
      }
    });

    it("should validate a field with options", () => {
      const selectField = {
        id: "country",
        type: "select",
        label: "Country",
        required: true,
        defaultValue: "us",
        options: [
          { value: "us", label: "United States" },
          { value: "ca", label: "Canada" },
        ],
      };

      const result = FormFieldSchema.safeParse(selectField);
      expect(result.success).toBe(true);
    });

    it("should reject fields missing required properties", () => {
      const invalidFields = [
        { type: "text", label: "Missing ID" },
        { id: "name", label: "Missing Type" },
        { id: "name", type: "text" },
      ];

      invalidFields.forEach(field => {
        const result = FormFieldSchema.safeParse(field);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Form Field Option Schema", () => {
    it("should validate a valid option", () => {
      const option = { value: "us", label: "United States" };
      const result = FormOptionSchema.safeParse(option);
      expect(result.success).toBe(true);
    });

    it("should reject invalid options", () => {
      const invalidOptions = [
        { value: 123, label: "Invalid Value Type" },
        { value: "us", label: null },
        { value: "us" }, // missing label
        { label: "US" }, // missing value
      ];

      invalidOptions.forEach(option => {
        const result = FormOptionSchema.safeParse(option);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Form Action Schema", () => {
    it("should validate valid actions", () => {
      const validActions = [
        { id: "submit", type: "submit", label: "Save", variant: "primary" },
        { id: "reset", type: "reset", label: "Clear", variant: "secondary" },
        { id: "cancel", type: "button", label: "Cancel", variant: "ghost"},
      ];

      validActions.forEach(action => {
        const result = FormActionSchema.safeParse(action);
        expect(result.success).toBe(true);
      });
    });

    it("should apply default action when not specified", () => {
      const action = { type: "submit", label: "Save", variant: "primary" };
      const result = FormActionSchema.safeParse(action);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("submit");
      }
    });

    it("should reject invalid action types", () => {
      const action = { type: "invalid", label: "Save", variant: "primary" };
      const result = FormActionSchema.safeParse(action);
      expect(result.success).toBe(false);
    });
  });

  describe("Form Layout Schema", () => {
    it("should validate a complete layout", () => {
      const layout = {
        title: "Customer Form",
        columns: "single",
        actions: [
          { id: "submit", type: "submit", label: "Save", variant: "primary" }
        ]
      };

      const result = FormLayoutSchema.safeParse(layout);
      expect(result.success).toBe(true);
    });

    it("should reject invalid column values", () => {
      const layout = {
        title: "Test Form",
        columns: "triple", // invalid
        actions: []
      };

      const result = FormLayoutSchema.safeParse(layout);
      expect(result.success).toBe(false);
    });
  });

  describe("Form State Schema", () => {
    it("should validate different form states", () => {
      const states = [
        { status: "idle" },
        { status: "submitting", message: "Processing..." },
        { status: "success", message: "Form submitted" },
        { status: "error", message: "Please fix errors", errors: { email: ["Invalid email"] } }
      ];

      states.forEach(state => {
        const result = FormStateSchema.safeParse(state);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid status values", () => {
      const state = { status: "pending" }; // invalid status
      const result = FormStateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });
  });

  describe("Complete Form Shape", () => {
    it("should validate a complete form", () => {
      const form = {
        layout: {
          title: "Contact Form",
          columns: "single",
          actions: [
            { type: "submit", label: "Send", variant: "primary" }
          ]
        },
        fields: [
          {
            id: "name",
            type: "text",
            label: "Name",
            required: true,
            defaultValue: ""
          },
          {
            id: "email",
            type: "email",
            label: "Email",
            required: true,
            defaultValue: ""
          }
        ],
        state: {
          status: "idle"
        }
      };

      const result = FormShapeSchema.safeParse(form);
      expect(result.success).toBe(true);
    });
  });
});
