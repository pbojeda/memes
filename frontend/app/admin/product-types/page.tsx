'use client';

import { useEffect, useState, useCallback } from 'react';
import type { components } from '@/lib/api/types';
import { productTypeService } from '@/lib/services/productTypeService';
import { ProductTypesTable } from '@/components/admin/product-types/ProductTypesTable';
import { ProductTypeFormDialog } from '@/components/admin/product-types/ProductTypeFormDialog';
import { DeleteProductTypeDialog } from '@/components/admin/product-types/DeleteProductTypeDialog';

type ProductType = components['schemas']['ProductType'];

export default function ProductTypesPage() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProductType, setEditingProductType] = useState<
    ProductType | undefined
  >(undefined);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProductType, setDeletingProductType] =
    useState<ProductType | null>(null);

  const fetchProductTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productTypeService.getAll();
      setProductTypes(data);
    } catch {
      setError('Failed to load product types');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductTypes();
  }, [fetchProductTypes]);

  function handleCreate() {
    setEditingProductType(undefined);
    setIsFormOpen(true);
  }

  function handleEdit(productType: ProductType) {
    setEditingProductType(productType);
    setIsFormOpen(true);
  }

  function handleDelete(productType: ProductType) {
    setDeletingProductType(productType);
    setIsDeleteOpen(true);
  }

  function handleFormSuccess() {
    fetchProductTypes();
  }

  function handleDeleteSuccess() {
    fetchProductTypes();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Product Types</h1>

      <ProductTypesTable
        productTypes={productTypes}
        isLoading={isLoading}
        error={error}
        onRetry={fetchProductTypes}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ProductTypeFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        productType={editingProductType}
        onSuccess={handleFormSuccess}
      />

      <DeleteProductTypeDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        productType={deletingProductType}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
