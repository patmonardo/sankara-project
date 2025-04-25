import { z } from "zod";
import { FormDefinition, FormPath, FormCodex } from "@/form/schema/schema";
import { FormService } from "@/form/form/service";
import { FormEntityDefinitionSchema } from "@/form/schema/entity";
import { FormRelationDefinitionSchema } from "@/form/schema/relation";
import { FormContextSchema } from "@/form/schema/context";
import { FormPathStep } from "@/form/schema/schema";

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
