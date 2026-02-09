import {
  ProductTypeError,
  ProductTypeNotFoundError,
  ProductTypeSlugAlreadyExistsError,
  InvalidProductTypeDataError,
} from './ProductTypeError';

describe('ProductTypeError', () => {
  describe('ProductTypeError (base)', () => {
    it('should create error with message and code', () => {
      const error = new ProductTypeError('test message', 'TEST_CODE');

      expect(error.message).toBe('test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('ProductTypeError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ProductTypeNotFoundError', () => {
    it('should have correct defaults', () => {
      const error = new ProductTypeNotFoundError();

      expect(error.message).toBe('Product type not found');
      expect(error.code).toBe('PRODUCT_TYPE_NOT_FOUND');
      expect(error.name).toBe('ProductTypeNotFoundError');
      expect(error).toBeInstanceOf(ProductTypeError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ProductTypeSlugAlreadyExistsError', () => {
    it('should have correct defaults', () => {
      const error = new ProductTypeSlugAlreadyExistsError();

      expect(error.message).toBe('A product type with this slug already exists');
      expect(error.code).toBe('PRODUCT_TYPE_SLUG_ALREADY_EXISTS');
      expect(error.name).toBe('ProductTypeSlugAlreadyExistsError');
      expect(error).toBeInstanceOf(ProductTypeError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('InvalidProductTypeDataError', () => {
    it('should have correct defaults without field', () => {
      const error = new InvalidProductTypeDataError('Invalid name format');

      expect(error.message).toBe('Invalid name format');
      expect(error.code).toBe('INVALID_PRODUCT_TYPE_DATA');
      expect(error.name).toBe('InvalidProductTypeDataError');
      expect(error.field).toBeUndefined();
      expect(error).toBeInstanceOf(ProductTypeError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should accept optional field parameter', () => {
      const error = new InvalidProductTypeDataError('Slug is required', 'slug');

      expect(error.message).toBe('Slug is required');
      expect(error.field).toBe('slug');
      expect(error.code).toBe('INVALID_PRODUCT_TYPE_DATA');
    });
  });
});
