'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Plus, Minus, Trash2, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatPrice } from '@/lib/utils';
import { MAX_ITEM_QUANTITY } from '@/stores/cartStore';
import type { CartItemLocal } from '@/stores/cartStore';

interface CartItemProps {
  item: CartItemLocal;
  onUpdateQuantity: (
    productId: string,
    size: string | null,
    newQuantity: number
  ) => void;
  onRemove: (productId: string, size: string | null) => void;
  className?: string;
}

/**
 * CartItem displays a single cart line with image, title, size, price,
 * quantity controls, and a remove button.
 *
 * Presentational component — does not read from or write to cartStore directly.
 * The parent is responsible for wiring onUpdateQuantity and onRemove to the store.
 *
 * @example
 * <CartItem
 *   item={cartItem}
 *   onUpdateQuantity={(id, size, qty) => store.updateQuantity(id, size, qty)}
 *   onRemove={(id, size) => store.removeItem(id, size)}
 * />
 */
export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  className,
}: CartItemProps) {
  const { productId, slug, title, price, size, quantity, primaryImage } = item;

  const lineTotal =
    Math.round(price * quantity * 100) / 100;

  return (
    <div className={cn('flex items-start gap-4 py-4', className)}>
      {/* Product image */}
      <div className="shrink-0 rounded overflow-hidden bg-muted w-20 h-20 flex items-center justify-center">
        {primaryImage?.url ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.altText ?? title}
            width={80}
            height={80}
            className="object-cover w-full h-full"
          />
        ) : (
          <div
            className="flex items-center justify-center w-full h-full text-muted-foreground"
            aria-label="No product image"
          >
            <ImageOff className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* Info column */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${slug}`}
          className="font-medium text-sm leading-tight hover:underline line-clamp-2"
        >
          {title}
        </Link>

        {size && (
          <p className="text-xs text-muted-foreground mt-0.5">Size: {size}</p>
        )}

        <p className="text-sm mt-1">{formatPrice(price)}</p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1 shrink-0" role="group" aria-label={`Quantity for ${title}`}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Decrease quantity"
          disabled={quantity <= 1}
          onClick={() => onUpdateQuantity(productId, size, quantity - 1)}
        >
          <Minus />
        </Button>

        <span className="w-8 text-center text-sm select-none">{quantity}</span>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Increase quantity"
          disabled={quantity >= MAX_ITEM_QUANTITY}
          onClick={() => onUpdateQuantity(productId, size, quantity + 1)}
        >
          <Plus />
        </Button>
      </div>

      {/* Line total + remove */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="font-semibold text-sm">{formatPrice(lineTotal)}</span>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Remove item"
          onClick={() => onRemove(productId, size)}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
