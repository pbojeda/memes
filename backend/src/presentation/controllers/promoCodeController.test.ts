import { Request, Response, NextFunction } from 'express';
import { validatePromoCode as validatePromoCodeController } from './promoCodeController';
import * as promoCodeService from '../../application/services/promoCodeService';
import { InvalidPromoCodeDataError } from '../../domain/errors/PromoCodeError';
import type { PromoCodeValidationResult } from '../../application/services/promoCodeService';

jest.mock('../../application/services/promoCodeService');

const mockPromoCodeService = promoCodeService as jest.Mocked<typeof promoCodeService>;

const mockValidResult: PromoCodeValidationResult = {
  valid: true,
  code: 'SUMMER20',
  discountType: 'PERCENTAGE',
  discountValue: 20,
  calculatedDiscount: 15.99,
  message: 'Promo code applied',
};

const mockInvalidResult: PromoCodeValidationResult = {
  valid: false,
  code: 'EXPIRED10',
  message: 'Promo code has expired',
};

describe('promoCodeController', () => {
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

  describe('validatePromoCode', () => {
    it('returns 200 with success=true and result when code is valid', async () => {
      mockRequest.body = { code: 'SUMMER20', orderTotal: 79.99 };
      (mockPromoCodeService.validatePromoCode as jest.Mock).mockResolvedValue(mockValidResult);

      await validatePromoCodeController(
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

    it('returns 200 with success=true and valid=false when code is invalid (business rule)', async () => {
      mockRequest.body = { code: 'EXPIRED10' };
      (mockPromoCodeService.validatePromoCode as jest.Mock).mockResolvedValue(mockInvalidResult);

      await validatePromoCodeController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockInvalidResult,
      });
    });

    it('calls promoCodeService.validatePromoCode with req.body', async () => {
      const body = { code: 'SUMMER20', orderTotal: 100 };
      mockRequest.body = body;
      (mockPromoCodeService.validatePromoCode as jest.Mock).mockResolvedValue(mockValidResult);

      await validatePromoCodeController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPromoCodeService.validatePromoCode).toHaveBeenCalledWith(body);
    });

    it('returns 400 when InvalidPromoCodeDataError is thrown (code is INVALID_PROMO_CODE_DATA)', async () => {
      const error = new InvalidPromoCodeDataError('code is required', 'code');
      (mockPromoCodeService.validatePromoCode as jest.Mock).mockRejectedValue(error);

      await validatePromoCodeController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'code is required',
          code: 'INVALID_PROMO_CODE_DATA',
          field: 'code',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 400 with field when InvalidPromoCodeDataError has field', async () => {
      const error = new InvalidPromoCodeDataError('orderTotal must be at least 0', 'orderTotal');
      (mockPromoCodeService.validatePromoCode as jest.Mock).mockRejectedValue(error);

      await validatePromoCodeController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      const responseBody = jsonMock.mock.calls[0][0] as { error: { field: string } };
      expect(responseBody.error.field).toBe('orderTotal');
    });

    it('returns 400 with undefined field when InvalidPromoCodeDataError has no field', async () => {
      const error = new InvalidPromoCodeDataError('invalid input');
      (mockPromoCodeService.validatePromoCode as jest.Mock).mockRejectedValue(error);

      await validatePromoCodeController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      const responseBody = jsonMock.mock.calls[0][0] as { error: { field: unknown } };
      expect(responseBody.error.field).toBeUndefined();
    });

    it('calls next(error) for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (mockPromoCodeService.validatePromoCode as jest.Mock).mockRejectedValue(unexpectedError);

      await validatePromoCodeController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });

    it('does not call statusMock when unexpected error occurs', async () => {
      const unexpectedError = new Error('Database connection failed');
      (mockPromoCodeService.validatePromoCode as jest.Mock).mockRejectedValue(unexpectedError);

      await validatePromoCodeController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});
