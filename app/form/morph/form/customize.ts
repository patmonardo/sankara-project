import { FormShape } from "../../schema/shape";
import { createMorph } from "../core";
import {
  ViewFormField,
  ViewFormShape,
  ViewFormContext,
  isViewFormContext,
} from "./types";

export interface CustomizedViewShape extends ViewFormShape {
  customizedFields: CustomizedViewField[];
  fieldsInitialized: string[];
  meta: FormShape["meta"] & {
    mode: "create";
    timestamp: string;
    title?: string;
    customConfigApplied?: boolean;
    customComponentsApplied?: boolean;
    appliedComponentTypes?: string[];
  };
}

export interface CustomizedViewField extends ViewFormField {
  component: string;
  props: Record<string, any>;
  customType?: string;
  customized: boolean;
  customizedAt: string;
}

/**
 * Extend the ViewFormContext for customization.
 * Here you can supply overrides either as field configurations or field transformers.
 */
export interface CustomizedViewContext extends ViewFormContext {
  /**
   * Field configuration overrides.
   * For each field (by id), you can override properties like label, type, etc.
   */
  fieldConfigs?: Record<string, Partial<ViewFormField>>;
  /**
   * Field transformers: functions that take a raw field and return a customized field.
   * The key is typically the field’s customType or type.
   */
  fieldTransformers?: Record<string, (field: ViewFormField) => CustomizedViewField>;
  /**
   * A simple component mapping (e.g. field type "datepicker" becomes "DatePicker")
   * which will be converted into transformer functions.
   */
  components?: Record<string, string>;
}

/**
 * Default field transformers for a few common field types.
 * These functions assign a component name and basic properties, so that
 * downstream rendering (e.g. building JSX elements) can occur.
 */
export const defaultFieldTransformers: Record<string, (field: CustomizedViewField) => CustomizedViewField> = {
  signature: (field) => ({
    ...field,
    component: "SignaturePad",
    props: {
      ...(field.props || {}),
      onChange: `{{handlers.onChange}}`,
      initialValue: field.value,
    },
  }),
  richtext: (field) => ({
    ...field,
    component: "RichTextEditor",
    props: {
      ...(field.props || {}),
      toolbar: (field as any).toolbar || ["bold", "italic"],
      initialHtml: (field as any).initialHtml || "",
      onChange: `{{handlers.onChange}}`,
    },
  }),
  datepicker: (field) => ({
    ...field,
    component: "DatePicker",
    props: {
      ...(field.props || {}),
      format: (field as any).dateFormat || "yyyy-MM-dd",
      showTimeSelect: (field as any).showTimeSelect || false,
      onChange: `{{handlers.onChange}}`,
      value: field.value,
    },
  }),
  autocomplete: (field) => ({
    ...field,
    component: "Autocomplete",
    props: {
      ...(field.props || {}),
      options: (field as any).options || [],
      searchable: true,
      clearable: !field.required,
      onChange: `{{handlers.onChange}}`,
      value: field.value,
    },
  }),
};

/**
 * Helper: convert a straightforward components mapping (string values) into transformer functions.
 */
function convertComponentsToTransformers(
  components: Record<string, string>
): Record<string, (field: CustomizedViewField) => CustomizedViewField> {
  const out: Record<string, (field: CustomizedViewField) => CustomizedViewField> = {};
  Object.entries(components).forEach(([key, compName]) => {
    out[key] = (field: CustomizedViewField) => ({
      ...field,
      component: compName,
      props: {
        ...(field.props || {}),
        onChange: `{{handlers.onChange}}`,
        value: field.value,
      },
    });
  });
  return out;
}

/**
 * CustomizedFieldsMorph
 *
 * This morph applies any field configuration overrides and then
 * uses a set of transformer functions (from defaults, context, or a component mapping)
 * to translate a raw ViewFormField into a field that is ready for rendering.
 *
 * The downstream renderer will convert these customized fields into JSX (or another UI format).
 */
export const CustomizedFieldsMorph = createMorph<CustomizedViewShape, CustomizedViewShape>(
  "CustomizedFieldsMorph",
  (shape, context: CustomizedViewContext) => {
    if (!isViewFormContext(context)) return shape;

    // 1) First, apply field configuration overrides if provided.
    let fields = shape.fields.map((field) => {
      if (!field.id || !context.fieldConfigs || !context.fieldConfigs[field.id]) {
        return field;
      }
      const cfg = context.fieldConfigs[field.id];
      return {
        ...field,
        ...cfg,
        customized: true,
        customizedAt: new Date().toISOString(),
      };
    });

    // 2) Prepare the transformer functions by merging:
    //    - Default transformers,
    //    - Any provided transformer functions, and
    //    - A conversion of any simple component mappings.
    const transformers: Record<string, (field: CustomizedViewField) => CustomizedViewField> = {
      ...defaultFieldTransformers,
      ...(context.fieldTransformers || {}),
      ...(context.components ? convertComponentsToTransformers(context.components) : {}),
    };

    // 3) Use transformers to customize each field.
    const appliedTypes: string[] = [];
    fields = fields.map((field) => {
      if (!field.id) return field;
      let transformer: ((f: CustomizedViewField) => CustomizedViewField) | undefined;
      const key = field.customType || field.type;
      if (transformers[key]) {
        transformer = transformers[key];
        appliedTypes.push(key);
      }
      if (transformer) {
        try {
          return transformer(field);
        } catch (error) {
          console.warn(`Error applying transformer for field ${field.id}:`, error);
          return field;
        }
      }
      return field;
    });

    // 4) Return the customized shape with a minimal meta update.
    return {
      ...shape,
      fields,
      meta: {
        ...(shape.meta || {}),
        customComponentsApplied: appliedTypes.length > 0,
        appliedComponentTypes: Array.from(new Set(appliedTypes)),
        customizedAt: new Date().toISOString(),
      },
    };
  },
  {
    pure: false,
    fusible: true,
    cost: 2,
  }
);