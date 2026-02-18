import {
  AddressError,
  AddressNotFoundError,
  AddressLimitExceededError,
  InvalidAddressDataError,
  DefaultAddressCannotBeDeletedError,
} from './AddressError';

describe('AddressError', () => {
  describe('AddressError (base)', () => {
    it('should create error with message and code', () => {
      const error = new AddressError('test message', 'TEST_CODE');

      expect(error.message).toBe('test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('AddressError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('AddressNotFoundError', () => {
    it('should have correct defaults', () => {
      const error = new AddressNotFoundError();

      expect(error.message).toBe('Address not found');
      expect(error.code).toBe('ADDRESS_NOT_FOUND');
      expect(error.name).toBe('AddressNotFoundError');
      expect(error).toBeInstanceOf(AddressError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('AddressLimitExceededError', () => {
    it('should have correct defaults', () => {
      const error = new AddressLimitExceededError();

      expect(error.message).toBe('Address limit exceeded');
      expect(error.code).toBe('ADDRESS_LIMIT_EXCEEDED');
      expect(error.name).toBe('AddressLimitExceededError');
      expect(error).toBeInstanceOf(AddressError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('InvalidAddressDataError', () => {
    it('should have correct defaults', () => {
      const error = new InvalidAddressDataError('Invalid country code');

      expect(error.message).toBe('Invalid country code');
      expect(error.code).toBe('INVALID_ADDRESS_DATA');
      expect(error.name).toBe('InvalidAddressDataError');
      expect(error).toBeInstanceOf(AddressError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should accept optional field parameter', () => {
      const error = new InvalidAddressDataError('Invalid country code', 'countryCode');

      expect(error.message).toBe('Invalid country code');
      expect(error.field).toBe('countryCode');
    });
  });

  describe('DefaultAddressCannotBeDeletedError', () => {
    it('should have correct defaults', () => {
      const error = new DefaultAddressCannotBeDeletedError();

      expect(error.message).toBe('Default address cannot be deleted');
      expect(error.code).toBe('DEFAULT_ADDRESS_CANNOT_BE_DELETED');
      expect(error.name).toBe('DefaultAddressCannotBeDeletedError');
      expect(error).toBeInstanceOf(AddressError);
      expect(error).toBeInstanceOf(Error);
    });
  });
});
