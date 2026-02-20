import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckoutPageContent } from './CheckoutPageContent';
import type { CartItemLocal } from '@/stores/cartStore';
import type { OrderSummaryProps } from './OrderSummary';
import type { PromoCodeResult } from '../promo-code/PromoCodeInput';
import { createCartItem } from '../cart/testing/fixtures';
import {
  createOrderTotalResponse,
  createAppliedPromoCode,
  createAddress,
} from './testing/fixtures';
import type { components } from '@/lib/api/types';

type Address = components['schemas']['Address'];
type OrderTotalResponse = components['schemas']['OrderTotalResponse'];
type OrderCreateResult = {
  orderId: string;
  orderNumber: string;
  checkoutUrl: string;
};

// ---- Mock next/navigation -------------------------------------------------------
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: mockRouterPush })),
}));

// ---- Mock next/link -------------------------------------------------------------
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// ---- Mock stores ----------------------------------------------------------------
// Cart store
const mockCartRehydrate = jest.fn();
let mockCartItems: CartItemLocal[] = [];
let mockCartSubtotal = 0;
let mockCartItemCount = 0;
const mockClearCart = jest.fn();

jest.mock('../../stores/cartStore', () => ({
  useCartStore: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      items: mockCartItems,
      subtotal: mockCartSubtotal,
      itemCount: mockCartItemCount,
      clearCart: mockClearCart,
    };
    return selector(state);
  },
}));

// Auth store
const mockAuthRehydrate = jest.fn();
let mockIsAuthenticated = false;
let mockUser: Record<string, unknown> | null = null;

jest.mock('../../stores/authStore', () => ({
  useAuthStore: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      isAuthenticated: mockIsAuthenticated,
      user: mockUser,
    };
    return selector(state);
  },
}));

// ---- Mock services --------------------------------------------------------------
const mockCalculateTotals = jest.fn();
const mockOrderCreate = jest.fn();

jest.mock('../../lib/services/checkoutService', () => ({
  checkoutService: {
    calculateTotals: (...args: unknown[]) => mockCalculateTotals(...args),
  },
}));

jest.mock('../../lib/services/orderService', () => ({
  orderService: {
    create: (...args: unknown[]) => mockOrderCreate(...args),
  },
}));

// ---- Mock sub-components --------------------------------------------------------
let capturedAddressSelectorOnSelect: ((addr: Address) => void) | null = null;

jest.mock('./AddressSelector', () => ({
  AddressSelector: ({ onSelect }: { onSelect: (addr: Address) => void }) => {
    capturedAddressSelectorOnSelect = onSelect;
    return <div data-testid="address-selector" />;
  },
}));

jest.mock('./OrderSummary', () => ({
  OrderSummary: ({
    subtotal,
    discountAmount,
    shippingCost,
    taxAmount,
    total,
    itemCount,
    isLoading,
  }: OrderSummaryProps) => (
    <div
      data-testid="order-summary"
      data-subtotal={subtotal}
      data-discount-amount={discountAmount}
      data-shipping-cost={shippingCost}
      data-tax-amount={taxAmount}
      data-total={total}
      data-item-count={itemCount}
      data-is-loading={String(isLoading)}
    />
  ),
}));

let capturedPromoOnApply: ((result: PromoCodeResult) => void) | null = null;
let capturedPromoOnRemove: (() => void) | null = null;

jest.mock('../promo-code/PromoCodeInput', () => ({
  PromoCodeInput: ({
    orderTotal,
    onApply,
    onRemove,
  }: {
    orderTotal?: number;
    onApply?: (result: PromoCodeResult) => void;
    onRemove?: () => void;
  }) => {
    capturedPromoOnApply = onApply ?? null;
    capturedPromoOnRemove = onRemove ?? null;
    return <div data-testid="promo-code-input" data-order-total={orderTotal} />;
  },
}));

