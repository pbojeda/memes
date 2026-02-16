import { cn } from '@/lib/utils';
import { ProductCard } from './ProductCard';
import type { components } from '@/lib/api/types';

type Product = components['schemas']['Product'];

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  className?: string;
  skeletonCount?: number;
  columns?: string;
}

const DEFAULT_COLUMNS = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

/**
 * ProductCardSkeleton renders a loading placeholder that mimics ProductCard structure.
 * Used during initial page load or filtering operations.
 */
function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden" aria-hidden="true">
      {/* Image skeleton */}
      <div className="aspect-square w-full bg-muted animate-pulse" />

      {/* Content skeleton */}
      <div className="p-4 space-y-2">
        {/* Title line 1 */}
        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
        {/* Title line 2 */}
        <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
      </div>
    </div>
  );
}

/**
 * ProductGrid displays a responsive grid of ProductCard components.
 *
 * Features:
 * - Responsive grid layout: 1 col (mobile) → 2 cols (sm) → 3 cols (lg) → 4 cols (xl)
 * - Loading state with skeleton placeholders
 * - Empty state message when no products
 * - Customizable grid columns via `columns` prop
 *
 * @example
 * // Default responsive grid
 * <ProductGrid products={products} />
 *
 * @example
 * // Custom grid layout
 * <ProductGrid products={products} columns="grid-cols-2 md:grid-cols-4" />
 *
 * @example
 * // Loading state
 * <ProductGrid products={[]} loading={true} skeletonCount={12} />
 */
export function ProductGrid({
  products,
  loading = false,
  className,
  skeletonCount = 8,
  columns,
}: ProductGridProps) {
  // Loading state: show skeleton placeholders
  if (loading) {
    return (
      <div
        className={cn('grid gap-6', columns ?? DEFAULT_COLUMNS, className)}
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Loading products...</span>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state: no products to display
  if (products.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  // Populated state: render grid of ProductCards
  return (
    <div className={cn('grid gap-6', columns ?? DEFAULT_COLUMNS, className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
