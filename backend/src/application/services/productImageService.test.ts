import {
  listProductImages,
  addProductImage,
  updateProductImage,
  deleteProductImage,
} from './productImageService';
import prisma from '../../lib/prisma';
import { ProductImageNotFoundError } from '../../domain/errors/ProductImageError';
import { ProductNotFoundError } from '../../domain/errors/ProductError';
import { CloudinaryAdapter } from '../../infrastructure/storage/CloudinaryAdapter';
import type { ProductImage } from '../../generated/prisma/client';

// Mock prisma
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    productImage: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock CloudinaryAdapter
jest.mock('../../infrastructure/storage/CloudinaryAdapter');

// Mock getProductById
jest.mock('./productService', () => ({
  getProductById: jest.fn(),
}));

import { getProductById } from './productService';

describe('productImageService', () => {
  const mockProduct = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    title: { es: 'Producto Test' },
    description: { es: 'Descripción' },
    slug: 'producto-test',
    price: 25.5,
    deletedAt: null,
  };

  const mockImage: ProductImage = {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    url: 'https://res.cloudinary.com/test/image.jpg',
    altText: { es: 'Imagen del producto' },
    isPrimary: false,
    sortOrder: 0,
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listProductImages', () => {
    it('should return sorted images for a product', async () => {
      const images: ProductImage[] = [
        { ...mockImage, id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', sortOrder: 1 },
        { ...mockImage, id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', sortOrder: 0 },
      ];

      (prisma.productImage.findMany as jest.Mock).mockResolvedValue(images);

      const result = await listProductImages('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

      expect(result).toEqual(images);
      expect(prisma.productImage.findMany).toHaveBeenCalledWith({
        where: { productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
    });

    it('should return empty array if no images', async () => {
      (prisma.productImage.findMany as jest.Mock).mockResolvedValue([]);

      const result = await listProductImages('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

      expect(result).toEqual([]);
    });

    it('should throw for invalid UUID', async () => {
      await expect(listProductImages('invalid-id')).rejects.toThrow('Invalid ID format');
    });
  });

  describe('addProductImage', () => {
    it('should add image successfully', async () => {
      (getProductById as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.productImage.create as jest.Mock).mockResolvedValue(mockImage);

      const input = {
        url: 'https://res.cloudinary.com/test/image.jpg',
        altText: { es: 'Imagen del producto' },
        isPrimary: false,
        sortOrder: 0,
      };

      const result = await addProductImage('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', input);

      expect(result).toEqual(mockImage);
      expect(getProductById).toHaveBeenCalledWith('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false);
      expect(prisma.productImage.create).toHaveBeenCalledWith({
        data: {
          productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          url: input.url,
          altText: input.altText,
          isPrimary: input.isPrimary,
          sortOrder: input.sortOrder,
        },
      });
    });

    it('should handle isPrimary=true with transaction', async () => {
      (getProductById as jest.Mock).mockResolvedValue(mockProduct);

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          productImage: {
            updateMany: jest.fn(),
            create: jest.fn().mockResolvedValue(mockImage),
          },
        };
        return callback(tx);
      });

      const input = {
        url: 'https://res.cloudinary.com/test/image.jpg',
        isPrimary: true,
        sortOrder: 0,
      };

      const result = await addProductImage('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', input);

      expect(result).toEqual(mockImage);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw ProductNotFoundError if product does not exist', async () => {
      (getProductById as jest.Mock).mockRejectedValue(new ProductNotFoundError());

      const input = {
        url: 'https://res.cloudinary.com/test/image.jpg',
      };

      await expect(addProductImage('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', input)).rejects.toThrow(ProductNotFoundError);
    });

    it('should throw for invalid URL', async () => {
      const input = {
        url: 'not-a-url',
      };

      await expect(addProductImage('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', input)).rejects.toThrow(
        'URL must start with http:// or https://'
      );
    });
  });

  describe('updateProductImage', () => {
    it('should update image successfully', async () => {
      (prisma.productImage.findFirst as jest.Mock).mockResolvedValue(mockImage);
      (prisma.productImage.update as jest.Mock).mockResolvedValue({
        ...mockImage,
        altText: { es: 'Nuevo texto' },
      });

      const input = {
        altText: { es: 'Nuevo texto' },
      };

      const result = await updateProductImage('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', input);

      expect(result.altText).toEqual({ es: 'Nuevo texto' });
      expect(prisma.productImage.findFirst).toHaveBeenCalledWith({
        where: { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
      });
      expect(prisma.productImage.update).toHaveBeenCalledWith({
        where: { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' },
        data: input,
      });
    });

    it('should handle isPrimary=true with transaction', async () => {
      (prisma.productImage.findFirst as jest.Mock).mockResolvedValue(mockImage);

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          productImage: {
            updateMany: jest.fn(),
            update: jest.fn().mockResolvedValue({ ...mockImage, isPrimary: true }),
          },
        };
        return callback(tx);
      });

      const input = {
        isPrimary: true,
      };

      const result = await updateProductImage('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', input);

      expect(result.isPrimary).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw ProductImageNotFoundError if image does not exist', async () => {
      (prisma.productImage.findFirst as jest.Mock).mockResolvedValue(null);

      const input = {
        altText: { es: 'Nuevo texto' },
      };

      await expect(updateProductImage('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', input)).rejects.toThrow(
        ProductImageNotFoundError
      );
    });

    it('should throw ProductImageNotFoundError if image belongs to different product', async () => {
      (prisma.productImage.findFirst as jest.Mock).mockResolvedValue(null);

      const input = {
        altText: { es: 'Nuevo texto' },
      };

      await expect(updateProductImage('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', input)).rejects.toThrow(
        ProductImageNotFoundError
      );
    });
  });

  describe('deleteProductImage', () => {
    it('should delete image from DB and Cloudinary', async () => {
      const imageWithUrl = {
        ...mockImage,
        url: 'https://res.cloudinary.com/test/image/upload/v123/memestore/products/abc-123.jpg',
      };

      (prisma.productImage.findFirst as jest.Mock).mockResolvedValue(imageWithUrl);
      (prisma.productImage.delete as jest.Mock).mockResolvedValue(imageWithUrl);
      (CloudinaryAdapter.prototype.delete as jest.Mock).mockResolvedValue(undefined);

      await deleteProductImage('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22');

      expect(prisma.productImage.findFirst).toHaveBeenCalledWith({
        where: { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
      });
      expect(prisma.productImage.delete).toHaveBeenCalledWith({
        where: { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' },
      });
      expect(CloudinaryAdapter.prototype.delete).toHaveBeenCalled();
    });

    it('should not throw if Cloudinary delete fails (best-effort)', async () => {
      const imageWithUrl = {
        ...mockImage,
        url: 'https://res.cloudinary.com/test/image/upload/v123/memestore/products/abc-123.jpg',
      };

      (prisma.productImage.findFirst as jest.Mock).mockResolvedValue(imageWithUrl);
      (prisma.productImage.delete as jest.Mock).mockResolvedValue(imageWithUrl);
      (CloudinaryAdapter.prototype.delete as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      // Should not throw - Cloudinary failure is logged but not thrown
      await expect(deleteProductImage('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22')).resolves.not.toThrow();

      expect(prisma.productImage.delete).toHaveBeenCalled();
    });

    it('should throw ProductImageNotFoundError if image does not exist', async () => {
      (prisma.productImage.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(deleteProductImage('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55')).rejects.toThrow(
        ProductImageNotFoundError
      );

      // Should not attempt delete
      expect(prisma.productImage.delete).not.toHaveBeenCalled();
    });
  });
});
