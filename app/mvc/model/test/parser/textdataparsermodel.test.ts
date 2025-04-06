import { TextDataParserModel } from '../../src/parser/textdataparsermodel.js';
import { TextParserOptions } from '../../src/type/textparser.js';

const options: TextParserOptions = {
  dataSelectors: {
    section: '.section',
    book: '.book',
    chapter: '.chapter',
    verse: '.verse',
    word: '.word',
    comment: '.comment',
  },
  metaSelectors: {
    title: '.title',
    description: '.description',
    keywords: '.keywords',
  },
};

describe('TextDataParserModel', () => {
  let parser: TextDataParserModel;

  beforeEach(() => {
    parser = new TextDataParserModel(options);
  });

  test('should parse a book', () => {
    const html = '<div class="book" data-title="Book Title" data-author="Author Name"></div>';
    const book = parser.parseBook(html);
    expect(book.title).toBe('Book Title');
    expect(book.author).toBe('Author Name');
  });

  test('should parse a chapter', () => {
   // const html = '<div class="chapter" data-title="Chapter Title"></div>';
    //const chapter = parser.parseChapter(html);
   //expect(chapter.text).toBe('Chapter Title');
  });

  // Add more tests for other methods...
});