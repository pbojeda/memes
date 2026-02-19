import request from 'supertest';
import express from 'express';
import prisma from '../lib/prisma';
import * as tokenService from '../application/services/tokenService';
import { UserRole } from '../generated/prisma/enums';
import type { Address } from '../generated/prisma/client';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    product: { findMany: jest.fn() },
    promoCode: { findUnique: jest.fn() },
    address: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  },
}));

jest.mock('../application/services/tokenService', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
  refreshTokens: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockTokenService = tokenService as jest.Mocked<typeof tokenService>;

const createTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  const routes = require('./index').default;
  testApp.use(routes);
  return testApp;
};

const testApp = createTestApp();

const PRODUCT_ID_1 = '123e4567-e89b-12d3-a456-426614174000';
const PRODUCT_ID_2 = '223e4567-e89b-12d3-a456-426614174001';
const PRODUCT_ID_3 = '323e4567-e89b-12d3-a456-426614174002';
const USER_ID = '423e4567-e89b-12d3-a456-426614174003';
const ADDRESS_ID = '523e4567-e89b-12d3-a456-426614174004';

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
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
    productType: {
      id: 'pt-uuid-1',
      name: { es: 'Camiseta', en: 'T-Shirt' },
      slug: 't-shirt',
      hasSizes: true,
      isActive: true,
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    images: [
      {
        id: 'img-uuid-1',
        productId: PRODUCT_ID_1,
        url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        altText: null,
        isPrimary: true,
        sortOrder: 0,
        createdAt: new Date(),
      },
    ],
    ...overrides,
  };
}

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

function makeAddress(overrides: Partial<Address> = {}): Address {
  return {
    id: ADDRESS_ID,
    userId: USER_ID,
    label: null,
    firstName: 'John',
    lastName: 'Doe',
    streetLine1: '123 Main St',
    streetLine2: null,
    city: 'Springfield',
    state: null,
    postalCode: '12345',
    countryCode: 'US',
    phone: null,
    isDefault: false,
    createdAt: new Date('2026-02-18'),
    updatedAt: new Date('2026-02-18'),
    ...overrides,
  };
}

const setupAuth = () => {
  (mockTokenService.verifyAccessToken as jest.Mock).mockReturnValue({
    userId: USER_ID,
    email: 'user@example.com',
    role: UserRole.TARGET,
  });
};

