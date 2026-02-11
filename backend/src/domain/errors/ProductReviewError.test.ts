import {
  ProductReviewError,
  ProductReviewNotFoundError,
  InvalidProductReviewDataError,
} from './ProductReviewError';

describe('ProductReviewError', () => {
  describe('ProductReviewError (base)', () => {
    it('should create error with message and code', () => {
      const error = new ProductReviewError('test message', 'TEST_CODE');

      expect(error.message).toBe('test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('ProductReviewError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ProductReviewNotFoundError', () => {
    it('should have correct defaults', () => {
      const error = new ProductReviewNotFoundError();

      expect(error.message).toBe('Product review not found');
      expect(error.code).toBe('PRODUCT_REVIEW_NOT_FOUND');
      expect(error.name).toBe('ProductReviewNotFoundError');
      expect(error).toBeInstanceOf(ProductReviewError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('InvalidProductReviewDataError', () => {
    it('should have correct defaults without field', () => {
      const error = new InvalidProductReviewDataError('Invalid rating value');

      expect(error.message).toBe('Invalid rating value');
      expect(error.code).toBe('INVALID_PRODUCT_REVIEW_DATA');
      expect(error.name).toBe('InvalidProductReviewDataError');
      expect(error.field).toBeUndefined();
      expect(error).toBeInstanceOf(ProductReviewError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should accept optional field parameter', () => {
      const error = new InvalidProductReviewDataError('Rating must be between 1 and 5', 'rating');

      expect(error.message).toBe('Rating must be between 1 and 5');
      expect(error.field).toBe('rating');
      expect(error.code).toBe('INVALID_PRODUCT_REVIEW_DATA');
    });
  });
});
