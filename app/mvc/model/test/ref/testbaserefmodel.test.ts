import { TextRef } from '../../src/type/textref.js';
import { TextBaseRefModel } from '../../src/ref/textbaserefmodel.js';

class TestRefModel extends TextBaseRefModel<TextRef> {}

describe('TextBaseRefModel - Reference System', () => {
  let model: TestRefModel;

  beforeEach(() => {
    model = new TestRefModel();
  });

  describe('Core Operations', () => {
    test('should add and find reference', () => {
      const ref: TextRef = {
        location: { path: '/test' },
        registry: model
      };
      model.add(ref);
      expect(model.find('/test').ref).toBe(ref);
    });
  });

  describe('Map Singleton', () => {
    test('should share references across instances', () => {
      const model1 = new TestRefModel();
      const model2 = new TestRefModel();
      
      const ref: TextRef = {
        location: { path: '/shared' },
        registry: model1
      };
      
      model1.add(ref);
      const foundRef = model2.find('/shared').ref;
      
      expect(foundRef).toBe(ref);  // Same instance
      expect(Object.is(foundRef, ref)).toBe(true);  // Strict equality
    });
  });
});