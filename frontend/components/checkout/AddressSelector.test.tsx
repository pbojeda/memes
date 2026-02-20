import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddressSelector } from './AddressSelector';
import { createAddress } from './testing/fixtures';
import type { Address } from './testing/fixtures';

// ---- Mock addressService -------------------------------------------------------
jest.mock('../../lib/services/addressService', () => ({
  addressService: {
    list: jest.fn(),
  },
}));

// Get reference to the mocked function
const { addressService } = require('../../lib/services/addressService');
const mockList = addressService.list as jest.Mock;

// ---- Mock AddressForm ----------------------------------------------------------
// Mock AddressForm to avoid portal/JSDOM issues. Render as a simple div
// with a button to simulate onSuccess.
const mockAddressForm = jest.fn();
jest.mock('../address/AddressForm', () => ({
  AddressForm: ({
    onSuccess,
    onCancel,
    initialData,
  }: {
    onSuccess: (address: Address) => void;
    onCancel?: () => void;
    initialData?: Address;
  }) => {
    mockAddressForm({ onSuccess, onCancel, initialData });
    return (
      <div data-testid="address-form">
        <button
          type="button"
          data-testid="address-form-save"
          onClick={() => {
            const newAddress = createAddress({
              id: 'new-addr-1',
              label: 'New Address',
            });
            onSuccess(newAddress);
          }}
        >
          Save
        </button>
        {onCancel && (
          <button type="button" data-testid="address-form-cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    );
  },
}));

afterEach(() => {
  jest.clearAllMocks();
});

// ================================================================================
// A: Loading state
// ================================================================================

describe('AddressSelector - Loading State', () => {
  it('renders loading indicator while addresses are fetched', () => {
    mockList.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<AddressSelector onSelect={jest.fn()} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

// ================================================================================
// B: Addresses loaded - has addresses
// ================================================================================

describe('AddressSelector - Addresses Loaded', () => {
  it('renders each saved address showing name and street', async () => {
    const addresses = [
      createAddress({ id: 'addr-1', firstName: 'John', lastName: 'Doe', streetLine1: '123 Main St' }),
      createAddress({ id: 'addr-2', firstName: 'Jane', lastName: 'Smith', streetLine1: '456 Oak Ave' }),
    ];
    mockList.mockResolvedValue(addresses);

    render(<AddressSelector onSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/123 main st/i)).toBeInTheDocument();
    expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
    expect(screen.getByText(/456 oak ave/i)).toBeInTheDocument();
  });

  it('pre-selects the default address (isDefault: true) and calls onSelect on mount', async () => {
    const addresses = [
      createAddress({ id: 'addr-1', isDefault: false }),
      createAddress({ id: 'addr-2', isDefault: true, firstName: 'Jane' }),
    ];
    mockList.mockResolvedValue(addresses);
    const onSelect = jest.fn();

    render(<AddressSelector onSelect={onSelect} />);

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(addresses[1]);
    });
  });

  it('when no address has isDefault, no address is pre-selected', async () => {
    const addresses = [
      createAddress({ id: 'addr-1', isDefault: false, firstName: 'Alice' }),
      createAddress({ id: 'addr-2', isDefault: false, firstName: 'Bob' }),
    ];
    mockList.mockResolvedValue(addresses);
    const onSelect = jest.fn();

    render(<AddressSelector onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByText(/alice doe/i)).toBeInTheDocument();
    });

    // onSelect should not be called on mount if no default address
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('clicking a different address calls onSelect with that address', async () => {
    const addresses = [
      createAddress({ id: 'addr-1', firstName: 'John', lastName: 'Doe', isDefault: true }),
      createAddress({ id: 'addr-2', firstName: 'Jane', lastName: 'Smith', isDefault: false }),
    ];
    mockList.mockResolvedValue(addresses);
    const onSelect = jest.fn();
    const user = userEvent.setup();

    render(<AddressSelector onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });

    // onSelect called once on mount for default address
    expect(onSelect).toHaveBeenCalledTimes(1);
    onSelect.mockClear();

    // Click on the second address
    const janeAddressCards = screen.getAllByText(/jane smith/i);
    const janeAddress = janeAddressCards[0].closest('button');
    await user.click(janeAddress!);

    expect(onSelect).toHaveBeenCalledWith(addresses[1]);
  });
});

// ================================================================================
// C: Empty list
// ================================================================================

describe('AddressSelector - Empty List', () => {
  it('shows "Add new address" prompt when user has no saved addresses', async () => {
    mockList.mockResolvedValue([]);

    render(<AddressSelector onSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/no saved addresses/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /add new address/i })).toBeInTheDocument();
  });
});

// ================================================================================
// D: Add new address flow
// ================================================================================

describe('AddressSelector - Add New Address Flow', () => {
  it('clicking "Add new address" reveals the AddressForm', async () => {
    const addresses = [createAddress({ id: 'addr-1' })];
    mockList.mockResolvedValue(addresses);
    const user = userEvent.setup();

    render(<AddressSelector onSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add new address/i });
    await user.click(addButton);

    expect(screen.getByTestId('address-form')).toBeInTheDocument();
  });

  it('when AddressForm onSuccess fires, the new address is added to list and selected (calls onSelect)', async () => {
    const addresses = [createAddress({ id: 'addr-1' })];
    mockList.mockResolvedValue(addresses);
    const onSelect = jest.fn();
    const user = userEvent.setup();

    render(<AddressSelector onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });

    // onSelect was called once for default address (if any)
    onSelect.mockClear();

    const addButton = screen.getByRole('button', { name: /add new address/i });
    await user.click(addButton);

    const saveButton = screen.getByTestId('address-form-save');
    await user.click(saveButton);

    // Form should be hidden
    await waitFor(() => {
      expect(screen.queryByTestId('address-form')).not.toBeInTheDocument();
    });

    // The new address should appear in the list
    expect(screen.getByText(/new address/i)).toBeInTheDocument();

    // onSelect should have been called with the new address
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'new-addr-1', label: 'New Address' })
    );
  });

  it('clicking Cancel on AddressForm hides it and returns to list', async () => {
    const addresses = [createAddress({ id: 'addr-1' })];
    mockList.mockResolvedValue(addresses);
    const user = userEvent.setup();

    render(<AddressSelector onSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add new address/i });
    await user.click(addButton);

    expect(screen.getByTestId('address-form')).toBeInTheDocument();

    const cancelButton = screen.getByTestId('address-form-cancel');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByTestId('address-form')).not.toBeInTheDocument();
    });

    // List should still be visible
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
  });
});

// ================================================================================
// E: Error state
// ================================================================================

describe('AddressSelector - Error State', () => {
  it('renders error message when addressService.list() rejects', async () => {
    mockList.mockRejectedValue(new Error('Network error'));

    render(<AddressSelector onSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load addresses/i)).toBeInTheDocument();
    });
  });

  it('shows a Retry button that re-fetches addresses', async () => {
    mockList.mockRejectedValueOnce(new Error('Network error'));
    const user = userEvent.setup();

    render(<AddressSelector onSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load addresses/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });

    // Mock successful response for retry
    const addresses = [createAddress({ id: 'addr-1' })];
    mockList.mockResolvedValue(addresses);

    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });
  });
});

// ================================================================================
// F: Accessibility
// ================================================================================

describe('AddressSelector - Accessibility', () => {
  it('component has appropriate heading', async () => {
    mockList.mockResolvedValue([createAddress()]);

    render(<AddressSelector onSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /shipping address/i })).toBeInTheDocument();
    });
  });
});
