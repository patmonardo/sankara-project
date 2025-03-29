import { z } from 'zod';
import { FormLayoutSchema, FormShapeSchema } from './form';

// Link types
export const LinkTypeSchema = z.enum([
  'action',    // Triggers a function
  'navigate',  // Internal navigation
  'external',  // External link
  'reference', // Reference to another entity
]);

// Link variants for styling
export const LinkVariantSchema = z.enum([
  'primary',
  'secondary',
  'ghost',
  'danger',
  'button',
  'buttonSecondary',
  'buttonGhost',
  'buttonDanger',
]);

// Link sizes
export const LinkSizeSchema = z.enum([
  'small',
  'medium',
  'large',
]);

// Link schema
export const LinkLayoutSchema = FormLayoutSchema.extend({
  id: z.string(),
  label: z.string(),
  href: z.string().optional(),
  icon: z.string().optional(),
  relation: z.string().optional(),
  variant: LinkVariantSchema.optional().default('primary'),
  size: LinkSizeSchema.optional().default('medium'),
  disabled: z.boolean().optional().default(false),
  target: z.string().optional(),
  className: z.string().optional(),
});

export const LinkShapeSchema = FormShapeSchema.extend({
  type: LinkTypeSchema.optional().default('navigate'),
  layout: LinkLayoutSchema
});

export type LinkShape = z.infer<typeof LinkShapeSchema>;