describe('Checkout Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('full checkout happy path', () => {
    it('should validate cart, validate promo, calculate total with promo, and verify address exists', async () => {
      // Step 1: validate cart
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([makeProduct()]);

      const cartValidateResponse = await request(testApp)
        .post('/cart/validate')
        .send({ items: [{ productId: PRODUCT_ID_1, quantity: 2, size: 'M' }] });

      expect(cartValidateResponse.status).toBe(200);
      expect(cartValidateResponse.body.data.valid).toBe(true);
      const cartSubtotal = cartValidateResponse.body.data.summary.subtotal;
      expect(cartSubtotal).toBe(200);
      expect(cartValidateResponse.body.data.items).toHaveLength(1);

      // Step 2: validate promo code using subtotal from cart validation
      (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(makePromoCode());

      const promoValidateResponse = await request(testApp)
        .post('/promo-codes/validate')
        .send({ code: 'SUMMER20', orderTotal: cartSubtotal });

      expect(promoValidateResponse.status).toBe(200);
      expect(promoValidateResponse.body.data.valid).toBe(true);
      const promoDiscount = promoValidateResponse.body.data.calculatedDiscount;
      expect(promoDiscount).toBe(40);

      // Step 3: calculate order total — must match cart + promo results
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([makeProduct()]);
      (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(makePromoCode());

      const calculateResponse = await request(testApp)
        .post('/cart/calculate')
        .send({
          items: [{ productId: PRODUCT_ID_1, quantity: 2, size: 'M' }],
          promoCode: 'SUMMER20',
        });

      expect(calculateResponse.status).toBe(200);
      expect(calculateResponse.body.data.subtotal).toBe(cartSubtotal);
      expect(calculateResponse.body.data.discountAmount).toBe(promoDiscount);
      expect(calculateResponse.body.data.total).toBe(cartSubtotal - promoDiscount);
      expect(calculateResponse.body.data.appliedPromoCode.code).toBe('SUMMER20');

      // Step 4: get addresses (authenticated)
      setupAuth();
      (mockPrisma.address.findMany as jest.Mock).mockResolvedValue([makeAddress()]);

      const addressResponse = await request(testApp)
        .get('/users/me/addresses')
        .set('Authorization', 'Bearer valid-token');

      expect(addressResponse.status).toBe(200);
      expect(addressResponse.body.data).toHaveLength(1);
    });
  });

  describe('cart-to-order-total consistency', () => {
    it('should produce the same subtotal in /cart/validate and /cart/calculate for the same items', async () => {
      const products = [makeProduct(), makeProduct({ id: PRODUCT_ID_2, slug: 'product-2' })];

      // Step 1: validate cart
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(products);

      const cartValidateResponse = await request(testApp)
        .post('/cart/validate')
        .send({
          items: [
            { productId: PRODUCT_ID_1, quantity: 2, size: 'M' },
            { productId: PRODUCT_ID_2, quantity: 1, size: 'L' },
          ],
        });

      expect(cartValidateResponse.status).toBe(200);
      expect(cartValidateResponse.body.data.summary.subtotal).toBe(300);
      expect(cartValidateResponse.body.data.summary.itemCount).toBe(3);

      // Step 2: calculate with same items, no promo
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(products);

      const calculateResponse = await request(testApp)
        .post('/cart/calculate')
        .send({
          items: [
            { productId: PRODUCT_ID_1, quantity: 2, size: 'M' },
            { productId: PRODUCT_ID_2, quantity: 1, size: 'L' },
          ],
        });

      expect(calculateResponse.status).toBe(200);
      expect(calculateResponse.body.data.subtotal).toBe(300);
      expect(calculateResponse.body.data.total).toBe(300);
      expect(calculateResponse.body.data.itemCount).toBe(3);
    });
  });

  describe('promo code flow — validate then apply', () => {
    it('should match discount from standalone validate with discount applied in calculate', async () => {
      // Step 1: validate promo code standalone
      (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(makePromoCode());

      const promoValidateResponse = await request(testApp)
        .post('/promo-codes/validate')
        .send({ code: 'SUMMER20', orderTotal: 150 });

      expect(promoValidateResponse.status).toBe(200);
      const standaloneDiscount = promoValidateResponse.body.data.calculatedDiscount;
      expect(standaloneDiscount).toBe(30);

      // Step 2: calculate order total with same promo — discount must match standalone
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([makeProduct({ price: 150 })]);
      (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(makePromoCode());

      const calculateResponse = await request(testApp)
        .post('/cart/calculate')
        .send({
          items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }],
          promoCode: 'SUMMER20',
        });

      expect(calculateResponse.status).toBe(200);
      expect(calculateResponse.body.data.discountAmount).toBe(standaloneDiscount);
      expect(calculateResponse.body.data.total).toBe(150 - standaloneDiscount);
      expect(calculateResponse.body.data.appliedPromoCode.discountType).toBe('PERCENTAGE');
    });
  });

  describe('invalid cart propagation', () => {
    it('should propagate PRODUCT_NOT_FOUND errors from cart validation to order total calculation', async () => {
      // Step 1: cart validate — product not found
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);

      const cartValidateResponse = await request(testApp)
        .post('/cart/validate')
        .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }] });

      expect(cartValidateResponse.status).toBe(200);
      expect(cartValidateResponse.body.data.valid).toBe(false);
      expect(cartValidateResponse.body.data.errors[0].code).toBe('PRODUCT_NOT_FOUND');

      // Step 2: calculate with same item — product still not found
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);

      const calculateResponse = await request(testApp)
        .post('/cart/calculate')
        .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }] });

      expect(calculateResponse.status).toBe(200);
      expect(calculateResponse.body.data.valid).toBe(false);
      expect(calculateResponse.body.data.cartErrors[0].code).toBe('PRODUCT_NOT_FOUND');
      expect(calculateResponse.body.data.subtotal).toBe(0);
      expect(calculateResponse.body.data.total).toBe(0);
    });
  });

  describe('mixed scenario — partial cart + expired promo', () => {
    it('should return correct subtotal from valid items only and reject expired promo', async () => {
      // Step 1: cart validate — only PRODUCT_ID_1 found, PRODUCT_ID_2 missing
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([makeProduct()]);

      const cartValidateResponse = await request(testApp)
        .post('/cart/validate')
        .send({
          items: [
            { productId: PRODUCT_ID_1, quantity: 1, size: 'M' },
            { productId: PRODUCT_ID_2, quantity: 1, size: 'M' },
          ],
        });

      expect(cartValidateResponse.status).toBe(200);
      expect(cartValidateResponse.body.data.valid).toBe(false);
      expect(cartValidateResponse.body.data.items).toHaveLength(1);
      expect(cartValidateResponse.body.data.errors).toHaveLength(1);
      const validSubtotal = cartValidateResponse.body.data.summary.subtotal;
      expect(validSubtotal).toBe(100);

      // Step 2: calculate with same items + expired promo — subtotal must match cart
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([makeProduct()]);
      (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
        makePromoCode({ validUntil: new Date(Date.now() - 86400000) })
      );

      const calculateResponse = await request(testApp)
        .post('/cart/calculate')
        .send({
          items: [
            { productId: PRODUCT_ID_1, quantity: 1, size: 'M' },
            { productId: PRODUCT_ID_2, quantity: 1, size: 'M' },
          ],
          promoCode: 'SUMMER20',
        });

      expect(calculateResponse.status).toBe(200);
      expect(calculateResponse.body.data.valid).toBe(false);
      expect(calculateResponse.body.data.subtotal).toBe(validSubtotal);
      expect(calculateResponse.body.data.discountAmount).toBe(0);
      expect(calculateResponse.body.data.appliedPromoCode).toBeNull();
      expect(calculateResponse.body.data.promoCodeMessage).toBe('Promo code has expired');
      expect(calculateResponse.body.data.total).toBe(validSubtotal);
      expect(calculateResponse.body.data.cartErrors).toHaveLength(1);
    });
  });

  describe('address + checkout flow', () => {
    it('should create address (auth), validate cart (public), and calculate total (public)', async () => {
      // Step 1: create address (authenticated)
      setupAuth();
      (mockPrisma.address.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.address.create as jest.Mock).mockResolvedValue(makeAddress({ isDefault: true }));

      const createAddressResponse = await request(testApp)
        .post('/users/me/addresses')
        .set('Authorization', 'Bearer valid-token')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          streetLine1: '123 Main St',
          city: 'Springfield',
          postalCode: '12345',
          countryCode: 'US',
        });

      expect(createAddressResponse.status).toBe(201);
      expect(createAddressResponse.body.data.isDefault).toBe(true);

      // Step 2: validate cart (public, no auth)
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([makeProduct()]);

      const cartValidateResponse = await request(testApp)
        .post('/cart/validate')
        .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }] });

      expect(cartValidateResponse.status).toBe(200);
      expect(cartValidateResponse.body.data.valid).toBe(true);
      expect(cartValidateResponse.body.data.summary.subtotal).toBe(100);

      // Step 3: calculate order total (public, no auth)
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([makeProduct()]);

      const calculateResponse = await request(testApp)
        .post('/cart/calculate')
        .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }] });

      expect(calculateResponse.status).toBe(200);
      expect(calculateResponse.body.data.total).toBe(100);
    });
  });

  describe('FIXED_AMOUNT promo code flow', () => {
    it('should validate fixed discount standalone then apply via calculate with correct deduction', async () => {
      // Step 1: validate FIXED_AMOUNT promo standalone
      (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
        makePromoCode({ code: 'SAVE15', discountType: 'FIXED_AMOUNT', discountValue: 15 })
      );

      const promoValidateResponse = await request(testApp)
        .post('/promo-codes/validate')
        .send({ code: 'SAVE15', orderTotal: 100 });

      expect(promoValidateResponse.status).toBe(200);
      expect(promoValidateResponse.body.data.valid).toBe(true);
      expect(promoValidateResponse.body.data.discountType).toBe('FIXED_AMOUNT');
      const fixedDiscount = promoValidateResponse.body.data.calculatedDiscount;
      expect(fixedDiscount).toBe(15);

      // Step 2: calculate with same promo — discount must match standalone
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([makeProduct()]);
      (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(
        makePromoCode({ code: 'SAVE15', discountType: 'FIXED_AMOUNT', discountValue: 15 })
      );

      const calculateResponse = await request(testApp)
        .post('/cart/calculate')
        .send({
          items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }],
          promoCode: 'SAVE15',
        });

      expect(calculateResponse.status).toBe(200);
      expect(calculateResponse.body.data.discountAmount).toBe(fixedDiscount);
      expect(calculateResponse.body.data.total).toBe(100 - fixedDiscount);
      expect(calculateResponse.body.data.appliedPromoCode.discountType).toBe('FIXED_AMOUNT');
    });
  });

  describe('multiple items with percentage discount', () => {
    it('should calculate correct totals across endpoints for multi-item cart with percentage promo', async () => {
      const products = [
        makeProduct({ price: 50 }),
        makeProduct({ id: PRODUCT_ID_2, slug: 'product-2', price: 75 }),
        makeProduct({ id: PRODUCT_ID_3, slug: 'product-3', price: 120 }),
      ];

      // Step 1: validate cart — 3 products, 4 total items (2+1+1)
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(products);

      const cartValidateResponse = await request(testApp)
        .post('/cart/validate')
        .send({
          items: [
            { productId: PRODUCT_ID_1, quantity: 2, size: 'M' },
            { productId: PRODUCT_ID_2, quantity: 1, size: 'L' },
            { productId: PRODUCT_ID_3, quantity: 1, size: 'S' },
          ],
        });

      // subtotal: 50*2 + 75*1 + 120*1 = 100 + 75 + 120 = 295
      expect(cartValidateResponse.status).toBe(200);
      expect(cartValidateResponse.body.data.valid).toBe(true);
      expect(cartValidateResponse.body.data.items).toHaveLength(3);
      const cartSubtotal = cartValidateResponse.body.data.summary.subtotal;
      const cartItemCount = cartValidateResponse.body.data.summary.itemCount;
      expect(cartSubtotal).toBe(295);
      expect(cartItemCount).toBe(4);

      // Step 2: validate promo code against the subtotal from cart validation
      (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(makePromoCode());

      const promoValidateResponse = await request(testApp)
        .post('/promo-codes/validate')
        .send({ code: 'SUMMER20', orderTotal: cartSubtotal });

      // 20% of 295 = 59
      expect(promoValidateResponse.status).toBe(200);
      const promoDiscount = promoValidateResponse.body.data.calculatedDiscount;
      expect(promoDiscount).toBe(59);

      // Step 3: calculate full order total — must match cart + promo results
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(products);
      (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(makePromoCode());

      const calculateResponse = await request(testApp)
        .post('/cart/calculate')
        .send({
          items: [
            { productId: PRODUCT_ID_1, quantity: 2, size: 'M' },
            { productId: PRODUCT_ID_2, quantity: 1, size: 'L' },
            { productId: PRODUCT_ID_3, quantity: 1, size: 'S' },
          ],
          promoCode: 'SUMMER20',
        });

      expect(calculateResponse.status).toBe(200);
      expect(calculateResponse.body.data.subtotal).toBe(cartSubtotal);
      expect(calculateResponse.body.data.discountAmount).toBe(promoDiscount);
      expect(calculateResponse.body.data.total).toBe(cartSubtotal - promoDiscount);
      expect(calculateResponse.body.data.itemCount).toBe(cartItemCount);
      expect(calculateResponse.body.data.validatedItems).toHaveLength(3);
    });
  });
});
