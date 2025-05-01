import { z } from "zod";
import { FormEntityDefinitionSchema } from "./entity";
import { FormPropertyDefinitionSchema } from "./property";
import { FormRelationDefinitionSchema } from "./relation";
import { FormPathSchema } from "./path";
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
  properties: z
    .record(FormPropertyDefinitionSchema)
    .optional()
    .default({})
    .optional(),
  relations: z
    .record(FormRelationDefinitionSchema)
    .optional()
    .default({})
    .optional(),
  contexts: z.record(FormContextSchema).optional().default({}).optional(),

  // Definitional aspects
  template: z.boolean().optional().default(false).optional(),
  abstract: z.boolean().optional().default(false).optional(),
  extensions: z.array(z.string()).optional(),

  // Metadata
  createdAt: z
    .number()
    .optional()
    .default(() => Date.now())
    .optional(),
  updatedAt: z
    .number()
    .optional()
    .default(() => Date.now())
    .optional(),
  version: z.string().default("1.0.0"),
  author: z.string().optional(),
});

export type FormDefinition = z.infer<typeof FormDefinitionSchema>;

/**
 * FormSchema - The complete encyclopedia of forms
 *
 * This is the highest-level abstraction in the system,
 * representing the totality of knowledge as an integrated whole.
 */
export const FormSchema = z.object({
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

  // Metadata
  createdAt: z
    .number()
    .optional()
    .default(() => Date.now())
    .optional(),
  updatedAt: z
    .number()
    .optional()
    .default(() => Date.now())
    .optional(),
  version: z.string().default("1.0.0"),
  author: z.string().optional(),
});

export type Form = z.infer<typeof FormSchema>;
