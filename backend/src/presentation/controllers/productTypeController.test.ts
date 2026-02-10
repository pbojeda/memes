import { Request, Response, NextFunction } from 'express';
import {
  listProductTypes,
  createProductType,
  updateProductType,
  deleteProductType,
} from './productTypeController';
import * as productTypeService from '../../application/services/productTypeService';
import {
  InvalidProductTypeDataError,
  ProductTypeNotFoundError,
  ProductTypeSlugAlreadyExistsError,
} from '../../domain/errors/ProductTypeError';
import { UserRole } from '../../generated/prisma/enums';
import type { ProductType } from '../../generated/prisma/client';

jest.mock('../../application/services/productTypeService');

describe('productTypeController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

  const mockProductType: ProductType = {
    id: 'pt-uuid-123',
    name: 'T-Shirt',
    slug: 't-shirt',
    hasSizes: true,
    isActive: true,
    sortOrder: 1,
    createdAt: new Date('2026-02-10'),
    updatedAt: new Date('2026-02-10'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    sendMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock, send: sendMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
  });

  describe('listProductTypes', () => {
    beforeEach(() => {
      mockRequest = {
        query: {},
      };
    });

    it('should return 200 with product types for unauthenticated request', async () => {
      mockRequest.query = {};
      (productTypeService.getAllProductTypes as jest.Mock).mockResolvedValue([mockProductType]);

      await listProductTypes(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productTypeService.getAllProductTypes).toHaveBeenCalledWith({
        callerRole: 'PUBLIC',
        isActive: undefined,
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: [mockProductType],
      });
    });

    it('should pass callerRole from req.user.role for authenticated request', async () => {
      mockRequest.user = { userId: 'user-123', email: 'admin@example.com', role: UserRole.ADMIN };
      mockRequest.query = {};
      (productTypeService.getAllProductTypes as jest.Mock).mockResolvedValue([mockProductType]);

      await listProductTypes(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productTypeService.getAllProductTypes).toHaveBeenCalledWith({
        callerRole: UserRole.ADMIN,
        isActive: undefined,
      });
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should parse isActive query param as boolean true', async () => {
      mockRequest.query = { isActive: 'true' };
      (productTypeService.getAllProductTypes as jest.Mock).mockResolvedValue([mockProductType]);

      await listProductTypes(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productTypeService.getAllProductTypes).toHaveBeenCalledWith({
        callerRole: 'PUBLIC',
        isActive: true,
      });
    });

    it('should parse isActive query param as boolean false', async () => {
      mockRequest.query = { isActive: 'false' };
      (productTypeService.getAllProductTypes as jest.Mock).mockResolvedValue([]);

      await listProductTypes(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productTypeService.getAllProductTypes).toHaveBeenCalledWith({
        callerRole: 'PUBLIC',
        isActive: false,
      });
    });

    it('should not pass isActive when query param is not present', async () => {
      mockRequest.query = {};
      (productTypeService.getAllProductTypes as jest.Mock).mockResolvedValue([mockProductType]);

      await listProductTypes(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productTypeService.getAllProductTypes).toHaveBeenCalledWith({
        callerRole: 'PUBLIC',
        isActive: undefined,
      });
    });

    it('should call next(error) for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (productTypeService.getAllProductTypes as jest.Mock).mockRejectedValue(unexpectedError);

      await listProductTypes(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe('createProductType', () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          name: 'T-Shirt',
          slug: 't-shirt',
          hasSizes: true,
          isActive: true,
          sortOrder: 1,
        },
      };
    });

    it('should return 201 with created product type', async () => {
      (productTypeService.createProductType as jest.Mock).mockResolvedValue(mockProductType);

      await createProductType(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productTypeService.createProductType).toHaveBeenCalledWith(mockRequest.body);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockProductType,
      });
    });

    it('should return 400 when InvalidProductTypeDataError is thrown', async () => {
      const error = new InvalidProductTypeDataError('Name is required', 'name');
      (productTypeService.createProductType as jest.Mock).mockRejectedValue(error);

      await createProductType(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Name is required',
          code: 'INVALID_PRODUCT_TYPE_DATA',
          field: 'name',
        },
      });
    });

    it('should return 409 when ProductTypeSlugAlreadyExistsError is thrown', async () => {
      const error = new ProductTypeSlugAlreadyExistsError();
      (productTypeService.createProductType as jest.Mock).mockRejectedValue(error);

      await createProductType(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'A product type with this slug already exists',
          code: 'PRODUCT_TYPE_SLUG_ALREADY_EXISTS',
        },
      });
    });

    it('should call next(error) for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (productTypeService.createProductType as jest.Mock).mockRejectedValue(unexpectedError);

      await createProductType(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe('updateProductType', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: 'pt-uuid-123' },
        body: {
          name: 'Updated T-Shirt',
        },
      };
    });

    it('should return 200 with updated product type', async () => {
      const updatedProductType = { ...mockProductType, name: 'Updated T-Shirt' };
      (productTypeService.updateProductType as jest.Mock).mockResolvedValue(updatedProductType);

      await updateProductType(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productTypeService.updateProductType).toHaveBeenCalledWith('pt-uuid-123', mockRequest.body);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: updatedProductType,
      });
    });

    it('should return 400 when InvalidProductTypeDataError is thrown', async () => {
      const error = new InvalidProductTypeDataError('Name must be at least 2 characters', 'name');
      (productTypeService.updateProductType as jest.Mock).mockRejectedValue(error);

      await updateProductType(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Name must be at least 2 characters',
          code: 'INVALID_PRODUCT_TYPE_DATA',
          field: 'name',
        },
      });
    });

    it('should return 404 when ProductTypeNotFoundError is thrown', async () => {
      const error = new ProductTypeNotFoundError();
      (productTypeService.updateProductType as jest.Mock).mockRejectedValue(error);

      await updateProductType(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Product type not found',
          code: 'PRODUCT_TYPE_NOT_FOUND',
        },
      });
    });

    it('should return 409 when ProductTypeSlugAlreadyExistsError is thrown', async () => {
      const error = new ProductTypeSlugAlreadyExistsError();
      (productTypeService.updateProductType as jest.Mock).mockRejectedValue(error);

      await updateProductType(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'A product type with this slug already exists',
          code: 'PRODUCT_TYPE_SLUG_ALREADY_EXISTS',
        },
      });
    });

    it('should call next(error) for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (productTypeService.updateProductType as jest.Mock).mockRejectedValue(unexpectedError);

      await updateProductType(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe('deleteProductType', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: 'pt-uuid-123' },
      };
    });

    it('should return 204 with no content', async () => {
      (productTypeService.deleteProductType as jest.Mock).mockResolvedValue(undefined);

      await deleteProductType(mockRequest as Request, mockResponse as Response, mockNext);

      expect(productTypeService.deleteProductType).toHaveBeenCalledWith('pt-uuid-123');
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it('should return 400 when InvalidProductTypeDataError is thrown', async () => {
      const error = new InvalidProductTypeDataError('Invalid product type ID', 'id');
      (productTypeService.deleteProductType as jest.Mock).mockRejectedValue(error);

      await deleteProductType(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid product type ID',
          code: 'INVALID_PRODUCT_TYPE_DATA',
          field: 'id',
        },
      });
    });

    it('should return 404 when ProductTypeNotFoundError is thrown', async () => {
      const error = new ProductTypeNotFoundError();
      (productTypeService.deleteProductType as jest.Mock).mockRejectedValue(error);

      await deleteProductType(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Product type not found',
          code: 'PRODUCT_TYPE_NOT_FOUND',
        },
      });
    });

    it('should call next(error) for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (productTypeService.deleteProductType as jest.Mock).mockRejectedValue(unexpectedError);

      await deleteProductType(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });
});
