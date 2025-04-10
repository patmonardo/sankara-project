import { z } from "zod";
import { FormModeSchema } from "./form";

// Domain schema definition
export const FormDomainSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  namespaces: z.array(z.string()).optional(),
});

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

// Entity schema definition
export const FormEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.string(),
  schema: z.record(z.any()),
  mapping: z.object({
    storage: z.string(),
    primaryKey: z.string().default("id"),
    fields: z.record(z.string()),
  }),
});

// Relation schema definition
export const FormRelationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.string(),
  source: z.string(),
  target: z.string(),
  properties: z.record(z.any()).optional(),
  mapping: z
    .object({
      storage: z.string().optional(),
      sourceKey: z.string(),
      targetKey: z.string(),
    })
    .optional(),
});

/**
 * FormContextSchema - A single knowledge structure within the FormCodex
 * Represents a pure a priori dharma (fundamental principle)
 */
export const FormContextSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),

  // Form components (all UI entity types)
  entities: z.record(FormEntitySchema),

  // Connections between form components
  relations: z.record(FormRelationSchema),

  // Ontological structure
  type: z.string(),
  parameters: z.record(z.any()),

  // Context constraints
  constraints: z
    .array(
      z.object({
        type: z.string(),
        condition: z.string(),
        message: z.string().optional(),
      })
    )
    .optional(),

  // Context transformations
  transformations: z
    .record(
      z.object({
        mode: FormModeSchema,
        pipeline: z.string().optional(),
        evaluator: z.string().optional(),
      })
    )
    .optional(),
});

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

// Path context schema definition
export const FormPathContextSchema = z.object({
  purpose: z.string().optional(),
  audience: z.string().optional(),
  prerequisites: z.array(z.string()).optional(),
});

// Path schema definition
export const FormPathSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(FormPathStepSchema),
  context: FormPathContextSchema.optional(),
});

// Template parameter schema definition
export const FormTemplateParameterSchema = z.object({
  type: z.string(),
  description: z.string().optional(),
  default: z.any().optional(),
});

// Template schema definition
export const FormTemplateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: FormEntityTypeSchema,
  definition: z.any(),
  parameters: z.record(FormTemplateParameterSchema).optional(),
});

// Rule schema definition
export const FormRuleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  condition: z.string(),
  action: z.string(),
  priority: z.number().default(0),
});

// Metadata schema definition
export const FormMetaSchema = z.object({
  version: z.string(),
  created: z.coerce.date().default(() => new Date()),
  updated: z.coerce.date().default(() => new Date()),
  author: z.string().optional(),
  license: z.string().optional(),
  dependencies: z.record(z.string()).optional(),
});

/**
 * FormCodex - The complete encyclopedia of forms
 * A prasankhyane (perfect enumeration) of pure a priori dharmas
 */
export const FormCodexSchema = z.object({
  // Identity
  name: z.string(),
  description: z.string().optional(),

  // Knowledge domain
  domain: FormDomainSchema,

  // Form components (all UI entity types)
  entities: z.record(FormEntitySchema),

  // Connections between form components
  relations: z.record(FormRelationSchema),

  // Environments for form components
  contexts: z.record(FormContextSchema),

  // Philosophical architecture
  morpheus: z.object({
    pipelines: z.record(z.any()),
  }),
  sara: z.object({
    evaluators: z.record(z.any()),
  }),
  modality: z.object({
    configurations: z.record(z.any()),
  }),

  // Navigation structures
  paths: z.record(FormPathSchema),

  // Reusable patterns
  templates: z.record(FormTemplateSchema),

  // Governing principles
  rules: z.record(FormRuleSchema),

  // Metadata
  meta: FormMetaSchema,
});

/**
 * FormCodexBuilder - Builder for the FormCodex knowledge system
 * Structured according to the dialectical progression of knowledge
 */
export class FormCodexBuilder {
  // Use a more precise type definition with required properties
  private codex: {
    name: string;
    description?: string;
    domain: { id: string; name: string; description?: string };
    entities: Record<string, FormEntity>;
    relations: Record<string, FormRelation>;
    contexts: Record<string, FormContext>;
    morpheus: { pipelines: Record<string, any> };
    sara: { evaluators: Record<string, any> };
    modality: { configurations: Record<string, any> };
    paths: Record<string, FormPath>;
    templates: Record<string, FormTemplate>;
    rules: Record<string, FormRule>;
    meta: {
      version: string;
      created: Date;
      updated: Date;
      author?: string;
      license?: string;
      dependencies?: Record<string, string>;
    };
  } = {
    name: "",
    domain: { id: "", name: "" },

    // Core ontological structure
    entities: {}, // Fundamental "things"
    relations: {}, // Connections between things
    contexts: {}, // Environments for entities and relations

    // Philosophical architecture
    morpheus: { pipelines: {} }, // A. REFLECTION - Facticity
    sara: { evaluators: {} }, // B. APPEARANCE - Essential Relations
    modality: { configurations: {} }, // C. ACTUALITY - Integration

    // Knowledge organization
    paths: {}, // Navigation sequences through knowledge
    templates: {}, // Reusable patterns
    rules: {}, // Governing principles

    meta: {
      version: "1.0.0",
      created: new Date(),
      updated: new Date(),
    },
  };

