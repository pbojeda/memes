import { Request, Response, NextFunction } from 'express';
import { validateCart as validateCartController } from './cartController';
import * as cartService from '../../application/services/cartService';
import { InvalidCartDataError } from '../../domain/errors/CartError';
import type { CartValidationResult } from '../../application/services/cartService';

jest.mock('../../application/services/cartService');

const mockCartService = cartService as jest.Mocked<typeof cartService>;

const PRODUCT_ID_1 = '123e4567-e89b-12d3-a456-426614174000';

const mockValidResult: CartValidationResult = {
  valid: true,
  items: [
    {
      productId: PRODUCT_ID_1,
      quantity: 2,
      size: 'M',
      unitPrice: 29.99,
      subtotal: 59.98,
      product: {
        title: { es: 'Camiseta', en: 'T-Shirt' },
        slug: 'camiseta-test',
        primaryImage: null,
      },
      status: 'valid',
    },
  ],
  summary: { subtotal: 59.98, itemCount: 2 },
  errors: [],
};

describe('cartController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
    mockRequest = { body: {} };
  });

  describe('validateCart', () => {
    it('should return 200 with success=true on valid input with all items valid', async () => {
      mockRequest.body = {
        items: [{ productId: PRODUCT_ID_1, quantity: 2, size: 'M' }],
      };
      (mockCartService.validateCart as jest.Mock).mockResolvedValue(mockValidResult);

      await validateCartController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockValidResult,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 200 even when result has valid=false (item-level errors)', async () => {
      const resultWithErrors: CartValidationResult = {
        valid: false,
        items: [],
        summary: { subtotal: 0, itemCount: 0 },
        errors: [
          { productId: PRODUCT_ID_1, code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
        ],
      };
      (mockCartService.validateCart as jest.Mock).mockResolvedValue(resultWithErrors);

      await validateCartController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: resultWithErrors,
      });
    });

    it('should call cartService.validateCart with req.body', async () => {
      const body = {
        items: [{ productId: PRODUCT_ID_1, quantity: 1, size: 'S' }],
      };
      mockRequest.body = body;
      (mockCartService.validateCart as jest.Mock).mockResolvedValue(mockValidResult);

      await validateCartController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockCartService.validateCart).toHaveBeenCalledWith(body);
    });

    it('should return 400 when InvalidCartDataError is thrown', async () => {
      const cartError = new InvalidCartDataError('items array cannot be empty', 'items');
      (mockCartService.validateCart as jest.Mock).mockRejectedValue(cartError);

      await validateCartController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'items array cannot be empty',
          code: 'INVALID_CART_DATA',
          field: 'items',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 with field=undefined when InvalidCartDataError has no field', async () => {
      const cartError = new InvalidCartDataError('invalid input');
      (mockCartService.validateCart as jest.Mock).mockRejectedValue(cartError);

      await validateCartController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'invalid input',
          code: 'INVALID_CART_DATA',
          field: undefined,
        },
      });
    });

    it('should call next(error) for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (mockCartService.validateCart as jest.Mock).mockRejectedValue(unexpectedError);

      await validateCartController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});
