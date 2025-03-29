//@/core/being/schema/base.ts
import { z } from 'zod';

//------------------------------------------------
// QUALITATIVE LOGIC: Laws of Immediate Consciousness
//------------------------------------------------

// Identity Quality - Pure "thisness" (haecceitas)
export const IdentityQualitySchema = z.object({
  id: z.string().uuid(),  // Universal identifier
}).strict();

// Temporal Quality - Being in becoming
export const TemporalQualitySchema = z.object({
  createdAt: z.date(),  // Coming into being
  updatedAt: z.date(),  // Becoming something else
}).strict();

// Existential Quality - Mode of being
export const ExistentialQualitySchema = z.object({
  status: z.enum(['active', 'archived', 'deleted']).default('active'),
}).strict();

// Base Schema - The unity of fundamental qualities
// (First moment of Qualitative Syllogism)
export const BaseSchema = IdentityQualitySchema.merge(TemporalQualitySchema).strict();

// Base State Schema - The mode of being
// (Second moment of Qualitative Syllogism)
export const BaseStateSchema = ExistentialQualitySchema.extend({
  // Truth quality - conformity to its concept
  validation: z.record(z.array(z.string())).optional(),

  // Communicative quality - how it presents itself
  message: z.string().optional()
}).strict();

// Base Shape - The complete concrete quality
// (Third moment of Qualitative Syllogism - synthesis)
export const BaseShapeSchema = z.object({
  base: BaseSchema,      // Thesis (static being)
  state: BaseStateSchema // Antithesis (dynamic being)
  // The Shape itself is the synthesis
}).strict();

// Export Types
export type Base = z.infer<typeof BaseSchema>;
export type BaseState = z.infer<typeof BaseStateSchema>;
export type BaseShape = z.infer<typeof BaseShapeSchema>;

//------------------------------------------------
// OPERATIONAL OUTCOMES: Results of Qualitative Logic
//------------------------------------------------

// Operation result - The outcome of qualitative transformation
export type OperationResult<T> =
  | { data: T; status: "success"; message: string; }
  | { data: null; status: "error"; message: string; errors?: Record<string, string[]>; };
