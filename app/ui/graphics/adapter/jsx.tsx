//ui/graphics/adapter/jsx.tsx
import React from "react";
import { z } from "zod";

import type {
  FormMatter,
  FormHandler,
  FormField,
  FormAction,
  FormShape,
} from "@/ui/graphics/schema/form";

export class ShapeToJSXAdapter {
  static toJSX(
    shape: FormShape,
    data: FormMatter,
    handler: FormHandler
  ): React.ReactNode {
    // Get the main form action from options
    const formAction = handler.submit as any;
    return (
      <form
        action={formAction}
        className="bg-white rounded-md shadow-sm p-4 md:p-6" // Add this class
      >
        {/* Form header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold">{shape.layout.title}</h1>
          {/*{shape.layout.description && (
          <p className="text-gray-500 mt-2">{shape.layout.description}</p>
        )}*/}
        </div>

        {/* Render fields */}
        {/* Fields container */}
        <div className="space-y-4">
          {shape.fields.map((field) => {
            // Add a key prop for each field
            const fieldElement = (() => {
              switch (field.type) {
                case "text":
                  return ShapeToJSXAdapter.renderText(field, data);
                case "email":
                  return ShapeToJSXAdapter.renderEmail(field, data);
                case "number":
                  return ShapeToJSXAdapter.renderNumber(field, data);
                case "date":
                  return ShapeToJSXAdapter.renderDate(field, data);
                case "select":
                  return ShapeToJSXAdapter.renderSelect(field, data);
                case "url":
                  return ShapeToJSXAdapter.renderUrl(field, data);
                default:
                  console.warn(`Unhandled field type: ${field.type}`);
                  return null;
              }
            })();

            return (
              <React.Fragment key={field.id}>{fieldElement}</React.Fragment>
            );
          })}
        </div>

        {/* Render actions */}
        <div className="mt-6 flex justify-end gap-4">
          {shape.layout.actions.map((action) => (
            <React.Fragment key={action.id || action.label}>
              {ShapeToJSXAdapter.renderButton(action, handler)}
            </React.Fragment>
          ))}
        </div>
      </form>
    );
  }

  static renderText(field: FormField, data: FormMatter): React.ReactElement {
    return (
      <div className="mb-4">
        <label htmlFor={field.id} className="block text-sm font-medium mb-1">
          {field.label}
        </label>
        <input
          type="text"
          id={field.id}
          name={field.id}
          required={field.required}
          defaultValue={data?.[field.id]}
          className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
        />
      </div>
    );
  }
  static renderEmail(field: FormField, data: FormMatter): React.ReactElement {
    return (
      <div className="mb-4">
        <label htmlFor={field.id} className="block text-sm font-medium mb-1">
          {field.label}
        </label>
        <input
          type="email"
          id={field.id}
          name={field.id}
          required={field.required}
          defaultValue={data?.[field.id] || field.defaultValue}
          className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm" // Add this class
        />
      </div>
    );
  }

  static renderNumber(field: FormField, data: FormMatter): React.ReactElement {
    return (
      <div className="mb-4">
        <label htmlFor={field.id} className="block text-sm font-medium mb-1">
          {field.label}
        </label>
        <input
          type="number"
          id={field.id}
          name={field.id}
          required={field.required}
          defaultValue={data?.[field.id]}
          className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm" // Add this class
        />
      </div>
    );
  }

