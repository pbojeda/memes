import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => mockSearchParams),
  useRouter: jest.fn(() => ({ push: mockPush })),
}));

// Mock services
jest.mock('../../lib/services/productService', () => ({
  productService: { list: jest.fn() },
}));
jest.mock('../../lib/services/productTypeService', () => ({
  productTypeService: { getAll: jest.fn() },
}));

// Mock child components as simple divs (isolate page logic)
jest.mock('../../components/product/ProductGrid', () => ({
  ProductGrid: ({ products, loading }: { products: unknown[]; loading?: boolean }) => (
    <div data-testid="product-grid" data-loading={String(!!loading)} data-count={products.length} />
  ),
}));

jest.mock('../../components/product/ProductFilters', () => ({
  ProductFilters: ({ value, onFiltersChange, types }: any) => (
    <div data-testid="product-filters" data-types-count={types?.length ?? 0}>
      <span data-testid="filter-values">{JSON.stringify(value)}</span>
      <button data-testid="change-search" onClick={() => onFiltersChange({ search: 'test-query' })} />
      <button data-testid="change-type" onClick={() => onFiltersChange({ typeSlug: 'tshirts' })} />
      <button data-testid="clear-filters" onClick={() => onFiltersChange({ search: undefined, typeSlug: undefined })} />
    </div>
  ),
}));

jest.mock('../../components/ui/pagination', () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }: any) =>
    totalPages > 1 ? (
      <div data-testid="pagination" data-current={currentPage} data-total={totalPages}>
        <button data-testid="go-to-page-2" onClick={() => onPageChange(2)} />
        <button data-testid="go-to-page-3" onClick={() => onPageChange(3)} />
      </div>
    ) : null,
}));

// Import after mocks
import CatalogPage from './page';
import { productService } from '../../lib/services/productService';
import { productTypeService } from '../../lib/services/productTypeService';

