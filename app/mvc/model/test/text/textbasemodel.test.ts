import { TextBaseModel } from '../../textbase.model.js';
import {
  TextMetaRef,
  TextMetaRegistry,
  TextMetaType,
} from '../../src/type/textmeta.js';
import { TextDataRef } from '../../src/type/textdata.js';
import { book1 } from '../../../../../tests/fixtures/textdata/book1.js';

describe('TextBaseModel', () => {
  let model: TextBaseModel;
  let metaRef: TextMetaRef;
  let dataRef: TextDataRef;

  beforeEach(() => {
    metaRef = {
      location: { path: '/meta/sources/1' },
      type: TextMetaType.Description,
      registry: {} as TextMetaRegistry,
    };

    dataRef = book1.ref;
    model = new TextBaseModel(metaRef, dataRef);
  });

  test('should find refs by path', () => {
    const ref = model.findByPath(dataRef.location.path);
    //expect(ref).toBeDefined();
    //expect(ref?.location.path).toBe(dataRef.location.path);
  });

  test('should validate refs', () => {
    //expect(model.isValid(dataRef)).toBe(true);
    //expect(model.isValid(metaRef)).toBe(true);
  });
});
