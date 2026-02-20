import type { Metadata } from 'next';
import { CheckoutPageContent } from '@/components/checkout/CheckoutPageContent';

export const metadata: Metadata = {
  title: 'Checkout | MemeStore',
};

export default function CheckoutPage() {
  return <CheckoutPageContent />;
}
