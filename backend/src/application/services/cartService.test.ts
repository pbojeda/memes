import { validateCart } from './cartService';
import prisma from '../../lib/prisma';
import { InvalidCartDataError } from '../../domain/errors/CartError';

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    product: {
      findMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

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

function makeProduct(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
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
    ...overrides,
  };
}

describe('cartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCart', () => {
    describe('all items valid', () => {
      it('should return valid=true with correct items and summary for product with sizes', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          makeProduct(PRODUCT_ID_1),
        ]);

        const result = await validateCart({
          items: [{ productId: PRODUCT_ID_1, quantity: 2, size: 'M' }],
        });

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.items).toHaveLength(1);
        expect(result.items[0].productId).toBe(PRODUCT_ID_1);
        expect(result.items[0].unitPrice).toBe(29.99);
        expect(result.items[0].subtotal).toBe(59.98);
        expect(result.items[0].size).toBe('M');
        expect(result.items[0].status).toBe('valid');
        expect(result.summary.itemCount).toBe(2);
        expect(result.summary.subtotal).toBe(59.98);
      });

      it('should return valid=true for product without sizes', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          makeProduct(PRODUCT_ID_1, {
            productType: mockProductTypeNoSizes,
            availableSizes: null,
          }),
        ]);

        const result = await validateCart({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
        });

        expect(result.valid).toBe(true);
        expect(result.items[0].size).toBeNull();
        expect(result.items[0].status).toBe('valid');
      });

      it('should include product title, slug, and primaryImage in result', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          makeProduct(PRODUCT_ID_1),
        ]);

        const result = await validateCart({
          items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'S' }],
        });

        expect(result.items[0].product.title).toEqual({ es: 'Camiseta Test', en: 'Test T-Shirt' });
        expect(result.items[0].product.slug).toBe('camiseta-test');
        expect(result.items[0].product.primaryImage).toEqual(mockImage);
      });

      it('should set primaryImage to null when product has no primary image', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          makeProduct(PRODUCT_ID_1, { images: [] }),
        ]);

        const result = await validateCart({
          items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'S' }],
        });

        expect(result.items[0].product.primaryImage).toBeNull();
      });

      it('should correctly calculate summary for multiple valid items', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          makeProduct(PRODUCT_ID_1),
          makeProduct(PRODUCT_ID_2, { slug: 'product-2', price: 19.99 }),
        ]);

        const result = await validateCart({
          items: [
            { productId: PRODUCT_ID_1, quantity: 2, size: 'M' },
            { productId: PRODUCT_ID_2, quantity: 1, size: 'S' },
          ],
        });

        expect(result.valid).toBe(true);
        expect(result.items).toHaveLength(2);
        expect(result.summary.itemCount).toBe(3);
        // 2*29.99 + 1*19.99 = 59.98 + 19.99 = 79.97
        expect(result.summary.subtotal).toBe(79.97);
      });
    });

    describe('batch loading', () => {
      it('should call findMany once with all unique productIds', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          makeProduct(PRODUCT_ID_1),
          makeProduct(PRODUCT_ID_2, { slug: 'product-2' }),
        ]);

        await validateCart({
          items: [
            { productId: PRODUCT_ID_1, quantity: 1, size: 'S' },
            { productId: PRODUCT_ID_2, quantity: 2, size: 'M' },
          ],
        });

        expect(mockPrisma.product.findMany).toHaveBeenCalledTimes(1);
        expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
          where: { id: { in: expect.arrayContaining([PRODUCT_ID_1, PRODUCT_ID_2]) } },
          include: {
            productType: true,
            images: { where: { isPrimary: true }, take: 1 },
          },
        });
      });

      it('should handle duplicate productIds in one batch query', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          makeProduct(PRODUCT_ID_1),
        ]);

        await validateCart({
          items: [
            { productId: PRODUCT_ID_1, quantity: 1, size: 'S' },
            { productId: PRODUCT_ID_1, quantity: 1, size: 'M' },
          ],
        });

        expect(mockPrisma.product.findMany).toHaveBeenCalledTimes(1);
        const call = (mockPrisma.product.findMany as jest.Mock).mock.calls[0][0] as {
          where: { id: { in: string[] } };
        };
        expect(call.where.id.in).toHaveLength(1);
        expect(call.where.id.in[0]).toBe(PRODUCT_ID_1);
      });

      it('should correctly handle same product with different sizes', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          makeProduct(PRODUCT_ID_1),
        ]);

        const result = await validateCart({
          items: [
            { productId: PRODUCT_ID_1, quantity: 1, size: 'S' },
            { productId: PRODUCT_ID_1, quantity: 2, size: 'M' },
          ],
        });

        expect(result.valid).toBe(true);
        expect(result.items).toHaveLength(2);
        expect(result.items[0].size).toBe('S');
        expect(result.items[1].size).toBe('M');
        expect(result.summary.itemCount).toBe(3);
      });
    });

    describe('error cases', () => {
      it('should return PRODUCT_NOT_FOUND when product not in database', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);

        const result = await validateCart({
          items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'S' }],
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe('PRODUCT_NOT_FOUND');
        expect(result.errors[0].productId).toBe(PRODUCT_ID_1);
        expect(result.errors[0].message).toBe('Product not found');
        expect(result.items).toHaveLength(0);
      });

      it('should return PRODUCT_INACTIVE when isActive is false', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          makeProduct(PRODUCT_ID_1, { isActive: false }),
        ]);

        const result = await validateCart({
          items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }],
        });

        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('PRODUCT_INACTIVE');
        expect(result.errors[0].productId).toBe(PRODUCT_ID_1);
        expect(result.errors[0].message).toBe('Product is no longer available');
      });

      it('should return PRODUCT_INACTIVE when deletedAt is set', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          makeProduct(PRODUCT_ID_1, { deletedAt: new Date() }),
        ]);

        const result = await validateCart({
          items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }],
        });

        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('PRODUCT_INACTIVE');
      });

      it('should return SIZE_REQUIRED when hasSizes=true but no size provided', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          makeProduct(PRODUCT_ID_1),
        ]);

        const result = await validateCart({
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
        });

        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('SIZE_REQUIRED');
        expect(result.errors[0].productId).toBe(PRODUCT_ID_1);
      });

      it('should return INVALID_SIZE when size not in availableSizes', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          makeProduct(PRODUCT_ID_1),
        ]);

        const result = await validateCart({
          items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'XXL' }],
        });

        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('INVALID_SIZE');
        expect(result.errors[0].message).toBe('Selected size is not available for this product');
        expect(result.errors[0].productId).toBe(PRODUCT_ID_1);
      });

      it('should return INVALID_SIZE when hasSizes=true but availableSizes is null', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          makeProduct(PRODUCT_ID_1, { availableSizes: null }),
        ]);

        const result = await validateCart({
          items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }],
        });

        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('INVALID_SIZE');
      });

      it('should return INVALID_SIZE when hasSizes=true but availableSizes is empty array', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          makeProduct(PRODUCT_ID_1, { availableSizes: [] }),
        ]);

        const result = await validateCart({
          items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }],
        });

        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('INVALID_SIZE');
      });

      it('should return SIZE_NOT_ALLOWED when hasSizes=false but size provided', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          makeProduct(PRODUCT_ID_1, {
            productType: mockProductTypeNoSizes,
            availableSizes: null,
          }),
        ]);

        const result = await validateCart({
          items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'M' }],
        });

        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('SIZE_NOT_ALLOWED');
        expect(result.errors[0].productId).toBe(PRODUCT_ID_1);
      });
    });

    describe('mixed valid and invalid items', () => {
      it('should return valid=false, include valid items, and summary only from valid items', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          makeProduct(PRODUCT_ID_1),
          // PRODUCT_ID_3 not returned — not found
        ]);

        const result = await validateCart({
          items: [
            { productId: PRODUCT_ID_1, quantity: 2, size: 'M' },
            { productId: PRODUCT_ID_3, quantity: 1, size: 'S' },
          ],
        });

        expect(result.valid).toBe(false);
        expect(result.items).toHaveLength(1);
        expect(result.items[0].productId).toBe(PRODUCT_ID_1);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].productId).toBe(PRODUCT_ID_3);
        expect(result.errors[0].code).toBe('PRODUCT_NOT_FOUND');
        // Summary only from valid items: 2 * 29.99 = 59.98
        expect(result.summary.itemCount).toBe(2);
        expect(result.summary.subtotal).toBe(59.98);
      });

      it('should return empty summary when all items are invalid', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);

        const result = await validateCart({
          items: [
            { productId: PRODUCT_ID_1, quantity: 1 },
            { productId: PRODUCT_ID_2, quantity: 2 },
          ],
        });

        expect(result.valid).toBe(false);
        expect(result.items).toHaveLength(0);
        expect(result.errors).toHaveLength(2);
        expect(result.summary.subtotal).toBe(0);
        expect(result.summary.itemCount).toBe(0);
      });
    });

    describe('input validation', () => {
      it('should throw InvalidCartDataError for empty items array', async () => {
        await expect(
          validateCart({ items: [] })
        ).rejects.toThrow(InvalidCartDataError);
      });

      it('should throw InvalidCartDataError for invalid productId', async () => {
        await expect(
          validateCart({
            items: [{ productId: 'not-a-uuid', quantity: 1 }],
          })
        ).rejects.toThrow(InvalidCartDataError);
      });
    });

    describe('subtotal rounding', () => {
      it('should round subtotals to 2 decimal places to avoid floating-point drift', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
          makeProduct(PRODUCT_ID_1, { price: 0.1 }),
          makeProduct(PRODUCT_ID_2, { slug: 'product-2', price: 0.2 }),
        ]);

        const result = await validateCart({
          items: [
            { productId: PRODUCT_ID_1, quantity: 1, size: 'S' },
            { productId: PRODUCT_ID_2, quantity: 1, size: 'S' },
          ],
        });

        // 0.1 + 0.2 would be 0.30000000000000004 without rounding
        expect(result.summary.subtotal).toBe(0.3);
      });
    });
  });
});
