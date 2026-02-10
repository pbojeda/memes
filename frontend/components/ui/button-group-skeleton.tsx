import { cn } from '@/lib/utils';

const SKELETON_WIDTHS = ['w-16', 'w-20', 'w-24', 'w-18', 'w-22'];

interface ButtonGroupSkeletonProps {
  /** Number of skeleton items to render */
  count?: number;
  /** Screen reader label for loading state */
  label?: string;
  /** Optional className for container */
  className?: string;
}

export function ButtonGroupSkeleton({
  count = 3,
  label = 'Loading...',
  className,
}: ButtonGroupSkeletonProps) {
  return (
    <div
      className={cn('flex gap-2', className)}
      role="status"
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-9 bg-muted animate-pulse rounded-md',
            SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]
          )}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
