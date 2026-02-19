import { OrderTotalError, InvalidOrderTotalDataError } from './OrderTotalError';

describe('OrderTotalError', () => {
  describe('OrderTotalError (base)', () => {
    it('should create error with message and code', () => {
      const error = new OrderTotalError('test message', 'TEST_CODE');

      expect(error.message).toBe('test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('OrderTotalError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('InvalidOrderTotalDataError', () => {
    it('should have correct defaults', () => {
      const error = new InvalidOrderTotalDataError('Items array is required');

      expect(error.message).toBe('Items array is required');
      expect(error.code).toBe('INVALID_ORDER_TOTAL_DATA');
      expect(error.name).toBe('InvalidOrderTotalDataError');
      expect(error).toBeInstanceOf(OrderTotalError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should accept optional field parameter', () => {
      const error = new InvalidOrderTotalDataError('quantity must be >= 1', 'items[0].quantity');

      expect(error.message).toBe('quantity must be >= 1');
      expect(error.field).toBe('items[0].quantity');
    });

    it('should have undefined field when not provided', () => {
      const error = new InvalidOrderTotalDataError('items is required');

      expect(error.field).toBeUndefined();
    });
  });
});
