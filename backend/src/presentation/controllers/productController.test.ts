import { Request, Response, NextFunction } from 'express';
import {
  getProductDetail,
  deleteProduct,
  restoreProduct,
  createProduct,
  updateProduct,
  listProducts,
  getProductById,
  activateProduct,
  deactivateProduct,
} from './productController';
import * as productService from '../../application/services/productService';
import {
  InvalidProductDataError,
  ProductNotFoundError,
  ProductSlugAlreadyExistsError,
} from '../../domain/errors/ProductError';
import type { Product, ProductImage, ProductReview } from '../../generated/prisma/client';
import { Prisma } from '../../generated/prisma/client';
import { UserRole } from '../../generated/prisma/enums';

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

    describe('UUID param (admin access)', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';

      beforeEach(() => {
        mockRequest = {
          params: { slug: validUUID },
        };
      });

      it('should return 200 with product when MANAGER accesses by UUID', async () => {
        mockRequest.user = {
          userId: 'user-123',
          email: 'manager@example.com',
          role: UserRole.MANAGER,
        };
        (productService.getProductById as jest.Mock).mockResolvedValue(mockProduct);

        await getProductDetail(mockRequest as Request, mockResponse as Response, mockNext);

        expect(productService.getProductById).toHaveBeenCalledWith(validUUID, true);
        expect(productService.getProductDetailBySlug).not.toHaveBeenCalled();
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          success: true,
          data: mockProduct,
        });
      });

      it('should return 200 with product when ADMIN accesses by UUID', async () => {
        mockRequest.user = {
          userId: 'user-456',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        };
        (productService.getProductById as jest.Mock).mockResolvedValue(mockProduct);

        await getProductDetail(mockRequest as Request, mockResponse as Response, mockNext);

        expect(productService.getProductById).toHaveBeenCalledWith(validUUID, true);
        expect(statusMock).toHaveBeenCalledWith(200);
      });

      it('should return 403 when TARGET user accesses by UUID', async () => {
        mockRequest.user = {
          userId: 'user-789',
          email: 'target@example.com',
          role: UserRole.TARGET,
        };

        await getProductDetail(mockRequest as Request, mockResponse as Response, mockNext);

        expect(productService.getProductById).not.toHaveBeenCalled();
        expect(statusMock).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({
          success: false,
          error: {
            message: 'Insufficient permissions',
            code: 'FORBIDDEN',
          },
        });
      });

      it('should return 403 when unauthenticated user accesses by UUID', async () => {
        mockRequest.user = undefined;

        await getProductDetail(mockRequest as Request, mockResponse as Response, mockNext);

        expect(productService.getProductById).not.toHaveBeenCalled();
        expect(statusMock).toHaveBeenCalledWith(403);
      });

      it('should return 404 when MANAGER accesses non-existent UUID', async () => {
        mockRequest.user = {
          userId: 'user-123',
          email: 'manager@example.com',
          role: UserRole.MANAGER,
        };
        const error = new ProductNotFoundError();
        (productService.getProductById as jest.Mock).mockRejectedValue(error);

        await getProductDetail(mockRequest as Request, mockResponse as Response, mockNext);

        expect(statusMock).toHaveBeenCalledWith(404);
      });
    });
  });

  describe('deleteProduct', () => {
    let sendMock: jest.Mock;

    beforeEach(() => {
      sendMock = jest.fn();
      jsonMock = jest.fn();
      statusMock = jest.fn().mockReturnValue({ send: sendMock, json: jsonMock });
      mockResponse = {
        status: statusMock,
        json: jsonMock,
      };
      mockRequest = {
        params: { id: 'prod-123' },
      };
    });

    it('should return 204 when product is soft-deleted successfully', async () => {
      (productService.softDeleteProduct as jest.Mock).mockResolvedValue(undefined);

      await deleteProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productService.softDeleteProduct).toHaveBeenCalledWith('prod-123');
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it('should return 400 for invalid UUID (InvalidProductDataError)', async () => {
      const error = new InvalidProductDataError('Invalid UUID format', 'id');
      (productService.softDeleteProduct as jest.Mock).mockRejectedValue(error);

      await deleteProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid UUID format',
          code: 'INVALID_PRODUCT_DATA',
          field: 'id',
        },
      });
    });

    it('should return 404 when not found or already deleted (ProductNotFoundError)', async () => {
      const error = new ProductNotFoundError();
      (productService.softDeleteProduct as jest.Mock).mockRejectedValue(error);

      await deleteProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Product not found',
          code: 'PRODUCT_NOT_FOUND',
        },
      });
    });

    it('should call next(error) for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (productService.softDeleteProduct as jest.Mock).mockRejectedValue(unexpectedError);

      await deleteProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe('restoreProduct', () => {
    beforeEach(() => {
      jsonMock = jest.fn();
      statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      mockResponse = {
        status: statusMock,
        json: jsonMock,
      };
      mockRequest = {
        params: { id: 'prod-123' },
      };
    });

    it('should return 200 with restored product data', async () => {
      (productService.restoreProduct as jest.Mock).mockResolvedValue(mockProduct);

      await restoreProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productService.restoreProduct).toHaveBeenCalledWith('prod-123');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockProduct,
      });
    });

    it('should return 400 for invalid UUID (InvalidProductDataError)', async () => {
      const error = new InvalidProductDataError('Invalid UUID format', 'id');
      (productService.restoreProduct as jest.Mock).mockRejectedValue(error);

      await restoreProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid UUID format',
          code: 'INVALID_PRODUCT_DATA',
          field: 'id',
        },
      });
    });

    it('should return 404 when not found or not deleted (ProductNotFoundError)', async () => {
      const error = new ProductNotFoundError();
      (productService.restoreProduct as jest.Mock).mockRejectedValue(error);

      await restoreProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Product not found',
          code: 'PRODUCT_NOT_FOUND',
        },
      });
    });

    it('should call next(error) for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (productService.restoreProduct as jest.Mock).mockRejectedValue(unexpectedError);

      await restoreProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe('createProduct', () => {
    beforeEach(() => {
      jsonMock = jest.fn();
      statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      mockResponse = {
        status: statusMock,
        json: jsonMock,
      };
      mockRequest = {
        params: {},
        body: {
          title: { es: 'Nuevo Producto' },
          description: { es: 'Descripción del producto' },
          slug: 'nuevo-producto',
          price: 29.99,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Azul',
        },
        user: {
          userId: 'user-123',
          email: 'manager@example.com',
          role: UserRole.MANAGER,
        },
      };
    });

    it('should return 201 when product is created successfully', async () => {
      (productService.createProduct as jest.Mock).mockResolvedValue(mockProduct);

      await createProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productService.createProduct).toHaveBeenCalledWith({
        ...mockRequest.body,
        createdByUserId: 'user-123',
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockProduct,
      });
    });

    it('should pass createdByUserId from authenticated user', async () => {
      mockRequest.user = {
        userId: 'admin-456',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };

      (productService.createProduct as jest.Mock).mockResolvedValue(mockProduct);

      await createProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productService.createProduct).toHaveBeenCalledWith({
        ...mockRequest.body,
        createdByUserId: 'admin-456',
      });
    });

    it('should return 400 for invalid input (InvalidProductDataError)', async () => {
      const error = new InvalidProductDataError('Price is required', 'price');
      (productService.createProduct as jest.Mock).mockRejectedValue(error);

      await createProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Price is required',
          code: 'INVALID_PRODUCT_DATA',
          field: 'price',
        },
      });
    });

    it('should return 409 for slug conflict (ProductSlugAlreadyExistsError)', async () => {
      const error = new ProductSlugAlreadyExistsError();
      (productService.createProduct as jest.Mock).mockRejectedValue(error);

      await createProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'A product with this slug already exists',
          code: 'PRODUCT_SLUG_ALREADY_EXISTS',
        },
      });
    });
  });

  describe('updateProduct', () => {
    beforeEach(() => {
      jsonMock = jest.fn();
      statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      mockResponse = {
        status: statusMock,
        json: jsonMock,
      };
      mockRequest = {
        params: { id: 'prod-123' },
        body: {
          title: { es: 'Producto Actualizado' },
          price: 39.99,
        },
        user: {
          userId: 'user-123',
          email: 'manager@example.com',
          role: UserRole.MANAGER,
        },
      };
    });

    it('should return 200 when product is updated successfully', async () => {
      (productService.updateProduct as jest.Mock).mockResolvedValue(mockProduct);

      await updateProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productService.updateProduct).toHaveBeenCalledWith(
        'prod-123',
        { title: { es: 'Producto Actualizado' }, price: 39.99 },
        'user-123',
        undefined
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockProduct,
      });
    });

    it('should pass priceChangeReason when provided', async () => {
      mockRequest.body = {
        price: 49.99,
        priceChangeReason: 'Seasonal discount',
      };

      (productService.updateProduct as jest.Mock).mockResolvedValue(mockProduct);

      await updateProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productService.updateProduct).toHaveBeenCalledWith(
        'prod-123',
        { price: 49.99 },
        'user-123',
        'Seasonal discount'
      );
    });

    it('should return 400 for invalid input (InvalidProductDataError)', async () => {
      const error = new InvalidProductDataError('Price must be greater than 0', 'price');
      (productService.updateProduct as jest.Mock).mockRejectedValue(error);

      await updateProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 404 when product not found (ProductNotFoundError)', async () => {
      const error = new ProductNotFoundError();
      (productService.updateProduct as jest.Mock).mockRejectedValue(error);

      await updateProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should return 409 for slug conflict (ProductSlugAlreadyExistsError)', async () => {
      mockRequest.body = { slug: 'existing-slug' };
      const error = new ProductSlugAlreadyExistsError();
      (productService.updateProduct as jest.Mock).mockRejectedValue(error);

      await updateProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(409);
    });

    it('should call next(error) for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (productService.updateProduct as jest.Mock).mockRejectedValue(unexpectedError);

      await updateProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe('listProducts', () => {
    beforeEach(() => {
      jsonMock = jest.fn();
      statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      mockResponse = {
        status: statusMock,
        json: jsonMock,
      };
      mockRequest = {
        query: {},
        user: undefined,
      };
    });

    it('should return 200 with paginated products', async () => {
      const mockResult = {
        data: [mockProduct],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      (productService.listProducts as jest.Mock).mockResolvedValue(mockResult);

      await listProducts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productService.listProducts).toHaveBeenCalledWith({});
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockResult.data,
        pagination: mockResult.pagination,
      });
    });

    it('should parse query parameters correctly', async () => {
      const mockResult = {
        data: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: true,
        },
      };

      mockRequest.query = {
        page: '2',
        limit: '10',
        search: 'test',
        productTypeId: '123e4567-e89b-12d3-a456-426614174000',
        isActive: 'true',
        isHot: 'false',
        minPrice: '5.50',
        maxPrice: '99.99',
        sortBy: 'price',
        sortDirection: 'asc',
      };

      (productService.listProducts as jest.Mock).mockResolvedValue(mockResult);

      await listProducts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productService.listProducts).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: 'test',
        productTypeId: '123e4567-e89b-12d3-a456-426614174000',
        isActive: true,
        isHot: false,
        minPrice: 5.5,
        maxPrice: 99.99,
        sortBy: 'price',
        sortDirection: 'asc',
      });
    });

    it('should allow includeSoftDeleted for MANAGER role', async () => {
      const mockResult = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockRequest.query = { includeSoftDeleted: 'true' };
      mockRequest.user = {
        userId: 'user-123',
        email: 'manager@example.com',
        role: UserRole.MANAGER,
      };

      (productService.listProducts as jest.Mock).mockResolvedValue(mockResult);

      await listProducts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productService.listProducts).toHaveBeenCalledWith({
        includeSoftDeleted: true,
      });
    });

    it('should allow includeSoftDeleted for ADMIN role', async () => {
      const mockResult = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockRequest.query = { includeSoftDeleted: 'true' };
      mockRequest.user = {
        userId: 'user-123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };

      (productService.listProducts as jest.Mock).mockResolvedValue(mockResult);

      await listProducts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productService.listProducts).toHaveBeenCalledWith({
        includeSoftDeleted: true,
      });
    });

    it('should ignore includeSoftDeleted for non-admin users', async () => {
      const mockResult = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockRequest.query = { includeSoftDeleted: 'true' };
      mockRequest.user = {
        userId: 'user-123',
        email: 'target@example.com',
        role: UserRole.TARGET,
      };

      (productService.listProducts as jest.Mock).mockResolvedValue(mockResult);

      await listProducts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productService.listProducts).toHaveBeenCalledWith({});
    });

    it('should ignore includeSoftDeleted when no user is authenticated', async () => {
      const mockResult = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockRequest.query = { includeSoftDeleted: 'true' };
      mockRequest.user = undefined;

      (productService.listProducts as jest.Mock).mockResolvedValue(mockResult);

      await listProducts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productService.listProducts).toHaveBeenCalledWith({});
    });

    it('should return 400 for invalid query parameters (InvalidProductDataError)', async () => {
      const error = new InvalidProductDataError('Page must be a number', 'page');
      (productService.listProducts as jest.Mock).mockRejectedValue(error);

      await listProducts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should call next(error) for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (productService.listProducts as jest.Mock).mockRejectedValue(unexpectedError);

      await listProducts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe('getProductById', () => {
    beforeEach(() => {
      jsonMock = jest.fn();
      statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      mockResponse = {
        status: statusMock,
        json: jsonMock,
      };
      mockRequest = {
        params: { id: 'prod-123' },
      };
    });

    it('should return 200 with product data', async () => {
      (productService.getProductById as jest.Mock).mockResolvedValue(mockProduct);

      await getProductById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productService.getProductById).toHaveBeenCalledWith('prod-123', true);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockProduct,
      });
    });

    it('should return 404 when product not found (ProductNotFoundError)', async () => {
      const error = new ProductNotFoundError();
      (productService.getProductById as jest.Mock).mockRejectedValue(error);

      await getProductById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should return 400 for invalid UUID (InvalidProductDataError)', async () => {
      const error = new InvalidProductDataError('Invalid UUID format', 'id');
      (productService.getProductById as jest.Mock).mockRejectedValue(error);

      await getProductById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should call next(error) for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (productService.getProductById as jest.Mock).mockRejectedValue(unexpectedError);

      await getProductById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe('activateProduct', () => {
    beforeEach(() => {
      jsonMock = jest.fn();
      statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      mockResponse = {
        status: statusMock,
        json: jsonMock,
      };
      mockRequest = {
        params: { id: 'prod-123' },
        user: {
          userId: 'user-123',
          email: 'manager@example.com',
          role: UserRole.MANAGER,
        },
      };
    });

    it('should return 200 when product is activated successfully', async () => {
      const activatedProduct = { ...mockProduct, isActive: true };
      (productService.updateProduct as jest.Mock).mockResolvedValue(activatedProduct);

      await activateProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productService.updateProduct).toHaveBeenCalledWith(
        'prod-123',
        { isActive: true },
        'user-123'
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: activatedProduct,
      });
    });

    it('should return 404 when product not found (ProductNotFoundError)', async () => {
      const error = new ProductNotFoundError();
      (productService.updateProduct as jest.Mock).mockRejectedValue(error);

      await activateProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should return 400 for invalid UUID (InvalidProductDataError)', async () => {
      const error = new InvalidProductDataError('Invalid UUID format', 'id');
      (productService.updateProduct as jest.Mock).mockRejectedValue(error);

      await activateProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should call next(error) for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (productService.updateProduct as jest.Mock).mockRejectedValue(unexpectedError);

      await activateProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe('deactivateProduct', () => {
    beforeEach(() => {
      jsonMock = jest.fn();
      statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      mockResponse = {
        status: statusMock,
        json: jsonMock,
      };
      mockRequest = {
        params: { id: 'prod-123' },
        user: {
          userId: 'user-123',
          email: 'manager@example.com',
          role: UserRole.MANAGER,
        },
      };
    });

    it('should return 200 when product is deactivated successfully', async () => {
      const deactivatedProduct = { ...mockProduct, isActive: false };
      (productService.updateProduct as jest.Mock).mockResolvedValue(deactivatedProduct);

      await deactivateProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productService.updateProduct).toHaveBeenCalledWith(
        'prod-123',
        { isActive: false },
        'user-123'
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: deactivatedProduct,
      });
    });

    it('should return 404 when product not found (ProductNotFoundError)', async () => {
      const error = new ProductNotFoundError();
      (productService.updateProduct as jest.Mock).mockRejectedValue(error);

      await deactivateProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should return 400 for invalid UUID (InvalidProductDataError)', async () => {
      const error = new InvalidProductDataError('Invalid UUID format', 'id');
      (productService.updateProduct as jest.Mock).mockRejectedValue(error);

      await deactivateProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should call next(error) for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (productService.updateProduct as jest.Mock).mockRejectedValue(unexpectedError);

      await deactivateProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });
});
