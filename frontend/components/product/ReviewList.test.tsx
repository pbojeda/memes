import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewList } from './ReviewList';
import { reviewService } from '../../lib/services/reviewService';
import { createReviewListResponse, createReview } from './testing/fixtures';

jest.mock('../../lib/services/reviewService', () => ({
  reviewService: {
    list: jest.fn(),
  },
}));

const mockReviewService = reviewService as jest.Mocked<typeof reviewService>;

describe('ReviewList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading skeleton initially', () => {
    // Mock that never resolves
    mockReviewService.list.mockImplementation(
      () => new Promise(() => {})
    );

    render(<ReviewList productId="prod-123" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/loading reviews/i)).toBeInTheDocument();
  });

  it('should display empty state when no reviews', async () => {
    mockReviewService.list.mockResolvedValueOnce({
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 5,
        totalPages: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      },
    });

    render(<ReviewList productId="prod-123" />);

    await waitFor(() => {
      expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument();
    });
  });

  it('should render ReviewSummary with correct props when reviews exist', async () => {
    const mockResponse = createReviewListResponse();
    mockReviewService.list.mockResolvedValueOnce(mockResponse);

    render(<ReviewList productId="prod-123" />);

    await waitFor(() => {
      expect(screen.getByText('4.0')).toBeInTheDocument(); // Average rating
      expect(screen.getByText(/based on 3 reviews/i)).toBeInTheDocument();
    });
  });

  it('should render ReviewCard for each review', async () => {
    const mockResponse = createReviewListResponse({
      data: [
        createReview({ id: 'rev-1', authorName: 'Alice' }),
        createReview({ id: 'rev-2', authorName: 'Bob' }),
        createReview({ id: 'rev-3', authorName: 'Charlie' }),
      ],
    });
    mockReviewService.list.mockResolvedValueOnce(mockResponse);

    render(<ReviewList productId="prod-123" />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });
  });

  it('should call reviewService.list with productId and pagination params', async () => {
    mockReviewService.list.mockResolvedValueOnce(createReviewListResponse());

    render(<ReviewList productId="prod-456" />);

    await waitFor(() => {
      expect(mockReviewService.list).toHaveBeenCalledWith('prod-456', {
        page: 1,
        limit: 5,
      });
    });
  });

  it('should show Pagination when totalPages > 1', async () => {
    mockReviewService.list.mockResolvedValueOnce(
      createReviewListResponse({
        meta: {
          total: 15,
          page: 1,
          limit: 5,
          totalPages: 3,
          averageRating: 4.0,
          ratingDistribution: { 5: 10, 4: 3, 3: 1, 2: 1, 1: 0 },
        },
      })
    );

    render(<ReviewList productId="prod-123" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/pagination/i)).toBeInTheDocument();
    });
  });

  it('should hide Pagination when totalPages <= 1', async () => {
    mockReviewService.list.mockResolvedValueOnce(
      createReviewListResponse({
        meta: {
          total: 3,
          page: 1,
          limit: 5,
          totalPages: 1,
          averageRating: 4.0,
          ratingDistribution: { 5: 1, 4: 1, 3: 1, 2: 0, 1: 0 },
        },
      })
    );

    render(<ReviewList productId="prod-123" />);

    await waitFor(() => {
      expect(screen.getByText(/based on 3 reviews/i)).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/pagination/i)).not.toBeInTheDocument();
  });

  it('should update page state and refetch when pagination clicked', async () => {
    const user = userEvent.setup();

    // First call - page 1
    mockReviewService.list.mockResolvedValueOnce(
      createReviewListResponse({
        data: [createReview({ id: 'rev-1', authorName: 'Page 1 User' })],
        meta: {
          total: 10,
          page: 1,
          limit: 5,
          totalPages: 2,
          averageRating: 4.0,
          ratingDistribution: { 5: 5, 4: 3, 3: 2, 2: 0, 1: 0 },
        },
      })
    );

    // Second call - page 2
    mockReviewService.list.mockResolvedValueOnce(
      createReviewListResponse({
        data: [createReview({ id: 'rev-2', authorName: 'Page 2 User' })],
        meta: {
          total: 10,
          page: 2,
          limit: 5,
          totalPages: 2,
          averageRating: 4.0,
          ratingDistribution: { 5: 5, 4: 3, 3: 2, 2: 0, 1: 0 },
        },
      })
    );

    render(<ReviewList productId="prod-123" />);

    // Wait for first page to load
    await waitFor(() => {
      expect(screen.getByText('Page 1 User')).toBeInTheDocument();
    });

    // Click page 2
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    // Wait for second page to load
    await waitFor(() => {
      expect(mockReviewService.list).toHaveBeenCalledWith('prod-123', {
        page: 2,
        limit: 5,
      });
    });
  });

  it('should display error Alert when API call fails', async () => {
    mockReviewService.list.mockRejectedValueOnce(new Error('Network error'));

    render(<ReviewList productId="prod-123" />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('should apply custom className to root container', async () => {
    mockReviewService.list.mockResolvedValueOnce(createReviewListResponse());

    const { container } = render(
      <ReviewList productId="prod-123" className="custom-class" />
    );

    await waitFor(() => {
      expect(screen.getByText(/based on 3 reviews/i)).toBeInTheDocument();
    });

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
