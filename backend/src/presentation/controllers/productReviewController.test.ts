import { Request, Response, NextFunction } from 'express';
import {
  listReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleVisibility,
} from './productReviewController';
import * as productReviewService from '../../application/services/productReviewService';
import {
  InvalidProductReviewDataError,
  ProductReviewNotFoundError,
} from '../../domain/errors/ProductReviewError';
import { ProductNotFoundError } from '../../domain/errors/ProductError';

jest.mock('../../application/services/productReviewService');

describe('productReviewController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      query: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('listReviews', () => {
    it('should return paginated reviews with meta (custom JSON format)', async () => {
      const mockResult = {
        data: [
          {
            id: 'rev-1',
            productId: 'prod-123',
            authorName: 'John Doe',
            rating: 5,
            comment: 'Excellent product!',
            isAiGenerated: false,
            isVisible: true,
            createdAt: new Date(),
          },
        ],
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          averageRating: 5.0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
        },
      };

      mockReq.params = { productId: 'prod-123' };
      mockReq.query = { page: '1', limit: '20' };

      (productReviewService.listProductReviews as jest.Mock).mockResolvedValue(mockResult);

      await listReviews(mockReq as Request, mockRes as Response, mockNext);

      expect(productReviewService.listProductReviews).toHaveBeenCalledWith('prod-123', {
        page: 1,
        limit: 20,
      });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.data,
        meta: mockResult.meta,
      });
    });

    it('should use default pagination when query params missing', async () => {
      const mockResult = {
        data: [],
        meta: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      };

      mockReq.params = { productId: 'prod-123' };
      mockReq.query = {};

      (productReviewService.listProductReviews as jest.Mock).mockResolvedValue(mockResult);

      await listReviews(mockReq as Request, mockRes as Response, mockNext);

      expect(productReviewService.listProductReviews).toHaveBeenCalledWith('prod-123', {
        page: 1,
        limit: 20,
      });
    });

    it('should return 400 for invalid productId', async () => {
      mockReq.params = { productId: 'invalid-id' };

      (productReviewService.listProductReviews as jest.Mock).mockRejectedValue(
        new InvalidProductReviewDataError('Invalid ID format', 'productId')
      );

      await listReviews(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid ID format',
          code: 'INVALID_PRODUCT_REVIEW_DATA',
          field: 'productId',
        },
      });
    });
  });

  describe('createReview', () => {
    it('should create review and return 201', async () => {
      const mockReview = {
        id: 'rev-123',
        productId: 'prod-123',
        authorName: 'Jane Smith',
        rating: 4,
        comment: 'Great product!',
        isAiGenerated: false,
        isVisible: true,
        createdAt: new Date(),
      };

      mockReq.params = { productId: 'prod-123' };
      mockReq.body = {
        authorName: 'Jane Smith',
        rating: 4,
        comment: 'Great product!',
      };

      (productReviewService.createReview as jest.Mock).mockResolvedValue(mockReview);

      await createReview(mockReq as Request, mockRes as Response, mockNext);

      expect(productReviewService.createReview).toHaveBeenCalledWith('prod-123', mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockReview,
      });
    });

    it('should return 404 for product not found', async () => {
      mockReq.params = { productId: 'prod-999' };
      mockReq.body = {
        authorName: 'Jane Smith',
        rating: 4,
        comment: 'Great product!',
      };

      (productReviewService.createReview as jest.Mock).mockRejectedValue(
        new ProductNotFoundError()
      );

      await createReview(mockReq as Request, mockRes as Response, mockNext);

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
        authorName: 'J',
        rating: 10,
        comment: 'Short',
      };

      (productReviewService.createReview as jest.Mock).mockRejectedValue(
        new InvalidProductReviewDataError('Rating must be between 1 and 5', 'rating')
      );

      await createReview(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateReview', () => {
    it('should update review and return 200', async () => {
      const mockReview = {
        id: 'rev-123',
        productId: 'prod-123',
        authorName: 'Updated Name',
        rating: 3,
        comment: 'Updated comment',
        isAiGenerated: false,
        isVisible: true,
        createdAt: new Date(),
      };

      mockReq.params = { reviewId: 'rev-123' };
      mockReq.body = {
        authorName: 'Updated Name',
        rating: 3,
      };

      (productReviewService.updateReview as jest.Mock).mockResolvedValue(mockReview);

      await updateReview(mockReq as Request, mockRes as Response, mockNext);

      expect(productReviewService.updateReview).toHaveBeenCalledWith('rev-123', mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockReview,
      });
    });

    it('should return 404 for review not found', async () => {
      mockReq.params = { reviewId: 'rev-999' };
      mockReq.body = {
        comment: 'Updated comment',
      };

      (productReviewService.updateReview as jest.Mock).mockRejectedValue(
        new ProductReviewNotFoundError()
      );

      await updateReview(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Product review not found',
          code: 'PRODUCT_REVIEW_NOT_FOUND',
        },
      });
    });

    it('should return 400 for invalid input', async () => {
      mockReq.params = { reviewId: 'rev-123' };
      mockReq.body = {
        rating: 10,
      };

      (productReviewService.updateReview as jest.Mock).mockRejectedValue(
        new InvalidProductReviewDataError('Rating must be between 1 and 5', 'rating')
      );

      await updateReview(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteReview', () => {
    it('should delete review and return 204', async () => {
      mockReq.params = { reviewId: 'rev-123' };

      (productReviewService.deleteReview as jest.Mock).mockResolvedValue(undefined);

      await deleteReview(mockReq as Request, mockRes as Response, mockNext);

      expect(productReviewService.deleteReview).toHaveBeenCalledWith('rev-123');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should return 404 for review not found', async () => {
      mockReq.params = { reviewId: 'rev-999' };

      (productReviewService.deleteReview as jest.Mock).mockRejectedValue(
        new ProductReviewNotFoundError()
      );

      await deleteReview(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('toggleVisibility', () => {
    it('should toggle visibility and return 200', async () => {
      const mockReview = {
        id: 'rev-123',
        productId: 'prod-123',
        authorName: 'John Doe',
        rating: 5,
        comment: 'Excellent!',
        isAiGenerated: false,
        isVisible: false,
        createdAt: new Date(),
      };

      mockReq.params = { reviewId: 'rev-123' };
      mockReq.body = {
        isVisible: false,
      };

      (productReviewService.toggleReviewVisibility as jest.Mock).mockResolvedValue(mockReview);

      await toggleVisibility(mockReq as Request, mockRes as Response, mockNext);

      expect(productReviewService.toggleReviewVisibility).toHaveBeenCalledWith('rev-123', {
        isVisible: false,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockReview,
      });
    });

    it('should return 404 for review not found', async () => {
      mockReq.params = { reviewId: 'rev-999' };
      mockReq.body = {
        isVisible: false,
      };

      (productReviewService.toggleReviewVisibility as jest.Mock).mockRejectedValue(
        new ProductReviewNotFoundError()
      );

      await toggleVisibility(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for invalid input', async () => {
      mockReq.params = { reviewId: 'rev-123' };
      mockReq.body = {
        isVisible: 'yes',
      };

      (productReviewService.toggleReviewVisibility as jest.Mock).mockRejectedValue(
        new InvalidProductReviewDataError('isVisible must be a boolean', 'isVisible')
      );

      await toggleVisibility(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('error handling', () => {
    it('should call next() for unknown errors', async () => {
      const unknownError = new Error('Something went wrong');

      mockReq.params = { reviewId: 'rev-123' };
      mockReq.body = {};

      (productReviewService.updateReview as jest.Mock).mockRejectedValue(unknownError);

      await updateReview(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unknownError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
});
