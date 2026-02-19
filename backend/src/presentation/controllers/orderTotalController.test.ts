import { Request, Response, NextFunction } from 'express';
import { calculateOrderTotal as calculateOrderTotalController } from './orderTotalController';
import * as orderTotalService from '../../application/services/orderTotalService';
import { InvalidOrderTotalDataError } from '../../domain/errors/OrderTotalError';
import type { OrderTotalResult } from '../../application/services/orderTotalService';

jest.mock('../../application/services/orderTotalService');

const mockOrderTotalService = orderTotalService as jest.Mocked<typeof orderTotalService>;

const PRODUCT_ID_1 = '123e4567-e89b-12d3-a456-426614174000';

const mockValidResult: OrderTotalResult = {
  valid: true,
  subtotal: 100,
  discountAmount: 0,
  shippingCost: 0,
  taxAmount: 0,
  total: 100,
  currency: 'MXN',
  itemCount: 1,
  validatedItems: [
    {
      productId: PRODUCT_ID_1,
      quantity: 1,
      size: null,
      unitPrice: 100,
      subtotal: 100,
      product: {
        title: { es: 'Producto', en: 'Product' },
        slug: 'producto-test',
        primaryImage: null,
      },
      status: 'valid',
    },
  ],
  appliedPromoCode: null,
  cartErrors: [],
};

describe('orderTotalController', () => {
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

  describe('calculateOrderTotal', () => {
    it('should return 200 with success=true on valid calculation', async () => {
      mockRequest.body = {
        items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
      };
      (mockOrderTotalService.calculateOrderTotal as jest.Mock).mockResolvedValue(mockValidResult);

      await calculateOrderTotalController(
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

    it('should call orderTotalService.calculateOrderTotal with req.body', async () => {
      const body = {
        items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
      };
      mockRequest.body = body;
      (mockOrderTotalService.calculateOrderTotal as jest.Mock).mockResolvedValue(mockValidResult);

      await calculateOrderTotalController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockOrderTotalService.calculateOrderTotal).toHaveBeenCalledWith(body);
    });

    it('should return 200 even when result has valid=false (ADR-010)', async () => {
      const resultWithCartErrors: OrderTotalResult = {
        ...mockValidResult,
        valid: false,
        subtotal: 0,
        total: 0,
        cartErrors: [
          { productId: PRODUCT_ID_1, code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
        ],
        validatedItems: [],
      };
      (mockOrderTotalService.calculateOrderTotal as jest.Mock).mockResolvedValue(resultWithCartErrors);

      await calculateOrderTotalController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: resultWithCartErrors,
      });
    });

    it('should return 200 with appliedPromoCode=null and promoCodeMessage when promo code is invalid', async () => {
      const resultWithPromoError: OrderTotalResult = {
        ...mockValidResult,
        appliedPromoCode: null,
        promoCodeMessage: 'Promo code not found',
      };
      (mockOrderTotalService.calculateOrderTotal as jest.Mock).mockResolvedValue(resultWithPromoError);

      await calculateOrderTotalController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: resultWithPromoError,
      });
    });

    it('should return 400 when InvalidOrderTotalDataError is thrown', async () => {
      const error = new InvalidOrderTotalDataError('items array cannot be empty', 'items');
      (mockOrderTotalService.calculateOrderTotal as jest.Mock).mockRejectedValue(error);

      await calculateOrderTotalController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'items array cannot be empty',
          code: 'INVALID_ORDER_TOTAL_DATA',
          field: 'items',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 with field=undefined when InvalidOrderTotalDataError has no field', async () => {
      const error = new InvalidOrderTotalDataError('invalid input');
      (mockOrderTotalService.calculateOrderTotal as jest.Mock).mockRejectedValue(error);

      await calculateOrderTotalController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      const responseBody = jsonMock.mock.calls[0][0];
      expect(responseBody.success).toBe(false);
      expect(responseBody.error.message).toBe('invalid input');
      expect(responseBody.error.code).toBe('INVALID_ORDER_TOTAL_DATA');
      expect(responseBody.error.field).toBeUndefined();
    });

    it('should call next(error) for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (mockOrderTotalService.calculateOrderTotal as jest.Mock).mockRejectedValue(unexpectedError);

      await calculateOrderTotalController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});
