import {
  validateCreateAddressInput,
  validateUpdateAddressInput,
  validateAddressId,
  type CreateAddressInput,
} from './addressValidator';
import { InvalidAddressDataError } from '../../domain/errors/AddressError';

describe('addressValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCreateAddressInput', () => {
    const validMinInput: CreateAddressInput = {
      firstName: 'John',
      lastName: 'Doe',
      streetLine1: '123 Main St',
      city: 'Springfield',
      postalCode: '12345',
      countryCode: 'US',
    };

    describe('valid inputs', () => {
      it('should accept minimum required fields', () => {
        const result = validateCreateAddressInput(validMinInput);

        expect(result).toEqual({
          firstName: 'John',
          lastName: 'Doe',
          streetLine1: '123 Main St',
          city: 'Springfield',
          postalCode: '12345',
          countryCode: 'US',
          isDefault: false,
        });
      });

      it('should accept all optional fields', () => {
        const input: CreateAddressInput = {
          label: 'Home',
          firstName: 'John',
          lastName: 'Doe',
          streetLine1: '123 Main St',
          streetLine2: 'Apt 4B',
          city: 'Springfield',
          state: 'IL',
          postalCode: '12345',
          countryCode: 'US',
          phone: '+1234567890',
          isDefault: true,
        };

        const result = validateCreateAddressInput(input);

        expect(result).toEqual({
          label: 'Home',
          firstName: 'John',
          lastName: 'Doe',
          streetLine1: '123 Main St',
          streetLine2: 'Apt 4B',
          city: 'Springfield',
          state: 'IL',
          postalCode: '12345',
          countryCode: 'US',
          phone: '+1234567890',
          isDefault: true,
        });
      });

      it('should trim whitespace from string fields', () => {
        const input: CreateAddressInput = {
          firstName: '  John  ',
          lastName: '  Doe  ',
          streetLine1: '  123 Main St  ',
          city: '  Springfield  ',
          postalCode: '  12345  ',
          countryCode: 'US',
        };

        const result = validateCreateAddressInput(input);

        expect(result.firstName).toBe('John');
        expect(result.lastName).toBe('Doe');
        expect(result.streetLine1).toBe('123 Main St');
        expect(result.city).toBe('Springfield');
        expect(result.postalCode).toBe('12345');
      });

      it('should default isDefault to false when not provided', () => {
        const result = validateCreateAddressInput(validMinInput);

        expect(result.isDefault).toBe(false);
      });
    });

    describe('invalid inputs - required fields', () => {
      it('should throw InvalidAddressDataError when firstName is missing', () => {
        const input = { ...validMinInput, firstName: undefined };

        expect(() => validateCreateAddressInput(input as never)).toThrow(InvalidAddressDataError);
      });

      it('should throw InvalidAddressDataError when lastName is missing', () => {
        const input = { ...validMinInput, lastName: undefined };

        expect(() => validateCreateAddressInput(input as never)).toThrow(InvalidAddressDataError);
      });

      it('should throw InvalidAddressDataError when streetLine1 is missing', () => {
        const input = { ...validMinInput, streetLine1: undefined };

        expect(() => validateCreateAddressInput(input as never)).toThrow(InvalidAddressDataError);
      });

      it('should throw InvalidAddressDataError when city is missing', () => {
        const input = { ...validMinInput, city: undefined };

        expect(() => validateCreateAddressInput(input as never)).toThrow(InvalidAddressDataError);
      });

      it('should throw InvalidAddressDataError when postalCode is missing', () => {
        const input = { ...validMinInput, postalCode: undefined };

        expect(() => validateCreateAddressInput(input as never)).toThrow(InvalidAddressDataError);
      });

      it('should throw InvalidAddressDataError when countryCode is missing', () => {
        const input = { ...validMinInput, countryCode: undefined };

        expect(() => validateCreateAddressInput(input as never)).toThrow(InvalidAddressDataError);
      });
    });

    describe('invalid inputs - field constraints', () => {
      it('should throw InvalidAddressDataError when firstName is empty string', () => {
        expect(() =>
          validateCreateAddressInput({ ...validMinInput, firstName: '' })
        ).toThrow(InvalidAddressDataError);
      });

      it('should throw InvalidAddressDataError when firstName exceeds 100 chars', () => {
        expect(() =>
          validateCreateAddressInput({ ...validMinInput, firstName: 'a'.repeat(101) })
        ).toThrow(InvalidAddressDataError);
      });

      it('should throw InvalidAddressDataError when lastName exceeds 100 chars', () => {
        expect(() =>
          validateCreateAddressInput({ ...validMinInput, lastName: 'a'.repeat(101) })
        ).toThrow(InvalidAddressDataError);
      });

      it('should throw InvalidAddressDataError when streetLine1 exceeds 255 chars', () => {
        expect(() =>
          validateCreateAddressInput({ ...validMinInput, streetLine1: 'a'.repeat(256) })
        ).toThrow(InvalidAddressDataError);
      });

      it('should throw InvalidAddressDataError when streetLine2 exceeds 255 chars', () => {
        expect(() =>
          validateCreateAddressInput({ ...validMinInput, streetLine2: 'a'.repeat(256) })
        ).toThrow(InvalidAddressDataError);
      });

      it('should throw InvalidAddressDataError when city exceeds 100 chars', () => {
        expect(() =>
          validateCreateAddressInput({ ...validMinInput, city: 'a'.repeat(101) })
        ).toThrow(InvalidAddressDataError);
      });

      it('should throw InvalidAddressDataError when state exceeds 100 chars', () => {
        expect(() =>
          validateCreateAddressInput({ ...validMinInput, state: 'a'.repeat(101) })
        ).toThrow(InvalidAddressDataError);
      });

      it('should throw InvalidAddressDataError when postalCode exceeds 20 chars', () => {
        expect(() =>
          validateCreateAddressInput({ ...validMinInput, postalCode: 'a'.repeat(21) })
        ).toThrow(InvalidAddressDataError);
      });

      it('should throw InvalidAddressDataError when countryCode is not exactly 2 chars', () => {
        expect(() =>
          validateCreateAddressInput({ ...validMinInput, countryCode: 'USA' })
        ).toThrow(InvalidAddressDataError);

        expect(() =>
          validateCreateAddressInput({ ...validMinInput, countryCode: 'U' })
        ).toThrow(InvalidAddressDataError);
      });

      it('should throw InvalidAddressDataError when label exceeds 50 chars', () => {
        expect(() =>
          validateCreateAddressInput({ ...validMinInput, label: 'a'.repeat(51) })
        ).toThrow(InvalidAddressDataError);
      });

      it('should throw InvalidAddressDataError when phone exceeds 20 chars', () => {
        expect(() =>
          validateCreateAddressInput({ ...validMinInput, phone: 'a'.repeat(21) })
        ).toThrow(InvalidAddressDataError);
      });

      it('should throw InvalidAddressDataError when isDefault is not boolean', () => {
        expect(() =>
          validateCreateAddressInput({ ...validMinInput, isDefault: 'true' as never })
        ).toThrow(InvalidAddressDataError);
      });
    });
  });

  describe('validateUpdateAddressInput', () => {
    describe('valid inputs', () => {
      it('should return empty object for empty input', () => {
        const result = validateUpdateAddressInput({});

        expect(result).toEqual({});
      });

      it('should accept partial update with only firstName', () => {
        const result = validateUpdateAddressInput({ firstName: 'Jane' });

        expect(result).toEqual({ firstName: 'Jane' });
      });

      it('should accept update setting isDefault to true', () => {
        const result = validateUpdateAddressInput({ isDefault: true });

        expect(result).toEqual({ isDefault: true });
      });

      it('should trim whitespace from provided string fields', () => {
        const result = validateUpdateAddressInput({ firstName: '  Jane  ' });

        expect(result.firstName).toBe('Jane');
      });
    });

    describe('invalid inputs', () => {
      it('should throw InvalidAddressDataError when firstName is empty string', () => {
        expect(() => validateUpdateAddressInput({ firstName: '' })).toThrow(InvalidAddressDataError);
      });

      it('should throw InvalidAddressDataError when countryCode is not 2 chars', () => {
        expect(() => validateUpdateAddressInput({ countryCode: 'USA' })).toThrow(
          InvalidAddressDataError
        );
      });

      it('should throw InvalidAddressDataError when isDefault is not boolean', () => {
        expect(() =>
          validateUpdateAddressInput({ isDefault: 'true' as never })
        ).toThrow(InvalidAddressDataError);
      });
    });
  });

  describe('validateAddressId', () => {
    it('should return validated UUID string for valid UUID', () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';

      const result = validateAddressId(id);

      expect(result).toBe(id);
    });

    it('should throw InvalidAddressDataError when ID is invalid UUID', () => {
      expect(() => validateAddressId('not-a-uuid')).toThrow(InvalidAddressDataError);
      expect(() => validateAddressId('not-a-uuid')).toThrow('Invalid ID format');
    });

    it('should throw InvalidAddressDataError when ID is empty', () => {
      expect(() => validateAddressId('')).toThrow(InvalidAddressDataError);
      expect(() => validateAddressId('')).toThrow('ID is required');
    });
  });
});
