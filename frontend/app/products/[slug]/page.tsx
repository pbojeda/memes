'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ImageGallery } from '@/components/product/ImageGallery';
import { ReviewList } from '@/components/product/ReviewList';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { productService } from '@/lib/services/productService';
import { ApiException } from '@/lib/api/exceptions';
import { formatPrice, getLocalizedName } from '@/lib/utils';
import type { components } from '@/lib/api/types';

type ProductDetail = components['schemas']['ProductDetail'];

export default function ProductDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const response = await productService.getBySlug(slug);
      setProduct(response.data ?? null);
    } catch (err) {
      if (err instanceof ApiException && err.status === 404) {
        setNotFound(true);
      } else {
        setError(
          err instanceof Error ? err.message : 'Failed to load product'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleRetry = useCallback(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Loading state
  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8" role="status">
        <span className="sr-only">Loading product...</span>
        <div className="animate-pulse h-6 w-32 bg-muted rounded mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <div className="animate-pulse aspect-square bg-muted rounded" />
          <div className="space-y-4">
            <div className="animate-pulse h-8 w-48 bg-muted rounded" />
            <div className="animate-pulse h-6 w-24 bg-muted rounded" />
            <div className="animate-pulse h-24 bg-muted rounded" />
          </div>
        </div>
      </main>
    );
  }

  // 404 state
  if (notFound) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <p className="text-muted-foreground mb-6">
            The product you are looking for does not exist or has been removed.
          </p>
          <Link href="/products">
            <Button variant="outline">Back to catalog</Button>
          </Link>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load product. Please try again.
          </AlertDescription>
          <Button onClick={handleRetry} variant="outline" className="mt-4">
            Retry
          </Button>
        </Alert>
      </main>
    );
  }

  // No product yet (shouldn't happen but TypeScript guard)
  if (!product) {
    return null;
  }

  // Populated state
  const showCompareAtPrice =
    product.compareAtPrice !== undefined &&
    product.price !== undefined &&
    product.compareAtPrice > product.price;

  const showSizes =
    product.productType?.hasSizes === true &&
    (product.availableSizes?.length ?? 0) > 0;

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        {/* Left column: ImageGallery */}
        <ImageGallery images={product.images} />

        {/* Right column: Product info */}
        <div className="space-y-4">
          {/* Hot badge + product type */}
          <div className="flex items-center gap-2">
            {product.isHot && (
              <Badge variant="destructive">Hot</Badge>
            )}
            {product.productType?.name && (
              <span className="text-sm text-muted-foreground">
                {getLocalizedName(product.productType.name, '')}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold">
            {getLocalizedName(product.title, '')}
          </h1>

          {/* Price row */}
          <div className="flex items-center gap-3">
            {product.price !== undefined && (
              <span className="text-2xl font-bold">
                {formatPrice(product.price)}
              </span>
            )}
            {showCompareAtPrice && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-muted-foreground">
              {getLocalizedName(product.description, '')}
            </p>
          )}

          {/* Color */}
          {product.color && (
            <div>
              <span className="font-medium">Color: </span>
              <span>{product.color}</span>
            </div>
          )}

          {/* Sizes (only when productType.hasSizes && availableSizes non-empty) */}
          {showSizes && (
            <div>
              <span className="font-medium block mb-2">Sizes:</span>
              <div className="flex gap-2 flex-wrap">
                {product.availableSizes!.map((size) => (
                  <Badge key={size} variant="outline">
                    {size}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews section */}
      {product.id && (
        <div className="mt-12">
          <ReviewList productId={product.id} />
        </div>
      )}
    </main>
  );
}
