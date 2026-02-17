import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteProductDialog } from './DeleteProductDialog';
import { adminProductService } from '../../../lib/services/adminProductService';
import { ApiException } from '../../../lib/api/exceptions';
import type { components } from '../../../lib/api/types';

type Product = components['schemas']['Product'];

jest.mock('../../../lib/services/adminProductService', () => ({
  adminProductService: {
    delete: jest.fn(),
  },
}));

const mockProduct: Product = {
  id: 'prod-1',
  title: 'Test Product',
  slug: 'test-product',
  price: 24.99,
  isActive: true,
};

describe('DeleteProductDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    product: mockProduct,
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render nothing when product prop is null', async () => {
    await act(async () => {
      render(<DeleteProductDialog {...defaultProps} product={null} />);
    });

    expect(screen.queryByText(/delete/i)).not.toBeInTheDocument();
  });

  it('should render dialog title with product title when open=true and product is provided', async () => {
    await act(async () => {
      render(<DeleteProductDialog {...defaultProps} />);
    });

    expect(screen.getByText(/delete.*test product/i)).toBeInTheDocument();
  });

  it('should render a warning that the action cannot be undone', async () => {
    await act(async () => {
      render(<DeleteProductDialog {...defaultProps} />);
    });

    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it('should call adminProductService.delete with the product ID when Delete button is clicked', async () => {
    (adminProductService.delete as jest.Mock).mockResolvedValue(undefined);

    await act(async () => {
      render(<DeleteProductDialog {...defaultProps} />);
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(adminProductService.delete).toHaveBeenCalledWith('prod-1');
    });
  });

  it('should call onSuccess callback after successful delete', async () => {
    const onSuccess = jest.fn();
    (adminProductService.delete as jest.Mock).mockResolvedValue(undefined);

    await act(async () => {
      render(<DeleteProductDialog {...defaultProps} onSuccess={onSuccess} />);
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onOpenChange(false) after successful delete', async () => {
    const onOpenChange = jest.fn();
    (adminProductService.delete as jest.Mock).mockResolvedValue(undefined);

    await act(async () => {
      render(<DeleteProductDialog {...defaultProps} onOpenChange={onOpenChange} />);
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should show loading text "Deleting..." while delete is in progress', async () => {
    (adminProductService.delete as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    await act(async () => {
      render(<DeleteProductDialog {...defaultProps} />);
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
  });

  it('should show error message when delete fails (ApiException)', async () => {
    (adminProductService.delete as jest.Mock).mockRejectedValue(
      new ApiException('NOT_FOUND', 'Product not found', 404)
    );

    await act(async () => {
      render(<DeleteProductDialog {...defaultProps} />);
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByText('Product not found')).toBeInTheDocument();
    });
  });

  it('should show generic error when a non-ApiException error is thrown', async () => {
    (adminProductService.delete as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    await act(async () => {
      render(<DeleteProductDialog {...defaultProps} />);
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should close dialog when Cancel button is clicked', async () => {
    const onOpenChange = jest.fn();

    await act(async () => {
      render(<DeleteProductDialog {...defaultProps} onOpenChange={onOpenChange} />);
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should not call adminProductService.delete when Cancel is clicked', async () => {
    await act(async () => {
      render(<DeleteProductDialog {...defaultProps} />);
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(adminProductService.delete).not.toHaveBeenCalled();
  });
});
