import { render, screen } from '@testing-library/react';
import { CartPageContent } from './CartPageContent';
import type { CartItemLocal } from '@/stores/cartStore';
import { createCartItem } from './testing/fixtures';
import type { OrderSummaryProps } from '../checkout/OrderSummary';

// ---- Mock next/link ------------------------------------------------------------
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

// ---- Mock next/image -----------------------------------------------------------
jest.mock('next/image', () => {
  return function MockImage({
    fill,
    sizes,
    ...props
  }: Record<string, unknown>) {
    return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  };
});

// ---- Mock lucide-react ---------------------------------------------------------
jest.mock('lucide-react', () => ({
  ShoppingBag: (props: Record<string, unknown>) => (
    <svg data-testid="shopping-bag-icon" {...props} />
  ),
}));

// ---- Mock ./CartItem -----------------------------------------------------------
// Capture the props passed to it so we can verify wiring.
const mockOnUpdateQuantity = jest.fn();
const mockOnRemove = jest.fn();

jest.mock('./CartItem', () => ({
  CartItem: ({
    item,
    onUpdateQuantity,
    onRemove,
  }: {
    item: CartItemLocal;
    onUpdateQuantity: (productId: string, size: string | null, newQty: number) => void;
    onRemove: (productId: string, size: string | null) => void;
  }) => {
    // Forward calls so tests can spy on them
    mockOnUpdateQuantity.mockImplementation(onUpdateQuantity);
    mockOnRemove.mockImplementation(onRemove);
    return (
      <div data-testid={`cart-item-${item.productId}-${item.size ?? 'no-size'}`}>
        {item.title}
      </div>
    );
  },
}));

// ---- Mock ../checkout/OrderSummary ---------------------------------------------
// Renders as a div with data attributes so tests can verify props wiring.
// Must use relative path — jest.mock() doesn't resolve @/ aliases.
jest.mock('../checkout/OrderSummary', () => ({
  OrderSummary: ({
    subtotal,
    itemCount,
    isLoading,
    discountAmount,
    shippingCost,
    taxAmount,
    total,
  }: OrderSummaryProps) => (
    <div
      data-testid="order-summary"
      data-subtotal={subtotal}
      data-item-count={itemCount}
      data-is-loading={isLoading}
      data-discount-amount={discountAmount}
      data-shipping-cost={shippingCost}
      data-tax-amount={taxAmount}
      data-total={total}
    />
  ),
}));

// ---- Mock ../product/CrossSellSection ------------------------------------------
// Renders as a div to verify productId wiring.
jest.mock('../product/CrossSellSection', () => ({
  CrossSellSection: ({ productId }: { productId: string }) => (
    <div data-testid="cross-sell-section" data-product-id={productId} />
  ),
}));

// ---- Mock ../../stores/cartStore -----------------------------------------------
const mockRehydrate = jest.fn();

// Default mock state — can be overridden per test.
let mockItems: CartItemLocal[] = [];
let mockItemCount = 0;
let mockSubtotal = 0;
const mockUpdateQuantity = jest.fn();
const mockRemoveItem = jest.fn();

jest.mock('../../stores/cartStore', () => ({
  useCartStore: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      items: mockItems,
      itemCount: mockItemCount,
      subtotal: mockSubtotal,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
    };
    return selector(state);
  },
}));

afterEach(() => {
  jest.clearAllMocks();
  mockItems = [];
  mockItemCount = 0;
  mockSubtotal = 0;
});

// Attach persist.rehydrate to the mocked hook after the mock is registered.
beforeAll(() => {
  const cartStoreModule = require('../../stores/cartStore');
  cartStoreModule.useCartStore.persist = { rehydrate: mockRehydrate };
});

// ================================================================================
// A: Empty Cart State
// ================================================================================

