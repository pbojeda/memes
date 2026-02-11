import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductTypesPage from './page';
import { productTypeService } from '../../../lib/services/productTypeService';
import type { components } from '../../../lib/api/types';

type ProductType = components['schemas']['ProductType'];

jest.mock('../../../lib/services/productTypeService', () => ({
  productTypeService: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockProductTypes: ProductType[] = [
  {
    id: '1',
    name: 'T-shirts',
    slug: 'tshirts',
    hasSizes: true,
    isActive: true,
    sortOrder: 1,
    productCount: 0,
  },
  {
    id: '2',
    name: 'Mugs',
    slug: 'mugs',
    hasSizes: false,
    isActive: false,
    sortOrder: 2,
    productCount: 5,
  },
];

describe('ProductTypesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch product types on mount', async () => {
    (productTypeService.getAll as jest.Mock).mockResolvedValue(mockProductTypes);

    await act(async () => {
      render(<ProductTypesPage />);
    });

    await waitFor(() => {
      expect(productTypeService.getAll).toHaveBeenCalledTimes(1);
    });
  });

  it('should show loading state then data', async () => {
    (productTypeService.getAll as jest.Mock).mockResolvedValue(mockProductTypes);

    await act(async () => {
      render(<ProductTypesPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('T-shirts')).toBeInTheDocument();
    });

    expect(screen.getByText('Mugs')).toBeInTheDocument();
  });

  it('should show error state on fetch failure', async () => {
    (productTypeService.getAll as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    await act(async () => {
      render(<ProductTypesPage />);
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/failed to load product types/i)).toBeInTheDocument();
  });

  it('should retry fetch when retry button is clicked', async () => {
    (productTypeService.getAll as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockProductTypes);

    await act(async () => {
      render(<ProductTypesPage />);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByText('T-shirts')).toBeInTheDocument();
    });

    expect(productTypeService.getAll).toHaveBeenCalledTimes(2);
  });

  it('should open create dialog on "Create Product Type" click', async () => {
    (productTypeService.getAll as jest.Mock).mockResolvedValue(mockProductTypes);

    await act(async () => {
      render(<ProductTypesPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('T-shirts')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', { name: /create product type/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/fill in the details to create a new product type/i)
      ).toBeInTheDocument();
    });
  });

  it('should open edit dialog with data on Edit click', async () => {
    (productTypeService.getAll as jest.Mock).mockResolvedValue(mockProductTypes);

    await act(async () => {
      render(<ProductTypesPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('T-shirts')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Edit Product Type')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/^name/i)).toHaveValue('T-shirts');
  });

  it('should open delete dialog on Delete click', async () => {
    (productTypeService.getAll as jest.Mock).mockResolvedValue(mockProductTypes);

    await act(async () => {
      render(<ProductTypesPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('T-shirts')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/delete.*t-shirts/i)).toBeInTheDocument();
    });
  });

  it('should refresh list after successful create', async () => {
    const updatedTypes = [
      ...mockProductTypes,
      {
        id: '3',
        name: 'Posters',
        slug: 'posters',
        hasSizes: false,
        isActive: true,
        sortOrder: 3,
        productCount: 0,
      },
    ];

    (productTypeService.getAll as jest.Mock)
      .mockResolvedValueOnce(mockProductTypes)
      .mockResolvedValueOnce(updatedTypes);
    (productTypeService.create as jest.Mock).mockResolvedValue(updatedTypes[2]);

    await act(async () => {
      render(<ProductTypesPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('T-shirts')).toBeInTheDocument();
    });

    // Open create dialog
    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', { name: /create product type/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/fill in the details to create a new product type/i)
      ).toBeInTheDocument();
    });

    // Fill form and submit
    await user.type(screen.getByLabelText(/^name/i), 'Posters');
    await user.type(screen.getByLabelText(/^slug/i), 'posters');
    await user.click(screen.getByRole('button', { name: /^create$/i }));

    // After success, list should refresh
    await waitFor(() => {
      expect(productTypeService.getAll).toHaveBeenCalledTimes(2);
    });
  });
});
