import { z } from 'zod';
import { FormLayoutSchema, FormShapeSchema } from './shape';

// Add support for confirmation dialogs and HeroIcons
export const ButtonVariantSchema = z.enum(['primary', 'secondary', 'ghost', 'danger']);
export const ButtonSizeSchema = z.enum(['sm', 'md', 'lg']).default('md');
export const IconSourceSchema = z.enum(['heroicons', 'custom']).default('heroicons');

// Button schema definition with enhanced features
export const ButtonShapeSchema = FormShapeSchema.extend ({
  variant: ButtonVariantSchema,
  size: ButtonSizeSchema.optional(),
  icon: z.string().optional(),
  iconSource: IconSourceSchema.optional(),
  label: z.string(),
  href: z.string().optional(),
  onClick: z.function().optional(),
  disabled: z.boolean().optional().default(false),
  confirmMessage: z.string().optional(),
  refreshAfterAction: z.boolean().optional().default(false),
  srOnly: z.boolean().optional().default(false),
  customClass: z.string().optional()
});

export type ButtonShape = z.infer<typeof ButtonShapeSchema>;

export function defineButton(config: Partial<ButtonShape>): ButtonShape {
  const shape: ButtonShape = {
    fields: [],
    layout: {
    variant: config.variant || 'primary',
    label: config.label || 'Button',
    size: config.size,
    icon: config.icon,
    iconSource: config.iconSource,
    href: config.href,
    onClick: config.onClick,
    disabled: config.disabled ?? false,
    // Add the missing fields
    confirmMessage: config.confirmMessage,
    refreshAfterAction: config.refreshAfterAction ?? false,
    srOnly: config.srOnly ?? false,
    customClass: config.customClass
    },
    state: {
      status: 'idle',
      message: '',
      errors: {},
    },
    actions: [],
    type: 'button',
  };

  return shape;
}
