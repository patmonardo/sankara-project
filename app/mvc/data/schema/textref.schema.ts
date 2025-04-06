import { z } from 'zod';

// Base TextRef schema
export const textRefSchema = z.object({
  id: z.string(),
  // Add other base properties from your TextRef interface
});
export type TextRef = z.infer<typeof textRefSchema>;

// TextLocation schema
export const textLocationSchema = z.object({
  // Add properties from your TextLocation interface
  path: z.string().optional(),
});
export type TextLocation = z.infer<typeof textLocationSchema>;

// Generic TextRegistry schema
export const textRegistrySchema = z.object({
  // Add properties from your TextRegistry interface
  items: z.array(z.any()), // This will be refined in implementations
});
export type TextRegistry<T = any> = z.infer<typeof textRegistrySchema>;
