import {
  PriceHistoryError,
  PriceHistoryNotFoundError,
  InvalidPriceHistoryDataError,
} from './PriceHistoryError';

describe('PriceHistoryError', () => {
  describe('PriceHistoryError (base)', () => {
    it('should create error with message and code', () => {
      const error = new PriceHistoryError('test message', 'TEST_CODE');

      expect(error.message).toBe('test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('PriceHistoryError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('PriceHistoryNotFoundError', () => {
    it('should have correct defaults', () => {
      const error = new PriceHistoryNotFoundError();

      expect(error.message).toBe('Price history record not found');
      expect(error.code).toBe('PRICE_HISTORY_NOT_FOUND');
      expect(error.name).toBe('PriceHistoryNotFoundError');
      expect(error).toBeInstanceOf(PriceHistoryError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('InvalidPriceHistoryDataError', () => {
    it('should have correct defaults without field', () => {
      const error = new InvalidPriceHistoryDataError('Price must be positive');

      expect(error.message).toBe('Price must be positive');
      expect(error.code).toBe('INVALID_PRICE_HISTORY_DATA');
      expect(error.name).toBe('InvalidPriceHistoryDataError');
      expect(error.field).toBeUndefined();
      expect(error).toBeInstanceOf(PriceHistoryError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should accept optional field parameter', () => {
      const error = new InvalidPriceHistoryDataError('Invalid price format', 'price');

      expect(error.message).toBe('Invalid price format');
      expect(error.field).toBe('price');
      expect(error.code).toBe('INVALID_PRICE_HISTORY_DATA');
    });
  });
});
