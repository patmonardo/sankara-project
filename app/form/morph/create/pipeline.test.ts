import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateFormPipeline } from './pipeline';
import { CreateFormMorph, FilterFieldsMorph, SetupValidationMorph } from './create';
import { CreateFormField } from './types';

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Mock dependencies: CreateFormMorph, FilterFieldsMorph, and SetupValidationMorph
vi.mock('./create', () => ({
  CreateFormMorph: {
    transform: vi.fn((schema, context) => ({
      ...schema,
      mode: 'create',
      // For this test, return the schema as-is; optionally add initialValues handling here if needed
      fields: schema.fields
    }))
  },
  FilterFieldsMorph: {
    transform: vi.fn((schema, context) => {
      // If includeFields is provided in context.data, filter out fields not included
      if (context.data.includeFields && context.data.includeFields.length > 0) {
        return {
          ...schema,
          fields: schema.fields.filter((field: CreateFormField) =>
            context.data.includeFields.includes(field.id)
          )
        };
      }
      // Otherwise, return the original schema
      return schema;
    })
  },
  SetupValidationMorph: {
    transform: vi.fn((schema, context) => ({
      ...schema,
      fields: schema.fields.map((field: CreateFormField) => ({
        ...field,
        meta: {
          ...(field.meta || {}),
          // Add an empty validationMessages object as default
          validationMessages: field.validationMessages || {}
        }
      }))
    }))
  }
}));

describe('CreateFormPipeline', () => {
  it('should apply the FilterFieldsMorph, then CreateFormMorph, and finally SetupValidationMorph', () => {
    const schema = {
      id: 'test',
      name: 'TestForm',
      fields: [
        { id: 'name', label: 'Name', type: 'text' },
        { id: 'email', label: 'Email', type: 'email' }
      ],
      meta: {}
    };

    const timestamp = Date.now();
    const context = {
      id: 'context-test',
      timestamp,
      operation: 'create',
      data: {
        // Only include the "name" field
        includeFields: ['name'],
        initialValues: { name: 'TestName', email: 'test@example.com' }
      },
      meta: {},
      ui: {}
    };

    const result = CreateFormPipeline.run(schema, context);

    // Verify FilterFieldsMorph.transform is called
    expect(FilterFieldsMorph.transform).toHaveBeenCalledWith(schema, context);

    // Since includeFields only contains 'name', only that field should remain
    expect(result.fields).toHaveLength(1);
    expect(result.fields[0].id).toBe('name');

    // Verify CreateFormMorph.transform is called afterward
    expect(CreateFormMorph.transform).toHaveBeenCalled();
    // Verify SetupValidationMorph.transform is applied
    expect(SetupValidationMorph.transform).toHaveBeenCalled();

    // And verify that the mode is set to 'create'
    expect(result.mode).toBe('create');
  });

  it('should propagate pipeline context without failing when no includeFields provided', () => {
    const schema = {
      id: 'test2',
      name: 'TestForm2',
      fields: [
        { id: 'email', label: 'Email', type: 'email' }
      ],
      meta: {}
    };

    const context = {
      id: 'context-test-2',
      timestamp: Date.now(),
      operation: 'create',
      data: {
        // No includeFields specified, so no filtering
        initialValues: { email: 'email@example.com' }
      },
      meta: {},
      ui: {}
    };

    const result = CreateFormPipeline.run(schema, context);

    // FilterFieldsMorph should be called, and since there's no filtering, the full array is returned
    expect(FilterFieldsMorph.transform).toHaveBeenCalledWith(schema, context);
    expect(result.fields).toHaveLength(1);
    expect(result.fields[0].id).toBe('email');
    // SetupValidationMorph should still be applied
    expect(SetupValidationMorph.transform).toHaveBeenCalled();
  });
});