  constructor(name: string, description?: string) {
    this.codex.name = name;
    this.codex.description = description;
  }

  // Domain configuration
  domain(id: string, name: string, description?: string): FormCodexBuilder {
    this.codex.domain = { id, name, description };
    return this;
  }

  // CORE ONTOLOGICAL STRUCTURE

  /**
   * Add an entity to the codex
   * Entities are fundamental "things" in the knowledge domain
   */
  entity(id: string, config: FormEntity): FormCodexBuilder {
    this.codex.entities[id] = config;
    return this;
  }

  /**
   * Add a relation to the codex
   * Relations connect entities and define their essential relationships
   */
  relation(id: string, config: FormRelation): FormCodexBuilder {
    this.codex.relations[id] = config;
    return this;
  }

  /**
   * Add a context to the codex
   * Contexts provide environments in which entities and relations exist
   */
  context(id: string, config: FormContext): FormCodexBuilder {
    this.codex.contexts[id] = config;
    return this;
  }

  /**
   * Add a Morpheus pipeline to the codex
   * Pipelines handle the facticity of forms (REFLECTION)
   */
  morpheusPipeline(id: string, pipeline: any): FormCodexBuilder {
    this.codex.morpheus.pipelines[id] = pipeline;
    return this;
  }

  /**
   * Add a Sara evaluator to the codex
   * Evaluators handle essential relations of forms (APPEARANCE)
   */
  saraEvaluator(id: string, evaluator: any): FormCodexBuilder {
    this.codex.sara.evaluators[id] = evaluator;
    return this;
  }

  /**
   * Add a FormModality configuration to the codex
   * Modality configurations handle the complete integration (ACTUALITY)
   */
  modalityConfig(id: string, config: any): FormCodexBuilder {
    this.codex.modality.configurations[id] = config;
    return this;
  }

  // KNOWLEDGE ORGANIZATION

  /**
   * Add a path to the codex
   * Paths define navigation sequences through knowledge
   */
  path(id: string, config: FormPath): FormCodexBuilder {
    this.codex.paths[id] = config;
    return this;
  }

  /**
   * Add a template to the codex
   * Templates define reusable patterns for knowledge structures
   */
  template(id: string, config: FormTemplate): FormCodexBuilder {
    this.codex.templates[id] = config;
    return this;
  }

  /**
   * Add a rule to the codex
   * Rules define governing principles for knowledge
   */
  rule(id: string, config: FormRule): FormCodexBuilder {
    this.codex.rules[id] = config;
    return this;
  }

  // BUILD PROCESS

  /**
   * Build the FormCodex
   * Validates and returns the complete codex
   */
  build(): FormCodex {
    // Validation logic
    if (!this.codex.name) throw new Error("Codex name is required");
    if (!this.codex.domain?.name) throw new Error("Domain name is required");

    // Philosophical validation
    if (Object.keys(this.codex.morpheus.pipelines).length === 0) {
      console.warn("No Morpheus pipelines defined");
    }
    if (Object.keys(this.codex.sara.evaluators).length === 0) {
      console.warn("No Sara evaluators defined");
    }
    if (Object.keys(this.codex.modality.configurations).length === 0) {
      console.warn("No FormModality configurations defined");
    }

    return this.codex as FormCodex;
  }
}

/**
 * Create a new Form schema with the builder pattern
 */
export function defineFormCodex(name: string, description?: string) {
  return new FormCodexBuilder(name, description);
}

export type FormDomain = z.infer<typeof FormDomainSchema>;
export type FormEntityType = z.infer<typeof FormEntityTypeSchema>;
export type FormEntity = z.infer<typeof FormEntitySchema>;
export type FormRelation = z.infer<typeof FormRelationSchema>;
export type FormContext = z.infer<typeof FormContextSchema>;
export type FormPath = z.infer<typeof FormPathSchema>;
export type FormPathContext = z.infer<typeof FormPathContextSchema>;
export type FormPathStep = z.infer<typeof FormPathStepSchema>;
export type FormTemplateParameter = z.infer<typeof FormTemplateParameterSchema>;
export type FormTemplate = z.infer<typeof FormTemplateSchema>;
export type FormRule = z.infer<typeof FormRuleSchema>;
export type FormMeta = z.infer<typeof FormMetaSchema>;
export type FormCodex = z.infer<typeof FormCodexSchema>;
