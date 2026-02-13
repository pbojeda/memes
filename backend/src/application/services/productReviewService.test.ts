import {
  listProductReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleReviewVisibility,
} from './productReviewService';
import prisma from '../../lib/prisma';
import { ProductReviewNotFoundError } from '../../domain/errors/ProductReviewError';
import { ProductNotFoundError } from '../../domain/errors/ProductError';
import type { ProductReview } from '../../generated/prisma/client';

// Mock prisma
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    productReview: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
    },
  },
}));

describe('productReviewService', () => {
  const mockProductId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const mockReviewId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  const mockReview: ProductReview = {
    id: mockReviewId,
    productId: mockProductId,
    authorName: 'John Doe',
    rating: 5,
    comment: 'Excellent product!',
    isAiGenerated: false,
    isVisible: true,
    createdAt: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listProductReviews', () => {
    it('should return paginated visible reviews with analytics', async () => {
      const reviews: ProductReview[] = [
        { ...mockReview, id: 'rev-1', rating: 5, isVisible: true },
        { ...mockReview, id: 'rev-2', rating: 4, isVisible: true },
        { ...mockReview, id: 'rev-3', rating: 5, isVisible: true },
      ];

      (prisma.productReview.findMany as jest.Mock).mockResolvedValue(reviews);
      (prisma.productReview.count as jest.Mock).mockResolvedValue(3);
      (prisma.productReview.aggregate as jest.Mock).mockResolvedValue({
        _avg: { rating: 4.666666666666667 },
      });
      (prisma.productReview.groupBy as jest.Mock).mockResolvedValue([
        { rating: 5, _count: { rating: 2 } },
        { rating: 4, _count: { rating: 1 } },
      ]);

      const result = await listProductReviews(mockProductId, { page: 1, limit: 20 });

      expect(result.data).toEqual(reviews);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.total).toBe(3);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.averageRating).toBe(4.67);
      expect(result.meta.ratingDistribution).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 1,
        5: 2,
      });

      expect(prisma.productReview.findMany).toHaveBeenCalledWith({
        where: { productId: mockProductId, isVisible: true },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should return empty list with zero analytics when no reviews', async () => {
      (prisma.productReview.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.productReview.count as jest.Mock).mockResolvedValue(0);
      (prisma.productReview.aggregate as jest.Mock).mockResolvedValue({
        _avg: { rating: null },
      });
      (prisma.productReview.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await listProductReviews(mockProductId, { page: 1, limit: 20 });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.averageRating).toBe(0);
      expect(result.meta.ratingDistribution).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      });
    });

    it('should only return visible reviews in data', async () => {
      const visibleReviews: ProductReview[] = [
        { ...mockReview, id: 'rev-1', isVisible: true },
      ];

      (prisma.productReview.findMany as jest.Mock).mockResolvedValue(visibleReviews);
      (prisma.productReview.count as jest.Mock).mockResolvedValue(1);
      (prisma.productReview.aggregate as jest.Mock).mockResolvedValue({
        _avg: { rating: 5 },
      });
      (prisma.productReview.groupBy as jest.Mock).mockResolvedValue([
        { rating: 5, _count: { rating: 1 } },
      ]);

      const result = await listProductReviews(mockProductId, { page: 1, limit: 20 });

      expect(prisma.productReview.findMany).toHaveBeenCalledWith({
        where: { productId: mockProductId, isVisible: true },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].isVisible).toBe(true);
    });

    it('should throw for invalid productId', async () => {
      await expect(listProductReviews('invalid-id', { page: 1, limit: 20 })).rejects.toThrow(
        'Invalid ID format'
      );
    });

    it('should calculate analytics correctly with mixed ratings', async () => {
      const reviews: ProductReview[] = [
        { ...mockReview, id: 'rev-1', rating: 5 },
        { ...mockReview, id: 'rev-2', rating: 3 },
      ];

      (prisma.productReview.findMany as jest.Mock).mockResolvedValue(reviews);
      (prisma.productReview.count as jest.Mock).mockResolvedValue(2);
      (prisma.productReview.aggregate as jest.Mock).mockResolvedValue({
        _avg: { rating: 4.0 },
      });
      (prisma.productReview.groupBy as jest.Mock).mockResolvedValue([
        { rating: 5, _count: { rating: 1 } },
        { rating: 3, _count: { rating: 1 } },
      ]);

      const result = await listProductReviews(mockProductId, { page: 1, limit: 20 });

      expect(result.meta.averageRating).toBe(4.0);
      expect(result.meta.ratingDistribution).toEqual({
        1: 0,
        2: 0,
        3: 1,
        4: 0,
        5: 1,
      });
    });

    it('should handle pagination correctly for page 2', async () => {
      (prisma.productReview.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.productReview.count as jest.Mock).mockResolvedValue(25);
      (prisma.productReview.aggregate as jest.Mock).mockResolvedValue({
        _avg: { rating: 4.5 },
      });
      (prisma.productReview.groupBy as jest.Mock).mockResolvedValue([]);

      await listProductReviews(mockProductId, { page: 2, limit: 10 });

      expect(prisma.productReview.findMany).toHaveBeenCalledWith({
        where: { productId: mockProductId, isVisible: true },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      });
    });
  });

  describe('createReview', () => {
    it('should create review successfully with defaults', async () => {
      const input = {
        authorName: 'Jane Smith',
        rating: 4,
        comment: 'Great product, highly recommend!',
        isAiGenerated: false,
        isVisible: true,
      };

      const product = {
        id: mockProductId,
        title: { es: 'Producto' },
        slug: 'producto',
        deletedAt: null,
      };

      (prisma.product.findFirst as jest.Mock).mockResolvedValue(product);
      (prisma.productReview.create as jest.Mock).mockResolvedValue({
        ...mockReview,
        ...input,
      });

      const result = await createReview(mockProductId, input);

      expect(result.authorName).toBe(input.authorName);
      expect(result.rating).toBe(input.rating);
      expect(result.comment).toBe(input.comment);

      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: mockProductId, deletedAt: null },
      });

      expect(prisma.productReview.create).toHaveBeenCalledWith({
        data: {
          productId: mockProductId,
          authorName: input.authorName,
          rating: input.rating,
          comment: input.comment,
          isAiGenerated: input.isAiGenerated,
          isVisible: input.isVisible,
        },
      });
    });

    it('should throw ProductNotFoundError if product does not exist', async () => {
      const input = {
        authorName: 'Jane Smith',
        rating: 4,
        comment: 'Great product!',
        isAiGenerated: false,
        isVisible: true,
      };

      (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(createReview(mockProductId, input)).rejects.toThrow(ProductNotFoundError);

      expect(prisma.productReview.create).not.toHaveBeenCalled();
    });

    it('should throw ProductNotFoundError if product is soft-deleted', async () => {
      const input = {
        authorName: 'Jane Smith',
        rating: 4,
        comment: 'Great product!',
        isAiGenerated: false,
        isVisible: true,
      };

      // findFirst with deletedAt: null will return null for soft-deleted products
      (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(createReview(mockProductId, input)).rejects.toThrow(ProductNotFoundError);
    });

    it('should throw for invalid input', async () => {
      const input = {
        authorName: 'J',
        rating: 10,
        comment: 'Short',
        isAiGenerated: false,
        isVisible: true,
      };

      await expect(createReview(mockProductId, input)).rejects.toThrow();
    });
  });

  describe('updateReview', () => {
    it('should update review with partial data', async () => {
      const input = {
        authorName: 'Updated Name',
        rating: 3,
      };

      (prisma.productReview.findFirst as jest.Mock).mockResolvedValue(mockReview);
      (prisma.productReview.update as jest.Mock).mockResolvedValue({
        ...mockReview,
        ...input,
      });

      const result = await updateReview(mockReviewId, input);

      expect(result.authorName).toBe(input.authorName);
      expect(result.rating).toBe(input.rating);

      expect(prisma.productReview.findFirst).toHaveBeenCalledWith({
        where: { id: mockReviewId },
      });

      expect(prisma.productReview.update).toHaveBeenCalledWith({
        where: { id: mockReviewId },
        data: input,
      });
    });

    it('should throw ProductReviewNotFoundError if review not found', async () => {
      const input = {
        comment: 'Updated comment',
      };

      (prisma.productReview.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(updateReview(mockReviewId, input)).rejects.toThrow(
        ProductReviewNotFoundError
      );

      expect(prisma.productReview.update).not.toHaveBeenCalled();
    });

    it('should throw for invalid UUID', async () => {
      const input = {
        authorName: 'Updated Name',
      };

      await expect(updateReview('invalid-id', input)).rejects.toThrow('Invalid ID format');
    });
  });

  describe('deleteReview', () => {
    it('should delete review successfully', async () => {
      (prisma.productReview.findFirst as jest.Mock).mockResolvedValue(mockReview);
      (prisma.productReview.delete as jest.Mock).mockResolvedValue(mockReview);

      await deleteReview(mockReviewId);

      expect(prisma.productReview.findFirst).toHaveBeenCalledWith({
        where: { id: mockReviewId },
      });

      expect(prisma.productReview.delete).toHaveBeenCalledWith({
        where: { id: mockReviewId },
      });
    });

    it('should throw ProductReviewNotFoundError if review not found', async () => {
      (prisma.productReview.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(deleteReview(mockReviewId)).rejects.toThrow(ProductReviewNotFoundError);

      expect(prisma.productReview.delete).not.toHaveBeenCalled();
    });
  });

  describe('toggleReviewVisibility', () => {
    it('should toggle visibility to false', async () => {
      const input = {
        isVisible: false,
      };

      (prisma.productReview.findFirst as jest.Mock).mockResolvedValue(mockReview);
      (prisma.productReview.update as jest.Mock).mockResolvedValue({
        ...mockReview,
        isVisible: false,
      });

      const result = await toggleReviewVisibility(mockReviewId, input);

      expect(result.isVisible).toBe(false);

      expect(prisma.productReview.update).toHaveBeenCalledWith({
        where: { id: mockReviewId },
        data: { isVisible: false },
      });
    });

    it('should toggle visibility to true', async () => {
      const input = {
        isVisible: true,
      };

      (prisma.productReview.findFirst as jest.Mock).mockResolvedValue({
        ...mockReview,
        isVisible: false,
      });
      (prisma.productReview.update as jest.Mock).mockResolvedValue({
        ...mockReview,
        isVisible: true,
      });

      const result = await toggleReviewVisibility(mockReviewId, input);

      expect(result.isVisible).toBe(true);
    });

    it('should throw ProductReviewNotFoundError if review not found', async () => {
      const input = {
        isVisible: false,
      };

      (prisma.productReview.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(toggleReviewVisibility(mockReviewId, input)).rejects.toThrow(
        ProductReviewNotFoundError
      );

      expect(prisma.productReview.update).not.toHaveBeenCalled();
    });
  });
});
