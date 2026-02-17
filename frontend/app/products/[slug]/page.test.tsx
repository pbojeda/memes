// 1. Mock next/navigation — page uses useParams to get slug
jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ slug: 'funny-cat-meme-tshirt' })),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// 2. Mock productService
jest.mock('../../../lib/services/productService', () => ({
  productService: { list: jest.fn(), getBySlug: jest.fn() },
}));

// 3. Mock ImageGallery — isolate page logic
jest.mock('../../../components/product/ImageGallery', () => ({
  ImageGallery: ({ images }: { images?: unknown[] }) => (
    <div data-testid="image-gallery" data-image-count={images?.length ?? 0} />
  ),
}));

// 4. Mock ReviewList — isolate page logic
jest.mock('../../../components/product/ReviewList', () => ({
  ReviewList: ({ productId }: { productId: string }) => (
    <div data-testid="review-list" data-product-id={productId} />
  ),
}));

// 5. Mock next/link
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

// 6. Mock next/image (filter fill/sizes props)
jest.mock('next/image', () => {
  return function MockImage({
    fill,
    sizes,
    ...props
  }: Record<string, unknown>) {
    return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  };
});

// 7. Mock lucide-react icons used by the page
jest.mock('lucide-react', () => ({
  ArrowLeft: (props: Record<string, unknown>) => (
    <svg data-testid="arrow-left-icon" {...props} />
  ),
  AlertCircle: (props: Record<string, unknown>) => (
    <svg data-testid="alert-circle-icon" {...props} />
  ),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams } from 'next/navigation';
import ProductDetailPage from './page';
import { productService } from '../../../lib/services/productService';
import {
  createProduct,
  createProductImages,
} from '../../../components/product/testing/fixtures';
import { ApiException } from '../../../lib/api/exceptions';
import type { components } from '../../../lib/api/types';

type ProductDetail = components['schemas']['ProductDetail'];
type ProductDetailResponse = components['schemas']['ProductDetailResponse'];

const createProductDetail = (
  overrides: Partial<ProductDetail> = {}
): ProductDetail => ({
  ...createProduct(),
  productType: { id: 'pt-1', name: 'T-Shirts', slug: 'tshirts', hasSizes: true },
  description: 'A great meme t-shirt',
  availableSizes: ['S', 'M', 'L'],
  color: 'white',
  images: createProductImages(2),
  ...overrides,
});

const createDetailResponse = (
  product: ProductDetail
): ProductDetailResponse => ({
  data: product,
});

describe('ProductDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ slug: 'funny-cat-meme-tshirt' });
    (productService.getBySlug as jest.Mock).mockResolvedValue(
      createDetailResponse(createProductDetail())
    );
  });

  // Group A — Loading state
  describe('Loading state', () => {
    it('A1: should show loading skeleton while fetching', () => {
      (productService.getBySlug as jest.Mock).mockReturnValue(
        new Promise(() => {})
      );
      render(<ProductDetailPage />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('A2: should show multiple skeleton placeholder elements during load', () => {
      (productService.getBySlug as jest.Mock).mockReturnValue(
        new Promise(() => {})
      );
      render(<ProductDetailPage />);
      const pulseElements = document
        .querySelectorAll('.animate-pulse')
        .length;
      expect(pulseElements).toBeGreaterThanOrEqual(2);
    });
  });

  // Group B — Successful product render
  describe('Successful product render', () => {
    it('B1: should call productService.getBySlug with slug from useParams', async () => {
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(productService.getBySlug).toHaveBeenCalledWith(
          'funny-cat-meme-tshirt'
        );
      });
    });

    it('B2: should display product title as h1', async () => {
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1 })
        ).toHaveTextContent('Funny Cat Meme T-Shirt');
      });
    });

    it('B3: should display product description', async () => {
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(
          screen.getByText('A great meme t-shirt')
        ).toBeInTheDocument();
      });
    });

    it('B4: should display formatted EUR price', async () => {
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(screen.getByText(/24,99\s€/)).toBeInTheDocument();
      });
    });

    it('B5: should display compare-at price with strikethrough', async () => {
      render(<ProductDetailPage />);
      await waitFor(() => {
        const compareEl = screen.getByText(/34,99\s€/);
        expect(compareEl).toBeInTheDocument();
        expect(compareEl).toHaveClass('line-through');
      });
    });

    it('B6: should not display compare-at price when absent', async () => {
      (productService.getBySlug as jest.Mock).mockResolvedValue(
        createDetailResponse(
          createProductDetail({ compareAtPrice: undefined })
        )
      );
      render(<ProductDetailPage />);
      await waitFor(() => {
        const euroMatches = screen.getAllByText(/€/);
        expect(euroMatches).toHaveLength(1);
      });
    });

    it('B7: should not display compare-at price when not higher than price', async () => {
      (productService.getBySlug as jest.Mock).mockResolvedValue(
        createDetailResponse(
          createProductDetail({ price: 24.99, compareAtPrice: 20.0 })
        )
      );
      render(<ProductDetailPage />);
      await waitFor(() => {
        const euroMatches = screen.getAllByText(/€/);
        expect(euroMatches).toHaveLength(1);
      });
    });

    it('B8: should display product type name', async () => {
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('T-Shirts')).toBeInTheDocument();
      });
    });

    it('B9: should display color', async () => {
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('white')).toBeInTheDocument();
      });
    });
  });

  // Group C — Hot badge
  describe('Hot badge', () => {
    it('C1: should show "Hot" badge when isHot is true', async () => {
      (productService.getBySlug as jest.Mock).mockResolvedValue(
        createDetailResponse(createProductDetail({ isHot: true }))
      );
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('Hot')).toBeInTheDocument();
      });
    });

    it('C2: should not show "Hot" badge when isHot is false', async () => {
      (productService.getBySlug as jest.Mock).mockResolvedValue(
        createDetailResponse(createProductDetail({ isHot: false }))
      );
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
      expect(screen.queryByText('Hot')).toBeNull();
    });
  });

  // Group D — Available sizes
  describe('Available sizes', () => {
    it('D1: should display each available size as a badge', async () => {
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('S')).toBeInTheDocument();
        expect(screen.getByText('M')).toBeInTheDocument();
        expect(screen.getByText('L')).toBeInTheDocument();
      });
    });

    it('D2: should not render sizes section when availableSizes is empty', async () => {
      (productService.getBySlug as jest.Mock).mockResolvedValue(
        createDetailResponse(createProductDetail({ availableSizes: [] }))
      );
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
      expect(screen.queryByText('S')).toBeNull();
      expect(screen.queryByText('M')).toBeNull();
      expect(screen.queryByText('L')).toBeNull();
    });

    it('D3: should not render sizes section when hasSizes is false', async () => {
      (productService.getBySlug as jest.Mock).mockResolvedValue(
        createDetailResponse(
          createProductDetail({
            productType: {
              id: 'pt-1',
              name: 'Mugs',
              slug: 'mugs',
              hasSizes: false,
            },
          })
        )
      );
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
      expect(screen.queryByText('S')).toBeNull();
    });
  });

  // Group E — ImageGallery composition
  describe('ImageGallery composition', () => {
    it('E1: should render ImageGallery with product images', async () => {
      render(<ProductDetailPage />);
      await waitFor(() => {
        const gallery = screen.getByTestId('image-gallery');
        expect(gallery).toBeInTheDocument();
        expect(gallery).toHaveAttribute('data-image-count', '2');
      });
    });

    it('E2: should render ImageGallery with empty images when product has none', async () => {
      (productService.getBySlug as jest.Mock).mockResolvedValue(
        createDetailResponse(createProductDetail({ images: undefined }))
      );
      render(<ProductDetailPage />);
      await waitFor(() => {
        const gallery = screen.getByTestId('image-gallery');
        expect(gallery).toHaveAttribute('data-image-count', '0');
      });
    });
  });

  // Group F — ReviewList composition
  describe('ReviewList composition', () => {
    it('F1: should render ReviewList with product id', async () => {
      render(<ProductDetailPage />);
      await waitFor(() => {
        const reviewList = screen.getByTestId('review-list');
        expect(reviewList).toBeInTheDocument();
        expect(reviewList).toHaveAttribute('data-product-id', 'prod-1');
      });
    });
  });

  // Group G — Back-to-catalog link
  describe('Back-to-catalog link', () => {
    it('G1: should render a back-to-catalog link pointing to /products', async () => {
      render(<ProductDetailPage />);
      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /back/i });
        expect(backLink).toBeInTheDocument();
        expect(backLink).toHaveAttribute('href', '/products');
      });
    });
  });

  // Group H — Error state
  describe('Error state', () => {
    it('H1: should show error alert when getBySlug rejects', async () => {
      (productService.getBySlug as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('H2: should show retry button in error state', async () => {
      (productService.getBySlug as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /retry/i })
        ).toBeInTheDocument();
      });
    });

    it('H3: should refetch when retry is clicked', async () => {
      const user = userEvent.setup();
      (productService.getBySlug as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /retry/i })
        ).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /retry/i }));
      await waitFor(() => {
        expect(productService.getBySlug).toHaveBeenCalledTimes(2);
      });
    });

    it('H4: should clear error and show product after successful retry', async () => {
      const user = userEvent.setup();
      (productService.getBySlug as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(
          createDetailResponse(createProductDetail())
        );
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /retry/i })
        ).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /retry/i }));
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1 })
        ).toBeInTheDocument();
      });
    });
  });

  // Group I — 404 state
  describe('404 state', () => {
    it('I1: should show not-found message when getBySlug throws 404', async () => {
      (productService.getBySlug as jest.Mock).mockRejectedValue(
        new ApiException('NOT_FOUND', 'Product not found', 404)
      );
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(
          screen.getByText(/product not found/i)
        ).toBeInTheDocument();
      });
    });

    it('I2: should show link to catalog in not-found state', async () => {
      (productService.getBySlug as jest.Mock).mockRejectedValue(
        new ApiException('NOT_FOUND', 'Product not found', 404)
      );
      render(<ProductDetailPage />);
      await waitFor(() => {
        const links = screen.getAllByRole('link');
        const catalogLink = links.find(
          (l) => l.getAttribute('href') === '/products'
        );
        expect(catalogLink).toBeDefined();
      });
    });

    it('I3: should not show retry button in 404 state', async () => {
      (productService.getBySlug as jest.Mock).mockRejectedValue(
        new ApiException('NOT_FOUND', 'Product not found', 404)
      );
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(screen.getByText(/product not found/i)).toBeInTheDocument();
      });
      expect(screen.queryByRole('button', { name: /retry/i })).toBeNull();
    });
  });

  // Group J — Localization
  describe('Localization', () => {
    it('J1: should handle localized title (object form)', async () => {
      (productService.getBySlug as jest.Mock).mockResolvedValue(
        createDetailResponse(
          createProductDetail({ title: { es: 'Camiseta', en: 'T-Shirt' } as unknown as string })
        )
      );
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
          'Camiseta'
        );
      });
    });

    it('J2: should handle localized description (object form)', async () => {
      (productService.getBySlug as jest.Mock).mockResolvedValue(
        createDetailResponse(
          createProductDetail({
            description: { es: 'Descripción', en: 'Description' } as unknown as string,
          })
        )
      );
      render(<ProductDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('Descripción')).toBeInTheDocument();
      });
    });
  });
});
