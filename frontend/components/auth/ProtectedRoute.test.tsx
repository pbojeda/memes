import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '../../stores/authStore';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '../../stores/authStore';

jest.mock('../../stores/authStore');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

const mockReplace = jest.fn();
const mockRehydrate = jest.fn();

const mockUser: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'TARGET',
  isActive: true,
  emailVerifiedAt: null,
  lastLoginAt: '2026-02-09T10:00:00.000Z',
  createdAt: '2026-02-01T10:00:00.000Z',
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
    (usePathname as jest.Mock).mockReturnValue('/protected-page');
  });

  it('should show loading state while hydrating', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });

    (useAuthStore as unknown as jest.Mock & { persist: { rehydrate: jest.Mock } }).persist = {
      rehydrate: mockRehydrate,
    };

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Before hydration completes, should show loading
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();
  });

  it('should render children when user is authenticated without role restriction', async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      isLoading: false,
    });

    (useAuthStore as unknown as jest.Mock & { persist: { rehydrate: jest.Mock } }).persist = {
      rehydrate: jest.fn().mockResolvedValue(undefined),
    };

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText(/protected content/i)).toBeInTheDocument();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('should redirect to login with returnTo when not authenticated', async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });

    (useAuthStore as unknown as jest.Mock & { persist: { rehydrate: jest.Mock } }).persist = {
      rehydrate: jest.fn().mockResolvedValue(undefined),
    };

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login?returnTo=%2Fprotected-page');
    });
  });

  it('should render children when user has an allowed role', async () => {
    const adminUser: User = { ...mockUser, role: 'ADMIN' };

    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: adminUser,
      isLoading: false,
    });

    (useAuthStore as unknown as jest.Mock & { persist: { rehydrate: jest.Mock } }).persist = {
      rehydrate: jest.fn().mockResolvedValue(undefined),
    };

    render(
      <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText(/admin content/i)).toBeInTheDocument();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('should show access denied when user role is not in allowedRoles', async () => {
    const targetUser: User = { ...mockUser, role: 'TARGET' };

    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: targetUser,
      isLoading: false,
    });

    (useAuthStore as unknown as jest.Mock & { persist: { rehydrate: jest.Mock } }).persist = {
      rehydrate: jest.fn().mockResolvedValue(undefined),
    };

    render(
      <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/admin content/i)).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('should allow any authenticated user when allowedRoles is not provided', async () => {
    const managerUser: User = { ...mockUser, role: 'MANAGER' };

    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: managerUser,
      isLoading: false,
    });

    (useAuthStore as unknown as jest.Mock & { persist: { rehydrate: jest.Mock } }).persist = {
      rehydrate: jest.fn().mockResolvedValue(undefined),
    };

    render(
      <ProtectedRoute>
        <div>Any Auth User Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText(/any auth user content/i)).toBeInTheDocument();
    });
  });

  it('should call rehydrate on mount', () => {
    const mockRehydrateLocal = jest.fn().mockResolvedValue(undefined);

    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });

    (useAuthStore as unknown as jest.Mock & { persist: { rehydrate: jest.Mock } }).persist = {
      rehydrate: mockRehydrateLocal,
    };

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(mockRehydrateLocal).toHaveBeenCalledTimes(1);
  });
});
