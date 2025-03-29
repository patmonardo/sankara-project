import { z } from "zod";
import { FormShapeSchema, FormMatterSchema, FormFieldSchema } from "./form";
import { CardShapeSchema } from "./card";
import { ListShapeSchema } from "./list";
import { LinkShapeSchema } from "./link";
import { TableShapeSchema } from "./table";
import { DashboardShapeSchema } from "./dashboard";

/**
 * FormEntityType - Defines the possible entity types in our Form system
 * These represent the fundamental ontological categories of our knowledge representation
 */
export const FormEntityTypeSchema = z.enum([
  "form", // Basic input collection
  "card", // Entity representation
  "link", // Relationship representation
  "list", // Sequence representation
  "table", // Structured data representation
  "dashboard", // Composite visualization
]);

export type FormEntityType = z.infer<typeof FormEntityTypeSchema>;

// Domain schema definition
export const FormDomainSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  namespaces: z.array(z.string()).optional(),
});

export type FormDomain = z.infer<typeof FormDomainSchema>;

// Entity schema definition
export const FormEntitySchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.string(),
  schema: z.record(z.any()),
  mapping: z
    .object({
      storage: z.string(),
      primaryKey: z.string().default("id"),
      fields: z.record(z.string()),
    })
});

export type FormEntity = z.infer<typeof FormEntitySchema>;

// Relation schema definition
export const FormRelationSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  source: z.string(),
  target: z.string(),
  type: z.string(),
  properties: z.record(z.any()).optional(),
  mapping: z
    .object({
      storage: z.string().optional(),
      sourceKey: z.string(),
      targetKey: z.string(),
    })
    .optional(),
});

export type FormRelation = z.infer<typeof FormRelationSchema>;

// Path step schema definition
export const FormPathStepSchema = z.object({
  target: z.string(),
  type: FormEntityTypeSchema,
  transition: z
    .object({
      type: z.string(),
      properties: z.record(z.any()).optional(),
    })
    .optional(),
});

export type FormPathStep = z.infer<typeof FormPathStepSchema>;

// Path context schema definition
export const FormPathContextSchema = z.object({
  purpose: z.string().optional(),
  audience: z.string().optional(),
  prerequisites: z.array(z.string()).optional(),
});

export type FormPathContext = z.infer<typeof FormPathContextSchema>;

// Path schema definition
export const FormPathSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(FormPathStepSchema),
  context: FormPathContextSchema.optional(),
});

export type FormPath = z.infer<typeof FormPathSchema>;

// Template parameter schema definition
export const FormTemplateParameterSchema = z.object({
  type: z.string(),
  description: z.string().optional(),
  default: z.any().optional(),
});

export type FormTemplateParameter = z.infer<typeof FormTemplateParameterSchema>;

// Template schema definition
export const FormTemplateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: FormEntityTypeSchema,
  definition: z.any(),
  parameters: z.record(FormTemplateParameterSchema).optional(),
});

export type FormTemplate = z.infer<typeof FormTemplateSchema>;

// Rule schema definition
export const FormRuleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  condition: z.string(),
  action: z.string(),
  priority: z.number().default(0),
});

export type FormRule = z.infer<typeof FormRuleSchema>;

// Metadata schema definition
export const FormMetaSchema = z.object({
  version: z.string(),
  created: z.coerce.date().default(() => new Date()),
  updated: z.coerce.date().default(() => new Date()),
  author: z.string().optional(),
  license: z.string().optional(),
  dependencies: z.record(z.string()).optional(),
});

export type FormMeta = z.infer<typeof FormMetaSchema>;

/**
 * FormSchemaDefinition - The transcendental structure of our entire Form system
 * This defines how all components relate to each other and to the knowledge domain
 */
export const FormSchemaDefinition = z.object({
  name: z.string(),
  description: z.string().optional(),
  entities: z.record(FormEntitySchema),
  relations: z.record(FormRelationSchema),
  domain: FormDomainSchema,
  forms: z.record(FormShapeSchema),
  cards: z.record(CardShapeSchema),
  links: z.record(LinkShapeSchema),
  lists: z.record(ListShapeSchema),
  tables: z.record(TableShapeSchema),
  dashboards: z.record(DashboardShapeSchema),
  paths: z.record(FormPathSchema),
  templates: z.record(FormTemplateSchema),
  rules: z.record(FormRuleSchema),
  meta: FormMetaSchema,
});

export type FormSchema = z.infer<typeof FormSchemaDefinition>;

/**
 * FormSchemaBuilder - A builder pattern for creating Form schemas
 * Provides a fluent interface for schema definition
 */
export class FormSchemaBuilder {
  private schema: Partial<FormSchema> = {
    entities: {},
    relations: {},
    forms: {},
    cards: {},
    links: {},
    lists: {},
    tables: {},
    dashboards: {},
    paths: {},
    templates: {},
    rules: {},
    meta: {
      version: "1.0.0",
      created: new Date(),
      updated: new Date(),
    },
  };

