import {
  TextDataType,
  TextChapter,
  TextVerse,
  TextWord,
} from '../../src/type/textdata.js';
import { book2 } from '../../../../../tests/fixtures/textdata/book2.js';

let chapter1: TextChapter;
let chapter2: TextChapter;
let verse1: TextVerse;
let verse2: TextVerse;
let word1: TextWord;
let word2: TextWord;

describe('TextData Fixture Import', () => {
  beforeEach(() => {
    chapter1 = book2.sections[0] as TextChapter;
    chapter2 = book2.sections[1] as TextChapter;
    verse1 = chapter1.verses[0];
    verse2 = chapter2.verses[1];
    word1 = verse1.words[0];
    word2 = verse2.words[1];
  });

  describe('Chapters', () => {
    test('chapter1 should have correct structure', () => {
      expect(chapter1.text).toBe('अथातो ब्रह्मजिज्ञासा');
      expect(chapter1.verses.length).toBe(1);
      expect(chapter1.ref.type).toBe(TextDataType.Chapter);
      expect(chapter1.ref.location.path).toBe('/data/books/1/chapters/1');
    });

    test('chapter2 should have correct structure', () => {
      expect(chapter2.text).toBe('जन्माद्यस्य यतः');
      expect(chapter2.verses.length).toBe(2);
      expect(chapter2.ref.type).toBe(TextDataType.Chapter);
      expect(chapter2.ref.location.path).toBe('/data/books/1/chapters/2');
    });
  });

  describe('Verses', () => {
    test('verse1 should have correct structure', () => {
      expect(verse1.text).toBe('अथातो ब्रह्मजिज्ञासा');
      expect(verse1.words.length).toBe(1);
      expect(verse1.ref.type).toBe(TextDataType.Verse);
      expect(verse1.ref.location.path).toBe(
        '/data/books/1/chapters/1/verses/1'
      );
    });

    test('verse2 should have correct structure', () => {
      expect(verse2.text).toBe('जन्माद्यस्य यतः');
      expect(verse2.words.length).toBe(2);
      expect(verse2.ref.type).toBe(TextDataType.Verse);
      expect(verse2.ref.location.path).toBe(
        '/data/books/1/chapters/2/verses/2'
      );
    });
  });

  describe('Words', () => {
    test('word1 should have correct structure', () => {
      expect(word1.text).toBe('अथ');
      expect(word1.sanskrit).toBe('अथ');
      expect(word1.transliterated).toBe('atha');
      expect(word1.ref.type).toBe(TextDataType.Word);
      expect(word1.ref.location.path).toBe(
        '/data/books/1/chapters/1/verses/1/words/1'
      );
    });

    test('word2 should have correct structure', () => {
      expect(word2.text).toBe('अतः');
      expect(word2.sanskrit).toBe('अतः');
      expect(word2.transliterated).toBe('ataḥ');
      expect(word2.ref.type).toBe(TextDataType.Word);
      expect(word2.ref.location.path).toBe(
        '/data/books/1/chapters/1/verses/1/words/2'
      );
    });
  });
});
