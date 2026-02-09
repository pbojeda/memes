import { render, screen } from '@testing-library/react';
import { PasswordStrength } from './PasswordStrength';

describe('PasswordStrength', () => {
  it('should render all password requirements', () => {
    render(<PasswordStrength password="" />);

    expect(screen.getByText('At least 12 characters')).toBeInTheDocument();
    expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('One lowercase letter')).toBeInTheDocument();
    expect(screen.getByText('One number')).toBeInTheDocument();
  });

  it('should show all requirements as unmet for empty password', () => {
    render(<PasswordStrength password="" />);

    const items = screen.getAllByRole('listitem');
    items.forEach((item) => {
      expect(item).toHaveAttribute('data-met', 'false');
    });
  });

  it('should show length requirement as met when password is 12+ chars', () => {
    render(<PasswordStrength password="abcdefghijkl" />);

    const lengthItem = screen.getByText('At least 12 characters').closest('li');
    expect(lengthItem).toHaveAttribute('data-met', 'true');
  });

  it('should show uppercase requirement as met when password has uppercase', () => {
    render(<PasswordStrength password="A" />);

    const uppercaseItem = screen.getByText('One uppercase letter').closest('li');
    expect(uppercaseItem).toHaveAttribute('data-met', 'true');
  });

  it('should show lowercase requirement as met when password has lowercase', () => {
    render(<PasswordStrength password="a" />);

    const lowercaseItem = screen.getByText('One lowercase letter').closest('li');
    expect(lowercaseItem).toHaveAttribute('data-met', 'true');
  });

  it('should show number requirement as met when password has number', () => {
    render(<PasswordStrength password="1" />);

    const numberItem = screen.getByText('One number').closest('li');
    expect(numberItem).toHaveAttribute('data-met', 'true');
  });

  it('should show all requirements as met for strong password', () => {
    render(<PasswordStrength password="SecurePass123" />);

    const items = screen.getAllByRole('listitem');
    items.forEach((item) => {
      expect(item).toHaveAttribute('data-met', 'true');
    });
  });

  it('should update when password changes', () => {
    const { rerender } = render(<PasswordStrength password="" />);

    const lengthItem = screen.getByText('At least 12 characters').closest('li');
    expect(lengthItem).toHaveAttribute('data-met', 'false');

    rerender(<PasswordStrength password="LongPassword1" />);
    expect(lengthItem).toHaveAttribute('data-met', 'true');
  });
});
