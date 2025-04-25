import { z } from 'zod';
import { BaseSchema, BaseStateSchema } from './base';

/**
 * Data Types - The fundamental categories of immediate being
 */
export const DataTypes = [
  'string',   // Nominal being
  'number',   // Quantitative being
  'boolean',  // Binary being
  'date',     // Temporal being
  'object',   // Composite being
  'array',    // Multiple being
  'reference', // Relational being
  'enum',     // Categorical being
] as const;

/**
 * DataPropertySchema - Properties as immediate qualities
 */
export const DataPropertySchema = z.object({
  type: z.enum(DataTypes),
  required: z.boolean().default(false),
  unique: z.boolean().default(false),
  default: z.any().optional(),
  validation: z.record(z.any()).optional(),
  reference: z.object({
    entity: z.string(),
    property: z.string(),
  }).optional(),
});

export type DataProperty = z.infer<typeof DataPropertySchema>;

/**
 * DataRelationSchema - Relations between entities
 */
export const DataRelationSchema = z.object({
  name: z.string(),
  target: z.string(),
  type: z.enum(['one-to-one', 'one-to-many', 'many-to-many']),
  inverse: z.string().optional(),
});

export type DataRelation = z.infer<typeof DataRelationSchema>;

/**
 * DataEntitySchema - The fundamental unit of immediate being
 */
export const DataEntitySchema = z.object({
  name: z.string(),
  properties: z.record(DataPropertySchema),
  primaryKey: z.string().default('id'),

  // Additional aspects
  description: z.string().optional(),
  category: z.string().optional(),

  // Temporal dimensions
  temporal: z.boolean().default(false),
  historical: z.boolean().default(false),

  // Relations to other entities
  relations: z.array(DataRelationSchema).optional(),

  // Base properties that all entities inherit
  extends: z.string().optional().default('BaseSchema'),
});

export type DataEntity = z.infer<typeof DataEntitySchema>;

/**
 * DataDomainSchema - The context for the data model
 */
export const DataDomainSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),
  created: z.coerce.date(),
  updated: z.coerce.date(),
  author: z.string().optional(),
});

export type DataDomain = z.infer<typeof DataDomainSchema>;

/**
 * DataValidationSchema - The constraints on being
 */
export const DataValidationSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  condition: z.string(),
  message: z.string(),
  severity: z.enum(['error', 'warning', 'info']).default('error'),
});

export type DataValidation = z.infer<typeof DataValidationSchema>;

/**
 * DataIndexSchema - The access patterns for entities
 */
export const DataIndexSchema = z.object({
  entity: z.string(),
  fields: z.array(z.string()),
  type: z.enum(['unique', 'standard']).default('standard'),
});

export type DataIndex = z.infer<typeof DataIndexSchema>;

/**
 * DataSchemaDefinition - The complete data ontology
 */
export const DataSchemaDefinition = z.object({
  // Domain information
  domain: DataDomainSchema,

  // Core ontology
  entities: z.record(DataEntitySchema),

  // Validation rules
  validations: z.record(DataValidationSchema).optional(),

  // Indexes
  indexes: z.record(DataIndexSchema).optional(),
});

export type DataSchema = z.infer<typeof DataSchemaDefinition>;

/**
 * DataSchemaBuilder - Fluent builder for data schemas
 */
export class DataSchemaBuilder {
  private schema: Partial<DataSchema> = {
    entities: {},
    validations: {},
    indexes: {},
  };

  /**
   * Create a new data schema with domain information
   */
  constructor(name: string, description?: string) {
    const timestamp = new Date();
    this.schema.domain = {
      name,
      description,
      version: '1.0.0',
      created: timestamp,
      updated: timestamp,
    };
  }

  /**
   * Add or update domain information
   */
  domain(config: Partial<DataDomain>): DataSchemaBuilder {
    this.schema.domain = {
      ...this.schema.domain,
      ...config,
      updated: new Date(),
    } as DataDomain;
    return this;
  }

  /**
   * Add an entity to the schema
   */
  entity(id: string, config: Partial<DataEntity>): DataSchemaBuilder {
    if (!this.schema.entities) this.schema.entities = {};

    // Ensure required properties
    const entity: DataEntity = {
      name: config.name || id,
      properties: config.properties || {},
      primaryKey: config.primaryKey || 'id',
      ...config,
    };

    this.schema.entities[id] = entity;
    return this;
  }

