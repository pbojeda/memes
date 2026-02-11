import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductTypesTable } from './ProductTypesTable';
import type { components } from '../../../lib/api/types';

type ProductType = components['schemas']['ProductType'];

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
    isActive: false,
    sortOrder: 2,
    productCount: 0,
  },
];

describe('ProductTypesTable', () => {
  const defaultProps = {
    productTypes: [] as ProductType[],
    isLoading: false,
    error: null as string | null,
    onRetry: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onCreate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should show skeleton rows when loading', () => {
      render(<ProductTypesTable {...defaultProps} isLoading={true} />);

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
      expect(screen.getByText(/loading product types/i)).toBeInTheDocument();
    });

    it('should not show data when loading', () => {
      render(
        <ProductTypesTable
          {...defaultProps}
          isLoading={true}
          productTypes={mockProductTypes}
        />
      );

      expect(screen.queryByText('T-shirts')).not.toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should show error alert with message', () => {
      render(
        <ProductTypesTable {...defaultProps} error="Failed to load product types" />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to load product types')).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const onRetry = jest.fn();
      render(
        <ProductTypesTable
          {...defaultProps}
          error="Failed to load"
          onRetry={onRetry}
        />
      );

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /retry/i }));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Empty state', () => {
    it('should show empty message when no product types', () => {
      render(<ProductTypesTable {...defaultProps} productTypes={[]} />);

      expect(screen.getByText(/no product types found/i)).toBeInTheDocument();
    });

    it('should show create button in empty state', () => {
      render(<ProductTypesTable {...defaultProps} productTypes={[]} />);

      expect(
        screen.getByRole('button', { name: /create product type/i })
      ).toBeInTheDocument();
    });
  });

  describe('Data table', () => {
    it('should render table headers', () => {
      render(
        <ProductTypesTable {...defaultProps} productTypes={mockProductTypes} />
      );

      const headers = screen.getAllByRole('columnheader');
      const headerTexts = headers.map((h) => h.textContent);
      expect(headerTexts).toEqual([
        'Name',
        'Slug',
        'Has Sizes',
        'Active',
        'Sort Order',
        'Actions',
      ]);
    });

    it('should render product type data in rows', () => {
      render(
        <ProductTypesTable {...defaultProps} productTypes={mockProductTypes} />
      );

      expect(screen.getByText('T-shirts')).toBeInTheDocument();
      expect(screen.getByText('tshirts')).toBeInTheDocument();
      expect(screen.getByText('Mugs')).toBeInTheDocument();
      expect(screen.getByText('mugs')).toBeInTheDocument();
    });

    it('should show "Yes"/"No" for hasSizes column', () => {
      render(
        <ProductTypesTable {...defaultProps} productTypes={mockProductTypes} />
      );

      const cells = screen.getAllByRole('cell');
      // T-shirts has sizes = true
      expect(screen.getByText('Yes')).toBeInTheDocument();
      // Mugs has sizes = false
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('should show Active/Inactive badges', () => {
      render(
        <ProductTypesTable {...defaultProps} productTypes={mockProductTypes} />
      );

      const badges = screen.getAllByText(/^(Active|Inactive)$/);
      // "Active" header + "Active" badge + "Inactive" badge = at least 2 badges
      const activeBadges = badges.filter(
        (el) => el.getAttribute('data-slot') === 'badge'
      );
      expect(activeBadges).toHaveLength(2);
    });

    it('should show sort order values', () => {
      render(
        <ProductTypesTable {...defaultProps} productTypes={mockProductTypes} />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onCreate when "Create Product Type" header button is clicked', async () => {
      const onCreate = jest.fn();
      render(
        <ProductTypesTable
          {...defaultProps}
          productTypes={mockProductTypes}
          onCreate={onCreate}
        />
      );

      const user = userEvent.setup();
      await user.click(
        screen.getByRole('button', { name: /create product type/i })
      );

      expect(onCreate).toHaveBeenCalledTimes(1);
    });

    it('should call onEdit with product type when edit button is clicked', async () => {
      const onEdit = jest.fn();
      render(
        <ProductTypesTable
          {...defaultProps}
          productTypes={mockProductTypes}
          onEdit={onEdit}
        />
      );

      const user = userEvent.setup();
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      expect(onEdit).toHaveBeenCalledWith(mockProductTypes[0]);
    });

    it('should call onDelete with product type when delete button is clicked', async () => {
      const onDelete = jest.fn();
      render(
        <ProductTypesTable
          {...defaultProps}
          productTypes={mockProductTypes}
          onDelete={onDelete}
        />
      );

      const user = userEvent.setup();
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(onDelete).toHaveBeenCalledWith(mockProductTypes[0]);
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      render(
        <ProductTypesTable {...defaultProps} productTypes={mockProductTypes} />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(6);
      expect(screen.getAllByRole('row')).toHaveLength(3); // 1 header + 2 data rows
    });

    it('should have aria-labels on action buttons', () => {
      render(
        <ProductTypesTable {...defaultProps} productTypes={mockProductTypes} />
      );

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

      expect(editButtons[0]).toHaveAttribute(
        'aria-label',
        'Edit T-shirts'
      );
      expect(deleteButtons[0]).toHaveAttribute(
        'aria-label',
        'Delete T-shirts'
      );
    });
  });
});
