'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OrderSummary } from './OrderSummary';
import { AddressSelector } from './AddressSelector';
import { PromoCodeInput } from '../promo-code/PromoCodeInput';
import type { PromoCodeResult } from '../promo-code/PromoCodeInput';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { checkoutService } from '@/lib/services/checkoutService';
import type { OrderTotalResponse } from '@/lib/services/checkoutService';
import { orderService } from '@/lib/services/orderService';
import { validateAddressForm } from '@/lib/validations/address';
import { ApiException } from '@/lib/api/exceptions';
import type { components } from '@/lib/api/types';

type Address = components['schemas']['Address'];
type CreateAddressRequest = components['schemas']['CreateAddressRequest'];
type CreateOrderRequest = components['schemas']['CreateOrderRequest'];

/**
 * Converts an Address object to CreateAddressRequest format.
 * Used for registered users who select a saved address.
 */
function addressToCreateRequest(addr: Address): CreateAddressRequest {
  return {
    firstName: addr.firstName ?? '',
    lastName: addr.lastName ?? '',
    streetLine1: addr.streetLine1 ?? '',
    streetLine2: addr.streetLine2 ?? undefined,
    city: addr.city ?? '',
    state: addr.state ?? undefined,
    postalCode: addr.postalCode ?? '',
    countryCode: addr.countryCode ?? '',
    phone: addr.phone ?? undefined,
    label: addr.label ?? undefined,
    isDefault: addr.isDefault ?? undefined,
  };
}

/**
 * Main checkout page client component.
 *
 * Orchestrates the checkout flow for both guest and registered users:
 * - Guest: email + phone + inline address form
 * - Registered: AddressSelector for saved addresses
 * - Both: PromoCodeInput + OrderSummary + Place Order button
 *
 * Hydrates cartStore and authStore on mount.
 * Redirects to /cart if cart is empty.
 * Calls checkoutService.calculateTotals on mount and when promo code changes.
 * Calls orderService.create on Place Order, then redirects to Stripe checkout URL.
 */
