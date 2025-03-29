import { TextMetaRefModel } from '../../src/ref/textmetarefmodel.js';
import { TextMetaRef, TextMetaType } from '../../src/type/textmeta.js';

describe('TextMetaRefModel', () => {
  let model: TextMetaRefModel;

  beforeEach(() => {
    model = new TextMetaRefModel();
  });

  describe('Keyword References', () => {
    test('should add and find keyword', () => {
      const keywordRef: TextMetaRef = {
        location: { 
          path: '/meta/keywords/1'
        },
        type: TextMetaType.Keyword,
        registry: model
      };
      model.add(keywordRef);
      expect(model.find('/meta/keywords/1').ref).toBe(keywordRef);
    });

    test('should prevent duplicate paths', () => {
      const ref1: TextMetaRef = {
        location: { 
          path: '/meta/keywords/1'
        },
        type: TextMetaType.Keyword,
        registry: model
      };

      expect(() => model.add(ref1)).toThrow('Path exists: /meta/keywords/1');
    });
  });
});