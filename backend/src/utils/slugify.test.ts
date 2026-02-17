import { generateSlug } from './slugify';

describe('generateSlug', () => {
  it('should lowercase all characters', () => {
    expect(generateSlug('CAMISETA')).toBe('camiseta');
  });

  it('should replace spaces with hyphens', () => {
    expect(generateSlug('Camiseta Meme Gato')).toBe('camiseta-meme-gato');
  });

  it('should strip accent marks (diacritics)', () => {
    expect(generateSlug('café')).toBe('cafe');
    expect(generateSlug('cañón')).toBe('canon');
    expect(generateSlug('Ñoño')).toBe('nono');
  });

  it('should replace special characters with hyphens', () => {
    expect(generateSlug('hello! world?')).toBe('hello-world');
    expect(generateSlug('price: $10.00')).toBe('price-10-00');
  });

  it('should collapse multiple consecutive hyphens into one', () => {
    expect(generateSlug('hello   world')).toBe('hello-world');
    expect(generateSlug('a -- b')).toBe('a-b');
  });

  it('should strip leading and trailing hyphens', () => {
    expect(generateSlug('  hello  ')).toBe('hello');
    expect(generateSlug('!hello!')).toBe('hello');
  });

  it('should preserve numbers', () => {
    expect(generateSlug('Camiseta 2024 v2')).toBe('camiseta-2024-v2');
  });

  it('should produce a slug matching SLUG_REGEX for typical Spanish product titles', () => {
    const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    expect(SLUG_REGEX.test(generateSlug('Camiseta Meme Gato'))).toBe(true);
    expect(SLUG_REGEX.test(generateSlug('café con leche'))).toBe(true);
  });

  it('should handle a title that is all special characters by returning a fallback', () => {
    // After stripping everything, result is empty — return 'product' as fallback
    expect(generateSlug('!!!')).toBe('product');
  });
});
