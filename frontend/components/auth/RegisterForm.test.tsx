import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './RegisterForm';
import { authService } from '../../lib/services/authService';
import { useRouter } from 'next/navigation';

// Mock authService
jest.mock('../../lib/services/authService', () => ({
  authService: {
    register: jest.fn(),
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('should render email, password, and confirm password fields', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('should render submit button', () => {
    render(<RegisterForm />);

    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should render link to login page', () => {
    render(<RegisterForm />);

    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login');
  });

  it('should render PasswordStrength component', () => {
    render(<RegisterForm />);

    expect(screen.getByText(/password requirements/i)).toBeInTheDocument();
  });

  it('should show email validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // blur

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('should show password match error when passwords differ', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);

    await user.type(passwordInput, 'SecurePass123');
    await user.type(confirmInput, 'DifferentPass123');
    await user.tab(); // blur

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button when form is invalid', () => {
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when form is valid', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123');

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /create account/i });
      expect(submitButton).toBeEnabled();
    });
  });

  it('should call authService.register on valid form submission', async () => {
    const user = userEvent.setup();
    (authService.register as jest.Mock).mockResolvedValue({ id: '1', email: 'test@example.com' });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'SecurePass123',
      });
    });
  });

  it('should redirect to login on successful registration', async () => {
    const user = userEvent.setup();
    (authService.register as jest.Mock).mockResolvedValue({ id: '1', email: 'test@example.com' });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?registered=true');
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    let resolveRegister: (value: unknown) => void;
    (authService.register as jest.Mock).mockImplementation(
      () => new Promise((resolve) => { resolveRegister = resolve; })
    );

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();

    // Resolve the promise to clean up
    resolveRegister!({ id: '1', email: 'test@example.com' });
  });

  it('should show error message for duplicate email (409)', async () => {
    const user = userEvent.setup();
    const error = new Error('Email already exists');
    (error as Error & { status?: number }).status = 409;
    (authService.register as jest.Mock).mockRejectedValue(error);

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is already registered/i)).toBeInTheDocument();
    });
  });

  it('should show generic error message for other API errors', async () => {
    const user = userEvent.setup();
    (authService.register as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });
  });
});
