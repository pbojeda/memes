'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { components } from '@/lib/api/types';
import { adminProductService } from '@/lib/services/adminProductService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ProductImage = components['schemas']['ProductImage'];

interface ProductImageManagerProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
}

export function ProductImageManager({
  productId,
  images,
  onImagesChange,
}: ProductImageManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const sortedImages = [...images].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  async function handleAddImage() {
    const url = newImageUrl.trim();
    if (!url) return;

    try {
      const parsed = new URL(url);
      if (!['https:', 'http:'].includes(parsed.protocol)) {
        setApiError('URL must use https or http');
        return;
      }
    } catch {
      setApiError('Invalid URL format');
      return;
    }

    setActionLoadingId('adding');
    setApiError(null);
    try {
      const newImage = await adminProductService.addImage(productId, {
        url,
        isPrimary: images.length === 0,
        sortOrder: images.length,
      });
      onImagesChange([...images, newImage]);
      setNewImageUrl('');
      setIsAdding(false);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to add image');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDeleteImage(imageId: string) {
    setActionLoadingId(imageId);
    setApiError(null);
    try {
      await adminProductService.deleteImage(productId, imageId);
      onImagesChange(images.filter((img) => img.id !== imageId));
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to delete image');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleSetPrimary(imageId: string) {
    setActionLoadingId(imageId);
    setApiError(null);
    try {
      await adminProductService.updateImage(productId, imageId, { isPrimary: true });
      onImagesChange(
        images.map((img) => ({
          ...img,
          isPrimary: img.id === imageId,
        }))
      );
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to update image');
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {apiError && (
        <Alert variant="destructive">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {sortedImages.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground">No images yet</p>
      )}

      {sortedImages.map((image) => (
        <div
          key={image.id}
          className="flex items-center gap-4 rounded-md border p-3"
        >
          <Image
            src={image.url ?? ''}
            alt={image.altText ?? ''}
            width={80}
            height={80}
            className="rounded object-cover"
          />
          <div className="flex-1">
            {image.isPrimary && <Badge>Primary</Badge>}
          </div>
          <div className="flex gap-2">
            {!image.isPrimary && image.id && (
              <Button
                variant="outline"
                size="sm"
                disabled={actionLoadingId === image.id}
                onClick={() => handleSetPrimary(image.id!)}
              >
                Set Primary
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              disabled={!image.id || actionLoadingId === image.id}
              onClick={() => image.id && handleDeleteImage(image.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}

      {isAdding ? (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Image URL"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
          />
          <Button
            size="sm"
            disabled={!newImageUrl.trim() || actionLoadingId === 'adding'}
            onClick={handleAddImage}
          >
            Add
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAdding(false);
              setNewImageUrl('');
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setIsAdding(true)}>
          Add Image
        </Button>
      )}
    </div>
  );
}
