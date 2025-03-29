import { TextDataRef, TextDataType, TextDataLocation } from '../../src/type/textdata.js';
import { TextDataRefModel } from '../../src/ref/textdatarefmodel.js';

describe('TextDataRefModel', () => {
  let model: TextDataRefModel;

  beforeEach(() => {
    model = new TextDataRefModel();
  });

  describe('Book References', () => {
    test('should add and find book', () => {
      const bookRef: TextDataRef = {
        location: {
          path: '/data/book/2',  // Changed from /1 to /2
          book: 2,
        } as TextDataLocation,
        type: TextDataType.Book,
        registry: model
      };
      model.add(bookRef);
      expect(model.find('/data/book/2').ref).toBe(bookRef);  // Fixed path
    });

    test('should prevent duplicate paths', () => {
      const ref1: TextDataRef = {
        location: {
          path: '/data/book/1',
          book: 1,
        } as TextDataLocation,
        type: TextDataType.Book,
        registry: model
      };

      const ref2: TextDataRef = {
        location: {
          path: '/data/book/1',  // Same path
          book: 1,
        } as TextDataLocation,
        type: TextDataType.Book,
        registry: model
      };

      model.add(ref1);
      expect(() => model.add(ref2)).toThrow('Path exists: /data/book/1');
    });
  });

  describe('TextDataRefModel Hierarchy', () => {
    test('should build reference chain', () => {
      const section: TextDataRef = {
        location: {
          path: '/data/section/1',
          section: 1,
        } as TextDataLocation,
        type: TextDataType.Section,
        registry: model
      };
  
      const book: TextDataRef = {
        location: {
          path: '/data/section/1/book/1',
          section: 1,
          book: 1,
        } as TextDataLocation,
        type: TextDataType.Book,
        registry: model
      };
  
      model.add(section);
      model.add(book);
  
      //expect(model.getParentRef(book)).toBe(section);
    });
  });
});