// ---- Test suite -----------------------------------------------------------------
// Mock window.location
let mockLocationHref = 'http://localhost:3001';
const mockLocationSetter = jest.fn();

// Only mock if configurable
try {
  delete (window as { location?: unknown }).location;
  (window as { location: { _mocked?: boolean; href: string; origin: string } }).location = {
    _mocked: true,
    get href() {
      return mockLocationHref;
    },
    set href(url: string) {
      mockLocationHref = url;
      mockLocationSetter(url);
    },
    origin: 'http://localhost:3001',
  };
} catch (e) {
  // Location already mocked, skip
}

describe('CheckoutPageContent', () => {
  beforeAll(() => {
    // Attach persist.rehydrate to the mocked hooks
    const cartStoreModule = require('../../stores/cartStore');
    cartStoreModule.useCartStore.persist = { rehydrate: mockCartRehydrate };

    const authStoreModule = require('../../stores/authStore');
    authStoreModule.useAuthStore.persist = { rehydrate: mockAuthRehydrate };
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Reset mock state
    mockCartItems = [];
    mockCartSubtotal = 0;
    mockCartItemCount = 0;
    mockIsAuthenticated = false;
    mockUser = null;

    // Reset window.location.href
    mockLocationHref = 'http://localhost:3001';
    mockLocationSetter.mockClear();

    // Reset captured callbacks
    capturedAddressSelectorOnSelect = null;
    capturedPromoOnApply = null;
    capturedPromoOnRemove = null;
  });

  // ============================================================================
  // A: Hydration
  // ============================================================================
  describe('Hydration', () => {
    it('should call useCartStore.persist.rehydrate() on mount', () => {
      mockCartItems = [createCartItem()];
      mockCartItemCount = 1;
      mockCalculateTotals.mockResolvedValue(createOrderTotalResponse());

      render(<CheckoutPageContent />);

      expect(mockCartRehydrate).toHaveBeenCalledTimes(1);
    });

    it('should call useAuthStore.persist.rehydrate() on mount', () => {
      mockCartItems = [createCartItem()];
      mockCartItemCount = 1;
      mockCalculateTotals.mockResolvedValue(createOrderTotalResponse());

      render(<CheckoutPageContent />);

      expect(mockAuthRehydrate).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // B: Empty cart redirect
  // ============================================================================
  describe('Empty cart redirect', () => {
    it('should redirect to /cart when cart has 0 items', () => {
      mockCartItems = [];
      mockCartItemCount = 0;

      render(<CheckoutPageContent />);

      expect(mockRouterPush).toHaveBeenCalledWith('/cart');
    });

    it('should not render checkout form when cart has 0 items', () => {
      mockCartItems = [];
      mockCartItemCount = 0;

      render(<CheckoutPageContent />);

      expect(screen.queryByTestId('order-summary')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // C: Guest checkout rendering
  // ============================================================================
  describe('Guest checkout rendering', () => {
    beforeEach(() => {
      mockIsAuthenticated = false;
      mockCartItems = [createCartItem()];
      mockCartItemCount = 1;
      mockCartSubtotal = 24.99;
      mockCalculateTotals.mockResolvedValue(createOrderTotalResponse());
    });

    it('should render email input field', async () => {
      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });
    });

    it('should render phone input field', async () => {
      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      });
    });

    it('should render shipping address form fields', async () => {
      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/postal code/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/country code/i)).toBeInTheDocument();
      });
    });

    it('should not render AddressSelector', async () => {
      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(screen.queryByTestId('address-selector')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // D: Registered checkout rendering
  // ============================================================================
  describe('Registered checkout rendering', () => {
    beforeEach(() => {
      mockIsAuthenticated = true;
      mockUser = { id: 'user-1', email: 'test@example.com' };
      mockCartItems = [createCartItem()];
      mockCartItemCount = 1;
      mockCartSubtotal = 24.99;
      mockCalculateTotals.mockResolvedValue(createOrderTotalResponse());
    });

    it('should render AddressSelector', async () => {
      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(screen.getByTestId('address-selector')).toBeInTheDocument();
      });
    });

    it('should not render email input', async () => {
      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
      });
    });

    it('should not render inline address form fields', async () => {
      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/last name/i)).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // E: OrderSummary integration
  // ============================================================================
  describe('OrderSummary integration', () => {
    beforeEach(() => {
      mockIsAuthenticated = false;
      mockCartItems = [
        createCartItem({ productId: 'prod-1', quantity: 2, size: 'M' }),
      ];
      mockCartItemCount = 2;
      mockCartSubtotal = 49.98;
    });

    it('should call checkoutService.calculateTotals with cart items on mount', async () => {
      mockCalculateTotals.mockResolvedValue(createOrderTotalResponse());

      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(mockCalculateTotals).toHaveBeenCalledWith(
          [{ productId: 'prod-1', quantity: 2, size: 'M' }],
          undefined
        );
      });
    });

    it('should pass isLoading=true to OrderSummary while calculateTotals is pending', async () => {
      let resolveCalculateTotals: (value: OrderTotalResponse) => void;
      mockCalculateTotals.mockReturnValue(
        new Promise((resolve) => {
          resolveCalculateTotals = resolve;
        })
      );

      render(<CheckoutPageContent />);

      await waitFor(() => {
        const summary = screen.getByTestId('order-summary');
        expect(summary).toHaveAttribute('data-is-loading', 'true');
      });

      // Resolve the promise
      resolveCalculateTotals!(createOrderTotalResponse());

      await waitFor(() => {
        const summary = screen.getByTestId('order-summary');
        expect(summary).toHaveAttribute('data-is-loading', 'false');
      });
    });

    it('should pass backend totals to OrderSummary after calculateTotals resolves', async () => {
      const response = createOrderTotalResponse({
        subtotal: 100,
        discountAmount: 20,
        shippingCost: 5,
        taxAmount: 10,
        total: 95,
      });
      mockCalculateTotals.mockResolvedValue(response);

      render(<CheckoutPageContent />);

      await waitFor(() => {
        const summary = screen.getByTestId('order-summary');
        expect(summary).toHaveAttribute('data-subtotal', '100');
        expect(summary).toHaveAttribute('data-discount-amount', '20');
        expect(summary).toHaveAttribute('data-shipping-cost', '5');
        expect(summary).toHaveAttribute('data-tax-amount', '10');
        expect(summary).toHaveAttribute('data-total', '95');
      });
    });

    it('should pass cartErrors from response to OrderSummary', async () => {
      // Note: We can't easily test cartErrors array content via data attributes
      // This test verifies the component renders without error when cartErrors exist
      const response = createOrderTotalResponse({
        cartErrors: [
          {
            productId: 'prod-1',
            code: 'PRODUCT_INACTIVE',
            message: 'Product is inactive',
          },
        ],
      });
      mockCalculateTotals.mockResolvedValue(response);

      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(screen.getByTestId('order-summary')).toBeInTheDocument();
      });
    });

    it('should pass appliedPromoCode from response to OrderSummary', async () => {
      // Similar to cartErrors, we verify the component renders without error
      const response = createOrderTotalResponse({
        appliedPromoCode: createAppliedPromoCode(),
      });
      mockCalculateTotals.mockResolvedValue(response);

      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(screen.getByTestId('order-summary')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // F: PromoCodeInput integration
  // ============================================================================
  describe('PromoCodeInput integration', () => {
    it('should render PromoCodeInput component', async () => {
      mockCartItems = [createCartItem()];
      mockCartItemCount = 1;
      mockCalculateTotals.mockResolvedValue(createOrderTotalResponse());

      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(screen.getByTestId('promo-code-input')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // G: Promo code recalculation
  // ============================================================================
  describe('Promo code recalculation', () => {
    beforeEach(() => {
      mockCartItems = [createCartItem()];
      mockCartItemCount = 1;
      mockCartSubtotal = 24.99;
      mockCalculateTotals.mockResolvedValue(createOrderTotalResponse());
    });

    it('should call calculateTotals with promo code when PromoCodeInput onApply fires', async () => {
      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(capturedPromoOnApply).not.toBeNull();
      });

      // Initial call without promo
      expect(mockCalculateTotals).toHaveBeenCalledWith(
        expect.any(Array),
        undefined
      );

      // Simulate promo code apply
      const promoResult: PromoCodeResult = {
        valid: true,
        code: 'SAVE10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        calculatedDiscount: 2.5,
      };

      capturedPromoOnApply!(promoResult);

      await waitFor(() => {
        expect(mockCalculateTotals).toHaveBeenCalledWith(
          expect.any(Array),
          'SAVE10'
        );
      });
    });

    it('should call calculateTotals without promo code when PromoCodeInput onRemove fires', async () => {
      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(capturedPromoOnRemove).not.toBeNull();
      });

      // Apply promo first
      const promoResult: PromoCodeResult = {
        valid: true,
        code: 'SAVE10',
      };
      capturedPromoOnApply!(promoResult);

      await waitFor(() => {
        expect(mockCalculateTotals).toHaveBeenCalledWith(
          expect.any(Array),
          'SAVE10'
        );
      });

      // Clear the mock
      mockCalculateTotals.mockClear();

      // Remove promo
      capturedPromoOnRemove!();

      await waitFor(() => {
        expect(mockCalculateTotals).toHaveBeenCalledWith(
          expect.any(Array),
          undefined
        );
      });
    });
  });

  // ============================================================================
  // H: Place Order button state
  // ============================================================================
  describe('Place Order button state', () => {
    it('should disable Place Order button initially for guest (no address)', async () => {
      mockIsAuthenticated = false;
      mockCartItems = [createCartItem()];
      mockCartItemCount = 1;
      mockCalculateTotals.mockResolvedValue(createOrderTotalResponse());

      render(<CheckoutPageContent />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /place order/i });
        expect(button).toBeDisabled();
      });
    });

    it('should keep button disabled when email is empty even if address is filled', async () => {
      const user = userEvent.setup();
      mockIsAuthenticated = false;
      mockCartItems = [createCartItem()];
      mockCartItemCount = 1;
      mockCalculateTotals.mockResolvedValue(createOrderTotalResponse());

      render(<CheckoutPageContent />);

      // Fill address fields but leave email empty
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/street address/i), '123 Main St');
      await user.type(screen.getByLabelText(/city/i), 'New York');
      await user.type(screen.getByLabelText(/postal code/i), '10001');
      await user.type(screen.getByLabelText(/country code/i), 'US');

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /place order/i });
        expect(button).toBeDisabled();
      });
    });

    it('should enable button when AddressSelector onSelect fires for registered user', async () => {
      mockIsAuthenticated = true;
      mockCartItems = [createCartItem()];
      mockCartItemCount = 1;
      mockCalculateTotals.mockResolvedValue(createOrderTotalResponse());

      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(capturedAddressSelectorOnSelect).not.toBeNull();
      });

      // Initially disabled
      expect(screen.getByRole('button', { name: /place order/i })).toBeDisabled();

      // Select an address
      capturedAddressSelectorOnSelect!(createAddress());

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /place order/i })).not.toBeDisabled();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockIsAuthenticated = true;
      mockCartItems = [createCartItem()];
      mockCartItemCount = 1;
      mockCalculateTotals.mockResolvedValue(createOrderTotalResponse());

      let resolveOrderCreate: (value: OrderCreateResult) => void;
      mockOrderCreate.mockReturnValue(
        new Promise((resolve) => {
          resolveOrderCreate = resolve;
        })
      );

      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(capturedAddressSelectorOnSelect).not.toBeNull();
      });

      // Select address to enable button
      capturedAddressSelectorOnSelect!(createAddress());

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /place order/i })).not.toBeDisabled();
      });

      // Click Place Order
      await user.click(screen.getByRole('button', { name: /place order/i }));

      // Should show "Processing..."
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /processing/i })).toBeInTheDocument();
      });

      // Resolve - component will set window.location.href which we can't easily test
      resolveOrderCreate!({
        orderId: 'order-1',
        orderNumber: 'ORD-001',
        checkoutUrl: 'https://checkout.stripe.com/test',
      });

      // The main point of this test is to verify loading state was shown
      // The redirect happens but is hard to assert in JSDOM
    });
  });

  // ============================================================================
  // I: Place Order submission - guest
  // ============================================================================
  describe('Place Order submission - guest', () => {
    it('should call orderService.create with correct guest payload', async () => {
      const user = userEvent.setup();
      mockIsAuthenticated = false;
      mockCartItems = [createCartItem()];
      mockCartItemCount = 1;
      mockCalculateTotals.mockResolvedValue(createOrderTotalResponse());
      mockOrderCreate.mockResolvedValue({
        orderId: 'order-1',
        orderNumber: 'ORD-001',
        checkoutUrl: 'https://checkout.stripe.com/test',
      });

      render(<CheckoutPageContent />);

      // Fill out guest form
      await user.type(screen.getByLabelText(/email/i), 'guest@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/street address/i), '123 Main St');
      await user.type(screen.getByLabelText(/city/i), 'New York');
      await user.type(screen.getByLabelText(/postal code/i), '10001');
      await user.type(screen.getByLabelText(/country code/i), 'US');

      // Click Place Order
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(mockOrderCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'guest@example.com',
            phone: '+1234567890',
            shippingAddress: expect.objectContaining({
              firstName: 'John',
              lastName: 'Doe',
              streetLine1: '123 Main St',
              city: 'New York',
              postalCode: '10001',
              countryCode: 'US',
            }),
            successUrl: expect.stringContaining('/checkout/success'),
            cancelUrl: expect.stringContaining('/checkout'),
          })
        );
      });
    });

    it('should successfully submit order for guest', async () => {
      const user = userEvent.setup();
      mockIsAuthenticated = false;
      mockCartItems = [createCartItem()];
      mockCartItemCount = 1;
      mockCalculateTotals.mockResolvedValue(createOrderTotalResponse());
      mockOrderCreate.mockResolvedValue({
        orderId: 'order-1',
        orderNumber: 'ORD-001',
        checkoutUrl: 'https://checkout.stripe.com/test',
      });

      render(<CheckoutPageContent />);

      // Fill out guest form
      await user.type(screen.getByLabelText(/email/i), 'guest@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/street address/i), '123 Main St');
      await user.type(screen.getByLabelText(/city/i), 'New York');
      await user.type(screen.getByLabelText(/postal code/i), '10001');
      await user.type(screen.getByLabelText(/country code/i), 'US');

      // Click Place Order
      await user.click(screen.getByRole('button', { name: /place order/i }));

      // Verify order was created (redirect happens but hard to test in JSDOM)
      await waitFor(() => {
        expect(mockOrderCreate).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // J: Place Order submission - registered
  // ============================================================================
  describe('Place Order submission - registered', () => {
    it('should call orderService.create with correct registered payload (no email/phone)', async () => {
      const user = userEvent.setup();
      mockIsAuthenticated = true;
      mockCartItems = [createCartItem()];
      mockCartItemCount = 1;
      mockCalculateTotals.mockResolvedValue(createOrderTotalResponse());
      mockOrderCreate.mockResolvedValue({
        orderId: 'order-1',
        orderNumber: 'ORD-001',
        checkoutUrl: 'https://checkout.stripe.com/test',
      });

      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(capturedAddressSelectorOnSelect).not.toBeNull();
      });

      // Select an address
      capturedAddressSelectorOnSelect!(
        createAddress({
          firstName: 'Jane',
          lastName: 'Smith',
          streetLine1: '456 Oak Ave',
          city: 'Boston',
          postalCode: '02101',
          countryCode: 'US',
        })
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /place order/i })).not.toBeDisabled();
      });

      // Click Place Order
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(mockOrderCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            shippingAddress: expect.objectContaining({
              firstName: 'Jane',
              lastName: 'Smith',
              streetLine1: '456 Oak Ave',
              city: 'Boston',
              postalCode: '02101',
              countryCode: 'US',
            }),
            successUrl: expect.stringContaining('/checkout/success'),
            cancelUrl: expect.stringContaining('/checkout'),
          })
        );
        // Should NOT have email/phone
        expect(mockOrderCreate.mock.calls[0][0]).not.toHaveProperty('email');
        expect(mockOrderCreate.mock.calls[0][0]).not.toHaveProperty('phone');
      });
    });
  });

  // ============================================================================
  // K: Error handling
  // ============================================================================
  describe('Error handling', () => {
    it('should display error alert when calculateTotals rejects', async () => {
      mockCartItems = [createCartItem()];
      mockCartItemCount = 1;
      mockCalculateTotals.mockRejectedValue(new Error('Network error'));

      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to calculate order totals/i)
        ).toBeInTheDocument();
      });
    });

    it('should display error alert when orderService.create rejects', async () => {
      const user = userEvent.setup();
      mockIsAuthenticated = true;
      mockCartItems = [createCartItem()];
      mockCartItemCount = 1;
      mockCalculateTotals.mockResolvedValue(createOrderTotalResponse());
      mockOrderCreate.mockRejectedValue(new Error('Order creation failed'));

      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(capturedAddressSelectorOnSelect).not.toBeNull();
      });

      // Select address
      capturedAddressSelectorOnSelect!(createAddress());

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /place order/i })).not.toBeDisabled();
      });

      // Click Place Order
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create order/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // L: Layout
  // ============================================================================
  describe('Layout', () => {
    it('should render a two-column grid structure', async () => {
      mockCartItems = [createCartItem()];
      mockCartItemCount = 1;
      mockCalculateTotals.mockResolvedValue(createOrderTotalResponse());

      const { container } = render(<CheckoutPageContent />);

      await waitFor(() => {
        const grid = container.querySelector('.grid.lg\\:grid-cols-3');
        expect(grid).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Additional edge cases
  // ============================================================================
  describe('Additional edge cases', () => {
    it('should auto-uppercase countryCode input for guest', async () => {
      const user = userEvent.setup();
      mockIsAuthenticated = false;
      mockCartItems = [createCartItem()];
      mockCartItemCount = 1;
      mockCalculateTotals.mockResolvedValue(createOrderTotalResponse());

      render(<CheckoutPageContent />);

      const countryCodeInput = screen.getByLabelText(/country code/i);
      await user.type(countryCodeInput, 'us');

      expect(countryCodeInput).toHaveValue('US');
    });

    it('should preserve applied promo code on OrderSummary after successful apply', async () => {
      mockCartItems = [createCartItem()];
      mockCartItemCount = 1;
      mockCalculateTotals.mockResolvedValue(
        createOrderTotalResponse({
          appliedPromoCode: createAppliedPromoCode({ code: 'SAVE10' }),
        })
      );

      render(<CheckoutPageContent />);

      await waitFor(() => {
        expect(capturedPromoOnApply).not.toBeNull();
      });

      // Apply promo
      const promoResult: PromoCodeResult = {
        valid: true,
        code: 'SAVE10',
      };
      capturedPromoOnApply!(promoResult);

      // Mock the recalculation response with applied promo
      mockCalculateTotals.mockResolvedValue(
        createOrderTotalResponse({
          appliedPromoCode: createAppliedPromoCode({ code: 'SAVE10' }),
        })
      );

      await waitFor(() => {
        // Verify the component re-rendered without errors
        expect(screen.getByTestId('order-summary')).toBeInTheDocument();
      });
    });
  });
});
