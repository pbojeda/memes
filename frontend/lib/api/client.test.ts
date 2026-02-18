import { ApiException } from './exceptions';

// Mock authStore
const mockAuthStoreState = {
  accessToken: null as string | null,
  refreshToken: null as string | null,
  clearAuth: jest.fn(),
  setTokens: jest.fn(),
};

jest.mock('../../stores/authStore', () => ({
  useAuthStore: {
    getState: () => mockAuthStoreState,
  },
}));

// Mock authService with dynamic import support
const mockRefresh = jest.fn();
jest.mock('../services/authService', () => ({
  authService: {
    refresh: () => mockRefresh(),
  },
}));

// Mock navigation helper that client.ts will use
const mockNavigateToLogin = jest.fn();
jest.mock('./navigation', () => ({
  navigateToLogin: () => mockNavigateToLogin(),
}));

// Import after mocks are set up
import { apiClient, API_BASE_URL } from './client';

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthStoreState.accessToken = null;
    mockAuthStoreState.refreshToken = null;
  });

  describe('Configuration', () => {
    it('should have correct base URL', () => {
      expect(apiClient.defaults.baseURL).toBe(API_BASE_URL);
    });

    it('should have correct default headers', () => {
      expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('should have timeout configured', () => {
      expect(apiClient.defaults.timeout).toBe(30000);
    });
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header when accessToken exists in authStore', async () => {
      mockAuthStoreState.accessToken = 'test-token-from-store';

      const config = await apiClient.interceptors.request.handlers[0].fulfilled({
        headers: {},
      } as any);

      expect(config.headers.Authorization).toBe('Bearer test-token-from-store');
    });

    it('should not add Authorization header when no token in authStore', async () => {
      mockAuthStoreState.accessToken = null;

      const config = await apiClient.interceptors.request.handlers[0].fulfilled({
        headers: {},
      } as any);

      expect(config.headers.Authorization).toBeUndefined();
    });

    it('removes Content-Type header when request data is FormData', async () => {
      mockAuthStoreState.accessToken = 'test-token';
      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.jpg');

      const config = await apiClient.interceptors.request.handlers[0].fulfilled({
        headers: { 'Content-Type': 'application/json' },
        data: formData,
      } as any);

      expect(config.headers['Content-Type']).toBeUndefined();
      expect(config.headers.Authorization).toBe('Bearer test-token');
    });

    it('keeps Content-Type header for non-FormData requests', async () => {
      mockAuthStoreState.accessToken = null;

      const config = await apiClient.interceptors.request.handlers[0].fulfilled({
        headers: { 'Content-Type': 'application/json' },
        data: { name: 'test' },
      } as any);

      expect(config.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Response Interceptor - Success', () => {
    it('should pass through successful responses unchanged', async () => {
      const response = { data: { success: true } };
      const result = await apiClient.interceptors.response.handlers[0].fulfilled(response);
      expect(result).toBe(response);
    });
  });

  describe('Response Interceptor - Error Transformation', () => {
    it('should transform API errors to ApiException', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input',
              details: [{ field: 'email', message: 'Invalid format' }],
            },
          },
        },
        config: { url: '/some/endpoint' },
      };

      try {
        await apiClient.interceptors.response.handlers[0].rejected(error);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
        expect((e as ApiException).code).toBe('VALIDATION_ERROR');
        expect((e as ApiException).message).toBe('Invalid input');
        expect((e as ApiException).status).toBe(400);
        expect((e as ApiException).details).toHaveLength(1);
      }
    });

    it('should handle network errors', async () => {
      const error = {
        response: undefined,
        message: 'Network Error',
        config: { url: '/some/endpoint' },
      };

      try {
        await apiClient.interceptors.response.handlers[0].rejected(error);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
        expect((e as ApiException).code).toBe('NETWORK_ERROR');
        expect((e as ApiException).status).toBe(0);
      }
    });
  });

  describe('Response Interceptor - 401 with Token Refresh', () => {
    it('should attempt refresh on 401 error', async () => {
      mockAuthStoreState.accessToken = 'new-token-after-refresh';
      mockRefresh.mockResolvedValueOnce(undefined);

      const error = {
        response: { status: 401 },
        config: {
          url: '/protected/endpoint',
          headers: {},
          _retry: false,
        },
      };

      // The interceptor should attempt refresh
      // Since we can't easily test the full flow without axios-mock-adapter,
      // we verify the refresh is called
      try {
        await apiClient.interceptors.response.handlers[0].rejected(error);
      } catch {
        // Expected - the retry mechanism needs actual axios to work
      }

      expect(mockRefresh).toHaveBeenCalled();
    });

    it('should NOT attempt refresh for /auth/refresh endpoint', async () => {
      const error = {
        response: { status: 401 },
        config: {
          url: '/auth/refresh',
          headers: {},
        },
      };

      try {
        await apiClient.interceptors.response.handlers[0].rejected(error);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
      }

      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('should NOT attempt refresh for already retried requests', async () => {
      const error = {
        response: { status: 401 },
        config: {
          url: '/protected/endpoint',
          headers: {},
          _retry: true,
        },
      };

      try {
        await apiClient.interceptors.response.handlers[0].rejected(error);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
      }

      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('should redirect to /login when refresh fails', async () => {
      mockRefresh.mockRejectedValueOnce(new Error('Refresh failed'));

      const error = {
        response: { status: 401 },
        config: {
          url: '/protected/endpoint',
          headers: {},
          _retry: false,
        },
      };

      try {
        await apiClient.interceptors.response.handlers[0].rejected(error);
        fail('Should have thrown');
      } catch {
        // Expected
      }

      expect(mockNavigateToLogin).toHaveBeenCalled();
    });

    it('should NOT attempt refresh for non-401 errors', async () => {
      const error = {
        response: {
          status: 403,
          data: {
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied',
            },
          },
        },
        config: { url: '/protected/endpoint' },
      };

      try {
        await apiClient.interceptors.response.handlers[0].rejected(error);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
        expect((e as ApiException).status).toBe(403);
      }

      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });
});

describe('ApiException', () => {
  it('should create an exception with all properties', () => {
    const exception = new ApiException('TEST_ERROR', 'Test message', 400, [
      { field: 'test', message: 'Test detail' },
    ]);

    expect(exception.code).toBe('TEST_ERROR');
    expect(exception.message).toBe('Test message');
    expect(exception.status).toBe(400);
    expect(exception.details).toHaveLength(1);
    expect(exception.name).toBe('ApiException');
  });
});
