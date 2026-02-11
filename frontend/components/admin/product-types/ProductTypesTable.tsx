'use client';

import { Pencil, Trash2, Plus } from 'lucide-react';
import type { components } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type ProductType = components['schemas']['ProductType'];

interface ProductTypesTableProps {
  productTypes: ProductType[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onEdit: (productType: ProductType) => void;
  onDelete: (productType: ProductType) => void;
  onCreate: () => void;
}

export function ProductTypesTable({
  productTypes,
  isLoading,
  error,
  onRetry,
  onEdit,
  onDelete,
  onCreate,
}: ProductTypesTableProps) {
  if (isLoading) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading product types...</span>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 bg-muted animate-pulse rounded"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (productTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No product types found.</p>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Product Type
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Product Types</h2>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Product Type
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Has Sizes</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Sort Order</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productTypes.map((pt) => (
            <TableRow key={pt.id}>
              <TableCell className="font-medium">{pt.name}</TableCell>
              <TableCell>{pt.slug}</TableCell>
              <TableCell>{pt.hasSizes ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <Badge variant={pt.isActive ? 'default' : 'secondary'}>
                  {pt.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>{pt.sortOrder}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(pt)}
                    aria-label={`Edit ${pt.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(pt)}
                    aria-label={`Delete ${pt.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
