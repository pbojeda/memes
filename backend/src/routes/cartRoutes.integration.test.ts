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
    address: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
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
const PRODUCT_ID_2 = '223e4567-e89b-12d3-a456-426614174001';
const PRODUCT_ID_3 = '323e4567-e89b-12d3-a456-426614174002';

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

const mockProductTypeNoSizes = {
  ...mockProductType,
  id: 'pt-uuid-2',
  hasSizes: false,
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
  price: 29.99,
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

describe('Cart Routes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /cart/validate', () => {
    describe('success cases', () => {
      it('should return 200 with valid=true when all items are valid', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);

        const response = await request(testApp)
          .post('/cart/validate')
          .send({ items: [{ productId: PRODUCT_ID_1, quantity: 2, size: 'M' }] });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.valid).toBe(true);
        expect(response.body.data.errors).toHaveLength(0);
        expect(response.body.data.items).toHaveLength(1);
        expect(response.body.data.items[0].unitPrice).toBe(29.99);
        expect(response.body.data.items[0].subtotal).toBe(59.98);
        expect(response.body.data.items[0].size).toBe('M');
        expect(response.body.data.items[0].status).toBe('valid');
        expect(response.body.data.summary.itemCount).toBe(2);
        expect(response.body.data.summary.subtotal).toBe(59.98);
      });

      it('should return 200 with valid=false when items have errors', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);

        const response = await request(testApp)
          .post('/cart/validate')
          .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }] });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.valid).toBe(false);
        expect(response.body.data.errors).toHaveLength(1);
        expect(response.body.data.errors[0].code).toBe('PRODUCT_NOT_FOUND');
        expect(response.body.data.errors[0].productId).toBe(PRODUCT_ID_1);
        expect(response.body.data.summary.subtotal).toBe(0);
        expect(response.body.data.summary.itemCount).toBe(0);
      });

      it('should be accessible without Authorization header (public endpoint)', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);

        const response = await request(testApp)
          .post('/cart/validate')
          // Deliberately no Authorization header
          .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }] });

        expect(response.status).toBe(200);
      });

      it('should handle product without sizes', async () => {
        const productNoSizes = {
          ...mockProduct,
          productType: mockProductTypeNoSizes,
          availableSizes: null,
          images: [],
        };
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([productNoSizes]);

        const response = await request(testApp)
          .post('/cart/validate')
          .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1 }] });

        expect(response.status).toBe(200);
        expect(response.body.data.valid).toBe(true);
        expect(response.body.data.items[0].size).toBeNull();
        expect(response.body.data.items[0].product.primaryImage).toBeNull();
      });
    });

    describe('response structure', () => {
      it('should include product title, slug, and primaryImage in each valid item', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);

        const response = await request(testApp)
          .post('/cart/validate')
          .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'S' }] });

        const item = response.body.data.items[0];
        expect(item.product.title).toEqual({ es: 'Camiseta Test', en: 'Test T-Shirt' });
        expect(item.product.slug).toBe('camiseta-test');
        expect(item.product.primaryImage).toBeTruthy();
        expect(item.product.primaryImage.url).toBe(
          'https://res.cloudinary.com/test/image/upload/test.jpg'
        );
      });

      it('should include productId, code, and message in each error', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          { ...mockProduct, isActive: false },
        ]);

        const response = await request(testApp)
          .post('/cart/validate')
          .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }] });

        const error = response.body.data.errors[0];
        expect(error.productId).toBe(PRODUCT_ID_1);
        expect(error.code).toBe('PRODUCT_INACTIVE');
        expect(error.message).toBe('Product is no longer available');
      });

      it('should return mixed valid items and errors correctly', async () => {
        const product2 = { ...mockProduct, id: PRODUCT_ID_2, slug: 'product-2' };
        // PRODUCT_ID_3 not returned — not found
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct, product2]);

        const response = await request(testApp)
          .post('/cart/validate')
          .send({
            items: [
              { productId: PRODUCT_ID_1, quantity: 2, size: 'M' },
              { productId: PRODUCT_ID_2, quantity: 1, size: 'S' },
              { productId: PRODUCT_ID_3, quantity: 1, size: 'L' },
            ],
          });

        expect(response.status).toBe(200);
        expect(response.body.data.valid).toBe(false);
        expect(response.body.data.items).toHaveLength(2);
        expect(response.body.data.errors).toHaveLength(1);
        expect(response.body.data.errors[0].code).toBe('PRODUCT_NOT_FOUND');
        // Summary only from valid items: 2*29.99 + 1*29.99 = 89.97
        expect(response.body.data.summary.itemCount).toBe(3);
        expect(response.body.data.summary.subtotal).toBe(89.97);
      });
    });

    describe('item-level error codes', () => {
      it('should return PRODUCT_INACTIVE when product is soft-deleted', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          { ...mockProduct, deletedAt: new Date().toISOString() },
        ]);

        const response = await request(testApp)
          .post('/cart/validate')
          .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }] });

        expect(response.body.data.errors[0].code).toBe('PRODUCT_INACTIVE');
      });

      it('should return SIZE_REQUIRED when hasSizes=true and no size provided', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);

        const response = await request(testApp)
          .post('/cart/validate')
          .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1 }] });

        expect(response.status).toBe(200);
        expect(response.body.data.errors[0].code).toBe('SIZE_REQUIRED');
      });

      it('should return INVALID_SIZE when size not in availableSizes', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);

        const response = await request(testApp)
          .post('/cart/validate')
          .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'XXL' }] });

        expect(response.status).toBe(200);
        expect(response.body.data.errors[0].code).toBe('INVALID_SIZE');
        expect(response.body.data.errors[0].message).toBe(
          'Selected size is not available for this product'
        );
      });

      it('should return SIZE_NOT_ALLOWED when product has no sizes but size provided', async () => {
        const productNoSizes = {
          ...mockProduct,
          productType: mockProductTypeNoSizes,
          availableSizes: null,
        };
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([productNoSizes]);

        const response = await request(testApp)
          .post('/cart/validate')
          .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }] });

        expect(response.status).toBe(200);
        expect(response.body.data.errors[0].code).toBe('SIZE_NOT_ALLOWED');
      });
    });

    describe('input validation — returns 400', () => {
      it('should return 400 when items is missing', async () => {
        const response = await request(testApp).post('/cart/validate').send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_CART_DATA');
        expect(response.body.error.field).toBe('items');
      });

      it('should return 400 when items is empty array', async () => {
        const response = await request(testApp).post('/cart/validate').send({ items: [] });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_CART_DATA');
      });

      it('should return 400 when productId is not a valid UUID', async () => {
        const response = await request(testApp)
          .post('/cart/validate')
          .send({ items: [{ productId: 'not-a-uuid', quantity: 1 }] });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_CART_DATA');
      });

      it('should return 400 when quantity is less than 1', async () => {
        const response = await request(testApp)
          .post('/cart/validate')
          .send({ items: [{ productId: PRODUCT_ID_1, quantity: 0 }] });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_CART_DATA');
      });

      it('should return 400 when quantity is not an integer', async () => {
        const response = await request(testApp)
          .post('/cart/validate')
          .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1.5 }] });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_CART_DATA');
      });

      it('should return 400 when items array exceeds 50', async () => {
        const items = Array.from({ length: 51 }, () => ({
          productId: PRODUCT_ID_1,
          quantity: 1,
        }));

        const response = await request(testApp).post('/cart/validate').send({ items });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_CART_DATA');
      });

      it('should return 400 when size is empty after trim', async () => {
        const response = await request(testApp)
          .post('/cart/validate')
          .send({ items: [{ productId: PRODUCT_ID_1, quantity: 1, size: '   ' }] });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_CART_DATA');
      });
    });
  });
});
