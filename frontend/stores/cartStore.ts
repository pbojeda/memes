import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { components } from '../lib/api/types';

type ProductImage = components['schemas']['ProductImage'];

export interface CartItemLocal {
  productId: string;
  slug: string;
  title: string;
  price: number;
  primaryImage: ProductImage | null;
  size: string | null;
  quantity: number;
}

export interface CartState {
  items: CartItemLocal[];
  itemCount: number;
  subtotal: number;
}

export interface CartActions {
  addItem: (item: Omit<CartItemLocal, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string, size: string | null) => void;
  updateQuantity: (productId: string, size: string | null, quantity: number) => void;
  clearCart: () => void;
}

export type CartStore = CartState & CartActions;

// Private helpers

function itemMatches(item: CartItemLocal, productId: string, size: string | null): boolean {
  return item.productId === productId && item.size === size;
}

export const MAX_ITEM_QUANTITY = 99;

function computeDerived(items: CartItemLocal[]): { itemCount: number; subtotal: number } {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
  return { itemCount, subtotal };
}

const initialState: CartState = {
  items: [],
  itemCount: 0,
  subtotal: 0,
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      ...initialState,

      addItem: (itemData: Omit<CartItemLocal, 'quantity'>, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((item) =>
            itemMatches(item, itemData.productId, itemData.size)
          );

          let updatedItems: CartItemLocal[];
          if (existing) {
            const newQty = Math.min(existing.quantity + quantity, MAX_ITEM_QUANTITY);
            updatedItems = state.items.map((item) =>
              itemMatches(item, itemData.productId, itemData.size)
                ? { ...item, quantity: newQty }
                : item
            );
          } else {
            updatedItems = [...state.items, { ...itemData, quantity: Math.min(quantity, MAX_ITEM_QUANTITY) }];
          }

          return { items: updatedItems, ...computeDerived(updatedItems) };
        }),

      removeItem: (productId: string, size: string | null) =>
        set((state) => {
          const updatedItems = state.items.filter(
            (item) => !itemMatches(item, productId, size)
          );
          return { items: updatedItems, ...computeDerived(updatedItems) };
        }),

      updateQuantity: (productId: string, size: string | null, quantity: number) =>
        set((state) => {
          let updatedItems: CartItemLocal[];
          if (quantity <= 0) {
            updatedItems = state.items.filter(
              (item) => !itemMatches(item, productId, size)
            );
          } else {
            const clampedQty = Math.min(quantity, MAX_ITEM_QUANTITY);
            updatedItems = state.items.map((item) =>
              itemMatches(item, productId, size) ? { ...item, quantity: clampedQty } : item
            );
          }
          return { items: updatedItems, ...computeDerived(updatedItems) };
        }),

      clearCart: () => set(initialState),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) {
          const derived = computeDerived(state.items);
          state.itemCount = derived.itemCount;
          state.subtotal = derived.subtotal;
        }
      },
    }
  )
);
