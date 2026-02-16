import type { components } from '@/lib/api/types';

type Product = components['schemas']['Product'];

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
