'use client';

import { useState, useEffect } from 'react';
import { ProductGrid } from './ProductGrid';
import { productService } from '@/lib/services/productService';
import type { components } from '@/lib/api/types';

type Product = components['schemas']['Product'];

interface CrossSellSectionProps {
  productId: string;
  limit?: number;
  className?: string;
}

/**
 * CrossSellSection displays related products for a given product.
 *
 * Features:
 * - Self-contained component that fetches its own data
 * - Uses ProductGrid for display with custom 4-column layout
 * - Shows loading skeletons while fetching
 * - Graceful degradation: renders nothing on error or empty results
 *
 * @example
 * <CrossSellSection productId="prod-123" />
 *
 * @example
 * <CrossSellSection productId="prod-123" limit={6} className="mt-8" />
 */
export function CrossSellSection({
  productId,
  limit = 4,
  className,
}: CrossSellSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRelated = async () => {
      setLoading(true);
      try {
        const response = await productService.getRelated(productId, limit);
        if (!cancelled) {
          setProducts(response.data ?? []);
        }
      } catch (error) {
        // Graceful degradation: cross-sell is not critical
        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRelated();

    return () => {
      cancelled = true;
    };
  }, [productId, limit]);

  // Render nothing when no products (empty or error)
  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className={className}>
      <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
      <ProductGrid
        products={products}
        loading={loading}
        columns="grid-cols-2 md:grid-cols-4"
        skeletonCount={limit}
      />
    </section>
  );
}
