import { z } from 'zod';

// Font families schema
export const fontFamilySchema = z.object({
  sans: z.string().min(1),
  serif: z.string().min(1),
  mono: z.string().min(1),
  sanskrit: z.string().min(1),
});

// Font weights schema
export const fontWeightSchema = z.object({
  light: z.number().int().positive().lte(900),
  normal: z.number().int().positive().lte(900),
  medium: z.number().int().positive().lte(900),
  semibold: z.number().int().positive().lte(900),
  bold: z.number().int().positive().lte(900),
});

// Font sizes schema
export const fontSizeSchema = z.record(z.string().min(1));

// Line heights schema
export const lineHeightSchema = z.record(z.union([z.number(), z.string()]));

// Letter spacing schema
export const letterSpacingSchema = z.record(z.string());

// Typography style compositions schema
export const typographySchema = z.object({
  display: z.string().min(1),
  headline: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  label: z.string().min(1),
  sanskrit: z.string().min(1),
  transliteration: z.string().min(1),
  reference: z.string().min(1),
});

// Raw values

// Font families
const fontFamilyValues = {
  sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  sanskrit: '"Sanskrit2003", "Noto Sans Devanagari", serif',
};

// Font weights
const fontWeightValues = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

// Font sizes (in rem)
const fontSizeValues = {
  xs: '0.75rem',   // 12px
  sm: '0.875rem',  // 14px
  base: '1rem',    // 16px
  lg: '1.125rem',  // 18px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
};

// Line heights
const lineHeightValues = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};

// Letter spacing
const letterSpacingValues = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
};

// Typography style compositions
const typographyValues = {
  display: `text-4xl font-light leading-tight`,
  headline: `text-2xl font-normal leading-normal`,
  title: `text-xl font-medium leading-normal`,
  body: `text-base font-normal leading-relaxed`,
  label: `text-sm font-medium leading-normal`,

  // Sanskrit-specific typography
  sanskrit: `font-sanskrit text-xl leading-relaxed tracking-wide`,
  transliteration: `text-base italic leading-snug tracking-normal`,
  reference: `text-sm font-medium text-neutral-600`,
};

// Parse and validate with Zod
export const fontFamily = fontFamilySchema.parse(fontFamilyValues);
export const fontWeight = fontWeightSchema.parse(fontWeightValues);
export const fontSize = fontSizeSchema.parse(fontSizeValues);
export const lineHeight = lineHeightSchema.parse(lineHeightValues);
export const letterSpacing = letterSpacingSchema.parse(letterSpacingValues);
export const typography = typographySchema.parse(typographyValues);

// Export types
export type FontFamily = z.infer<typeof fontFamilySchema>;
export type FontWeight = z.infer<typeof fontWeightSchema>;
export type FontSize = z.infer<typeof fontSizeSchema>;
export type LineHeight = z.infer<typeof lineHeightSchema>;
export type LetterSpacing = z.infer<typeof letterSpacingSchema>;
export type Typography = z.infer<typeof typographySchema>;
