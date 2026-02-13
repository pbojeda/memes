import { Request, Response, NextFunction } from 'express';
import { listImages, addImage, updateImage, deleteImage } from './productImageController';
import * as productImageService from '../../application/services/productImageService';
import { ProductImageNotFoundError, InvalidProductImageDataError } from '../../domain/errors/ProductImageError';
import { ProductNotFoundError } from '../../domain/errors/ProductError';

jest.mock('../../application/services/productImageService');

describe('productImageController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('listImages', () => {
    it('should return list of images with 200', async () => {
      const mockImages = [
        {
          id: 'img-1',
          productId: 'prod-123',
          url: 'https://res.cloudinary.com/test/image1.jpg',
          sortOrder: 0,
        },
        {
          id: 'img-2',
          productId: 'prod-123',
          url: 'https://res.cloudinary.com/test/image2.jpg',
          sortOrder: 1,
        },
      ];

      mockReq.params = { productId: 'prod-123' };

      (productImageService.listProductImages as jest.Mock).mockResolvedValue(mockImages);

      await listImages(mockReq as Request, mockRes as Response, mockNext);

      expect(productImageService.listProductImages).toHaveBeenCalledWith('prod-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockImages,
      });
    });

    it('should return empty array if no images', async () => {
      mockReq.params = { productId: 'prod-123' };

      (productImageService.listProductImages as jest.Mock).mockResolvedValue([]);

      await listImages(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });

    it('should return 400 for invalid UUID', async () => {
      mockReq.params = { productId: 'invalid-id' };

      (productImageService.listProductImages as jest.Mock).mockRejectedValue(
        new InvalidProductImageDataError('Invalid ID format', 'productId')
      );

      await listImages(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('addImage', () => {
    it('should add image and return 201', async () => {
      const mockImage = {
        id: 'img-123',
        productId: 'prod-123',
        url: 'https://res.cloudinary.com/test/image.jpg',
        altText: { es: 'Imagen' },
        isPrimary: false,
        sortOrder: 0,
      };

      mockReq.params = { productId: 'prod-123' };
      mockReq.body = {
        url: 'https://res.cloudinary.com/test/image.jpg',
        altText: { es: 'Imagen' },
      };

      (productImageService.addProductImage as jest.Mock).mockResolvedValue(mockImage);

      await addImage(mockReq as Request, mockRes as Response, mockNext);

      expect(productImageService.addProductImage).toHaveBeenCalledWith('prod-123', mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockImage,
      });
    });

    it('should return 404 for product not found', async () => {
      mockReq.params = { productId: 'prod-999' };
      mockReq.body = {
        url: 'https://res.cloudinary.com/test/image.jpg',
      };

      (productImageService.addProductImage as jest.Mock).mockRejectedValue(
        new ProductNotFoundError()
      );

      await addImage(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Product not found',
          code: 'PRODUCT_NOT_FOUND',
        },
      });
    });

    it('should return 400 for invalid input', async () => {
      mockReq.params = { productId: 'prod-123' };
      mockReq.body = {
        url: 'not-a-url',
      };

      (productImageService.addProductImage as jest.Mock).mockRejectedValue(
        new InvalidProductImageDataError('URL must start with http:// or https://', 'url')
      );

      await addImage(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateImage', () => {
    it('should update image and return 200', async () => {
      const mockImage = {
        id: 'img-123',
        productId: 'prod-123',
        url: 'https://res.cloudinary.com/test/image.jpg',
        altText: { es: 'Nuevo texto' },
        isPrimary: true,
        sortOrder: 0,
      };

      mockReq.params = { productId: 'prod-123', imageId: 'img-123' };
      mockReq.body = {
        altText: { es: 'Nuevo texto' },
        isPrimary: true,
      };

      (productImageService.updateProductImage as jest.Mock).mockResolvedValue(mockImage);

      await updateImage(mockReq as Request, mockRes as Response, mockNext);

      expect(productImageService.updateProductImage).toHaveBeenCalledWith(
        'prod-123',
        'img-123',
        mockReq.body
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockImage,
      });
    });

    it('should return 404 for image not found', async () => {
      mockReq.params = { productId: 'prod-123', imageId: 'img-999' };
      mockReq.body = {
        altText: { es: 'Nuevo texto' },
      };

      (productImageService.updateProductImage as jest.Mock).mockRejectedValue(
        new ProductImageNotFoundError()
      );

      await updateImage(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Product image not found',
          code: 'PRODUCT_IMAGE_NOT_FOUND',
        },
      });
    });
  });

  describe('deleteImage', () => {
    it('should delete image and return 204', async () => {
      mockReq.params = { productId: 'prod-123', imageId: 'img-123' };

      (productImageService.deleteProductImage as jest.Mock).mockResolvedValue(undefined);

      await deleteImage(mockReq as Request, mockRes as Response, mockNext);

      expect(productImageService.deleteProductImage).toHaveBeenCalledWith('prod-123', 'img-123');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should return 404 for image not found', async () => {
      mockReq.params = { productId: 'prod-123', imageId: 'img-999' };

      (productImageService.deleteProductImage as jest.Mock).mockRejectedValue(
        new ProductImageNotFoundError()
      );

      await deleteImage(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});
