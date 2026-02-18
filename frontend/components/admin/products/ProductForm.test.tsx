import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductForm } from './ProductForm';
import { adminProductService } from '@/lib/services/adminProductService';
import { productTypeService } from '@/lib/services/productTypeService';
import type { components } from '@/lib/api/types';

type Product = components['schemas']['Product'];
type ProductImage = components['schemas']['ProductImage'];
type ProductType = components['schemas']['ProductType'];

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

// Mock ProductImageManager (tested separately)
jest.mock('./ProductImageManager', () => ({
  ProductImageManager: ({ images }: { images: ProductImage[] }) => (
    <div data-testid="image-manager">
      <span data-testid="image-count">{images.length}</span>
    </div>
  ),
}));

// Mock adminProductService
jest.mock('../../../lib/services/adminProductService', () => ({
  adminProductService: {
    create: jest.fn(),
    update: jest.fn(),
  },
}));

// Mock productTypeService
jest.mock('../../../lib/services/productTypeService', () => ({
  productTypeService: {
    getAll: jest.fn(),
  },
}));

// Mock the ui/select module directly with native HTML elements
// This avoids the Radix portal issues in JSDOM
jest.mock('../../ui/select', () => ({
  Select: ({ children, value, onValueChange, disabled }: any) => {
    const React = require('react');
    const ref = React.useRef<HTMLSelectElement>(null);
    // Provide context via a wrapper that injects onValueChange
    return (
      <div data-testid="select-root" data-value={value} data-disabled={disabled}>
        {React.Children.map(children, (child: any) =>
          React.isValidElement(child)
            ? React.cloneElement(child, { __onValueChange: onValueChange, __value: value } as any)
            : child
        )}
      </div>
    );
  },
  SelectTrigger: ({ children, __onValueChange, __value }: any) => (
    <>{children}</>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children, __onValueChange, __value }: any) => {
    const React = require('react');
    // Render children as options inside a native select
    return (
      <select
        data-testid="select-trigger"
        value={__value || ''}
        onChange={(e) => __onValueChange?.(e.target.value)}
      >
        <option value="">--</option>
        {children}
      </select>
    );
  },
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

const mockAdminProductService = adminProductService as jest.Mocked<typeof adminProductService>;
const mockProductTypeService = productTypeService as jest.Mocked<typeof productTypeService>;

const mockProductTypes: ProductType[] = [
  { id: 'type-1', name: { es: 'Camisetas', en: 'T-Shirts' } as unknown as string, slug: 't-shirts', hasSizes: true, isActive: true, sortOrder: 1 },
  { id: 'type-2', name: { es: 'Tazas', en: 'Mugs' } as unknown as string, slug: 'mugs', hasSizes: false, isActive: true, sortOrder: 2 },
];

const mockProduct: Product = {
  id: 'prod-1',
  title: 'Funny Cat Meme',
  description: 'A hilarious cat meme shirt',
  slug: 'funny-cat-meme',
  price: 24.99,
  compareAtPrice: 34.99,
  availableSizes: ['M', 'L'],
  color: 'black',
  isActive: true,
  isHot: true,
  productType: { id: 'type-1', name: { es: 'Camisetas', en: 'T-Shirts' } as unknown as string, slug: 't-shirts' },
  createdAt: '2026-02-01T00:00:00Z',
};

const mockImages: ProductImage[] = [
  { id: 'img-1', url: 'https://example.com/img1.jpg', altText: 'Image 1', isPrimary: true, sortOrder: 0 },
  { id: 'img-2', url: 'https://example.com/img2.jpg', altText: 'Image 2', isPrimary: false, sortOrder: 1 },
];

describe('ProductForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProductTypeService.getAll.mockResolvedValue(mockProductTypes);
  });

  describe('create mode', () => {
    it('should render all required form fields', async () => {
      render(<ProductForm />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalledWith({ isActive: true });
      });

      expect(screen.getByLabelText(/title \(spanish\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description \(spanish\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^price$/i)).toBeInTheDocument();
    });

    it('should render optional fields', async () => {
      render(<ProductForm />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      expect(screen.getByLabelText(/title \(english\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description \(english\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/compare at price/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^color$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/meme source url/i)).toBeInTheDocument();
    });

    it('should render size checkboxes', async () => {
      render(<ProductForm />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      for (const size of ['S', 'M', 'L', 'XL', 'XXL']) {
        expect(screen.getByLabelText(size)).toBeInTheDocument();
      }
    });

    it('should render boolean toggles', async () => {
      render(<ProductForm />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      expect(screen.getByLabelText(/active/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hot/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/original meme/i)).toBeInTheDocument();
    });

    it('should populate product type dropdown from service', async () => {
      render(<ProductForm />);

      await waitFor(() => {
        const select = screen.getByTestId('select-trigger') as HTMLSelectElement;
        const options = select.querySelectorAll('option');
        const optionValues = Array.from(options).map((o) => o.value);
        expect(optionValues).toContain('type-1');
        expect(optionValues).toContain('type-2');
      });

      expect(mockProductTypeService.getAll).toHaveBeenCalledWith({ isActive: true });
    });

    it('should display localized product type names via getLocalizedName', async () => {
      render(<ProductForm />);

      await waitFor(() => {
        const select = screen.getByTestId('select-trigger') as HTMLSelectElement;
        const options = Array.from(select.querySelectorAll('option')).filter((o) => o.value !== '');
        const optionTexts = options.map((o) => o.textContent);
        expect(optionTexts).toContain('Camisetas');
        expect(optionTexts).toContain('Tazas');
      });
    });

    it('should validate required: title.es shows error when empty on submit', async () => {
      const user = userEvent.setup();
      render(<ProductForm />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      await user.click(screen.getByRole('button', { name: /create/i }));

      expect(screen.getByText('Title (Spanish) is required')).toBeInTheDocument();
    });

    it('should validate required: productTypeId shows error when not selected', async () => {
      const user = userEvent.setup();
      render(<ProductForm />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      await user.click(screen.getByRole('button', { name: /create/i }));

      expect(screen.getByText('Product type is required')).toBeInTheDocument();
    });

    it('should validate required: price shows error when empty', async () => {
      const user = userEvent.setup();
      render(<ProductForm />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      await user.click(screen.getByRole('button', { name: /create/i }));

      expect(screen.getByText('Price is required')).toBeInTheDocument();
    });

    it('should call adminProductService.create with correct data on valid submit', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();
      const createdProduct = { ...mockProduct, id: 'new-prod-1' };
      mockAdminProductService.create.mockResolvedValueOnce(createdProduct);

      render(<ProductForm onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      // Fill required fields
      await user.type(screen.getByLabelText(/title \(spanish\)/i), 'Test Product');
      await user.type(screen.getByLabelText(/^price$/i), '29.99');

      // Select product type via the mock select's onChange
      const select = screen.getByTestId('select-trigger') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'type-1' } });

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockAdminProductService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            title: { es: 'Test Product' },
            description: { es: '' },
            price: 29.99,
            productTypeId: 'type-1',
            color: 'white',
            isActive: true,
            isHot: false,
          })
        );
      });

      expect(mockOnSuccess).toHaveBeenCalledWith(createdProduct);
    });

    it('should show "Creating..." on submit button while submitting', async () => {
      const user = userEvent.setup();
      mockAdminProductService.create.mockImplementation(
        () => new Promise(() => {}) // never resolves
      );

      render(<ProductForm />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      await user.type(screen.getByLabelText(/title \(spanish\)/i), 'Test');
      await user.type(screen.getByLabelText(/^price$/i), '10');
      const select = screen.getByTestId('select-trigger') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'type-1' } });

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
      });
    });

    it('should display API error message on failure', async () => {
      const user = userEvent.setup();
      mockAdminProductService.create.mockRejectedValueOnce(new Error('Slug already exists'));

      render(<ProductForm />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      await user.type(screen.getByLabelText(/title \(spanish\)/i), 'Test');
      await user.type(screen.getByLabelText(/^price$/i), '10');
      const select = screen.getByTestId('select-trigger') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'type-1' } });

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText('Slug already exists')).toBeInTheDocument();
      });
    });

    it('should have a back link to /admin/products', async () => {
      render(<ProductForm />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      expect(screen.getByRole('link', { name: /back to products/i })).toHaveAttribute(
        'href',
        '/admin/products'
      );
    });

    it('should not render ProductImageManager in create mode', async () => {
      render(<ProductForm />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      expect(screen.queryByTestId('image-manager')).not.toBeInTheDocument();
    });

    it('shows informational message about images in create mode', async () => {
      render(<ProductForm />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      expect(screen.getByText(/images can be added after the product is created/i)).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('extracts es/en from localized title object', async () => {
      const mockProductWithLocalizedFields: Product = {
        ...mockProduct,
        title: { es: 'Gato Gracioso', en: 'Funny Cat' } as unknown as string,
        description: { es: 'Un meme de gato', en: 'A cat meme' } as unknown as string,
      };

      render(<ProductForm product={mockProductWithLocalizedFields} initialImages={mockImages} />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      expect(screen.getByLabelText(/title \(spanish\)/i)).toHaveValue('Gato Gracioso');
      expect(screen.getByLabelText(/title \(english\)/i)).toHaveValue('Funny Cat');
    });

    it('extracts es/en from localized description object', async () => {
      const mockProductWithLocalizedFields: Product = {
        ...mockProduct,
        title: { es: 'Gato Gracioso', en: 'Funny Cat' } as unknown as string,
        description: { es: 'Un meme de gato', en: 'A cat meme' } as unknown as string,
      };

      render(<ProductForm product={mockProductWithLocalizedFields} initialImages={mockImages} />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      expect(screen.getByLabelText(/description \(spanish\)/i)).toHaveValue('Un meme de gato');
      expect(screen.getByLabelText(/description \(english\)/i)).toHaveValue('A cat meme');
    });

    it('handles product with string title (backward compat)', async () => {
      render(<ProductForm product={mockProduct} initialImages={mockImages} />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      expect(screen.getByLabelText(/title \(spanish\)/i)).toHaveValue('Funny Cat Meme');
    });

    it('should pre-fill all fields from product data', async () => {
      render(<ProductForm product={mockProduct} initialImages={mockImages} />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      expect(screen.getByLabelText(/title \(spanish\)/i)).toHaveValue('Funny Cat Meme');
      expect(screen.getByLabelText(/description \(spanish\)/i)).toHaveValue('A hilarious cat meme shirt');
      expect(screen.getByLabelText(/^price$/i)).toHaveValue(24.99);
      expect(screen.getByLabelText(/compare at price/i)).toHaveValue(34.99);
      expect(screen.getByLabelText(/^color$/i)).toHaveValue('black');
    });

    it('should render ProductImageManager with initial images', async () => {
      render(<ProductForm product={mockProduct} initialImages={mockImages} />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      expect(screen.getByTestId('image-manager')).toBeInTheDocument();
      expect(screen.getByTestId('image-count')).toHaveTextContent('2');
    });

    it('should show priceChangeReason field when price changes', async () => {
      const user = userEvent.setup();

      render(<ProductForm product={mockProduct} initialImages={mockImages} />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      // Initially hidden
      expect(screen.queryByLabelText(/price change reason/i)).not.toBeInTheDocument();

      // Change price
      const priceInput = screen.getByLabelText(/^price$/i);
      await user.clear(priceInput);
      await user.type(priceInput, '39.99');

      expect(screen.getByLabelText(/price change reason/i)).toBeInTheDocument();
    });

    it('should show "Update" as button text in edit mode', async () => {
      render(<ProductForm product={mockProduct} initialImages={mockImages} />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      expect(screen.getByRole('button', { name: /^update$/i })).toBeInTheDocument();
    });

    it('should call adminProductService.update with correct data on submit', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();
      const updatedProduct = { ...mockProduct, price: 39.99 };
      mockAdminProductService.update.mockResolvedValueOnce(updatedProduct);

      render(
        <ProductForm product={mockProduct} initialImages={mockImages} onSuccess={mockOnSuccess} />
      );

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      // Change price
      const priceInput = screen.getByLabelText(/^price$/i);
      await user.clear(priceInput);
      await user.type(priceInput, '39.99');

      // Fill price change reason
      await user.type(screen.getByLabelText(/price change reason/i), 'Inflation adjustment');

      await user.click(screen.getByRole('button', { name: /^update$/i }));

      await waitFor(() => {
        expect(mockAdminProductService.update).toHaveBeenCalledWith(
          'prod-1',
          expect.objectContaining({
            price: 39.99,
            priceChangeReason: 'Inflation adjustment',
          })
        );
      });

      expect(mockOnSuccess).toHaveBeenCalledWith(updatedProduct);
    });

    it('should show "Updating..." on submit button while submitting', async () => {
      const user = userEvent.setup();
      mockAdminProductService.update.mockImplementation(
        () => new Promise(() => {}) // never resolves
      );

      render(<ProductForm product={mockProduct} initialImages={mockImages} />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      await user.click(screen.getByRole('button', { name: /^update$/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
      });
    });

    it('does not show create-mode image guidance in edit mode', async () => {
      render(<ProductForm product={mockProduct} initialImages={mockImages} />);

      await waitFor(() => {
        expect(mockProductTypeService.getAll).toHaveBeenCalled();
      });

      expect(screen.queryByText(/images can be added after the product is created/i)).not.toBeInTheDocument();
    });
  });
});
