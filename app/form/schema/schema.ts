import { z } from "zod";
import { FormEntityDefinitionSchema } from "./entity";
import { FormRelationDefinitionSchema } from "./relation";
import { FormContextSchema } from "./context";

/**
 * FormDefinition - The foundation of the Transcendental Object Model
 *
 * A Form Definition is a complete Transcendental Object that unifies:
 * 1. Entities (Being) - The fundamental existents
 * 2. Relations (Movement) - The connections between existents
 * 3. Contexts (Environment) - The spaces in which existents operate
 */
export const FormDefinitionSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),

  // Classification
  type: z.string(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),

  // Ontological structure
  entities: z.record(FormEntityDefinitionSchema).optional().default({}),
  relations: z.record(FormRelationDefinitionSchema).optional().default({}),
  contexts: z.record(FormContextSchema).optional().default({}),

  // Form-specific properties
  schema: z.record(z.any()).optional(),

  // Definitional aspects
  template: z.boolean().optional().default(false),
  abstract: z.boolean().optional().default(false),
  extensions: z.array(z.string()).optional(),

  // Meta-information
  created: z.date().default(() => new Date()),
  updated: z.date().default(() => new Date()),
  version: z.string().default("1.0.0"),
  author: z.string().optional(),
});

export type FormDefinition = z.infer<typeof FormDefinitionSchema>;

/**
 * FormPathStep - A single step in a knowledge path
 */
export const FormPathStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  targetId: z.string(),
  targetType: z.string(),
  action: z.string().optional(),
  conditions: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

export type FormPathStep = z.infer<typeof FormPathStepSchema>;

/**
 * FormPath - A directed sequence through forms
 */
export const FormPathSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(FormPathStepSchema),
  circular: z.boolean().optional().default(false),
  metadata: z.record(z.any()).optional(),
  created: z.date().default(() => new Date()),
  updated: z.date().default(() => new Date()),
});

export type FormPath = z.infer<typeof FormPathSchema>;

/**
 * FormCodex - The complete encyclopedia of forms
 *
 * This is the highest-level abstraction in the system,
 * representing the totality of knowledge as an integrated whole.
 */
export const FormCodexSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),

  // Content
  definitions: z.record(FormDefinitionSchema),
  paths: z.record(FormPathSchema).optional().default({}),

  // Organization
  categories: z
    .record(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        parentId: z.string().optional(),
      })
    )
    .optional()
    .default({}),

  // Meta-information
  version: z.string().default("1.0.0"),
  created: z.date().default(() => new Date()),
  updated: z.date().default(() => new Date()),
  author: z.string().optional(),
});

export type FormCodex = z.infer<typeof FormCodexSchema>;

/**
 * FormService - Core service for working with Forms
 *
 * This service provides the foundational operations for managing Forms
 * as Transcendental Objects.
 */
export class FormService {
  /**
   * Create a form definition
   */
  static defineForm(config: {
    id?: string;
    name: string;
    description?: string;
    type: string;
    category?: string;
    entities?: Record<string, z.infer<typeof FormEntityDefinitionSchema>>;
    relations?: Record<string, z.infer<typeof FormRelationDefinitionSchema>>;
    contexts?: Record<string, z.infer<typeof FormContextSchema>>;
    schema?: Record<string, any>;
    tags?: string[];
  }): FormDefinition {
    return FormDefinitionSchema.parse({
      id:
        config.id ||
        `form:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`,
      name: config.name,
      description: config.description,
      type: config.type,
      category: config.category,
      entities: config.entities || {},
      relations: config.relations || {},
      contexts: config.contexts || {},
      schema: config.schema || {},
      tags: config.tags || [],
      created: new Date(),
      updated: new Date(),
    });
  }

  /**
   * Create a form path
   */
  static definePath(config: {
    id?: string;
    name: string;
    description?: string;
    steps: Array<Omit<FormPathStep, "id">>;
    circular?: boolean;
    metadata?: Record<string, any>;
  }): FormPath {
    const steps = config.steps.map((step, index) => ({
      id: `step:${index}`,
      name: step.name,
      description: step.description,
      targetId: step.targetId,
      targetType: step.targetType,
      action: step.action,
      conditions: step.conditions,
      metadata: step.metadata,
    }));

    return FormPathSchema.parse({
      id:
        config.id ||
        `path:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`,
      name: config.name,
      description: config.description,
      steps,
      circular: config.circular,
      metadata: config.metadata,
      created: new Date(),
      updated: new Date(),
    });
  }

  /**
   * Create a form codex
   */
  static defineCodex(config: {
    id?: string;
    name: string;
    description?: string;
    definitions: Record<string, FormDefinition>;
    paths?: Record<string, FormPath>;
    categories?: Record<
      string,
      { name: string; description?: string; parentId?: string }
    >;
    author?: string;
  }): FormCodex {
    return FormCodexSchema.parse({
      id:
        config.id ||
        `codex:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`,
      name: config.name,
      description: config.description,
      definitions: config.definitions,
      paths: config.paths || {},
      categories: config.categories || {},
      version: "1.0.0",
      created: new Date(),
      updated: new Date(),
      author: config.author,
    });
  }

  /**
   * Generate a form instance from a definition
   */
  static instantiateForm(
    definition: FormDefinition,
    instanceData?: Record<string, any>
  ): FormDefinition {
    if (definition.abstract) {
      throw new Error(`Cannot instantiate abstract form: ${definition.id}`);
    }

    return {
      ...definition,
      id: `instance:${definition.id}:${Date.now()}:${Math.random()
        .toString(36)
        .substring(2, 9)}`,
      schema: {
        ...definition.schema,
        ...instanceData,
      },
      template: false,
      created: new Date(),
      updated: new Date(),
    };
  }