  constructor(name: string, description?: string) {
    this.schema.name = name;
    this.schema.description = description;
    this.schema.meta = {
      version: "1.0.0",
      created: new Date(),
      updated: new Date(),
    };
    this.schema.domain = { name };
  }

  /**
   * Set the domain information
   */
  domain(name: string, description?: string): FormSchemaBuilder {
    this.schema.domain = {
      name,
      description,
    };
    return this;
  }

  /**
   * Add an entity definition
   */
  entity(id: string, config: FormEntity): FormSchemaBuilder {
    if (!this.schema.entities) this.schema.entities = {};
    this.schema.entities[id] = config;
    return this;
  }

  /**
   * Add a relation definition
   */
  relation(id: string, config: FormRelation): FormSchemaBuilder {
    if (!this.schema.relations) this.schema.relations = {};
    this.schema.relations[id] = config;
    return this;
  }

  /**
   * Add a form definition
   */
  form(id: string, config: z.infer<typeof FormShapeSchema>): FormSchemaBuilder {
    if (!this.schema.forms) this.schema.forms = {};
    this.schema.forms[id] = config;
    return this;
  }

  /**
   * Add a card definition
   */
  card(id: string, config: z.infer<typeof CardShapeSchema>): FormSchemaBuilder {
    if (!this.schema.cards) this.schema.cards = {};
    this.schema.cards[id] = config;
    return this;
  }

  /**
   * Add a link definition
   */
  link(id: string, config: z.infer<typeof LinkShapeSchema>): FormSchemaBuilder {
    if (!this.schema.links) this.schema.links = {};
    this.schema.links[id] = config;
    return this;
  }

  /**
   * Add a list definition
   */
  list(id: string, config: z.infer<typeof ListShapeSchema>): FormSchemaBuilder {
    if (!this.schema.lists) this.schema.lists = {};
    this.schema.lists[id] = config;
    return this;
  }

  /**
   * Add a table definition
   */
  table(
    id: string,
    config: z.infer<typeof TableShapeSchema>
  ): FormSchemaBuilder {
    if (!this.schema.tables) this.schema.tables = {};
    this.schema.tables[id] = config;
    return this;
  }

  /**
   * Add a dashboard definition
   */
  dashboard(
    id: string,
    config: z.infer<typeof DashboardShapeSchema>
  ): FormSchemaBuilder {
    if (!this.schema.dashboards) this.schema.dashboards = {};
    this.schema.dashboards[id] = config;
    return this;
  }

  /**
   * Add a knowledge path
   */
  path(id: string, config: FormPath): FormSchemaBuilder {
    if (!this.schema.paths) this.schema.paths = {};
    this.schema.paths[id] = config;
    return this;
  }

  /**
   * Add a template definition
   */
  template(id: string, config: FormTemplate): FormSchemaBuilder {
    if (!this.schema.templates) this.schema.templates = {};
    this.schema.templates[id] = config;
    return this;
  }

  /**
   * Add a rule definition
   */
  rule(id: string, config: FormRule): FormSchemaBuilder {
    if (!this.schema.rules) this.schema.rules = {};
    this.schema.rules[id] = config;
    return this;
  }

  /**
   * Set metadata about this schema
   */
  metadata(config: Partial<FormMeta>): FormSchemaBuilder {
    // Ensure meta exists
    if (!this.schema.meta) {
      this.schema.meta = {
        version: "1.0.0",
        created: new Date(),
        updated: new Date(),
      };
    }

    // Apply new config
    this.schema.meta = {
      ...this.schema.meta,  // Start with existing meta
      ...config,           // Apply new config values
      updated: new Date()  // Always update the timestamp
    };

    return this;
  }

  /**
   * Build the final schema
   */
  build(): FormSchema {
    // Ensure all required fields are present
    if (!this.schema.name) throw new Error("Schema name is required");
    if (!this.schema.domain) throw new Error("Schema domain is required");
    if (!this.schema.meta) {
      this.schema.meta = {
        version: "1.0.0",
        created: new Date(),
        updated: new Date(),
      };
    }

    // Ensure all collections exist (even if empty)
    this.schema.entities = this.schema.entities || {};
    this.schema.relations = this.schema.relations || {};
    this.schema.forms = this.schema.forms || {};
    this.schema.cards = this.schema.cards || {};
    this.schema.links = this.schema.links || {};
    this.schema.lists = this.schema.lists || {};
    this.schema.tables = this.schema.tables || {};
    this.schema.dashboards = this.schema.dashboards || {};
    this.schema.paths = this.schema.paths || {};
    this.schema.templates = this.schema.templates || {};
    this.schema.rules = this.schema.rules || {};

    // Validate and return the schema
    return FormSchemaDefinition.parse(this.schema as FormSchema);
  }
}

/**
 * Create a new Form schema with the builder pattern
 */
export function defineFormSchema(name: string, description?: string) {
  return new FormSchemaBuilder(name, description);
}

// Export utilities and types
export {
  FormMatterSchema,
  FormFieldSchema,
  FormShapeSchema,
  CardShapeSchema,
  ListShapeSchema,
  LinkShapeSchema,
  TableShapeSchema,
  DashboardShapeSchema,
};
