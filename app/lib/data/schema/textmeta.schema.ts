import { z } from 'zod';

// Define the metadata types enum
export const TextMetaTypeEnum = z.enum([
  'keyword',      // Term entries
  'description',  // Content entries
  'annotation',   // Knowledge entries
]);
export type TextMetaType = z.infer<typeof TextMetaTypeEnum>;

// TextKeyword - focusing on the core properties
export const textKeywordSchema = z.object({
  id: z.string(),                       // From TextRef
  type: z.literal('keyword'),           // From TextMetaType
  text: z.string(),                     // Keyword text content
  term: z.string(),                     // The term/keyword itself
  categories: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
});
export type TextKeyword = z.infer<typeof textKeywordSchema>;

// TextDescription - focusing on content properties
export const textDescriptionSchema = z.object({
  id: z.string(),                       // From TextRef
  type: z.literal('description'),       // From TextMetaType
  text: z.string(),                     // Description content
  title: z.string(),                    // Title of the description
  author: z.string().optional(),        // Author of the description
  alternates: z.array(z.string()).optional(), // Alternate titles
  categories: z.array(z.string()).optional(), // Categories
  topics: z.array(z.string()).optional(),     // Topics
  notes: z.array(z.string()).optional(),      // Supporting notes
});
export type TextDescription = z.infer<typeof textDescriptionSchema>;

// TextAnnotation - focusing on annotation properties
export const textAnnotationSchema = z.object({
  id: z.string(),                       // From TextRef
  type: z.literal('annotation'),        // From TextMetaType
  text: z.string(),                     // Annotation content
  title: z.string().optional(),         // Title of the annotation
  author: z.string().optional(),        // Author of the annotation
  date: z.string().optional(),          // Date of the annotation
  references: z.array(z.string()).optional(), // References
  topics: z.array(z.string()).optional(),     // Topics
  categories: z.array(z.string()).optional(), // Categories
  source: z.string().optional(),        // Source information
  context: z.string().optional(),       // Context information
});
export type TextAnnotation = z.infer<typeof textAnnotationSchema>;

// Union type for all metadata types
export const textMetaSchema = z.discriminatedUnion('type', [
  textKeywordSchema,
  textDescriptionSchema,
  textAnnotationSchema
]);
export type TextMeta = z.infer<typeof textMetaSchema>;

// Simple location schema without circular references
export const textMetaLocationSchema = z.object({
  path: z.string().optional(),
  keywordRef: z.object({ number: z.number() }).optional(),
  descriptionRef: z.object({ number: z.number() }).optional(),
  annotationRef: z.object({ number: z.number() }).optional(),
});
export type TextMetaLocation = z.infer<typeof textMetaLocationSchema>;
