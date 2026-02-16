'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { components } from '@/lib/api/types';

type ProductImage = components['schemas']['ProductImage'];

interface ImageGalleryProps {
  images?: ProductImage[];
  className?: string;
}

/**
 * ImageGallery displays product images with a main view and thumbnail navigation.
 *
 * Features:
 * - Main image view with next/image optimization
 * - Thumbnail strip for quick navigation
 * - Keyboard navigation (arrow keys)
 * - Previous/Next arrow buttons
 * - Handles no-image and single-image edge cases
 * - Sorted by sortOrder, then isPrimary
 *
 * @example
 * <ImageGallery images={product.images} />
 */
export function ImageGallery({ images, className }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Sort images by sortOrder ascending, then isPrimary descending
  // useMemo must be called before any early returns (rules of hooks)
  const sortedImages = useMemo(() => {
    if (!images) return [];
    return [...images].sort((a, b) => {
      const sortOrderA = a.sortOrder ?? Infinity;
      const sortOrderB = b.sortOrder ?? Infinity;

      if (sortOrderA !== sortOrderB) {
        return sortOrderA - sortOrderB;
      }

      // Tiebreaker: isPrimary true comes first
      const primaryA = a.isPrimary ? 1 : 0;
      const primaryB = b.isPrimary ? 1 : 0;
      return primaryB - primaryA;
    });
  }, [images]);

  // Handle empty/undefined images
  if (sortedImages.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full bg-muted text-muted-foreground"
        aria-label="No product images"
      >
        <ImageOff className="h-16 w-16" />
      </div>
    );
  }

  const currentImage = sortedImages[selectedIndex];
  const hasMultipleImages = sortedImages.length > 1;
  const isFirstImage = selectedIndex === 0;
  const isLastImage = selectedIndex === sortedImages.length - 1;

  const handlePrevious = () => {
    if (!isFirstImage) {
      setSelectedIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (!isLastImage) {
      setSelectedIndex((prev) => prev + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrevious();
    }
  };

  return (
    <div
      className={cn('space-y-4', className)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Product image gallery"
    >
      {/* Main image with navigation arrows */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <Image
          src={currentImage.url ?? ''}
          alt={currentImage.altText ?? ''}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />

        {/* Previous/Next arrow buttons (only shown when multiple images) */}
        {hasMultipleImages && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={isFirstImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
              aria-label="Previous image"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={isLastImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
              aria-label="Next image"
            >
              <ChevronRight />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnail strip (only shown when multiple images) */}
      {hasMultipleImages && (
        <div className="flex gap-2 overflow-x-auto">
          {sortedImages.map((image, index) => {
            const isActive = index === selectedIndex;
            return (
              <button
                key={image.id ?? index}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'relative h-20 w-20 flex-shrink-0 overflow-hidden bg-muted',
                  isActive && 'ring-2 ring-primary'
                )}
                aria-label={`Thumbnail ${index + 1}`}
              >
                <Image
                  src={image.url ?? ''}
                  alt={image.altText ?? ''}
                  width={80}
                  height={80}
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
