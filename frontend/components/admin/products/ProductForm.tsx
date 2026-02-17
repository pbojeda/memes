'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { components } from '@/lib/api/types';
import { adminProductService } from '@/lib/services/adminProductService';
import { productTypeService } from '@/lib/services/productTypeService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductImageManager } from './ProductImageManager';

type Product = components['schemas']['Product'];
type ProductImage = components['schemas']['ProductImage'];
type ProductType = components['schemas']['ProductType'];
type CreateProductRequest = components['schemas']['CreateProductRequest'];
type UpdateProductRequest = components['schemas']['UpdateProductRequest'];

type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL';
const SIZES: Size[] = ['S', 'M', 'L', 'XL', 'XXL'];

interface ProductFormProps {
  product?: Product;
  initialImages?: ProductImage[];
  onSuccess?: (product: Product) => void;
}

interface FormState {
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  productTypeId: string;
  price: string;
  compareAtPrice: string;
  color: string;
  availableSizes: string[];
  isActive: boolean;
  isHot: boolean;
  memeSourceUrl: string;
  memeIsOriginal: boolean;
  priceChangeReason: string;
}

interface FormErrors {
  titleEs?: string;
  productTypeId?: string;
  price?: string;
}

function getInitialFormState(product?: Product): FormState {
  if (product) {
    return {
      titleEs: product.title ?? '',
      titleEn: '',
      descriptionEs: product.description ?? '',
      descriptionEn: '',
      productTypeId: product.productType?.id ?? '',
      price: product.price?.toString() ?? '',
      compareAtPrice: product.compareAtPrice?.toString() ?? '',
      color: product.color ?? 'white',
      availableSizes: product.availableSizes ?? [],
      isActive: product.isActive ?? true,
      isHot: product.isHot ?? false,
      memeSourceUrl: '',
      memeIsOriginal: false,
      priceChangeReason: '',
    };
  }
  return {
    titleEs: '',
    titleEn: '',
    descriptionEs: '',
    descriptionEn: '',
    productTypeId: '',
    price: '',
    compareAtPrice: '',
    color: 'white',
    availableSizes: [],
    isActive: true,
    isHot: false,
    memeSourceUrl: '',
    memeIsOriginal: false,
    priceChangeReason: '',
  };
}

function validate(state: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!state.titleEs.trim()) {
    errors.titleEs = 'Title (Spanish) is required';
  }
  if (!state.productTypeId) {
    errors.productTypeId = 'Product type is required';
  }
  if (!state.price.trim()) {
    errors.price = 'Price is required';
  } else if (parseFloat(state.price) < 0) {
    errors.price = 'Price must be 0 or greater';
  }
  return errors;
}

