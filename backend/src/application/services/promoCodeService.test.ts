import { validatePromoCode } from './promoCodeService';
import prisma from '../../lib/prisma';
import { InvalidPromoCodeDataError } from '../../domain/errors/PromoCodeError';

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    promoCode: {
      findUnique: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function makePromoCode(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pc-uuid-1',
    code: 'SUMMER20',
    description: null,
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minOrderAmount: null,
    maxDiscountAmount: null,
    maxUses: null,
    maxUsesPerUser: null,
    currentUses: 0,
    validFrom: new Date('2026-01-01'),
    validUntil: null,
    isActive: true,
    createdByUserId: 'user-uuid-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('promoCodeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePromoCode', () => {
    describe('input validation failures', () => {
      it('throws InvalidPromoCodeDataError when code is missing', async () => {
        await expect(validatePromoCode({ code: undefined })).rejects.toThrow(
          InvalidPromoCodeDataError
        );
      });

      it('throws InvalidPromoCodeDataError when code is empty string', async () => {
        await expect(validatePromoCode({ code: '' })).rejects.toThrow(InvalidPromoCodeDataError);
      });

      it('throws InvalidPromoCodeDataError when orderTotal is negative', async () => {
        await expect(validatePromoCode({ code: 'SUMMER20', orderTotal: -1 })).rejects.toThrow(
          InvalidPromoCodeDataError
        );
      });
    });

    describe('code not found', () => {
      it('returns valid=false, message=Promo code not found when findUnique returns null', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await validatePromoCode({ code: 'SUMMER20' });

        expect(result.valid).toBe(false);
        expect(result.message).toBe('Promo code not found');
      });

      it('does not include discountType/discountValue in result when not found', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await validatePromoCode({ code: 'SUMMER20' });

        expect(result.discountType).toBeUndefined();
        expect(result.discountValue).toBeUndefined();
      });

      it('calls findUnique with { where: { code: SUMMER20 } } (uppercase)', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(null);

        await validatePromoCode({ code: 'summer20' });

        expect(mockPrisma.promoCode.findUnique).toHaveBeenCalledWith({
          where: { code: 'SUMMER20' },
        });
      });
    });

    describe('code inactive', () => {
      it('returns valid=false when isActive=false', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ isActive: false })
        );

        const result = await validatePromoCode({ code: 'SUMMER20' });

        expect(result.valid).toBe(false);
        expect(result.message).toBe('Promo code is not active');
      });
    });

    describe('not yet valid', () => {
      it('returns valid=false when validFrom is in the future', async () => {
        const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // tomorrow
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ validFrom: futureDate })
        );

        const result = await validatePromoCode({ code: 'SUMMER20' });

        expect(result.valid).toBe(false);
        expect(result.message).toBe('Promo code is not yet valid');
      });
    });

    describe('expired', () => {
      it('returns valid=false when validUntil is in the past', async () => {
        const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // yesterday
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ validUntil: pastDate })
        );

        const result = await validatePromoCode({ code: 'SUMMER20' });

        expect(result.valid).toBe(false);
        expect(result.message).toBe('Promo code has expired');
      });

      it('passes expiry check when validUntil is null', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ validUntil: null })
        );

        const result = await validatePromoCode({ code: 'SUMMER20' });

        expect(result.valid).toBe(true);
      });
    });

    describe('usage limit reached', () => {
      it('returns valid=false when maxUses=10 and currentUses=10', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ maxUses: 10, currentUses: 10 })
        );

        const result = await validatePromoCode({ code: 'SUMMER20' });

        expect(result.valid).toBe(false);
        expect(result.message).toBe('Promo code usage limit reached');
      });

      it('passes usage check when maxUses=10 and currentUses=9', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ maxUses: 10, currentUses: 9 })
        );

        const result = await validatePromoCode({ code: 'SUMMER20' });

        expect(result.valid).toBe(true);
      });

      it('passes usage check when maxUses=null (unlimited)', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ maxUses: null, currentUses: 999 })
        );

        const result = await validatePromoCode({ code: 'SUMMER20' });

        expect(result.valid).toBe(true);
      });
    });

    describe('minimum order amount not met', () => {
      it('returns valid=false when minOrderAmount=50 and orderTotal=30', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ minOrderAmount: 50 })
        );

        const result = await validatePromoCode({ code: 'SUMMER20', orderTotal: 30 });

        expect(result.valid).toBe(false);
        expect(result.message).toBe('Order total does not meet minimum amount of 50');
      });

      it('passes when minOrderAmount=50 and orderTotal=50 (equal is OK)', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ minOrderAmount: 50 })
        );

        const result = await validatePromoCode({ code: 'SUMMER20', orderTotal: 50 });

        expect(result.valid).toBe(true);
      });

      it('passes when minOrderAmount=50 and orderTotal is not provided', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ minOrderAmount: 50 })
        );

        const result = await validatePromoCode({ code: 'SUMMER20' });

        expect(result.valid).toBe(true);
      });

      it('passes when minOrderAmount=null regardless of orderTotal', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ minOrderAmount: null })
        );

        const result = await validatePromoCode({ code: 'SUMMER20', orderTotal: 0 });

        expect(result.valid).toBe(true);
      });
    });

    describe('PERCENTAGE discount calculation', () => {
      it('calculates 20% off 100.00 = 20.00', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ discountType: 'PERCENTAGE', discountValue: 20 })
        );

        const result = await validatePromoCode({ code: 'SUMMER20', orderTotal: 100 });

        expect(result.valid).toBe(true);
        expect(result.calculatedDiscount).toBe(20);
      });

      it('calculates 20% off 79.99 = 15.998 rounds to 16.00', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ discountType: 'PERCENTAGE', discountValue: 20 })
        );

        const result = await validatePromoCode({ code: 'SUMMER20', orderTotal: 79.99 });

        expect(result.valid).toBe(true);
        expect(result.calculatedDiscount).toBe(16);
      });

      it('caps calculatedDiscount at maxDiscountAmount', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ discountType: 'PERCENTAGE', discountValue: 20, maxDiscountAmount: 15 })
        );

        const result = await validatePromoCode({ code: 'SUMMER20', orderTotal: 100 });

        expect(result.valid).toBe(true);
        expect(result.calculatedDiscount).toBe(15);
      });

      it('caps calculatedDiscount at orderTotal when percentage exceeds 100%', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ discountType: 'PERCENTAGE', discountValue: 150 })
        );

        const result = await validatePromoCode({ code: 'SUMMER20', orderTotal: 100 });

        expect(result.valid).toBe(true);
        expect(result.calculatedDiscount).toBe(100);
      });

      it('returns calculatedDiscount=null when no orderTotal provided', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ discountType: 'PERCENTAGE', discountValue: 20 })
        );

        const result = await validatePromoCode({ code: 'SUMMER20' });

        expect(result.valid).toBe(true);
        expect(result.calculatedDiscount).toBeNull();
      });

      it('returns valid=true with correct discountType, discountValue, and message', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ discountType: 'PERCENTAGE', discountValue: 20 })
        );

        const result = await validatePromoCode({ code: 'SUMMER20', orderTotal: 100 });

        expect(result.valid).toBe(true);
        expect(result.discountType).toBe('PERCENTAGE');
        expect(result.discountValue).toBe(20);
        expect(result.message).toBe('Promo code applied');
      });
    });

    describe('FIXED_AMOUNT discount calculation', () => {
      it('returns fixed 10.00 discount when orderTotal=50', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ discountType: 'FIXED_AMOUNT', discountValue: 10 })
        );

        const result = await validatePromoCode({ code: 'SUMMER20', orderTotal: 50 });

        expect(result.valid).toBe(true);
        expect(result.calculatedDiscount).toBe(10);
      });

      it('returns fixed 10.00 discount when no orderTotal provided (no capping)', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ discountType: 'FIXED_AMOUNT', discountValue: 10 })
        );

        const result = await validatePromoCode({ code: 'SUMMER20' });

        expect(result.valid).toBe(true);
        expect(result.calculatedDiscount).toBe(10);
      });

      it('caps discount at orderTotal when fixed amount exceeds it', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ discountType: 'FIXED_AMOUNT', discountValue: 10 })
        );

        const result = await validatePromoCode({ code: 'SUMMER20', orderTotal: 5 });

        expect(result.valid).toBe(true);
        expect(result.calculatedDiscount).toBe(5);
      });

      it('returns valid=true with correct discountType and discountValue', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ discountType: 'FIXED_AMOUNT', discountValue: 10 })
        );

        const result = await validatePromoCode({ code: 'SUMMER20', orderTotal: 50 });

        expect(result.valid).toBe(true);
        expect(result.discountType).toBe('FIXED_AMOUNT');
        expect(result.discountValue).toBe(10);
      });
    });

    describe('case normalization', () => {
      it('calls findUnique with SUMMER20 when input is lowercase summer20', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(null);

        await validatePromoCode({ code: 'summer20' });

        expect(mockPrisma.promoCode.findUnique).toHaveBeenCalledWith({
          where: { code: 'SUMMER20' },
        });
      });

      it('returned code in result matches DB code (uppercase)', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ code: 'SUMMER20' })
        );

        const result = await validatePromoCode({ code: 'summer20', orderTotal: 100 });

        expect(result.code).toBe('SUMMER20');
      });
    });
  });
});
