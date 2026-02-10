import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductTypeFilter } from './ProductTypeFilter';
import { productTypeService } from '../../lib/services/productTypeService';
import type { components } from '../../lib/api/types';

type ProductType = components['schemas']['ProductType'];

jest.mock('../../lib/services/productTypeService', () => ({
  productTypeService: {
    getAll: jest.fn(),
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
    productCount: 42,
  },
  {
    id: '2',
    name: 'Mugs',
    slug: 'mugs',
    hasSizes: false,
    isActive: true,
    sortOrder: 2,
    productCount: 18,
  },
  {
    id: '3',
    name: 'Posters',
    slug: 'posters',
    hasSizes: false,
    isActive: true,
    sortOrder: 3,
    productCount: 5,
  },
];

describe('ProductTypeFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering tests', () => {
    it('should render loading skeleton while fetching product types', () => {
      (productTypeService.getAll as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves to stay in loading state
      );

      const onChange = jest.fn();
      render(<ProductTypeFilter value={null} onChange={onChange} />);

      // Check loading state attributes
      const loadingContainer = screen.getByRole('status');
      expect(loadingContainer).toBeInTheDocument();
      expect(loadingContainer).toHaveAttribute('aria-live', 'polite');

      // Check screen reader text
      expect(screen.getByText(/loading product types/i)).toBeInTheDocument();

      // Verify no buttons are rendered during loading
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render "All" button and product type buttons after successful fetch', async () => {
      (productTypeService.getAll as jest.Mock).mockResolvedValue(mockProductTypes);

      const onChange = jest.fn();
      render(<ProductTypeFilter value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /^t-shirts$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^mugs$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^posters$/i })).toBeInTheDocument();
    });

    it('should render product types in sortOrder', async () => {
      const unsortedTypes: ProductType[] = [
        { ...mockProductTypes[2], sortOrder: 3 },
        { ...mockProductTypes[0], sortOrder: 1 },
        { ...mockProductTypes[1], sortOrder: 2 },
      ];

      (productTypeService.getAll as jest.Mock).mockResolvedValue(unsortedTypes);

      const onChange = jest.fn();
      render(<ProductTypeFilter value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^t-shirts$/i })).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      // First button should be "All", then sorted by sortOrder
      expect(buttons[0]).toHaveTextContent('All');
      expect(buttons[1]).toHaveTextContent('T-shirts');
      expect(buttons[2]).toHaveTextContent('Mugs');
      expect(buttons[3]).toHaveTextContent('Posters');
    });

    it('should fetch active product types only', async () => {
      (productTypeService.getAll as jest.Mock).mockResolvedValue(mockProductTypes);

      const onChange = jest.fn();
      render(<ProductTypeFilter value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(productTypeService.getAll).toHaveBeenCalledWith({ isActive: true });
      });
    });
  });

  describe('Selection state tests', () => {
    it('should highlight "All" button when value is null', async () => {
      (productTypeService.getAll as jest.Mock).mockResolvedValue(mockProductTypes);

      const onChange = jest.fn();
      render(<ProductTypeFilter value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument();
      });

      const allButton = screen.getByRole('button', { name: /^all$/i });
      const tshirtsButton = screen.getByRole('button', { name: /^t-shirts$/i });

      // "All" should have default variant (selected)
      expect(allButton).toHaveAttribute('data-variant', 'default');
      // Other buttons should have outline variant (unselected)
      expect(tshirtsButton).toHaveAttribute('data-variant', 'outline');
    });

    it('should highlight selected product type button when value matches slug', async () => {
      (productTypeService.getAll as jest.Mock).mockResolvedValue(mockProductTypes);

      const onChange = jest.fn();
      render(<ProductTypeFilter value="tshirts" onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^t-shirts$/i })).toBeInTheDocument();
      });

      const allButton = screen.getByRole('button', { name: /^all$/i });
      const tshirtsButton = screen.getByRole('button', { name: /^t-shirts$/i });
      const mugsButton = screen.getByRole('button', { name: /^mugs$/i });

      // "T-shirts" should have default variant (selected)
      expect(tshirtsButton).toHaveAttribute('data-variant', 'default');
      // "All" and other buttons should have outline variant (unselected)
      expect(allButton).toHaveAttribute('data-variant', 'outline');
      expect(mugsButton).toHaveAttribute('data-variant', 'outline');
    });

    it('should handle value prop changes', async () => {
      (productTypeService.getAll as jest.Mock).mockResolvedValue(mockProductTypes);

      const onChange = jest.fn();
      const { rerender } = render(<ProductTypeFilter value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument();
      });

      // Initially "All" is selected
      expect(screen.getByRole('button', { name: /^all$/i })).toHaveAttribute(
        'data-variant',
        'default'
      );

      // Change value to "mugs"
      rerender(<ProductTypeFilter value="mugs" onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^mugs$/i })).toHaveAttribute(
          'data-variant',
          'default'
        );
      });

      expect(screen.getByRole('button', { name: /^all$/i })).toHaveAttribute(
        'data-variant',
        'outline'
      );
    });
  });

  describe('Interaction tests', () => {
    it('should call onChange with null when "All" is clicked', async () => {
      (productTypeService.getAll as jest.Mock).mockResolvedValue(mockProductTypes);

      const onChange = jest.fn();
      render(<ProductTypeFilter value="tshirts" onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /^all$/i }));

      expect(onChange).toHaveBeenCalledWith(null);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('should call onChange with product type slug when product button is clicked', async () => {
      (productTypeService.getAll as jest.Mock).mockResolvedValue(mockProductTypes);

      const onChange = jest.fn();
      render(<ProductTypeFilter value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^t-shirts$/i })).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /^t-shirts$/i }));

      expect(onChange).toHaveBeenCalledWith('tshirts');
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('should support keyboard navigation', async () => {
      (productTypeService.getAll as jest.Mock).mockResolvedValue(mockProductTypes);

      const onChange = jest.fn();
      render(<ProductTypeFilter value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument();
      });

      const user = userEvent.setup();

      // Tab to first button (All)
      await user.tab();
      expect(screen.getByRole('button', { name: /^all$/i })).toHaveFocus();

      // Tab to next button (T-shirts)
      await user.tab();
      expect(screen.getByRole('button', { name: /^t-shirts$/i })).toHaveFocus();

      // Press Enter on focused button
      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledWith('tshirts');
    });
  });

  describe('Error state tests', () => {
    it('should render error alert when fetch fails', async () => {
      (productTypeService.getAll as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const onChange = jest.fn();
      render(<ProductTypeFilter value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/failed to load product types/i)
      ).toBeInTheDocument();
    });

    it('should render retry button in error state', async () => {
      (productTypeService.getAll as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const onChange = jest.fn();
      render(<ProductTypeFilter value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should retry fetch when retry button is clicked', async () => {
      (productTypeService.getAll as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockProductTypes);

      const onChange = jest.fn();
      render(<ProductTypeFilter value={null} onChange={onChange} />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      expect(productTypeService.getAll).toHaveBeenCalledTimes(1);

      // Click retry button
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /retry/i }));

      // Wait for successful fetch
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument();
      });

      expect(productTypeService.getAll).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Empty state tests', () => {
    it('should render empty state message when no product types are returned', async () => {
      (productTypeService.getAll as jest.Mock).mockResolvedValue([]);

      const onChange = jest.fn();
      render(<ProductTypeFilter value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByText(/no product types available/i)).toBeInTheDocument();
      });

      // Verify no buttons are rendered
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility tests', () => {
    it('should have aria-label on container', async () => {
      (productTypeService.getAll as jest.Mock).mockResolvedValue(mockProductTypes);

      const onChange = jest.fn();
      render(<ProductTypeFilter value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument();
      });

      const container = screen.getByRole('group');
      expect(container).toHaveAttribute('aria-label', 'Filter by product type');
    });

    it('should have aria-pressed on buttons', async () => {
      (productTypeService.getAll as jest.Mock).mockResolvedValue(mockProductTypes);

      const onChange = jest.fn();
      render(<ProductTypeFilter value="tshirts" onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^t-shirts$/i })).toBeInTheDocument();
      });

      const tshirtsButton = screen.getByRole('button', { name: /^t-shirts$/i });
      const allButton = screen.getByRole('button', { name: /^all$/i });
      const mugsButton = screen.getByRole('button', { name: /^mugs$/i });

      // Selected button should have aria-pressed="true"
      expect(tshirtsButton).toHaveAttribute('aria-pressed', 'true');
      // Unselected buttons should have aria-pressed="false"
      expect(allButton).toHaveAttribute('aria-pressed', 'false');
      expect(mugsButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should have role="group" on container', async () => {
      (productTypeService.getAll as jest.Mock).mockResolvedValue(mockProductTypes);

      const onChange = jest.fn();
      render(<ProductTypeFilter value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByRole('group')).toBeInTheDocument();
      });
    });
  });

  describe('Props tests', () => {
    it('should apply custom className to container', async () => {
      (productTypeService.getAll as jest.Mock).mockResolvedValue(mockProductTypes);

      const onChange = jest.fn();
      render(<ProductTypeFilter value={null} onChange={onChange} className="custom-class" />);

      await waitFor(() => {
        expect(screen.getByRole('group')).toBeInTheDocument();
      });

      const container = screen.getByRole('group');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Edge cases', () => {
    it('should handle product type with null slug', async () => {
      const typesWithNullSlug: ProductType[] = [
        {
          id: '1',
          name: 'No Slug Type',
          slug: undefined,
          hasSizes: false,
          isActive: true,
          sortOrder: 1,
          productCount: 0,
        },
      ];

      (productTypeService.getAll as jest.Mock).mockResolvedValue(typesWithNullSlug);

      const onChange = jest.fn();
      render(<ProductTypeFilter value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^no slug type$/i })).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /^no slug type$/i }));

      // Should call onChange with null when slug is undefined
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('should fallback to slug if name is missing', async () => {
      const typesWithoutName: ProductType[] = [
        {
          id: '1',
          name: undefined,
          slug: 'fallback-slug',
          hasSizes: false,
          isActive: true,
          sortOrder: 1,
          productCount: 0,
        },
      ];

      (productTypeService.getAll as jest.Mock).mockResolvedValue(typesWithoutName);

      const onChange = jest.fn();
      render(<ProductTypeFilter value={null} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^fallback-slug$/i })).toBeInTheDocument();
      });
    });
  });
});
