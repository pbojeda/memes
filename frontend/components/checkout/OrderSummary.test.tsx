import { render, screen } from '@testing-library/react';
import { OrderSummary } from './OrderSummary';
import {
  createOrderTotalResponse,
  createAppliedPromoCode,
  createCartValidationError,
} from './testing/fixtures';

// Base props derived from a default order total response with no discount
const baseProps = {
  subtotal: 79.98,
  discountAmount: 0,
  shippingCost: 0,
  taxAmount: 0,
  total: 79.98,
  itemCount: 2,
  appliedPromoCode: null,
  cartErrors: [],
  isLoading: false,
};

describe('OrderSummary', () => {
  describe('Loading State', () => {
    it('renders loading indicator when isLoading is true', () => {
      render(<OrderSummary {...baseProps} isLoading={true} />);
      // aria-busy should signal loading state
      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
    });

    it('does not render price lines when loading', () => {
      render(<OrderSummary {...baseProps} isLoading={true} />);
      expect(screen.queryByText(/subtotal/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/total/i)).not.toBeInTheDocument();
    });
  });

  describe('Basic Display', () => {
    it('renders "Order Summary" heading', () => {
      render(<OrderSummary {...baseProps} />);
      expect(screen.getByText(/order summary/i)).toBeInTheDocument();
    });

    it('displays item count', () => {
      render(<OrderSummary {...baseProps} itemCount={3} />);
      expect(screen.getByText(/3/)).toBeInTheDocument();
    });

    it('displays formatted subtotal', () => {
      render(<OrderSummary {...baseProps} subtotal={79.98} />);
      // formatPrice(79.98) → "79,98 €" — may appear in both subtotal and total rows
      expect(screen.getAllByText(/79,98\s*€/).length).toBeGreaterThan(0);
    });

    it('displays formatted total', () => {
      // Use a unique total value (different from subtotal) so it's unambiguous
      render(<OrderSummary {...baseProps} subtotal={50.00} discountAmount={10.00} total={40.00} />);
      // "Total" label should be present (use getAllByText to handle "Subtotal" matching too)
      const totalLabels = screen.getAllByText(/total/i);
      expect(totalLabels.length).toBeGreaterThan(0);
      // The unique total value should appear exactly once
      expect(screen.getByText(/40,00\s*€/)).toBeInTheDocument();
    });

    it('displays shipping as "Free" when shippingCost is 0', () => {
      render(<OrderSummary {...baseProps} shippingCost={0} />);
      expect(screen.getByText(/free/i)).toBeInTheDocument();
    });

    it('displays formatted tax amount', () => {
      render(<OrderSummary {...baseProps} taxAmount={5.50} />);
      // formatPrice(5.50) → "5,50 €"
      expect(screen.getByText(/5,50\s*€/)).toBeInTheDocument();
    });
  });

  describe('Discount Display', () => {
    it('does not render discount line when discountAmount is 0', () => {
      render(<OrderSummary {...baseProps} discountAmount={0} appliedPromoCode={null} />);
      expect(screen.queryByText(/discount/i)).not.toBeInTheDocument();
    });

    it('renders discount line with formatted amount when discountAmount > 0', () => {
      render(<OrderSummary {...baseProps} discountAmount={15.99} total={63.99} />);
      expect(screen.getByText(/discount/i)).toBeInTheDocument();
      // formatPrice(15.99) → "15,99 €"
      expect(screen.getByText(/15,99\s*€/)).toBeInTheDocument();
    });

    it('renders promo code badge when appliedPromoCode is present', () => {
      const appliedPromoCode = createAppliedPromoCode({ code: 'SUMMER20' });
      render(
        <OrderSummary
          {...baseProps}
          discountAmount={15.99}
          total={63.99}
          appliedPromoCode={appliedPromoCode}
        />
      );
      expect(screen.getByText('SUMMER20')).toBeInTheDocument();
    });
  });

  describe('Promo Code Message', () => {
    it('does not render promo code message when not provided', () => {
      render(<OrderSummary {...baseProps} />);
      expect(screen.queryByText(/expired/i)).not.toBeInTheDocument();
    });

    it('renders promo code message when provided', () => {
      render(
        <OrderSummary {...baseProps} promoCodeMessage="Promo code has expired" />
      );
      expect(screen.getByText('Promo code has expired')).toBeInTheDocument();
    });
  });

  describe('Cart Errors', () => {
    it('renders alert for each cart validation error', () => {
      const errors = [
        createCartValidationError({ productId: 'prod-1', message: 'Product not found' }),
        createCartValidationError({
          productId: 'prod-2',
          code: 'PRODUCT_INACTIVE',
          message: 'Product is no longer available',
        }),
      ];
      render(<OrderSummary {...baseProps} cartErrors={errors} />);
      expect(screen.getByText('Product not found')).toBeInTheDocument();
      expect(screen.getByText('Product is no longer available')).toBeInTheDocument();
    });
  });
});
