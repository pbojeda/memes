import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './pagination';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronLeft: (props: Record<string, unknown>) => <svg data-testid="chevron-left" {...props} />,
  ChevronRight: (props: Record<string, unknown>) => <svg data-testid="chevron-right" {...props} />,
  MoreHorizontal: (props: Record<string, unknown>) => <svg data-testid="more-horizontal" {...props} />,
}));

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // RENDERING
  describe('rendering', () => {
    it('does not render when totalPages <= 1', () => {
      const { container } = render(<Pagination {...defaultProps} totalPages={1} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders when totalPages > 1', () => {
      render(<Pagination {...defaultProps} />);
      expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
    });

    it('renders Previous and Next buttons', () => {
      render(<Pagination {...defaultProps} />);
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Pagination {...defaultProps} className="custom-class" />);
      const nav = screen.getByRole('navigation', { name: /pagination/i });
      expect(nav).toHaveClass('custom-class');
    });
  });

  // BUTTON STATE
  describe('button state', () => {
    it('disables Previous button on first page', () => {
      render(<Pagination {...defaultProps} currentPage={1} />);
      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    it('disables Next button on last page', () => {
      render(<Pagination {...defaultProps} currentPage={5} totalPages={5} />);
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('enables both buttons on middle page', () => {
      render(<Pagination {...defaultProps} currentPage={3} totalPages={5} />);
      const prevButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  // PAGE NUMBERS
  describe('page numbers', () => {
    it('renders all page numbers for small total (<=7 pages)', () => {
      render(<Pagination {...defaultProps} totalPages={5} />);
      expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 3' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 5' })).toBeInTheDocument();
    });

    it('highlights current page with aria-current="page"', () => {
      render(<Pagination {...defaultProps} currentPage={3} />);
      const currentPageButton = screen.getByRole('button', { name: 'Go to page 3' });
      expect(currentPageButton).toHaveAttribute('aria-current', 'page');
    });

    it('renders ellipsis for many pages', () => {
      render(<Pagination {...defaultProps} currentPage={5} totalPages={10} />);
      // Should show: Prev, 1, ..., 4, 5, 6, ..., 10, Next
      expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 5' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 6' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument();
      // Check for ellipsis (MoreHorizontal icons)
      const ellipses = screen.getAllByTestId('more-horizontal');
      expect(ellipses.length).toBeGreaterThan(0);
    });
  });

  // INTERACTIONS
  describe('interactions', () => {
    it('clicking a page number calls onPageChange(page)', async () => {
      const user = userEvent.setup();
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} currentPage={1} onPageChange={onPageChange} />);

      await user.click(screen.getByRole('button', { name: 'Go to page 3' }));
      expect(onPageChange).toHaveBeenCalledWith(3);
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });

    it('Previous click calls onPageChange(currentPage - 1)', async () => {
      const user = userEvent.setup();
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />);

      await user.click(screen.getByRole('button', { name: /previous/i }));
      expect(onPageChange).toHaveBeenCalledWith(2);
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });

    it('Next click calls onPageChange(currentPage + 1)', async () => {
      const user = userEvent.setup();
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />);

      await user.click(screen.getByRole('button', { name: /next/i }));
      expect(onPageChange).toHaveBeenCalledWith(4);
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });

    it('clicking current page does NOT fire onPageChange', async () => {
      const user = userEvent.setup();
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />);

      await user.click(screen.getByRole('button', { name: 'Go to page 3' }));
      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  // ACCESSIBILITY
  describe('accessibility', () => {
    it('has nav element with aria-label="Pagination"', () => {
      render(<Pagination {...defaultProps} />);
      expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
    });

    it('uses aria-current="page" on current page button', () => {
      render(<Pagination {...defaultProps} currentPage={2} />);
      const currentPageButton = screen.getByRole('button', { name: 'Go to page 2' });
      expect(currentPageButton).toHaveAttribute('aria-current', 'page');

      // Other page buttons should NOT have aria-current
      const page1Button = screen.getByRole('button', { name: 'Go to page 1' });
      expect(page1Button).not.toHaveAttribute('aria-current');
    });
  });
});
