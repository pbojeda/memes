'use client';

import { useRouter } from 'next/navigation';
import { ProductForm } from '@/components/admin/products/ProductForm';
import type { components } from '@/lib/api/types';

type Product = components['schemas']['Product'];

export default function NewProductPage() {
  const router = useRouter();

  function handleSuccess(product: Product) {
    router.push(`/admin/products/${product.id}/edit`);
  }

  return <ProductForm onSuccess={handleSuccess} />;
}
