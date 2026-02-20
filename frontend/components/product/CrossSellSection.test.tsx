import { render, screen, waitFor } from '@testing-library/react';
import { CrossSellSection } from './CrossSellSection';
import { productService } from '../../lib/services/productService';
import { createProducts } from './testing/fixtures';

// Mock productService with relative path
jest.mock('../../lib/services/productService', () => ({
  productService: {
    getRelated: jest.fn(),
  },
}));

// Mock ProductGrid with relative path
jest.mock('./ProductGrid', () => ({
  ProductGrid: jest.fn(({ products, loading, columns, skeletonCount }) => (
    <div
      data-testid="product-grid"
      data-loading={loading}
      data-product-count={products.length}
      data-columns={columns}
      data-skeleton-count={skeletonCount}
    >
      {products.map((p: { id: string }) => (
        <div key={p.id}>{p.id}</div>
      ))}
    </div>
  )),
}));

const mockProductService = productService as jest.Mocked<typeof productService>;

describe('CrossSellSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading state', () => {
    it('should render ProductGrid with loading=true initially', async () => {
      // Never-resolving promise to stay in loading state
      mockProductService.getRelated.mockReturnValueOnce(new Promise(() => {}));

      render(<CrossSellSection productId="prod-1" />);

      const grid = screen.getByTestId('product-grid');
      expect(grid).toHaveAttribute('data-loading', 'true');
    });

    it('should render "You May Also Like" heading', () => {
      mockProductService.getRelated.mockReturnValueOnce(new Promise(() => {}));

      render(<CrossSellSection productId="prod-1" />);

      expect(screen.getByText('You May Also Like')).toBeInTheDocument();
    });

    it('should pass skeletonCount=4 and columns to ProductGrid', () => {
      mockProductService.getRelated.mockReturnValueOnce(new Promise(() => {}));

      render(<CrossSellSection productId="prod-1" />);

      const grid = screen.getByTestId('product-grid');
      expect(grid).toHaveAttribute('data-skeleton-count', '4');
      expect(grid).toHaveAttribute('data-columns', 'grid-cols-2 md:grid-cols-4');
    });
  });

  describe('populated state', () => {
    it('should render ProductGrid with fetched products after load', async () => {
      const mockProducts = createProducts(3);
      mockProductService.getRelated.mockResolvedValueOnce({
        data: mockProducts,
        meta: { total: 3, page: 1, limit: 4, totalPages: 1 },
      });

      render(<CrossSellSection productId="prod-1" />);

      await waitFor(() => {
        const grid = screen.getByTestId('product-grid');
        expect(grid).toHaveAttribute('data-loading', 'false');
        expect(grid).toHaveAttribute('data-product-count', '3');
      });
    });

    it('should call productService.getRelated with productId and default limit 4', async () => {
      const mockProducts = createProducts(2);
      mockProductService.getRelated.mockResolvedValueOnce({
        data: mockProducts,
        meta: { total: 2, page: 1, limit: 4, totalPages: 1 },
      });

      render(<CrossSellSection productId="prod-123" />);

      await waitFor(() => {
        expect(mockProductService.getRelated).toHaveBeenCalledWith('prod-123', 4);
      });
    });

    it('should pass custom limit when provided', async () => {
      const mockProducts = createProducts(6);
      mockProductService.getRelated.mockResolvedValueOnce({
        data: mockProducts,
        meta: { total: 6, page: 1, limit: 6, totalPages: 1 },
      });

      render(<CrossSellSection productId="prod-1" limit={6} />);

      await waitFor(() => {
        expect(mockProductService.getRelated).toHaveBeenCalledWith('prod-1', 6);
      });
    });
  });

  describe('empty state', () => {
    it('should render nothing when API returns empty array', async () => {
      mockProductService.getRelated.mockResolvedValueOnce({
        data: [],
        meta: { total: 0, page: 1, limit: 4, totalPages: 0 },
      });

      const { container } = render(<CrossSellSection productId="prod-1" />);

      await waitFor(() => {
        expect(container.innerHTML).toBe('');
      });
    });
  });

  describe('error state', () => {
    it('should render nothing when fetch fails', async () => {
      mockProductService.getRelated.mockRejectedValueOnce(
        new Error('Network error')
      );

      const { container } = render(<CrossSellSection productId="prod-1" />);

      await waitFor(() => {
        expect(container.innerHTML).toBe('');
      });
    });
  });

  describe('re-fetch on prop change', () => {
    it('should re-fetch when productId prop changes', async () => {
      const mockProducts1 = createProducts(2);
      const mockProducts2 = createProducts(3);

      mockProductService.getRelated
        .mockResolvedValueOnce({
          data: mockProducts1,
          meta: { total: 2, page: 1, limit: 4, totalPages: 1 },
        })
        .mockResolvedValueOnce({
          data: mockProducts2,
          meta: { total: 3, page: 1, limit: 4, totalPages: 1 },
        });

      const { rerender } = render(<CrossSellSection productId="prod-1" />);

      await waitFor(() => {
        expect(mockProductService.getRelated).toHaveBeenCalledWith('prod-1', 4);
      });

      rerender(<CrossSellSection productId="prod-2" />);

      await waitFor(() => {
        expect(mockProductService.getRelated).toHaveBeenCalledWith('prod-2', 4);
      });
    });
  });

  describe('className', () => {
    it('should apply className to wrapper section', async () => {
      const mockProducts = createProducts(2);
      mockProductService.getRelated.mockResolvedValueOnce({
        data: mockProducts,
        meta: { total: 2, page: 1, limit: 4, totalPages: 1 },
      });

      const { container } = render(
        <CrossSellSection productId="prod-1" className="custom-class" />
      );

      await waitFor(() => {
        const section = container.querySelector('section');
        expect(section).toHaveClass('custom-class');
      });
    });
  });
});
