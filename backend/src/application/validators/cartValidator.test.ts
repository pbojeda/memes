import { validateCartInput, type CartValidationInput } from './cartValidator';
import { InvalidCartDataError } from '../../domain/errors/CartError';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const VALID_UUID_2 = '223e4567-e89b-12d3-a456-426614174001';

describe('cartValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCartInput', () => {
    describe('valid inputs', () => {
      it('should accept a single item without size', () => {
        const input: CartValidationInput = {
          items: [{ productId: VALID_UUID, quantity: 1 }],
        };

        const result = validateCartInput(input);

        expect(result.items).toHaveLength(1);
        expect(result.items[0]).toEqual({ productId: VALID_UUID, quantity: 1 });
      });

      it('should accept a single item with size', () => {
        const input: CartValidationInput = {
          items: [{ productId: VALID_UUID, quantity: 2, size: 'M' }],
        };

        const result = validateCartInput(input);

        expect(result.items[0].size).toBe('M');
        expect(result.items[0].quantity).toBe(2);
      });

      it('should accept multiple items up to 50', () => {
        const items = Array.from({ length: 50 }, () => ({
          productId: VALID_UUID,
          quantity: 1,
        }));

        const result = validateCartInput({ items });

        expect(result.items).toHaveLength(50);
      });

      it('should accept multiple items with different UUIDs', () => {
        const input: CartValidationInput = {
          items: [
            { productId: VALID_UUID, quantity: 1, size: 'S' },
            { productId: VALID_UUID_2, quantity: 3 },
          ],
        };

        const result = validateCartInput(input);

        expect(result.items).toHaveLength(2);
        expect(result.items[0].productId).toBe(VALID_UUID);
        expect(result.items[1].productId).toBe(VALID_UUID_2);
      });

      it('should trim whitespace from size', () => {
        const input: CartValidationInput = {
          items: [{ productId: VALID_UUID, quantity: 1, size: '  XL  ' }],
        };

        const result = validateCartInput(input);

        expect(result.items[0].size).toBe('XL');
      });

      it('should not include size in result when size is not provided', () => {
        const input: CartValidationInput = {
          items: [{ productId: VALID_UUID, quantity: 1 }],
        };

        const result = validateCartInput(input);

        expect('size' in result.items[0]).toBe(false);
      });
    });

    describe('invalid items array', () => {
      it('should throw InvalidCartDataError when items is missing', () => {
        expect(() => validateCartInput({} as CartValidationInput)).toThrow(InvalidCartDataError);
      });

      it('should throw with field=items when items is missing', () => {
        try {
          validateCartInput({} as CartValidationInput);
        } catch (err) {
          expect(err).toBeInstanceOf(InvalidCartDataError);
          expect((err as InvalidCartDataError).field).toBe('items');
        }
      });

      it('should throw InvalidCartDataError when items is not an array', () => {
        expect(() =>
          validateCartInput({ items: 'not-array' } as unknown as CartValidationInput)
        ).toThrow(InvalidCartDataError);
      });

      it('should throw InvalidCartDataError when items array is empty', () => {
        expect(() => validateCartInput({ items: [] })).toThrow(InvalidCartDataError);
      });

      it('should throw with field=items when items array is empty', () => {
        try {
          validateCartInput({ items: [] });
        } catch (err) {
          expect(err).toBeInstanceOf(InvalidCartDataError);
          expect((err as InvalidCartDataError).field).toBe('items');
        }
      });

      it('should throw InvalidCartDataError when items array exceeds 50', () => {
        const items = Array.from({ length: 51 }, () => ({
          productId: VALID_UUID,
          quantity: 1,
        }));

        expect(() => validateCartInput({ items })).toThrow(InvalidCartDataError);
      });
    });

    describe('invalid productId', () => {
      it('should throw when productId is missing', () => {
        const input = { items: [{ quantity: 1 }] } as unknown as CartValidationInput;

        expect(() => validateCartInput(input)).toThrow(InvalidCartDataError);
      });

      it('should throw when productId is not a valid UUID', () => {
        const input: CartValidationInput = {
          items: [{ productId: 'not-a-uuid', quantity: 1 }],
        };

        expect(() => validateCartInput(input)).toThrow(InvalidCartDataError);
      });

      it('should throw when productId is a number', () => {
        const input = {
          items: [{ productId: 123, quantity: 1 }],
        } as unknown as CartValidationInput;

        expect(() => validateCartInput(input)).toThrow(InvalidCartDataError);
      });
    });

    describe('invalid quantity', () => {
      it('should throw when quantity is missing', () => {
        const input = {
          items: [{ productId: VALID_UUID }],
        } as unknown as CartValidationInput;

        expect(() => validateCartInput(input)).toThrow(InvalidCartDataError);
      });

      it('should throw when quantity is not a number', () => {
        const input = {
          items: [{ productId: VALID_UUID, quantity: 'two' }],
        } as unknown as CartValidationInput;

        expect(() => validateCartInput(input)).toThrow(InvalidCartDataError);
      });

      it('should throw when quantity is less than 1', () => {
        const input: CartValidationInput = {
          items: [{ productId: VALID_UUID, quantity: 0 }],
        };

        expect(() => validateCartInput(input)).toThrow(InvalidCartDataError);
      });

      it('should throw when quantity is negative', () => {
        const input: CartValidationInput = {
          items: [{ productId: VALID_UUID, quantity: -1 }],
        };

        expect(() => validateCartInput(input)).toThrow(InvalidCartDataError);
      });

      it('should throw when quantity is not an integer', () => {
        const input: CartValidationInput = {
          items: [{ productId: VALID_UUID, quantity: 1.5 }],
        };

        expect(() => validateCartInput(input)).toThrow(InvalidCartDataError);
      });

      it('should throw when quantity exceeds 99', () => {
        const input: CartValidationInput = {
          items: [{ productId: VALID_UUID, quantity: 100 }],
        };

        expect(() => validateCartInput(input)).toThrow(InvalidCartDataError);
      });

      it('should accept quantity of 99', () => {
        const input: CartValidationInput = {
          items: [{ productId: VALID_UUID, quantity: 99 }],
        };

        const result = validateCartInput(input);

        expect(result.items[0].quantity).toBe(99);
      });
    });

    describe('invalid size', () => {
      it('should throw when size is not a string', () => {
        const input = {
          items: [{ productId: VALID_UUID, quantity: 1, size: 123 }],
        } as unknown as CartValidationInput;

        expect(() => validateCartInput(input)).toThrow(InvalidCartDataError);
      });

      it('should throw when size is empty after trim', () => {
        const input: CartValidationInput = {
          items: [{ productId: VALID_UUID, quantity: 1, size: '   ' }],
        };

        expect(() => validateCartInput(input)).toThrow(InvalidCartDataError);
      });

      it('should throw when size is empty string', () => {
        const input: CartValidationInput = {
          items: [{ productId: VALID_UUID, quantity: 1, size: '' }],
        };

        expect(() => validateCartInput(input)).toThrow(InvalidCartDataError);
      });

      it('should throw when size exceeds 20 characters', () => {
        const input: CartValidationInput = {
          items: [{ productId: VALID_UUID, quantity: 1, size: 'A'.repeat(21) }],
        };

        expect(() => validateCartInput(input)).toThrow(InvalidCartDataError);
      });

      it('should accept size of exactly 20 characters', () => {
        const input: CartValidationInput = {
          items: [{ productId: VALID_UUID, quantity: 1, size: 'A'.repeat(20) }],
        };

        const result = validateCartInput(input);

        expect(result.items[0].size).toBe('A'.repeat(20));
      });
    });
  });
});
