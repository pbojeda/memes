import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import { ApiError, ApiException } from './exceptions';
import { useAuthStore } from '../../stores/authStore';
import { navigateToLogin } from './navigation';

// Extend AxiosRequestConfig to include _retry flag
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// State for managing token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: Error) => void;
}> = [];

// Process queued requests after refresh completes
function processQueue(error: Error | null, token: string | null): void {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
}

// Transform axios errors to ApiException
function transformError(error: AxiosError<ApiError>): ApiException {
  if (error.response?.data?.error) {
    const { code, message, details } = error.response.data.error;
    return new ApiException(code, message, error.response.status, details);
  }

  // Network error or no response
  if (!error.response) {
    return new ApiException('NETWORK_ERROR', 'Unable to connect to server', 0);
  }

  // Generic error
  return new ApiException(
    'UNKNOWN_ERROR',
    error.message || 'An unexpected error occurred',
    error.response?.status || 500
  );
}

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Request interceptor - add auth token from authStore
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Get token from authStore (client-side only)
      if (typeof window !== 'undefined') {
        const { accessToken } = useAuthStore.getState();
        if (accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      }
      // Let axios auto-set Content-Type for FormData (multipart/form-data with boundary)
      if (config.data instanceof FormData && config.headers) {
        delete config.headers['Content-Type'];
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle errors and token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config;

      // Check if this is a 401 error that should trigger refresh
      const shouldAttemptRefresh =
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest.url?.includes('/auth/refresh') &&
        !originalRequest._retry;

      if (!shouldAttemptRefresh) {
        throw transformError(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return client(originalRequest);
          })
          .catch((err) => {
            throw err;
          });
      }

      // Mark as retrying and start refresh
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Dynamic import to avoid circular dependency
        const { authService } = await import('../services/authService');
        await authService.refresh();

        // Get new token from store
        const { accessToken } = useAuthStore.getState();

        // Process queued requests with new token
        processQueue(null, accessToken);

        // Retry original request with new token
        if (accessToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return client(originalRequest);
      } catch (refreshError) {
        // Process queued requests with error
        processQueue(refreshError as Error, null);

        // Redirect to login - don't re-throw as navigation will clear the page
        navigateToLogin();

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        failedQueue = []; // Defensive cleanup to prevent memory leaks
      }
    }
  );

  return client;
}

export const apiClient = createApiClient();
export { API_BASE_URL };
