import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditProductPage from './page';
import { adminProductService } from '@/lib/services/adminProductService';
import type { components } from '@/lib/api/types';

type Product = components['schemas']['Product'];
type ProductImage = components['schemas']['ProductImage'];

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ productId: 'prod-1' }),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('../../../../../lib/services/adminProductService', () => ({
  adminProductService: {
    getById: jest.fn(),
    listImages: jest.fn(),
    update: jest.fn(),
  },
}));

// Mock ProductForm
jest.mock('../../../../../components/admin/products/ProductForm', () => ({
  ProductForm: ({ product, initialImages, onSuccess }: {
    product?: Product;
    initialImages?: ProductImage[];
    onSuccess?: (p: Product) => void;
  }) => (
    <div data-testid="product-form">
      {product && <span data-testid="product-title">{product.title as string}</span>}
      {initialImages && <span data-testid="image-count">{initialImages.length}</span>}
      <button onClick={() => onSuccess?.(product!)}>Save</button>
    </div>
  ),
}));

const mockAdminProductService = adminProductService as jest.Mocked<typeof adminProductService>;

const mockProduct: Product = {
  id: 'prod-1',
  title: 'Test Product',
  slug: 'test-product',
  price: 24.99,
  isActive: true,
  isHot: false,
};

const mockImages: ProductImage[] = [
  { id: 'img-1', url: 'https://example.com/img1.jpg', altText: 'Image 1', isPrimary: true, sortOrder: 0 },
];

describe('EditProductPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state while fetching', () => {
    mockAdminProductService.getById.mockImplementation(() => new Promise(() => {}));
    mockAdminProductService.listImages.mockImplementation(() => new Promise(() => {}));

    render(<EditProductPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should call getById and listImages on mount', async () => {
    mockAdminProductService.getById.mockResolvedValueOnce(mockProduct);
    mockAdminProductService.listImages.mockResolvedValueOnce(mockImages);

    render(<EditProductPage />);

    await waitFor(() => {
      expect(mockAdminProductService.getById).toHaveBeenCalledWith('prod-1');
      expect(mockAdminProductService.listImages).toHaveBeenCalledWith('prod-1');
    });
  });

  it('should render ProductForm with product data after fetch', async () => {
    mockAdminProductService.getById.mockResolvedValueOnce(mockProduct);
    mockAdminProductService.listImages.mockResolvedValueOnce(mockImages);

    render(<EditProductPage />);

    await waitFor(() => {
      expect(screen.getByTestId('product-title')).toHaveTextContent('Test Product');
    });

    expect(screen.getByTestId('image-count')).toHaveTextContent('1');
  });

  it('should show error alert when fetch fails', async () => {
    mockAdminProductService.getById.mockRejectedValueOnce(new Error('Product not found'));
    mockAdminProductService.listImages.mockResolvedValueOnce([]);

    render(<EditProductPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Product not found');
    });
  });

  it('should show retry button that re-fetches on click', async () => {
    const user = userEvent.setup();
    mockAdminProductService.getById.mockRejectedValueOnce(new Error('Server error'));
    mockAdminProductService.listImages.mockResolvedValueOnce([]);

    render(<EditProductPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Setup successful retry
    mockAdminProductService.getById.mockResolvedValueOnce(mockProduct);
    mockAdminProductService.listImages.mockResolvedValueOnce(mockImages);

    await user.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByTestId('product-title')).toHaveTextContent('Test Product');
    });
  });

  it('should show success message after onSuccess is called', async () => {
    const user = userEvent.setup();
    mockAdminProductService.getById.mockResolvedValueOnce(mockProduct);
    mockAdminProductService.listImages.mockResolvedValueOnce(mockImages);

    render(<EditProductPage />);

    await waitFor(() => {
      expect(screen.getByTestId('product-form')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText('Product updated successfully')).toBeInTheDocument();
    });
  });

  it('should auto-dismiss success message after timeout', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockAdminProductService.getById.mockResolvedValueOnce(mockProduct);
    mockAdminProductService.listImages.mockResolvedValueOnce(mockImages);

    render(<EditProductPage />);

    await waitFor(() => {
      expect(screen.getByTestId('product-form')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText('Product updated successfully')).toBeInTheDocument();
    });

    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.queryByText('Product updated successfully')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });
});
