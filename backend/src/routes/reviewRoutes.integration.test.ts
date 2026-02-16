import request from 'supertest';
import express from 'express';
import * as tokenService from '../application/services/tokenService';
import * as productReviewService from '../application/services/productReviewService';
import { UserRole } from '../generated/prisma/enums';
import {
  InvalidProductReviewDataError,
  ProductReviewNotFoundError,
} from '../domain/errors/ProductReviewError';
import { ProductNotFoundError } from '../domain/errors/ProductError';

// Mock dependencies
jest.mock('../application/services/tokenService', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
  refreshTokens: jest.fn(),
}));

jest.mock('../application/services/productReviewService', () => ({
  listProductReviews: jest.fn(),
  createReview: jest.fn(),
  updateReview: jest.fn(),
  deleteReview: jest.fn(),
  toggleReviewVisibility: jest.fn(),
}));

jest.mock('../application/validators/productReviewValidator', () => ({
  validateListReviewsInput: jest.fn((input) => ({
    page: input.page ?? 1,
    limit: input.limit ?? 20,
  })),
}));

const mockTokenService = tokenService as jest.Mocked<typeof tokenService>;
const mockProductReviewService = productReviewService as jest.Mocked<typeof productReviewService>;

// Create test app with routes
const createTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  const routes = require('./index').default;
  testApp.use(routes);
  // Add error handler middleware
  const { errorHandler } = require('../middleware/errorHandler');
  testApp.use(errorHandler);
  return testApp;
};

const testApp = createTestApp();

// Helper to set up role-based auth
const setupRoleAuth = (role: UserRole) => {
  (mockTokenService.verifyAccessToken as jest.Mock).mockReturnValue({
    userId: `user-${role.toLowerCase()}-123`,
    email: `${role.toLowerCase()}@example.com`,
    role,
  });
};

// Helper to set up admin auth
const setupAdminAuth = () => {
  setupRoleAuth(UserRole.ADMIN);
};

