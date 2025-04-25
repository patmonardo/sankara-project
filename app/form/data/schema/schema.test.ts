import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  DataTypes,
  PropertyTypeSchema,
  ObjectSchema,
  ArraySchema,
  EnumPropertySchema,
  ReferencePropertySchema,
  PropertySchema,
  EntitySchema,
  DataSchema,
  createDefaultDataSchema,
  validateDataAgainstSchema
} from './schema';

describe('Schema System', () => {
  describe('PropertyTypeSchema', () => {
    it('should validate valid property types', () => {
      DataTypes.forEach(type => {
        const result = PropertyTypeSchema.safeParse(type);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid property types', () => {
      const result = PropertyTypeSchema.safeParse('invalid-type');
      expect(result.success).toBe(false);
    });
  });

  describe('PropertySchema', () => {
    it('should validate a string property', () => {
      const stringProp = {
        type: 'string',
        required: true,
        default: 'Default value',
        description: 'A string property'
      };

      const result = PropertySchema.safeParse(stringProp);
      expect(result.success).toBe(true);
    });

    it('should validate a number property', () => {
      const numberProp = {
        type: 'number',
        required: true,
        min: 0,
        max: 100,
        default: 50
      };

      const result = PropertySchema.safeParse(numberProp);
      expect(result.success).toBe(true);
    });

    it('should validate a boolean property', () => {
      const boolProp = {
        type: 'boolean',
        required: false,
        default: false
      };

      const result = PropertySchema.safeParse(boolProp);
      expect(result.success).toBe(true);
    });

    it('should validate a date property', () => {
      const dateProp = {
        type: 'date',
        required: true
      };

      const result = PropertySchema.safeParse(dateProp);
      expect(result.success).toBe(true);
    });
  });

  describe('ObjectSchema', () => {
    it('should validate an object property', () => {
      const objectProp = {
        type: 'object',
        properties: {
          name: { type: 'string', required: true },
          age: { type: 'number', required: false }
        }
      };

      const result = ObjectSchema.safeParse(objectProp);
      expect(result.success).toBe(true);
    });

    it('should reject an object without properties', () => {
      const invalidObj = {
        type: 'object'
        // Missing properties
      };

      const result = ObjectSchema.safeParse(invalidObj);
      expect(result.success).toBe(false);
    });
  });

  describe('ArraySchema', () => {
    it('should validate an array of strings', () => {
      const arrayProp = {
        type: 'array',
        items: { type: 'string' }
      };

      const result = ArraySchema.safeParse(arrayProp);
      expect(result.success).toBe(true);
    });

    it('should validate an array of objects', () => {
      const arrayProp = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', required: true },
            value: { type: 'number', required: true }
          }
        }
      };

      const result = ArraySchema.safeParse(arrayProp);
      expect(result.success).toBe(true);
    });

    it('should reject an array without items', () => {
      const invalidArray = {
        type: 'array'
        // Missing items definition
      };

      const result = ArraySchema.safeParse(invalidArray);
      expect(result.success).toBe(false);
    });
  });

  describe('EnumPropertySchema', () => {
    it('should validate an enum property', () => {
      const enumProp = {
        type: 'enum',
        values: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
        default: 'DRAFT'
      };

      const result = EnumPropertySchema.safeParse(enumProp);
      expect(result.success).toBe(true);
    });

    it('should reject an enum without values', () => {
      const invalidEnum = {
        type: 'enum'
        // Missing values
      };

      const result = EnumPropertySchema.safeParse(invalidEnum);
      expect(result.success).toBe(false);
    });

    it('should reject an enum with empty values', () => {
      const invalidEnum = {
        type: 'enum',
        values: []
      };

      const result = EnumPropertySchema.safeParse(invalidEnum);
      expect(result.success).toBe(false);
    });
  });

  describe('ReferencePropertySchema', () => {
    it('should validate a reference property', () => {
      const refProp = {
        type: 'reference',
        reference: {
          entity: 'Customer',
          property: 'id'
        }
      };

      const result = ReferencePropertySchema.safeParse(refProp);
      expect(result.success).toBe(true);
    });

    it('should reject a reference without entity info', () => {
      const invalidRef = {
        type: 'reference'
        // Missing reference object
      };

      const result = ReferencePropertySchema.safeParse(invalidRef);
      expect(result.success).toBe(false);
    });
  });

  describe('EntitySchema', () => {
    it('should validate a complete entity schema', () => {
      const entity = {
        name: 'Invoice',
        namespace: 'finance',
        description: 'An invoice entity',
        properties: {
          id: { type: 'string', required: true },
          customerRef: {
            type: 'reference',
            reference: { entity: 'Customer', property: 'id' }
          },
          amount: { type: 'number', required: true },
          date: { type: 'date', required: true },
          status: {
            type: 'enum',
            values: ['DRAFT', 'SENT', 'PAID', 'OVERDUE'],
            default: 'DRAFT'
          },
          lineItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product: { type: 'string', required: true },
                quantity: { type: 'number', required: true },
                price: { type: 'number', required: true }
              }
            }
          }
        },
        primaryKey: 'id'
      };

      const result = EntitySchema.safeParse(entity);
      expect(result.success).toBe(true);
    });

    it('should reject an entity without properties', () => {
      const invalidEntity = {
        name: 'Invoice',
        namespace: 'finance'
        // Missing properties
      };

      const result = EntitySchema.safeParse(invalidEntity);
      expect(result.success).toBe(false);
    });
  });

  describe('DataSchema', () => {
    it('should validate a complete data schema', () => {
      const schema = {
        name: 'Finance System',
        version: '1.0.0',
        description: 'Schema for finance system',
        entities: {
          'finance.Customer': {
            name: 'Customer',
            namespace: 'finance',
            properties: {
              id: { type: 'string', required: true },
              name: { type: 'string', required: true },
              email: { type: 'string', required: true }
            },
            primaryKey: 'id'
          },
          'finance.Invoice': {
            name: 'Invoice',
            namespace: 'finance',
            properties: {
              id: { type: 'string', required: true },
              customerId: {
                type: 'reference',
                reference: { entity: 'finance.Customer', property: 'id' }
              },
              amount: { type: 'number', required: true }
            },
            primaryKey: 'id'
          }
        }
      };

      const result = DataSchema.safeParse(schema);
      expect(result.success).toBe(true);
    });

    it('should reject a schema without entities', () => {
      const invalidSchema = {
        name: 'Invalid Schema',
        version: '1.0.0'
        // Missing entities
      };

      const result = DataSchema.safeParse(invalidSchema);
      expect(result.success).toBe(false);
    });
  });

  describe('createDefaultDataSchema', () => {
    it('should create a default schema with basic entities', () => {
      const defaultSchema = createDefaultDataSchema();

      expect(defaultSchema.name).toBeDefined();
      expect(defaultSchema.version).toBeDefined();
      expect(defaultSchema.entities).toBeDefined();

      // Check for some expected entities
      expect(defaultSchema.entities['system.Entity']).toBeDefined();
      expect(defaultSchema.entities['system.Registry']).toBeDefined();
      expect(defaultSchema.entities['system.Link']).toBeDefined();
    });
  });

  describe('validateDataAgainstSchema', () => {
    it('should validate data against an entity schema', () => {
      // Define a simple schema
      const customerSchema = {
        name: 'Customer',
        namespace: 'finance',
        properties: {
          id: { type: 'string', required: true },
          name: { type: 'string', required: true },
          email: { type: 'string', required: true },
          phone: { type: 'string', required: false },
          status: {
            type: 'enum',
            values: ['ACTIVE', 'INACTIVE', 'PENDING'],
            default: 'PENDING'
          }
        },
        primaryKey: 'id'
      };

      // Valid data
      const validData = {
        id: 'CUST-001',
        name: 'ACME Corp',
        email: 'info@acme.com',
        status: 'ACTIVE'
      };

      const result = validateDataAgainstSchema(validData, customerSchema);
      expect(result.success).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should report validation errors for invalid data', () => {
      // Define a schema with constraints
      const productSchema = {
        name: 'Product',
        namespace: 'inventory',
        properties: {
          id: { type: 'string', required: true },
          name: { type: 'string', required: true, minLength: 3 },
          price: { type: 'number', required: true, min: 0 },
          categories: {
            type: 'array',
            items: { type: 'string' },
            required: true
          }
        },
        primaryKey: 'id'
      };

      // Invalid data
      const invalidData = {
        id: 'P1',
        name: 'A', // Too short
        price: -10, // Negative price
        // Missing categories
      };

      const result = validateDataAgainstSchema(invalidData, productSchema);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.name).toBeDefined();
      expect(result.errors.price).toBeDefined();
      expect(result.errors.categories).toBeDefined();
    });

    it('should validate nested object structures', () => {
      // Define a schema with nested objects
      const orderSchema = {
        name: 'Order',
        namespace: 'sales',
        properties: {
          id: { type: 'string', required: true },
          customer: {
            type: 'object',
            properties: {
              id: { type: 'string', required: true },
              name: { type: 'string', required: true }
            },
            required: true
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string', required: true },
                quantity: { type: 'number', required: true, min: 1 },
                price: { type: 'number', required: true }
              }
            },
            required: true
          }
        },
        primaryKey: 'id'
      };

      // Valid nested data
      const validData = {
        id: 'ORD-001',
        customer: {
          id: 'CUST-001',
          name: 'ACME Corp'
        },
        items: [
          {
            productId: 'PROD-001',
            quantity: 2,
            price: 29.99
          },
          {
            productId: 'PROD-002',
            quantity: 1,
            price: 49.99
          }
        ]
      };

      const result = validateDataAgainstSchema(validData, orderSchema);
      expect(result.success).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('Schema Integration', () => {
    it('should create a schema with circular references', () => {
      // This tests that circular references don't cause infinite recursion
      const schema = {
        name: 'Circular Reference Test',
        version: '1.0.0',
        entities: {
          'system.Employee': {
            name: 'Employee',
            namespace: 'system',
            properties: {
              id: { type: 'string', required: true },
              name: { type: 'string', required: true },
              managerId: {
                type: 'reference',
                reference: { entity: 'system.Employee', property: 'id' }
              },
              departmentId: {
                type: 'reference',
                reference: { entity: 'system.Department', property: 'id' }
              }
            },
            primaryKey: 'id'
          },
          'system.Department': {
            name: 'Department',
            namespace: 'system',
            properties: {
              id: { type: 'string', required: true },
              name: { type: 'string', required: true },
              managerId: {
                type: 'reference',
                reference: { entity: 'system.Employee', property: 'id' }
              }
            },
            primaryKey: 'id'
          }
        }
      };

      const result = DataSchema.safeParse(schema);
      expect(result.success).toBe(true);
    });

    it('should generate a Zod schema from entity definition', () => {
      // Define a product schema
      const productSchema = {
        name: 'Product',
        namespace: 'inventory',
        properties: {
          id: { type: 'string', required: true },
          name: { type: 'string', required: true },
          price: { type: 'number', required: true, min: 0 },
          inStock: { type: 'boolean', default: true },
          categories: {
            type: 'array',
            items: { type: 'string' },
            required: false
          }
        },
        primaryKey: 'id'
      };

      // Create a Zod schema dynamically
      const zodSchema = generateZodSchema(productSchema);

      // Test valid data
      const validData = {
        id: 'PROD-001',
        name: 'Widget',
        price: 29.99,
        categories: ['Electronics', 'Gadgets']
      };

      const validationResult = zodSchema.safeParse(validData);
      expect(validationResult.success).toBe(true);

      // Test invalid data
      const invalidData = {
        id: 'PROD-002',
        name: 'Gizmo',
        price: -5, // Invalid price
      };

      const invalidResult = zodSchema.safeParse(invalidData);
      expect(invalidResult.success).toBe(false);
    });
  });
});

