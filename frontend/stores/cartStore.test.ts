import { act } from '@testing-library/react';
import { useCartStore, MAX_ITEM_QUANTITY } from './cartStore';
import type { CartItemLocal } from './cartStore';

// Fixtures
const itemTShirtM: Omit<CartItemLocal, 'quantity'> = {
  productId: 'prod-1',
  slug: 'classic-t-shirt',
  title: 'Classic T-Shirt',
  price: 24.99,
  primaryImage: null,
  size: 'M',
};

const itemTShirtL: Omit<CartItemLocal, 'quantity'> = {
  productId: 'prod-1',
  slug: 'classic-t-shirt',
  title: 'Classic T-Shirt',
  price: 24.99,
  primaryImage: null,
  size: 'L',
};

const itemMug: Omit<CartItemLocal, 'quantity'> = {
  productId: 'prod-2',
  slug: 'classic-mug',
  title: 'Classic Mug',
  price: 14.99,
  primaryImage: null,
  size: null,
};

describe('cartStore', () => {
  beforeEach(() => {
    act(() => {
      useCartStore.getState().clearCart();
    });
  });

  describe('initial state', () => {
    it('should have empty cart initial state', () => {
      const state = useCartStore.getState();

      expect(state.items).toEqual([]);
      expect(state.itemCount).toBe(0);
      expect(state.subtotal).toBe(0);
    });
  });

  describe('addItem', () => {
    it('should add a new item with default quantity 1', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]).toEqual({ ...itemTShirtM, quantity: 1 });
      expect(state.itemCount).toBe(1);
      expect(state.subtotal).toBe(24.99);
    });

    it('should add a new item with specified quantity', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM, 3);
      });

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(3);
      expect(state.subtotal).toBeCloseTo(74.97, 2);
    });

    it('should increment quantity when adding duplicate productId+size', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM);
        useCartStore.getState().addItem(itemTShirtM);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(2);
      expect(state.subtotal).toBe(49.98);
    });

    it('should treat same productId with different size as separate items', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM);
        useCartStore.getState().addItem(itemTShirtL);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.itemCount).toBe(2);
    });

    it('should add item with null size correctly', () => {
      act(() => {
        useCartStore.getState().addItem(itemMug);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].size).toBeNull();
    });

    it('should increment quantity for duplicate null size item', () => {
      act(() => {
        useCartStore.getState().addItem(itemMug);
        useCartStore.getState().addItem(itemMug);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(2);
    });

    it('should cap quantity at MAX_ITEM_QUANTITY', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM, MAX_ITEM_QUANTITY + 10);
      });

      expect(useCartStore.getState().items[0].quantity).toBe(MAX_ITEM_QUANTITY);
    });

    it('should be a no-op when adding with quantity 0', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM, 0);
      });

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should be a no-op when adding with negative quantity', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM, -1);
      });

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should cap accumulated quantity at MAX_ITEM_QUANTITY when adding duplicates', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM, 90);
        useCartStore.getState().addItem(itemTShirtM, 20);
      });

      expect(useCartStore.getState().items[0].quantity).toBe(MAX_ITEM_QUANTITY);
    });
  });

  describe('removeItem', () => {
    it('should remove item by productId+size', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM);
        useCartStore.getState().removeItem('prod-1', 'M');
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
    });

    it('should only remove the matching size, leaving other sizes intact', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM);
        useCartStore.getState().addItem(itemTShirtL);
        useCartStore.getState().removeItem('prod-1', 'M');
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].size).toBe('L');
    });

    it('should remove item with null size', () => {
      act(() => {
        useCartStore.getState().addItem(itemMug);
        useCartStore.getState().removeItem('prod-2', null);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
    });

    it('should not affect other items when removing', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM);
        useCartStore.getState().addItem(itemMug);
        useCartStore.getState().removeItem('prod-1', 'M');
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].productId).toBe('prod-2');
    });

    it('should be a no-op if item is not found', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM);
        useCartStore.getState().removeItem('prod-99', 'XL');
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('should update quantity to a new value', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM);
        useCartStore.getState().updateQuantity('prod-1', 'M', 5);
      });

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(5);
      expect(state.subtotal).toBeCloseTo(124.95, 2);
    });

    it('should remove item when quantity is set to 0', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM);
        useCartStore.getState().updateQuantity('prod-1', 'M', 0);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
    });

    it('should remove item when quantity is set to a negative value', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM);
        useCartStore.getState().updateQuantity('prod-1', 'M', -1);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
    });

    it('should only affect the matching item, leaving others unaffected', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM);
        useCartStore.getState().addItem(itemMug);
        useCartStore.getState().updateQuantity('prod-1', 'M', 10);
      });

      const state = useCartStore.getState();
      const mug = state.items.find((i) => i.productId === 'prod-2');
      expect(mug?.quantity).toBe(1);
    });

    it('should be a no-op if item is not found', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM);
        useCartStore.getState().updateQuantity('prod-99', 'XL', 5);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(1);
    });

    it('should cap quantity at MAX_ITEM_QUANTITY', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM);
        useCartStore.getState().updateQuantity('prod-1', 'M', MAX_ITEM_QUANTITY + 50);
      });

      expect(useCartStore.getState().items[0].quantity).toBe(MAX_ITEM_QUANTITY);
    });
  });

  describe('clearCart', () => {
    it('should reset cart to empty state', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM);
        useCartStore.getState().addItem(itemMug, 2);
        useCartStore.getState().clearCart();
      });

      const state = useCartStore.getState();
      expect(state.items).toEqual([]);
      expect(state.itemCount).toBe(0);
      expect(state.subtotal).toBe(0);
    });
  });

  describe('computed values', () => {
    it('should return total quantity across all items as itemCount', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM, 2);
        useCartStore.getState().addItem(itemMug, 1);
      });

      const state = useCartStore.getState();
      expect(state.itemCount).toBe(3);
    });

    it('should return sum of price * quantity as subtotal', () => {
      act(() => {
        useCartStore.getState().addItem(itemTShirtM, 2);
        useCartStore.getState().addItem(itemMug, 1);
      });

      const state = useCartStore.getState();
      // 24.99 * 2 + 14.99 * 1 = 49.98 + 14.99 = 64.97
      expect(state.subtotal).toBeCloseTo(64.97, 2);
    });

    it('should return 0 for itemCount and subtotal when cart is empty', () => {
      const state = useCartStore.getState();

      expect(state.itemCount).toBe(0);
      expect(state.subtotal).toBe(0);
    });
  });
});
