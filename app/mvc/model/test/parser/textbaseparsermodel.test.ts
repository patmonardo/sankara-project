import { TextBaseParserModel } from '../../src/parser/textbaseparsermodel';
import { TextParserOptions } from '../../src/type/textparser.js';

describe('TextBaseParserModel', () => {
  let options: TextParserOptions;

  beforeEach(() => {
    options = {
      metaSelectors: {
        title: '.title',
        description: '.desc',
        keywords: '.keys'
      },
      dataSelectors: {
        section: '.section',
        book: '.book',
        chapter: '.chapter',
        verse: '.verse',
        word: '.word',
        comment: '.comment'
      }
    };
    parser = new TextBaseParserModel(options);
  });

  describe('Options Validation', () => {
    test('should initialize with valid options', () => {
      expect(() => new TextBaseParserModel(options)).not.toThrow();
    });
  });

  // Add more tests as needed...
});