describe('CartPageContent - Empty Cart State', () => {
  it('renders "Your cart is empty" message when cart has no items', () => {
    mockItems = [];
    render(<CartPageContent />);
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('renders "Continue Shopping" link pointing to /products when empty', () => {
    mockItems = [];
    render(<CartPageContent />);
    const links = screen.getAllByRole('link', { name: /continue shopping/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', '/products');
  });

  it('does not render order summary when cart is empty', () => {
    mockItems = [];
    render(<CartPageContent />);
    expect(screen.queryByTestId('order-summary')).not.toBeInTheDocument();
  });

  it('does not render any CartItem when cart is empty', () => {
    mockItems = [];
    render(<CartPageContent />);
    expect(screen.queryByTestId(/^cart-item-/)).not.toBeInTheDocument();
  });
});

// ================================================================================
// B: Cart With Items
// ================================================================================

describe('CartPageContent - Cart With Items', () => {
  beforeEach(() => {
    mockItems = [
      createCartItem({ productId: 'prod-1', title: 'Funny Cat Meme T-Shirt', size: 'M' }),
      createCartItem({ productId: 'prod-2', title: 'Cool Dog Hoodie', size: 'L' }),
    ];
    mockItemCount = 4;
    mockSubtotal = 99.96;
  });

  it('renders one CartItem per item in the store', () => {
    render(<CartPageContent />);
    expect(screen.getByTestId('cart-item-prod-1-M')).toBeInTheDocument();
    expect(screen.getByTestId('cart-item-prod-2-L')).toBeInTheDocument();
  });

  it('renders page heading "Shopping Cart"', () => {
    render(<CartPageContent />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/shopping cart/i);
  });

  it('passes subtotal from store to OrderSummary', () => {
    render(<CartPageContent />);
    const summary = screen.getByTestId('order-summary');
    expect(summary).toHaveAttribute('data-subtotal', '99.96');
  });

  it('passes item count from store to OrderSummary', () => {
    render(<CartPageContent />);
    const summary = screen.getByTestId('order-summary');
    expect(summary).toHaveAttribute('data-item-count', '4');
  });

  it('passes isLoading=false to OrderSummary', () => {
    render(<CartPageContent />);
    const summary = screen.getByTestId('order-summary');
    expect(summary).toHaveAttribute('data-is-loading', 'false');
  });

  it('does not render empty state message when items exist', () => {
    render(<CartPageContent />);
    expect(screen.queryByText(/your cart is empty/i)).not.toBeInTheDocument();
  });
});

// ================================================================================
// C: Navigation Links
// ================================================================================

describe('CartPageContent - Navigation Links', () => {
  it('renders "Proceed to Checkout" link pointing to /checkout when cart has items', () => {
    mockItems = [createCartItem({ productId: 'prod-1' })];
    mockItemCount = 1;
    render(<CartPageContent />);
    const checkoutLink = screen.getByRole('link', { name: /proceed to checkout/i });
    expect(checkoutLink).toBeInTheDocument();
    expect(checkoutLink).toHaveAttribute('href', '/checkout');
  });

  it('renders "Continue Shopping" link pointing to /products when cart has items', () => {
    mockItems = [createCartItem({ productId: 'prod-1' })];
    mockItemCount = 1;
    render(<CartPageContent />);
    const link = screen.getByRole('link', { name: /continue shopping/i });
    expect(link).toHaveAttribute('href', '/products');
  });
});

// ================================================================================
// D: Store Wiring
// ================================================================================

describe('CartPageContent - Store Wiring', () => {
  beforeEach(() => {
    mockItems = [createCartItem({ productId: 'prod-1', size: 'M' })];
    mockItemCount = 1;
  });

  it('wires onUpdateQuantity to store.updateQuantity', () => {
    render(<CartPageContent />);
    // Trigger the callback captured by the mock CartItem
    mockOnUpdateQuantity('prod-1', 'M', 3);
    expect(mockUpdateQuantity).toHaveBeenCalledWith('prod-1', 'M', 3);
  });

  it('wires onRemove to store.removeItem', () => {
    render(<CartPageContent />);
    mockOnRemove('prod-1', 'M');
    expect(mockRemoveItem).toHaveBeenCalledWith('prod-1', 'M');
  });
});

// ================================================================================
// E: Hydration
// ================================================================================

describe('CartPageContent - Hydration', () => {
  it('calls useCartStore.persist.rehydrate() on mount', () => {
    render(<CartPageContent />);
    expect(mockRehydrate).toHaveBeenCalledTimes(1);
  });
});

// ================================================================================
// F: Accessibility
// ================================================================================

describe('CartPageContent - Accessibility', () => {
  it('page has an h1 heading', () => {
    render(<CartPageContent />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('items list uses semantic ul markup', () => {
    mockItems = [
      createCartItem({ productId: 'prod-1', size: 'M' }),
      createCartItem({ productId: 'prod-2', size: 'L' }),
    ];
    mockItemCount = 2;
    render(<CartPageContent />);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('each cart item is wrapped in a li element', () => {
    mockItems = [
      createCartItem({ productId: 'prod-1', size: 'M' }),
      createCartItem({ productId: 'prod-2', size: 'L' }),
    ];
    mockItemCount = 2;
    render(<CartPageContent />);
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(2);
  });
});

// ================================================================================
// G: Cross-Sell Integration
// ================================================================================

describe('CartPageContent - Cross-Sell Integration', () => {
  it('renders CrossSellSection with first item productId when cart has items', () => {
    mockItems = [
      createCartItem({ productId: 'prod-123', size: 'M' }),
      createCartItem({ productId: 'prod-456', size: 'L' }),
    ];
    mockItemCount = 2;

    render(<CartPageContent />);

    const crossSell = screen.getByTestId('cross-sell-section');
    expect(crossSell).toBeInTheDocument();
    expect(crossSell).toHaveAttribute('data-product-id', 'prod-123');
  });

  it('does not render CrossSellSection when cart is empty', () => {
    mockItems = [];
    mockItemCount = 0;

    render(<CartPageContent />);

    expect(screen.queryByTestId('cross-sell-section')).not.toBeInTheDocument();
  });

  it('uses first cart item productId, not others', () => {
    mockItems = [
      createCartItem({ productId: 'first-product', size: 'S' }),
      createCartItem({ productId: 'second-product', size: 'M' }),
      createCartItem({ productId: 'third-product', size: 'L' }),
    ];
    mockItemCount = 3;

    render(<CartPageContent />);

    const crossSell = screen.getByTestId('cross-sell-section');
    expect(crossSell).toHaveAttribute('data-product-id', 'first-product');
  });
});
