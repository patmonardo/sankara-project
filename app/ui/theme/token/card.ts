import { z } from 'zod';

// Card schema defines visual templates for content containers
export const cardSchema = z.object({
  // Base card styling
  base: z.string().describe('Base styling for all cards'),

  // Knowledge entity cards
  concept: z.string().describe('Card styling for abstract concepts'),
  text: z.string().describe('Card styling for textual sources'),
  relation: z.string().describe('Card styling for relationships'),
  exploration: z.string().describe('Card styling for exploration elements'),

  // Contextual cards
  primary: z.string().describe('Primary importance card'),
  secondary: z.string().describe('Secondary importance card'),
  info: z.string().describe('Informational card'),

  // Layout variations
  horizontal: z.string().describe('Horizontal card layout'),
  vertical: z.string().describe('Vertical card layout'),
  compact: z.string().describe('Space-efficient card layout'),
  expanded: z.string().describe('Detailed card layout'),
});

// Raw card values
const cardValues = {
  // Base card styling
  base: 'bg-white overflow-hidden transition-all duration-200',

  // Knowledge entity cards
  concept: 'border-l-4 border-l-[#6750A4]',
  text: 'border-l-4 border-l-[#625B71]',
  relation: 'border-l-4 border-l-[#7D5260]',
  exploration: 'border-t-4 border-t-[#9A82DB]',

  // Contextual cards
  primary: 'border-l-4 border-l-purple-500',
  secondary: 'border-l-4 border-l-blue-500',
  info: 'border-l-4 border-l-cyan-500',

  // Layout variations
  horizontal: 'flex flex-row',
  vertical: 'flex flex-col',
  compact: 'p-2',
  expanded: 'p-4 space-y-3',
};

// Parse and validate
export const card = cardSchema.parse(cardValues);
export type Card = z.infer<typeof cardSchema>;
