import type { components } from '@/lib/api/types';

type Product = components['schemas']['Product'];
type ProductImage = components['schemas']['ProductImage'];
type Review = components['schemas']['Review'];
type ReviewListResponse = components['schemas']['ReviewListResponse'];

/**
 * Factory function for creating test products with sensible defaults.
 * Override any field via the `overrides` parameter.
 */
export const createProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'prod-1',
  title: 'Funny Cat Meme T-Shirt',
  slug: 'funny-cat-meme-tshirt',
  price: 24.99,
  compareAtPrice: 34.99,
  isHot: false,
  isActive: true,
  averageRating: 4.5,
  reviewsCount: 12,
  primaryImage: {
    id: 'img-1',
    url: 'https://res.cloudinary.com/test/image/upload/v1/products/cat-meme.jpg',
    altText: 'Funny cat meme on a white t-shirt',
    isPrimary: true,
    sortOrder: 0,
  },
  ...overrides,
});

/**
 * Create an array of distinct products.
 * Each product gets a unique id and title based on its index.
 */
export const createProducts = (count: number): Product[] =>
  Array.from({ length: count }, (_, i) =>
    createProduct({
      id: `prod-${i + 1}`,
      slug: `product-${i + 1}`,
      title: `Product ${i + 1}`,
    })
  );

/**
 * Factory function for creating test product images with sensible defaults.
 * Override any field via the `overrides` parameter.
 */
export const createProductImage = (
  overrides: Partial<ProductImage> = {}
): ProductImage => ({
  id: 'img-1',
  url: 'https://res.cloudinary.com/test/image/upload/v1/products/image-1.jpg',
  altText: 'Product image 1',
  isPrimary: false,
  sortOrder: 0,
  ...overrides,
});

/**
 * Create an array of distinct product images.
 * Each image gets a unique id, url, and altText based on its index.
 */
export const createProductImages = (count: number): ProductImage[] =>
  Array.from({ length: count }, (_, i) =>
    createProductImage({
      id: `img-${i + 1}`,
      url: `https://res.cloudinary.com/test/image/upload/v1/products/image-${i + 1}.jpg`,
      altText: `Product image ${i + 1}`,
      sortOrder: i,
      isPrimary: i === 0,
    })
  );

/**
 * Factory function for creating test reviews with sensible defaults.
 * Override any field via the `overrides` parameter.
 */
export const createReview = (overrides: Partial<Review> = {}): Review => ({
  id: 'rev-1',
  authorName: 'John Doe',
  rating: 4,
  comment: 'Great product! Very satisfied with my purchase.',
  isAiGenerated: false,
  isVisible: true,
  createdAt: '2026-02-10T12:00:00Z',
  ...overrides,
});

/**
 * Create an array of distinct reviews.
 * Each review gets a unique id, authorName, rating (cycling 5→1), and createdAt (decrementing by day).
 */
export const createReviews = (count: number): Review[] =>
  Array.from({ length: count }, (_, i) => {
    const baseDate = new Date('2026-02-10T12:00:00Z');
    baseDate.setDate(baseDate.getDate() - i);

    return createReview({
      id: `rev-${i + 1}`,
      authorName: `User ${i + 1}`,
      rating: 5 - (i % 5),
      comment: `Comment from user ${i + 1}`,
      createdAt: baseDate.toISOString(),
    });
  });

/**
 * Factory function for creating test review list responses with sensible defaults.
 * Override any field via the `overrides` parameter.
 */
export const createReviewListResponse = (
  overrides: Partial<ReviewListResponse> = {}
): ReviewListResponse => ({
  data: createReviews(3),
  meta: {
    total: 3,
    page: 1,
    limit: 10,
    totalPages: 1,
    averageRating: 4.0,
    ratingDistribution: {
      5: 1,
      4: 1,
      3: 1,
      2: 0,
      1: 0,
    },
  },
  ...overrides,
});
