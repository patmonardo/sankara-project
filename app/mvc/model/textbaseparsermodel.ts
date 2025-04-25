import { TextParser, TextParserOptions } from '@/form/data/schema/textparser.js';
import { TextRef, TextRegistry } from '@/form/data/schema/textref.js';
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

export class TextBaseParserModel implements TextParser {
  constructor(options?: TextParserOptions) {
    if (options?.dataSelectors) {
      const { book, chapter, verse, word, comment } = options.dataSelectors;
      if (!book || !chapter || !verse || !word || !comment) {
        throw new Error('Missing required selectors');
      }
    }
  }

  parse(html: string): TextRef {
    const element = this.loadText(html);
    return this.parseRef(element);
  }

  protected loadText(html: string): HTMLElement {
    const dom = new JSDOM(html);
    const element = dom.window.document.body.firstElementChild as HTMLElement;
    if (!element) {
      throw new Error('Invalid HTML structure');
    }
    return element;
  }

  protected parseRef(element: HTMLElement): TextRef {
    // Implementation for parsing a generic TextRef
    return {
      location: { path: element.getAttribute('data-path') || '' },
      registry: {} as TextRegistry, // Placeholder for registry
    };
  }
}
