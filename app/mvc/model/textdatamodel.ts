import { TextRef } from '@/form/data/schema/textref';
import { TextDataRefModel } from '@/mvc/model/textdatarefmodel';
import { TextBaseModel } from '@/mvc/model/textbase.model';

export class TextDataModel extends TextBaseModel {
  private dataModel: TextDataRefModel;

  constructor() {
    super();
    this.dataModel = new TextDataRefModel();
  }

  findByPath(path: string): TextRef | undefined {
    return this.dataModel.findRef(path);
  }

  validateMetaRef(ref: TextRef): boolean {
    return false; // Not applicable for data model
  }

  validateDataRef(ref: TextRef): boolean {
    return this.dataModel.isValid(ref);
  }
}
