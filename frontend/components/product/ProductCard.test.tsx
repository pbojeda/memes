import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import type { components } from '@/lib/api/types';

type Product = components['schemas']['Product'];

// Mock next/link (same pattern as Footer.test.tsx)
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock next/image (filter out next/image-specific props that aren't valid HTML attributes)
jest.mock('next/image', () => {
  return function MockImage({ fill, sizes, ...props }: Record<string, unknown>) {
    return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Star: (props: Record<string, unknown>) => <svg data-testid="star-icon" {...props} />,
  ImageOff: (props: Record<string, unknown>) => <svg data-testid="image-off-icon" {...props} />,
}));

// Factory function for creating test products
const createProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'prod-1',
  title: 'Funny Cat Meme T-Shirt',
  slug: 'funny-cat-meme-tshirt',
  price: 24.99,
  compareAtPrice: 34.99,
  isHot: false,
  isActive: true,
  averageRating: 4.5,
  reviewsCount: 12,
  primaryImage: {
    id: 'img-1',
    url: 'https://res.cloudinary.com/test/image/upload/v1/products/cat-meme.jpg',
    altText: 'Funny cat meme on a white t-shirt',
    isPrimary: true,
    sortOrder: 0,
  },
  ...overrides,
});

describe('ProductCard - Title', () => {
  it('should render product title as string', () => {
    const product = createProduct({ title: 'Test Product' });
    render(<ProductCard product={product} />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'Test Product'
    );
  });

  it('should handle localized title via getLocalizedName', () => {
    const product = createProduct({
      title: { es: 'Camiseta de Gato', en: 'Cat T-Shirt' } as any,
    });
    render(<ProductCard product={product} />);
    // getLocalizedName returns first value
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'Camiseta de Gato'
    );
  });
});

describe('ProductCard - Image', () => {
  it('should render image with alt text from primaryImage', () => {
    const product = createProduct();
    render(<ProductCard product={product} />);
    const img = screen.getByAltText('Funny cat meme on a white t-shirt');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute(
      'src',
      'https://res.cloudinary.com/test/image/upload/v1/products/cat-meme.jpg'
    );
  });

  it('should render placeholder when no primaryImage', () => {
    const product = createProduct({ primaryImage: undefined });
    render(<ProductCard product={product} />);
    expect(screen.getByLabelText('No product image')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('should render placeholder when primaryImage has no url', () => {
    const product = createProduct({
      primaryImage: {
        id: 'img-1',
        url: undefined as any,
        altText: 'Test',
        isPrimary: true,
        sortOrder: 0,
      },
    });
    render(<ProductCard product={product} />);
    expect(screen.getByLabelText('No product image')).toBeInTheDocument();
  });
});

describe('ProductCard - Price', () => {
  it('should render EUR-formatted price in es-ES locale', () => {
    const product = createProduct({ price: 24.99 });
    render(<ProductCard product={product} />);
    // Spanish locale: "24,99 €" (space may vary by implementation)
    expect(screen.getByText(/24,99\s€/)).toBeInTheDocument();
  });

  it('should render compare-at price with strikethrough when higher than price', () => {
    const product = createProduct({ price: 19.99, compareAtPrice: 29.99 });
    render(<ProductCard product={product} />);
    const comparePrice = screen.getByText(/29,99\s€/);
    expect(comparePrice).toBeInTheDocument();
    expect(comparePrice).toHaveClass('line-through');
  });

  it('should not render compare-at price when absent', () => {
    const product = createProduct({ compareAtPrice: undefined });
    render(<ProductCard product={product} />);
    // Should only have one price (the current price)
    const prices = screen.getAllByText(/€/);
    expect(prices).toHaveLength(1);
  });

  it('should not render compare-at price when equal to price', () => {
    const product = createProduct({ price: 24.99, compareAtPrice: 24.99 });
    render(<ProductCard product={product} />);
    const prices = screen.getAllByText(/24,99\s€/);
    // Only current price, no strikethrough
    expect(prices).toHaveLength(1);
  });

  it('should not render compare-at price when lower than price', () => {
    const product = createProduct({ price: 29.99, compareAtPrice: 19.99 });
    render(<ProductCard product={product} />);
    // Only current price shown
    expect(screen.queryByText(/19,99\s€/)).not.toBeInTheDocument();
  });
});

describe('ProductCard - Hot Badge', () => {
  it('should show Hot badge when isHot is true', () => {
    const product = createProduct({ isHot: true });
    render(<ProductCard product={product} />);
    expect(screen.getByText('Hot')).toBeInTheDocument();
  });

  it('should hide Hot badge when isHot is false', () => {
    const product = createProduct({ isHot: false });
    render(<ProductCard product={product} />);
    expect(screen.queryByText('Hot')).not.toBeInTheDocument();
  });
});

describe('ProductCard - Rating', () => {
  it('should show average rating and review count when reviews exist', () => {
    const product = createProduct({ averageRating: 4.5, reviewsCount: 12 });
    render(<ProductCard product={product} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(12)')).toBeInTheDocument();
  });

  it('should hide rating when no reviews', () => {
    const product = createProduct({ reviewsCount: 0 });
    render(<ProductCard product={product} />);
    expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
  });
});

describe('ProductCard - Navigation', () => {
  it('should link entire card to /products/{slug}', () => {
    const product = createProduct({ slug: 'test-product-slug' });
    render(<ProductCard product={product} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/products/test-product-slug');
  });
});

describe('ProductCard - Accessibility & Styling', () => {
  it('should render title as h3 heading', () => {
    const product = createProduct();
    render(<ProductCard product={product} />);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('should apply custom className to card root', () => {
    const product = createProduct();
    const { container } = render(
      <ProductCard product={product} className="custom-class" />
    );
    const card = container.querySelector('[data-slot="card"]');
    expect(card).toHaveClass('custom-class');
  });
});
