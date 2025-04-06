import { TextMetaType } from '../../src/type/textmeta.js';
import { meta1 } from '../../../../../tests/fixtures/textmeta/meta1.js';
import { description1 } from '../../../../../tests/fixtures/textmeta/descriptions/description1.js';
import { keyword1 } from '../../../../../tests/fixtures/textmeta/keywords/keyword1.js';
import { annotation1 } from '../../../../../tests/fixtures/textmeta/annotations/annotation1.js';

describe('TextMeta Fixtures', () => {
  describe('meta1', () => {
    test('should have correct structure', () => {
      // Example checks (adjust fields to match actual fixture)
      expect(meta1.term).toBe('ब्रह्मसूत्र');
      expect(meta1.categories).toContain('Text');
      expect(meta1.topics).toContain('Vedānta');
      expect(meta1.ref.type).toBe(TextMetaType.Description);
      expect(meta1.ref.location.path).toBe('/meta/sources/1');
    });
  });

  describe('description1', () => {
    test('should have correct structure', () => {
      // Example checks (adjust fields to match actual fixture)
      expect(description1.title).toBe('समन्वय');
      //expect(description1.text).toMatch('/अथातो/');
      expect(description1.author).toBe('Śaṅkara');
      expect(description1.ref.type).toBe(TextMetaType.Description);
      expect(description1.ref.location.path).toBe('/meta/descriptions/1');
    });
  });

  describe('keyword1', () => {
    test('should have correct structure', () => {
      // Example checks (adjust fields to match actual fixture)
      expect(keyword1.term).toBe('ब्रह्मन्');
      expect(keyword1.categories).toContain('metaphysics');
      expect(keyword1.topics).toContain('reality');
      expect(keyword1.ref.type).toBe(TextMetaType.Keyword);
      expect(keyword1.ref.location.path).toBe('/meta/keywords/1');
    });
  });

  describe('annotation1', () => {
    test('should have correct structure', () => {
      // Example checks (adjust fields to match actual fixture)
      expect(annotation1.title).toBe('अथातो ब्रह्मजिज्ञासा');
      expect(annotation1.text).toMatch(/Athaato Brahma Jijnasa/);
      expect(annotation1.author).toBe('Śaṅkara');
      expect(annotation1.ref.type).toBe(TextMetaType.Annotation);
      expect(annotation1.ref.location.path).toBe('/meta/annotations/1');
    });
  });
});
