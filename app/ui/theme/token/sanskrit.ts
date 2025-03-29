import { z } from "zod";

// Define schemas for each section
const backgroundsSchema = z.object({
  parchment: z.string(),
  leaf: z.string(),
  scroll: z.string(),
  ancient: z.string(),
});

const bordersSchema = z.object({
  manuscript: z.string(),
  decorated: z.string(),
  ancient: z.string(),
  palm: z.string(),
});

const decorationsSchema = z.object({
  chapter: z.string(),
  verse: z.string(),
  commentary: z.string(),
  title: z.string(),
  colophon: z.string(),
});

const containersSchema = z.object({
  sutra: z.string(),
  bhashya: z.string(),
  tika: z.string(),
  vartika: z.string(),
});

// Add new categorues
const textPatternsSchema = z.object({
  vedic: z.string(),
  classical: z.string(),
  modern: z.string(),
});

const scriptStylesSchema = z.object({
  devanagari: z.string(),
  tamil: z.string(),
  telugu: z.string(),
  grantha: z.string(),
});

// Full schema
export const sanskritSchema = z.object({
  backgrounds: backgroundsSchema,
  borders: bordersSchema,
  decorations: decorationsSchema,
  containers: containersSchema,
  textPatterns: textPatternsSchema,
  scriptStyles: scriptStylesSchema,
});

// Raw values
const sanskritValues = {
  backgrounds: {
    parchment: "bg-amber-50 bg-opacity-40",
    leaf: "bg-emerald-50 bg-opacity-40",
    scroll: "bg-gradient-to-r from-amber-50 to-orange-50",
    ancient: "bg-gradient-to-b from-amber-100 to-amber-50 bg-opacity-60",
  },

  borders: {
    manuscript: "border border-amber-200 rounded-md",
    decorated:
      "border-2 border-amber-300 rounded-md bg-gradient-to-r from-transparent via-amber-100 to-transparent",
    ancient: "border-double border-4 border-amber-300 rounded-lg",
    palm: "border-t border-b border-amber-300 py-1",
  },

  decorations: {
    chapter:
      "font-serif text-2xl text-amber-800 first-letter:text-3xl first-letter:font-bold",
    verse: "font-serif text-lg italic text-amber-900",
    commentary:
      "font-serif text-base text-amber-700 pl-4 border-l-2 border-amber-300",
    title:
      "font-serif text-xl text-amber-900 text-center border-b border-amber-200 pb-2 mb-4",
    colophon: "font-serif text-sm text-amber-800 text-right italic mt-4",
  },

  containers: {
    sutra: "px-4 py-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-md",
    bhashya:
      "px-4 py-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-md my-2 ml-4",
    tika: "px-4 py-2 bg-green-50 border-l-4 border-green-400 rounded-r-md my-2 ml-8",
    vartika:
      "px-4 py-2 bg-purple-50 border-l-4 border-purple-400 rounded-r-md my-2 ml-6",
  },

  textPatterns: {
    vedic: "font-sanskrit tracking-wide text-amber-900",
    classical: "font-sanskrit text-purple-900",
    modern: "font-sans text-gray-900",
  },

  scriptStyles: {
    devanagari: "font-sanskrit text-xl leading-relaxed",
    tamil: "font-tamil text-xl leading-relaxed",
    telugu: "font-telugu text-xl leading-relaxed",
    grantha: "font-grantha text-xl leading-relaxed",
  },
};

// Validate and export
export const sanskrit = sanskritSchema.parse(sanskritValues);
export type Sanskrit = z.infer<typeof sanskritSchema>;

// For backward compatibility
export const sanskritTokens = sanskrit;
