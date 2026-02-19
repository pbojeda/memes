import type { CartItemLocal } from '@/stores/cartStore';

/**
 * Factory function for creating test cart items with sensible defaults.
 * Override any field via the `overrides` parameter.
 */
export function createCartItem(overrides: Partial<CartItemLocal> = {}): CartItemLocal {
  return {
    productId: 'prod-1',
    slug: 'funny-cat-meme-tshirt',
    title: 'Funny Cat Meme T-Shirt',
    price: 24.99,
    size: 'M',
    quantity: 2,
    primaryImage: {
      id: 'img-1',
      url: 'https://res.cloudinary.com/test/image/upload/v1/products/cat-meme.jpg',
      altText: 'Funny cat meme on a white t-shirt',
      isPrimary: true,
      sortOrder: 0,
    },
    ...overrides,
  };
}
