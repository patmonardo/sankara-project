import { z } from 'zod';

// Pattern is a grammar for visual elements
// It defines how components should relate to each other

// Basic interaction patterns
const interactionPatternSchema = z.object({
  hover: z.string().describe('Visual change when element is hovered'),
  active: z.string().describe('Visual change when element is active/pressed'),
  focus: z.string().describe('Visual change when element is focused'),
  disabled: z.string().describe('Visual state when element is disabled'),
});

// Layout patterns
const layoutPatternSchema = z.object({
  stack: z.string().describe('Vertical arrangement of elements'),
  row: z.string().describe('Horizontal arrangement of elements'),
  grid: z.string().describe('Two-dimensional arrangement of elements'),
  center: z.string().describe('Centering elements both horizontally and vertically'),
  between: z.string().describe('Distributing elements with space between them'),
});

// Content patterns
const contentPatternSchema = z.object({
  primaryContent: z.string().describe('Style for primary content areas'),
  secondaryContent: z.string().describe('Style for secondary content areas'),
  emphasis: z.string().describe('Visual emphasis for important content'),
  deemphasis: z.string().describe('Visual de-emphasis for less important content'),
});

// Knowledge-specific patterns
const knowledgePatternSchema = z.object({
  sanskrit: z.string().describe('Visual pattern for Sanskrit text display'),
  connection: z.string().describe('Visual pattern showing connection between concepts'),
  hierarchy: z.string().describe('Visual pattern showing hierarchical relationships'),
  comparison: z.string().describe('Visual pattern for comparing different concepts'),
  exploration: z.string().describe('Visual pattern encouraging knowledge exploration'),
});

// Surface patterns
const surfacePatternSchema = z.object({
  elevated: z.string().describe('Pattern for surfaces that appear elevated'),
  inset: z.string().describe('Pattern for surfaces that appear inset/recessed'),
  flat: z.string().describe('Pattern for flat surfaces'),
  highlighted: z.string().describe('Pattern for highlighted surfaces'),
  subtle: z.string().describe('Pattern for subtle/understated surfaces'),
});

// The complete pattern schema
export const patternSchema = z.object({
  interaction: interactionPatternSchema,
  layout: layoutPatternSchema,
  content: contentPatternSchema,
  knowledge: knowledgePatternSchema,
  surface: surfacePatternSchema,
});

// Raw pattern values
const patternValues = {
  interaction: {
    hover: 'transition-all duration-200 hover:brightness-105',
    active: 'transition-all duration-75 active:brightness-95',
    focus: 'outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
    disabled: 'opacity-50 cursor-not-allowed',
  },

  layout: {
    stack: 'flex flex-col space-y-4',
    row: 'flex flex-row space-x-4',
    grid: 'grid gap-4',
    center: 'flex justify-center items-center',
    between: 'flex justify-between items-center',
  },

  content: {
    primaryContent: 'prose max-w-none',
    secondaryContent: 'prose-sm text-gray-600',
    emphasis: 'font-medium text-gray-900',
    deemphasis: 'text-sm text-gray-500',
  },

  knowledge: {
    sanskrit: 'bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4',
    connection: 'border-dashed border-2 rounded-md p-2',
    hierarchy: 'ml-4 border-l-2 pl-4',
    comparison: 'grid grid-cols-2 divide-x',
    exploration: 'bg-amber-50 rounded-lg p-4 shadow-inner',
  },

  surface: {
    elevated: 'bg-white shadow-md rounded-lg',
    inset: 'bg-gray-50 border border-gray-100 rounded-md',
    flat: 'bg-white border border-gray-200',
    highlighted: 'bg-yellow-50 border-l-4 border-yellow-400',
    subtle: 'bg-gray-50 rounded',
  },
};

// Parse and validate the pattern values
export const pattern = patternSchema.parse(patternValues);
export type Pattern = z.infer<typeof patternSchema>;
