import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromoCodeInput } from './PromoCodeInput';
import { promoCodeService } from '../../lib/services/promoCodeService';
import { ApiException } from '../../lib/api/exceptions';
import { createValidPromoResult, createInvalidPromoResult } from './testing/fixtures';

// Must use relative path — jest.mock() doesn't resolve @/ aliases
jest.mock('../../lib/services/promoCodeService', () => ({
  promoCodeService: {
    validate: jest.fn(),
  },
}));

const mockPromoCodeService = promoCodeService as jest.Mocked<typeof promoCodeService>;

describe('PromoCodeInput', () => {
  const mockOnApply = jest.fn();
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('idle state (empty input)', () => {
    it('should render promo code input with label', () => {
      render(<PromoCodeInput />);

      expect(screen.getByLabelText(/promo code/i)).toBeInTheDocument();
    });

    it('should render "Apply" button', () => {
      render(<PromoCodeInput />);

      expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
    });

    it('should have "Apply" button disabled when input is empty', () => {
      render(<PromoCodeInput />);

      expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled();
    });

    it('should not show success or error feedback in idle state', () => {
      render(<PromoCodeInput />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('input state (user has typed)', () => {
    it('should enable "Apply" button when input has text', async () => {
      const user = userEvent.setup();
      render(<PromoCodeInput />);

      await user.type(screen.getByLabelText(/promo code/i), 'SUMMER20');

      expect(screen.getByRole('button', { name: /apply/i })).toBeEnabled();
    });

    it('should auto-uppercase the input value', async () => {
      const user = userEvent.setup();
      render(<PromoCodeInput />);

      await user.type(screen.getByLabelText(/promo code/i), 'summer20');

      expect(screen.getByLabelText(/promo code/i)).toHaveValue('SUMMER20');
    });
  });

  describe('loading state', () => {
    it('should disable input and button while validating', async () => {
      const user = userEvent.setup();
      let resolveValidate: (value: ReturnType<typeof createValidPromoResult>) => void;
      mockPromoCodeService.validate.mockImplementation(
        () => new Promise((resolve) => { resolveValidate = resolve; })
      );

      render(<PromoCodeInput />);
      await user.type(screen.getByLabelText(/promo code/i), 'SUMMER20');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      expect(screen.getByLabelText(/promo code/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /applying/i })).toBeDisabled();

      resolveValidate!(createValidPromoResult());
    });

    it('should show "Applying..." text on button during validation', async () => {
      const user = userEvent.setup();
      let resolveValidate: (value: ReturnType<typeof createValidPromoResult>) => void;
      mockPromoCodeService.validate.mockImplementation(
        () => new Promise((resolve) => { resolveValidate = resolve; })
      );

      render(<PromoCodeInput />);
      await user.type(screen.getByLabelText(/promo code/i), 'SUMMER20');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      expect(screen.getByRole('button', { name: /applying/i })).toBeInTheDocument();

      resolveValidate!(createValidPromoResult());
    });
  });

  describe('applied state (valid code)', () => {
    it('should hide input and apply button after valid code is applied', async () => {
      const user = userEvent.setup();
      mockPromoCodeService.validate.mockResolvedValueOnce(createValidPromoResult());

      render(<PromoCodeInput />);
      await user.type(screen.getByLabelText(/promo code/i), 'SUMMER20');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.queryByLabelText(/promo code/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /apply/i })).not.toBeInTheDocument();
      });
    });

    it('should show applied code name in success feedback', async () => {
      const user = userEvent.setup();
      mockPromoCodeService.validate.mockResolvedValueOnce(createValidPromoResult());

      render(<PromoCodeInput />);
      await user.type(screen.getByLabelText(/promo code/i), 'SUMMER20');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByText('SUMMER20')).toBeInTheDocument();
      });
    });

    it('should show discount details in success feedback', async () => {
      const user = userEvent.setup();
      mockPromoCodeService.validate.mockResolvedValueOnce(
        createValidPromoResult({ discountType: 'PERCENTAGE', discountValue: 20, calculatedDiscount: 15.99 })
      );

      render(<PromoCodeInput orderTotal={79.99} />);
      await user.type(screen.getByLabelText(/promo code/i), 'SUMMER20');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByText(/20%/i)).toBeInTheDocument();
        expect(screen.getByText(/15[.,]99/)).toBeInTheDocument();
      });
    });

    it('should show "Remove" button in applied state', async () => {
      const user = userEvent.setup();
      mockPromoCodeService.validate.mockResolvedValueOnce(createValidPromoResult());

      render(<PromoCodeInput />);
      await user.type(screen.getByLabelText(/promo code/i), 'SUMMER20');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
      });
    });

    it('should call onApply callback with result when code is valid', async () => {
      const user = userEvent.setup();
      const result = createValidPromoResult();
      mockPromoCodeService.validate.mockResolvedValueOnce(result);

      render(<PromoCodeInput onApply={mockOnApply} />);
      await user.type(screen.getByLabelText(/promo code/i), 'SUMMER20');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(mockOnApply).toHaveBeenCalledWith(result);
      });
    });

    it('should call promoCodeService.validate with orderTotal when provided', async () => {
      const user = userEvent.setup();
      mockPromoCodeService.validate.mockResolvedValueOnce(createValidPromoResult());

      render(<PromoCodeInput orderTotal={79.99} />);
      await user.type(screen.getByLabelText(/promo code/i), 'SUMMER20');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(mockPromoCodeService.validate).toHaveBeenCalledWith('SUMMER20', 79.99);
      });
    });
  });

  describe('remove action', () => {
    it('should reset to idle state when "Remove" is clicked', async () => {
      const user = userEvent.setup();
      mockPromoCodeService.validate.mockResolvedValueOnce(createValidPromoResult());

      render(<PromoCodeInput onRemove={mockOnRemove} />);
      await user.type(screen.getByLabelText(/promo code/i), 'SUMMER20');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /remove/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/promo code/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
      });
    });

    it('should clear the input when "Remove" is clicked', async () => {
      const user = userEvent.setup();
      mockPromoCodeService.validate.mockResolvedValueOnce(createValidPromoResult());

      render(<PromoCodeInput onRemove={mockOnRemove} />);
      await user.type(screen.getByLabelText(/promo code/i), 'SUMMER20');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /remove/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/promo code/i)).toHaveValue('');
      });
    });

    it('should call onRemove callback when "Remove" is clicked', async () => {
      const user = userEvent.setup();
      mockPromoCodeService.validate.mockResolvedValueOnce(createValidPromoResult());

      render(<PromoCodeInput onRemove={mockOnRemove} />);
      await user.type(screen.getByLabelText(/promo code/i), 'SUMMER20');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /remove/i }));

      expect(mockOnRemove).toHaveBeenCalledTimes(1);
    });
  });

  describe('error state (invalid or API error)', () => {
    it('should show error message from backend for invalid code (valid=false)', async () => {
      const user = userEvent.setup();
      mockPromoCodeService.validate.mockResolvedValueOnce(
        createInvalidPromoResult({ message: 'Promo code has expired' })
      );

      render(<PromoCodeInput />);
      await user.type(screen.getByLabelText(/promo code/i), 'EXPIRED10');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByText(/promo code has expired/i)).toBeInTheDocument();
      });
    });

    it('should keep input visible and editable after invalid code', async () => {
      const user = userEvent.setup();
      mockPromoCodeService.validate.mockResolvedValueOnce(createInvalidPromoResult());

      render(<PromoCodeInput />);
      await user.type(screen.getByLabelText(/promo code/i), 'EXPIRED10');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/promo code/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/promo code/i)).not.toBeDisabled();
      });
    });

    it('should set aria-invalid on input after invalid code', async () => {
      const user = userEvent.setup();
      mockPromoCodeService.validate.mockResolvedValueOnce(createInvalidPromoResult());

      render(<PromoCodeInput />);
      await user.type(screen.getByLabelText(/promo code/i), 'EXPIRED10');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/promo code/i)).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should show generic error message for ApiException (HTTP 400)', async () => {
      const user = userEvent.setup();
      mockPromoCodeService.validate.mockRejectedValueOnce(
        new ApiException('INVALID_PROMO_CODE_DATA', 'code is required', 400)
      );

      render(<PromoCodeInput />);
      await user.type(screen.getByLabelText(/promo code/i), '!');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid promo code/i)).toBeInTheDocument();
      });
    });

    it('should show generic error for unexpected API failures', async () => {
      const user = userEvent.setup();
      mockPromoCodeService.validate.mockRejectedValueOnce(new Error('Network error'));

      render(<PromoCodeInput />);
      await user.type(screen.getByLabelText(/promo code/i), 'SUMMER20');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByText(/could not apply promo code/i)).toBeInTheDocument();
      });
    });

    it('should clear error when user edits input after error', async () => {
      const user = userEvent.setup();
      mockPromoCodeService.validate.mockResolvedValueOnce(createInvalidPromoResult());

      render(<PromoCodeInput />);
      await user.type(screen.getByLabelText(/promo code/i), 'EXPIRED10');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/promo code/i), 'X');

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    it('should not call onApply for invalid code', async () => {
      const user = userEvent.setup();
      mockPromoCodeService.validate.mockResolvedValueOnce(createInvalidPromoResult());

      render(<PromoCodeInput onApply={mockOnApply} />);
      await user.type(screen.getByLabelText(/promo code/i), 'EXPIRED10');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(mockOnApply).not.toHaveBeenCalled();
      });
    });
  });

  describe('accessibility', () => {
    it('should have aria-describedby on input pointing to error message', async () => {
      const user = userEvent.setup();
      mockPromoCodeService.validate.mockResolvedValueOnce(createInvalidPromoResult());

      render(<PromoCodeInput />);
      await user.type(screen.getByLabelText(/promo code/i), 'EXPIRED10');
      await user.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/promo code/i)).toHaveAttribute('aria-describedby', 'promo-code-error');
      });
    });
  });
});
