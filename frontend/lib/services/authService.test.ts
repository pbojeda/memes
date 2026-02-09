import { authService } from './authService';
import { apiClient } from '../api/client';
import { ApiException } from '../api/exceptions';
import { useAuthStore } from '../../stores/authStore';
import { act } from '@testing-library/react';

// Mock apiClient
jest.mock('../api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock user and tokens for tests
const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'TARGET' as const,
  isActive: true,
  emailVerifiedAt: null,
  lastLoginAt: '2026-02-09T10:00:00.000Z',
  createdAt: '2026-02-01T10:00:00.000Z',
};

const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth store
    act(() => {
      useAuthStore.getState().clearAuth();
    });
  });

  describe('login', () => {
    it('should call login endpoint and update authStore on success', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            user: mockUser,
            accessToken: mockTokens.accessToken,
            refreshToken: mockTokens.refreshToken,
          },
        },
      });

      await authService.login({ email: 'test@example.com', password: 'password123' });

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe(mockTokens.accessToken);
      expect(state.refreshToken).toBe(mockTokens.refreshToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should set error in authStore on failure', async () => {
      const error = new ApiException('INVALID_CREDENTIALS', 'Invalid email or password', 401);
      mockApiClient.post.mockRejectedValueOnce(error);

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow(ApiException);

      const state = useAuthStore.getState();
      expect(state.error).toBe('Invalid email or password');
      expect(state.isAuthenticated).toBe(false);
    });

    it('should set loading state during login', async () => {
      let loadingDuringRequest = false;
      mockApiClient.post.mockImplementationOnce(async () => {
        loadingDuringRequest = useAuthStore.getState().isLoading;
        return {
          data: {
            success: true,
            data: {
              user: mockUser,
              accessToken: mockTokens.accessToken,
              refreshToken: mockTokens.refreshToken,
            },
          },
        };
      });

      await authService.login({ email: 'test@example.com', password: 'password123' });

      expect(loadingDuringRequest).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('should call register endpoint and return user data', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockUser,
        },
      });

      const result = await authService.register({
        email: 'new@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', {
        email: 'new@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result).toEqual(mockUser);
      // Register should NOT set auth state (user must login separately)
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should throw ApiException on duplicate email', async () => {
      const error = new ApiException('EMAIL_EXISTS', 'Email already registered', 409);
      mockApiClient.post.mockRejectedValueOnce(error);

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe',
        })
      ).rejects.toThrow(ApiException);
    });
  });

  describe('logout', () => {
    it('should call logout endpoint and clear authStore', async () => {
      // First set some auth state
      act(() => {
        useAuthStore.getState().setAuth(mockUser, mockTokens);
      });

      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true, message: 'Logged out successfully' },
      });

      await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should clear authStore even if API call fails', async () => {
      act(() => {
        useAuthStore.getState().setAuth(mockUser, mockTokens);
      });

      mockApiClient.post.mockRejectedValueOnce(new Error('Network error'));

      await authService.logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('refresh', () => {
    it('should call refresh endpoint and update tokens', async () => {
      act(() => {
        useAuthStore.getState().setAuth(mockUser, mockTokens);
      });

      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: newTokens,
        },
      });

      await authService.refresh();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: mockTokens.refreshToken,
      });

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe(newTokens.accessToken);
      expect(state.refreshToken).toBe(newTokens.refreshToken);
      expect(state.user).toEqual(mockUser); // User should remain unchanged
    });

    it('should throw if no refresh token available', async () => {
      // No auth state set, so no refresh token

      await expect(authService.refresh()).rejects.toThrow(ApiException);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should clear auth and throw on invalid refresh token', async () => {
      act(() => {
        useAuthStore.getState().setAuth(mockUser, mockTokens);
      });

      const error = new ApiException('INVALID_TOKEN', 'Refresh token expired', 401);
      mockApiClient.post.mockRejectedValueOnce(error);

      await expect(authService.refresh()).rejects.toThrow(ApiException);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('forgotPassword', () => {
    it('should call forgot-password endpoint and return message', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: { message: 'If an account exists, a reset email has been sent' },
        },
      });

      const result = await authService.forgotPassword('test@example.com');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'test@example.com',
      });

      expect(result).toBe('If an account exists, a reset email has been sent');
    });
  });

  describe('resetPassword', () => {
    it('should call reset-password endpoint and return message', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: { message: 'Password has been reset successfully' },
        },
      });

      const result = await authService.resetPassword('reset-token-123', 'NewSecurePass123!');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'reset-token-123',
        newPassword: 'NewSecurePass123!',
      });

      expect(result).toBe('Password has been reset successfully');
    });

    it('should throw on invalid token', async () => {
      const error = new ApiException('INVALID_TOKEN', 'Reset token is invalid or expired', 400);
      mockApiClient.post.mockRejectedValueOnce(error);

      await expect(
        authService.resetPassword('invalid-token', 'NewSecurePass123!')
      ).rejects.toThrow(ApiException);
    });
  });
});
