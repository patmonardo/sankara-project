import { TextRef, TextLocation, TextRegistry } from './textref.js';

export interface TextMetaRef extends TextRef {
  type: TextMetaType;
  registry: TextMetaRegistry;
}

export enum TextMetaType {
  Keyword = 'keyword', // Term entries
  Description = 'description', // Content entries
  Annotation = 'annotation', // Knowledge entries
}

export interface TextMetaLocation extends TextLocation {
  keywordRef?: { number: number };
  descriptionRef?: { number: number };
  annotationRef?: { number: number };
}

export interface TextMetaRegistry extends TextRegistry<TextMetaRef> {
    // Data type getters
  isKeyword(ref: TextMetaRef): boolean;
  isDescription(ref: TextMetaRef): boolean;
  isAnnotation(ref: TextMetaRef): boolean;
}

export interface TextKeyword extends TextMetaRef {
  ref: TextMetaRef;
  text: string;
  term: string;
  categories?: string[];
  topics?: string[];
}

export interface TextDescription extends TextMetaRef {
  ref: TextMetaRef; // Reference to self
  text: string; // Description content
  title: string; // Title of the description
  author?: string; // Author of the description
  alternates?: string[]; // Alternate titles
  categories?: string[]; // Categories
  topics?: string[]; // Topics
  notes?: string[]; // Supporting notes
}

export interface TextAnnotation extends TextMetaRef {
  ref: TextMetaRef;
  text: string;
  title?: string; // Title of the annotation
  author?: string; // Author of the description
  date?: string; // Date of the annotation
  references?: string[]; // References
  topics?: string[]; // Topics
  categories?: string[]; // Categories
  source?: string;
  context?: string;
}
