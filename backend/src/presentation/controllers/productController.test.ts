import { Request, Response, NextFunction } from 'express';
import { getProductDetail } from './productController';
import * as productService from '../../application/services/productService';
import {
  InvalidProductDataError,
  ProductNotFoundError,
} from '../../domain/errors/ProductError';
import type { Product, ProductImage, ProductReview } from '../../generated/prisma/client';
import { Prisma } from '../../generated/prisma/client';

jest.mock('../../application/services/productService');

describe('productController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const mockProductImage: ProductImage = {
    id: 'img-1',
    productId: 'prod-123',
    url: 'https://example.com/image.jpg',
    altText: null,
    sortOrder: 1,
    isPrimary: true,
    createdAt: new Date('2026-02-11'),
  };

  const mockProductReview: ProductReview = {
    id: 'review-1',
    productId: 'prod-123',
    authorName: 'John Doe',
    rating: 5,
    comment: 'Great product!',
    isVisible: true,
    isAiGenerated: false,
    createdAt: new Date('2026-02-11'),
  };

  const mockProduct: Product = {
    id: 'prod-123',
    title: { es: 'Camiseta Test' },
    description: { es: 'Una camiseta de prueba' },
    slug: 'camiseta-test',
    price: new Prisma.Decimal(29.99),
    compareAtPrice: null,
    availableSizes: ['S', 'M', 'L'],
    productTypeId: '123e4567-e89b-12d3-a456-426614174000',
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
  };

  const mockProductWithDetails = {
    ...mockProduct,
    images: [mockProductImage],
    reviews: [mockProductReview],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
  });

  describe('getProductDetail', () => {
    beforeEach(() => {
      mockRequest = {
        params: { slug: 'camiseta-test' },
      };
    });

    it('should return 200 with product detail when found', async () => {
      (productService.getProductDetailBySlug as jest.Mock).mockResolvedValue(mockProductWithDetails);

      await getProductDetail(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productService.getProductDetailBySlug).toHaveBeenCalledWith('camiseta-test');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockProductWithDetails,
      });
    });

    it('should return 404 when ProductNotFoundError thrown', async () => {
      const error = new ProductNotFoundError();
      (productService.getProductDetailBySlug as jest.Mock).mockRejectedValue(error);

      await getProductDetail(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Product not found',
          code: 'PRODUCT_NOT_FOUND',
        },
      });
    });

    it('should return 400 when InvalidProductDataError thrown', async () => {
      const error = new InvalidProductDataError('Invalid slug format', 'slug');
      (productService.getProductDetailBySlug as jest.Mock).mockRejectedValue(error);

      await getProductDetail(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid slug format',
          code: 'INVALID_PRODUCT_DATA',
          field: 'slug',
        },
      });
    });

    it('should call next(error) for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (productService.getProductDetailBySlug as jest.Mock).mockRejectedValue(unexpectedError);

      await getProductDetail(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });
});
