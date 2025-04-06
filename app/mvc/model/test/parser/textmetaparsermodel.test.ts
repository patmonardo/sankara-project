import { TextMetaParserModel } from '../../src/parser/textmetaparsermodel.js';
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

describe('TextMetaParserModel', () => {
  let parser: TextMetaParserModel;

  beforeEach(() => {
    parser = new TextMetaParserModel(options);
  });

  test('should parse a keyword', () => {
    const html = '<div class="keyword" data-term="Keyword Term"></div>';
    const keyword = parser.parseKeyword(html);
    expect(keyword.term).toBe('Keyword Term');
  });

  test('should parse a description', () => {
    const html = '<div class="description" data-title="Description Title"></div>';
    const description = parser.parseDescription(html);
    expect(description.title).toBe('Description Title');
  });

  // Add more tests for other methods...
});