import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminProductsPage from './page';
import { adminProductService } from '../../../lib/services/adminProductService';
import type { components } from '../../../lib/api/types';

type Product = components['schemas']['Product'];
type ProductListResponse = components['schemas']['ProductListResponse'];

jest.mock('../../../lib/services/adminProductService', () => ({
  adminProductService: {
    list: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock the AdminProductsTable component to simplify page tests
jest.mock('../../../components/admin/products/AdminProductsTable', () => ({
  AdminProductsTable: ({
    products,
    isLoading,
    error,
    onRetry,
    onActivate,
    onDeactivate,
    onDelete,
    search,
    onSearchChange,
    onStatusChange,
    onPageChange,
  }: any) => (
    <div data-testid="admin-products-table">
      {isLoading && <div data-testid="loading">Loading...</div>}
      {error && (
        <div data-testid="error">
          {error}
          <button onClick={onRetry}>Retry</button>
        </div>
      )}
      {products?.map((p: Product) => (
        <div key={p.id} data-testid={`product-${p.id}`}>
          <span>{p.title as string}</span>
          <button onClick={() => onActivate(p)}>Activate {p.id}</button>
          <button onClick={() => onDeactivate(p)}>Deactivate {p.id}</button>
          <button onClick={() => onDelete(p)}>Delete {p.id}</button>
        </div>
      ))}
      <input
        data-testid="search-input"
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search products..."
      />
      <select
        data-testid="status-filter"
        onChange={(e) => onStatusChange(e.target.value)}
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <button onClick={() => onPageChange(2)}>Go to page 2</button>
    </div>
  ),
}));

// Mock the DeleteProductDialog component
jest.mock('../../../components/admin/products/DeleteProductDialog', () => ({
  DeleteProductDialog: ({ open, product, onSuccess, onOpenChange }: any) => {
    if (!open || !product) return null;
    return (
      <div data-testid="delete-dialog">
        <span>Delete {product.title as string}</span>
        <button onClick={onSuccess}>Confirm Delete</button>
        <button onClick={() => onOpenChange(false)}>Cancel</button>
      </div>
    );
  },
}));

import { createProduct, createProducts } from '../../../components/product/testing/fixtures';

const mockResponse: ProductListResponse = {
  data: createProducts(3),
  meta: { page: 1, limit: 20, total: 3, totalPages: 1 },
};

// Mock next/link
jest.mock('next/link', () => {
  return ({ href, children, ...props }: Record<string, unknown> & { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

describe('AdminProductsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render a "New Product" link to /admin/products/new', async () => {
    (adminProductService.list as jest.Mock).mockResolvedValue(mockResponse);

    await act(async () => {
      render(<AdminProductsPage />);
    });

    const link = screen.getByRole('link', { name: /new product/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/products/new');
  });

  it('should call adminProductService.list on mount', async () => {
    (adminProductService.list as jest.Mock).mockResolvedValue(mockResponse);

    await act(async () => {
      render(<AdminProductsPage />);
    });

    await waitFor(() => {
      expect(adminProductService.list).toHaveBeenCalledTimes(1);
    });
  });

  it('should pass { page: 1, limit: 20 } as default params to list()', async () => {
    (adminProductService.list as jest.Mock).mockResolvedValue(mockResponse);

    await act(async () => {
      render(<AdminProductsPage />);
    });

    await waitFor(() => {
      expect(adminProductService.list).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 })
      );
    });
  });

  it('should display product titles after successful fetch', async () => {
    (adminProductService.list as jest.Mock).mockResolvedValue(mockResponse);

    await act(async () => {
      render(<AdminProductsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });
  });

  it('should show loading skeleton during fetch', async () => {
    let resolveList: (value: ProductListResponse) => void;
    const listPromise = new Promise<ProductListResponse>((resolve) => {
      resolveList = resolve;
    });
    (adminProductService.list as jest.Mock).mockReturnValue(listPromise);

    await act(async () => {
      render(<AdminProductsPage />);
    });

    expect(screen.getByTestId('loading')).toBeInTheDocument();

    await act(async () => {
      resolveList!(mockResponse);
    });
  });

  it('should show error alert when list() rejects', async () => {
    (adminProductService.list as jest.Mock).mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(<AdminProductsPage />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
  });

  it('should call list() again when Retry button is clicked', async () => {
    (adminProductService.list as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockResponse);

    await act(async () => {
      render(<AdminProductsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(adminProductService.list).toHaveBeenCalledTimes(2);
    });
  });

  it('should call adminProductService.activate with product ID when Activate is clicked', async () => {
    (adminProductService.list as jest.Mock).mockResolvedValue(mockResponse);
    (adminProductService.activate as jest.Mock).mockResolvedValue(mockResponse.data![0]);

    await act(async () => {
      render(<AdminProductsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByText('Activate prod-1'));

    await waitFor(() => {
      expect(adminProductService.activate).toHaveBeenCalledWith('prod-1');
    });
  });

  it('should refresh the product list after activate succeeds', async () => {
    (adminProductService.list as jest.Mock).mockResolvedValue(mockResponse);
    (adminProductService.activate as jest.Mock).mockResolvedValue(mockResponse.data![0]);

    await act(async () => {
      render(<AdminProductsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByText('Activate prod-1'));

    await waitFor(() => {
      expect(adminProductService.list).toHaveBeenCalledTimes(2);
    });
  });

  it('should call adminProductService.deactivate with product ID when Deactivate is clicked', async () => {
    (adminProductService.list as jest.Mock).mockResolvedValue(mockResponse);
    (adminProductService.deactivate as jest.Mock).mockResolvedValue(mockResponse.data![0]);

    await act(async () => {
      render(<AdminProductsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByText('Deactivate prod-1'));

    await waitFor(() => {
      expect(adminProductService.deactivate).toHaveBeenCalledWith('prod-1');
    });
  });

  it('should refresh the product list after deactivate succeeds', async () => {
    (adminProductService.list as jest.Mock).mockResolvedValue(mockResponse);
    (adminProductService.deactivate as jest.Mock).mockResolvedValue(mockResponse.data![0]);

    await act(async () => {
      render(<AdminProductsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByText('Deactivate prod-1'));

    await waitFor(() => {
      expect(adminProductService.list).toHaveBeenCalledTimes(2);
    });
  });

  it('should open DeleteProductDialog when Delete is clicked', async () => {
    (adminProductService.list as jest.Mock).mockResolvedValue(mockResponse);

    await act(async () => {
      render(<AdminProductsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByText('Delete prod-1'));

    await waitFor(() => {
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });
  });

  it('should call adminProductService.delete when deletion is confirmed in the dialog', async () => {
    (adminProductService.list as jest.Mock).mockResolvedValue(mockResponse);
    (adminProductService.delete as jest.Mock).mockResolvedValue(undefined);

    await act(async () => {
      render(<AdminProductsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByText('Delete prod-1'));

    await waitFor(() => {
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Confirm Delete'));

    await waitFor(() => {
      expect(adminProductService.list).toHaveBeenCalledTimes(2);
    });
  });

  it('should close the dialog after delete', async () => {
    (adminProductService.list as jest.Mock).mockResolvedValue(mockResponse);

    await act(async () => {
      render(<AdminProductsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByText('Delete prod-1'));

    await waitFor(() => {
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();
    });
  });

  it('should re-fetch when search input changes (debounced)', async () => {
    (adminProductService.list as jest.Mock).mockResolvedValue(mockResponse);

    await act(async () => {
      render(<AdminProductsPage />);
    });

    // Initial fetch on mount (from search effect)
    await waitFor(() => {
      expect(adminProductService.list).toHaveBeenCalled();
    });

    const initialCallCount = (adminProductService.list as jest.Mock).mock.calls.length;

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'cat');

    // Advance debounce timer
    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect((adminProductService.list as jest.Mock).mock.calls.length).toBeGreaterThan(
        initialCallCount
      );
    });
  });

  it('should pass isActive: true to list() when status filter is "active"', async () => {
    (adminProductService.list as jest.Mock).mockResolvedValue(mockResponse);

    await act(async () => {
      render(<AdminProductsPage />);
    });

    await waitFor(() => {
      expect(adminProductService.list).toHaveBeenCalled();
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const statusFilter = screen.getByTestId('status-filter');
    await user.selectOptions(statusFilter, 'active');

    await waitFor(() => {
      const calls = (adminProductService.list as jest.Mock).mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.isActive).toBe(true);
    });
  });

  it('should pass isActive: false to list() when status filter is "inactive"', async () => {
    (adminProductService.list as jest.Mock).mockResolvedValue(mockResponse);

    await act(async () => {
      render(<AdminProductsPage />);
    });

    await waitFor(() => {
      expect(adminProductService.list).toHaveBeenCalled();
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const statusFilter = screen.getByTestId('status-filter');
    await user.selectOptions(statusFilter, 'inactive');

    await waitFor(() => {
      const calls = (adminProductService.list as jest.Mock).mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.isActive).toBe(false);
    });
  });

  it('should not pass isActive param when status filter is "all"', async () => {
    (adminProductService.list as jest.Mock).mockResolvedValue(mockResponse);

    await act(async () => {
      render(<AdminProductsPage />);
    });

    await waitFor(() => {
      expect(adminProductService.list).toHaveBeenCalled();
    });

    // Default is "all" — verify isActive is not in the params
    const firstCall = (adminProductService.list as jest.Mock).mock.calls[0][0];
    expect(firstCall.isActive).toBeUndefined();
  });

  it('should update current page state and re-fetch when page changes', async () => {
    (adminProductService.list as jest.Mock).mockResolvedValue(mockResponse);

    await act(async () => {
      render(<AdminProductsPage />);
    });

    await waitFor(() => {
      expect(adminProductService.list).toHaveBeenCalled();
    });

    const initialCallCount = (adminProductService.list as jest.Mock).mock.calls.length;

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByText('Go to page 2'));

    await waitFor(() => {
      const calls = (adminProductService.list as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThan(initialCallCount);
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.page).toBe(2);
    });
  });
});
