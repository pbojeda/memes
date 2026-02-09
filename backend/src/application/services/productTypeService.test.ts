import {
  createProductType,
  getProductTypeById,
  getAllProductTypes,
  updateProductType,
  deleteProductType,
} from './productTypeService';
import prisma from '../../lib/prisma';
import {
  ProductTypeNotFoundError,
  ProductTypeSlugAlreadyExistsError,
  InvalidProductTypeDataError,
} from '../../domain/errors/ProductTypeError';
import { UserRole } from '../../generated/prisma/enums';
import type { ProductType } from '../../generated/prisma/client';

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    productType: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('productTypeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProductType', () => {
    const validInput = {
      name: { es: 'Camiseta', en: 'T-Shirt' },
      slug: 't-shirt',
    };

    const mockCreatedProductType: ProductType = {
      id: 'uuid-123',
      name: { es: 'Camiseta', en: 'T-Shirt' },
      slug: 't-shirt',
      hasSizes: false,
      isActive: true,
      sortOrder: 0,
      createdAt: new Date('2026-02-09'),
      updatedAt: new Date('2026-02-09'),
    };

    it('should create product type with valid input', async () => {
      (mockPrisma.productType.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.productType.create as jest.Mock).mockResolvedValue(mockCreatedProductType);

      const result = await createProductType(validInput);

      expect(mockPrisma.productType.findUnique).toHaveBeenCalledWith({
        where: { slug: 't-shirt' },
      });
      expect(mockPrisma.productType.create).toHaveBeenCalledWith({
        data: {
          name: { es: 'Camiseta', en: 'T-Shirt' },
          slug: 't-shirt',
          hasSizes: false,
          isActive: true,
          sortOrder: 0,
        },
      });
      expect(result).toEqual(mockCreatedProductType);
    });

    it('should apply default values for optional fields', async () => {
      (mockPrisma.productType.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.productType.create as jest.Mock).mockResolvedValue(mockCreatedProductType);

      await createProductType(validInput);

      expect(mockPrisma.productType.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          hasSizes: false,
          isActive: true,
          sortOrder: 0,
        }),
      });
    });

    it('should throw ProductTypeSlugAlreadyExistsError when slug exists', async () => {
      (mockPrisma.productType.findUnique as jest.Mock).mockResolvedValue(mockCreatedProductType);

      await expect(createProductType(validInput)).rejects.toThrow(ProductTypeSlugAlreadyExistsError);
      expect(mockPrisma.productType.create).not.toHaveBeenCalled();
    });

    it('should throw InvalidProductTypeDataError when input is invalid', async () => {
      const invalidInput = {
        name: { en: 'T-Shirt' },
        slug: 't-shirt',
      };

      await expect(createProductType(invalidInput as never)).rejects.toThrow(InvalidProductTypeDataError);
      expect(mockPrisma.productType.findUnique).not.toHaveBeenCalled();
    });

    it('should create product type with all optional fields provided', async () => {
      const fullInput = {
        name: { es: 'Camiseta', en: 'T-Shirt' },
        slug: 't-shirt',
        hasSizes: true,
        isActive: false,
        sortOrder: 10,
      };

      const mockResult = {
        ...mockCreatedProductType,
        hasSizes: true,
        isActive: false,
        sortOrder: 10,
      };

      (mockPrisma.productType.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.productType.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createProductType(fullInput);

      expect(mockPrisma.productType.create).toHaveBeenCalledWith({
        data: {
          name: { es: 'Camiseta', en: 'T-Shirt' },
          slug: 't-shirt',
          hasSizes: true,
          isActive: false,
          sortOrder: 10,
        },
      });
      expect(result.hasSizes).toBe(true);
      expect(result.isActive).toBe(false);
      expect(result.sortOrder).toBe(10);
    });
  });

  describe('getProductTypeById', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    const mockProductType: ProductType = {
      id: validId,
      name: { es: 'Camiseta', en: 'T-Shirt' },
      slug: 't-shirt',
      hasSizes: true,
      isActive: true,
      sortOrder: 0,
      createdAt: new Date('2026-02-09'),
      updatedAt: new Date('2026-02-09'),
    };

    it('should return product type when found', async () => {
      (mockPrisma.productType.findUnique as jest.Mock).mockResolvedValue(mockProductType);

      const result = await getProductTypeById(validId);

      expect(mockPrisma.productType.findUnique).toHaveBeenCalledWith({
        where: { id: validId },
      });
      expect(result).toEqual(mockProductType);
    });

    it('should throw ProductTypeNotFoundError when not found', async () => {
      (mockPrisma.productType.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getProductTypeById(validId)).rejects.toThrow(ProductTypeNotFoundError);
    });

    it('should throw InvalidProductTypeDataError when ID is invalid', async () => {
      await expect(getProductTypeById('invalid-id')).rejects.toThrow(InvalidProductTypeDataError);
      expect(mockPrisma.productType.findUnique).not.toHaveBeenCalled();
    });

    it('should throw InvalidProductTypeDataError when ID is empty', async () => {
      await expect(getProductTypeById('')).rejects.toThrow(InvalidProductTypeDataError);
      expect(mockPrisma.productType.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('getAllProductTypes', () => {
    const mockProductTypes: ProductType[] = [
      {
        id: 'uuid-1',
        name: { es: 'Camiseta', en: 'T-Shirt' },
        slug: 't-shirt',
        hasSizes: true,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date('2026-02-09'),
        updatedAt: new Date('2026-02-09'),
      },
      {
        id: 'uuid-2',
        name: { es: 'Taza', en: 'Mug' },
        slug: 'mug',
        hasSizes: false,
        isActive: true,
        sortOrder: 10,
        createdAt: new Date('2026-02-09'),
        updatedAt: new Date('2026-02-09'),
      },
    ];

    describe('PUBLIC caller', () => {
      it('should return only active product types', async () => {
        (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue(mockProductTypes);

        const result = await getAllProductTypes({ callerRole: 'PUBLIC' });

        expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        });
        expect(result).toEqual(mockProductTypes);
      });

      it('should ignore isActive filter and force true', async () => {
        (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue(mockProductTypes);

        await getAllProductTypes({ callerRole: 'PUBLIC', isActive: false });

        expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        });
      });
    });

    describe('TARGET caller', () => {
      it('should return only active product types', async () => {
        (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue(mockProductTypes);

        const result = await getAllProductTypes({ callerRole: UserRole.TARGET });

        expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        });
        expect(result).toEqual(mockProductTypes);
      });

      it('should ignore isActive filter and force true', async () => {
        (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue(mockProductTypes);

        await getAllProductTypes({ callerRole: UserRole.TARGET, isActive: false });

        expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        });
      });
    });

    describe('ADMIN caller', () => {
      it('should return all product types when no filter provided', async () => {
        (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue(mockProductTypes);

        const result = await getAllProductTypes({ callerRole: UserRole.ADMIN });

        expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
          where: {},
          orderBy: { sortOrder: 'asc' },
        });
        expect(result).toEqual(mockProductTypes);
      });

      it('should respect isActive true filter', async () => {
        (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue(mockProductTypes);

        await getAllProductTypes({ callerRole: UserRole.ADMIN, isActive: true });

        expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        });
      });

      it('should respect isActive false filter', async () => {
        (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue([]);

        await getAllProductTypes({ callerRole: UserRole.ADMIN, isActive: false });

        expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
          where: { isActive: false },
          orderBy: { sortOrder: 'asc' },
        });
      });
    });

    describe('MANAGER caller', () => {
      it('should return all product types when no filter provided', async () => {
        (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue(mockProductTypes);

        await getAllProductTypes({ callerRole: UserRole.MANAGER });

        expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
          where: {},
          orderBy: { sortOrder: 'asc' },
        });
      });

      it('should respect isActive filter', async () => {
        (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue([]);

        await getAllProductTypes({ callerRole: UserRole.MANAGER, isActive: false });

        expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
          where: { isActive: false },
          orderBy: { sortOrder: 'asc' },
        });
      });
    });

    describe('MARKETING caller', () => {
      it('should return all product types when no filter provided', async () => {
        (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue(mockProductTypes);

        await getAllProductTypes({ callerRole: UserRole.MARKETING });

        expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
          where: {},
          orderBy: { sortOrder: 'asc' },
        });
      });

      it('should respect isActive filter', async () => {
        (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue([]);

        await getAllProductTypes({ callerRole: UserRole.MARKETING, isActive: false });

        expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
          where: { isActive: false },
          orderBy: { sortOrder: 'asc' },
        });
      });
    });

    describe('sorting', () => {
      it('should always order by sortOrder ascending', async () => {
        (mockPrisma.productType.findMany as jest.Mock).mockResolvedValue(mockProductTypes);

        await getAllProductTypes({ callerRole: 'PUBLIC' });

        expect(mockPrisma.productType.findMany).toHaveBeenCalledWith({
          where: expect.any(Object),
          orderBy: { sortOrder: 'asc' },
        });
      });
    });

    describe('validation', () => {
      it('should throw InvalidProductTypeDataError when isActive is not boolean', async () => {
        await expect(
          getAllProductTypes({ callerRole: UserRole.ADMIN, isActive: 'true' as never })
        ).rejects.toThrow(InvalidProductTypeDataError);
        expect(mockPrisma.productType.findMany).not.toHaveBeenCalled();
      });
    });
  });

  describe('updateProductType', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    const mockExistingProductType: ProductType = {
      id: validId,
      name: { es: 'Camiseta', en: 'T-Shirt' },
      slug: 't-shirt',
      hasSizes: true,
      isActive: true,
      sortOrder: 0,
      createdAt: new Date('2026-02-09'),
      updatedAt: new Date('2026-02-09'),
    };

    it('should update product type with valid input', async () => {
      const input = {
        name: { es: 'Nueva Camiseta', en: 'New T-Shirt' },
        isActive: false,
      };

      const mockUpdatedProductType = {
        ...mockExistingProductType,
        name: { es: 'Nueva Camiseta', en: 'New T-Shirt' },
        isActive: false,
        updatedAt: new Date('2026-02-09T12:00:00Z'),
      };

      (mockPrisma.productType.findUnique as jest.Mock).mockResolvedValue(mockExistingProductType);
      (mockPrisma.productType.update as jest.Mock).mockResolvedValue(mockUpdatedProductType);

      const result = await updateProductType(validId, input);

      expect(mockPrisma.productType.findUnique).toHaveBeenCalledWith({
        where: { id: validId },
      });
      expect(mockPrisma.productType.update).toHaveBeenCalledWith({
        where: { id: validId },
        data: {
          name: { es: 'Nueva Camiseta', en: 'New T-Shirt' },
          isActive: false,
        },
      });
      expect(result).toEqual(mockUpdatedProductType);
    });

    it('should allow empty update', async () => {
      const input = {};

      (mockPrisma.productType.findUnique as jest.Mock).mockResolvedValue(mockExistingProductType);
      (mockPrisma.productType.update as jest.Mock).mockResolvedValue(mockExistingProductType);

      const result = await updateProductType(validId, input);

      expect(mockPrisma.productType.update).toHaveBeenCalledWith({
        where: { id: validId },
        data: {},
      });
      expect(result).toEqual(mockExistingProductType);
    });

    it('should throw ProductTypeNotFoundError when not found', async () => {
      const input = { name: { es: 'Nueva' } };

      (mockPrisma.productType.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(updateProductType(validId, input)).rejects.toThrow(ProductTypeNotFoundError);
      expect(mockPrisma.productType.update).not.toHaveBeenCalled();
    });

    it('should throw ProductTypeSlugAlreadyExistsError when slug conflicts', async () => {
      const input = { slug: 'mug' };

      const otherProductType = {
        id: 'other-uuid',
        slug: 'mug',
      };

      (mockPrisma.productType.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockExistingProductType)
        .mockResolvedValueOnce(otherProductType);

      await expect(updateProductType(validId, input)).rejects.toThrow(ProductTypeSlugAlreadyExistsError);
      expect(mockPrisma.productType.update).not.toHaveBeenCalled();
    });

    it('should not check slug uniqueness when slug unchanged', async () => {
      const input = { slug: 't-shirt', name: { es: 'Nueva' } };

      const mockUpdatedProductType = {
        ...mockExistingProductType,
        name: { es: 'Nueva' },
      };

      (mockPrisma.productType.findUnique as jest.Mock).mockResolvedValue(mockExistingProductType);
      (mockPrisma.productType.update as jest.Mock).mockResolvedValue(mockUpdatedProductType);

      await updateProductType(validId, input);

      expect(mockPrisma.productType.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.productType.update).toHaveBeenCalled();
    });

    it('should throw InvalidProductTypeDataError when ID is invalid', async () => {
      const input = { name: { es: 'Nueva' } };

      await expect(updateProductType('invalid-id', input)).rejects.toThrow(InvalidProductTypeDataError);
      expect(mockPrisma.productType.findUnique).not.toHaveBeenCalled();
    });

    it('should throw InvalidProductTypeDataError when input is invalid', async () => {
      const input = { sortOrder: -1 };

      await expect(updateProductType(validId, input)).rejects.toThrow(InvalidProductTypeDataError);
      expect(mockPrisma.productType.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('deleteProductType', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    const mockExistingProductType: ProductType = {
      id: validId,
      name: { es: 'Camiseta', en: 'T-Shirt' },
      slug: 't-shirt',
      hasSizes: true,
      isActive: true,
      sortOrder: 0,
      createdAt: new Date('2026-02-09'),
      updatedAt: new Date('2026-02-09'),
    };

    it('should delete product type when found', async () => {
      (mockPrisma.productType.findUnique as jest.Mock).mockResolvedValue(mockExistingProductType);
      (mockPrisma.productType.delete as jest.Mock).mockResolvedValue(mockExistingProductType);

      await deleteProductType(validId);

      expect(mockPrisma.productType.findUnique).toHaveBeenCalledWith({
        where: { id: validId },
      });
      expect(mockPrisma.productType.delete).toHaveBeenCalledWith({
        where: { id: validId },
      });
    });

    it('should throw ProductTypeNotFoundError when not found', async () => {
      (mockPrisma.productType.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(deleteProductType(validId)).rejects.toThrow(ProductTypeNotFoundError);
      expect(mockPrisma.productType.delete).not.toHaveBeenCalled();
    });

    it('should throw InvalidProductTypeDataError when ID is invalid', async () => {
      await expect(deleteProductType('invalid-id')).rejects.toThrow(InvalidProductTypeDataError);
      expect(mockPrisma.productType.findUnique).not.toHaveBeenCalled();
    });

    it('should throw InvalidProductTypeDataError when ID is empty', async () => {
      await expect(deleteProductType('')).rejects.toThrow(InvalidProductTypeDataError);
      expect(mockPrisma.productType.findUnique).not.toHaveBeenCalled();
    });
  });
});
