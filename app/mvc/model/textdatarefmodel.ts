import {
  TextDataRef,
  TextDataType,
  TextDataLocation,
  TextDataRegistry,
  TextBook,
  TextSection,
  TextChapter,
  TextVerse,
  TextWord,
  TextComment,
} from "@/lib/data/schema/textdata.js";
import { TextBaseRefModel } from "@/lib/model/textbaserefmodel.js";

export class TextDataRefModel
  extends TextBaseRefModel<TextDataRef>
  implements TextDataRegistry
{
  constructor() {
    super();
  }

  add(ref: TextDataRef): void {
    if (!this.validateRef(ref)) {
      throw new Error("Invalid ref");
    }
    super.add(ref);
  }

  // Override validation
  protected validateRef(ref: TextDataRef): boolean {
    const dataRef = ref as TextDataRef;
    const location = dataRef.location as TextDataLocation;

    // if (!location?.bookRef?.number) {
    //   return false;
    // }

    const path = location.path;
    if (!path.startsWith("/data/")) {
      return false;
    }

    return super.validateRef(ref);
  }

  get books(): TextBook[] {
    return Array.from(this.refs.values()).filter(
      (ref) => ref.type === TextDataType.Book
    ) as TextBook[];
  }

  get sections(): TextSection[] {
    return Array.from(this.refs.values()).filter(
      (ref) => ref.type === TextDataType.Section
    ) as TextSection[];
  }

  get chapters(): TextChapter[] {
    return Array.from(this.refs.values()).filter(
      (ref) => ref.type === TextDataType.Chapter
    ) as TextChapter[];
  }

  get verses(): TextVerse[] {
    return Array.from(this.refs.values()).filter(
      (ref) => ref.type === TextDataType.Verse
    ) as TextVerse[];
  }

  get words(): TextWord[] {
    return Array.from(this.refs.values()).filter(
      (ref) => ref.type === TextDataType.Word
    ) as TextWord[];
  }

  get comments(): TextComment[] {
    return Array.from(this.refs.values()).filter(
      (ref) => ref.type === TextDataType.Comment
    ) as TextComment[];
  }
}