describe('CatalogPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    // Default successful responses
    (productService.list as jest.Mock).mockResolvedValue({
      data: [{ id: 'p1', title: 'Test Product', slug: 'test', price: 10 }],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });
    (productTypeService.getAll as jest.Mock).mockResolvedValue([
      { id: 't1', name: 'T-Shirts', slug: 'tshirts' },
    ]);
  });

  describe('Initial rendering', () => {
    it('should render "Catalog" heading', async () => {
      render(<CatalogPage />);

      expect(screen.getByRole('heading', { name: /catalog/i })).toBeInTheDocument();
    });

    it('should render ProductFilters component', async () => {
      render(<CatalogPage />);

      await waitFor(() => {
        expect(screen.getByTestId('product-filters')).toBeInTheDocument();
      });
    });

    it('should render ProductGrid component', async () => {
      render(<CatalogPage />);

      await waitFor(() => {
        expect(screen.getByTestId('product-grid')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', async () => {
      render(<CatalogPage />);

      const grid = screen.getByTestId('product-grid');
      expect(grid).toHaveAttribute('data-loading', 'true');
    });

    it('should call productService.list() on mount', async () => {
      render(<CatalogPage />);

      await waitFor(() => {
        expect(productService.list).toHaveBeenCalledTimes(1);
      });
    });

    it('should call productTypeService.getAll() on mount', async () => {
      render(<CatalogPage />);

      await waitFor(() => {
        expect(productTypeService.getAll).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Data loading success', () => {
    it('should pass fetched products to ProductGrid', async () => {
      (productService.list as jest.Mock).mockResolvedValue({
        data: [
          { id: 'p1', title: 'Product 1', slug: 'product-1', price: 10 },
          { id: 'p2', title: 'Product 2', slug: 'product-2', price: 20 },
        ],
        meta: { page: 1, limit: 12, total: 2, totalPages: 1 },
      });

      render(<CatalogPage />);

      await waitFor(() => {
        const grid = screen.getByTestId('product-grid');
        expect(grid).toHaveAttribute('data-count', '2');
        expect(grid).toHaveAttribute('data-loading', 'false');
      });
    });

    it('should pass product types to ProductFilters', async () => {
      (productTypeService.getAll as jest.Mock).mockResolvedValue([
        { id: 't1', name: 'T-Shirts', slug: 'tshirts' },
        { id: 't2', name: 'Hoodies', slug: 'hoodies' },
      ]);

      render(<CatalogPage />);

      await waitFor(() => {
        const filters = screen.getByTestId('product-filters');
        expect(filters).toHaveAttribute('data-types-count', '2');
      });
    });

    it('should show Pagination when totalPages > 1', async () => {
      (productService.list as jest.Mock).mockResolvedValue({
        data: [{ id: 'p1', title: 'Product 1', slug: 'product-1', price: 10 }],
        meta: { page: 1, limit: 12, total: 25, totalPages: 3 },
      });

      render(<CatalogPage />);

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
      });
    });

    it('should hide Pagination when totalPages <= 1', async () => {
      (productService.list as jest.Mock).mockResolvedValue({
        data: [{ id: 'p1', title: 'Product 1', slug: 'product-1', price: 10 }],
        meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
      });

      render(<CatalogPage />);

      await waitFor(() => {
        const grid = screen.getByTestId('product-grid');
        expect(grid).toHaveAttribute('data-loading', 'false');
      });

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('should pass empty products array to ProductGrid when no results', async () => {
      (productService.list as jest.Mock).mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 12, total: 0, totalPages: 0 },
      });

      render(<CatalogPage />);

      await waitFor(() => {
        const grid = screen.getByTestId('product-grid');
        expect(grid).toHaveAttribute('data-count', '0');
        expect(grid).toHaveAttribute('data-loading', 'false');
      });
    });
  });

  describe('URL param sync (read)', () => {
    it('should read search from URL params and pass to ProductFilters', async () => {
      mockSearchParams = new URLSearchParams('search=tshirt');

      render(<CatalogPage />);

      await waitFor(() => {
        const filterValues = screen.getByTestId('filter-values');
        expect(filterValues.textContent).toContain('"search":"tshirt"');
      });
    });

    it('should read page from URL and pass to productService.list', async () => {
      mockSearchParams = new URLSearchParams('page=2');

      render(<CatalogPage />);

      await waitFor(() => {
        expect(productService.list).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });
    });

    it('should read all filter params from URL', async () => {
      mockSearchParams = new URLSearchParams(
        'search=tshirt&typeSlug=tshirts&minPrice=10&maxPrice=50&isHot=true&sort=price_asc'
      );

      render(<CatalogPage />);

      await waitFor(() => {
        const filterValues = screen.getByTestId('filter-values');
        const filters = JSON.parse(filterValues.textContent || '{}');
        expect(filters.search).toBe('tshirt');
        expect(filters.typeSlug).toBe('tshirts');
        expect(filters.minPrice).toBe('10');
        expect(filters.maxPrice).toBe('50');
        expect(filters.isHot).toBe(true);
        expect(filters.sort).toBe('price_asc');
      });

      await waitFor(() => {
        expect(productService.list).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'tshirt',
            typeSlug: 'tshirts',
            minPrice: 10,
            maxPrice: 50,
            isHot: true,
            sort: 'price_asc',
          })
        );
      });
    });
  });

  describe('URL param sync (write)', () => {
    it('should update URL when filters change (search)', async () => {
      const user = userEvent.setup();
      render(<CatalogPage />);

      await waitFor(() => {
        expect(screen.getByTestId('product-filters')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('change-search'));

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('search=test-query'));
    });

    it('should reset page to 1 when filters change', async () => {
      const user = userEvent.setup();
      mockSearchParams = new URLSearchParams('page=3');

      render(<CatalogPage />);

      await waitFor(() => {
        expect(screen.getByTestId('product-filters')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('change-type'));

      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).toContain('typeSlug=tshirts');
      expect(callArg).not.toContain('page=');
    });

    it('should update URL when page changes via Pagination', async () => {
      const user = userEvent.setup();
      (productService.list as jest.Mock).mockResolvedValue({
        data: [{ id: 'p1', title: 'Product 1', slug: 'product-1', price: 10 }],
        meta: { page: 1, limit: 12, total: 25, totalPages: 3 },
      });

      render(<CatalogPage />);

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('go-to-page-2'));

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=2'));
    });
  });

  describe('Error state', () => {
    it('should show error alert when productService.list rejects', async () => {
      (productService.list as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<CatalogPage />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load products/i)).toBeInTheDocument();
      });
    });

    it('should show retry button in error state', async () => {
      (productService.list as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<CatalogPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should refetch on retry button click', async () => {
      const user = userEvent.setup();
      (productService.list as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<CatalogPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      // Reset mock to succeed on retry
      (productService.list as jest.Mock).mockResolvedValue({
        data: [{ id: 'p1', title: 'Product 1', slug: 'product-1', price: 10 }],
        meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
      });

      await user.click(screen.getByRole('button', { name: /retry/i }));

      await waitFor(() => {
        expect(productService.list).toHaveBeenCalledTimes(2);
        expect(screen.queryByText(/failed to load products/i)).not.toBeInTheDocument();
      });
    });
  });
});
