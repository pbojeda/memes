import request from 'supertest';
import express from 'express';
import prisma from '../lib/prisma';
import * as tokenService from '../application/services/tokenService';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    promoCode: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../application/services/tokenService', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
  refreshTokens: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
// tokenService mock is declared to prevent module resolution issues across routes
void (tokenService as jest.Mocked<typeof tokenService>);

const createTestApp = () => {
  const testApp = express();
  testApp.use(express.json());

  const routes = require('./index').default;
  testApp.use(routes);
  return testApp;
};

const testApp = createTestApp();

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

describe('Promo Code Routes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /promo-codes/validate', () => {
    describe('success — valid code', () => {
      it('returns 200 with valid=true and discountType/discountValue for valid PERCENTAGE code', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(makePromoCode());

        const response = await request(testApp)
          .post('/promo-codes/validate')
          .send({ code: 'SUMMER20', orderTotal: 100 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.valid).toBe(true);
        expect(response.body.data.discountType).toBe('PERCENTAGE');
        expect(response.body.data.discountValue).toBe(20);
      });

      it('returns 200 with valid=true for valid FIXED_AMOUNT code', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ discountType: 'FIXED_AMOUNT', discountValue: 10 })
        );

        const response = await request(testApp)
          .post('/promo-codes/validate')
          .send({ code: 'SAVE10', orderTotal: 50 });

        expect(response.status).toBe(200);
        expect(response.body.data.valid).toBe(true);
        expect(response.body.data.discountType).toBe('FIXED_AMOUNT');
        expect(response.body.data.discountValue).toBe(10);
      });

      it('returns calculatedDiscount when orderTotal is provided', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(makePromoCode());

        const response = await request(testApp)
          .post('/promo-codes/validate')
          .send({ code: 'SUMMER20', orderTotal: 100 });

        expect(response.status).toBe(200);
        expect(response.body.data.calculatedDiscount).toBe(20);
      });

      it('returns calculatedDiscount=null for PERCENTAGE when no orderTotal', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(makePromoCode());

        const response = await request(testApp)
          .post('/promo-codes/validate')
          .send({ code: 'SUMMER20' });

        expect(response.status).toBe(200);
        expect(response.body.data.valid).toBe(true);
        expect(response.body.data.calculatedDiscount).toBeNull();
      });

      it('is accessible without Authorization header (public endpoint)', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(makePromoCode());

        const response = await request(testApp)
          .post('/promo-codes/validate')
          // Deliberately no Authorization header
          .send({ code: 'SUMMER20' });

        expect(response.status).toBe(200);
      });
    });

    describe('success — invalid code (business rules, still HTTP 200)', () => {
      it('returns 200 with valid=false when findUnique returns null (not found)', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(null);

        const response = await request(testApp)
          .post('/promo-codes/validate')
          .send({ code: 'NOTEXIST' });

        expect(response.status).toBe(200);
        expect(response.body.data.valid).toBe(false);
        expect(response.body.data.message).toBe('Promo code not found');
      });

      it('returns 200 with valid=false when code is inactive', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ isActive: false })
        );

        const response = await request(testApp)
          .post('/promo-codes/validate')
          .send({ code: 'SUMMER20' });

        expect(response.status).toBe(200);
        expect(response.body.data.valid).toBe(false);
        expect(response.body.data.message).toBe('Promo code is not active');
      });

      it('returns 200 with valid=false when code is expired (validUntil in past)', async () => {
        const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24);
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ validUntil: pastDate })
        );

        const response = await request(testApp)
          .post('/promo-codes/validate')
          .send({ code: 'SUMMER20' });

        expect(response.status).toBe(200);
        expect(response.body.data.valid).toBe(false);
        expect(response.body.data.message).toBe('Promo code has expired');
      });

      it('returns 200 with valid=false when code not yet valid (validFrom in future)', async () => {
        const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24);
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ validFrom: futureDate })
        );

        const response = await request(testApp)
          .post('/promo-codes/validate')
          .send({ code: 'SUMMER20' });

        expect(response.status).toBe(200);
        expect(response.body.data.valid).toBe(false);
        expect(response.body.data.message).toBe('Promo code is not yet valid');
      });

      it('returns 200 with valid=false when usage limit reached', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ maxUses: 10, currentUses: 10 })
        );

        const response = await request(testApp)
          .post('/promo-codes/validate')
          .send({ code: 'SUMMER20' });

        expect(response.status).toBe(200);
        expect(response.body.data.valid).toBe(false);
        expect(response.body.data.message).toBe('Promo code usage limit reached');
      });

      it('returns 200 with valid=false when order total below minimum', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
          makePromoCode({ minOrderAmount: 50 })
        );

        const response = await request(testApp)
          .post('/promo-codes/validate')
          .send({ code: 'SUMMER20', orderTotal: 30 });

        expect(response.status).toBe(200);
        expect(response.body.data.valid).toBe(false);
        expect(response.body.data.message).toBe('Order total does not meet minimum amount of 50');
      });
    });

    describe('input validation — returns 400', () => {
      it('returns 400 when code is missing from body', async () => {
        const response = await request(testApp).post('/promo-codes/validate').send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('returns 400 when code is empty string', async () => {
        const response = await request(testApp).post('/promo-codes/validate').send({ code: '' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('returns 400 when code is not a string (e.g. number)', async () => {
        const response = await request(testApp).post('/promo-codes/validate').send({ code: 123 });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('returns 400 when orderTotal is negative', async () => {
        const response = await request(testApp)
          .post('/promo-codes/validate')
          .send({ code: 'SUMMER20', orderTotal: -1 });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('returns 400 with error.code=INVALID_PROMO_CODE_DATA', async () => {
        const response = await request(testApp).post('/promo-codes/validate').send({});

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_PROMO_CODE_DATA');
      });

      it('returns 400 with error.field=code when code is invalid', async () => {
        const response = await request(testApp).post('/promo-codes/validate').send({});

        expect(response.status).toBe(400);
        expect(response.body.error.field).toBe('code');
      });
    });

    describe('response shape', () => {
      it('valid response includes: valid, code, discountType, discountValue, calculatedDiscount, message', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(makePromoCode());

        const response = await request(testApp)
          .post('/promo-codes/validate')
          .send({ code: 'SUMMER20', orderTotal: 100 });

        const data = response.body.data;
        expect(data).toHaveProperty('valid', true);
        expect(data).toHaveProperty('code', 'SUMMER20');
        expect(data).toHaveProperty('discountType');
        expect(data).toHaveProperty('discountValue');
        expect(data).toHaveProperty('calculatedDiscount');
        expect(data).toHaveProperty('message', 'Promo code applied');
      });

      it('invalid response includes: valid=false, code, message (no discountType/discountValue)', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(null);

        const response = await request(testApp)
          .post('/promo-codes/validate')
          .send({ code: 'NOTEXIST' });

        const data = response.body.data;
        expect(data.valid).toBe(false);
        expect(data).toHaveProperty('code');
        expect(data).toHaveProperty('message');
        expect(data.discountType).toBeUndefined();
        expect(data.discountValue).toBeUndefined();
      });
    });
  });
});
