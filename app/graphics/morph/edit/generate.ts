import { SimpleMorph } from "../morph";
import { FormShape, FormField } from "../../schema/form";
import { TransformContext } from "../../schema/transform";

/**
 * Create input parameters
 *
 * The initial specification for generating a form
 */
export interface CreateInput {
  id?: string;
  schemaId: string;
  initialValues?: Record<string, any>;
  meta?: Record<string, any>;
}

/**
 * Prepared field for creation
 *
 * A field prepared for inclusion in a creation form
 */
export interface PreparedField {
  id: string;
  label: string;
  type: string;
  inputType: string;
  defaultValue: any;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    customValidator?: string;
  };
  meta?: Record<string, any>;
}

/**
 * Prepared creation form
 *
 * The assembled specification for a creation form
 */
export interface PreparedCreate {
  id: string;
  schemaId: string;
  fields: PreparedField[];
  meta?: Record<string, any>;
}

/**
 * Create output
 *
 * The final form ready for creation UI rendering
 */
export interface CreateOutput {
  id: string;
  fields: FormField[];
  mode: 'create';
  meta?: Record<string, any>;
  format: string;
}

/**
 * PrepareCreateMorph - Prepares fields for a creation form
 *
 * This morphism is the first step in the ascent from input to creation form,
 * preparing the fields that will be used for data entry.
 */
export const PrepareCreateMorph = new SimpleMorph<CreateInput, PreparedCreate>(
  "PrepareCreateMorph",
  (input: CreateInput, context: TransformContext) => {
    // Get schema definition from context or service
    const schema = context.schemas?.[input.schemaId] || {
      fields: []
    };

    // Prepare each field with appropriate input controls
    const fields = schema.fields.map(schemaField => {
      const initialValue = input.initialValues?.[schemaField.id] ?? schemaField.defaultValue;

      return {
        id: schemaField.id,
        label: schemaField.label || schemaField.id,
        type: schemaField.type,
        inputType: determineInputType(schemaField),
        defaultValue: initialValue,
        validation: {
          required: schemaField.required,
          min: schemaField.min,
          max: schemaField.max,
          pattern: schemaField.pattern,
          customValidator: schemaField.customValidator
        },
        meta: {
          ...schemaField.meta,
          schema: true
        }
      };
    });

    return {
      id: input.id || `create_${input.schemaId}_${Date.now()}`,
      schemaId: input.schemaId,
      fields,
      meta: {
        ...input.meta,
        creationTime: new Date().toISOString()
      }
    };
  },
  // Optimization metadata
  {
    pure: false, // Depends on schema context
    fusible: true,
    cost: 2 // Moderate cost for schema processing
  }
);

/**
 * CreateOutputMorph - Transforms prepared creation into final output
 *
 * This morphism completes the ascent to the creation form by transforming
 * the prepared specification into its final manifestation.
 */
export const CreateOutputMorph = new SimpleMorph<PreparedCreate, CreateOutput>(
  "CreateOutputMorph",
  (input: PreparedCreate, context: TransformContext) => {
    // Transform prepared fields into form fields
    const fields = input.fields.map(field => ({
      id: field.id,
      label: field.label,
      type: field.type,
      inputType: field.inputType,
      value: field.defaultValue,
      required: field.validation?.required || false,
      validation: field.validation,
      readOnly: false,
      interactive: true,
      visible: true,
      meta: field.meta
    }));

    // Construct the create output
    return {
      id: input.id,
      fields,
      mode: 'create',
      meta: {
        ...input.meta,
        schemaId: input.schemaId
      },
      format: context.format || 'jsx'
    };
  },
  // Optimization metadata
  {
    pure: true,
    fusible: true,
    cost: 1 // Low cost for transformation
  }
);

/**
 * Helper to determine the best input type for a schema field
 *
 * This pure function mediates between the field's essential nature
 * and its appropriate input control.
 */
export function determineInputType(schemaField: any): string {
  // If the field has an explicit input type, use it
  if (schemaField.inputType) {
    return schemaField.inputType;
  }

  // Otherwise, infer from the field type
  switch (schemaField.type) {
    case 'text':
    case 'string':
      if (schemaField.multiline) {
        return 'textarea';
      }
      return 'text';

    case 'number':
      if (schemaField.step) {
        return 'numberWithStepper';
      }
      return 'number';

    case 'boolean':
      return 'checkbox';

    case 'date':
      return 'datepicker';

    case 'datetime':
      return 'datetimepicker';

    case 'email':
      return 'email';

    case 'url':
      return 'url';

    case 'select':
    case 'dropdown':
      if (schemaField.options?.length > 10) {
        return 'searchableSelect';
      }
      return 'select';

    case 'multiselect':
      return 'multiselect';

    case 'file':
      return 'fileUpload';

    case 'image':
      return 'imageUpload';

    case 'richtext':
    case 'html':
      return 'richTextEditor';

    case 'password':
      return 'password';

    case 'json':
    case 'object':
      return 'jsonEditor';

    case 'array':
      return 'arrayEditor';

    default:
      return 'text'; // Fallback to plain text
  }
}

/**
 * Category-theoretic composition of create morphs
 *
 * This function represents the categorical composition of two morphs,
 * preserving the algebraic properties of the transformation.
 */
export function composeCreateMorphs<A, B, C>(
  first: SimpleMorph<A, B>,
  second: SimpleMorph<B, C>
): SimpleMorph<A, C> {
  return new SimpleMorph<A, C>(
    `${first.name}_then_${second.name}`,
    (input, context: TransformContext) => second.apply(first.apply(input, context), context),
    {
      pure: first.optimizationMetadata?.pure !== false &&
            second.optimizationMetadata?.pure !== false,
      fusible: first.optimizationMetadata?.fusible &&
               second.optimizationMetadata?.fusible,
      cost: (first.optimizationMetadata?.cost || 0) +
            (second.optimizationMetadata?.cost || 0)
    }
  );
}

/**
 * Direct creation from input to output
 *
 * This combined morph performs the complete transformation from
 * creation input to final output.
 */
export const InputToCreateMorph = new SimpleMorph<CreateInput, CreateOutput>(
  "InputToCreateMorph",
  (input: CreateInput, context: TransformContext) => {
    // Get schema definition from context or service
    const schema = context.schemas?.[input.schemaId] || {
      fields: []
    };

    // Transform directly from input to output for efficiency
    const fields = schema.fields.map(schemaField => {
      const initialValue = input.initialValues?.[schemaField.id] ?? schemaField.defaultValue;
      const inputType = determineInputType(schemaField);

      return {
        id: schemaField.id,
        label: schemaField.label || schemaField.id,
        type: schemaField.type,
        inputType,
        value: initialValue,
        required: schemaField.required || false,
        validation: {
          required: schemaField.required,
          min: schemaField.min,
          max: schemaField.max,
          pattern: schemaField.pattern,
          customValidator: schemaField.customValidator
        },
        readOnly: false,
        interactive: true,
        visible: true,
        meta: {
          ...schemaField.meta,
          schema: true
        }
      };
    });

    return {
      id: input.id || `create_${input.schemaId}_${Date.now()}`,
      fields,
      mode: 'create',
      meta: {
        ...input.meta,
        schemaId: input.schemaId,
        creationTime: new Date().toISOString()
      },
      format: context.format || 'jsx'
    };
  },
  // Optimization metadata
  {
    pure: false, // Depends on schema context
    fusible: false, // Already fused
    cost: 3 // Combined cost
  }
);

// Pre-composed morphs for common transformations
export const InputToCreateFormMorph = composeCreateMorphs(
  PrepareCreateMorph,
  CreateOutputMorph
);
