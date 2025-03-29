import { z } from 'zod';
import { FormLayoutSchema, FormShapeSchema } from './form';
import { LinkShapeSchema } from './link';

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

// List item content
export const ListItemContentSchema = z.record(z.any());

// List item schema
export const ListItemSchema = z.object({
  id: z.string(),
  content: ListItemContentSchema,
  relations: z.array(LinkShapeSchema).optional(),
});

// Complete ListShape extending FormShapeSchema
export const ListShapeSchema = FormShapeSchema.extend({
  type: z.literal('list').default('list'),
  layout: ListLayoutSchema,
  items: z.array(ListItemSchema),
  navigation: ListNavigationSchema.optional(),
  relations: z.array(LinkShapeSchema).optional(),
});

// Export types
export type ListLayout = z.infer<typeof ListLayoutSchema>;
export type ListNavigation = z.infer<typeof ListNavigationSchema>;
export type ListItemContent = z.infer<typeof ListItemContentSchema>;
export type ListItem = z.infer<typeof ListItemSchema>;
export type ListShape = z.infer<typeof ListShapeSchema>;
