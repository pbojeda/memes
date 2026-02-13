import {
  createProduct,
  getProductById,
  getProductBySlug,
  updateProduct,
  softDeleteProduct,
  restoreProduct,
  getProductDetailBySlug,
} from './productService';
import prisma from '../../lib/prisma';
import {
  ProductNotFoundError,
  ProductSlugAlreadyExistsError,
  InvalidProductDataError,
} from '../../domain/errors/ProductError';
import type { Product } from '../../generated/prisma/client';
import { Prisma } from '../../generated/prisma/client';

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    product: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    priceHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('productService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    const validInput = {
      title: { es: 'Camiseta Premium' },
      description: { es: 'Una camiseta de alta calidad' },
      slug: 'camiseta-premium',
      price: 29.99,
      productTypeId: '123e4567-e89b-12d3-a456-426614174000',
      color: 'Rojo',
    };

    const mockCreatedProduct: Product = {
      id: 'prod-uuid-123',
      title: { es: 'Camiseta Premium' },
      description: { es: 'Una camiseta de alta calidad' },
      slug: 'camiseta-premium',
      price: new Prisma.Decimal(29.99),
      compareAtPrice: null,
      availableSizes: null,
      productTypeId: '123e4567-e89b-12d3-a456-426614174000',
      color: 'Rojo',
      isActive: true,
      isHot: false,
      printfulProductId: null,
      printfulSyncVariantId: null,
      memeSourceUrl: null,
      memeIsOriginal: false,
      salesCount: 0,
      viewCount: 0,
      createdByUserId: null,
      deletedAt: null,
      createdAt: new Date('2026-02-11'),
      updatedAt: new Date('2026-02-11'),
    };

    it('should create product with valid input', async () => {
      (mockPrisma.product.create as jest.Mock).mockResolvedValue(mockCreatedProduct);

      const result = await createProduct(validInput);

      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: {
          title: { es: 'Camiseta Premium' },
          description: { es: 'Una camiseta de alta calidad' },
          slug: 'camiseta-premium',
          price: 29.99,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
          isActive: true,
          isHot: false,
          salesCount: 0,
          viewCount: 0,
          createdByUserId: null,
        },
      });
      expect(result).toEqual(mockCreatedProduct);
    });

    it('should apply default values for optional fields', async () => {
      (mockPrisma.product.create as jest.Mock).mockResolvedValue(mockCreatedProduct);

      await createProduct(validInput);

      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isActive: true,
          isHot: false,
          salesCount: 0,
          viewCount: 0,
        }),
      });
    });

    it('should create product with all optional fields provided', async () => {
      const fullInput = {
        ...validInput,
        compareAtPrice: 39.99,
        availableSizes: ['S', 'M', 'L'],
        isActive: false,
        isHot: true,
      };

      const mockResult = {
        ...mockCreatedProduct,
        compareAtPrice: new Prisma.Decimal(39.99),
        availableSizes: ['S', 'M', 'L'],
        isActive: false,
        isHot: true,
      };

      (mockPrisma.product.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createProduct(fullInput);

      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          compareAtPrice: 39.99,
          availableSizes: ['S', 'M', 'L'],
          isActive: false,
          isHot: true,
        }),
      });
      expect(result).toEqual(mockResult);
    });

    it('should throw ProductSlugAlreadyExistsError when slug unique constraint violated', async () => {
      (mockPrisma.product.create as jest.Mock).mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '6.0.0',
        })
      );

      await expect(createProduct(validInput)).rejects.toThrow(ProductSlugAlreadyExistsError);
    });

    it('should re-throw non-P2002 Prisma errors on create', async () => {
      const dbError = new Prisma.PrismaClientKnownRequestError('Connection failed', {
        code: 'P1001',
        clientVersion: '6.0.0',
      });
      (mockPrisma.product.create as jest.Mock).mockRejectedValue(dbError);

      await expect(createProduct(validInput)).rejects.toThrow(dbError);
    });

    it('should throw InvalidProductDataError when input is invalid', async () => {
      const invalidInput = {
        title: { en: 'Product' },
        slug: 'product',
        price: 10.00,
        productTypeId: '123e4567-e89b-12d3-a456-426614174000',
        color: 'Red',
      };

      await expect(createProduct(invalidInput as never)).rejects.toThrow(InvalidProductDataError);
      expect(mockPrisma.product.create).not.toHaveBeenCalled();
    });
  });

  describe('getProductById', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    const mockProduct: Product = {
      id: validId,
      title: { es: 'Camiseta' },
      description: { es: 'Descripción' },
      slug: 'camiseta',
      price: new Prisma.Decimal(25.00),
      compareAtPrice: null,
      availableSizes: null,
      productTypeId: '456e4567-e89b-12d3-a456-426614174000',
      color: 'Azul',
      isActive: true,
      isHot: false,
      printfulProductId: null,
      printfulSyncVariantId: null,
      memeSourceUrl: null,
      memeIsOriginal: false,
      salesCount: 10,
      viewCount: 100,
      createdByUserId: null,
      deletedAt: null,
      createdAt: new Date('2026-02-11'),
      updatedAt: new Date('2026-02-11'),
    };

    it('should return product when found (non-deleted)', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockProduct);

      const result = await getProductById(validId);

      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: validId, deletedAt: null },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should exclude soft-deleted by default', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(getProductById(validId)).rejects.toThrow(ProductNotFoundError);

      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: validId, deletedAt: null },
      });
    });

    it('should include soft-deleted when flag is true', async () => {
      const mockSoftDeletedProduct = {
        ...mockProduct,
        deletedAt: new Date('2026-02-11T10:00:00Z'),
      };

      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockSoftDeletedProduct);

      const result = await getProductById(validId, true);

      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: validId },
      });
      expect(result).toEqual(mockSoftDeletedProduct);
    });

    it('should throw ProductNotFoundError when not found', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(getProductById(validId)).rejects.toThrow(ProductNotFoundError);
    });

    it('should throw InvalidProductDataError when ID is invalid', async () => {
      await expect(getProductById('invalid-id')).rejects.toThrow(InvalidProductDataError);
      expect(mockPrisma.product.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('getProductBySlug', () => {
    const mockProduct: Product = {
      id: 'prod-123',
      title: { es: 'Producto' },
      description: { es: 'Descripción' },
      slug: 'producto-test',
      price: new Prisma.Decimal(15.00),
      compareAtPrice: null,
      availableSizes: null,
      productTypeId: '456e4567-e89b-12d3-a456-426614174000',
      color: 'Verde',
      isActive: true,
      isHot: false,
      printfulProductId: null,
      printfulSyncVariantId: null,
      memeSourceUrl: null,
      memeIsOriginal: false,
      salesCount: 5,
      viewCount: 50,
      createdByUserId: null,
      deletedAt: null,
      createdAt: new Date('2026-02-11'),
      updatedAt: new Date('2026-02-11'),
    };

    it('should return product when found', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockProduct);

      const result = await getProductBySlug('producto-test');

      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: { slug: 'producto-test', deletedAt: null },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should exclude soft-deleted products', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(getProductBySlug('producto-test')).rejects.toThrow(ProductNotFoundError);

      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: { slug: 'producto-test', deletedAt: null },
      });
    });

    it('should throw ProductNotFoundError when not found', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(getProductBySlug('non-existent')).rejects.toThrow(ProductNotFoundError);
    });

    it('should throw InvalidProductDataError when slug is invalid format', async () => {
      await expect(getProductBySlug('INVALID-SLUG')).rejects.toThrow(InvalidProductDataError);
      expect(mockPrisma.product.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    const mockExistingProduct: Product = {
      id: validId,
      title: { es: 'Camiseta' },
      description: { es: 'Descripción' },
      slug: 'camiseta',
      price: new Prisma.Decimal(25.00),
      compareAtPrice: null,
      availableSizes: null,
      productTypeId: '456e4567-e89b-12d3-a456-426614174000',
      color: 'Azul',
      isActive: true,
      isHot: false,
      printfulProductId: null,
      printfulSyncVariantId: null,
      memeSourceUrl: null,
      memeIsOriginal: false,
      salesCount: 10,
      viewCount: 100,
      createdByUserId: null,
      deletedAt: null,
      createdAt: new Date('2026-02-11'),
      updatedAt: new Date('2026-02-11'),
    };

    it('should update product with valid partial input', async () => {
      const input = {
        title: { es: 'Nueva Camiseta', en: 'New Shirt' },
        isActive: false,
      };

      const mockUpdatedProduct = {
        ...mockExistingProduct,
        title: { es: 'Nueva Camiseta', en: 'New Shirt' },
        isActive: false,
        updatedAt: new Date('2026-02-11T12:00:00Z'),
      };

      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockExistingProduct);
      (mockPrisma.product.update as jest.Mock).mockResolvedValue(mockUpdatedProduct);

      const result = await updateProduct(validId, input);

      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: validId, deletedAt: null },
      });
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: validId },
        data: {
          title: { es: 'Nueva Camiseta', en: 'New Shirt' },
          isActive: false,
        },
      });
      expect(result).toEqual(mockUpdatedProduct);
    });

    it('should update without creating PriceHistory when price unchanged', async () => {
      const input = {
        color: 'Negro',
      };

      const mockUpdatedProduct = {
        ...mockExistingProduct,
        color: 'Negro',
      };

      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockExistingProduct);
      (mockPrisma.product.update as jest.Mock).mockResolvedValue(mockUpdatedProduct);

      const result = await updateProduct(validId, input);

      expect(mockPrisma.product.update).toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedProduct);
    });

    it('should create PriceHistory entry when price changes', async () => {
      const input = {
        price: 35.00,
      };

      const mockUpdatedProduct = {
        ...mockExistingProduct,
        price: new Prisma.Decimal(35.00),
      };

      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockExistingProduct);
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      (mockPrisma.product.update as jest.Mock).mockResolvedValue(mockUpdatedProduct);
      (mockPrisma.priceHistory.create as jest.Mock).mockResolvedValue({
        id: 'history-123',
        productId: validId,
        price: new Prisma.Decimal(35.00),
        changedByUserId: null,
        reason: null,
        createdAt: new Date(),
      });

      const result = await updateProduct(validId, input);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: validId },
        data: { price: 35.00 },
      });
      expect(mockPrisma.priceHistory.create).toHaveBeenCalledWith({
        data: {
          productId: validId,
          price: 35.00,
          changedByUserId: null,
          reason: null,
        },
      });
      expect(result).toEqual(mockUpdatedProduct);
    });

    it('should pass changedByUserId and reason to PriceHistory', async () => {
      const input = {
        price: 40.00,
      };

      const mockUpdatedProduct = {
        ...mockExistingProduct,
        price: new Prisma.Decimal(40.00),
      };

      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockExistingProduct);
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      (mockPrisma.product.update as jest.Mock).mockResolvedValue(mockUpdatedProduct);
      (mockPrisma.priceHistory.create as jest.Mock).mockResolvedValue({
        id: 'history-123',
        productId: validId,
        price: new Prisma.Decimal(40.00),
        changedByUserId: 'user-123',
        reason: 'Promotional pricing',
        createdAt: new Date(),
      });

      const result = await updateProduct(validId, input, 'user-123', 'Promotional pricing');

      expect(mockPrisma.priceHistory.create).toHaveBeenCalledWith({
        data: {
          productId: validId,
          price: 40.00,
          changedByUserId: 'user-123',
          reason: 'Promotional pricing',
        },
      });
      expect(result).toEqual(mockUpdatedProduct);
    });

    it('should throw ProductNotFoundError when product does not exist', async () => {
      const input = { color: 'Rojo' };

      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(updateProduct(validId, input)).rejects.toThrow(ProductNotFoundError);
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });

    it('should not update soft-deleted products', async () => {
      const input = { color: 'Rojo' };

      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(updateProduct(validId, input)).rejects.toThrow(ProductNotFoundError);

      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: validId, deletedAt: null },
      });
    });

    it('should throw ProductSlugAlreadyExistsError when slug unique constraint violated', async () => {
      const input = { slug: 'existing-slug' };

      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockExistingProduct);
      (mockPrisma.product.update as jest.Mock).mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '6.0.0',
        })
      );

      await expect(updateProduct(validId, input)).rejects.toThrow(ProductSlugAlreadyExistsError);
    });

    it('should throw InvalidProductDataError when ID is invalid', async () => {
      const input = { color: 'Rojo' };

      await expect(updateProduct('invalid-id', input)).rejects.toThrow(InvalidProductDataError);
      expect(mockPrisma.product.findFirst).not.toHaveBeenCalled();
    });

    it('should allow empty update', async () => {
      const input = {};

      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockExistingProduct);
      (mockPrisma.product.update as jest.Mock).mockResolvedValue(mockExistingProduct);

      const result = await updateProduct(validId, input);

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: validId },
        data: {},
      });
      expect(result).toEqual(mockExistingProduct);
    });

    it('should throw InvalidProductDataError when compareAtPrice is less than existing price', async () => {
      const input = {
        compareAtPrice: 20.00, // existing price is 25.00
      };

      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockExistingProduct);

      await expect(updateProduct(validId, input)).rejects.toThrow(InvalidProductDataError);
      await expect(updateProduct(validId, input)).rejects.toThrow('Compare at price must be greater than price');
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });

    it('should accept compareAtPrice greater than existing price when price not in update', async () => {
      const input = {
        compareAtPrice: 45.00, // existing price is 25.00
      };

      const mockUpdatedProduct = {
        ...mockExistingProduct,
        compareAtPrice: new Prisma.Decimal(45.00),
      };

      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockExistingProduct);
      (mockPrisma.product.update as jest.Mock).mockResolvedValue(mockUpdatedProduct);

      const result = await updateProduct(validId, input);

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: validId },
        data: { compareAtPrice: 45.00 },
      });
      expect(result).toEqual(mockUpdatedProduct);
    });

    it('should not create PriceHistory when price value is the same as existing', async () => {
      const input = {
        price: 25.00, // same as existing Decimal(25.00)
      };

      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockExistingProduct);
      (mockPrisma.product.update as jest.Mock).mockResolvedValue(mockExistingProduct);

      await updateProduct(validId, input);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockPrisma.product.update).toHaveBeenCalled();
    });
  });

  describe('softDeleteProduct', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    const mockExistingProduct: Product = {
      id: validId,
      title: { es: 'Camiseta' },
      description: { es: 'Descripción' },
      slug: 'camiseta',
      price: new Prisma.Decimal(25.00),
      compareAtPrice: null,
      availableSizes: null,
      productTypeId: '456e4567-e89b-12d3-a456-426614174000',
      color: 'Azul',
      isActive: true,
      isHot: false,
      printfulProductId: null,
      printfulSyncVariantId: null,
      memeSourceUrl: null,
      memeIsOriginal: false,
      salesCount: 10,
      viewCount: 100,
      createdByUserId: null,
      deletedAt: null,
      createdAt: new Date('2026-02-11'),
      updatedAt: new Date('2026-02-11'),
    };

    it('should set deletedAt timestamp', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockExistingProduct);
      (mockPrisma.product.update as jest.Mock).mockResolvedValue({
        ...mockExistingProduct,
        deletedAt: new Date(),
      });

      await softDeleteProduct(validId);

      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: validId, deletedAt: null },
      });
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: validId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw ProductNotFoundError when product does not exist', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(softDeleteProduct(validId)).rejects.toThrow(ProductNotFoundError);
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });

    it('should throw error if already soft-deleted', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(softDeleteProduct(validId)).rejects.toThrow(ProductNotFoundError);
    });

    it('should throw InvalidProductDataError when ID is invalid', async () => {
      await expect(softDeleteProduct('invalid-id')).rejects.toThrow(InvalidProductDataError);
      expect(mockPrisma.product.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('restoreProduct', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    const mockSoftDeletedProduct: Product = {
      id: validId,
      title: { es: 'Camiseta' },
      description: { es: 'Descripción' },
      slug: 'camiseta',
      price: new Prisma.Decimal(25.00),
      compareAtPrice: null,
      availableSizes: null,
      productTypeId: '456e4567-e89b-12d3-a456-426614174000',
      color: 'Azul',
      isActive: true,
      isHot: false,
      printfulProductId: null,
      printfulSyncVariantId: null,
      memeSourceUrl: null,
      memeIsOriginal: false,
      salesCount: 10,
      viewCount: 100,
      createdByUserId: null,
      deletedAt: new Date('2026-02-11T10:00:00Z'),
      createdAt: new Date('2026-02-11'),
      updatedAt: new Date('2026-02-11'),
    };

    it('should clear deletedAt timestamp', async () => {
      const mockRestoredProduct = {
        ...mockSoftDeletedProduct,
        deletedAt: null,
      };

      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockSoftDeletedProduct);
      (mockPrisma.product.update as jest.Mock).mockResolvedValue(mockRestoredProduct);

      const result = await restoreProduct(validId);

      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: validId, deletedAt: { not: null } },
      });
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: validId },
        data: { deletedAt: null },
      });
      expect(result).toEqual(mockRestoredProduct);
    });

    it('should throw ProductNotFoundError when product does not exist', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(restoreProduct(validId)).rejects.toThrow(ProductNotFoundError);
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });

    it('should throw error if product is not deleted', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(restoreProduct(validId)).rejects.toThrow(ProductNotFoundError);

      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: validId, deletedAt: { not: null } },
      });
    });

    it('should throw InvalidProductDataError when ID is invalid', async () => {
      await expect(restoreProduct('invalid-id')).rejects.toThrow(InvalidProductDataError);
      expect(mockPrisma.product.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('getProductDetailBySlug', () => {
    const mockProductImage1 = {
      id: 'img-1',
      productId: 'prod-123',
      url: 'https://example.com/image1.jpg',
      altText: null,
      sortOrder: 1,
      createdAt: new Date('2026-02-11T10:00:00Z'),
      updatedAt: new Date('2026-02-11T10:00:00Z'),
    };

    const mockProductImage2 = {
      id: 'img-2',
      productId: 'prod-123',
      url: 'https://example.com/image2.jpg',
      altText: null,
      sortOrder: 2,
      createdAt: new Date('2026-02-11T09:00:00Z'),
      updatedAt: new Date('2026-02-11T09:00:00Z'),
    };

    const mockVisibleReview1 = {
      id: 'review-1',
      productId: 'prod-123',
      orderId: 'order-123',
      userId: 'user-123',
      rating: 5,
      comment: 'Great product!',
      isVisible: true,
      createdAt: new Date('2026-02-11T12:00:00Z'),
      updatedAt: new Date('2026-02-11T12:00:00Z'),
    };

    const mockVisibleReview2 = {
      id: 'review-2',
      productId: 'prod-123',
      orderId: 'order-124',
      userId: 'user-124',
      rating: 4,
      comment: 'Good quality',
      isVisible: true,
      createdAt: new Date('2026-02-11T11:00:00Z'),
      updatedAt: new Date('2026-02-11T11:00:00Z'),
    };

    const mockProductWithDetails = {
      id: 'prod-123',
      title: { es: 'Producto Test' },
      description: { es: 'Descripción del producto' },
      slug: 'producto-test',
      price: new Prisma.Decimal(29.99),
      compareAtPrice: null,
      availableSizes: ['S', 'M', 'L'],
      productTypeId: '456e4567-e89b-12d3-a456-426614174000',
      color: 'Rojo',
      isActive: true,
      isHot: true,
      printfulProductId: null,
      printfulSyncVariantId: null,
      memeSourceUrl: null,
      memeIsOriginal: false,
      salesCount: 50,
      viewCount: 200,
      createdByUserId: null,
      deletedAt: null,
      createdAt: new Date('2026-02-10'),
      updatedAt: new Date('2026-02-10'),
      images: [mockProductImage1, mockProductImage2],
      reviews: [mockVisibleReview1, mockVisibleReview2],
    };

    it('should return product with images and reviews when found', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockProductWithDetails);
      (mockPrisma.product.update as jest.Mock).mockResolvedValue({});

      const result = await getProductDetailBySlug('producto-test');

      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: { slug: 'producto-test', deletedAt: null },
        include: {
          images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
          reviews: { where: { isVisible: true }, orderBy: { createdAt: 'desc' } },
        },
      });
      expect(result).toEqual(mockProductWithDetails);
    });

    it('should throw ProductNotFoundError when product not found', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(getProductDetailBySlug('non-existent')).rejects.toThrow(ProductNotFoundError);
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });

    it('should exclude soft-deleted products', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(getProductDetailBySlug('deleted-product')).rejects.toThrow(ProductNotFoundError);

      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: { slug: 'deleted-product', deletedAt: null },
        include: {
          images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
          reviews: { where: { isVisible: true }, orderBy: { createdAt: 'desc' } },
        },
      });
    });

    it('should include images sorted by sortOrder ASC, then createdAt ASC', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockProductWithDetails);
      (mockPrisma.product.update as jest.Mock).mockResolvedValue({});

      await getProductDetailBySlug('producto-test');

      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
          }),
        })
      );
    });

    it('should include only visible reviews sorted by createdAt DESC', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockProductWithDetails);
      (mockPrisma.product.update as jest.Mock).mockResolvedValue({});

      await getProductDetailBySlug('producto-test');

      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            reviews: { where: { isVisible: true }, orderBy: { createdAt: 'desc' } },
          }),
        })
      );
    });

    it('should increment viewCount asynchronously', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockProductWithDetails);
      (mockPrisma.product.update as jest.Mock).mockResolvedValue({});

      await getProductDetailBySlug('producto-test');

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-123' },
        data: { viewCount: { increment: 1 } },
      });
    });

    it('should throw InvalidProductDataError for invalid slug', async () => {
      await expect(getProductDetailBySlug('INVALID-SLUG')).rejects.toThrow(InvalidProductDataError);
      expect(mockPrisma.product.findFirst).not.toHaveBeenCalled();
    });
  });
});