describe('Review Routes Integration', () => {
  const mockReview = {
    id: 'review-uuid-001',
    productId: '123e4567-e89b-12d3-a456-426614174000',
    authorName: 'John Doe',
    rating: 5,
    comment: 'Amazing product, love the meme design!',
    isVisible: true,
    isAiGenerated: false,
    createdAt: new Date('2026-02-11'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /products/:productId/reviews (public)', () => {
    const productId = '123e4567-e89b-12d3-a456-426614174000';
    const mockListResult = {
      data: [mockReview],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        averageRating: 5,
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 1,
        },
      },
    };

    it('should return 200 with reviews list and meta (averageRating, ratingDistribution)', async () => {
      (mockProductReviewService.listProductReviews as jest.Mock).mockResolvedValue(mockListResult);

      const response = await request(testApp).get(`/products/${productId}/reviews`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe('review-uuid-001');
      expect(response.body.meta.averageRating).toBe(5);
      expect(response.body.meta.ratingDistribution).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 1,
      });
    });

    it('should return 200 and pass page/limit query params', async () => {
      (mockProductReviewService.listProductReviews as jest.Mock).mockResolvedValue({
        ...mockListResult,
        meta: { ...mockListResult.meta, page: 2, limit: 10 },
      });

      const response = await request(testApp).get(`/products/${productId}/reviews?page=2&limit=10`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockProductReviewService.listProductReviews).toHaveBeenCalledWith(productId, {
        page: 2,
        limit: 10,
      });
    });

    it('should return 200 with defaults when no query params', async () => {
      (mockProductReviewService.listProductReviews as jest.Mock).mockResolvedValue(mockListResult);

      const response = await request(testApp).get(`/products/${productId}/reviews`);

      expect(response.status).toBe(200);
      expect(mockProductReviewService.listProductReviews).toHaveBeenCalledWith(productId, {
        page: 1,
        limit: 20,
      });
    });

    it('should return 404 when product not found', async () => {
      (mockProductReviewService.listProductReviews as jest.Mock).mockRejectedValue(
        new ProductNotFoundError()
      );

      const response = await request(testApp).get(`/products/${productId}/reviews`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('POST /products/:productId/reviews (MANAGER/ADMIN)', () => {
    const productId = '123e4567-e89b-12d3-a456-426614174000';
    const createPayload = {
      authorName: 'Jane Smith',
      rating: 4,
      comment: 'Great quality, fast shipping!',
      isVisible: true,
    };

    it('should return 201 on successful creation by ADMIN', async () => {
      setupAdminAuth();
      const createdReview = { ...mockReview, ...createPayload, id: 'new-review-123' };
      (mockProductReviewService.createReview as jest.Mock).mockResolvedValue(createdReview);

      const response = await request(testApp)
        .post(`/products/${productId}/reviews`)
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.authorName).toBe('Jane Smith');
      expect(response.body.data.rating).toBe(4);
      expect(mockProductReviewService.createReview).toHaveBeenCalledWith(productId, createPayload);
    });

    it('should return 201 by MANAGER', async () => {
      setupRoleAuth(UserRole.MANAGER);
      const createdReview = { ...mockReview, ...createPayload };
      (mockProductReviewService.createReview as jest.Mock).mockResolvedValue(createdReview);

      const response = await request(testApp)
        .post(`/products/${productId}/reviews`)
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockProductReviewService.createReview).toHaveBeenCalledWith(productId, createPayload);
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(testApp)
        .post(`/products/${productId}/reviews`)
        .send(createPayload);

      expect(response.status).toBe(401);
    });

    it('should return 403 for TARGET user', async () => {
      setupRoleAuth(UserRole.TARGET);

      const response = await request(testApp)
        .post(`/products/${productId}/reviews`)
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(403);
      expect(response.body.error.message).toBe('Access denied');
      expect(response.body.error.statusCode).toBe(403);
    });

    it('should return 403 for MARKETING user', async () => {
      setupRoleAuth(UserRole.MARKETING);

      const response = await request(testApp)
        .post(`/products/${productId}/reviews`)
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(403);
      expect(response.body.error.message).toBe('Access denied');
      expect(response.body.error.statusCode).toBe(403);
    });

    it('should return 400 for validation error', async () => {
      setupAdminAuth();
      (mockProductReviewService.createReview as jest.Mock).mockRejectedValue(
        new InvalidProductReviewDataError('Invalid rating', 'rating')
      );

      const response = await request(testApp)
        .post(`/products/${productId}/reviews`)
        .set('Authorization', 'Bearer valid-token')
        .send({ ...createPayload, rating: 6 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PRODUCT_REVIEW_DATA');
      expect(response.body.error.field).toBe('rating');
    });

    it('should return 404 when product not found', async () => {
      setupAdminAuth();
      (mockProductReviewService.createReview as jest.Mock).mockRejectedValue(
        new ProductNotFoundError()
      );

      const response = await request(testApp)
        .post(`/products/${productId}/reviews`)
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('PATCH /reviews/:reviewId (MANAGER/ADMIN)', () => {
    const reviewId = 'review-uuid-001';
    const updatePayload = {
      rating: 4,
      comment: 'Updated comment',
    };

    it('should return 200 on successful update by ADMIN', async () => {
      setupAdminAuth();
      const updatedReview = { ...mockReview, ...updatePayload };
      (mockProductReviewService.updateReview as jest.Mock).mockResolvedValue(updatedReview);

      const response = await request(testApp)
        .patch(`/reviews/${reviewId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(4);
      expect(response.body.data.comment).toBe('Updated comment');
      expect(mockProductReviewService.updateReview).toHaveBeenCalledWith(reviewId, updatePayload);
    });

    it('should return 200 by MANAGER', async () => {
      setupRoleAuth(UserRole.MANAGER);
      const updatedReview = { ...mockReview, ...updatePayload };
      (mockProductReviewService.updateReview as jest.Mock).mockResolvedValue(updatedReview);

      const response = await request(testApp)
        .patch(`/reviews/${reviewId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(testApp).patch(`/reviews/${reviewId}`).send(updatePayload);

      expect(response.status).toBe(401);
    });

    it('should return 403 for TARGET user', async () => {
      setupRoleAuth(UserRole.TARGET);

      const response = await request(testApp)
        .patch(`/reviews/${reviewId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      expect(response.status).toBe(403);
      expect(response.body.error.message).toBe('Access denied');
      expect(response.body.error.statusCode).toBe(403);
    });

    it('should return 400 for validation error', async () => {
      setupAdminAuth();
      (mockProductReviewService.updateReview as jest.Mock).mockRejectedValue(
        new InvalidProductReviewDataError('Invalid rating', 'rating')
      );

      const response = await request(testApp)
        .patch(`/reviews/${reviewId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ rating: 0 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PRODUCT_REVIEW_DATA');
    });

    it('should return 404 when review not found', async () => {
      setupAdminAuth();
      (mockProductReviewService.updateReview as jest.Mock).mockRejectedValue(
        new ProductReviewNotFoundError()
      );

      const response = await request(testApp)
        .patch(`/reviews/${reviewId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_REVIEW_NOT_FOUND');
    });
  });

  describe('DELETE /reviews/:reviewId (MANAGER/ADMIN)', () => {
    const reviewId = 'review-uuid-001';

    it('should return 204 by ADMIN', async () => {
      setupAdminAuth();
      (mockProductReviewService.deleteReview as jest.Mock).mockResolvedValue(undefined);

      const response = await request(testApp)
        .delete(`/reviews/${reviewId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
      expect(mockProductReviewService.deleteReview).toHaveBeenCalledWith(reviewId);
    });

    it('should return 204 by MANAGER', async () => {
      setupRoleAuth(UserRole.MANAGER);
      (mockProductReviewService.deleteReview as jest.Mock).mockResolvedValue(undefined);

      const response = await request(testApp)
        .delete(`/reviews/${reviewId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(testApp).delete(`/reviews/${reviewId}`);

      expect(response.status).toBe(401);
    });

    it('should return 403 for TARGET user', async () => {
      setupRoleAuth(UserRole.TARGET);

      const response = await request(testApp)
        .delete(`/reviews/${reviewId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(response.body.error.message).toBe('Access denied');
      expect(response.body.error.statusCode).toBe(403);
    });

    it('should return 404 when review not found', async () => {
      setupAdminAuth();
      (mockProductReviewService.deleteReview as jest.Mock).mockRejectedValue(
        new ProductReviewNotFoundError()
      );

      const response = await request(testApp)
        .delete(`/reviews/${reviewId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_REVIEW_NOT_FOUND');
    });
  });

  describe('PATCH /reviews/:reviewId/visibility (MANAGER/ADMIN)', () => {
    const reviewId = 'review-uuid-001';
    const togglePayload = {
      isVisible: false,
    };

    it('should return 200 toggle by ADMIN', async () => {
      setupAdminAuth();
      const toggledReview = { ...mockReview, isVisible: false };
      (mockProductReviewService.toggleReviewVisibility as jest.Mock).mockResolvedValue(
        toggledReview
      );

      const response = await request(testApp)
        .patch(`/reviews/${reviewId}/visibility`)
        .set('Authorization', 'Bearer valid-token')
        .send(togglePayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isVisible).toBe(false);
      expect(mockProductReviewService.toggleReviewVisibility).toHaveBeenCalledWith(
        reviewId,
        togglePayload
      );
    });

    it('should return 200 by MANAGER', async () => {
      setupRoleAuth(UserRole.MANAGER);
      const toggledReview = { ...mockReview, isVisible: true };
      (mockProductReviewService.toggleReviewVisibility as jest.Mock).mockResolvedValue(
        toggledReview
      );

      const response = await request(testApp)
        .patch(`/reviews/${reviewId}/visibility`)
        .set('Authorization', 'Bearer valid-token')
        .send({ isVisible: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isVisible).toBe(true);
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(testApp)
        .patch(`/reviews/${reviewId}/visibility`)
        .send(togglePayload);

      expect(response.status).toBe(401);
    });

    it('should return 403 for TARGET user', async () => {
      setupRoleAuth(UserRole.TARGET);

      const response = await request(testApp)
        .patch(`/reviews/${reviewId}/visibility`)
        .set('Authorization', 'Bearer valid-token')
        .send(togglePayload);

      expect(response.status).toBe(403);
      expect(response.body.error.message).toBe('Access denied');
      expect(response.body.error.statusCode).toBe(403);
    });

    it('should return 400 for validation error', async () => {
      setupAdminAuth();
      (mockProductReviewService.toggleReviewVisibility as jest.Mock).mockRejectedValue(
        new InvalidProductReviewDataError('Invalid visibility value', 'isVisible')
      );

      const response = await request(testApp)
        .patch(`/reviews/${reviewId}/visibility`)
        .set('Authorization', 'Bearer valid-token')
        .send({ isVisible: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PRODUCT_REVIEW_DATA');
    });

    it('should return 404 when review not found', async () => {
      setupAdminAuth();
      (mockProductReviewService.toggleReviewVisibility as jest.Mock).mockRejectedValue(
        new ProductReviewNotFoundError()
      );

      const response = await request(testApp)
        .patch(`/reviews/${reviewId}/visibility`)
        .set('Authorization', 'Bearer valid-token')
        .send(togglePayload);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_REVIEW_NOT_FOUND');
    });
  });
});
