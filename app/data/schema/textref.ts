export interface TextRef {
  location: TextLocation; // Location info
  registry: TextRegistry; // Registry reference
}

export interface TextLocation {
  path: string; // Universal path format e.g. "/books/1/chapters/2"
}

export interface TextRegistry<T extends TextRef = TextRef> {

  // Cache validation
  isValid(ref: T): boolean; // Validate ref structure
  toString(ref: T): string; // Get path string
  fromPath(path: string): T | undefined; // Create ref from path
  clearCache(): void; // Reset cache state

  // Navigation methods
  getParentRef(ref: T): T | undefined; // Get parent in hierarchy
  getRootRef(ref: T): T; // Get root ref

  // Lookup methods
  find(path: string): TextFindResult; // Find by path
}

export interface TextFindResult {
  found: boolean;
  path: string;
  ref?: TextRef;
}