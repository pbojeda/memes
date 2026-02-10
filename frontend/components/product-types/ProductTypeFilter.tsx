'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ButtonGroupSkeleton } from '@/components/ui/button-group-skeleton';
import { productTypeService } from '@/lib/services/productTypeService';
import { cn } from '@/lib/utils';
import type { components } from '@/lib/api/types';

type ProductType = components['schemas']['ProductType'];

interface ProductTypeFilterProps {
  /** Currently selected product type slug, or null for "All" */
  value: string | null;
  /** Callback fired when selection changes. Receives slug or null for "All" */
  onChange: (slug: string | null) => void;
  /** Optional className for container */
  className?: string;
}

export function ProductTypeFilter({ value, onChange, className }: ProductTypeFilterProps) {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductTypes();
  }, []);

  const fetchProductTypes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productTypeService.getAll({ isActive: true });
      // Sort by sortOrder (ensure consistent order)
      const sorted = [...data].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      setProductTypes(sorted);
    } catch (err) {
      setError('Failed to load product types. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <ButtonGroupSkeleton
        count={3}
        label="Loading product types..."
        className={className}
      />
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProductTypes}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (productTypes.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground">
          No product types available.
        </p>
      </div>
    );
  }

  // Main render with product type buttons
  return (
    <div
      role="group"
      aria-label="Filter by product type"
      className={cn('flex flex-wrap gap-2', className)}
    >
      <Button
        variant={value === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange(null)}
        aria-pressed={value === null}
      >
        All
      </Button>
      {productTypes.map((type) => (
        <Button
          key={type.id}
          variant={value === type.slug ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(type.slug ?? null)}
          aria-pressed={value === type.slug}
        >
          {type.name ?? type.slug}
        </Button>
      ))}
    </div>
  );
}