export function CheckoutPageContent() {
  const router = useRouter();

  // Store selectors
  const items = useCartStore((state) => state.items);
  const itemCount = useCartStore((state) => state.itemCount);
  const subtotal = useCartStore((state) => state.subtotal);
  const clearCart = useCartStore((state) => state.clearCart);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  // Guest checkout state
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestAddress, setGuestAddress] = useState({
    firstName: '',
    lastName: '',
    streetLine1: '',
    streetLine2: '',
    city: '',
    state: '',
    postalCode: '',
    countryCode: '',
    phone: '',
  });

  // Registered user state
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Order totals state
  const [orderTotals, setOrderTotals] = useState<OrderTotalResponse | null>(null);
  const [isTotalsLoading, setIsTotalsLoading] = useState(false);
  const [totalsError, setTotalsError] = useState<string | null>(null);

  // Promo code state
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);

  // Order submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Hydrate stores on mount
  useEffect(() => {
    useCartStore.persist.rehydrate();
    useAuthStore.persist.rehydrate();
  }, []);

  // Redirect to cart if empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items.length, router]);

  // Calculate totals
  const calculateTotals = useCallback(
    async (promoCode?: string) => {
      setIsTotalsLoading(true);
      setTotalsError(null);

      try {
        const cartItems = items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size ?? undefined,
        }));

        const result = await checkoutService.calculateTotals(cartItems, promoCode);
        setOrderTotals(result);
      } catch (error) {
        if (error instanceof ApiException) {
          setTotalsError(error.message);
        } else {
          setTotalsError('Failed to calculate order totals. Please try again.');
        }
      } finally {
        setIsTotalsLoading(false);
      }
    },
    [items]
  );

  // Calculate totals on mount
  useEffect(() => {
    if (items.length > 0) {
      calculateTotals();
    }
  }, [calculateTotals, items.length]);

  // Guest address change handler
  const handleGuestAddressChange = (field: string, value: string) => {
    setGuestAddress((prev) => ({
      ...prev,
      [field]: field === 'countryCode' ? value.toUpperCase() : value,
    }));
  };

  // Registered user address selection handler
  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
  };

  // Promo code handlers
  const handlePromoApply = (result: PromoCodeResult) => {
    if (result.valid && result.code) {
      setAppliedPromoCode(result.code);
      calculateTotals(result.code);
    }
  };

  const handlePromoRemove = () => {
    setAppliedPromoCode(null);
    calculateTotals();
  };

  // Place Order button disabled state
  const isPlaceOrderDisabled = useMemo(() => {
    if (isSubmitting) return true;

    if (isAuthenticated) {
      return !selectedAddress;
    } else {
      // Guest checkout
      if (!guestEmail.trim() || !guestPhone.trim()) return true;

      const addressValidation = validateAddressForm({
        label: '',
        ...guestAddress,
        isDefault: false,
      });
      return !addressValidation.isValid;
    }
  }, [isSubmitting, isAuthenticated, selectedAddress, guestEmail, guestPhone, guestAddress]);

  // Place Order handler
  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Build CreateAddressRequest from selected/guest address
      const shippingAddress: CreateAddressRequest = isAuthenticated
        ? addressToCreateRequest(selectedAddress!)
        : {
            firstName: guestAddress.firstName,
            lastName: guestAddress.lastName,
            streetLine1: guestAddress.streetLine1,
            streetLine2: guestAddress.streetLine2 || undefined,
            city: guestAddress.city,
            state: guestAddress.state || undefined,
            postalCode: guestAddress.postalCode,
            countryCode: guestAddress.countryCode,
            phone: guestAddress.phone || undefined,
          };

      // Build CreateOrderRequest
      const orderData: CreateOrderRequest = {
        shippingAddress,
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/checkout`,
      };

      // Add guest-specific fields
      if (!isAuthenticated) {
        orderData.email = guestEmail.trim();
        orderData.phone = guestPhone.trim();
      }

      // Call orderService
      const result = await orderService.create(orderData);

      // Redirect to Stripe checkout
      window.location.href = result.checkoutUrl;
    } catch (error) {
      if (error instanceof ApiException) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Failed to create order. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  // Early return if cart is empty (while redirecting)
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column - forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Guest checkout: email + phone + address */}
          {!isAuthenticated && (
            <>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Contact Information</h2>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Shipping Address</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={guestAddress.firstName}
                      onChange={(e) =>
                        handleGuestAddressChange('firstName', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={guestAddress.lastName}
                      onChange={(e) =>
                        handleGuestAddressChange('lastName', e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="streetLine1">Street Address</Label>
                  <Input
                    id="streetLine1"
                    type="text"
                    value={guestAddress.streetLine1}
                    onChange={(e) =>
                      handleGuestAddressChange('streetLine1', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="streetLine2">Apartment, suite, etc. (optional)</Label>
                  <Input
                    id="streetLine2"
                    type="text"
                    value={guestAddress.streetLine2}
                    onChange={(e) =>
                      handleGuestAddressChange('streetLine2', e.target.value)
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      type="text"
                      value={guestAddress.city}
                      onChange={(e) =>
                        handleGuestAddressChange('city', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province (optional)</Label>
                    <Input
                      id="state"
                      type="text"
                      value={guestAddress.state}
                      onChange={(e) =>
                        handleGuestAddressChange('state', e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      type="text"
                      value={guestAddress.postalCode}
                      onChange={(e) =>
                        handleGuestAddressChange('postalCode', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="countryCode">Country Code</Label>
                    <Input
                      id="countryCode"
                      type="text"
                      placeholder="US, MX, ES"
                      maxLength={2}
                      value={guestAddress.countryCode}
                      onChange={(e) =>
                        handleGuestAddressChange('countryCode', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Registered user: AddressSelector */}
          {isAuthenticated && <AddressSelector onSelect={handleAddressSelect} />}

          {/* PromoCodeInput */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Promo Code</h2>
            <PromoCodeInput
              orderTotal={orderTotals?.total}
              onApply={handlePromoApply}
              onRemove={handlePromoRemove}
            />
          </div>

          {/* Error display */}
          {(totalsError || submitError) && (
            <Alert variant="destructive">
              <AlertDescription>{totalsError || submitError}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Right column - sticky OrderSummary */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-8">
            <OrderSummary
              subtotal={orderTotals?.subtotal ?? subtotal}
              discountAmount={orderTotals?.discountAmount ?? 0}
              shippingCost={orderTotals?.shippingCost ?? 0}
              taxAmount={orderTotals?.taxAmount ?? 0}
              total={orderTotals?.total ?? subtotal}
              itemCount={itemCount}
              appliedPromoCode={orderTotals?.appliedPromoCode ?? null}
              promoCodeMessage={orderTotals?.promoCodeMessage}
              cartErrors={orderTotals?.cartErrors ?? []}
              isLoading={isTotalsLoading}
            />

            <Button
              onClick={handlePlaceOrder}
              disabled={isPlaceOrderDisabled}
              className="w-full mt-4"
              size="lg"
            >
              {isSubmitting ? 'Processing...' : 'Place Order'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
