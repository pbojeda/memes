import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductTypeFormDialog } from './ProductTypeFormDialog';
import { productTypeService } from '../../../lib/services/productTypeService';
import { ApiException } from '../../../lib/api/exceptions';
import type { components } from '../../../lib/api/types';

type ProductType = components['schemas']['ProductType'];

jest.mock('../../../lib/services/productTypeService', () => ({
  productTypeService: {
    create: jest.fn(),
    update: jest.fn(),
  },
}));

const mockProductType: ProductType = {
  id: '1',
  name: 'T-shirts',
  slug: 'tshirts',
  hasSizes: true,
  isActive: true,
  sortOrder: 1,
  productCount: 42,
};

describe('ProductTypeFormDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create mode', () => {
    it('should show "Create Product Type" title', async () => {
      await act(async () => {
        render(<ProductTypeFormDialog {...defaultProps} />);
      });

      expect(screen.getByText('Create Product Type')).toBeInTheDocument();
    });

    it('should show empty form fields', async () => {
      await act(async () => {
        render(<ProductTypeFormDialog {...defaultProps} />);
      });

      expect(screen.getByLabelText(/^name/i)).toHaveValue('');
      expect(screen.getByLabelText(/^slug/i)).toHaveValue('');
      expect(screen.getByLabelText(/sort order/i)).toHaveValue(0);
    });

    it('should validate required name field', async () => {
      await act(async () => {
        render(<ProductTypeFormDialog {...defaultProps} />);
      });

      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/^slug/i), 'test-slug');
      await user.click(screen.getByRole('button', { name: /^create$/i }));

      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(productTypeService.create).not.toHaveBeenCalled();
    });

    it('should validate required slug field', async () => {
      await act(async () => {
        render(<ProductTypeFormDialog {...defaultProps} />);
      });

      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/^name/i), 'Test Name');
      await user.click(screen.getByRole('button', { name: /^create$/i }));

      expect(screen.getByText(/slug is required/i)).toBeInTheDocument();
      expect(productTypeService.create).not.toHaveBeenCalled();
    });

    it('should validate sortOrder is not negative', async () => {
      await act(async () => {
        render(<ProductTypeFormDialog {...defaultProps} />);
      });

      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/^name/i), 'Test');
      await user.type(screen.getByLabelText(/^slug/i), 'test');
      fireEvent.change(screen.getByLabelText(/sort order/i), {
        target: { value: '-1' },
      });
      await user.click(screen.getByRole('button', { name: /^create$/i }));

      expect(screen.getByText(/sort order must be 0 or greater/i)).toBeInTheDocument();
      expect(productTypeService.create).not.toHaveBeenCalled();
    });

    it('should call productTypeService.create with correct data', async () => {
      (productTypeService.create as jest.Mock).mockResolvedValue(mockProductType);

      await act(async () => {
        render(<ProductTypeFormDialog {...defaultProps} />);
      });

      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/^name/i), 'T-shirts');
      await user.type(screen.getByLabelText(/^slug/i), 'tshirts');
      await user.click(screen.getByLabelText(/has sizes/i));
      await user.clear(screen.getByLabelText(/sort order/i));
      await user.type(screen.getByLabelText(/sort order/i), '1');
      await user.click(screen.getByRole('button', { name: /^create$/i }));

      await waitFor(() => {
        expect(productTypeService.create).toHaveBeenCalledWith({
          name: { es: 'T-shirts' },
          slug: 'tshirts',
          hasSizes: true,
          isActive: true,
          sortOrder: 1,
        });
      });
    });

    it('should show loading state while creating', async () => {
      (productTypeService.create as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      await act(async () => {
        render(<ProductTypeFormDialog {...defaultProps} />);
      });

      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/^name/i), 'Test');
      await user.type(screen.getByLabelText(/^slug/i), 'test');
      await user.click(screen.getByRole('button', { name: /^create$/i }));

      expect(
        screen.getByRole('button', { name: /creating/i })
      ).toBeDisabled();
    });

    it('should call onSuccess and close dialog after successful create', async () => {
      const onSuccess = jest.fn();
      const onOpenChange = jest.fn();
      (productTypeService.create as jest.Mock).mockResolvedValue(mockProductType);

      await act(async () => {
        render(
          <ProductTypeFormDialog
            {...defaultProps}
            onSuccess={onSuccess}
            onOpenChange={onOpenChange}
          />
        );
      });

      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/^name/i), 'Test');
      await user.type(screen.getByLabelText(/^slug/i), 'test');
      await user.click(screen.getByRole('button', { name: /^create$/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should show error message on 409 conflict', async () => {
      (productTypeService.create as jest.Mock).mockRejectedValue(
        new ApiException('DUPLICATE_SLUG', 'Slug already exists', 409)
      );

      await act(async () => {
        render(<ProductTypeFormDialog {...defaultProps} />);
      });

      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/^name/i), 'Test');
      await user.type(screen.getByLabelText(/^slug/i), 'test');
      await user.click(screen.getByRole('button', { name: /^create$/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/a product type with this slug already exists/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Edit mode', () => {
    it('should show "Edit Product Type" title', async () => {
      await act(async () => {
        render(
          <ProductTypeFormDialog {...defaultProps} productType={mockProductType} />
        );
      });

      expect(screen.getByText('Edit Product Type')).toBeInTheDocument();
    });

    it('should pre-fill form fields with product type data', async () => {
      await act(async () => {
        render(
          <ProductTypeFormDialog {...defaultProps} productType={mockProductType} />
        );
      });

      expect(screen.getByLabelText(/^name/i)).toHaveValue('T-shirts');
      expect(screen.getByLabelText(/^slug/i)).toHaveValue('tshirts');
      expect(screen.getByLabelText(/sort order/i)).toHaveValue(1);
    });

    it('should call productTypeService.update with correct data', async () => {
      (productTypeService.update as jest.Mock).mockResolvedValue(mockProductType);

      await act(async () => {
        render(
          <ProductTypeFormDialog {...defaultProps} productType={mockProductType} />
        );
      });

      const user = userEvent.setup();
      await user.clear(screen.getByLabelText(/^name/i));
      await user.type(screen.getByLabelText(/^name/i), 'Updated Name');
      await user.click(screen.getByRole('button', { name: /^save$/i }));

      await waitFor(() => {
        expect(productTypeService.update).toHaveBeenCalledWith('1', {
          name: { es: 'Updated Name' },
          slug: 'tshirts',
          hasSizes: true,
          isActive: true,
          sortOrder: 1,
        });
      });
    });

    it('should show "Save" button instead of "Create" in edit mode', async () => {
      await act(async () => {
        render(
          <ProductTypeFormDialog {...defaultProps} productType={mockProductType} />
        );
      });

      expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^create$/i })).not.toBeInTheDocument();
    });
  });

  describe('Cancel', () => {
    it('should call onOpenChange with false when cancel is clicked', async () => {
      const onOpenChange = jest.fn();
      await act(async () => {
        render(
          <ProductTypeFormDialog {...defaultProps} onOpenChange={onOpenChange} />
        );
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