  /**
   * Apply a transformation to a form
   */
  static transformForm(
    form: FormDefinition,
    transformer: (form: FormDefinition) => Partial<FormDefinition>
  ): FormDefinition {
    const updates = transformer(form);

    return {
      ...form,
      ...updates,
      updated: new Date(),
    };
  }

  /**
   * Compose multiple forms into a single form
   */
  static composeForms(
    forms: FormDefinition[],
    compositionStrategy?: "merge" | "extend" | "reference"
  ): FormDefinition {
    const strategy = compositionStrategy || "merge";

    // Start with the first form as a base
    const baseForm = forms[0];

    // Create a new composed form
    const composedForm: FormDefinition = {
      ...baseForm,
      id: `composed:${Date.now()}:${Math.random()
        .toString(36)
        .substring(2, 9)}`,
      name: `Composed: ${baseForm.name}`,
      description: `Composition of ${forms.length} forms`,
      entities: { ...baseForm.entities },
      relations: { ...baseForm.relations },
      contexts: { ...baseForm.contexts },
      created: new Date(),
      updated: new Date(),
    };

    // Apply the composition strategy for each additional form
    for (let i = 1; i < forms.length; i++) {
      const form = forms[i];

      if (strategy === "merge") {
        // Merge entities, relations, and contexts
        composedForm.entities = { ...composedForm.entities, ...form.entities };
        composedForm.relations = {
          ...composedForm.relations,
          ...form.relations,
        };
        composedForm.contexts = { ...composedForm.contexts, ...form.contexts };
      } else if (strategy === "extend") {
        // Create extension relations to the original entities
        for (const [entityId, entity] of Object.entries(form.entities)) {
          composedForm.entities[`${form.id}:${entityId}`] = entity;

          // Create extension relation
          composedForm.relations[`extends:${form.id}:${entityId}`] = {
            id: `extends:${form.id}:${entityId}`,
            name: `Extension of ${entity.name}`,
            type: "extends",
            source: `${form.id}:${entityId}`,
            target: entityId,
            directional: true,
            active: true,
            created: new Date(),
            updated: new Date(),
          };
        }
      } else if (strategy === "reference") {
        // Create reference relations to the original forms
        composedForm.relations[`references:${form.id}`] = {
          id: `references:${form.id}`,
          name: `Reference to ${form.name}`,
          type: "references",
          source: composedForm.id,
          target: form.id,
          properties: {
            referenceType: "composition",
          },
          directional: true,
          active: true,
          created: new Date(),
          updated: new Date(),
        };
      }
    }

    return composedForm;
  }
}

/**
 * FormSystem - The central registry for all forms in the system
 *
 * This class manages the global state of all forms, providing
 * a centralized registry for forms, paths, and codexes.
 */
export class FormSystem {
  private static instance: FormSystem;
  private forms: Map<string, FormDefinition> = new Map();
  private paths: Map<string, FormPath> = new Map();
  private codexes: Map<string, FormCodex> = new Map();

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): FormSystem {
    if (!FormSystem.instance) {
      FormSystem.instance = new FormSystem();
    }
    return FormSystem.instance;
  }

  /**
   * Register a form in the system
   */
  registerForm(form: FormDefinition): void {
    this.forms.set(form.id, form);
  }

  /**
   * Get a form by ID
   */
  getForm(formId: string): FormDefinition | undefined {
    return this.forms.get(formId);
  }

  /**
   * Register a path in the system
   */
  registerPath(path: FormPath): void {
    this.paths.set(path.id, path);
  }

  /**
   * Get a path by ID
   */
  getPath(pathId: string): FormPath | undefined {
    return this.paths.get(pathId);
  }

  /**
   * Register a codex in the system
   */
  registerCodex(codex: FormCodex): void {
    this.codexes.set(codex.id, codex);
  }

  /**
   * Get a codex by ID
   */
  getCodex(codexId: string): FormCodex | undefined {
    return this.codexes.get(codexId);
  }

  /**
   * Query forms by criteria
   */
  queryForms(criteria: {
    type?: string;
    category?: string;
    tags?: string[];
  }): FormDefinition[] {
    return Array.from(this.forms.values()).filter((form) => {
      if (criteria.type && form.type !== criteria.type) {
        return false;
      }
      if (criteria.category && form.category !== criteria.category) {
        return false;
      }
      if (criteria.tags && criteria.tags.length > 0) {
        if (
          !form.tags ||
          !criteria.tags.every((tag) => form.tags!.includes(tag))
        ) {
          return false;
        }
      }
      return true;
    });
  }
}

/**
 * Helper functions for working with Forms
 */

/**
 * Define a form
 */
export function defineForm(config: {
  id?: string;
  name: string;
  description?: string;
  type: string;
  category?: string;
  entities?: Record<string, z.infer<typeof FormEntityDefinitionSchema>>;
  relations?: Record<string, z.infer<typeof FormRelationDefinitionSchema>>;
  contexts?: Record<string, z.infer<typeof FormContextSchema>>;
  schema?: Record<string, any>;
  tags?: string[];
}): FormDefinition {
  return FormService.defineForm(config);
}

/**
 * Define a path
 */
export function definePath(config: {
  id?: string;
  name: string;
  description?: string;
  steps: Array<Omit<FormPathStep, "id">>;
  circular?: boolean;
  metadata?: Record<string, any>;
}): FormPath {
  return FormService.definePath(config);
}

/**
 * Define a codex
 */
export function defineCodex(config: {
  id?: string;
  name: string;
  description?: string;
  definitions: Record<string, FormDefinition>;
  paths?: Record<string, FormPath>;
  categories?: Record<
    string,
    { name: string; description?: string; parentId?: string }
  >;
  author?: string;
}): FormCodex {
  return FormService.defineCodex(config);
}
