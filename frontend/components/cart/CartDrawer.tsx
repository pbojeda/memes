'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { CartItem } from '@/components/cart/CartItem';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/lib/utils';

/**
 * CartDrawer renders a trigger button (cart icon + badge) that opens a
 * slide-out side panel displaying the user's cart contents.
 *
 * Reads from cartStore. Handles hydration on mount.
 *
 * @example
 * // Place in site header:
 * <CartDrawer />
 */
export function CartDrawer() {
  const [open, setOpen] = useState(false);

  const items = useCartStore((state) => state.items);
  const itemCount = useCartStore((state) => state.itemCount);
  const subtotal = useCartStore((state) => state.subtotal);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open cart"
          className="relative"
        >
          <ShoppingCart />
          {itemCount > 0 && (
            <span
              data-testid="cart-badge"
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
            >
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent showCloseButton>
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription className="sr-only">Cart contents</SheetDescription>
        </SheetHeader>

        {/* Items area */}
        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center py-12">
              <p className="text-muted-foreground text-sm">Your cart is empty</p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((item) => (
                <li key={`${item.productId}-${item.size ?? 'no-size'}`}>
                  <CartItem
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Subtotal + footer actions — only when cart has items */}
        {items.length > 0 && (
          <>
            <div className="border-t px-6 py-4 flex items-center justify-between">
              <span className="font-medium">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>

            <SheetFooter>
              <SheetClose asChild>
                <Button asChild className="w-full">
                  <Link href="/cart">View Cart</Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
