'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/components/cart/CartItem';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { CrossSellSection } from '@/components/product/CrossSellSection';
import { useCartStore } from '@/stores/cartStore';

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
        <>
          {/* Populated cart — responsive two-column grid */}
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
            <div className="lg:col-span-1 sticky top-24">
              <OrderSummary
                subtotal={subtotal}
                discountAmount={0}
                shippingCost={0}
                taxAmount={0}
                total={subtotal}
                itemCount={itemCount}
                appliedPromoCode={null}
                cartErrors={[]}
                isLoading={false}
              />
              <div className="mt-4 flex flex-col gap-3">
                <Button asChild className="w-full">
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
                <Link
                  href="/products"
                  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground text-center"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>

          {/* Cross-sell section */}
          <CrossSellSection productId={items[0].productId} className="mt-12" />
        </>
      )}
    </main>
  );
}
