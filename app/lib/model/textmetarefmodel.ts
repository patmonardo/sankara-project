import { TextRef } from '../type/textref.js';
import {
  TextMetaRef,
  TextMetaRegistry,
  TextKeyword,
  TextDescription,
  TextAnnotation,
  TextMetaType,
} from '../type/textmeta.js';
import { TextBaseRefModel } from './textbaserefmodel.js';

export class TextMetaRefModel 
  extends TextBaseRefModel<TextMetaRef> 
  implements TextMetaRegistry {
  constructor() {
    super();
  }

  addRef(ref: TextMetaRef): void {
    this.refs.set(ref.location.path, ref);
  }
  
  protected validateRef(ref: TextRef): boolean {
    const metaRef = ref as TextMetaRef;
    
    if (!super.validateRef(ref)) {
      return false;
    }
    
    return metaRef.type !== undefined && 
           metaRef.location.path.startsWith('/meta/');
  }

  getRef(path: string): TextMetaRef | undefined {
    return this.refs.get(path) as TextMetaRef;
  }

  removeRef(path: string): void {
    this.refs.delete(path);
  }

  get keywords(): TextKeyword[] {
    return Array.from(this.refs.values()).
      filter(ref => ref.type === TextMetaType.Keyword) as TextKeyword[];
  }

  get descriptions(): TextDescription[] {
    return Array.from(this.refs.values()).
      filter(ref => ref.type === TextMetaType.Description) as TextDescription[];
  }

  get annotations(): TextAnnotation[] {
    return Array.from(this.refs.values()).
      filter(ref => ref.type === TextMetaType.Annotation) as TextAnnotation[];
  }
  
  isKeyword(ref: TextMetaRef): boolean {
    return ref.type === TextMetaType.Keyword;
  }

  isDescription(ref: TextMetaRef): boolean {
    return ref.type === TextMetaType.Description;
  }

  isAnnotation(ref: TextMetaRef): boolean {
    return ref.type === TextMetaType.Annotation;
  }
}