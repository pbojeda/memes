import { render, screen } from '@testing-library/react';
import { AdminSidebar } from './AdminSidebar';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

import { usePathname } from 'next/navigation';

describe('AdminSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the "Admin" heading', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin');

    render(<AdminSidebar />);

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('should render nav link for "Product Types" with correct href', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin');

    render(<AdminSidebar />);

    const link = screen.getByRole('link', { name: /product types/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/product-types');
  });

  it('should highlight the active link when pathname matches', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/product-types');

    render(<AdminSidebar />);

    const link = screen.getByRole('link', { name: /product types/i });
    expect(link).toHaveAttribute('data-active', 'true');
  });

  it('should not highlight the link when pathname differs', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/other-page');

    render(<AdminSidebar />);

    const link = screen.getByRole('link', { name: /product types/i });
    expect(link).toHaveAttribute('data-active', 'false');
  });

  it('should have accessible nav element with aria-label', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin');

    render(<AdminSidebar />);

    const nav = screen.getByRole('navigation', { name: /admin navigation/i });
    expect(nav).toBeInTheDocument();
  });
});
