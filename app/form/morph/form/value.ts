import { createMorph, createPipeline } from "../core";
import { FormShape, FormField } from "./types";
import { FormContext } from "./types";

/**
 * ValueField – Extends the base FormField with runtime state.
 */
export interface ValueField extends FormField {
  value?: any;
  originalValue?: any;
  displayValue?: string;
  changed?: boolean;
  lastModified?: string;
}

/**
 * ValueShape – A FormShape that contains ValueFields.
 */
export interface ValueShape extends FormShape {
  fields: ValueField[];
}

/**
 * ValueContext – Context for field processing.
 */
export interface ValueContext extends FormContext {
  updateValues?: Record<string, any>;
  trackChanges?: boolean;
  readOnlyFields?: string[];
  createOnlyFields?: string[];
  editOnlyFields?: string[];
}

/**
 * Type guard to check if context is a valid ValueContext.
 */
export function isValueContext(context: any): context is ValueContext {
  return true;
}

/**
 * Helper function to get the initial value for a field.
 * Priority is:
 * 1. context.updateValues (if provided and contains this field)
 * 2. The field's current `value`
 * 3. The field's `defaultValue`
 */
function getInitialValueField(field: ValueField, context: ValueContext): any {
  if (context.updateValues && field.id in context.updateValues) {
    return context.updateValues[field.id];
  }
  if (field.value !== undefined) {
    return field.value;
  }
  return field.defaultValue;
}

/**
 * ValueInitMorph – Ensures each field in the shape obtains a proper initial value.
 * Also sets defaults for display, inputType, and basic flags.
 */
export const ValueInitMorph = createMorph<ValueShape, ValueShape>(
  "ValueInitMorph",
  (shape, context) => {
    if (!isValueContext(context)) {
      throw new Error("ValueInitMorph requires a valid ValueContext");
    }

    const initValues: ValueField[] = shape.fields.map((field) => {
      // Skip fields without an identifier.
      if (!field.id) return field;

      const initValue = getInitialValueField(field, context);
      const displayVal = field.displayValue || String(initValue);

      const updatedField ={
        ...field,
        value: initValue,
        originalValue: initValue,
        displayValue: displayVal,
        inputType: field.inputType || field.type,
        visible: field.visible !== undefined ? field.visible : true,
        disabled: field.disabled !== undefined ? field.disabled : false,
        readOnly: field.readOnly !== undefined ? field.readOnly : false,
      };
      return updatedField as ValueField;
    });

    return {
      ...shape,
      fields: initValues,
    } as ValueShape;
  },
  {
    pure: true,
    fusible: true,
    cost: 1,
  }
);

/**
 * ValueConstraintsMorph – Applies field-level constraints:
 * marks fields as read-only if designated, and could be expanded for other rules.
 */
export const ValueConstraintsMorph = createMorph<ValueShape, ValueShape>(
  "ValueConstraintsMorph",
  (shape, context) => {
    if (!isValueContext(context)) {
      throw new Error("ValueConstraintsMorph requires a valid ValueContext");
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
 * ValueHistoryMorph – Tracks the modification history for each field.
 * If a field's value differs from its originalValue, mark it as changed
 * and update its lastModified timestamp.
 */
export const ValueHistoryMorph = createMorph<ValueShape, ValueShape>(
  "ValueHistoryMorph",
  (shape, context) => {
    if (!isValueContext(context)) {
      throw new Error("ValueHistoryMorph requires a valid ValueContext");
    }
    // Default to tracking changes unless explicitly disabled.
    const trackHistory = context.trackChanges !== false;
    if (!trackHistory) return shape;

    const now = new Date().toISOString();

    const updatedFields = shape.fields.map((field) => {
      if (!field.id) return field;
      // Determine baseline value.
      const baseline =
        field.originalValue !== undefined ? field.originalValue : field.value;
      const changed = field.value !== baseline;
      return {
        ...field,
        originalValue: baseline,
        lastModified: changed ? now : field.lastModified,
        changed: changed,
      } as ValueField;
    });

    return {
      ...shape,
      fields: updatedFields,
    } as ValueShape;
  },
  {
    pure: false, // not pure because of timestamp changes
    fusible: true,
    cost: 2,
    description:
      "Update each field's change flag and record the baseline value and modification timestamp.",
  }
);

/**
 * ValuePipeline – Composes the core field processing morphs.
 * Applies initialization, constraints, and history tracking in succession.
 */
export const ValuePipeline = createPipeline<ValueShape>("ValuePipeline")
  .pipe(ValueInitMorph)
  .pipe(ValueConstraintsMorph)
  .pipe(ValueHistoryMorph)
  .build({
    description:
      "Apply initial value transformations (init, constraints, history)",
    category: "form",
    tags: ["form", "fields", "init"],
    inputType: "ValueShape",
    outputType: "ValueShape",
  });
