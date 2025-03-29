import { z } from 'zod';
import { BaseSchema } from '../being/schema/base';

/**
 * World Schema - The First Moment of Essence
 *
 * World represents the totality of essential being, the appearance
 * of things as they shine forth in their reflection.
 */

// World types
export const WorldTypes = [
  'physical',     // Material world
  'social',       // Social constructs and institutions
  'mental',       // Mental models and concepts
  'digital',      // Digital/virtual reality
  'possible',     // Possible worlds (what could be)
  'fictional',    // Fictional worlds (what is imagined)
  'historical',   // Past worlds (what was)
  'future',       // Future worlds (what will be)
  'normative',    // Worlds of norms and values
  'abstract'      // Abstract conceptual worlds
] as const;

// The core world schema
export const WorldSchema = BaseSchema.extend({
  // World characteristics
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  shines: z.array(z.string()).default([]),
  reflections: z.array(z.string()).default([]),
  properties: z.record(z.any()).optional(),

  // Temporality
  timeScale: z.string().optional(),
  historicalDepth: z.number().optional(),

  // Spatial properties
  spatialDimensions: z.number().int().positive().optional(),
  scale: z.string().optional(),

  // Logical properties
  logic: z.string().optional(),
  constraints: z.array(z.string()).optional(),
  laws: z.array(z.object({
    name: z.string(),
    description: z.string(),
    formula: z.string().optional(),
  })).optional(),

  // Validity
  valid: z.boolean().default(true),
  validFrom: z.date().optional(),
  validTo: z.date().optional(),
});

// Export type for World
export type World = z.infer<typeof WorldSchema>;

/**
 * Create a new world
 */
export function createWorld(params: {
  name: string;
  type: string;
  description?: string;
  properties?: Record<string, any>;
  shines?: string[];
  reflections?: string[];
  timeScale?: string;
  spatialDimensions?: number;
  scale?: string;
  logic?: string;
  constraints?: string[];
  laws?: Array<{name: string, description: string, formula?: string}>;
  validFrom?: Date;
  validTo?: Date;
}): World {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...params,
    shines: params.shines || [],
    reflections: params.reflections || [],
    valid: true
  };
}
