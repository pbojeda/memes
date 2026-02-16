'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductFilters, type ProductFiltersValue } from '@/components/product/ProductFilters';
import { Pagination } from '@/components/ui/pagination';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { productService } from '@/lib/services/productService';
import { productTypeService } from '@/lib/services/productTypeService';
import type { components, operations } from '@/lib/api/types';

type Product = components['schemas']['Product'];
type ProductType = components['schemas']['ProductType'];
type PaginationMeta = components['schemas']['PaginationMeta'];
type ListProductsParams = NonNullable<operations['listProducts']['parameters']['query']>;

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({});
  const [types, setTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derive filters from URL
  const filtersFromUrl = useMemo<ProductFiltersValue>(() => ({
    search: searchParams.get('search') || undefined,
    typeSlug: searchParams.get('typeSlug') || undefined,
    minPrice: searchParams.get('minPrice') || undefined,
    maxPrice: searchParams.get('maxPrice') || undefined,
    isHot: searchParams.get('isHot') === 'true' ? true : undefined,
    sort: searchParams.get('sort') || undefined,
  }), [searchParams]);

  const currentPage = Number(searchParams.get('page')) || 1;

  // Build API params from URL state
  const buildParams = useCallback((): ListProductsParams => {
    const params: ListProductsParams = {
      page: currentPage,
      limit: 12,
    };

    if (filtersFromUrl.search) params.search = filtersFromUrl.search;
    if (filtersFromUrl.typeSlug) params.typeSlug = filtersFromUrl.typeSlug;
    if (filtersFromUrl.minPrice) {
      const min = parseFloat(filtersFromUrl.minPrice);
      if (!isNaN(min)) params.minPrice = min;
    }
    if (filtersFromUrl.maxPrice) {
      const max = parseFloat(filtersFromUrl.maxPrice);
      if (!isNaN(max)) params.maxPrice = max;
    }
    if (filtersFromUrl.isHot) params.isHot = true;
    if (filtersFromUrl.sort) params.sort = filtersFromUrl.sort as ListProductsParams['sort'];

    return params;
  }, [currentPage, filtersFromUrl]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await productService.list(buildParams());
      setProducts(response.data ?? []);
      setMeta(response.meta ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
      setMeta({});
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  // Fetch products when searchParams change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Fetch product types once
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const typesData = await productTypeService.getAll();
        setTypes(typesData);
      } catch {
        // Silently fail — filters work with empty types array
      }
    };

    fetchTypes();
  }, []);

  // Handler for filter changes
  const handleFiltersChange = useCallback(
    (newFilters: Partial<ProductFiltersValue>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Merge filters
      const merged = { ...filtersFromUrl, ...newFilters };

      // Update or remove params
      if (merged.search) {
        params.set('search', merged.search);
      } else {
        params.delete('search');
      }

      if (merged.typeSlug) {
        params.set('typeSlug', merged.typeSlug);
      } else {
        params.delete('typeSlug');
      }

      if (merged.minPrice) {
        params.set('minPrice', merged.minPrice);
      } else {
        params.delete('minPrice');
      }

      if (merged.maxPrice) {
        params.set('maxPrice', merged.maxPrice);
      } else {
        params.delete('maxPrice');
      }

      if (merged.isHot) {
        params.set('isHot', 'true');
      } else {
        params.delete('isHot');
      }

      if (merged.sort) {
        params.set('sort', merged.sort);
      } else {
        params.delete('sort');
      }

      // Reset page to 1 when filters change
      params.delete('page');

      router.push(`/products?${params.toString()}`);
    },
    [searchParams, router, filtersFromUrl]
  );

  // Handler for page changes
  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());

      if (page === 1) {
        params.delete('page');
      } else {
        params.set('page', String(page));
      }

      router.push(`/products?${params.toString()}`);
    },
    [searchParams, router]
  );

  // Handler for retry button
  const handleRetry = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Catalog</h1>

      {/* Filters */}
      <div className="mb-8">
        <ProductFilters
          value={filtersFromUrl}
          onFiltersChange={handleFiltersChange}
          types={types}
        />
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load products. Please try again.
          </AlertDescription>
          <Button onClick={handleRetry} variant="outline" className="mt-4">
            Retry
          </Button>
        </Alert>
      )}

      {/* Products grid */}
      {!error && (
        <>
          <ProductGrid products={products} loading={loading} />

          {/* Pagination */}
          {meta.totalPages && meta.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={meta.page ?? 1}
                totalPages={meta.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<ProductGrid products={[]} loading={true} />}>
      <CatalogContent />
    </Suspense>
  );
}
