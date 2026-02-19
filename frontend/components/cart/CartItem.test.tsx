import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartItem } from './CartItem';
import type { CartItemLocal } from '@/stores/cartStore';
import { MAX_ITEM_QUANTITY } from '@/stores/cartStore';

// Mock next/link
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

// Mock next/image (filter out Next.js-specific props that are not valid HTML attributes)
jest.mock('next/image', () => {
  return function MockImage({
    fill,
    sizes,
    ...props
  }: Record<string, unknown>) {
    return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: (props: Record<string, unknown>) => (
    <svg data-testid="plus-icon" {...props} />
  ),
  Minus: (props: Record<string, unknown>) => (
    <svg data-testid="minus-icon" {...props} />
  ),
  Trash2: (props: Record<string, unknown>) => (
    <svg data-testid="trash-icon" {...props} />
  ),
  ImageOff: (props: Record<string, unknown>) => (
    <svg data-testid="image-off-icon" {...props} />
  ),
}));

// Fixture factory
function createCartItem(overrides: Partial<CartItemLocal> = {}): CartItemLocal {
  return {
    productId: 'prod-1',
    slug: 'funny-cat-meme-tshirt',
    title: 'Funny Cat Meme T-Shirt',
    price: 24.99,
    size: 'M',
    quantity: 2,
    primaryImage: {
      id: 'img-1',
      url: 'https://res.cloudinary.com/test/image/upload/v1/products/cat-meme.jpg',
      altText: 'Funny cat meme on a white t-shirt',
      isPrimary: true,
      sortOrder: 0,
    },
    ...overrides,
  };
}

describe('CartItem - Product Image Display', () => {
  it('renders product image with correct src, alt, width=80, height=80', () => {
    const item = createCartItem();
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute(
      'src',
      'https://res.cloudinary.com/test/image/upload/v1/products/cat-meme.jpg'
    );
    expect(img).toHaveAttribute(
      'alt',
      'Funny cat meme on a white t-shirt'
    );
    expect(img).toHaveAttribute('width', '80');
    expect(img).toHaveAttribute('height', '80');
  });

  it('renders ImageOff fallback when primaryImage is null', () => {
    const item = createCartItem({ primaryImage: null });
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('image-off-icon')).toBeInTheDocument();
  });

  it('fallback has aria-label "No product image"', () => {
    const item = createCartItem({ primaryImage: null });
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    expect(screen.getByLabelText('No product image')).toBeInTheDocument();
  });
});

describe('CartItem - Product Title and Link', () => {
  it('renders product title text', () => {
    const item = createCartItem({ title: 'Funny Cat Meme T-Shirt' });
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    expect(screen.getByText('Funny Cat Meme T-Shirt')).toBeInTheDocument();
  });

  it('title links to /products/{slug}', () => {
    const item = createCartItem({ slug: 'funny-cat-meme-tshirt' });
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    const link = screen.getByRole('link', { name: /Funny Cat Meme T-Shirt/i });
    expect(link).toHaveAttribute('href', '/products/funny-cat-meme-tshirt');
  });
});

describe('CartItem - Size Display', () => {
  it('shows size label when size is not null', () => {
    const item = createCartItem({ size: 'M' });
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    expect(screen.getByText(/Size:\s*M/)).toBeInTheDocument();
  });

  it('does not show size label when size is null', () => {
    const item = createCartItem({ size: null });
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    expect(screen.queryByText(/Size:/)).not.toBeInTheDocument();
  });
});

describe('CartItem - Price Display', () => {
  it('shows formatted unit price (24,99 €)', () => {
    const item = createCartItem({ price: 24.99, quantity: 2 });
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    expect(screen.getByText(/24,99\s€/)).toBeInTheDocument();
  });

  it('shows formatted line total (price × qty: 49,98 €)', () => {
    const item = createCartItem({ price: 24.99, quantity: 2 });
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    expect(screen.getByText(/49,98\s€/)).toBeInTheDocument();
  });

  it('line total equals unit price when quantity is 1', () => {
    const item = createCartItem({ price: 24.99, quantity: 1 });
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    // Both unit price and line total are the same — two matches
    const prices = screen.getAllByText(/24,99\s€/);
    expect(prices).toHaveLength(2);
  });
});

