import { createMorph, createPipeline } from "../core";
import { FormShape, FormField } from "./types"; // Assuming these base types exist
import { FormContext } from "./types"; // Assuming this base type exists

/**
 * DateField – Extends the base FormField with runtime state specific to dates.
 * Stores the core date value as a number (epoch milliseconds).
 */
export interface DateField extends ValueField {
  value?: number | null; // Core value is epoch ms
}

/**
 * DateShape – A FormShape specialized for containing DateFields.
 */
export interface DateShape extends FormShape {
  fields: DateField[];
}

/**
 * DateContext – Context for date field processing.
 */
export interface DateContext extends FormContext {
  updateValues?: Record<string, number | null>; // Incoming values are numbers
  trackChanges?: boolean;
  readOnlyFields?: string[];
  // Add date-specific context if needed, e.g., timezone, locale for formatting
  locale?: string;
  timeZone?: string;
}

/**
 * Type guard to check if context is a valid DateContext.
 */
export function isDateContext(context: any): context is DateContext {
  // Basic check, can be enhanced
  return true;
}

/**
 * Helper function to get the initial date value (as epoch ms number) for a field.
 * Priority is:
 * 1. context.updateValues
 * 2. The field's current `value`
 * 3. The field's `defaultValue` (assuming it's also epoch ms or convertible)
 */
function getInitialDateValue(field: DateField, context: DateContext): number | null | undefined {
  if (context.updateValues && field.id in context.updateValues) {
    return context.updateValues[field.id];
  }
  if (field.value !== undefined) {
    return field.value;
  }
  // Ensure defaultValue is treated as a number if possible
  const defaultVal = field.defaultValue;
  if (typeof defaultVal === 'number') {
    return defaultVal;
  }
  if (typeof defaultVal === 'string') {
    // Attempt conversion if default is string (e.g., ISO string)
    const parsed = Date.parse(defaultVal);
    return isNaN(parsed) ? undefined : parsed;
  }
  if (defaultVal instanceof Date) {
    return defaultVal.getTime();
  }
  return undefined; // Or null if preferred
}

/**
 * DateInitMorph – Ensures each field gets an initial numeric timestamp value.
 * Sets defaults for basic flags. Leaves displayValue blank initially.
 */
export const DateInitMorph = createMorph<DateShape, DateShape>(
  "DateInitMorph",
  (shape, context) => {
    if (!isDateContext(context)) {
      throw new Error("DateInitMorph requires a valid DateContext");
    }

    const initFields: DateField[] = shape.fields.map((field) => {
      if (!field.id) return field;

      const initValue = getInitialDateValue(field, context);

      const updatedField: DateField = {
        ...field,
        value: initValue ?? null, // Ensure value is number or null
        originalValue: initValue ?? null, // Ensure originalValue is number or null
        displayValue: field.displayValue || '', // Initialize displayValue, formatting comes later
        inputType: field.inputType || 'datetime-local', // Sensible default for date/time
        visible: field.visible !== undefined ? field.visible : true,
        disabled: field.disabled !== undefined ? field.disabled : false,
        readOnly: field.readOnly !== undefined ? field.readOnly : false,
      };
      return updatedField;
    });

    return {
      ...shape,
      fields: initFields,
    };
  },
  { pure: true, fusible: true, cost: 1 }
);

/**
 * DateConstraintsMorph – Applies read-only constraints.
 * (Can be expanded for createOnly/editOnly based on FormMode).
 */
export const DateConstraintsMorph = createMorph<DateShape, DateShape>(
  "DateConstraintsMorph",
  (shape, context) => {
    if (!isDateContext(context)) {
      throw new Error("DateConstraintsMorph requires a valid DateContext");
    }
    const readOnlyFields = context.readOnlyFields || [];
    // const mode = context.mode || 'edit'; // Assuming mode is in context

    const constrainedFields = shape.fields.map((field) => {
      if (!field.id) return field;
      let isReadOnly = readOnlyFields.includes(field.id) || field.readOnly;
      // Example: Apply createOnly/editOnly based on mode
      // if (mode === 'create' && field.editOnly) isReadOnly = true;
      // if (mode === 'edit' && field.createOnly) isReadOnly = true;
      return {
        ...field,
        readOnly: isReadOnly,
      };
    });

    return {
      ...shape,
      fields: constrainedFields,
    };
  },
  { pure: true, fusible: true, cost: 1 }
);

