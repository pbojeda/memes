import { CartError, InvalidCartDataError } from './CartError';

describe('CartError', () => {
  describe('CartError (base)', () => {
    it('should create error with message and code', () => {
      const error = new CartError('test message', 'TEST_CODE');

      expect(error.message).toBe('test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('CartError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('InvalidCartDataError', () => {
    it('should have correct defaults', () => {
      const error = new InvalidCartDataError('Items array is required');

      expect(error.message).toBe('Items array is required');
      expect(error.code).toBe('INVALID_CART_DATA');
      expect(error.name).toBe('InvalidCartDataError');
      expect(error).toBeInstanceOf(CartError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should accept optional field parameter', () => {
      const error = new InvalidCartDataError('quantity must be >= 1', 'items[0].quantity');

      expect(error.message).toBe('quantity must be >= 1');
      expect(error.field).toBe('items[0].quantity');
    });

    it('should have undefined field when not provided', () => {
      const error = new InvalidCartDataError('items is required');

      expect(error.field).toBeUndefined();
    });
  });
});
