import { z } from 'zod';
import { FormLayoutSchema, FormShapeSchema } from './shape';
import { LinkShapeSchema } from './link';

// List item schema
export const ListItemSchema = z.object({
  id: z.string(),
  content: z.record(z.string(), z.any()),
  relations: z.array(LinkShapeSchema).optional(),
});

// ListLayoutSchema extends FormLayoutSchema
export const ListLayoutSchema = FormLayoutSchema.extend({
  type: z.enum(['linear', 'grid', 'hierarchical']).default('linear'),
  compact: z.boolean().optional(),
  zebra: z.boolean().optional(),
  borderless: z.boolean().optional(),
});

// List navigation options
export const ListNavigationSchema = z.object({
  search: z.boolean().optional(),
  pagination: z.boolean().optional(),
  filter: z.boolean().optional(),
  sort: z.boolean().optional(),
});


// Complete ListShape extending FormShapeSchema
export const ListShapeSchema = FormShapeSchema.extend({
  type: z.literal('list').default('list'),
  items: z.array(ListItemSchema),
  layout: ListLayoutSchema,
  navigation: ListNavigationSchema.optional(),
  relations: z.array(LinkShapeSchema).optional(),
});

// Export types
export type ListItem = z.infer<typeof ListItemSchema>;
export type ListLayout = z.infer<typeof ListLayoutSchema>;
export type ListNavigation = z.infer<typeof ListNavigationSchema>;
export type ListShape = z.infer<typeof ListShapeSchema>;
