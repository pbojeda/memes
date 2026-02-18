import { getLocalizedField } from './utils';

describe('getLocalizedField', () => {
  it('returns the value for the requested locale key', () => {
    expect(getLocalizedField({ es: 'Hola', en: 'Hello' }, 'es')).toBe('Hola');
    expect(getLocalizedField({ es: 'Hola', en: 'Hello' }, 'en')).toBe('Hello');
  });

  it('returns fallback when value is undefined', () => {
    expect(getLocalizedField(undefined, 'es')).toBe('');
  });

  it('returns the string directly when value is a plain string (same for all locales)', () => {
    expect(getLocalizedField('Hello', 'es')).toBe('Hello');
    expect(getLocalizedField('Hello', 'en')).toBe('Hello');
  });

  it('returns fallback when the locale key does not exist', () => {
    expect(getLocalizedField({ es: 'Hola' }, 'en')).toBe('');
  });

  it('returns custom fallback when provided', () => {
    expect(getLocalizedField(undefined, 'es', 'N/A')).toBe('N/A');
  });
});
