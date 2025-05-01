import { z } from "zod";

export const FormPathCriteriaSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  type: z.string().optional(),
  subtype: z.string().optional(),
  properties: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  maxDepth: z.number().optional(),
  minDepth: z.number().optional(),
  maxWidth: z.number().optional(),
  minWidth: z.number().optional(),
});

export type FormRelationPathCriteria = z.infer<typeof FormPathCriteriaSchema>;

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
