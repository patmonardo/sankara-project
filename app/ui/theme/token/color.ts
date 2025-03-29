import { z } from 'zod';

// Hex color validator
const hexColorSchema = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color');

// Color with variants schema
const colorWithVariantsSchema = z.object({
  main: hexColorSchema,
  container: hexColorSchema,
  onMain: hexColorSchema,
  onContainer: hexColorSchema,
});

// Knowledge domain color schema
const knowledgeColorSchema = z.object({
  concept: hexColorSchema,
  text: hexColorSchema,
  relation: hexColorSchema,
  exploration: hexColorSchema,
});

// Relation color schema
export const relationColorSchema = z.object({
  contains: hexColorSchema,
  defines: hexColorSchema,
  opposes: hexColorSchema,
  enhances: hexColorSchema,
});

// State colors schema
const stateColorSchema = z.object({
  error: hexColorSchema,
  success: hexColorSchema,
  warning: hexColorSchema,
  info: hexColorSchema,
});

// Neutral palette schema
export const neutralPaletteSchema = z.record(hexColorSchema);

// Complete colors schema
export const colorSchema = z.object({
  primary: colorWithVariantsSchema,
  secondary: colorWithVariantsSchema,
  surface: z.object({
    main: hexColorSchema,
    dim: hexColorSchema,
    container: hexColorSchema,
  }),
  outline: hexColorSchema,
  knowledge: knowledgeColorSchema,
  relation: relationColorSchema,
  state: stateColorSchema,
  neutral: neutralPaletteSchema,
});

// Raw values
const colorValues = {
  primary: {
    main: '#6750A4',
    container: '#EADDFF',
    onMain: '#FFFFFF',
    onContainer: '#21005D',
  },
  secondary: {
    main: '#625B71',
    container: '#E8DEF8',
    onMain: '#FFFFFF',
    onContainer: '#1D192B',
  },
  surface: {
    main: '#FFFBFE',
    dim: '#F4EFF4',
    container: '#F3EDF7',
  },
  outline: '#79747E',

  // Knowledge domain-specific colors
  knowledge: {
    concept: '#C69AEF',
    text: '#A7BFFD',
    relation: '#9EE7D8',
    exploration: '#FFCF86',
  },

  // Semantic colors for different types of relationships
  relation: {
    contains: '#A7D7A7',
    defines: '#F6C3B6',
    opposes: '#FCC2C2',
    enhances: '#B6E3F6',
  },

  // State colors
  state: {
    error: '#B3261E',
    success: '#386A20',
    warning: '#7D5700',
    info: '#00639D',
  },

  // Neutral palette
  neutral: {
    50: '#F8F9FA',
    100: '#F1F3F5',
    200: '#E9ECEF',
    300: '#DEE2E6',
    400: '#CED4DA',
    500: '#ADB5BD',
    600: '#6C757D',
    700: '#495057',
    800: '#343A40',
    900: '#212529',
  }
};

// Parse and validate
export const color = colorSchema.parse(colorValues);

// Export types
export type Color = z.infer<typeof colorSchema>;
export type ColorWithVariants = z.infer<typeof colorWithVariantsSchema>;
export type KnowledgeColor = z.infer<typeof knowledgeColorSchema>;
export type RelationColor = z.infer<typeof relationColorSchema>;
