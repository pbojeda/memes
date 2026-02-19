import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatPrice } from '@/lib/utils';
import type { components } from '@/lib/api/types';

type AppliedPromoCodeDetail = components['schemas']['AppliedPromoCodeDetail'];
type CartValidationError = components['schemas']['CartValidationError'];

export interface OrderSummaryProps {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  itemCount: number;
  appliedPromoCode: AppliedPromoCodeDetail | null;
  cartErrors: CartValidationError[];
  isLoading: boolean;
}

/**
 * Presentational component displaying a full order cost breakdown.
 *
 * Receives calculated totals as props — no internal state or service calls.
 * Used on both the cart page (local totals) and the checkout page (backend-calculated).
 *
 * @example
 * <OrderSummary
 *   subtotal={79.98}
 *   discountAmount={0}
 *   shippingCost={0}
 *   taxAmount={0}
 *   total={79.98}
 *   itemCount={2}
 *   appliedPromoCode={null}
 *   cartErrors={[]}
 *   isLoading={false}
 * />
 */
export function OrderSummary({
  subtotal,
  discountAmount,
  shippingCost,
  taxAmount,
  total,
  itemCount,
  appliedPromoCode,
  cartErrors,
  isLoading,
}: OrderSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div role="status" aria-busy="true" aria-label="Calculating order totals">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-6 bg-muted rounded w-full mt-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Cart errors */}
        {cartErrors.length > 0 && (
          <div className="space-y-2">
            {cartErrors.map((error) => (
              <Alert key={error.productId} variant="destructive">
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Applied promo code badge */}
        {appliedPromoCode && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{appliedPromoCode.code}</Badge>
            <span className="text-sm text-muted-foreground">
              {appliedPromoCode.discountType === 'PERCENTAGE'
                ? `${appliedPromoCode.discountValue}% off`
                : `${formatPrice(appliedPromoCode.discountValue)} off`}
            </span>
          </div>
        )}

        {/* Line items */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Items</span>
          <span>{itemCount}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        {/* Discount — only shown when discountAmount > 0 */}
        {discountAmount > 0 && (
          <div className="flex items-center justify-between text-sm text-green-700">
            <span>Discount</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span>{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <span>{formatPrice(taxAmount)}</span>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between font-semibold border-t pt-3 mt-1">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
