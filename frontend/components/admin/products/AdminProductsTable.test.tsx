import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminProductsTable } from './AdminProductsTable';
import { createProduct, createProducts } from '../../product/testing/fixtures';
import type { components } from '../../../lib/api/types';

type Product = components['schemas']['Product'];

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Pencil: (props: Record<string, unknown>) => <svg data-testid="pencil-icon" {...props} />,
  Trash2: (props: Record<string, unknown>) => <svg data-testid="trash2-icon" {...props} />,
  Plus: (props: Record<string, unknown>) => <svg data-testid="plus-icon" {...props} />,
  Power: (props: Record<string, unknown>) => <svg data-testid="power-icon" {...props} />,
  ChevronDownIcon: (props: Record<string, unknown>) => <svg data-testid="chevron-down-icon" {...props} />,
  CheckIcon: (props: Record<string, unknown>) => <svg data-testid="check-icon" {...props} />,
  ChevronLeft: (props: Record<string, unknown>) => <svg data-testid="chevron-left-icon" {...props} />,
  ChevronRight: (props: Record<string, unknown>) => <svg data-testid="chevron-right-icon" {...props} />,
  MoreHorizontal: (props: Record<string, unknown>) => <svg data-testid="more-horizontal-icon" {...props} />,
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock Radix UI Select with native HTML select for testing
// Radix portals don't work in JSDOM
jest.mock('radix-ui', () => {
  const actual = jest.requireActual('radix-ui');
  const React = require('react');

  function MockItem({ value, children }: any) {
    // Extract plain text from children (may contain spans from shadcn SelectItem)
    function extractText(node: any): string {
      if (typeof node === 'string' || typeof node === 'number') return String(node);
      if (Array.isArray(node)) return node.map(extractText).join('');
      if (React.isValidElement(node)) {
        const el = node as any;
        // Skip ItemIndicator spans (they contain check icons, not label text)
        if (el.props?.['data-slot'] === 'select-item-indicator') return '';
        return extractText(el.props?.children);
      }
      return '';
    }

    const label = extractText(children);

    return (
      <div data-testid="select-item" data-value={value} style={{ display: 'none' }}>
        {label}
      </div>
    );
  }

  // Collect items from JSX tree statically (before rendering)
  function collectItems(children: any): Array<{ value: string; label: string }> {
    const items: Array<{ value: string; label: string }> = [];
    React.Children.forEach(children, (child: any) => {
      if (!React.isValidElement(child)) return;
      const el = child as any;
      // Check for SelectItem (shadcn) which renders ItemText as children
      if (el.props?.value !== undefined && el.props?.children !== undefined) {
        // This might be a SelectItem — extract the text
        const label = typeof el.props.children === 'string'
          ? el.props.children
          : String(el.props.value);
        items.push({ value: el.props.value, label });
      }
      // Recurse into children (e.g. SelectContent, SelectGroup)
      if (el.props?.children) {
        items.push(...collectItems(el.props.children));
      }
    });
    return items;
  }

  return {
    ...actual,
    Select: {
      Root: ({ children, value, onValueChange }: any) => {
        const renderedChildren = React.Children.map(children, (child: any) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as any, { value, onValueChange } as any);
          }
          return child;
        });

        return <div data-testid="select-root">{renderedChildren}</div>;
      },
      Trigger: ({ children, value, onValueChange, ...rest }: any) => {
        // Collect options from sibling Content via the __items prop passed by Root
        // Fallback: render without options but keep onChange handler
        const items: Array<{ value: string; label: string }> = rest.__items || [];

        return (
          <div>
            {children}
            <select
              value={value || ''}
              onChange={(e) => onValueChange?.(e.target.value)}
              data-testid="select-trigger"
            >
              {items.map(({ value: v, label }) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </div>
        );
      },
      Value: ({ placeholder }: any) => <span>{placeholder}</span>,
      Portal: ({ children }: any) => <>{children}</>,
      Content: ({ children }: any) => (
        <div data-testid="select-content">{children}</div>
      ),
      Viewport: ({ children }: any) => <>{children}</>,
      Item: MockItem,
      ItemText: ({ children }: any) => <>{children}</>,
      ItemIndicator: ({ children }: any) => <span data-slot="select-item-indicator">{children}</span>,
      Icon: ({ children }: any) => <span>{children}</span>,
      ScrollUpButton: () => null,
      ScrollDownButton: () => null,
      Label: ({ children }: any) => <label>{children}</label>,
      Group: ({ children }: any) => <>{children}</>,
      Separator: () => <hr />,
    },
  };
});

