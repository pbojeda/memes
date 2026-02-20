import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddressForm } from './AddressForm';
import { addressService } from '../../lib/services/addressService';
import { ApiException } from '../../lib/api/exceptions';
import type { components } from '../../lib/api/types';

type Address = components['schemas']['Address'];

// Mock addressService with relative path (required for Jest module resolution)
jest.mock('../../lib/services/addressService', () => ({
  addressService: {
    create: jest.fn(),
    update: jest.fn(),
  },
}));

// Mock Checkbox with native input to bypass Radix portal/JSDOM issues
// Note: jest.mock() requires relative paths (not @/ aliases)
jest.mock('../ui/checkbox', () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
    id,
  }: {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    id?: string;
  }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked ?? false}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid="isDefault-checkbox"
    />
  ),
}));

const mockAddressService = addressService as jest.Mocked<typeof addressService>;

const mockAddress: Address = {
  id: 'addr-1',
  label: 'Home',
  firstName: 'John',
  lastName: 'Doe',
  streetLine1: '123 Main St',
  streetLine2: 'Apt 4B',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  countryCode: 'US',
  phone: '+1-555-555-5555',
  isDefault: true,
};

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/first name/i), 'John');
  await user.type(screen.getByLabelText(/last name/i), 'Doe');
  await user.type(screen.getByLabelText(/street address/i), '123 Main St');
  await user.type(screen.getByLabelText(/city/i), 'New York');
  await user.type(screen.getByLabelText(/postal code/i), '10001');
  await user.type(screen.getByLabelText(/country code/i), 'US');
};

