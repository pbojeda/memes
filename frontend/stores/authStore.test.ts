import { act } from '@testing-library/react';
import { useAuthStore } from './authStore';
import type { User, AuthTokens } from '../types/auth';

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

const mockTokens: AuthTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      useAuthStore.getState().clearAuth();
    });
  });

  describe('initial state', () => {
    it('should have unauthenticated initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setAuth', () => {
    it('should set user and tokens, marking as authenticated', () => {
      act(() => {
        useAuthStore.getState().setAuth(mockUser, mockTokens);
      });

      const state = useAuthStore.getState();

      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe(mockTokens.accessToken);
      expect(state.refreshToken).toBe(mockTokens.refreshToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should clear previous error when setting auth', () => {
      act(() => {
        useAuthStore.getState().setError('Previous error');
        useAuthStore.getState().setAuth(mockUser, mockTokens);
      });

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('clearAuth', () => {
    it('should reset all state to initial values', () => {
      // First set some auth state
      act(() => {
        useAuthStore.getState().setAuth(mockUser, mockTokens);
        useAuthStore.getState().setLoading(true);
      });

      // Then clear it
      act(() => {
        useAuthStore.getState().clearAuth();
      });

      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set loading state to true', () => {
      act(() => {
        useAuthStore.getState().setLoading(true);
      });

      expect(useAuthStore.getState().isLoading).toBe(true);
    });

    it('should set loading state to false', () => {
      act(() => {
        useAuthStore.getState().setLoading(true);
        useAuthStore.getState().setLoading(false);
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const errorMessage = 'Authentication failed';

      act(() => {
        useAuthStore.getState().setError(errorMessage);
      });

      const state = useAuthStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false);
    });

    it('should clear error when set to null', () => {
      act(() => {
        useAuthStore.getState().setError('Some error');
        useAuthStore.getState().setError(null);
      });

      expect(useAuthStore.getState().error).toBeNull();
    });

    it('should set loading to false when setting error', () => {
      act(() => {
        useAuthStore.getState().setLoading(true);
        useAuthStore.getState().setError('Error occurred');
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('setTokens', () => {
    it('should update tokens without affecting user', () => {
      // First set auth with user
      act(() => {
        useAuthStore.getState().setAuth(mockUser, mockTokens);
      });

      const newTokens: AuthTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      act(() => {
        useAuthStore.getState().setTokens(newTokens);
      });

      const state = useAuthStore.getState();

      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe(newTokens.accessToken);
      expect(state.refreshToken).toBe(newTokens.refreshToken);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should work even without existing user', () => {
      act(() => {
        useAuthStore.getState().setTokens(mockTokens);
      });

      const state = useAuthStore.getState();

      expect(state.accessToken).toBe(mockTokens.accessToken);
      expect(state.refreshToken).toBe(mockTokens.refreshToken);
      expect(state.user).toBeNull();
    });
  });
});
