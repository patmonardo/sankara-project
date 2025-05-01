import { FormShape, FormField } from "./types";
import { FormContext } from "./types";

/**
 * DateField – Extends the base FormField with runtime state.
 */
export interface DateField extends FormField {
  date?: any;
  originalDate?: any;
  displayDate?: string;
  changed?: boolean;
  lastModified?: string;
}

/**
 * DateShape – A FormShape that contains DateFields.
 */
export interface DateShape extends FormShape {
  fields: DateField[];
}

/**
 * DateContext – Context for field processing.
 */
export interface DateContext extends FormContext {
  updateDates?: Record<string, any>;
  trackChanges?: boolean;
  readOnlyFields?: string[];
  createOnlyFields?: string[];
  editOnlyFields?: string[];
}

/**
 * Type guard to check if context is a valid DateContext.
 */
export function isDateContext(context: any): context is DateContext {
  return true;
}

/**
 * Helper function to get the initial date for a field.
 * Priority is:
 * 1. context.updateDates (if provided and contains this field)
 * 2. The field's current `date`
 * 3. The field's `defaultDate`
 */
function getInitialDateField(field: DateField, context: DateContext): any {
  if (context.updateDates && field.id in context.updateDates) {
    return context.updateDates[field.id];
  }
  if (field.date !== undefined) {
    return field.date;
  }
  return field.defaultDate;
}

/**
 * DateInitMorph – Ensures each field in the shape obtains a proper initial date.
 * Also sets defaults for display, inputType, and basic flags.
 */
export const DateInitMorph = createMorph<DateShape, DateShape>(
  "DateInitMorph",
  (shape, context) => {
    if (!isDateContext(context)) {
      throw new Error("DateInitMorph requires a valid DateContext");
    }

    const initDates: DateField[] = shape.fields.map((field) => {
      // Skip fields without an identifier.
      if (!field.id) return field;

      const initDate = getInitialDateField(field, context);
      const displayVal = field.displayDate || String(initDate);

      const updatedField ={
        ...field,
        date: initDate,
        originalDate: initDate,
        displayDate: displayVal,
        inputType: field.inputType || field.type,
        visible: field.visible !== undefined ? field.visible : true,
        disabled: field.disabled !== undefined ? field.disabled : false,
        readOnly: field.readOnly !== undefined ? field.readOnly : false,
      };
      return updatedField as DateField;
    });

    return {
      ...shape,
      fields: initDates,
    } as DateShape;
  },
  {
    pure: true,
    fusible: true,
    cost: 1,
  }
);

/**
 * DateConstraintsMorph – Applies field-level constraints:
 * marks fields as read-only if designated, and could be expanded for other rules.
 */
export const DateConstraintsMorph = createMorph<DateShape, DateShape>(
  "DateConstraintsMorph",
  (shape, context) => {
    if (!isDateContext(context)) {
      throw new Error("DateConstraintsMorph requires a valid DateContext");
    }
    const readOnlyFields = context.readOnlyFields || [];

    const constrainedFields = shape.fields.map((field) => {
      if (!field.id) return field;
      const isReadOnly = readOnlyFields.includes(field.id) || field.readOnly;
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
  {
    pure: true,
    fusible: true,
    cost: 1,
  }
);

/**
 * DateHistoryMorph – Tracks the modification history for each field.
 * If a field's date differs from its originalDate, mark it as changed
 * and update its lastModified timestamp.
 */
export const DateHistoryMorph = createMorph<DateShape, DateShape>(
  "DateHistoryMorph",
  (shape, context) => {
    if (!isDateContext(context)) {
      throw new Error("DateHistoryMorph requires a valid DateContext");
    }
    // Default to tracking changes unless explicitly disabled.
    const trackHistory = context.trackChanges !== false;
    if (!trackHistory) return shape;

    const now = new Date().toISOString();

    const updatedFields = shape.fields.map((field) => {
      if (!field.id) return field;
      // Determine baseline date.
      const baseline =
        field.originalDate !== undefined ? field.originalDate : field.date;
      const changed = field.date !== baseline;
      return {
        ...field,
        originalDate: baseline,
        lastModified: changed ? now : field.lastModified,
        changed: changed,
      } as DateField;
    });

    return {
      ...shape,
      fields: updatedFields,
    } as DateShape;
  },
  {
    pure: false, // not pure because of timestamp changes
    fusible: true,
    cost: 2,
    description:
      "Update each field's change flag and record the baseline date and modification timestamp.",
  }
);

/**
 * DatePipeline – Composes the core field processing morphs.
 * Applies initialization, constraints, and history tracking in succession.
 */
export const DatePipeline = createPipeline<DateShape>("DatePipeline")
  .pipe(DateInitMorph)
  .pipe(DateConstraintsMorph)
  .pipe(DateHistoryMorph)
  .build({
    description:
      "Apply initial date transformations (init, constraints, history)",
    category: "form",
    tags: ["form", "fields", "init"],
    inputType: "DateShape",
    outputType: "DateShape",
  });