// Helper function to generate a Zod schema from an entity definition
function generateZodSchema(entity: any) {
  const schemaObj: Record<string, any> = {};

  // Process each property
  Object.entries(entity.properties).forEach(([key, prop]: [string, any]) => {
    let zodType: any;

    switch (prop.type) {
      case 'string':
        zodType = z.string();
        if (prop.minLength) zodType = zodType.min(prop.minLength);
        if (prop.maxLength) zodType = zodType.max(prop.maxLength);
        break;

      case 'number':
        zodType = z.number();
        if (prop.min !== undefined) zodType = zodType.min(prop.min);
        if (prop.max !== undefined) zodType = zodType.max(prop.max);
        break;

      case 'boolean':
        zodType = z.boolean();
        break;

      case 'date':
        zodType = z.date();
        break;

      case 'enum':
        if (prop.values && Array.isArray(prop.values)) {
          zodType = z.enum(prop.values as [string, ...string[]]);
        } else {
          zodType = z.string();
        }
        break;

      case 'array':
        const itemType = prop.items?.type || 'string';
        let elementType = z.string();

        if (itemType === 'number') elementType = z.number();
        if (itemType === 'boolean') elementType = z.boolean();
        if (itemType === 'object' && prop.items.properties) {
          const nestedSchema = generateZodSchema({ properties: prop.items.properties });
          elementType = nestedSchema;
        }

        zodType = z.array(elementType);
        break;

      case 'object':
        if (prop.properties) {
          zodType = generateZodSchema({ properties: prop.properties });
        } else {
          zodType = z.record(z.any());
        }
        break;

      case 'reference':
        zodType = z.string();
        break;

      default:
        zodType = z.any();
    }

    // Make required or optional
    if (prop.required) {
      schemaObj[key] = zodType;
    } else {
      schemaObj[key] = zodType.optional();
    }

    // Add default if provided
    if (prop.default !== undefined) {
      schemaObj[key] = schemaObj[key].default(prop.default);
    }
  });

  return z.object(schemaObj);
}
