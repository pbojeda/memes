import { render, screen } from '@testing-library/react';
import { CartDrawer } from './CartDrawer';
import type { CartItemLocal } from '@/stores/cartStore';

// ---- Mock ../ui/sheet ----------------------------------------------------------
// Render sub-components as plain HTML elements to avoid portal/JSDOM issues.
jest.mock('../ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet">{children}</div>
  ),
  SheetTrigger: ({
    children,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <div data-testid="sheet-trigger">{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-content">{children}</div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-header">{children}</div>
  ),
  SheetFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-footer">{children}</div>
  ),
  SheetTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="sheet-title">{children}</h2>
  ),
  SheetDescription: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <p data-testid="sheet-description" className={className}>
      {children}
    </p>
  ),
  SheetClose: ({
    children,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <div data-testid="sheet-close">{children}</div>,
}));

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
  ShoppingCart: (props: Record<string, unknown>) => (
    <svg data-testid="shopping-cart-icon" {...props} />
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
    return <div data-testid={`cart-item-${item.productId}`}>{item.title}</div>;
  },
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

// ---- Fixture factory -----------------------------------------------------------
function createCartItem(overrides: Partial<CartItemLocal> = {}): CartItemLocal {
  return {
    productId: 'prod-1',
    slug: 'funny-cat-meme-tshirt',
    title: 'Funny Cat Meme T-Shirt',
    price: 24.99,
    size: 'M',
    quantity: 2,
    primaryImage: null,
    ...overrides,
  };
}

// ================================================================================
// A: Trigger button
// ================================================================================

describe('CartDrawer - Trigger Button', () => {
  it('renders the ShoppingCart icon', () => {
    render(<CartDrawer />);
    expect(screen.getByTestId('shopping-cart-icon')).toBeInTheDocument();
  });

  it('does not show badge when itemCount is 0', () => {
    mockItemCount = 0;
    render(<CartDrawer />);
    expect(screen.queryByTestId('cart-badge')).not.toBeInTheDocument();
  });

  it('shows badge with item count when itemCount > 0', () => {
    mockItemCount = 3;
    render(<CartDrawer />);
    const badge = screen.getByTestId('cart-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('3');
  });
});

// ================================================================================
// B: Empty cart state
// ================================================================================

describe('CartDrawer - Empty Cart State', () => {
  it('shows "Your cart is empty" message when no items', () => {
    mockItems = [];
    render(<CartDrawer />);
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('does not show subtotal when cart is empty', () => {
    mockItems = [];
    render(<CartDrawer />);
    expect(screen.queryByText(/subtotal/i)).not.toBeInTheDocument();
  });

  it('shows the sheet title even when cart is empty', () => {
    mockItems = [];
    render(<CartDrawer />);
    expect(screen.getByTestId('sheet-title')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-title')).toHaveTextContent('Shopping Cart');
  });
});

// ================================================================================
// C: Cart with items
// ================================================================================

describe('CartDrawer - Cart With Items', () => {
  beforeEach(() => {
    mockItems = [
      createCartItem({ productId: 'prod-1', title: 'Funny Cat Meme T-Shirt' }),
      createCartItem({ productId: 'prod-2', title: 'Cool Dog Hoodie', size: 'L' }),
    ];
    mockItemCount = 4;
    mockSubtotal = 99.96;
  });

  it('renders one CartItem per item in the store', () => {
    render(<CartDrawer />);
    expect(screen.getByTestId('cart-item-prod-1')).toBeInTheDocument();
    expect(screen.getByTestId('cart-item-prod-2')).toBeInTheDocument();
  });

  it('displays the formatted subtotal', () => {
    render(<CartDrawer />);
    // formatPrice(99.96) → "99,96 €"
    expect(screen.getByText(/99,96\s€/)).toBeInTheDocument();
  });

  it('shows "Subtotal" label', () => {
    render(<CartDrawer />);
    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
  });

  it('shows "View Cart" link pointing to /cart', () => {
    render(<CartDrawer />);
    const viewCartLink = screen.getByRole('link', { name: /view cart/i });
    expect(viewCartLink).toBeInTheDocument();
    expect(viewCartLink).toHaveAttribute('href', '/cart');
  });

  it('shows "Continue Shopping" button', () => {
    render(<CartDrawer />);
    expect(
      screen.getByRole('button', { name: /continue shopping/i })
    ).toBeInTheDocument();
  });
});

// ================================================================================
// D: Store wiring
// ================================================================================

describe('CartDrawer - Store Wiring', () => {
  beforeEach(() => {
    mockItems = [createCartItem({ productId: 'prod-1', size: 'M' })];
  });

  it('wires onUpdateQuantity to store.updateQuantity', () => {
    render(<CartDrawer />);
    // Trigger the callback captured by the mock CartItem
    mockOnUpdateQuantity('prod-1', 'M', 3);
    expect(mockUpdateQuantity).toHaveBeenCalledWith('prod-1', 'M', 3);
  });

  it('wires onRemove to store.removeItem', () => {
    render(<CartDrawer />);
    mockOnRemove('prod-1', 'M');
    expect(mockRemoveItem).toHaveBeenCalledWith('prod-1', 'M');
  });
});

// ================================================================================
// E: Hydration
// ================================================================================

describe('CartDrawer - Hydration', () => {
  it('calls useCartStore.persist.rehydrate() on mount', () => {
    render(<CartDrawer />);
    expect(mockRehydrate).toHaveBeenCalledTimes(1);
  });
});

// ================================================================================
// F: Accessibility
// ================================================================================

describe('CartDrawer - Accessibility', () => {
  it('sheet title reads "Shopping Cart"', () => {
    render(<CartDrawer />);
    expect(screen.getByTestId('sheet-title')).toHaveTextContent('Shopping Cart');
  });

  it('sheet description is present (sr-only)', () => {
    render(<CartDrawer />);
    expect(screen.getByTestId('sheet-description')).toBeInTheDocument();
  });

  it('trigger button has accessible aria-label containing "cart"', () => {
    render(<CartDrawer />);
    const button = screen.getByRole('button', { name: /cart/i });
    expect(button).toBeInTheDocument();
  });
});
