import request from 'supertest';
import express from 'express';
import prisma from '../lib/prisma';
import * as tokenService from '../application/services/tokenService';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    product: {
      findMany: jest.fn(),
    },
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

const PRODUCT_ID_1 = '123e4567-e89b-12d3-a456-426614174000';

const mockProductType = {
  id: 'pt-uuid-1',
  name: { es: 'Camiseta', en: 'T-Shirt' },
  slug: 't-shirt',
  hasSizes: true,
  isActive: true,
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockImage = {
  id: 'img-uuid-1',
  productId: PRODUCT_ID_1,
  url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
  altText: null,
  isPrimary: true,
  sortOrder: 0,
  createdAt: new Date(),
};

const mockProduct = {
  id: PRODUCT_ID_1,
  productTypeId: 'pt-uuid-1',
  title: { es: 'Camiseta Test', en: 'Test T-Shirt' },
  description: { es: 'Descripcion', en: 'Description' },
  slug: 'camiseta-test',
  price: 100,
  compareAtPrice: null,
  availableSizes: ['S', 'M', 'L', 'XL'],
  color: 'white',
  isActive: true,
  isHot: false,
  printfulProductId: null,
  printfulSyncVariantId: null,
  memeSourceUrl: null,
  memeIsOriginal: false,
  salesCount: 0,
  viewCount: 0,
  createdByUserId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  productType: mockProductType,
  images: [mockImage],
};

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

describe('Order Total Routes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /cart/calculate', () => {
    describe('success — no promo code', () => {
      it('should return 200 with valid=true and correct totals when no promoCode', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);

        const response = await request(testApp)
          .post('/cart/calculate')
          .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }] });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.valid).toBe(true);
        expect(response.body.data.subtotal).toBe(100);
        expect(response.body.data.discountAmount).toBe(0);
        expect(response.body.data.shippingCost).toBe(0);
        expect(response.body.data.taxAmount).toBe(0);
        expect(response.body.data.total).toBe(100);
        expect(response.body.data.currency).toBe('MXN');
        expect(response.body.data.itemCount).toBe(1);
        expect(response.body.data.appliedPromoCode).toBeNull();
        expect(response.body.data.validatedItems).toHaveLength(1);
        expect(response.body.data.cartErrors).toEqual([]);
      });

      it('should be accessible without Authorization header (public endpoint)', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);

        const response = await request(testApp)
          .post('/cart/calculate')
          // Deliberately no Authorization header
          .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }] });

        expect(response.status).toBe(200);
      });
    });

    describe('success — with valid PERCENTAGE promo code', () => {
      it('should return discountAmount=20 and total=80 for 20% off 100', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(makePromoCode());

        const response = await request(testApp)
          .post('/cart/calculate')
          .send({
            items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }],
            promoCode: 'SUMMER20',
          });

        expect(response.status).toBe(200);
        expect(response.body.data.discountAmount).toBe(20);
        expect(response.body.data.total).toBe(80);
        expect(response.body.data.appliedPromoCode.code).toBe('SUMMER20');
      });
    });

    describe('success — with invalid promo code (not found)', () => {
      it('should return valid=true, appliedPromoCode=null, discountAmount=0 when promo not found', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(null);

        const response = await request(testApp)
          .post('/cart/calculate')
          .send({
            items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }],
            promoCode: 'NOTEXIST',
          });

        expect(response.status).toBe(200);
        expect(response.body.data.valid).toBe(true);
        expect(response.body.data.appliedPromoCode).toBeNull();
        expect(response.body.data.discountAmount).toBe(0);
        expect(response.body.data.promoCodeMessage).toBe('Promo code not found');
      });
    });

    describe('success — cart has invalid items (still HTTP 200)', () => {
      it('should return valid=false with cartErrors when product not found', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);

        const response = await request(testApp)
          .post('/cart/calculate')
          .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }] });

        expect(response.status).toBe(200);
        expect(response.body.data.valid).toBe(false);
        expect(response.body.data.cartErrors[0].code).toBe('PRODUCT_NOT_FOUND');
        expect(response.body.data.subtotal).toBe(0);
        expect(response.body.data.total).toBe(0);
      });
    });

    describe('response shape', () => {
      it('should always include all required fields in response', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);

        const response = await request(testApp)
          .post('/cart/calculate')
          .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }] });

        const data = response.body.data;
        expect(data).toHaveProperty('valid');
        expect(data).toHaveProperty('subtotal');
        expect(data).toHaveProperty('discountAmount');
        expect(data).toHaveProperty('shippingCost');
        expect(data).toHaveProperty('taxAmount');
        expect(data).toHaveProperty('total');
        expect(data).toHaveProperty('currency');
        expect(data).toHaveProperty('itemCount');
        expect(data).toHaveProperty('validatedItems');
        expect(data).toHaveProperty('appliedPromoCode');
        expect(data).toHaveProperty('cartErrors');
      });
    });

    describe('input validation — returns 400', () => {
      it('should return 400 when items is missing', async () => {
        const response = await request(testApp).post('/cart/calculate').send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_ORDER_TOTAL_DATA');
        expect(response.body.error.field).toBe('items');
      });

      it('should return 400 when items is empty array', async () => {
        const response = await request(testApp).post('/cart/calculate').send({ items: [] });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_ORDER_TOTAL_DATA');
      });

      it('should return 400 when productId is not a valid UUID', async () => {
        const response = await request(testApp)
          .post('/cart/calculate')
          .send({ items: [{ productId: 'not-a-uuid', quantity: 1 }] });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_ORDER_TOTAL_DATA');
      });

      it('should return 400 when promoCode is a number', async () => {
        const response = await request(testApp)
          .post('/cart/calculate')
          .send({
            items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
            promoCode: 123,
          });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_ORDER_TOTAL_DATA');
        expect(response.body.error.field).toBe('promoCode');
      });

      it('should return 400 when promoCode is empty string', async () => {
        const response = await request(testApp)
          .post('/cart/calculate')
          .send({
            items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
            promoCode: '',
          });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_ORDER_TOTAL_DATA');
        expect(response.body.error.field).toBe('promoCode');
      });
    });
  });
});
