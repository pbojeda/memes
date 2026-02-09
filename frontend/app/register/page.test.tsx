import { render, screen } from '@testing-library/react';
import RegisterPage from './page';

// Mock RegisterForm to avoid testing its internals here
jest.mock('../../components/auth/RegisterForm', () => ({
  RegisterForm: () => <div data-testid="register-form">Mocked RegisterForm</div>,
}));

describe('RegisterPage', () => {
  it('should render the page title', () => {
    render(<RegisterPage />);

    expect(screen.getByText(/create account/i)).toBeInTheDocument();
  });

  it('should render the RegisterForm component', () => {
    render(<RegisterPage />);

    expect(screen.getByTestId('register-form')).toBeInTheDocument();
  });

  it('should be centered on the page', () => {
    render(<RegisterPage />);

    const container = screen.getByRole('main');
    expect(container).toHaveClass('flex');
    expect(container).toHaveClass('items-center');
    expect(container).toHaveClass('justify-center');
  });
});
