import { render, screen } from '@testing-library/react';
import LoginPage from './page';

jest.mock('../../components/auth/LoginForm', () => ({
  LoginForm: () => <div data-testid="login-form">Mocked Form</div>,
}));

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
}));

import { useSearchParams } from 'next/navigation';

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the page title', () => {
    render(<LoginPage />);

    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  it('should render the LoginForm component', () => {
    render(<LoginPage />);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  it('should show success message when registered=true', () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((param) => (param === 'registered' ? 'true' : null)),
    });

    render(<LoginPage />);

    expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
  });

  it('should not show success message without query param', () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn(() => null),
    });

    render(<LoginPage />);

    expect(screen.queryByText(/registration successful/i)).not.toBeInTheDocument();
  });

  it('should be centered on the page', () => {
    render(<LoginPage />);

    const container = screen.getByRole('main');
    expect(container).toHaveClass('flex');
    expect(container).toHaveClass('items-center');
    expect(container).toHaveClass('justify-center');
  });
});
