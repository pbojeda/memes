import {
  ProductError,
  ProductNotFoundError,
  ProductSlugAlreadyExistsError,
  InvalidProductDataError,
} from './ProductError';

describe('ProductError', () => {
  describe('ProductError (base)', () => {
    it('should create error with message and code', () => {
      const error = new ProductError('test message', 'TEST_CODE');

      expect(error.message).toBe('test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('ProductError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ProductNotFoundError', () => {
    it('should have correct defaults', () => {
      const error = new ProductNotFoundError();

      expect(error.message).toBe('Product not found');
      expect(error.code).toBe('PRODUCT_NOT_FOUND');
      expect(error.name).toBe('ProductNotFoundError');
      expect(error).toBeInstanceOf(ProductError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ProductSlugAlreadyExistsError', () => {
    it('should have correct defaults', () => {
      const error = new ProductSlugAlreadyExistsError();

      expect(error.message).toBe('A product with this slug already exists');
      expect(error.code).toBe('PRODUCT_SLUG_ALREADY_EXISTS');
      expect(error.name).toBe('ProductSlugAlreadyExistsError');
      expect(error).toBeInstanceOf(ProductError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('InvalidProductDataError', () => {
    it('should have correct defaults without field', () => {
      const error = new InvalidProductDataError('Invalid title format');

      expect(error.message).toBe('Invalid title format');
      expect(error.code).toBe('INVALID_PRODUCT_DATA');
      expect(error.name).toBe('InvalidProductDataError');
      expect(error.field).toBeUndefined();
      expect(error).toBeInstanceOf(ProductError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should accept optional field parameter', () => {
      const error = new InvalidProductDataError('Price must be positive', 'price');

      expect(error.message).toBe('Price must be positive');
      expect(error.field).toBe('price');
      expect(error.code).toBe('INVALID_PRODUCT_DATA');
    });
  });
});
