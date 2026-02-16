'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, getLocalizedName } from '@/lib/utils';
import type { components } from '@/lib/api/types';

type ProductType = components['schemas']['ProductType'];

export interface ProductFiltersValue {
  search?: string;
  typeSlug?: string;
  minPrice?: string;
  maxPrice?: string;
  isHot?: boolean;
  sort?: string;
}

interface ProductFiltersProps {
  value: ProductFiltersValue;
  onFiltersChange: (filters: Partial<ProductFiltersValue>) => void;
  types?: ProductType[];
  className?: string;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
] as const;

const TYPE_ALL_SENTINEL = '__all__';

export function ProductFilters({
  value,
  onFiltersChange,
  types,
  className,
}: ProductFiltersProps) {
  const hasActiveFilters = Boolean(
    value.search ||
      value.typeSlug ||
      value.minPrice ||
      value.maxPrice ||
      value.isHot ||
      (value.sort && value.sort !== 'newest')
  );

  const handleClearFilters = () => {
    onFiltersChange({
      search: undefined,
      typeSlug: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      isHot: undefined,
      sort: undefined,
    });
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end',
        className
      )}
    >
      {/* Search input */}
      <div className="flex-1 min-w-[200px]">
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            type="text"
            placeholder="Search products..."
            value={value.search ?? ''}
            onChange={(e) => onFiltersChange({ search: e.target.value || undefined })}
            className="pl-9"
          />
        </div>
      </div>

      {/* Product type select */}
      {types && types.length > 0 && (
        <div className="w-full md:w-[200px]">
          <Label htmlFor="type-select">Product Type</Label>
          <Select
            value={value.typeSlug ?? TYPE_ALL_SENTINEL}
            onValueChange={(val) =>
              onFiltersChange({
                typeSlug: val === TYPE_ALL_SENTINEL ? undefined : val,
              })
            }
          >
            <SelectTrigger id="type-select">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TYPE_ALL_SENTINEL}>All types</SelectItem>
              {types
                .filter((type) => type.slug)
                .map((type) => (
                  <SelectItem key={type.id} value={type.slug!}>
                    {getLocalizedName(type.name, type.slug!)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Min price */}
      <div className="w-full md:w-[120px]">
        <Label htmlFor="min-price">Min Price</Label>
        <Input
          id="min-price"
          type="number"
          placeholder="Min"
          value={value.minPrice ?? ''}
          onChange={(e) => onFiltersChange({ minPrice: e.target.value })}
          min="0"
          step="0.01"
        />
      </div>

      {/* Max price */}
      <div className="w-full md:w-[120px]">
        <Label htmlFor="max-price">Max Price</Label>
        <Input
          id="max-price"
          type="number"
          placeholder="Max"
          value={value.maxPrice ?? ''}
          onChange={(e) => onFiltersChange({ maxPrice: e.target.value })}
          min="0"
          step="0.01"
        />
      </div>

      {/* Sort select */}
      <div className="w-full md:w-[200px]">
        <Label htmlFor="sort-select">Sort By</Label>
        <Select
          value={value.sort ?? 'newest'}
          onValueChange={(val) =>
            onFiltersChange({ sort: val === 'newest' ? undefined : val })
          }
        >
          <SelectTrigger id="sort-select">
            <SelectValue placeholder="Newest" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hot checkbox */}
      <div className="flex items-center gap-2 h-9">
        <Checkbox
          id="hot-checkbox"
          checked={value.isHot === true}
          onCheckedChange={(checked) =>
            onFiltersChange({ isHot: checked ? true : undefined })
          }
        />
        <Label
          htmlFor="hot-checkbox"
          className="text-sm font-normal cursor-pointer"
        >
          Hot Products Only
        </Label>
      </div>

      {/* Clear filters button */}
      <div>
        <Button
          variant="ghost"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
          aria-label="Clear filters"
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>
    </div>
  );
}
