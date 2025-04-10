import { z } from "zod";
import {
  FormDefinitionSchema,
  FormDefinition,
  FormPathSchema,
  FormPathStep,
  FormPath,
  FormCodexSchema,
  FormCodex,
} from "../schema/schema";
import { FormEntityDefinitionSchema } from "../schema/entity";
import { FormRelationDefinitionSchema } from "../schema/relation";
import { FormContextSchema } from "../schema/context";

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
            cardinality: "one-to-one",
            traversalCost: 1,
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
          cardinality: "one-to-one",
          traversalCost: 1,
          created: new Date(),
          updated: new Date(),
        };
      }
    }

    return composedForm;
  }
}
