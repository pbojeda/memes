import { validatePromoCodeInput } from './promoCodeValidator';
import { InvalidPromoCodeDataError } from '../../domain/errors/PromoCodeError';

describe('promoCodeValidator', () => {
  describe('validatePromoCodeInput', () => {
    describe('valid inputs', () => {
      it('accepts code as string, trims and uppercases it', () => {
        const result = validatePromoCodeInput({ code: '  summer20  ' });
        expect(result.code).toBe('SUMMER20');
      });

      it('accepts code without orderTotal', () => {
        const result = validatePromoCodeInput({ code: 'SAVE10' });
        expect(result.code).toBe('SAVE10');
        expect(result.orderTotal).toBeUndefined();
      });

      it('accepts code with valid orderTotal (positive number)', () => {
        const result = validatePromoCodeInput({ code: 'SAVE10', orderTotal: 100 });
        expect(result.code).toBe('SAVE10');
        expect(result.orderTotal).toBe(100);
      });

      it('accepts orderTotal of 0 (edge case)', () => {
        const result = validatePromoCodeInput({ code: 'SAVE10', orderTotal: 0 });
        expect(result.orderTotal).toBe(0);
      });

      it('accepts orderTotal as decimal', () => {
        const result = validatePromoCodeInput({ code: 'SAVE10', orderTotal: 99.99 });
        expect(result.orderTotal).toBe(99.99);
      });

      it('does not include orderTotal in result when not provided', () => {
        const result = validatePromoCodeInput({ code: 'SAVE10' });
        expect('orderTotal' in result).toBe(false);
      });
    });

    describe('invalid code', () => {
      it('throws InvalidPromoCodeDataError when code is missing', () => {
        expect(() => validatePromoCodeInput({ code: undefined })).toThrow(
          InvalidPromoCodeDataError
        );
      });

      it('throws with field=code when code is missing', () => {
        try {
          validatePromoCodeInput({ code: undefined });
        } catch (error) {
          expect(error instanceof InvalidPromoCodeDataError).toBe(true);
          expect((error as InvalidPromoCodeDataError).field).toBe('code');
        }
      });

      it('throws when code is null', () => {
        expect(() => validatePromoCodeInput({ code: null })).toThrow(InvalidPromoCodeDataError);
      });

      it('throws when code is not a string', () => {
        expect(() => validatePromoCodeInput({ code: 123 })).toThrow(InvalidPromoCodeDataError);
      });

      it('throws when code is empty string', () => {
        expect(() => validatePromoCodeInput({ code: '' })).toThrow(InvalidPromoCodeDataError);
      });

      it('throws when code is whitespace-only', () => {
        expect(() => validatePromoCodeInput({ code: '   ' })).toThrow(InvalidPromoCodeDataError);
      });

      it('throws when code exceeds 50 characters', () => {
        const longCode = 'A'.repeat(51);
        expect(() => validatePromoCodeInput({ code: longCode })).toThrow(
          InvalidPromoCodeDataError
        );
      });
    });

    describe('invalid orderTotal', () => {
      it('throws when orderTotal is a string (not a number)', () => {
        expect(() => validatePromoCodeInput({ code: 'SAVE10', orderTotal: 'abc' })).toThrow(
          InvalidPromoCodeDataError
        );
      });

      it('throws when orderTotal is negative', () => {
        expect(() => validatePromoCodeInput({ code: 'SAVE10', orderTotal: -1 })).toThrow(
          InvalidPromoCodeDataError
        );
      });

      it('throws when orderTotal is NaN', () => {
        expect(() => validatePromoCodeInput({ code: 'SAVE10', orderTotal: NaN })).toThrow(
          InvalidPromoCodeDataError
        );
      });

      it('throws with field=orderTotal', () => {
        try {
          validatePromoCodeInput({ code: 'SAVE10', orderTotal: -5 });
        } catch (error) {
          expect(error instanceof InvalidPromoCodeDataError).toBe(true);
          expect((error as InvalidPromoCodeDataError).field).toBe('orderTotal');
        }
      });
    });
  });
});
