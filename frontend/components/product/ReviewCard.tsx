import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { components } from '@/lib/api/types';

type Review = components['schemas']['Review'];

interface ReviewCardProps {
  review: Review;
  className?: string;
}

function formatRelativeDate(isoDate?: string): string {
  if (!isoDate) return '';

  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (diffDays === 0) return rtf.format(0, 'day'); // "today"
  if (diffDays < 30) return rtf.format(-diffDays, 'day'); // "5 days ago"

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return rtf.format(-diffMonths, 'month'); // "2 months ago"

  const diffYears = Math.floor(diffMonths / 12);
  return rtf.format(-diffYears, 'year'); // "1 year ago"
}

export function ReviewCard({ review, className }: ReviewCardProps) {
  const rating = review.rating ?? 0;

  return (
    <div className={cn('border rounded-lg p-4 space-y-2', className)}>
      {/* Author name */}
      {review.authorName && (
        <p className="font-semibold">{review.authorName}</p>
      )}

      {/* Star rating */}
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => {
          const isFilled = i < rating;
          return (
            <Star
              key={i}
              className={cn(
                'h-4 w-4',
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              )}
            />
          );
        })}
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-sm text-muted-foreground">{review.comment}</p>
      )}

      {/* Relative date */}
      {review.createdAt && (
        <p className="text-xs text-muted-foreground">
          {formatRelativeDate(review.createdAt)}
        </p>
      )}
    </div>
  );
}
