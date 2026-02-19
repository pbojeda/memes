'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CartItem } from '@/components/cart/CartItem';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/lib/utils';

/**
 * CartPageContent renders the full-page cart view.
 *
 * Shows a two-column layout on desktop (items list + order summary sidebar)
 * and stacked on mobile. Handles empty cart state with a CTA to browse products.
 *
 * Must be a client component because it reads from cartStore and hydrates on mount.
 *
 * @example
 * // Used in app/cart/page.tsx:
 * <CartPageContent />
 */
export function CartPageContent() {
  const items = useCartStore((state) => state.items);
  const itemCount = useCartStore((state) => state.itemCount);
  const subtotal = useCartStore((state) => state.subtotal);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  return (
    <main aria-labelledby="cart-heading" className="container mx-auto px-4 py-8">
      <h1 id="cart-heading" className="text-2xl font-bold mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
          <p className="text-lg text-muted-foreground">Your cart is empty</p>
          <Link
            href="/products"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        /* Populated cart — responsive two-column grid */
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items column */}
          <div className="lg:col-span-2">
            <ul className="divide-y" aria-label="Cart items">
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
          </div>

          {/* Order summary column */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Items</span>
                  <span>{itemCount}</span>
                </div>
                <div className="flex items-center justify-between font-medium border-t pt-4 mt-4">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
              </CardContent>

              <CardFooter className="flex-col gap-3">
                <Button asChild className="w-full">
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
                <Link
                  href="/products"
                  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Continue Shopping
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
