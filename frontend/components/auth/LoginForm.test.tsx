import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { authService } from '../../lib/services/authService';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';

jest.mock('../../lib/services/authService', () => ({
  authService: {
    login: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../stores/authStore', () => ({
  useAuthStore: {
    getState: jest.fn(),
  },
}));

const mockPush = jest.fn();

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuthStore.getState as jest.Mock).mockReturnValue({ user: { role: 'TARGET' } });
  });

  it('should render email and password fields', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should render submit button', () => {
    render(<LoginForm />);

    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should render link to register page', () => {
    render(<LoginForm />);

    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute('href', '/register');
  });

  it('should show email validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button when form is invalid', () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /login/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when form is valid', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /login/i });
      expect(submitButton).toBeEnabled();
    });
  });

  it('should call authService.login with normalized email on submit', async () => {
    const user = userEvent.setup();
    (authService.login as jest.Mock).mockResolvedValue(undefined);

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'Test@Example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should redirect TARGET role to / on successful login', async () => {
    const user = userEvent.setup();
    (authService.login as jest.Mock).mockResolvedValue(undefined);
    (useAuthStore.getState as jest.Mock).mockReturnValue({ user: { role: 'TARGET' } });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('should redirect non-TARGET roles to /dashboard on successful login', async () => {
    const user = userEvent.setup();
    (authService.login as jest.Mock).mockResolvedValue(undefined);
    (useAuthStore.getState as jest.Mock).mockReturnValue({ user: { role: 'ADMIN' } });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show error for invalid credentials (401)', async () => {
    const user = userEvent.setup();
    const error = new Error('Unauthorized');
    (error as Error & { status?: number }).status = 401;
    (authService.login as jest.Mock).mockRejectedValue(error);

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('should show generic error for other API errors', async () => {
    const user = userEvent.setup();
    (authService.login as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    let resolveLogin: () => void;
    (authService.login as jest.Mock).mockImplementation(
      () => new Promise((resolve) => { resolveLogin = resolve; })
    );

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();

    resolveLogin!();
  });
});
