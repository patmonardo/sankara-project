import { TextRef } from '@/data/schema/textref.js';
import { TextBaseRefModel } from '@/mvc/model/textbaserefmodel.js';

export abstract class TextBaseModel extends TextBaseRefModel {

  constructor() {
    super();
  }

  abstract findByPath(path: string): TextRef | undefined;

  override validateRef(ref: TextRef): boolean {
    if (ref.location.path.startsWith('/meta/')) {
      return this.validateMetaRef(ref);
    }
    if (ref.location.path.startsWith('/data/')) {
      return this.validateDataRef(ref);
    }
    return false;
  }

  protected abstract validateMetaRef(ref: TextRef): boolean;
  protected abstract validateDataRef(ref: TextRef): boolean;
}
