'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Pencil, Trash2, Power } from 'lucide-react';
import type { components } from '@/lib/api/types';
import { getLocalizedName, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';

type Product = components['schemas']['Product'];

const STATUS_ALL_SENTINEL = '__all__';
const STATUS_ACTIVE = 'active';
const STATUS_INACTIVE = 'inactive';

interface AdminProductsTableProps {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onActivate: (product: Product) => void;
  onDeactivate: (product: Product) => void;
  onDelete: (product: Product) => void;
  actionLoadingId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusChange: (value: 'all' | 'active' | 'inactive') => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function AdminProductsTable({
  products,
  isLoading,
  error,
  onRetry,
  onActivate,
  onDeactivate,
  onDelete,
  actionLoadingId,
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  currentPage,
  totalPages,
  onPageChange,
}: AdminProductsTableProps) {
  if (isLoading) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading products...</span>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
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

  const selectValue =
    statusFilter === STATUS_ACTIVE
      ? STATUS_ACTIVE
      : statusFilter === STATUS_INACTIVE
        ? STATUS_INACTIVE
        : STATUS_ALL_SENTINEL;

  function handleStatusChange(value: string) {
    if (value === STATUS_ALL_SENTINEL) {
      onStatusChange('all');
    } else if (value === STATUS_ACTIVE) {
      onStatusChange('active');
    } else if (value === STATUS_INACTIVE) {
      onStatusChange('inactive');
    }
  }

  const filterToolbar = (
    <div className="flex items-center gap-4 mb-4">
      <Input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
      <Select value={selectValue} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={STATUS_ALL_SENTINEL}>All</SelectItem>
          <SelectItem value={STATUS_ACTIVE}>Active</SelectItem>
          <SelectItem value={STATUS_INACTIVE}>Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  if (products.length === 0) {
    return (
      <div>
        {filterToolbar}
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {filterToolbar}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Hot</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const isActionLoading = actionLoadingId === product.id;
            const productTitle = getLocalizedName(product.title);
            return (
              <TableRow key={product.id}>
                <TableCell>
                  {product.primaryImage ? (
                    <Image
                      src={product.primaryImage.url ?? ''}
                      alt={product.primaryImage.altText ?? productTitle}
                      width={40}
                      height={40}
                      className="rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{productTitle}</TableCell>
                <TableCell>
                  {product.productType
                    ? getLocalizedName(product.productType.name)
                    : '—'}
                </TableCell>
                <TableCell>
                  {product.price !== undefined ? formatPrice(product.price) : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={product.isActive ? 'default' : 'secondary'}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {product.isHot && <Badge variant="outline">Hot</Badge>}
                </TableCell>
                <TableCell>
                  {product.createdAt
                    ? new Date(product.createdAt).toLocaleDateString()
                    : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/products/${product.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit ${productTitle}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    {product.isActive ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeactivate(product)}
                        disabled={isActionLoading}
                        aria-label={`Deactivate ${productTitle}`}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onActivate(product)}
                        disabled={isActionLoading}
                        aria-label={`Activate ${productTitle}`}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(product)}
                      disabled={isActionLoading}
                      aria-label={`Delete ${productTitle}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
