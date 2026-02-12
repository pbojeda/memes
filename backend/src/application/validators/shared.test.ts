import { validateSlug, validateUUID } from './shared';

function throwTestError(message: string, field: string): never {
  throw new Error(`[${field}] ${message}`);
}

describe('shared validators', () => {
  describe('validateSlug', () => {
    it('should return trimmed slug for valid input', () => {
      const result = validateSlug('valid-slug', 'slug', true, throwTestError);
      expect(result).toBe('valid-slug');
    });

    it('should throw when slug is required and missing', () => {
      expect(() => validateSlug('', 'slug', true, throwTestError)).toThrow('[slug] Slug is required');
    });

    it('should throw when slug is not required but empty', () => {
      expect(() => validateSlug('', 'slug', false, throwTestError)).toThrow('[slug] Slug cannot be empty');
    });

    it('should throw when slug contains uppercase', () => {
      expect(() => validateSlug('Invalid', 'slug', true, throwTestError)).toThrow('Slug must be lowercase');
    });

    it('should throw when slug exceeds 100 characters', () => {
      const longSlug = 'a'.repeat(101);
      expect(() => validateSlug(longSlug, 'slug', true, throwTestError)).toThrow('Slug exceeds 100 characters');
    });

    it('should throw when slug contains special characters', () => {
      expect(() => validateSlug('invalid_slug!', 'slug', true, throwTestError)).toThrow('Slug must contain only lowercase letters, numbers, and hyphens');
    });

    it('should accept slug with numbers and hyphens', () => {
      const result = validateSlug('product-123', 'slug', true, throwTestError);
      expect(result).toBe('product-123');
    });

    it('should use the provided error thrower', () => {
      const customThrower = (message: string, field: string): never => {
        throw new TypeError(`CUSTOM: ${field} - ${message}`);
      };
      expect(() => validateSlug('', 'myField', true, customThrower)).toThrow(TypeError);
      expect(() => validateSlug('', 'myField', true, customThrower)).toThrow('CUSTOM: myField - Slug is required');
    });
  });

  describe('validateUUID', () => {
    it('should return valid UUID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = validateUUID(uuid, 'id', throwTestError);
      expect(result).toBe(uuid);
    });

    it('should throw when UUID is empty', () => {
      expect(() => validateUUID('', 'id', throwTestError)).toThrow('[id] ID is required');
    });

    it('should throw when UUID format is invalid', () => {
      expect(() => validateUUID('not-a-uuid', 'id', throwTestError)).toThrow('[id] Invalid ID format');
    });

    it('should accept UUID in uppercase', () => {
      const uuid = '123E4567-E89B-12D3-A456-426614174000';
      const result = validateUUID(uuid, 'id', throwTestError);
      expect(result).toBe(uuid);
    });

    it('should use the provided error thrower', () => {
      const customThrower = (message: string, field: string): never => {
        throw new TypeError(`CUSTOM: ${field} - ${message}`);
      };
      expect(() => validateUUID('bad', 'myId', customThrower)).toThrow(TypeError);
      expect(() => validateUUID('bad', 'myId', customThrower)).toThrow('CUSTOM: myId - Invalid ID format');
    });
  });
});
