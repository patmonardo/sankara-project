import { TextRef } from '../type/textref.js';
import { TextMetaRef } from '../type/textmeta.js';
import {
  TextDataRef,
  TextSection ,
  TextBook,
  TextChapter,
  TextVerse,
  TextComment,
  TextWord,
} from '../type/textdata.js';

export interface TextParser <T extends TextRef = TextRef> {
  parse(html: string): T;
}

export interface TextMetaParser extends TextParser<TextMetaRef> {
  parseMetaRef(html: string): TextMetaRef;
  parseKeyword(html: string): TextMetaRef;
  parseDescription(html: string): TextMetaRef;
  parseAnnotation(html: string): TextMetaRef;
}

export interface TextDataParser extends TextParser<TextDataRef> {
  parseDataRef(html: string): TextDataRef;
  parseSection(html: string): TextSection;
  parseBook(html: string): TextBook;
  parseChapter(html: string): TextChapter;
  parseVerse(html: string): TextVerse;
  parseWord(html: string): TextWord;
  parseComment(html: string): TextComment;
}

export interface TextParserOptions {
  metaSelectors: TextMetaSelectors;
  dataSelectors: TextDataSelectors;
  encoding?: string;
}

export interface TextMetaSelectors {
  title: string;
  description: string;
  keywords: string;
}

export interface TextDataSelectors {
  section: string;
  book: string;
  chapter: string;
  verse: string;
  word: string;
  comment: string;
}