describe('CartItem - Quantity Controls', () => {
  it('displays current quantity', () => {
    const item = createCartItem({ quantity: 3 });
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('calls onUpdateQuantity(productId, size, qty+1) on + click', async () => {
    const user = userEvent.setup();
    const onUpdateQuantity = jest.fn();
    const item = createCartItem({ productId: 'prod-1', size: 'M', quantity: 2 });
    render(
      <CartItem
        item={item}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={jest.fn()}
      />
    );
    await user.click(
      screen.getByRole('button', { name: /Increase/i })
    );
    expect(onUpdateQuantity).toHaveBeenCalledWith('prod-1', 'M', 3);
  });

  it('calls onUpdateQuantity(productId, size, qty-1) on - click', async () => {
    const user = userEvent.setup();
    const onUpdateQuantity = jest.fn();
    const item = createCartItem({ productId: 'prod-1', size: 'M', quantity: 2 });
    render(
      <CartItem
        item={item}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={jest.fn()}
      />
    );
    await user.click(
      screen.getByRole('button', { name: /Decrease/i })
    );
    expect(onUpdateQuantity).toHaveBeenCalledWith('prod-1', 'M', 1);
  });

  it('disables decrement button when quantity is 1', () => {
    const item = createCartItem({ quantity: 1 });
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    expect(
      screen.getByRole('button', { name: /Decrease/i })
    ).toBeDisabled();
  });

  it('disables increment button when quantity is MAX_ITEM_QUANTITY (99)', () => {
    const item = createCartItem({ quantity: MAX_ITEM_QUANTITY });
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    expect(
      screen.getByRole('button', { name: /Increase/i })
    ).toBeDisabled();
  });

  it('does not disable decrement when quantity > 1', () => {
    const item = createCartItem({ quantity: 2 });
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    expect(
      screen.getByRole('button', { name: /Decrease/i })
    ).not.toBeDisabled();
  });

  it('does not disable increment when quantity < MAX_ITEM_QUANTITY', () => {
    const item = createCartItem({ quantity: MAX_ITEM_QUANTITY - 1 });
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    expect(
      screen.getByRole('button', { name: /Increase/i })
    ).not.toBeDisabled();
  });
});

describe('CartItem - Remove Button', () => {
  it('calls onRemove(productId, size) on click', async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();
    const item = createCartItem({ productId: 'prod-1', size: 'M' });
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={onRemove} />
    );
    await user.click(screen.getByRole('button', { name: /Remove/i }));
    expect(onRemove).toHaveBeenCalledWith('prod-1', 'M');
  });

  it('calls onRemove(productId, null) when size is null', async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();
    const item = createCartItem({ productId: 'prod-1', size: null });
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={onRemove} />
    );
    await user.click(screen.getByRole('button', { name: /Remove/i }));
    expect(onRemove).toHaveBeenCalledWith('prod-1', null);
  });
});

describe('CartItem - Accessibility', () => {
  it('increment button has aria-label containing "Increase"', () => {
    const item = createCartItem();
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    expect(
      screen.getByRole('button', { name: /Increase/i })
    ).toBeInTheDocument();
  });

  it('decrement button has aria-label containing "Decrease"', () => {
    const item = createCartItem();
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    expect(
      screen.getByRole('button', { name: /Decrease/i })
    ).toBeInTheDocument();
  });

  it('remove button has aria-label containing "Remove"', () => {
    const item = createCartItem();
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    expect(
      screen.getByRole('button', { name: /Remove/i })
    ).toBeInTheDocument();
  });

  it('image renders alt text from primaryImage', () => {
    const item = createCartItem({
      primaryImage: {
        id: 'img-1',
        url: 'https://example.com/img.jpg',
        altText: 'A funny cat wearing sunglasses',
        isPrimary: true,
        sortOrder: 0,
      },
    });
    render(
      <CartItem item={item} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    expect(
      screen.getByAltText('A funny cat wearing sunglasses')
    ).toBeInTheDocument();
  });
});

describe('CartItem - Edge Cases', () => {
  it('handles item with null size — no size label, callbacks receive null', async () => {
    const user = userEvent.setup();
    const onUpdateQuantity = jest.fn();
    const onRemove = jest.fn();
    const item = createCartItem({ size: null, quantity: 2 });
    render(
      <CartItem
        item={item}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemove}
      />
    );

    expect(screen.queryByText(/Size:/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Increase/i }));
    expect(onUpdateQuantity).toHaveBeenCalledWith('prod-1', null, 3);

    await user.click(screen.getByRole('button', { name: /Remove/i }));
    expect(onRemove).toHaveBeenCalledWith('prod-1', null);
  });

  it('passes correct productId and size=null for onUpdateQuantity', async () => {
    const user = userEvent.setup();
    const onUpdateQuantity = jest.fn();
    const item = createCartItem({
      productId: 'prod-special',
      size: null,
      quantity: 5,
    });
    render(
      <CartItem
        item={item}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={jest.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /Decrease/i }));
    expect(onUpdateQuantity).toHaveBeenCalledWith('prod-special', null, 4);
  });
});
