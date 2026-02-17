'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { components, operations } from '@/lib/api/types';
import { adminProductService } from '@/lib/services/adminProductService';
import { getLocalizedName } from '@/lib/utils';
import { AdminProductsTable } from '@/components/admin/products/AdminProductsTable';
import { DeleteProductDialog } from '@/components/admin/products/DeleteProductDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Product = components['schemas']['Product'];
type PaginationMeta = components['schemas']['PaginationMeta'];
type ListProductsParams = NonNullable<operations['listProducts']['parameters']['query']>;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce ref
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Refs to avoid stale closures in effects
  const searchRef = useRef(search);
  const statusFilterRef = useRef(statusFilter);
  const currentPageRef = useRef(currentPage);
  searchRef.current = search;
  statusFilterRef.current = statusFilter;
  currentPageRef.current = currentPage;

  const buildParams = useCallback(
    (overrides?: { page?: number }): ListProductsParams => {
      const params: ListProductsParams = {
        page: overrides?.page ?? currentPageRef.current,
        limit: 20,
      };
      if (searchRef.current) params.search = searchRef.current;
      if (statusFilterRef.current === 'active') params.isActive = true;
      if (statusFilterRef.current === 'inactive') params.isActive = false;
      return params;
    },
    []
  );

  const fetchProducts = useCallback(async (params: ListProductsParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminProductService.list(params);
      setProducts(response.data ?? []);
      setMeta(response.meta ?? {});
    } catch {
      setError('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-fetch when page or status filter changes (immediate, no debounce)
  useEffect(() => {
    fetchProducts(buildParams());
  }, [currentPage, statusFilter, fetchProducts, buildParams]);

  // Re-fetch when search changes (debounced 300ms), reset to page 1
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchProducts(buildParams({ page: 1 }));
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [search, fetchProducts, buildParams]);

  const handleActivate = async (product: Product) => {
    if (!product.id) return;
    setActionLoadingId(product.id);
    setActionError(null);
    try {
      await adminProductService.activate(product.id);
      fetchProducts(buildParams());
    } catch {
      setActionError(`Failed to activate "${getLocalizedName(product.title)}"`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeactivate = async (product: Product) => {
    if (!product.id) return;
    setActionLoadingId(product.id);
    setActionError(null);
    try {
      await adminProductService.deactivate(product.id);
      fetchProducts(buildParams());
    } catch {
      setActionError(`Failed to deactivate "${getLocalizedName(product.title)}"`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteOpen(true);
  };

  const handleDeleteSuccess = () => {
    fetchProducts(buildParams());
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleStatusChange = (value: 'all' | 'active' | 'inactive') => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRetry = () => {
    fetchProducts(buildParams());
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Products</h1>

      {actionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <AdminProductsTable
        products={products}
        isLoading={isLoading}
        error={error}
        onRetry={handleRetry}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onDelete={handleDelete}
        actionLoadingId={actionLoadingId}
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        currentPage={currentPage}
        totalPages={meta.totalPages ?? 1}
        onPageChange={handlePageChange}
      />

      <DeleteProductDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        product={deletingProduct}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