export function ProductForm({ product, initialImages, onSuccess }: ProductFormProps) {
  const isEditMode = !!product;
  const originalPrice = useRef<number | null>(product?.price ?? null);

  const [formState, setFormState] = useState<FormState>(() => getInitialFormState(product));
  const [images, setImages] = useState<ProductImage[]>(initialImages ?? []);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    productTypeService
      .getAll({ isActive: true })
      .then(setProductTypes)
      .catch(() => setApiError('Failed to load product types'))
      .finally(() => setIsLoadingTypes(false));
  }, []);

  const priceChanged =
    isEditMode &&
    formState.price.trim() !== '' &&
    parseFloat(formState.price) !== originalPrice.current;

  function handleFieldChange(field: keyof FormState, value: string | boolean | string[]) {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }

  function handleSizeToggle(size: string, checked: boolean) {
    setFormState((prev) => ({
      ...prev,
      availableSizes: checked
        ? [...prev.availableSizes, size]
        : prev.availableSizes.filter((s) => s !== size),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    const validationErrors = validate(formState);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      let result: Product;

      if (isEditMode && product?.id) {
        const updateData: UpdateProductRequest = {
          title: {
            es: formState.titleEs.trim(),
            ...(formState.titleEn.trim() ? { en: formState.titleEn.trim() } : {}),
          },
          description: {
            es: formState.descriptionEs.trim(),
            ...(formState.descriptionEn.trim() ? { en: formState.descriptionEn.trim() } : {}),
          },
          productTypeId: formState.productTypeId,
          price: parseFloat(formState.price),
          color: formState.color.trim() || undefined,
          // isActive is managed via activate/deactivate endpoints, not PATCH
          isHot: formState.isHot,
          memeSourceUrl: formState.memeSourceUrl.trim() || undefined,
          memeIsOriginal: formState.memeIsOriginal || undefined,
          ...(formState.availableSizes.length > 0 ? { availableSizes: formState.availableSizes } : {}),
          ...(formState.compareAtPrice.trim() ? { compareAtPrice: parseFloat(formState.compareAtPrice) } : {}),
          ...(priceChanged && formState.priceChangeReason.trim()
            ? { priceChangeReason: formState.priceChangeReason.trim() }
            : {}),
        };
        result = await adminProductService.update(product.id, updateData);
      } else {
        const createData: CreateProductRequest = {
          productTypeId: formState.productTypeId,
          title: {
            es: formState.titleEs.trim(),
            ...(formState.titleEn.trim() ? { en: formState.titleEn.trim() } : {}),
          },
          description: {
            es: formState.descriptionEs.trim(),
            ...(formState.descriptionEn.trim() ? { en: formState.descriptionEn.trim() } : {}),
          },
          price: parseFloat(formState.price),
          color: formState.color.trim() || 'white',
          isActive: formState.isActive,
          isHot: formState.isHot,
          ...(formState.availableSizes.length > 0 ? { availableSizes: formState.availableSizes as Size[] } : {}),
          ...(formState.compareAtPrice.trim() ? { compareAtPrice: parseFloat(formState.compareAtPrice) } : {}),
          ...(formState.memeSourceUrl.trim() ? { memeSourceUrl: formState.memeSourceUrl.trim() } : {}),
          ...(formState.memeIsOriginal ? { memeIsOriginal: true } : {}),
        };
        result = await adminProductService.create(createData);
      }

      onSuccess?.(result);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="outline" size="sm">
            Back to Products
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {isEditMode ? 'Edit Product' : 'Create Product'}
        </h1>
      </div>

      {apiError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titleEs">Title (Spanish)</Label>
            <Input
              id="titleEs"
              value={formState.titleEs}
              onChange={(e) => handleFieldChange('titleEs', e.target.value)}
            />
            {errors.titleEs && (
              <p className="text-sm text-destructive">{errors.titleEs}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="titleEn">Title (English)</Label>
            <Input
              id="titleEn"
              value={formState.titleEn}
              onChange={(e) => handleFieldChange('titleEn', e.target.value)}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descriptionEs">Description (Spanish)</Label>
            <Input
              id="descriptionEs"
              value={formState.descriptionEs}
              onChange={(e) => handleFieldChange('descriptionEs', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descriptionEn">Description (English)</Label>
            <Input
              id="descriptionEn"
              value={formState.descriptionEn}
              onChange={(e) => handleFieldChange('descriptionEn', e.target.value)}
            />
          </div>
        </div>

        {/* Product Type */}
        <div className="space-y-2">
          <Label>Product Type</Label>
          <Select
            value={formState.productTypeId || undefined}
            onValueChange={(value) => handleFieldChange('productTypeId', value)}
            disabled={isLoadingTypes}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a product type" />
            </SelectTrigger>
            <SelectContent>
              {productTypes.filter((pt) => pt.id).map((pt) => (
                <SelectItem key={pt.id} value={pt.id!}>
                  {pt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.productTypeId && (
            <p className="text-sm text-destructive">{errors.productTypeId}</p>
          )}
        </div>

        {/* Price */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formState.price}
              onChange={(e) => handleFieldChange('price', e.target.value)}
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="compareAtPrice">Compare at Price</Label>
            <Input
              id="compareAtPrice"
              type="number"
              step="0.01"
              min="0"
              value={formState.compareAtPrice}
              onChange={(e) => handleFieldChange('compareAtPrice', e.target.value)}
            />
          </div>
        </div>

        {/* Price change reason (edit mode only) */}
        {priceChanged && (
          <div className="space-y-2">
            <Label htmlFor="priceChangeReason">Price Change Reason</Label>
            <Input
              id="priceChangeReason"
              value={formState.priceChangeReason}
              onChange={(e) => handleFieldChange('priceChangeReason', e.target.value)}
              placeholder="Reason for price change (for audit)"
            />
          </div>
        )}

        {/* Color */}
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            value={formState.color}
            onChange={(e) => handleFieldChange('color', e.target.value)}
          />
        </div>

        {/* Sizes */}
        <div className="space-y-2">
          <Label>Available Sizes</Label>
          <div className="flex gap-4">
            {SIZES.map((size) => (
              <div key={size} className="flex items-center gap-2">
                <Checkbox
                  id={`size-${size}`}
                  checked={formState.availableSizes.includes(size)}
                  onCheckedChange={(checked) => handleSizeToggle(size, checked === true)}
                />
                <Label htmlFor={`size-${size}`}>{size}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Boolean flags */}
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="isActive"
              checked={formState.isActive}
              onCheckedChange={(checked) => handleFieldChange('isActive', checked === true)}
              disabled={isEditMode}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isHot"
              checked={formState.isHot}
              onCheckedChange={(checked) => handleFieldChange('isHot', checked === true)}
            />
            <Label htmlFor="isHot">Hot</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="memeIsOriginal"
              checked={formState.memeIsOriginal}
              onCheckedChange={(checked) => handleFieldChange('memeIsOriginal', checked === true)}
            />
            <Label htmlFor="memeIsOriginal">Original Meme</Label>
          </div>
        </div>

        {/* Meme source URL */}
        <div className="space-y-2">
          <Label htmlFor="memeSourceUrl">Meme Source URL</Label>
          <Input
            id="memeSourceUrl"
            value={formState.memeSourceUrl}
            onChange={(e) => handleFieldChange('memeSourceUrl', e.target.value)}
            placeholder="https://..."
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? isEditMode
              ? 'Saving...'
              : 'Creating...'
            : isEditMode
              ? 'Save'
              : 'Create'}
        </Button>
      </form>

      {/* Image manager (edit mode only) */}
      {isEditMode && product?.id && (
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">Images</h2>
          <ProductImageManager
            productId={product.id}
            images={images}
            onImagesChange={setImages}
          />
        </div>
      )}
    </div>
  );
}