  static renderDate(field: FormField, data: FormMatter): React.ReactElement {
    // Format the date for HTML date input (YYYY-MM-DD)
    let defaultDate = "";

    if (data?.[field.id]) {
      // If data exists, format it properly
      const dateObj = new Date(data[field.id]);
      if (!isNaN(dateObj.getTime())) {
        defaultDate = dateObj.toISOString().split("T")[0];
      }
    } else if (field.defaultValue) {
      // Try to use field default if no data
      const dateObj = new Date(field.defaultValue);
      if (!isNaN(dateObj.getTime())) {
        defaultDate = dateObj.toISOString().split("T")[0];
      }
    }

    return (
      <div className="mb-4">
        <label htmlFor={field.id} className="block text-sm font-medium mb-1">
          {field.label}
        </label>
        <input
          type="date"
          id={field.id}
          name={field.id}
          required={field.required}
          defaultValue={defaultDate}
          className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
        />
      </div>
    );
  }
  static renderSelect(field: FormField, data: FormMatter): React.ReactElement {
    // Get the currently selected value from data or default
    const selectedValue = data?.[field.id] || field.defaultValue || "";

    return (
      <div className="mb-4">
        <label htmlFor={field.id} className="block text-sm font-medium mb-1">
          {field.label}
        </label>
        <select
          id={field.id}
          name={field.id}
          required={field.required}
          defaultValue={selectedValue} // This handles the selection now
          className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
        >
          {/* Placeholder option */}
          {field.required && !selectedValue && (
            <option value="" disabled>
              -- Select {field.label} --
            </option>
          )}

          {/* Remove the selected attribute from options */}
          {field.options?.map((option) => (
            <option
              key={option.value}
              value={option.value}
              // Remove this line: selected={option.value === selectedValue}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  static renderCheckbox(
    field: FormField,
    data: FormMatter
  ): React.ReactElement {
    return (
      <div className="mb-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id={field.id}
            name={field.id}
            required={field.required}
            defaultChecked={data?.[field.id] || field.defaultValue}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor={field.id} className="ml-2 block text-sm font-medium">
            {field.label}
          </label>
        </div>
      </div>
    );
  }

  static renderRadio(field: FormField, data: FormMatter): React.ReactElement {
    return (
      <div className="mb-4">
        <label htmlFor={field.id}>{field.label}</label>
        {field.options?.map((option) => (
          <div key={option.value}>
            <input
              type="radio"
              id={`${field.id}-${option.value}`}
              name={field.id}
              value={option.value}
              defaultChecked={data?.[field.id] === option.value}
            />
            <label htmlFor={`${field.id}-${option.value}`}>
              {option.label}
            </label>
          </div>
        ))}
      </div>
    );
  }

  static renderTextarea(
    field: FormField,
    data: FormMatter
  ): React.ReactElement {
    return (
      <div className="mb-4">
        <label htmlFor={field.id}>{field.label}</label>
        <textarea
          id={field.id}
          name={field.id}
          required={field.required}
          defaultValue={data?.[field.id] || field.defaultValue}
          className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
          rows={4}
        />
      </div>
    );
  }

  static renderUrl(field: FormField, data: FormMatter): React.ReactElement {
    return (
      <div className="mb-4">
        <label htmlFor={field.id}>{field.label}</label>
        <input
          type="url"
          id={field.id}
          name={field.id}
          required={field.required}
          defaultValue={data?.[field.id] || field.defaultValue}
          placeholder="https://..."
        />
      </div>
    );
  }

  static renderColor(field: FormField, data: FormMatter): React.ReactElement {
    return (
      <div className="mb-4">
        <label htmlFor={field.id}>{field.label}</label>
        <input
          type="color"
          id={field.id}
          name={field.id}
          required={field.required}
          defaultValue={data?.[field.id] || field.defaultValue}
        />
      </div>
    );
  }

  static renderFile(field: FormField, data: FormMatter): React.ReactElement {
    return (
      <div className="mb-4">
        <label htmlFor={field.id}>{field.label}</label>
        <input
          type="file"
          id={field.id}
          name={field.id}
          required={field.required}
          defaultValue={data?.[field.id] || field.defaultValue}
        />
      </div>
    );
  }

  static renderButton(
    action: FormAction,
    handler: FormHandler
  ): React.ReactElement {
    // Base button styling
    const baseButtonClasses = "px-4 py-2 text-sm rounded-md font-medium";

    // Different styles based on button type
    const buttonClasses =
      action.id === "cancel"
        ? `${baseButtonClasses} bg-white text-gray-600 border border-gray-300 hover:bg-gray-50`
        : `${baseButtonClasses} bg-blue-500 text-white hover:bg-blue-600`;

    // For cancel buttons, add formNoValidate to bypass validation
    if (action.id === "cancel" && handler.cancel) {
      return (
        <button
          type="submit"
          formAction={handler.cancel as any}
          className={buttonClasses}
          formNoValidate // This is the key - it bypasses form validation
        >
          {action.label}
        </button>
      );
    }

    // Submit button
    if (action.type === "submit") {
      return (
        <button type="submit" className={buttonClasses}>
          {action.label}
        </button>
      );
    }

    // Regular button
    return (
      <button type="button" className={buttonClasses}>
        {action.label}
      </button>
    );
  }
}