describe('AddressForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render all address fields with labels', () => {
      render(<AddressForm onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/apartment/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/postal code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/country code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    });

    it('should render isDefault checkbox', () => {
      render(<AddressForm onSuccess={mockOnSuccess} />);

      expect(screen.getByTestId('isDefault-checkbox')).toBeInTheDocument();
    });

    it('should render "Save Address" in create mode', () => {
      render(<AddressForm onSuccess={mockOnSuccess} />);

      expect(screen.getByRole('button', { name: /save address/i })).toBeInTheDocument();
    });

    it('should render "Update Address" in edit mode', () => {
      render(<AddressForm initialData={mockAddress} onSuccess={mockOnSuccess} />);

      expect(screen.getByRole('button', { name: /update address/i })).toBeInTheDocument();
    });

    it('should render cancel button when onCancel is provided', () => {
      render(<AddressForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should not render cancel button when onCancel is not provided', () => {
      render(<AddressForm onSuccess={mockOnSuccess} />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('should have submit button disabled on empty form', () => {
      render(<AddressForm onSuccess={mockOnSuccess} />);

      expect(screen.getByRole('button', { name: /save address/i })).toBeDisabled();
    });
  });

  describe('edit mode', () => {
    it('should pre-populate fields from initialData', () => {
      render(<AddressForm initialData={mockAddress} onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText(/first name/i)).toHaveValue('John');
      expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe');
      expect(screen.getByLabelText(/street address/i)).toHaveValue('123 Main St');
      expect(screen.getByLabelText(/apartment/i)).toHaveValue('Apt 4B');
      expect(screen.getByLabelText(/city/i)).toHaveValue('New York');
      expect(screen.getByLabelText(/state/i)).toHaveValue('NY');
      expect(screen.getByLabelText(/postal code/i)).toHaveValue('10001');
      expect(screen.getByLabelText(/country code/i)).toHaveValue('US');
      expect(screen.getByLabelText(/phone/i)).toHaveValue('+1-555-555-5555');
    });

    it('should pre-populate label field from initialData', () => {
      render(<AddressForm initialData={mockAddress} onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText(/label/i)).toHaveValue('Home');
    });

    it('should have submit button enabled when initialData is valid', () => {
      render(<AddressForm initialData={mockAddress} onSuccess={mockOnSuccess} />);

      expect(screen.getByRole('button', { name: /update address/i })).toBeEnabled();
    });

    it('should have isDefault checkbox checked when initialData.isDefault is true', () => {
      render(<AddressForm initialData={mockAddress} onSuccess={mockOnSuccess} />);

      expect(screen.getByTestId('isDefault-checkbox')).toBeChecked();
    });
  });

  describe('validation', () => {
    it('should show error for firstName on blur when empty', async () => {
      const user = userEvent.setup();
      render(<AddressForm onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText(/first name/i);
      await user.click(input);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for lastName on blur when empty', async () => {
      const user = userEvent.setup();
      render(<AddressForm onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText(/last name/i);
      await user.click(input);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for streetLine1 on blur when empty', async () => {
      const user = userEvent.setup();
      render(<AddressForm onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText(/street address/i);
      await user.click(input);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/street address is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for city on blur when empty', async () => {
      const user = userEvent.setup();
      render(<AddressForm onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText(/city/i);
      await user.click(input);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/city is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for postalCode on blur when empty', async () => {
      const user = userEvent.setup();
      render(<AddressForm onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText(/postal code/i);
      await user.click(input);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/postal code is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for countryCode on blur when empty', async () => {
      const user = userEvent.setup();
      render(<AddressForm onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText(/country code/i);
      await user.click(input);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/country code is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid countryCode length', async () => {
      const user = userEvent.setup();
      render(<AddressForm onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText(/country code/i);
      await user.type(input, 'U');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/country code must be exactly 2 characters/i)).toBeInTheDocument();
      });
    });

    it('should not show errors for optional fields when empty on blur', async () => {
      const user = userEvent.setup();
      render(<AddressForm onSuccess={mockOnSuccess} />);

      await user.click(screen.getByLabelText(/apartment/i));
      await user.tab();
      await user.click(screen.getByLabelText(/state/i));
      await user.tab();
      await user.click(screen.getByLabelText(/phone/i));
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/apartment.*required/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/state.*required/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/phone.*required/i)).not.toBeInTheDocument();
      });
    });

    it('should set aria-invalid on fields with errors', async () => {
      const user = userEvent.setup();
      render(<AddressForm onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText(/first name/i);
      await user.click(input);
      await user.tab();

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should clear field error when valid value entered after error', async () => {
      const user = userEvent.setup();
      render(<AddressForm onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText(/first name/i);
      await user.click(input);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });

      await user.type(input, 'John');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/first name is required/i)).not.toBeInTheDocument();
      });
    });

    it('should auto-uppercase country code input', async () => {
      const user = userEvent.setup();
      render(<AddressForm onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText(/country code/i);
      await user.type(input, 'us');

      expect(input).toHaveValue('US');
    });
  });

  describe('submission - create mode', () => {
    it('should call addressService.create with form data', async () => {
      const user = userEvent.setup();
      mockAddressService.create.mockResolvedValueOnce(mockAddress);

      render(<AddressForm onSuccess={mockOnSuccess} />);
      await fillValidForm(user);

      await user.click(screen.getByRole('button', { name: /save address/i }));

      await waitFor(() => {
        expect(mockAddressService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            streetLine1: '123 Main St',
            city: 'New York',
            postalCode: '10001',
            countryCode: 'US',
          })
        );
      });
    });

    it('should call onSuccess with returned address', async () => {
      const user = userEvent.setup();
      mockAddressService.create.mockResolvedValueOnce(mockAddress);

      render(<AddressForm onSuccess={mockOnSuccess} />);
      await fillValidForm(user);

      await user.click(screen.getByRole('button', { name: /save address/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockAddress);
      });
    });

    it('should show "Saving..." during submission', async () => {
      const user = userEvent.setup();
      let resolveCreate: (value: Address) => void;
      mockAddressService.create.mockImplementation(
        () => new Promise((resolve) => { resolveCreate = resolve; })
      );

      render(<AddressForm onSuccess={mockOnSuccess} />);
      await fillValidForm(user);

      await user.click(screen.getByRole('button', { name: /save address/i }));

      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();

      resolveCreate!(mockAddress);
    });

    it('should disable submit button during submission', async () => {
      const user = userEvent.setup();
      let resolveCreate: (value: Address) => void;
      mockAddressService.create.mockImplementation(
        () => new Promise((resolve) => { resolveCreate = resolve; })
      );

      render(<AddressForm onSuccess={mockOnSuccess} />);
      await fillValidForm(user);

      await user.click(screen.getByRole('button', { name: /save address/i }));

      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();

      resolveCreate!(mockAddress);
    });

    it('should not call create when form is invalid', async () => {
      const user = userEvent.setup();
      render(<AddressForm onSuccess={mockOnSuccess} />);

      // Submit without filling in required fields — button should be disabled
      expect(screen.getByRole('button', { name: /save address/i })).toBeDisabled();
      expect(mockAddressService.create).not.toHaveBeenCalled();
    });
  });

  describe('submission - edit mode', () => {
    it('should call addressService.update with addressId and data', async () => {
      const user = userEvent.setup();
      const updatedAddress = { ...mockAddress, firstName: 'Jane' };
      mockAddressService.update.mockResolvedValueOnce(updatedAddress);

      render(<AddressForm initialData={mockAddress} onSuccess={mockOnSuccess} />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');

      await user.click(screen.getByRole('button', { name: /update address/i }));

      await waitFor(() => {
        expect(mockAddressService.update).toHaveBeenCalledWith(
          'addr-1',
          expect.objectContaining({ firstName: 'Jane' })
        );
      });
    });

    it('should call onSuccess with returned address', async () => {
      const user = userEvent.setup();
      const updatedAddress = { ...mockAddress, firstName: 'Jane' };
      mockAddressService.update.mockResolvedValueOnce(updatedAddress);

      render(<AddressForm initialData={mockAddress} onSuccess={mockOnSuccess} />);

      await user.click(screen.getByRole('button', { name: /update address/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(updatedAddress);
      });
    });
  });

  describe('error handling', () => {
    it('should display 409 ADDRESS_LIMIT_EXCEEDED message', async () => {
      const user = userEvent.setup();
      const error = new ApiException('ADDRESS_LIMIT_EXCEEDED', 'Address limit exceeded', 409);
      mockAddressService.create.mockRejectedValueOnce(error);

      render(<AddressForm onSuccess={mockOnSuccess} />);
      await fillValidForm(user);

      await user.click(screen.getByRole('button', { name: /save address/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/you have reached the maximum number of addresses \(10\)/i)
        ).toBeInTheDocument();
      });
    });

    it('should display generic error for other failures', async () => {
      const user = userEvent.setup();
      mockAddressService.create.mockRejectedValueOnce(new Error('Network error'));

      render(<AddressForm onSuccess={mockOnSuccess} />);
      await fillValidForm(user);

      await user.click(screen.getByRole('button', { name: /save address/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/failed to save address\. please try again/i)
        ).toBeInTheDocument();
      });
    });

    it('should clear API error on resubmit', async () => {
      const user = userEvent.setup();
      mockAddressService.create
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockAddress);

      render(<AddressForm onSuccess={mockOnSuccess} />);
      await fillValidForm(user);

      await user.click(screen.getByRole('button', { name: /save address/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to save address/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /save address/i }));

      await waitFor(() => {
        expect(screen.queryByText(/failed to save address/i)).not.toBeInTheDocument();
      });
    });

    it('should re-enable submit button after error', async () => {
      const user = userEvent.setup();
      mockAddressService.create.mockRejectedValueOnce(new Error('Network error'));

      render(<AddressForm onSuccess={mockOnSuccess} />);
      await fillValidForm(user);

      await user.click(screen.getByRole('button', { name: /save address/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save address/i })).toBeEnabled();
      });
    });
  });

  describe('Cancel button behavior', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<AddressForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });
});
