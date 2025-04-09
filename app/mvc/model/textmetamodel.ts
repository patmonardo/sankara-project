import { TextMetaRef } from '@/data/schema/textmeta';
import { TextMetaRefModel } from '@/mvc/model/textmetarefmodel';
import { TextBaseModel } from '@/mvc/model/textbase.model';

export class TextMetaModel extends TextBaseModel {
  private metaModel: TextMetaRefModel;

  constructor() {
    super();
    this.metaModel = new TextMetaRefModel();
  }

  findByPath(path: string): TextMetaRef | undefined {
    return this.metaModel.find(path);
  }

  validateMetaRef(ref: TextMetaRef): boolean {
    return this.metaModel.isValid(ref);
  }

  validateDataRef(ref: TextMetaRef): boolean {
    return false; // Not applicable for meta model
  }
}
