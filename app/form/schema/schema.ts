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
  entities: z
    .record(FormEntityDefinitionSchema)
    .optional()
    .default({})
    .optional(),
  relations: z
    .record(FormRelationDefinitionSchema)
    .optional()
    .default({})
    .optional(),
  contexts: z.record(FormContextSchema).optional().default({}).optional(),

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
