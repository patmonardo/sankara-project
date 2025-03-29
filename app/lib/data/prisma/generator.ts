import { DataSchema, DataEntity } from '../schema/schema';

/**
 * Generate a Prisma schema from our data schema
 */
export function generatePrismaSchema(schema: DataSchema): string {
  let prismaSchema = generatePrismaHeader();

  // Generate enums
  prismaSchema += generateEnums(schema);

  // Generate models for all entities
  for (const entityId in schema.entities) {
    const entity = schema.entities[entityId];
    prismaSchema += generateModel(entity, schema);
  }

  return prismaSchema;
}

/**
 * Generate the Prisma schema header with generator and datasource
 */
function generatePrismaHeader(): string {
  return `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // or your preferred database
  url      = env("DATABASE_URL")
}
`;
}

/**
 * Generate Prisma enum definitions from our schema
 */
function generateEnums(schema: DataSchema): string {
  let enumDefs = '';

  // Find all enum properties in entities
  const enumsMap = new Map<string, string[]>();

  // ... implementation to collect enum types ...

  // Generate enum definitions
  for (const [enumName, values] of enumsMap.entries()) {
    enumDefs += `
enum ${enumName} {
  ${values.join('\n  ')}
}
`;
  }

  return enumDefs;
}

/**
 * Generate a Prisma model for an entity
 */
function generateModel(entity: DataEntity, schema: DataSchema): string {
  const modelName = getModelName(entity);
  let modelDef = `
model ${modelName} {
  ${generateFields(entity, schema)}

  ${generateRelations(entity, schema)}
  ${generateIndexes(entity)}
}
`;

  return modelDef;
}

/**
 * Generate Prisma field definitions from entity properties
 */
function generateFields(entity: DataEntity, schema: DataSchema): string {
  let fieldDefs = '';

  // Handle ID field
  fieldDefs += `${entity.primaryKey || 'id'} String @id\n  `;

  // Generate other fields
  for (const [propName, prop] of Object.entries(entity.properties)) {
    if (propName === entity.primaryKey) continue; // Skip primary key

    fieldDefs += generateField(propName, prop);
  }

  // Add standard fields
  fieldDefs += `createdAt DateTime @default(now())\n  `;
  fieldDefs += `updatedAt DateTime @updatedAt\n  `;

  return fieldDefs;
}

/**
 * Generate a single field definition
 */
function generateField(name: string, prop: any): string {
  let fieldType = '';
  let modifiers = '';

  // Map property type to Prisma type
  switch (prop.type) {
    case 'string':
      fieldType = 'String';
      break;
    case 'number':
      fieldType = 'Float'; // or Int if appropriate
      break;
    case 'boolean':
      fieldType = 'Boolean';
      break;
    case 'date':
      fieldType = 'DateTime';
      break;
    case 'enum':
      fieldType = toPascalCase(name) + 'Enum'; // Or appropriate enum name
      break;
    case 'array':
    case 'object':
      fieldType = 'Json';
      break;
    case 'reference':
      fieldType = 'String'; // Foreign key
      break;
    default:
      fieldType = 'String';
  }

  // Add modifiers
  if (!prop.required) {
    modifiers += '?';
  }

  if (prop.default !== undefined) {
    // Format default value appropriately
    let defaultValue = '';
    if (typeof prop.default === 'string') {
      defaultValue = `"${prop.default}"`;
    } else if (typeof prop.default === 'boolean') {
      defaultValue = prop.default.toString();
    } else if (prop.default === null) {
      defaultValue = 'null';
    } else {
      defaultValue = prop.default.toString();
    }

    modifiers += ` @default(${defaultValue})`;
  }

  return `${name} ${fieldType}${modifiers}\n  `;
}

// Helper functions for model name, relations, indexes, etc.
function getModelName(entity: DataEntity): string {
  // Handle namespacing strategy
  return entity.name; // or prefixed name like `${entity.namespace}${entity.name}`
}

function generateRelations(entity: DataEntity, schema: DataSchema): string {
  // Implementation to detect and generate relations
  return '';
}

function generateIndexes(entity: DataEntity): string {
  // Implementation to generate useful indexes
  return '';
}

function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
