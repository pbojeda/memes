import {
  validateUrl,
  validateAltText,
  validateSortOrder,
  validateCreateProductImageInput,
  validateUpdateProductImageInput,
  type CreateProductImageInput,
  type UpdateProductImageInput,
} from './productImageValidator';
import { InvalidProductImageDataError } from '../../domain/errors/ProductImageError';

describe('productImageValidator', () => {
  describe('validateUrl', () => {
    it('should pass for valid HTTPS URL', () => {
      const url = 'https://res.cloudinary.com/test/image/upload/v123/abc.jpg';
      expect(validateUrl(url, 'url')).toBe(url);
    });

    it('should pass for valid HTTP URL', () => {
      const url = 'http://example.com/image.jpg';
      expect(validateUrl(url, 'url')).toBe(url);
    });

    it('should throw for empty URL', () => {
      expect(() => validateUrl('', 'url')).toThrow(InvalidProductImageDataError);
      expect(() => validateUrl('', 'url')).toThrow('URL is required');
    });

    it('should throw for non-string URL', () => {
      expect(() => validateUrl(123, 'url')).toThrow(InvalidProductImageDataError);
      expect(() => validateUrl(123, 'url')).toThrow('URL is required');
    });

    it('should throw for URL without protocol', () => {
      expect(() => validateUrl('example.com/image.jpg', 'url')).toThrow(
        InvalidProductImageDataError
      );
      expect(() => validateUrl('example.com/image.jpg', 'url')).toThrow(
        'URL must start with http:// or https://'
      );
    });

    it('should throw for URL exceeding 500 chars', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(500);
      expect(() => validateUrl(longUrl, 'url')).toThrow(InvalidProductImageDataError);
      expect(() => validateUrl(longUrl, 'url')).toThrow('URL exceeds 500 characters');
    });
  });

  describe('validateAltText', () => {
    it('should pass for valid LocalizedText with Spanish', () => {
      const altText = { es: 'Texto alternativo', en: 'Alternative text' };
      expect(validateAltText(altText, 'altText')).toEqual(altText);
    });

    it('should pass for LocalizedText with only Spanish', () => {
      const altText = { es: 'Texto alternativo' };
      expect(validateAltText(altText, 'altText')).toEqual(altText);
    });

    it('should return undefined for undefined input', () => {
      expect(validateAltText(undefined, 'altText')).toBeUndefined();
    });

    it('should throw for LocalizedText without Spanish', () => {
      const altText = { en: 'Alternative text' };
      expect(() => validateAltText(altText, 'altText')).toThrow(InvalidProductImageDataError);
      expect(() => validateAltText(altText, 'altText')).toThrow(
        'altText must include Spanish translation (es)'
      );
    });

    it('should throw for empty Spanish text', () => {
      const altText = { es: '  ', en: 'Alternative text' };
      expect(() => validateAltText(altText, 'altText')).toThrow(InvalidProductImageDataError);
      expect(() => validateAltText(altText, 'altText')).toThrow('altText.es cannot be empty');
    });

    it('should throw for Spanish text exceeding 200 chars', () => {
      const altText = { es: 'a'.repeat(201) };
      expect(() => validateAltText(altText, 'altText')).toThrow(InvalidProductImageDataError);
      expect(() => validateAltText(altText, 'altText')).toThrow('altText.es exceeds 200 characters');
    });

    it('should throw for non-object altText', () => {
      expect(() => validateAltText('just a string', 'altText')).toThrow(
        InvalidProductImageDataError
      );
      expect(() => validateAltText('just a string', 'altText')).toThrow(
        'altText must be an object'
      );
    });
  });

  describe('validateSortOrder', () => {
    it('should pass for valid positive integer', () => {
      expect(validateSortOrder(5, 'sortOrder')).toBe(5);
    });

    it('should pass for zero', () => {
      expect(validateSortOrder(0, 'sortOrder')).toBe(0);
    });

    it('should return 0 for undefined', () => {
      expect(validateSortOrder(undefined, 'sortOrder')).toBe(0);
    });

    it('should throw for negative number', () => {
      expect(() => validateSortOrder(-1, 'sortOrder')).toThrow(InvalidProductImageDataError);
      expect(() => validateSortOrder(-1, 'sortOrder')).toThrow(
        'sortOrder must be greater than or equal to 0'
      );
    });

    it('should throw for non-integer', () => {
      expect(() => validateSortOrder(3.14, 'sortOrder')).toThrow(InvalidProductImageDataError);
      expect(() => validateSortOrder(3.14, 'sortOrder')).toThrow('sortOrder must be an integer');
    });

    it('should throw for non-number', () => {
      expect(() => validateSortOrder('5', 'sortOrder')).toThrow(InvalidProductImageDataError);
      expect(() => validateSortOrder('5', 'sortOrder')).toThrow('sortOrder must be a number');
    });
  });

  describe('validateCreateProductImageInput', () => {
    it('should pass for valid input with all fields', () => {
      const input: CreateProductImageInput = {
        url: 'https://res.cloudinary.com/test/image.jpg',
        altText: { es: 'Imagen del producto', en: 'Product image' },
        isPrimary: true,
        sortOrder: 1,
      };

      const result = validateCreateProductImageInput(input);

      expect(result).toEqual({
        url: input.url,
        altText: input.altText,
        isPrimary: true,
        sortOrder: 1,
      });
    });

    it('should use defaults for optional fields', () => {
      const input: CreateProductImageInput = {
        url: 'https://res.cloudinary.com/test/image.jpg',
      };

      const result = validateCreateProductImageInput(input);

      expect(result).toEqual({
        url: input.url,
        altText: undefined,
        isPrimary: false,
        sortOrder: 0,
      });
    });

    it('should throw for missing URL', () => {
      const input = {} as CreateProductImageInput;
      expect(() => validateCreateProductImageInput(input)).toThrow(InvalidProductImageDataError);
      expect(() => validateCreateProductImageInput(input)).toThrow('URL is required');
    });

    it('should throw for invalid URL format', () => {
      const input: CreateProductImageInput = {
        url: 'not-a-url',
      };
      expect(() => validateCreateProductImageInput(input)).toThrow(InvalidProductImageDataError);
    });

    it('should throw for invalid altText', () => {
      const input: CreateProductImageInput = {
        url: 'https://res.cloudinary.com/test/image.jpg',
        altText: { en: 'Missing Spanish' } as any,
      };
      expect(() => validateCreateProductImageInput(input)).toThrow(InvalidProductImageDataError);
    });

    it('should throw for invalid sortOrder', () => {
      const input: CreateProductImageInput = {
        url: 'https://res.cloudinary.com/test/image.jpg',
        sortOrder: -1,
      };
      expect(() => validateCreateProductImageInput(input)).toThrow(InvalidProductImageDataError);
    });

    it('should throw for non-boolean isPrimary', () => {
      const input: CreateProductImageInput = {
        url: 'https://res.cloudinary.com/test/image.jpg',
        isPrimary: 'yes' as any,
      };
      expect(() => validateCreateProductImageInput(input)).toThrow(InvalidProductImageDataError);
      expect(() => validateCreateProductImageInput(input)).toThrow('isPrimary must be a boolean');
    });
  });

  describe('validateUpdateProductImageInput', () => {
    it('should pass for updating all fields', () => {
      const input: UpdateProductImageInput = {
        altText: { es: 'Nuevo texto', en: 'New text' },
        isPrimary: true,
        sortOrder: 5,
      };

      const result = validateUpdateProductImageInput(input);

      expect(result).toEqual(input);
    });

    it('should pass for updating only altText', () => {
      const input: UpdateProductImageInput = {
        altText: { es: 'Nuevo texto' },
      };

      const result = validateUpdateProductImageInput(input);

      expect(result).toEqual({ altText: input.altText });
    });

    it('should pass for updating only isPrimary', () => {
      const input: UpdateProductImageInput = {
        isPrimary: false,
      };

      const result = validateUpdateProductImageInput(input);

      expect(result).toEqual({ isPrimary: false });
    });

    it('should pass for empty update (no fields)', () => {
      const input: UpdateProductImageInput = {};

      const result = validateUpdateProductImageInput(input);

      expect(result).toEqual({});
    });

    it('should throw for invalid altText', () => {
      const input: UpdateProductImageInput = {
        altText: { en: 'Missing Spanish' } as any,
      };
      expect(() => validateUpdateProductImageInput(input)).toThrow(InvalidProductImageDataError);
    });

    it('should throw for invalid sortOrder', () => {
      const input: UpdateProductImageInput = {
        sortOrder: -5,
      };
      expect(() => validateUpdateProductImageInput(input)).toThrow(InvalidProductImageDataError);
    });

    it('should throw for non-boolean isPrimary', () => {
      const input: UpdateProductImageInput = {
        isPrimary: 1 as any,
      };
      expect(() => validateUpdateProductImageInput(input)).toThrow(InvalidProductImageDataError);
    });
  });
});