/**
 * DateHistoryMorph – Tracks changes using numeric timestamps.
 */
export const DateHistoryMorph = createMorph<DateShape, DateShape>(
  "DateHistoryMorph",
  (shape, context) => {
    if (!isDateContext(context)) {
      throw new Error("DateHistoryMorph requires a valid DateContext");
    }
    const trackHistory = context.trackChanges !== false;
    if (!trackHistory) return shape;

    const now = Date.now(); // Use numeric timestamp

    const updatedFields = shape.fields.map((field) => {
      if (!field.id) return field;
      const baseline = field.originalValue ?? null; // Use null as default baseline if undefined
      const changed = field.value !== baseline;
      return {
        ...field,
        originalValue: baseline,
        lastModified: changed ? now : field.lastModified, // Store as number
        changed: changed,
      };
    });

    return {
      ...shape,
      fields: updatedFields,
    };
  },
  { pure: false, fusible: true, cost: 2 }
);

/**
 * DateFormattingMorph (Placeholder) - Converts numeric timestamp to display string.
 * This would typically run later, potentially closer to the UI layer (MVC).
 */
export const DateFormattingMorph = createMorph<DateShape, DateShape>(
  "DateFormattingMorph",
  (shape, context) => {
     if (!isDateContext(context)) {
       throw new Error("DateFormattingMorph requires a valid DateContext");
     }
     const locale = context.locale || 'en-US'; // Get locale from context or default
     const timeZone = context.timeZone; // Get timezone if needed

     const formattedFields = shape.fields.map((field) => {
       if (!field.id || typeof field.value !== 'number') return field;

       try {
         const dateObj = new Date(field.value);
         // Example formatting (customize as needed)
         const displayValue = dateObj.toLocaleDateString(locale, {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
            timeZone: timeZone // Pass timezone if available
         });
         return { ...field, displayValue };
       } catch (e) {
         console.error(`Error formatting date for field ${field.id}:`, e);
         return { ...field, displayValue: 'Invalid Date' }; // Handle invalid numbers
       }
     });

     return { ...shape, fields: formattedFields };
  },
  { pure: true, fusible: true, cost: 3, description: "Formats numeric date values into display strings." }
);

/**
 * DateValidationMorph (Placeholder) - Validates date values.
 */
export const DateValidationMorph = createMorph<DateShape, DateShape>(
  "DateValidationMorph",
  (shape, context) => {
    // Placeholder: Add logic to validate date fields
    // e.g., check if required, check min/max dates from field.validation
    // Update field.errors array if validation fails
    console.log("DateValidationMorph: Placeholder - Add validation logic here.");
    return shape;
  },
  { pure: true, fusible: true, cost: 2, description: "Validates date field values." }
);


/**
 * DatePipeline – Composes core date processing morphs.
 * Note: Formatting and Validation might run in separate pipelines or stages.
 */
export const DatePipeline = createPipeline<DateShape>("DatePipeline")
  .pipe(DateInitMorph)
  .pipe(DateConstraintsMorph)
  .pipe(DateHistoryMorph)
  // Consider adding DateValidationMorph here if it runs early
  // .pipe(DateValidationMorph)
  // DateFormattingMorph usually runs later, closer to presentation
  .build({
    description: "Apply initial date transformations (init, constraints, history)",
    category: "form",
    tags: ["form", "fields", "date", "init"],
    inputType: "DateShape",
    outputType: "DateShape",
  });

/**
 * Example of a separate formatting pipeline if needed
 */
export const DateFormattingPipeline = createPipeline<DateShape>("DateFormattingPipeline")
  .pipe(DateFormattingMorph)
  .build({
     description: "Formats date fields for display",
     category: "form",
     tags: ["form", "fields", "date", "format"],
     inputType: "DateShape",
     outputType: "DateShape",
  });