import {
  TextDataRef,
  TextDataType,
  TextDataRegistry,
} from "@/data/schema/textdata.js";
import {
  TextBook,
  TextChapter,
  TextVerse,
  TextWord,
  TextComment,
  TextSection,
} from "@/data/schema/textdata.js";
import { TextDataParser, TextParserOptions } from "@/data/schema/textparser.js";
import { TextBaseParserModel } from "./textbaseparsermodel.js";

export class TextDataParserModel
  extends TextBaseParserModel
  implements TextDataParser
{
  private selectors: TextParserOptions["dataSelectors"];

  constructor(options: TextParserOptions) {
    super(options);
    if (!options.dataSelectors) {
      throw new Error("Missing required data selectors");
    }
    this.selectors = options.dataSelectors;
  }

  parse(html: string): TextDataRef {
    const element = this.loadText(html);
    return this.parseDataRefFromElement(element);
  }

  parseDataRef(html: string): TextDataRef {
    const element = this.loadText(html);
    return this.parseDataRefFromElement(element);
  }

  parseSection(html: string): TextSection {
    const element = this.loadText(html);
    return this.parseSectionFromElement(element);
  }

  parseBook(html: string): TextBook {
    const element = this.loadText(html);
    return this.parseBookFromElement(element);
  }

  parseChapter(html: string): TextChapter {
    const element = this.loadText(html);
    return this.parseChapterFromElement(element);
  }

  parseVerse(html: string): TextVerse {
    const element = this.loadText(html);
    return this.parseVerseFromElement(element);
  }

  parseWord(html: string): TextWord {
    const element = this.loadText(html);
    return this.parseWordFromElement(element);
  }

  parseComment(html: string): TextComment {
    const element = this.loadText(html);
    return this.parseCommentFromElement(element);
  }

  parseDataRefFromElement(element: HTMLElement): TextDataRef {
    const baseRef = super.parseRef(element);
    return {
      ...baseRef,
      type: this.getDataTypeFromClass(element.className),
      registry: {} as TextDataRegistry,
    };
  }

  parseSectionFromElement(element: HTMLElement): TextSection {
    const baseRef = this.parseDataRefFromElement(element);
    return {
      ...baseRef,
      text: element.textContent || "",
      chapters: this.getChapters(element),
      comments: this.getComments(element),
    } as TextSection;
  }

  parseBookFromElement(element: HTMLElement): TextBook {
    const baseRef = this.parseDataRefFromElement(element);
    return {
      ...baseRef,
      title: element.getAttribute("data-title") || "",
      author: element.getAttribute("data-author") || "",
      chapters: this.getChapters(element),
    } as TextBook;
  }

  parseChapterFromElement(element: HTMLElement): TextChapter {
    const baseRef = this.parseDataRefFromElement(element);
    return {
      ...baseRef,
      title: element.getAttribute("data-title") || "",
      text: element.textContent || "",
      verses: this.getVerses(element),
      comments: this.getComments(element),
    } as TextChapter;
  }

  parseVerseFromElement(element: HTMLElement): TextVerse {
    const baseRef = this.parseDataRefFromElement(element);
    return {
      ...baseRef,
      text: element.textContent || "",
      words: this.getWords(element),
      comments: this.getComments(element),
    } as TextVerse;
  }

  parseWordFromElement(element: HTMLElement): TextWord {
    const baseRef = this.parseDataRefFromElement(element);
    return {
      ...baseRef,
      text: element.textContent || "",
      sanskrit: element.getAttribute("data-sanskrit") || "",
      transliterated: element.getAttribute("data-transliterated") || "",
      comments: this.getComments(element),
    } as TextWord;
  }

  parseCommentFromElement(element: HTMLElement): TextComment {
    const baseRef = this.parseDataRefFromElement(element);
    return {
      ...baseRef,
      text: element.textContent || "",
      author: element.getAttribute("data-author") || "",
      date: element.getAttribute("data-date") || "",
      comments: this.getComments(element),
    } as TextComment;
  }

  // Private element parsers
  private getSections(element: HTMLElement): TextSection[] {
    const sections = element.querySelectorAll(this.selectors.section);
    return Array.from(sections).map((section) =>
      this.parseSectionFromElement(section as HTMLElement)
    );
  }

  private getChapters(element: HTMLElement): TextChapter[] {
    const chapters = element.querySelectorAll(this.selectors.chapter);
    return Array.from(chapters).map((chapter) =>
      this.parseChapterFromElement(chapter as HTMLElement)
    );
  }

  private getVerses(element: HTMLElement): TextVerse[] {
    const verses = element.querySelectorAll(this.selectors.verse);
    return Array.from(verses).map((verse) =>
      this.parseVerseFromElement(verse as HTMLElement)
    );
  }

  private getWords(element: HTMLElement): TextWord[] {
    const words = element.querySelectorAll(this.selectors.word);
    return Array.from(words).map((word) =>
      this.parseWordFromElement(word as HTMLElement)
    );
  }

  private getComments(element: HTMLElement): TextComment[] {
    const comments = element.querySelectorAll(this.selectors.comment);
    return Array.from(comments).map((comment) =>
      this.parseCommentFromElement(comment as HTMLElement)
    );
  }

  private getDataTypeFromClass(className: string): TextDataType {
    switch (className) {
      case "book":
        return TextDataType.Book;
      case "chapter":
        return TextDataType.Chapter;
      case "section":
        return TextDataType.Section;
      case "verse":
        return TextDataType.Verse;
      case "word":
        return TextDataType.Word;
      case "comment":
        return TextDataType.Comment;
      default:
        throw new Error(`Unknown data type: ${className}`);
    }
  }
}
