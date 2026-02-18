import { listProducts } from '../productService';
import prisma from '../../../lib/prisma';
import { InvalidProductDataError } from '../../../domain/errors/ProductError';
import type { Product } from '../../../generated/prisma/client';
import { Prisma } from '../../../generated/prisma/client';

jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('productService - listProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockProducts: Product[] = [
    {
      id: 'prod-1',
      title: { es: 'Camiseta 1' },
      description: { es: 'Descripción 1' },
      slug: 'camiseta-1',
      price: new Prisma.Decimal(29.99),
      compareAtPrice: null,
      availableSizes: ['S', 'M', 'L'],
      productTypeId: '123e4567-e89b-12d3-a456-426614174000',
      color: 'Rojo',
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
      createdAt: new Date('2026-02-10'),
      updatedAt: new Date('2026-02-10'),
    },
    {
      id: 'prod-2',
      title: { es: 'Camiseta 2', en: 'T-Shirt 2' },
      description: { es: 'Descripción 2' },
      slug: 'camiseta-2',
      price: new Prisma.Decimal(39.99),
      compareAtPrice: new Prisma.Decimal(49.99),
      availableSizes: null,
      productTypeId: '456e4567-e89b-12d3-a456-426614174001',
      color: 'Azul',
      isActive: true,
      isHot: true,
      printfulProductId: null,
      printfulSyncVariantId: null,
      memeSourceUrl: null,
      memeIsOriginal: false,
      salesCount: 25,
      viewCount: 200,
      createdByUserId: null,
      deletedAt: null,
      createdAt: new Date('2026-02-11'),
      updatedAt: new Date('2026-02-11'),
    },
  ];

  const expectedInclude = {
    images: { where: { isPrimary: true }, take: 1 },
    productType: true,
  };

  describe('pagination', () => {
    it('should return first page with default limit (20)', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(2);

      const result = await listProducts({});

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
      expect(mockPrisma.product.count).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
      expect(result.data).toEqual(mockProducts);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should return correct skip and take for page 2', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(42);

      const result = await listProducts({ page: 2, limit: 20 });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 20,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should return correct skip and take for page 3 with limit 10', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(50);

      await listProducts({ page: 3, limit: 10 });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 20,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
    });

    it('should handle limit of 1', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProducts[0]]);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(100);

      const result = await listProducts({ limit: 1 });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
      expect(result.pagination.limit).toBe(1);
      expect(result.pagination.totalPages).toBe(100);
    });

    it('should handle limit of 100', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(200);

      const result = await listProducts({ limit: 100 });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
      expect(result.pagination.limit).toBe(100);
      expect(result.pagination.totalPages).toBe(2);
    });

    it('should handle page beyond total results', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(10);

      const result = await listProducts({ page: 100 });

      expect(result.data).toEqual([]);
      expect(result.pagination.page).toBe(100);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });
  });

  describe('filtering', () => {
    it('should filter by productTypeId', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProducts[0]]);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(1);

      await listProducts({ productTypeId: '123e4567-e89b-12d3-a456-426614174000' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
      expect(mockPrisma.product.count).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
        },
      });
    });

    it('should filter by isActive true', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(2);

      await listProducts({ isActive: true });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          isActive: true,
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
    });

    it('should filter by isActive false', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(0);

      await listProducts({ isActive: false });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          isActive: false,
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
    });

    it('should filter by isHot true', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProducts[1]]);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(1);

      await listProducts({ isHot: true });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          isHot: true,
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
    });

    it('should filter by isHot false', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProducts[0]]);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(1);

      await listProducts({ isHot: false });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          isHot: false,
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
    });

    it('should filter by minPrice', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProducts[1]]);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(1);

      await listProducts({ minPrice: 35.00 });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          price: { gte: 35.00 },
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
    });

    it('should filter by maxPrice', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProducts[0]]);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(1);

      await listProducts({ maxPrice: 30.00 });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          price: { lte: 30.00 },
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
    });

    it('should filter by price range (minPrice and maxPrice)', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(2);

      await listProducts({ minPrice: 20.00, maxPrice: 50.00 });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          price: { gte: 20.00, lte: 50.00 },
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
    });

    it('should filter by search text (Spanish)', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProducts[0]]);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(1);

      await listProducts({ search: 'camiseta' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          OR: [
            { title: { path: ['es'], string_contains: 'camiseta', mode: 'insensitive' } },
            { title: { path: ['en'], string_contains: 'camiseta', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
    });

    it('should filter by search text (English)', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProducts[1]]);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(1);

      await listProducts({ search: 'shirt' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          OR: [
            { title: { path: ['es'], string_contains: 'shirt', mode: 'insensitive' } },
            { title: { path: ['en'], string_contains: 'shirt', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
    });

    it('should combine multiple filters', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProducts[1]]);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(1);

      await listProducts({
        productTypeId: '456e4567-e89b-12d3-a456-426614174001',
        isActive: true,
        isHot: true,
        minPrice: 30.00,
        maxPrice: 50.00,
        search: 'camiseta',
      });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          productTypeId: '456e4567-e89b-12d3-a456-426614174001',
          isActive: true,
          isHot: true,
          price: { gte: 30.00, lte: 50.00 },
          OR: [
            { title: { path: ['es'], string_contains: 'camiseta', mode: 'insensitive' } },
            { title: { path: ['en'], string_contains: 'camiseta', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
    });
  });

  describe('sorting', () => {
    it('should sort by price ascending', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(2);

      await listProducts({ sortBy: 'price', sortDirection: 'asc' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 20,
        orderBy: { price: 'asc' },
        include: expectedInclude,
      });
    });

    it('should sort by price descending', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(2);

      await listProducts({ sortBy: 'price', sortDirection: 'desc' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 20,
        orderBy: { price: 'desc' },
        include: expectedInclude,
      });
    });

    it('should sort by createdAt ascending', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(2);

      await listProducts({ sortBy: 'createdAt', sortDirection: 'asc' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'asc' },
        include: expectedInclude,
      });
    });

    it('should sort by createdAt descending (default)', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(2);

      await listProducts({ sortBy: 'createdAt', sortDirection: 'desc' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
    });

    it('should sort by salesCount ascending', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(2);

      await listProducts({ sortBy: 'salesCount', sortDirection: 'asc' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 20,
        orderBy: { salesCount: 'asc' },
        include: expectedInclude,
      });
    });

    it('should sort by salesCount descending', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(2);

      await listProducts({ sortBy: 'salesCount', sortDirection: 'desc' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 20,
        orderBy: { salesCount: 'desc' },
        include: expectedInclude,
      });
    });
  });

  describe('soft-delete exclusion', () => {
    it('should exclude soft-deleted products by default', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(2);

      await listProducts({});

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
      expect(mockPrisma.product.count).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
    });

    it('should include soft-deleted products when includeSoftDeleted is true', async () => {
      const mockWithDeleted = [
        ...mockProducts,
        {
          ...mockProducts[0],
          id: 'prod-deleted',
          deletedAt: new Date('2026-02-12'),
        },
      ];

      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockWithDeleted);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(3);

      await listProducts({ includeSoftDeleted: true });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
      expect(mockPrisma.product.count).toHaveBeenCalledWith({
        where: {},
      });
    });

    it('should not include deletedAt filter when includeSoftDeleted is true with other filters', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(2);

      await listProducts({
        includeSoftDeleted: true,
        isActive: true,
        productTypeId: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expectedInclude,
      });
    });
  });

  describe('empty results', () => {
    it('should return empty array when no products match', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(0);

      const result = await listProducts({ isHot: true });

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should handle totalPages correctly when total is 0', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(0);

      const result = await listProducts({});

      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('pagination metadata accuracy', () => {
    it('should calculate totalPages correctly', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(45);

      const result = await listProducts({ limit: 10 });

      expect(result.pagination.totalPages).toBe(5);
    });

    it('should set hasNext true when on first page of many', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(100);

      const result = await listProducts({ page: 1, limit: 20 });

      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should set hasPrev true when on last page', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(100);

      const result = await listProducts({ page: 5, limit: 20 });

      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should set both hasNext and hasPrev true when on middle page', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(100);

      const result = await listProducts({ page: 3, limit: 20 });

      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should set both hasNext and hasPrev false when only one page', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(2);

      const result = await listProducts({ limit: 20 });

      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(false);
    });
  });

  describe('validation errors', () => {
    it('should throw InvalidProductDataError when productTypeId is invalid', async () => {
      await expect(listProducts({ productTypeId: 'invalid-uuid' })).rejects.toThrow(
        InvalidProductDataError
      );
      expect(mockPrisma.product.findMany).not.toHaveBeenCalled();
    });

    it('should throw InvalidProductDataError when page is less than 1', async () => {
      await expect(listProducts({ page: 0 })).rejects.toThrow(InvalidProductDataError);
      expect(mockPrisma.product.findMany).not.toHaveBeenCalled();
    });

    it('should throw InvalidProductDataError when limit exceeds 100', async () => {
      await expect(listProducts({ limit: 101 })).rejects.toThrow(InvalidProductDataError);
      expect(mockPrisma.product.findMany).not.toHaveBeenCalled();
    });

    it('should throw InvalidProductDataError when sortBy is invalid', async () => {
      await expect(listProducts({ sortBy: 'title' as never })).rejects.toThrow(
        InvalidProductDataError
      );
      expect(mockPrisma.product.findMany).not.toHaveBeenCalled();
    });
  });

  describe('primaryImage mapping', () => {
    it('should map primary image to primaryImage field', async () => {
      const mockImage = {
        id: 'img-1',
        productId: 'prod-1',
        url: 'https://example.com/image.jpg',
        altText: null,
        isPrimary: true,
        sortOrder: 0,
        cloudinaryPublicId: null,
        createdAt: new Date('2026-02-10'),
        updatedAt: new Date('2026-02-10'),
      };

      const prismaProduct = { ...mockProducts[0], images: [mockImage] };
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([prismaProduct]);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(1);

      const result = await listProducts({});

      expect(result.data[0]).toMatchObject({ primaryImage: mockImage });
      expect((result.data[0] as unknown as Record<string, unknown>).images).toBeUndefined();
    });

    it('should set primaryImage to undefined when no primary image', async () => {
      const prismaProduct = { ...mockProducts[0], images: [] };
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([prismaProduct]);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(1);

      const result = await listProducts({});

      expect((result.data[0] as unknown as Record<string, unknown>).primaryImage).toBeUndefined();
      expect((result.data[0] as unknown as Record<string, unknown>).images).toBeUndefined();
    });
  });
});
