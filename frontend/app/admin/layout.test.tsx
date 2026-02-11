import { render, screen } from '@testing-library/react';
import AdminLayout from './layout';

// Mock ProtectedRoute to avoid auth complexity in layout tests
jest.mock('../../components/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({
    children,
    allowedRoles,
  }: {
    children: React.ReactNode;
    allowedRoles?: string[];
  }) => (
    <div data-testid="protected-route" data-roles={allowedRoles?.join(',')}>
      {children}
    </div>
  ),
}));

// Mock AdminSidebar
jest.mock('../../components/admin/AdminSidebar', () => ({
  AdminSidebar: () => <div data-testid="admin-sidebar">AdminSidebar</div>,
}));

describe('AdminLayout', () => {
  it('should render ProtectedRoute with ADMIN role', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    const protectedRoute = screen.getByTestId('protected-route');
    expect(protectedRoute).toBeInTheDocument();
    expect(protectedRoute).toHaveAttribute('data-roles', 'ADMIN');
  });

  it('should render AdminSidebar', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
  });

  it('should render children in main content area', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
