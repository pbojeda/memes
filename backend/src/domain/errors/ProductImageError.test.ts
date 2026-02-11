import {
  ProductImageError,
  ProductImageNotFoundError,
  InvalidProductImageDataError,
} from './ProductImageError';

describe('ProductImageError', () => {
  describe('ProductImageError (base)', () => {
    it('should create error with message and code', () => {
      const error = new ProductImageError('test message', 'TEST_CODE');

      expect(error.message).toBe('test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('ProductImageError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ProductImageNotFoundError', () => {
    it('should have correct defaults', () => {
      const error = new ProductImageNotFoundError();

      expect(error.message).toBe('Product image not found');
      expect(error.code).toBe('PRODUCT_IMAGE_NOT_FOUND');
      expect(error.name).toBe('ProductImageNotFoundError');
      expect(error).toBeInstanceOf(ProductImageError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('InvalidProductImageDataError', () => {
    it('should have correct defaults without field', () => {
      const error = new InvalidProductImageDataError('Invalid URL format');

      expect(error.message).toBe('Invalid URL format');
      expect(error.code).toBe('INVALID_PRODUCT_IMAGE_DATA');
      expect(error.name).toBe('InvalidProductImageDataError');
      expect(error.field).toBeUndefined();
      expect(error).toBeInstanceOf(ProductImageError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should accept optional field parameter', () => {
      const error = new InvalidProductImageDataError('URL is required', 'url');

      expect(error.message).toBe('URL is required');
      expect(error.field).toBe('url');
      expect(error.code).toBe('INVALID_PRODUCT_IMAGE_DATA');
    });
  });
});
