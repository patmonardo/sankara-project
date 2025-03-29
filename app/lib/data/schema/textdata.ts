import { TextRef, TextLocation, TextRegistry } from './textref';

export interface TextDataRef extends TextRef {
  type: TextDataType; // Data type
  registry: TextDataRegistry; // Registry reference
}

export enum TextDataType {
  Section = 'section', // Major division
  Book = 'book', // Primary text unit
  Chapter = 'chapter', // Chapter unit
  Verse = 'verse', // Text unit
  Word = 'word', // Word unit
  Comment = 'comment', // Commentary unit
}

export interface TextDataLocation extends TextLocation {
  section?: number,
  book?: number,
  chapter?: number,
  verse?: number,
  word?: number,
  commentRef?: number,
}

export interface TextDataRegistry extends TextRegistry<TextDataRef> {
  // Data type getters
  readonly sections: TextSection[];
  readonly books: TextBook[];
  readonly chapters: TextChapter[];
  readonly verses: TextVerse[];
  readonly words: TextWord[];
  readonly comments: TextComment[];
}

export interface TextSection extends TextDataRef {
  text: string;
  comments: TextComment[];
}

export interface TextBook extends TextSection {
  title: string;
  author?: string;
  chapters?: TextChapter[];
}

export interface TextChapter extends TextSection {
  verses: TextVerse[];
}

export interface TextVerse extends TextSection {
  words: TextWord[];
}

export interface TextWord extends TextSection {
  sanskrit?: string; // Word-specific
  transliterated?: string; // Word-specific
  position?: TextPosition; // Optional location
}

export interface TextComment extends TextSection {
  author?: string;
  date?: string;
  sourceRefs?: TextDataRef[]; // Simpler reference model
}

export interface TextPosition {
  line: number;
  offset: number;
}
