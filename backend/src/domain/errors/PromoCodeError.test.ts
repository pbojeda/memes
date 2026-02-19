import {
  PromoCodeError,
  InvalidPromoCodeDataError,
  PromoCodeNotFoundError,
  PromoCodeExpiredError,
  PromoCodeInactiveError,
  PromoCodeUsageLimitError,
  MinOrderAmountNotMetError,
  PromoCodeNotYetValidError,
} from './PromoCodeError';

describe('PromoCodeError', () => {
  describe('PromoCodeError (base)', () => {
    it('creates error with message and code', () => {
      const error = new PromoCodeError('some message', 'SOME_CODE');
      expect(error.message).toBe('some message');
      expect(error.code).toBe('SOME_CODE');
    });

    it('name is PromoCodeError', () => {
      const error = new PromoCodeError('msg', 'CODE');
      expect(error.name).toBe('PromoCodeError');
    });

    it('instanceof Error', () => {
      const error = new PromoCodeError('msg', 'CODE');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('InvalidPromoCodeDataError', () => {
    it('message set, code is INVALID_PROMO_CODE_DATA', () => {
      const error = new InvalidPromoCodeDataError('Code is required', 'code');
      expect(error.message).toBe('Code is required');
      expect(error.code).toBe('INVALID_PROMO_CODE_DATA');
    });

    it('name is InvalidPromoCodeDataError', () => {
      const error = new InvalidPromoCodeDataError('msg', 'code');
      expect(error.name).toBe('InvalidPromoCodeDataError');
    });

    it('instanceof PromoCodeError', () => {
      const error = new InvalidPromoCodeDataError('msg', 'code');
      expect(error instanceof PromoCodeError).toBe(true);
    });

    it('accepts optional field parameter', () => {
      const error = new InvalidPromoCodeDataError('msg', 'orderTotal');
      expect(error.field).toBe('orderTotal');
    });

    it('field is undefined when not provided', () => {
      const error = new InvalidPromoCodeDataError('msg');
      expect(error.field).toBeUndefined();
    });
  });

  describe('PromoCodeNotFoundError', () => {
    it('message is Promo code not found', () => {
      const error = new PromoCodeNotFoundError();
      expect(error.message).toBe('Promo code not found');
    });

    it('code is PROMO_CODE_NOT_FOUND', () => {
      const error = new PromoCodeNotFoundError();
      expect(error.code).toBe('PROMO_CODE_NOT_FOUND');
    });

    it('name is PromoCodeNotFoundError', () => {
      const error = new PromoCodeNotFoundError();
      expect(error.name).toBe('PromoCodeNotFoundError');
    });

    it('instanceof PromoCodeError', () => {
      const error = new PromoCodeNotFoundError();
      expect(error instanceof PromoCodeError).toBe(true);
    });
  });

  describe('PromoCodeExpiredError', () => {
    it('message is Promo code has expired', () => {
      const error = new PromoCodeExpiredError();
      expect(error.message).toBe('Promo code has expired');
    });

    it('code is PROMO_CODE_EXPIRED', () => {
      const error = new PromoCodeExpiredError();
      expect(error.code).toBe('PROMO_CODE_EXPIRED');
    });

    it('name is PromoCodeExpiredError', () => {
      const error = new PromoCodeExpiredError();
      expect(error.name).toBe('PromoCodeExpiredError');
    });

    it('instanceof PromoCodeError', () => {
      const error = new PromoCodeExpiredError();
      expect(error instanceof PromoCodeError).toBe(true);
    });
  });

  describe('PromoCodeInactiveError', () => {
    it('message is Promo code is not active', () => {
      const error = new PromoCodeInactiveError();
      expect(error.message).toBe('Promo code is not active');
    });

    it('code is PROMO_CODE_INACTIVE', () => {
      const error = new PromoCodeInactiveError();
      expect(error.code).toBe('PROMO_CODE_INACTIVE');
    });

    it('name is PromoCodeInactiveError', () => {
      const error = new PromoCodeInactiveError();
      expect(error.name).toBe('PromoCodeInactiveError');
    });

    it('instanceof PromoCodeError', () => {
      const error = new PromoCodeInactiveError();
      expect(error instanceof PromoCodeError).toBe(true);
    });
  });

  describe('PromoCodeUsageLimitError', () => {
    it('message is Promo code usage limit reached', () => {
      const error = new PromoCodeUsageLimitError();
      expect(error.message).toBe('Promo code usage limit reached');
    });

    it('code is PROMO_CODE_USAGE_LIMIT', () => {
      const error = new PromoCodeUsageLimitError();
      expect(error.code).toBe('PROMO_CODE_USAGE_LIMIT');
    });

    it('name is PromoCodeUsageLimitError', () => {
      const error = new PromoCodeUsageLimitError();
      expect(error.name).toBe('PromoCodeUsageLimitError');
    });

    it('instanceof PromoCodeError', () => {
      const error = new PromoCodeUsageLimitError();
      expect(error instanceof PromoCodeError).toBe(true);
    });
  });

  describe('MinOrderAmountNotMetError', () => {
    it('constructor accepts minOrderAmount: number', () => {
      const error = new MinOrderAmountNotMetError(50);
      expect(error.minOrderAmount).toBe(50);
    });

    it('message is Order total does not meet minimum amount of {minOrderAmount}', () => {
      const error = new MinOrderAmountNotMetError(50);
      expect(error.message).toBe('Order total does not meet minimum amount of 50');
    });

    it('code is MIN_ORDER_AMOUNT_NOT_MET', () => {
      const error = new MinOrderAmountNotMetError(50);
      expect(error.code).toBe('MIN_ORDER_AMOUNT_NOT_MET');
    });

    it('name is MinOrderAmountNotMetError', () => {
      const error = new MinOrderAmountNotMetError(50);
      expect(error.name).toBe('MinOrderAmountNotMetError');
    });

    it('instanceof PromoCodeError', () => {
      const error = new MinOrderAmountNotMetError(50);
      expect(error instanceof PromoCodeError).toBe(true);
    });

    it('exposes minOrderAmount on the instance', () => {
      const error = new MinOrderAmountNotMetError(99.99);
      expect(error.minOrderAmount).toBe(99.99);
    });
  });

  describe('PromoCodeNotYetValidError', () => {
    it('message is Promo code is not yet valid', () => {
      const error = new PromoCodeNotYetValidError();
      expect(error.message).toBe('Promo code is not yet valid');
    });

    it('code is PROMO_CODE_NOT_YET_VALID', () => {
      const error = new PromoCodeNotYetValidError();
      expect(error.code).toBe('PROMO_CODE_NOT_YET_VALID');
    });

    it('name is PromoCodeNotYetValidError', () => {
      const error = new PromoCodeNotYetValidError();
      expect(error.name).toBe('PromoCodeNotYetValidError');
    });

    it('instanceof PromoCodeError', () => {
      const error = new PromoCodeNotYetValidError();
      expect(error instanceof PromoCodeError).toBe(true);
    });
  });
});
