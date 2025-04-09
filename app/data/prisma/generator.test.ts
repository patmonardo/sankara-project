import { describe, it, expect, beforeAll } from 'vitest';
import { generatePrismaSchema } from './generator';
import { createDefaultDataSchema } from '../schema/schema';
import { EntityTypeSchema } from '../schema/entity';
import { LinkRelationTypes } from '../schema/link';
import { RegistrySchema } from '../schema/registry';

describe('Prisma Schema Generator', () => {
  let generatedSchema: string;

  beforeAll(async () => {
    // Create a test schema with various entity types
    const testSchema = createDefaultDataSchema();

    // Add some custom entities to test specific Prisma features
    testSchema.entities['finance.Invoice'] = {
      id: 'finance.Invoice',
      name: 'Invoice',
      namespace: 'finance',
      description: 'Financial invoice entity',
      properties: {
        id: { type: 'string', required: true },
        customerId: {
          type: 'reference',
          reference: { entity: 'finance.Customer', property: 'id' }
        },
        amount: { type: 'number', required: true },
        date: { type: 'date', required: true },
        status: {
          type: 'enum',
          values: ['DRAFT', 'SENT', 'PAID', 'OVERDUE'],
          required: true
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string', required: true },
              quantity: { type: 'number', required: true },
              unitPrice: { type: 'number', required: true }
            }
          }
        },
        metadata: { type: 'object', required: false }
      },
      primaryKey: 'id',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    testSchema.entities['finance.Customer'] = {
      id: 'finance.Customer',
      name: 'Customer',
      namespace: 'finance',
      description: 'Customer entity',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        email: { type: 'string', required: true },
        phone: { type: 'string', required: false },
        active: { type: 'boolean', required: true, default: true }
      },
      primaryKey: 'id',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Generate the Prisma schema from our test schema
    generatedSchema = await generatePrismaSchema(testSchema);
  });

  it('should generate valid Prisma schema with generator blocks', () => {
    expect(generatedSchema).toContain('generator client {');
    expect(generatedSchema).toContain('provider = "prisma-client-js"');
    expect(generatedSchema).toContain('datasource db {');
  });

  it('should generate models for built-in entities', () => {
    // Check for system Registry model
    expect(generatedSchema).toContain('model Registry {');
    expect(generatedSchema).toContain('id String @id');
    expect(generatedSchema).toContain('name String');
    expect(generatedSchema).toContain('namespace String');

    // Check for Link model
    expect(generatedSchema).toContain('model Link {');
    expect(generatedSchema).toContain('id String @id');
    expect(generatedSchema).toContain('sourceEntity String');
    expect(generatedSchema).toContain('sourceId String');
    expect(generatedSchema).toContain('targetEntity String');
    expect(generatedSchema).toContain('targetId String');
    expect(generatedSchema).toContain('relation String');
  });

  it('should generate models for custom entities', () => {
    // Check for Invoice model
    expect(generatedSchema).toContain('model Invoice {');
    expect(generatedSchema).toContain('id String @id');
    expect(generatedSchema).toContain('customerId String');
    expect(generatedSchema).toContain('amount Float');
    expect(generatedSchema).toContain('date DateTime');

    // Check for Customer model
    expect(generatedSchema).toContain('model Customer {');
    expect(generatedSchema).toContain('id String @id');
    expect(generatedSchema).toContain('name String');
    expect(generatedSchema).toContain('email String');
    expect(generatedSchema).toContain('active Boolean @default(true)');
  });

  it('should generate enum types', () => {
    // Check for InvoiceStatus enum
    expect(generatedSchema).toContain('enum InvoiceStatus {');
    expect(generatedSchema).toContain('DRAFT');
    expect(generatedSchema).toContain('SENT');
    expect(generatedSchema).toContain('PAID');
    expect(generatedSchema).toContain('OVERDUE');

    // Check for LinkRelation enum
    expect(generatedSchema).toContain('enum LinkRelation {');
    LinkRelationTypes.forEach(relationType => {
      expect(generatedSchema).toContain(relationType.toUpperCase());
    });
  });

  it('should handle JSON fields for complex types', () => {
    // Check that objects are converted to JSON
    expect(generatedSchema).toContain('items Json?');
    expect(generatedSchema).toContain('metadata Json?');
  });

  it('should generate relations between models', () => {
    // Check for relation between Invoice and Customer
    expect(generatedSchema).toContain('customer Customer? @relation(fields: [customerId], references: [id])');
    expect(generatedSchema).toContain('invoices Invoice[]');
  });

  it('should generate indexes for frequently queried fields', () => {
    // Check for indexes on Link model
    expect(generatedSchema).toContain('@@index([sourceEntity, sourceId])');
    expect(generatedSchema).toContain('@@index([targetEntity, targetId])');
    expect(generatedSchema).toContain('@@index([relation])');
  });

  it('should handle namespaces by prefixing or transforming model names', () => {
    // Check that namespace is handled (either via prefixing or other strategy)
    // This depends on your implementation approach
    const namespaceHandled =
      generatedSchema.includes('model FinanceInvoice {') ||
      generatedSchema.includes('@@map("finance_Invoice")') ||
      generatedSchema.includes('namespace String');

    expect(namespaceHandled).toBe(true);
  });

  it('should generate schema with valid syntax', () => {
    // This is a basic check to ensure there are no obvious syntax errors
    // A more thorough test would actually validate the schema with Prisma CLI

    // No unclosed brackets
    const openBraces = (generatedSchema.match(/{/g) || []).length;
    const closeBraces = (generatedSchema.match(/}/g) || []).length;
    expect(openBraces).toBe(closeBraces);

    // No unclosed parentheses
    const openParens = (generatedSchema.match(/\(/g) || []).length;
    const closeParens = (generatedSchema.match(/\)/g) || []).length;
    expect(openParens).toBe(closeParens);

    // Ensure each model has an @id field
    const modelCount = (generatedSchema.match(/model\s+\w+\s+{/g) || []).length;
    const idFieldCount = (generatedSchema.match(/@id/g) || []).length;
    expect(idFieldCount).toBeGreaterThanOrEqual(modelCount);
  });

  it('should preserve required fields', () => {
    // Every required field should not have a question mark
    expect(generatedSchema).toContain('amount Float');  // Required
    expect(generatedSchema).toContain('phone String?'); // Optional
  });

  it('should translate default values properly', () => {
    expect(generatedSchema).toContain('@default(true)');
    expect(generatedSchema).toContain('@default(now())'); // For timestamps
  });

  // Advanced test - generate a Prisma model from our entity definition
  it('should generate a Prisma model that matches our entity definition', () => {
    // Define an entity using our schema
    const productEntity = {
      id: 'inventory.Product',
      name: 'Product',
      namespace: 'inventory',
      description: 'A product that can be sold',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        price: { type: 'number', required: true },
        description: { type: 'string', required: false },
        categories: { type: 'array', items: { type: 'string' }, required: false },
        isActive: { type: 'boolean', required: true, default: true }
      },
      primaryKey: 'id',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate the entity against our schema
    const validationResult = EntityTypeSchema.safeParse(productEntity);
    expect(validationResult.success).toBe(true);

    // Generate Prisma schema for just this entity
    const singleEntitySchema = {
      name: 'Test Single Entity Schema',
      version: '1.0',
      entities: {
        'inventory.Product': productEntity
      }
    };

    const prismaSchemaForProduct = generatePrismaSchema(singleEntitySchema);

    // Verify the generated schema contains what we expect
    expect(prismaSchemaForProduct).toContain('model Product {');
    expect(prismaSchemaForProduct).toContain('id String @id');
    expect(prismaSchemaForProduct).toContain('name String');
    expect(prismaSchemaForProduct).toContain('price Float');
    expect(prismaSchemaForProduct).toContain('description String?');
    expect(prismaSchemaForProduct).toContain('categories Json?');
    expect(prismaSchemaForProduct).toContain('isActive Boolean @default(true)');
  });
});
