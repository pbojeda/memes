import Link from 'next/link';
import Image from 'next/image';
import { ImageOff, Star } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, getLocalizedName } from '@/lib/utils';
import type { components } from '@/lib/api/types';

type Product = components['schemas']['Product'];

interface ProductCardProps {
  product: Product;
  className?: string;
}

/**
 * Format price as EUR currency in Spanish locale.
 * @param price - The numeric price to format
 * @returns Formatted price string (e.g., "24,99 €")
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

/**
 * ProductCard displays a product summary in a catalog grid.
 *
 * Features:
 * - Product image with fallback placeholder
 * - Localized title
 * - Price with optional compare-at (strikethrough)
 * - "Hot" badge indicator
 * - Average rating with review count
 * - Links to product detail page
 *
 * @example
 * <ProductCard product={product} />
 */
export function ProductCard({ product, className }: ProductCardProps) {
  const {
    title,
    slug,
    price,
    compareAtPrice,
    isHot,
    primaryImage,
    averageRating,
    reviewsCount,
  } = product;

  // Derived state
  const displayTitle = getLocalizedName(title, '');
  const imageUrl = primaryImage?.url;
  const imageAlt = primaryImage?.altText ?? displayTitle;
  const discountPrice =
    compareAtPrice !== undefined &&
    price !== undefined &&
    compareAtPrice > price
      ? compareAtPrice
      : undefined;
  const hasReviews = (reviewsCount ?? 0) > 0;

  return (
    <Card className={cn('overflow-hidden py-0 group', className)}>
      <Link
        href={`/products/${slug ?? ''}`}
        className="flex flex-col h-full no-underline"
      >
        {/* Image area with Hot badge */}
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div
              className="flex items-center justify-center h-full text-muted-foreground"
              aria-label="No product image"
            >
              <ImageOff className="h-12 w-12" />
            </div>
          )}
          {isHot && (
            <Badge variant="destructive" className="absolute top-2 right-2">
              Hot
            </Badge>
          )}
        </div>

        {/* Content: product title */}
        <CardContent className="flex-1 pt-4">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {displayTitle}
          </h3>
        </CardContent>

        {/* Footer: price + rating */}
        <CardFooter className="flex-col items-start gap-1 pb-4">
          {/* Price row */}
          <div className="flex items-center gap-2">
            {price !== undefined && (
              <span className="font-bold text-base">{formatPrice(price)}</span>
            )}
            {discountPrice !== undefined && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(discountPrice)}
              </span>
            )}
          </div>

          {/* Rating row */}
          {hasReviews && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{averageRating}</span>
              <span>({reviewsCount})</span>
            </div>
          )}
        </CardFooter>
      </Link>
    </Card>
  );
}
