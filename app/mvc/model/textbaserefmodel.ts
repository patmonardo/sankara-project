import {
  TextRef,
  TextRegistry,
  TextFindResult
 } from '@/lib/data/schema/textref.js';

export abstract class TextBaseRefModel<T extends TextRef = TextRef>
    implements TextRegistry<T> {

  private static readonly _refs = new Map<string, TextRef>();
  protected readonly refs: Map<string, T>;

  constructor() {
    this.refs = TextBaseRefModel._refs as Map<string, T>;
  }

  // Data Map

  get ref(): (path: string) => T | undefined {
    return (path: string) => this.refs.get(path);
  }

  // Interface generiocs
  isValid(ref: T): boolean {
    return this.validateRef(ref);
  }

  toString(ref: T): string {
    return ref.location.path;
  }

  fromPath(path: string): T | undefined {
    return this.refs.get(path);
  }

  clearCache(): void {
    this.refs.clear();
  }

  getParentRef(ref: T): T | undefined {
    const parentPath = this.getParentPath(ref.location.path);
    return parentPath ? this.refs.get(parentPath) : undefined;
  }

  getRootRef(ref: T): T {
    let current = ref;
    let parent = this.getParentRef(current);

    while (parent) {
      current = parent;
      parent = this.getParentRef(current);
    }

    return current;
  }

  set(path: string, ref: T): void {
    if (!this.isValid(ref)) {
      throw new Error('Invalid ref');
    }
    ref.location.path = path;
    this.refs.set(path, ref);
  }

  add(ref: T): void {
    if (!this.isValid(ref)) {
      throw new Error('Invalid ref');
    }
    if (this.refs.has(ref.location.path)) {
      throw new Error(`Path exists: ${ref.location.path}`);
    }
    this.set(ref.location.path, ref);
  }

  find(path: string): TextFindResult {
    const ref = this.refs.get(path);
    return { found: ref !== undefined, path, ref };
  }

  //  navigation methods
  protected getParentPath(path: string): string | undefined {
    const lastSlash = path.lastIndexOf('/');
    return lastSlash > 0 ? path.substring(0, lastSlash) : undefined;
  }

  //  validation methods
  protected validatePath(path: string): boolean {
    return path.startsWith('/');
  }

  protected validateRef(ref: TextRef): boolean {
    return ref.location?.path !== undefined;
  }

}
