'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import type { components } from '@/lib/api/types';
import { adminProductService } from '@/lib/services/adminProductService';
import { ProductForm } from '@/components/admin/products/ProductForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type Product = components['schemas']['Product'];
type ProductImage = components['schemas']['ProductImage'];

export default function EditProductPage() {
  const params = useParams<{ productId: string }>();
  const productId = params.productId;

  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProduct = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedProduct, fetchedImages] = await Promise.all([
        adminProductService.getById(productId),
        adminProductService.listImages(productId),
      ]);
      setProduct(fetchedProduct);
      setImages(fetchedImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const handleSuccess = useCallback((updatedProduct: Product) => {
    setProduct(updatedProduct);
    setSuccessMessage('Product updated successfully');
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMessage(null), 5000);
  }, []);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadProduct}>Retry</Button>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div>
      {successMessage && (
        <Alert className="mb-4 border-green-500 text-green-700">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      <ProductForm
        product={product}
        initialImages={images}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
