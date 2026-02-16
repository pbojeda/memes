import { render, screen } from '@testing-library/react';
import { ProductGrid } from './ProductGrid';
import type { components } from '@/lib/api/types';

type Product = components['schemas']['Product'];

// Mock ProductCard to isolate ProductGrid logic
jest.mock('./ProductCard', () => ({
  ProductCard: ({ product }: { product: Product }) => (
    <div data-testid={`product-card-${product.id}`}>
      Mocked ProductCard {product.title}
    </div>
  ),
}));

// Factory function for creating test products
const createProduct = (overrides: Partial<Product> = {}): Product => ({
  id: `prod-${overrides.id ?? '1'}`,
  title: overrides.title ?? 'Test Product',
  slug: overrides.slug ?? 'test-product',
  price: overrides.price ?? 24.99,
  compareAtPrice: overrides.compareAtPrice ?? undefined,
  isHot: overrides.isHot ?? false,
  isActive: overrides.isActive ?? true,
  averageRating: overrides.averageRating ?? 4.5,
  reviewsCount: overrides.reviewsCount ?? 10,
  primaryImage: overrides.primaryImage ?? {
    id: 'img-1',
    url: 'https://example.com/image.jpg',
    altText: 'Test image',
    isPrimary: true,
    sortOrder: 0,
  },
  ...overrides,
});

// Helper to create an array of products
const createProducts = (count: number): Product[] => {
  return Array.from({ length: count }, (_, i) =>
    createProduct({
      id: `prod-${i + 1}`,
      title: `Product ${i + 1}`,
    })
  );
};

describe('ProductGrid - Loading state', () => {
  it('should render skeleton placeholders when loading is true (default count = 8)', () => {
    render(<ProductGrid products={[]} loading={true} />);

    const skeletons = screen.getAllByRole('status');
    // The grid itself has role="status", not individual skeletons
    expect(skeletons).toHaveLength(1);

    // Check for skeleton structure (aria-hidden elements)
    const container = screen.getByRole('status');
    const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenElements.length).toBeGreaterThanOrEqual(8); // At least 8 skeleton cards
  });

  it('should render custom skeleton count via skeletonCount prop', () => {
    render(<ProductGrid products={[]} loading={true} skeletonCount={12} />);

    const container = screen.getByRole('status');
    const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenElements.length).toBeGreaterThanOrEqual(12); // At least 12 skeleton cards
  });

  it('should not render ProductCards when loading', () => {
    const products = createProducts(3);
    render(<ProductGrid products={products} loading={true} />);

    expect(screen.queryByTestId('product-card-prod-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('product-card-prod-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('product-card-prod-3')).not.toBeInTheDocument();
  });

  it('should render sr-only "Loading products..." text for accessibility', () => {
    render(<ProductGrid products={[]} loading={true} />);

    expect(screen.getByText('Loading products...')).toBeInTheDocument();
    const srOnly = screen.getByText('Loading products...');
    expect(srOnly).toHaveClass('sr-only');
  });
});

describe('ProductGrid - Empty state', () => {
  it('should render "No products found" when products array is empty and not loading', () => {
    render(<ProductGrid products={[]} loading={false} />);

    expect(screen.getByText('No products found')).toBeInTheDocument();
  });

  it('should not render empty message when loading', () => {
    render(<ProductGrid products={[]} loading={true} />);

    expect(screen.queryByText('No products found')).not.toBeInTheDocument();
  });
});

describe('ProductGrid - Populated state', () => {
  it('should render a ProductCard for each product', () => {
    const products = createProducts(4);
    render(<ProductGrid products={products} loading={false} />);

    expect(screen.getByTestId('product-card-prod-1')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-prod-2')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-prod-3')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-prod-4')).toBeInTheDocument();
  });

  it('should not render empty message when products exist', () => {
    const products = createProducts(2);
    render(<ProductGrid products={products} loading={false} />);

    expect(screen.queryByText('No products found')).not.toBeInTheDocument();
  });

  it('should not render skeletons when not loading', () => {
    const products = createProducts(2);
    render(<ProductGrid products={products} loading={false} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
  });
});

describe('ProductGrid - Grid layout', () => {
  it('should apply responsive grid CSS classes', () => {
    const products = createProducts(2);
    const { container } = render(<ProductGrid products={products} />);

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('gap-6');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('sm:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
    expect(grid).toHaveClass('xl:grid-cols-4');
  });

  it('should apply custom className to grid container', () => {
    const products = createProducts(2);
    const { container } = render(
      <ProductGrid products={products} className="custom-class" />
    );

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('custom-class');
  });
});

describe('ProductGrid - Columns override', () => {
  it('should apply custom columns when columns prop is provided', () => {
    const products = createProducts(2);
    const { container } = render(
      <ProductGrid products={products} columns="grid-cols-2 md:grid-cols-4" />
    );

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid-cols-2');
    expect(grid).toHaveClass('md:grid-cols-4');

    // Default columns should be replaced (not present)
    expect(grid).not.toHaveClass('grid-cols-1');
    expect(grid).not.toHaveClass('sm:grid-cols-2');
  });

  it('should use default columns when columns prop is not provided', () => {
    const products = createProducts(2);
    const { container } = render(<ProductGrid products={products} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('sm:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
    expect(grid).toHaveClass('xl:grid-cols-4');
  });
});

describe('ProductGrid - Skeleton card structure', () => {
  it('should render skeleton cards with aspect-square image area and text placeholders', () => {
    render(<ProductGrid products={[]} loading={true} skeletonCount={2} />);

    const container = screen.getByRole('status');

    // Check for aspect-square elements (image skeletons)
    const aspectSquares = container.querySelectorAll('.aspect-square');
    expect(aspectSquares.length).toBeGreaterThanOrEqual(2);

    // Check for animate-pulse elements
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);

    // Check for muted background elements
    const mutedElements = container.querySelectorAll('.bg-muted');
    expect(mutedElements.length).toBeGreaterThan(0);
  });
});
