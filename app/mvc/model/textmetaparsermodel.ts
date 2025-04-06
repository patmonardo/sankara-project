import {
  TextMetaRef,
  TextMetaType,
  TextMetaRegistry,
  TextKeyword,
  TextDescription,
  TextAnnotation,
} from "@/lib/data/schema/textmeta.js";
import { TextMetaParser, TextParserOptions } from "@/lib/data/schema/textparser.js";
import { TextBaseParserModel } from "@/lib/model/textbaseparsermodel.js";

export class TextMetaParserModel
  extends TextBaseParserModel
  implements TextMetaParser
{
  private selectors: TextParserOptions["metaSelectors"];

  constructor(options: TextParserOptions) {
    super(options);
    if (!options.metaSelectors) {
      throw new Error("Missing required meta selectors");
    }
    this.selectors = options.metaSelectors;
  }

  parse(html: string): TextMetaRef {
    const element = this.loadText(html);
    return this.parseMetaRefFromElement(element);
  }

  parseMetaRef(html: string): TextMetaRef {
    const element = this.loadText(html);
    return this.parseMetaRefFromElement(element);
  }

  parseMetaRefFromElement(element: HTMLElement): TextMetaRef {
    const baseRef = super.parseRef(element);
    return {
      ...baseRef,
      type: this.getMetaTypeFromClass(element.className),
      registry: {} as TextMetaRegistry,
    };
  }

  parseKeyword(html: string): TextKeyword {
    const element = this.loadText(html);
    const baseRef = this.parseMetaRefFromElement(element);
    return {
      ...baseRef,
      text: element.textContent || "",
      term: element.getAttribute("data-term") || "",
      categories: element.getAttribute("data-categories")?.split(",") || [],
      topics: element.getAttribute("data-topics")?.split(",") || [],
    } as TextKeyword;
  }

  parseDescription(html: string): TextDescription {
    const element = this.loadText(html);
    const baseRef = this.parseMetaRefFromElement(element);
    return {
      ...baseRef,
      text: element.textContent || "",
      title: element.getAttribute("data-title") || "",
      author: element.getAttribute("data-author") || "",
      alternates: element.getAttribute("data-alternates")?.split(",") || [],
      categories: element.getAttribute("data-categories")?.split(",") || [],
      topics: element.getAttribute("data-topics")?.split(",") || [],
    } as TextDescription;
  }

  parseAnnotation(html: string): TextAnnotation {
    const element = this.loadText(html);
    const baseRef = this.parseMetaRefFromElement(element);
    return {
      ...baseRef,
      text: element.textContent || "",
      author: element.getAttribute("data-author") || "",
      date: element.getAttribute("data-date") || "",
    } as TextAnnotation;
  }

  private getMetaTypeFromClass(className: string): TextMetaType {
    switch (className) {
      case "keyword":
        return TextMetaType.Keyword;
      case "description":
        return TextMetaType.Description;
      case "annotation":
        return TextMetaType.Annotation;
      default:
        throw new Error(`Unknown meta type: ${className}`);
    }
  }
}
