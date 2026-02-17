import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  className?: string;
}

export function ReviewSummary({
  averageRating,
  totalReviews,
  ratingDistribution,
  className,
}: ReviewSummaryProps) {
  const filledStars = Math.round(averageRating);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Average rating section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-4xl font-bold">{averageRating.toFixed(1)}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => {
              const isFilled = i < filledStars;
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
        </div>
        <p className="text-sm text-muted-foreground">
          Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Distribution bars */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = ratingDistribution[rating] ?? 0;
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

          return (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-sm w-8">{rating}★</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
