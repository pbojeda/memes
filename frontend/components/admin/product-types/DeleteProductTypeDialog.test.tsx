import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteProductTypeDialog } from './DeleteProductTypeDialog';
import { productTypeService } from '../../../lib/services/productTypeService';
import { ApiException } from '../../../lib/api/exceptions';
import type { components } from '../../../lib/api/types';

type ProductType = components['schemas']['ProductType'];

jest.mock('../../../lib/services/productTypeService', () => ({
  productTypeService: {
    delete: jest.fn(),
  },
}));

const mockProductType: ProductType = {
  id: '1',
  name: 'T-shirts',
  slug: 'tshirts',
  hasSizes: true,
  isActive: true,
  sortOrder: 1,
  productCount: 0,
};

const mockProductTypeWithProducts: ProductType = {
  ...mockProductType,
  productCount: 42,
};

describe('DeleteProductTypeDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    productType: mockProductType,
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show confirmation with product type name', async () => {
    await act(async () => {
      render(<DeleteProductTypeDialog {...defaultProps} />);
    });

    expect(screen.getByText(/delete.*t-shirts/i)).toBeInTheDocument();
  });

  it('should show warning when productCount > 0', async () => {
    await act(async () => {
      render(
        <DeleteProductTypeDialog
          {...defaultProps}
          productType={mockProductTypeWithProducts}
        />
      );
    });

    expect(screen.getByText(/42 products/i)).toBeInTheDocument();
  });

  it('should disable delete button when productCount > 0', async () => {
    await act(async () => {
      render(
        <DeleteProductTypeDialog
          {...defaultProps}
          productType={mockProductTypeWithProducts}
        />
      );
    });

    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
  });

  it('should enable delete button when productCount is 0', async () => {
    await act(async () => {
      render(<DeleteProductTypeDialog {...defaultProps} />);
    });

    expect(screen.getByRole('button', { name: /delete/i })).not.toBeDisabled();
  });

  it('should call productTypeService.delete on confirm', async () => {
    (productTypeService.delete as jest.Mock).mockResolvedValue(undefined);

    await act(async () => {
      render(<DeleteProductTypeDialog {...defaultProps} />);
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(productTypeService.delete).toHaveBeenCalledWith('1');
    });
  });

  it('should show loading state while deleting', async () => {
    (productTypeService.delete as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    await act(async () => {
      render(<DeleteProductTypeDialog {...defaultProps} />);
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
  });

  it('should call onSuccess and close after successful delete', async () => {
    const onSuccess = jest.fn();
    const onOpenChange = jest.fn();
    (productTypeService.delete as jest.Mock).mockResolvedValue(undefined);

    await act(async () => {
      render(
        <DeleteProductTypeDialog
          {...defaultProps}
          onSuccess={onSuccess}
          onOpenChange={onOpenChange}
        />
      );
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should handle 409 conflict error', async () => {
    (productTypeService.delete as jest.Mock).mockRejectedValue(
      new ApiException('CONFLICT', 'Cannot delete', 409)
    );

    await act(async () => {
      render(<DeleteProductTypeDialog {...defaultProps} />);
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/cannot delete.*has associated products/i)
      ).toBeInTheDocument();
    });
  });

  it('should handle generic error', async () => {
    (productTypeService.delete as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    await act(async () => {
      render(<DeleteProductTypeDialog {...defaultProps} />);
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should call onOpenChange with false when cancel is clicked', async () => {
    const onOpenChange = jest.fn();
    await act(async () => {
      render(
        <DeleteProductTypeDialog {...defaultProps} onOpenChange={onOpenChange} />
      );
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should not render when productType is null', async () => {
    await act(async () => {
      render(
        <DeleteProductTypeDialog {...defaultProps} productType={null} />
      );
    });

    expect(screen.queryByText(/delete/i)).not.toBeInTheDocument();
  });
});