  /**
   * Add a validation rule
   */
  validation(id: string, config: {
    name: string,
    description?: string,
    condition: string,
    message: string,
    severity?: 'error' | 'warning' | 'info'
  }): DataSchemaBuilder {
    if (!this.schema.validations) this.schema.validations = {};
    this.schema.validations[id] = {
      name: config.name,
      description: config.description,
      condition: config.condition,
      message: config.message,
      severity: config.severity || 'error',
    };
    return this;
  }

  /**
   * Add an index
   */
  index(id: string, config: {
    entity: string,
    fields: string[],
    type?: 'unique' | 'standard'
  }): DataSchemaBuilder {
    if (!this.schema.indexes) this.schema.indexes = {};
    this.schema.indexes[id] = {
      entity: config.entity,
      fields: config.fields,
      type: config.type || 'standard',
    };
    return this;
  }

  /**
   * Build the final schema
   */
  build(): DataSchema {
    // Ensure required components exist
    if (!this.schema.domain) {
      throw new Error('Data schema requires domain information');
    }

    // Ensure all collections exist
    this.schema.entities = this.schema.entities || {};
    this.schema.validations = this.schema.validations || {};
    this.schema.indexes = this.schema.indexes || {};

    // Update timestamp
    if (this.schema.domain) {
      this.schema.domain.updated = new Date();
    }

    // Validate and return
    return DataSchemaDefinition.parse(this.schema as DataSchema);
  }
}

/**
 * Create a new data schema using the builder pattern
 */
export function defineDataSchema(name: string, description?: string): DataSchemaBuilder {
  return new DataSchemaBuilder(name, description);
}

/**
 * Legacy support - define a data schema directly
 */
export function defineSchema(config: Partial<DataSchema>): DataSchema {
  return DataSchemaDefinition.parse({
    domain: config.domain || {
      name: 'Default Domain',
      version: '1.0.0',
      created: new Date(),
      updated: new Date(),
    },
    entities: config.entities || {},
    validations: config.validations || {},
    indexes: config.indexes || {},
  });
}

/**
 * Legacy support - define a data entity directly
 */
export function defineEntity(config: Partial<DataEntity>): DataEntity {
  return DataEntitySchema.parse({
    name: config.name || 'Unnamed Entity',
    properties: config.properties || {},
    primaryKey: config.primaryKey || 'id',
    ...config,
  });
}

/**
 * Example Sanskrit Philosophy Data Schema
 */
/*
export const EXAMPLE_DATA_SCHEMA = defineDataSchema(
  'Sanskrit Philosophy Data Model',
  'Core data structures for Sanskrit philosophical concepts and texts'
)
  .entity('concept', {
    name: 'Concept',
    description: 'A philosophical concept or term from Sanskrit tradition',
    properties: {
      name: { type: 'string', required: true },
      sanskritTerm: { type: 'string', required: true },
      devanagari: { type: 'string', required: false },
      definition: { type: 'string', required: true },
      category: { type: 'enum', required: false },
      tradition: { type: 'string', required: false },
    },
    relations: [
      {
        name: 'appearsIn',
        target: 'text',
        type: 'many-to-many',
        inverse: 'discusses',
      },
      {
        name: 'relatedTo',
        target: 'concept',
        type: 'many-to-many',
        inverse: 'relatedTo',
      },
    ],
  })
  .entity('text', {
    name: 'Text',
    description: 'A Sanskrit philosophical text or scripture',
    properties: {
      title: { type: 'string', required: true },
      originalTitle: { type: 'string', required: false },
      author: { type: 'string', required: false },
      tradition: { type: 'string', required: false },
      period: { type: 'string', required: false },
      language: { type: 'string', required: false },
      summary: { type: 'string', required: false },
    },
    relations: [
      {
        name: 'discusses',
        target: 'concept',
        type: 'many-to-many',
        inverse: 'appearsIn',
      },
      {
        name: 'cites',
        target: 'text',
        type: 'many-to-many',
        inverse: 'citedBy',
      },
    ],
  })
  .validation('conceptRequiresSanskritTerm', {
    name: 'Concept Requires Sanskrit Term',
    condition: 'entity.type === "concept" && !entity.sanskritTerm',
    message: 'A Sanskrit philosophical concept must include its original Sanskrit term',
    severity: 'error',
  })
  .index('conceptByCategory', {
    entity: 'concept',
    fields: ['category'],
  })
  .index('textByTradition', {
    entity: 'text',
    fields: ['tradition', 'period'],
  })
  .build();
*/

/**
 * Get the example data schema
 */
/*
export function getExampleDataSchema(): DataSchema {
  return EXAMPLE_DATA_SCHEMA;
}
*/
// Export type definitions
//export type { DataSchema, DataEntity, DataProperty, DataRelation, DataDomain, DataValidation, DataIndex };
