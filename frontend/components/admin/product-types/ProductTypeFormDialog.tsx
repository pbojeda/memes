'use client';

import { useState, useEffect } from 'react';
import type { components } from '@/lib/api/types';
import { getLocalizedName } from '@/lib/utils';
import { productTypeService } from '@/lib/services/productTypeService';
import { ApiException } from '@/lib/api/exceptions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ProductType = components['schemas']['ProductType'];

interface ProductTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productType?: ProductType;
  onSuccess: () => void;
}

interface FormErrors {
  name?: string;
  slug?: string;
  sortOrder?: string;
}

export function ProductTypeFormDialog({
  open,
  onOpenChange,
  productType,
  onSuccess,
}: ProductTypeFormDialogProps) {
  const isEditMode = !!productType;

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [hasSizes, setHasSizes] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (productType) {
        setName(getLocalizedName(productType.name));
        setSlug(productType.slug ?? '');
        setHasSizes(productType.hasSizes ?? false);
        setIsActive(productType.isActive ?? true);
        setSortOrder(productType.sortOrder ?? 0);
      } else {
        setName('');
        setSlug('');
        setHasSizes(false);
        setIsActive(true);
        setSortOrder(0);
      }
      setErrors({});
      setApiError(null);
      setIsSubmitting(false);
    }
  }, [open, productType]);

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!slug.trim()) {
      newErrors.slug = 'Slug is required';
    }
    if (sortOrder < 0) {
      newErrors.sortOrder = 'Sort order must be 0 or greater';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const data = {
        name: { es: name.trim() },
        slug: slug.trim(),
        hasSizes,
        isActive,
        sortOrder,
      };

      if (isEditMode && productType?.id) {
        await productTypeService.update(productType.id, data);
      } else {
        await productTypeService.create(data);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiException && err.status === 409) {
        setApiError('A product type with this slug already exists');
      } else if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Product Type' : 'Create Product Type'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the product type details.'
              : 'Fill in the details to create a new product type.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. T-shirts"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. tshirts"
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              type="number"
              value={sortOrder}
              onChange={(e) => {
                const parsed = parseInt(e.target.value, 10);
                setSortOrder(Number.isNaN(parsed) ? 0 : parsed);
              }}
            />
            {errors.sortOrder && (
              <p className="text-sm text-destructive">{errors.sortOrder}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="hasSizes"
              checked={hasSizes}
              onCheckedChange={(checked) => setHasSizes(checked === true)}
            />
            <Label htmlFor="hasSizes">Has Sizes</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            <Label htmlFor="isActive">Is Active</Label>
          </div>

          {apiError && (
            <p className="text-sm text-destructive" role="alert">
              {apiError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditMode
                  ? 'Saving...'
                  : 'Creating...'
                : isEditMode
                  ? 'Save'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
