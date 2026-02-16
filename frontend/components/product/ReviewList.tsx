'use client';

import { useState, useEffect } from 'react';
import { reviewService } from '@/lib/services/reviewService';
import { ReviewSummary } from './ReviewSummary';
import { ReviewCard } from './ReviewCard';
import { Pagination } from '@/components/ui/pagination';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { components } from '@/lib/api/types';

type ReviewListResponse = components['schemas']['ReviewListResponse'];

interface ReviewListProps {
  productId: string;
  className?: string;
}

export function ReviewList({ productId, className }: ReviewListProps) {
  const [page, setPage] = useState(1);
  const [reviewData, setReviewData] = useState<ReviewListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await reviewService.list(productId, { page, limit: 5 });
        setReviewData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [productId, page]);

  // Loading state
  if (loading) {
    return (
      <div className={cn('space-y-4', className)} role="status">
        <span className="sr-only">Loading reviews...</span>
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="animate-pulse bg-muted h-32 rounded-lg"
          />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (!reviewData?.data || reviewData.data.length === 0) {
    return (
      <div className={cn('text-center text-muted-foreground py-8', className)}>
        No reviews yet
      </div>
    );
  }

  // Populated state
  const { data: reviews, meta } = reviewData;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary */}
      {meta && (
        <ReviewSummary
          averageRating={meta.averageRating ?? 0}
          totalReviews={meta.total ?? 0}
          ratingDistribution={{
            1: meta.ratingDistribution?.[1] ?? 0,
            2: meta.ratingDistribution?.[2] ?? 0,
            3: meta.ratingDistribution?.[3] ?? 0,
            4: meta.ratingDistribution?.[4] ?? 0,
            5: meta.ratingDistribution?.[5] ?? 0,
          }}
        />
      )}

      {/* Review cards */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
