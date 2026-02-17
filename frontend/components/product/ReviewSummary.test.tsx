import { render, screen } from '@testing-library/react';
import { ReviewSummary } from './ReviewSummary';

jest.mock('lucide-react', () => ({
  Star: (props: Record<string, unknown>) => (
    <svg data-testid="star-icon" {...props} />
  ),
}));

describe('ReviewSummary', () => {
  it('should display average rating as fixed decimal (e.g., "4.5")', () => {
    render(
      <ReviewSummary
        averageRating={4.5}
        totalReviews={10}
        ratingDistribution={{ 5: 5, 4: 5, 3: 0, 2: 0, 1: 0 }}
      />
    );

    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('should render 5 filled stars when average is 5.0', () => {
    render(
      <ReviewSummary
        averageRating={5.0}
        totalReviews={10}
        ratingDistribution={{ 5: 10, 4: 0, 3: 0, 2: 0, 1: 0 }}
      />
    );

    const stars = screen.getAllByTestId('star-icon');
    expect(stars).toHaveLength(5);
    stars.forEach((star) => {
      expect(star).toHaveClass('fill-yellow-400');
      expect(star).toHaveClass('text-yellow-400');
    });
  });

  it('should render 4 filled stars when average is 4.3 (rounded)', () => {
    render(
      <ReviewSummary
        averageRating={4.3}
        totalReviews={10}
        ratingDistribution={{ 5: 4, 4: 4, 3: 2, 2: 0, 1: 0 }}
      />
    );

    const stars = screen.getAllByTestId('star-icon');
    expect(stars).toHaveLength(5);

    // First 4 stars should be filled (Math.round(4.3) = 4)
    for (let i = 0; i < 4; i++) {
      expect(stars[i]).toHaveClass('fill-yellow-400');
    }

    // Last star should be empty
    expect(stars[4]).not.toHaveClass('fill-yellow-400');
    expect(stars[4]).toHaveClass('text-muted-foreground');
  });

  it('should display singular "review" when totalReviews is 1', () => {
    render(
      <ReviewSummary
        averageRating={5}
        totalReviews={1}
        ratingDistribution={{ 5: 1, 4: 0, 3: 0, 2: 0, 1: 0 }}
      />
    );

    expect(screen.getByText(/based on 1 review$/i)).toBeInTheDocument();
  });

  it('should display plural "reviews" when totalReviews > 1', () => {
    render(
      <ReviewSummary
        averageRating={4.0}
        totalReviews={12}
        ratingDistribution={{ 5: 5, 4: 4, 3: 2, 2: 1, 1: 0 }}
      />
    );

    expect(screen.getByText(/based on 12 reviews/i)).toBeInTheDocument();
  });

  it('should render 5 distribution bars in descending order (5★ to 1★)', () => {
    render(
      <ReviewSummary
        averageRating={4.0}
        totalReviews={18}
        ratingDistribution={{ 5: 10, 4: 5, 3: 2, 2: 1, 1: 0 }}
      />
    );

    expect(screen.getByText('5★')).toBeInTheDocument();
    expect(screen.getByText('4★')).toBeInTheDocument();
    expect(screen.getByText('3★')).toBeInTheDocument();
    expect(screen.getByText('2★')).toBeInTheDocument();
    expect(screen.getByText('1★')).toBeInTheDocument();
  });

  it('should calculate bar widths proportional to counts (e.g., 50% for 5/10)', () => {
    const { container } = render(
      <ReviewSummary
        averageRating={4.0}
        totalReviews={10}
        ratingDistribution={{ 5: 5, 4: 3, 3: 2, 2: 0, 1: 0 }}
      />
    );

    // Find all bar elements with the bg-yellow-400 class
    const bars = container.querySelectorAll('.bg-yellow-400');

    // Check the width styles
    expect(bars[0]).toHaveStyle({ width: '50%' }); // 5★: 5/10 = 50%
    expect(bars[1]).toHaveStyle({ width: '30%' }); // 4★: 3/10 = 30%
    expect(bars[2]).toHaveStyle({ width: '20%' }); // 3★: 2/10 = 20%
    expect(bars[3]).toHaveStyle({ width: '0%' });  // 2★: 0/10 = 0%
    expect(bars[4]).toHaveStyle({ width: '0%' });  // 1★: 0/10 = 0%
  });

  it('should handle zero totalReviews without division by zero', () => {
    const { container } = render(
      <ReviewSummary
        averageRating={0}
        totalReviews={0}
        ratingDistribution={{ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }}
      />
    );

    expect(screen.getByText(/based on 0 reviews/i)).toBeInTheDocument();

    // All bars should have 0% width
    const bars = container.querySelectorAll('.bg-yellow-400');
    bars.forEach((bar) => {
      expect(bar).toHaveStyle({ width: '0%' });
    });
  });

  it('should handle missing distribution keys with default 0', () => {
    const { container } = render(
      <ReviewSummary
        averageRating={5.0}
        totalReviews={1}
        ratingDistribution={{ 5: 1 }} // Missing 4, 3, 2, 1
      />
    );

    // Should show counts for all ratings, with 0 for missing ones
    expect(screen.getByText('5★')).toBeInTheDocument();
    expect(screen.getByText('4★')).toBeInTheDocument();
    expect(screen.getByText('3★')).toBeInTheDocument();
    expect(screen.getByText('2★')).toBeInTheDocument();
    expect(screen.getByText('1★')).toBeInTheDocument();

    // Check counts - only 5★ should have count 1, rest should have 0
    const bars = container.querySelectorAll('.bg-yellow-400');
    expect(bars[0]).toHaveStyle({ width: '100%' }); // 5★: 1/1 = 100%
    expect(bars[1]).toHaveStyle({ width: '0%' });   // 4★: 0/1 = 0%
    expect(bars[2]).toHaveStyle({ width: '0%' });   // 3★: 0/1 = 0%
    expect(bars[3]).toHaveStyle({ width: '0%' });   // 2★: 0/1 = 0%
    expect(bars[4]).toHaveStyle({ width: '0%' });   // 1★: 0/1 = 0%
  });

  it('should apply custom className to root element', () => {
    const { container } = render(
      <ReviewSummary
        averageRating={4.5}
        totalReviews={10}
        ratingDistribution={{ 5: 5, 4: 5, 3: 0, 2: 0, 1: 0 }}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
