import {
  validateOrderTotalInput,
  type OrderTotalCalculationInput,
} from './orderTotalValidator';
import { InvalidOrderTotalDataError } from '../../domain/errors/OrderTotalError';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const VALID_UUID_2 = '223e4567-e89b-12d3-a456-426614174001';

describe('orderTotalValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateOrderTotalInput', () => {
    describe('valid inputs', () => {
      it('should accept items with no promoCode', () => {
        const input: OrderTotalCalculationInput = {
          items: [{ productId: VALID_UUID, quantity: 1 }],
        };

        const result = validateOrderTotalInput(input);

        expect(result.items).toHaveLength(1);
        expect(result.items[0]).toEqual({ productId: VALID_UUID, quantity: 1 });
        expect(result.promoCode).toBeUndefined();
      });

      it('should accept items with a valid promoCode', () => {
        const input: OrderTotalCalculationInput = {
          items: [{ productId: VALID_UUID, quantity: 1 }],
          promoCode: 'SUMMER20',
        };

        const result = validateOrderTotalInput(input);

        expect(result.promoCode).toBe('SUMMER20');
      });

      it('should trim and uppercase promoCode', () => {
        const input: OrderTotalCalculationInput = {
          items: [{ productId: VALID_UUID, quantity: 1 }],
          promoCode: 'summer20',
        };

        const result = validateOrderTotalInput(input);

        expect(result.promoCode).toBe('SUMMER20');
      });

      it('should trim whitespace from promoCode', () => {
        const input: OrderTotalCalculationInput = {
          items: [{ productId: VALID_UUID, quantity: 1 }],
          promoCode: ' SAVE10 ',
        };

        const result = validateOrderTotalInput(input);

        expect(result.promoCode).toBe('SAVE10');
      });

      it('should not include promoCode key when promoCode is absent', () => {
        const input: OrderTotalCalculationInput = {
          items: [{ productId: VALID_UUID, quantity: 1 }],
        };

        const result = validateOrderTotalInput(input);

        expect('promoCode' in result).toBe(false);
      });

      it('should accept multiple items with different UUIDs', () => {
        const input: OrderTotalCalculationInput = {
          items: [
            { productId: VALID_UUID, quantity: 1, size: 'S' },
            { productId: VALID_UUID_2, quantity: 3 },
          ],
        };

        const result = validateOrderTotalInput(input);

        expect(result.items).toHaveLength(2);
        expect(result.items[0].productId).toBe(VALID_UUID);
        expect(result.items[1].productId).toBe(VALID_UUID_2);
      });
    });

    describe('invalid items array', () => {
      it('should throw InvalidOrderTotalDataError when items is missing', () => {
        expect(() =>
          validateOrderTotalInput({} as OrderTotalCalculationInput)
        ).toThrow(InvalidOrderTotalDataError);
      });

      it('should throw with field=items when items is missing', () => {
        try {
          validateOrderTotalInput({} as OrderTotalCalculationInput);
        } catch (err) {
          expect(err).toBeInstanceOf(InvalidOrderTotalDataError);
          expect((err as InvalidOrderTotalDataError).field).toBe('items');
        }
      });

      it('should throw InvalidOrderTotalDataError when items is not an array', () => {
        expect(() =>
          validateOrderTotalInput({ items: 'not-array' } as unknown as OrderTotalCalculationInput)
        ).toThrow(InvalidOrderTotalDataError);
      });

      it('should throw with field=items when items is not an array', () => {
        try {
          validateOrderTotalInput({ items: 'not-array' } as unknown as OrderTotalCalculationInput);
        } catch (err) {
          expect((err as InvalidOrderTotalDataError).field).toBe('items');
        }
      });

      it('should throw InvalidOrderTotalDataError when items is empty', () => {
        expect(() =>
          validateOrderTotalInput({ items: [] })
        ).toThrow(InvalidOrderTotalDataError);
      });

      it('should throw with field=items when items is empty', () => {
        try {
          validateOrderTotalInput({ items: [] });
        } catch (err) {
          expect((err as InvalidOrderTotalDataError).field).toBe('items');
        }
      });

      it('should throw when items exceeds 50', () => {
        const items = Array.from({ length: 51 }, () => ({
          productId: VALID_UUID,
          quantity: 1,
        }));

        expect(() => validateOrderTotalInput({ items })).toThrow(InvalidOrderTotalDataError);
      });

      it('should throw with field=items when items exceeds 50', () => {
        const items = Array.from({ length: 51 }, () => ({
          productId: VALID_UUID,
          quantity: 1,
        }));

        try {
          validateOrderTotalInput({ items });
        } catch (err) {
          expect((err as InvalidOrderTotalDataError).field).toBe('items');
        }
      });

      it('should throw when productId is not a valid UUID', () => {
        const input: OrderTotalCalculationInput = {
          items: [{ productId: 'not-a-uuid', quantity: 1 }],
        };

        expect(() => validateOrderTotalInput(input)).toThrow(InvalidOrderTotalDataError);
      });

      it('should throw with field=items[0].productId when productId is invalid', () => {
        try {
          validateOrderTotalInput({ items: [{ productId: 'not-a-uuid', quantity: 1 }] });
        } catch (err) {
          expect((err as InvalidOrderTotalDataError).field).toBe('items[0].productId');
        }
      });

      it('should throw when quantity is missing', () => {
        const input = {
          items: [{ productId: VALID_UUID }],
        } as unknown as OrderTotalCalculationInput;

        expect(() => validateOrderTotalInput(input)).toThrow(InvalidOrderTotalDataError);
      });

      it('should throw with field=items[0].quantity when quantity is missing', () => {
        try {
          validateOrderTotalInput({ items: [{ productId: VALID_UUID }] } as unknown as OrderTotalCalculationInput);
        } catch (err) {
          expect((err as InvalidOrderTotalDataError).field).toBe('items[0].quantity');
        }
      });

      it('should throw when quantity is 0', () => {
        const input: OrderTotalCalculationInput = {
          items: [{ productId: VALID_UUID, quantity: 0 }],
        };

        expect(() => validateOrderTotalInput(input)).toThrow(InvalidOrderTotalDataError);
      });

      it('should throw when quantity exceeds 99', () => {
        const input: OrderTotalCalculationInput = {
          items: [{ productId: VALID_UUID, quantity: 100 }],
        };

        expect(() => validateOrderTotalInput(input)).toThrow(InvalidOrderTotalDataError);
      });

      it('should throw when quantity is not an integer', () => {
        const input: OrderTotalCalculationInput = {
          items: [{ productId: VALID_UUID, quantity: 1.5 }],
        };

        expect(() => validateOrderTotalInput(input)).toThrow(InvalidOrderTotalDataError);
      });

      it('should throw when size is not a string', () => {
        const input = {
          items: [{ productId: VALID_UUID, quantity: 1, size: 123 }],
        } as unknown as OrderTotalCalculationInput;

        expect(() => validateOrderTotalInput(input)).toThrow(InvalidOrderTotalDataError);
      });

      it('should throw with field=items[0].size when size is not a string', () => {
        try {
          validateOrderTotalInput({
            items: [{ productId: VALID_UUID, quantity: 1, size: 123 }],
          } as unknown as OrderTotalCalculationInput);
        } catch (err) {
          expect((err as InvalidOrderTotalDataError).field).toBe('items[0].size');
        }
      });

      it('should throw when size is empty string', () => {
        const input: OrderTotalCalculationInput = {
          items: [{ productId: VALID_UUID, quantity: 1, size: '' }],
        };

        expect(() => validateOrderTotalInput(input)).toThrow(InvalidOrderTotalDataError);
      });

      it('should throw when size exceeds 20 chars', () => {
        const input: OrderTotalCalculationInput = {
          items: [{ productId: VALID_UUID, quantity: 1, size: 'A'.repeat(21) }],
        };

        expect(() => validateOrderTotalInput(input)).toThrow(InvalidOrderTotalDataError);
      });
    });

    describe('invalid promoCode', () => {
      it('should throw when promoCode is not a string', () => {
        const input = {
          items: [{ productId: VALID_UUID, quantity: 1 }],
          promoCode: 123,
        } as unknown as OrderTotalCalculationInput;

        expect(() => validateOrderTotalInput(input)).toThrow(InvalidOrderTotalDataError);
      });

      it('should throw with field=promoCode when promoCode is not a string', () => {
        try {
          validateOrderTotalInput({
            items: [{ productId: VALID_UUID, quantity: 1 }],
            promoCode: 123,
          } as unknown as OrderTotalCalculationInput);
        } catch (err) {
          expect((err as InvalidOrderTotalDataError).field).toBe('promoCode');
        }
      });

      it('should throw when promoCode is empty string after trim', () => {
        const input = {
          items: [{ productId: VALID_UUID, quantity: 1 }],
          promoCode: '   ',
        } as unknown as OrderTotalCalculationInput;

        expect(() => validateOrderTotalInput(input)).toThrow(InvalidOrderTotalDataError);
      });

      it('should throw with field=promoCode when promoCode is empty after trim', () => {
        try {
          validateOrderTotalInput({
            items: [{ productId: VALID_UUID, quantity: 1 }],
            promoCode: '   ',
          } as unknown as OrderTotalCalculationInput);
        } catch (err) {
          expect((err as InvalidOrderTotalDataError).field).toBe('promoCode');
        }
      });

      it('should throw when promoCode exceeds 50 chars', () => {
        const input = {
          items: [{ productId: VALID_UUID, quantity: 1 }],
          promoCode: 'A'.repeat(51),
        } as unknown as OrderTotalCalculationInput;

        expect(() => validateOrderTotalInput(input)).toThrow(InvalidOrderTotalDataError);
      });

      it('should throw with field=promoCode when promoCode exceeds 50 chars', () => {
        try {
          validateOrderTotalInput({
            items: [{ productId: VALID_UUID, quantity: 1 }],
            promoCode: 'A'.repeat(51),
          } as unknown as OrderTotalCalculationInput);
        } catch (err) {
          expect((err as InvalidOrderTotalDataError).field).toBe('promoCode');
        }
      });
    });
  });
});
