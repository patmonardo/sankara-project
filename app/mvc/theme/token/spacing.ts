import { z } from 'zod';

// Spacing scale schema (rem values)
export const spaceSchema = z.record(z.union([z.string(), z.number()]));

// Component spacing schema
export const spacingSchema = z.object({
  xs: z.string(),
  sm: z.string(),
  md: z.string(),
  lg: z.string(),
  xl: z.string(),
});

// Size scale schema
export const sizeSchema = z.record(z.string());

// Border radius schema
export const radiusSchema = z.record(z.string());

// Shape system schema
export const shapeSchema = z.object({
  small: z.string(),
  medium: z.string(),
  large: z.string(),
  full: z.string(),
});

// Layout schema (added)
export const layoutSchema = z.object({
  container: z.record(z.string()),
  grid: z.record(z.string()),
  stack: z.record(z.string()),
});

// Raw space scale values (in rem)
const spaceValues = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
};

// Component-specific spacing
const spacingValues = {
  xs: 'p-2',  // 8px padding
  sm: 'p-3',  // 12px padding
  md: 'p-4',  // 16px padding
  lg: 'p-6',  // 24px padding
  xl: 'p-8',  // 32px padding
};

// Sizing scale
const sizeValues = {
  xs: '20rem',      // 320px
  sm: '24rem',      // 384px
  md: '28rem',      // 448px
  lg: '32rem',      // 512px
  xl: '36rem',      // 576px
  '2xl': '42rem',   // 672px
  '3xl': '48rem',   // 768px
  '4xl': '56rem',   // 896px
  '5xl': '64rem',   // 1024px
  '6xl': '72rem',   // 1152px
  '7xl': '80rem',   // 1280px
  full: '100%',
  screen: '100vw',
  min: 'min-content',
  max: 'max-content',
  fit: 'fit-content',
};

// Border radius
const radiusValues = {
  none: '0',
  sm: '0.125rem',    // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',     // 6px
  lg: '0.5rem',       // 8px
  xl: '0.75rem',      // 12px
  '2xl': '1rem',      // 16px
  '3xl': '1.5rem',    // 24px
  full: '9999px',     // Fully rounded (circle/pill)
};

// Shape system tokens
const shapeValues = {
  small: 'rounded',
  medium: 'rounded-md',
  large: 'rounded-lg',
  full: 'rounded-full',
};

// Layout helpers (new)
const layoutValues = {
  container: {
    default: 'w-full mx-auto px-4 sm:px-6 lg:px-8',
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  },
  grid: {
    1: 'grid grid-cols-1 gap-4',
    2: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
    3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
    4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
    auto: 'grid grid-cols-auto-fill-100 gap-4',
  },
  stack: {
    xs: 'space-y-2',
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  },
};

// Parse and validate values
export const space = spaceSchema.parse(spaceValues);
export const spacing = spacingSchema.parse(spacingValues);
export const size = sizeSchema.parse(sizeValues);
export const radius = radiusSchema.parse(radiusValues);
export const shape = shapeSchema.parse(shapeValues);
export const layout = layoutSchema.parse(layoutValues);

// Export types
export type Space = z.infer<typeof spaceSchema>;
export type Spacing = z.infer<typeof spacingSchema>;
export type Size = z.infer<typeof sizeSchema>;
export type Radius = z.infer<typeof radiusSchema>;
export type Shape = z.infer<typeof shapeSchema>;
export type Layout = z.infer<typeof layoutSchema>;