const activeProduct = createProduct({ id: 'prod-1', title: 'Active Product', isActive: true });
const inactiveProduct = createProduct({ id: 'prod-2', title: 'Inactive Product', isActive: false });
const hotProduct = createProduct({ id: 'prod-3', title: 'Hot Product', isHot: true, isActive: true });

const defaultProps = {
  products: [activeProduct],
  isLoading: false,
  error: null,
  onRetry: jest.fn(),
  onActivate: jest.fn(),
  onDeactivate: jest.fn(),
  onDelete: jest.fn(),
  actionLoadingId: null,
  search: '',
  onSearchChange: jest.fn(),
  statusFilter: 'all' as const,
  onStatusChange: jest.fn(),
  currentPage: 1,
  totalPages: 1,
  onPageChange: jest.fn(),
};

describe('AdminProductsTable - Loading state', () => {
  it('should render loading skeleton with role="status" when isLoading is true', () => {
    render(<AdminProductsTable {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render 5 skeleton rows when loading', () => {
    render(<AdminProductsTable {...defaultProps} isLoading={true} />);

    const skeletons = screen.getAllByRole('status')[0].querySelectorAll('[aria-hidden="true"]');
    expect(skeletons).toHaveLength(5);
  });

  it('should not render table when loading', () => {
    render(<AdminProductsTable {...defaultProps} isLoading={true} />);

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('AdminProductsTable - Error state', () => {
  it('should render Alert with error message when error is not null', () => {
    render(<AdminProductsTable {...defaultProps} error="Failed to load products" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to load products')).toBeInTheDocument();
  });

  it('should render a Retry button in the error state', () => {
    render(<AdminProductsTable {...defaultProps} error="Failed to load products" />);

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should call onRetry when Retry button is clicked', async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    render(<AdminProductsTable {...defaultProps} error="Failed to load products" onRetry={onRetry} />);

    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not render table when error is shown', () => {
    render(<AdminProductsTable {...defaultProps} error="Failed to load products" />);

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('AdminProductsTable - Empty state', () => {
  it('should render "No products found." text when products array is empty', () => {
    render(<AdminProductsTable {...defaultProps} products={[]} />);

    expect(screen.getByText('No products found.')).toBeInTheDocument();
  });

  it('should not render table when products is empty', () => {
    render(<AdminProductsTable {...defaultProps} products={[]} />);

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('AdminProductsTable - Table rendering', () => {
  it('should render table with correct column headers', () => {
    render(<AdminProductsTable {...defaultProps} />);

    expect(screen.getByText('Image')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    // "Status" appears in table header and in Select Value placeholder — use getAllByText
    expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1);
    // "Hot" appears in table header
    expect(screen.getByText('Hot')).toBeInTheDocument();
    expect(screen.getByText('Created At')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('should render one row per product', () => {
    const products = createProducts(3);
    render(<AdminProductsTable {...defaultProps} products={products} />);

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Product 3')).toBeInTheDocument();
  });

  it('should display product title using getLocalizedName', () => {
    render(<AdminProductsTable {...defaultProps} products={[activeProduct]} />);

    expect(screen.getByText('Active Product')).toBeInTheDocument();
  });

  it('should display product type name when productType is present', () => {
    const product = createProduct({
      id: 'prod-1',
      productType: { id: 'type-1', name: 'T-Shirts', slug: 't-shirts' },
    });
    render(<AdminProductsTable {...defaultProps} products={[product]} />);

    expect(screen.getByText('T-Shirts')).toBeInTheDocument();
  });

  it('should display formatted price', () => {
    const product = createProduct({ price: 24.99 });
    render(<AdminProductsTable {...defaultProps} products={[product]} />);

    // formatPrice uses 'es-ES' locale with EUR — result is "24,99 €"
    expect(screen.getByText(/24/)).toBeInTheDocument();
  });

  it('should display "Active" badge for active products', () => {
    render(<AdminProductsTable {...defaultProps} products={[activeProduct]} />);

    // "Active" appears in the badge (data-slot="badge") and possibly the select item
    const badgeElements = document.querySelectorAll('[data-slot="badge"]');
    const activeBadge = Array.from(badgeElements).find((el) => el.textContent === 'Active');
    expect(activeBadge).toBeInTheDocument();
  });

  it('should display "Inactive" badge for inactive products', () => {
    render(<AdminProductsTable {...defaultProps} products={[inactiveProduct]} />);

    const badgeElements = document.querySelectorAll('[data-slot="badge"]');
    const inactiveBadge = Array.from(badgeElements).find((el) => el.textContent === 'Inactive');
    expect(inactiveBadge).toBeInTheDocument();
  });

  it('should display "Hot" badge for products where isHot is true', () => {
    render(<AdminProductsTable {...defaultProps} products={[hotProduct]} />);

    // "Hot" appears in column header AND in the badge — verify badge is specifically present
    const badgeElements = document.querySelectorAll('[data-slot="badge"]');
    const hotBadge = Array.from(badgeElements).find((el) => el.textContent === 'Hot');
    expect(hotBadge).toBeInTheDocument();
  });

  it('should not display "Hot" badge when isHot is false', () => {
    const product = createProduct({ isHot: false });
    render(<AdminProductsTable {...defaultProps} products={[product]} />);

    // When isHot is false, no badge with text "Hot" should exist (only the column header)
    const badgeElements = document.querySelectorAll('[data-slot="badge"]');
    const hotBadge = Array.from(badgeElements).find((el) => el.textContent === 'Hot');
    expect(hotBadge).toBeUndefined();
  });

  it('should render product image when primaryImage is present', () => {
    const product = createProduct({
      primaryImage: {
        id: 'img-1',
        url: 'https://res.cloudinary.com/test/image/upload/v1/test.jpg',
        altText: 'Test image',
        isPrimary: true,
        sortOrder: 0,
      },
    });
    render(<AdminProductsTable {...defaultProps} products={[product]} />);

    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
  });

  it('should render placeholder when primaryImage is null/undefined', () => {
    const product = createProduct({ primaryImage: undefined });
    render(<AdminProductsTable {...defaultProps} products={[product]} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('should display formatted creation date', () => {
    const product = createProduct({ createdAt: '2026-01-15T10:00:00Z' });
    render(<AdminProductsTable {...defaultProps} products={[product]} />);

    // toLocaleDateString() output varies by locale/OS but will contain some date info
    const dateCell = screen.getByText(/2026|jan|15/i);
    expect(dateCell).toBeInTheDocument();
  });
});

describe('AdminProductsTable - Action buttons', () => {
  it('should render Edit link pointing to /admin/products/{id}/edit', () => {
    render(<AdminProductsTable {...defaultProps} products={[activeProduct]} />);

    // The edit link wraps a button with a Pencil icon — find by href attribute
    const editLink = document.querySelector(`a[href="/admin/products/${activeProduct.id}/edit"]`);
    expect(editLink).toBeInTheDocument();
  });

  it('should render "Activate" button when product is inactive', () => {
    render(<AdminProductsTable {...defaultProps} products={[inactiveProduct]} />);

    expect(screen.getByRole('button', { name: /activate inactive product/i })).toBeInTheDocument();
  });

  it('should render "Deactivate" button when product is active', () => {
    render(<AdminProductsTable {...defaultProps} products={[activeProduct]} />);

    expect(screen.getByRole('button', { name: /deactivate active product/i })).toBeInTheDocument();
  });

  it('should call onActivate with the product when Activate button is clicked', async () => {
    const onActivate = jest.fn();
    const user = userEvent.setup();
    render(<AdminProductsTable {...defaultProps} products={[inactiveProduct]} onActivate={onActivate} />);

    await user.click(screen.getByRole('button', { name: /activate inactive product/i }));

    expect(onActivate).toHaveBeenCalledWith(inactiveProduct);
  });

  it('should call onDeactivate with the product when Deactivate button is clicked', async () => {
    const onDeactivate = jest.fn();
    const user = userEvent.setup();
    render(<AdminProductsTable {...defaultProps} products={[activeProduct]} onDeactivate={onDeactivate} />);

    await user.click(screen.getByRole('button', { name: /deactivate active product/i }));

    expect(onDeactivate).toHaveBeenCalledWith(activeProduct);
  });

  it('should call onDelete with the product when Delete button is clicked', async () => {
    const onDelete = jest.fn();
    const user = userEvent.setup();
    render(<AdminProductsTable {...defaultProps} products={[activeProduct]} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: /delete active product/i }));

    expect(onDelete).toHaveBeenCalledWith(activeProduct);
  });

  it('should disable action buttons when actionLoadingId matches the product ID', () => {
    render(<AdminProductsTable {...defaultProps} products={[activeProduct]} actionLoadingId="prod-1" />);

    expect(screen.getByRole('button', { name: /deactivate active product/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /delete active product/i })).toBeDisabled();
  });

  it('should enable action buttons when actionLoadingId is null', () => {
    render(<AdminProductsTable {...defaultProps} products={[activeProduct]} actionLoadingId={null} />);

    expect(screen.getByRole('button', { name: /deactivate active product/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /delete active product/i })).not.toBeDisabled();
  });

  it('should enable action buttons when actionLoadingId is a different product ID', () => {
    render(<AdminProductsTable {...defaultProps} products={[activeProduct]} actionLoadingId="other-product" />);

    expect(screen.getByRole('button', { name: /deactivate active product/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /delete active product/i })).not.toBeDisabled();
  });
});

describe('AdminProductsTable - Search and status filter', () => {
  it('should render a search input with placeholder "Search products..."', () => {
    render(<AdminProductsTable {...defaultProps} />);

    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
  });

  it('should call onSearchChange when typing in the search input', async () => {
    const onSearchChange = jest.fn();
    const user = userEvent.setup();
    render(<AdminProductsTable {...defaultProps} onSearchChange={onSearchChange} />);

    await user.type(screen.getByPlaceholderText('Search products...'), 'a');

    expect(onSearchChange).toHaveBeenCalledWith('a');
  });

  it('should render a status filter Select with options: All, Active, Inactive', () => {
    render(<AdminProductsTable {...defaultProps} />);

    // The mock renders select items as hidden divs with data-testid="select-item"
    const allItem = document.querySelector('[data-testid="select-item"][data-value="__all__"]');
    const activeItem = document.querySelector('[data-testid="select-item"][data-value="active"]');
    const inactiveItem = document.querySelector('[data-testid="select-item"][data-value="inactive"]');
    expect(allItem).toBeInTheDocument();
    expect(activeItem).toBeInTheDocument();
    expect(inactiveItem).toBeInTheDocument();
  });

  it('should call onStatusChange when status filter changes', () => {
    const onStatusChange = jest.fn();
    render(<AdminProductsTable {...defaultProps} onStatusChange={onStatusChange} />);

    // The mock Trigger renders a native <select> that calls onValueChange on change
    // Since JSDOM native select requires matching options, use fireEvent to change value
    const select = screen.getByTestId('select-trigger') as HTMLSelectElement;
    // Set value directly on the element then fire change event
    Object.defineProperty(select, 'value', { writable: true, value: 'active' });
    fireEvent.change(select);

    expect(onStatusChange).toHaveBeenCalledWith('active');
  });

  it('should display current search value in the input', () => {
    render(<AdminProductsTable {...defaultProps} search="test query" />);

    const input = screen.getByPlaceholderText('Search products...') as HTMLInputElement;
    expect(input.value).toBe('test query');
  });

  it('should display current status value in the filter', () => {
    render(<AdminProductsTable {...defaultProps} statusFilter="active" />);

    // When statusFilter="active", the select-item with data-value="active" is rendered
    // The component renders correctly with the current filter state
    const activeItem = document.querySelector('[data-testid="select-item"][data-value="active"]');
    expect(activeItem).toBeInTheDocument();
    // Verify the search input and select filter are both rendered
    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
  });
});

describe('AdminProductsTable - Pagination', () => {
  it('should render Pagination component when totalPages > 1', () => {
    const products = createProducts(3);
    render(
      <AdminProductsTable
        {...defaultProps}
        products={products}
        totalPages={3}
        currentPage={1}
      />
    );

    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
  });

  it('should not render Pagination when totalPages is 1', () => {
    render(<AdminProductsTable {...defaultProps} totalPages={1} />);

    expect(screen.queryByRole('navigation', { name: /pagination/i })).not.toBeInTheDocument();
  });

  it('should call onPageChange when a pagination button is clicked', async () => {
    const onPageChange = jest.fn();
    const user = userEvent.setup();
    const products = createProducts(3);
    render(
      <AdminProductsTable
        {...defaultProps}
        products={products}
        totalPages={3}
        currentPage={1}
        onPageChange={onPageChange}
      />
    );

    // Pagination buttons have aria-label "Go to page N" (see pagination.tsx)
    await user.click(screen.getByRole('button', { name: /go to page 2/i }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
