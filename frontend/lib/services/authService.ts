import { apiClient } from '../api/client';
import { ApiException } from '../api/exceptions';
import type { components } from '../api/types';
import { useAuthStore } from '../../stores/authStore';

// Types from OpenAPI
type LoginRequest = components['schemas']['LoginRequest'];
type RegisterRequest = components['schemas']['RegisterRequest'];
type AuthResponse = components['schemas']['AuthResponse'];
type RegisterResponse = components['schemas']['RegisterResponse'];
type RefreshResponse = components['schemas']['RefreshResponse'];
type MessageResponse = components['schemas']['MessageResponse'];

export const authService = {
  /**
   * Login user with email and password.
   * Updates authStore with user and tokens on success.
   */
  async login(credentials: LoginRequest): Promise<void> {
    const { setAuth, setLoading, setError } = useAuthStore.getState();
    setLoading(true);
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, { accessToken, refreshToken });
      setLoading(false);
    } catch (error) {
      if (error instanceof ApiException) {
        setError(error.message);
      }
      throw error;
    }
  },

  /**
   * Register a new user.
   * Returns user data but does NOT log them in (they must login separately).
   */
  async register(data: RegisterRequest): Promise<components['schemas']['AuthUser']> {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response.data.data;
  },

  /**
   * Logout current user.
   * Always clears authStore, even if API call fails.
   */
  async logout(): Promise<void> {
    const { clearAuth } = useAuthStore.getState();
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore API errors - we always want to clear local auth state
    } finally {
      clearAuth();
    }
  },

  /**
   * Refresh access token using stored refresh token.
   * Clears auth and throws if refresh fails.
   */
  async refresh(): Promise<void> {
    const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();
    if (!refreshToken) {
      clearAuth();
      throw new ApiException('NO_REFRESH_TOKEN', 'No refresh token available', 401);
    }
    try {
      const response = await apiClient.post<RefreshResponse>('/auth/refresh', {
        refreshToken,
      });
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      setTokens({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
      clearAuth();
      throw error;
    }
  },

  /**
   * Request password reset email.
   */
  async forgotPassword(email: string): Promise<string> {
    const response = await apiClient.post<MessageResponse>('/auth/forgot-password', { email });
    return response.data.data?.message || 'Password reset email sent';
  },

  /**
   * Reset password using token from email.
   */
  async resetPassword(token: string, newPassword: string): Promise<string> {
    const response = await apiClient.post<MessageResponse>('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data.data?.message || 'Password reset successful';
  },
};
