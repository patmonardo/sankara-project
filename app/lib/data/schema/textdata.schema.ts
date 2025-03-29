import { z } from 'zod';

// Define the text data types enum
export const TextDataTypeEnum = z.enum([
  'section',   // Major division
  'book',      // Primary text unit
  'chapter',   // Chapter unit
  'verse',     // Text unit
  'word',      // Word unit
  'comment',   // Commentary unit
]);
export type TextDataType = z.infer<typeof TextDataTypeEnum>;

// Position schema for words
export const textPositionSchema = z.object({
  line: z.number(),
  offset: z.number(),
});
export type TextPosition = z.infer<typeof textPositionSchema>;

// Location schema
export const textDataLocationSchema = z.object({
  path: z.string().optional(),
  section: z.number().optional(),
  book: z.number().optional(),
  chapter: z.number().optional(),
  verse: z.number().optional(),
  word: z.number().optional(),
  commentRef: z.number().optional(),
});
export type TextDataLocation = z.infer<typeof textDataLocationSchema>;

// Basic reference fields shared by all text data types
const baseTextDataFields = {
  id: z.string(),
  type: TextDataTypeEnum,
  text: z.string(),
};

// TextSection - base text unit
export const textSectionSchema = z.object({
  ...baseTextDataFields,
  type: z.literal('section'),
  // We'll handle comments array through refining later
});
export type TextSection = z.infer<typeof textSectionSchema>;

// TextBook - extends section with title and author
export const textBookSchema = textSectionSchema.extend({
  type: z.literal('book'),
  title: z.string(),
  author: z.string().optional(),
  // We'll handle chapters array through refining later
});
export type TextBook = z.infer<typeof textBookSchema>;

// TextChapter - extends section with verses
export const textChapterSchema = textSectionSchema.extend({
  type: z.literal('chapter'),
  // We'll handle verses array through refining later
});
export type TextChapter = z.infer<typeof textChapterSchema>;

// TextVerse - extends section with words
export const textVerseSchema = textSectionSchema.extend({
  type: z.literal('verse'),
  // We'll handle words array through refining later
});
export type TextVerse = z.infer<typeof textVerseSchema>;

// TextWord - extends section with word-specific fields
export const textWordSchema = textSectionSchema.extend({
  type: z.literal('word'),
  sanskrit: z.string().optional(),
  transliterated: z.string().optional(),
  position: textPositionSchema.optional(),
});
export type TextWord = z.infer<typeof textWordSchema>;

// TextComment - extends section with comment-specific fields
export const textCommentSchema = textSectionSchema.extend({
  type: z.literal('comment'),
  author: z.string().optional(),
  date: z.string().optional(),
  // We'll handle sourceRefs differently
  sourceRefs: z.array(z.string()).optional(), // Just store IDs instead of full references
});
export type TextComment = z.infer<typeof textCommentSchema>;

// Create unions for discriminated types
export const textDataSchema = z.discriminatedUnion('type', [
  textSectionSchema,
  textBookSchema,
  textChapterSchema,
  textVerseSchema,
  textWordSchema,
  textCommentSchema
]);
export type TextData = z.infer<typeof textDataSchema>;

// Simple container type for collections of text data
export const textDataCollectionSchema = z.object({
  sections: z.array(textSectionSchema),
  books: z.array(textBookSchema),
  chapters: z.array(textChapterSchema),
  verses: z.array(textVerseSchema),
  words: z.array(textWordSchema),
  comments: z.array(textCommentSchema),
});
export type TextDataCollection = z.infer<typeof textDataCollectionSchema>;
