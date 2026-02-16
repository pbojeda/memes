import { render, screen } from '@testing-library/react';
import { ReviewCard } from './ReviewCard';
import { createReview } from './testing/fixtures';

jest.mock('lucide-react', () => ({
  Star: (props: Record<string, unknown>) => (
    <svg data-testid="star-icon" {...props} />
  ),
}));

describe('ReviewCard', () => {
  beforeEach(() => {
    // Mock Date.now() to a fixed date for relative date tests
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-02-16T00:00:00Z').getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render author name', () => {
    render(<ReviewCard review={createReview({ authorName: 'Jane Smith' })} />);

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should render 5 filled stars when rating is 5', () => {
    render(<ReviewCard review={createReview({ rating: 5 })} />);

    const stars = screen.getAllByTestId('star-icon');
    expect(stars).toHaveLength(5);
    stars.forEach((star) => {
      expect(star).toHaveClass('fill-yellow-400');
      expect(star).toHaveClass('text-yellow-400');
    });
  });

  it('should render 3 filled and 2 empty stars when rating is 3', () => {
    render(<ReviewCard review={createReview({ rating: 3 })} />);

    const stars = screen.getAllByTestId('star-icon');
    expect(stars).toHaveLength(5);

    // First 3 stars should be filled
    for (let i = 0; i < 3; i++) {
      expect(stars[i]).toHaveClass('fill-yellow-400');
      expect(stars[i]).toHaveClass('text-yellow-400');
    }

    // Last 2 stars should be empty
    for (let i = 3; i < 5; i++) {
      expect(stars[i]).not.toHaveClass('fill-yellow-400');
      expect(stars[i]).toHaveClass('text-muted-foreground');
    }
  });

  it('should render 0 filled stars when rating is 0 or undefined', () => {
    render(<ReviewCard review={createReview({ rating: 0 })} />);

    const stars = screen.getAllByTestId('star-icon');
    expect(stars).toHaveLength(5);
    stars.forEach((star) => {
      expect(star).not.toHaveClass('fill-yellow-400');
      expect(star).toHaveClass('text-muted-foreground');
    });
  });

  it('should render comment text', () => {
    render(<ReviewCard review={createReview({ comment: 'Amazing quality!' })} />);

    expect(screen.getByText('Amazing quality!')).toBeInTheDocument();
  });

  it('should render relative date (e.g., "6 days ago")', () => {
    render(<ReviewCard review={createReview({ createdAt: '2026-02-10T12:00:00Z' })} />);

    expect(screen.getByText(/6 days ago/i)).toBeInTheDocument();
  });

  it('should handle undefined createdAt gracefully (show empty string)', () => {
    render(<ReviewCard review={createReview({ createdAt: undefined })} />);

    // Shouldn't crash and shouldn't show any date text
    const dateElements = screen.queryByText(/ago/i);
    expect(dateElements).not.toBeInTheDocument();
  });

  it('should handle undefined comment gracefully', () => {
    render(<ReviewCard review={createReview({ comment: undefined })} />);

    // Should not crash and should not show comment text
    expect(screen.queryByText(/comment/i)).not.toBeInTheDocument();
  });

  it('should apply custom className to root element', () => {
    const { container } = render(
      <ReviewCard review={createReview()} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
