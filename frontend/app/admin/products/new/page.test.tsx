import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewProductPage from './page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock ProductForm
jest.mock('../../../../components/admin/products/ProductForm', () => ({
  ProductForm: ({ onSuccess }: { onSuccess?: (product: { id: string }) => void }) => (
    <div data-testid="product-form">
      <button onClick={() => onSuccess?.({ id: 'new-prod-1' })}>
        Submit Form
      </button>
    </div>
  ),
}));

describe('NewProductPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render ProductForm', () => {
    render(<NewProductPage />);

    expect(screen.getByTestId('product-form')).toBeInTheDocument();
  });

  it('should redirect to edit page after successful create', async () => {
    const user = userEvent.setup();
    render(<NewProductPage />);

    await user.click(screen.getByText('Submit Form'));

    expect(mockPush).toHaveBeenCalledWith('/admin/products/new-prod-1/edit');
  });
});
