'use client';

import { useState } from 'react';
import type { components } from '@/lib/api/types';
import { productTypeService } from '@/lib/services/productTypeService';
import { ApiException } from '@/lib/api/exceptions';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ProductType = components['schemas']['ProductType'];

interface DeleteProductTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productType: ProductType | null;
  onSuccess: () => void;
}

export function DeleteProductTypeDialog({
  open,
  onOpenChange,
  productType,
  onSuccess,
}: DeleteProductTypeDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!productType) return null;

  const hasProducts = (productType.productCount ?? 0) > 0;

  async function handleDelete() {
    if (!productType?.id) return;

    setError(null);
    setIsDeleting(true);
    try {
      await productTypeService.delete(productType.id);
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiException && err.status === 409) {
        setError('Cannot delete — this product type has associated products.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {productType.name}</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to delete this
            product type?
          </DialogDescription>
        </DialogHeader>

        {hasProducts && (
          <Alert variant="destructive">
            <AlertDescription>
              This product type has {productType.productCount} products
              associated with it. Remove the products first before deleting.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
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
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={hasProducts || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
