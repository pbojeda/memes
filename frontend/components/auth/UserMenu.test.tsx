import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserMenu } from './UserMenu';
import { useAuthStore } from '../../stores/authStore';
import * as authServiceModule from '../../lib/services/authService';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock authService
jest.mock('../../lib/services/authService', () => ({
  authService: {
    logout: jest.fn(),
  },
}));

const mockUser = {
  id: '123',
  email: 'test@example.com',
  firstName: null,
  lastName: null,
  role: 'TARGET' as const,
  isActive: true,
  emailVerifiedAt: null,
  lastLoginAt: null,
  createdAt: '2026-01-01T00:00:00Z',
};

// Helper to set auth store state
function setAuthState(overrides: Partial<ReturnType<typeof useAuthStore.getState>> = {}) {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    ...overrides,
  });
}

describe('UserMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAuthState();
    // Mock rehydrate to resolve immediately and mark as hydrated
    jest.spyOn(useAuthStore.persist, 'rehydrate').mockResolvedValue(undefined as never);
  });

  describe('when unauthenticated', () => {
    it('should render Login link pointing to /login', async () => {
      render(<UserMenu />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
      });
    });

    it('should render Register link pointing to /register', async () => {
      render(<UserMenu />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute('href', '/register');
      });
    });

    it('should NOT render dropdown trigger', async () => {
      render(<UserMenu />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /user menu/i })).not.toBeInTheDocument();
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      setAuthState({
        user: mockUser,
        isAuthenticated: true,
        accessToken: 'token',
        refreshToken: 'refresh',
      });
    });

    it('should render dropdown trigger with user initial', async () => {
      render(<UserMenu />);

      await waitFor(() => {
        const trigger = screen.getByRole('button', { name: /user menu/i });
        expect(trigger).toBeInTheDocument();
        expect(trigger).toHaveTextContent('T');
      });
    });

    it('should NOT render Login/Register links', async () => {
      render(<UserMenu />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
      });

      expect(screen.queryByRole('link', { name: /log in/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument();
    });

    it('should show user email in dropdown content', async () => {
      const user = userEvent.setup();
      render(<UserMenu />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /user menu/i }));

      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
      });
    });

    it('should show user role badge in dropdown content', async () => {
      const user = userEvent.setup();
      render(<UserMenu />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /user menu/i }));

      await waitFor(() => {
        expect(screen.getByText('TARGET')).toBeInTheDocument();
      });
    });

    it('should call authService.logout and redirect when Logout is clicked', async () => {
      const user = userEvent.setup();
      (authServiceModule.authService.logout as jest.Mock).mockResolvedValue(undefined);

      render(<UserMenu />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /user menu/i }));

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /log out/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('menuitem', { name: /log out/i }));

      await waitFor(() => {
        expect(authServiceModule.authService.logout).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('hydration', () => {
    it('should call rehydrate on mount', async () => {
      render(<UserMenu />);

      await waitFor(() => {
        expect(useAuthStore.persist.rehydrate).toHaveBeenCalled();
      });
    });

    it('should show skeleton placeholder while hydrating', () => {
      // Make rehydrate never resolve
      jest.spyOn(useAuthStore.persist, 'rehydrate').mockReturnValue(new Promise(() => {}) as never);

      render(<UserMenu />);

      // Should render an accessible placeholder during hydration
      const skeleton = screen.getByRole('status');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('data-slot', 'user-menu-skeleton');
    });
  });
});
