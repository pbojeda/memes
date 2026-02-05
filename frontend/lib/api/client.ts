import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiError, ApiException } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Get token from localStorage (client-side only)
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("accessToken");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle errors
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
      if (error.response?.data?.error) {
        const { code, message, details } = error.response.data.error;
        throw new ApiException(code, message, error.response.status, details);
      }

      // Network error or no response
      if (!error.response) {
        throw new ApiException(
          "NETWORK_ERROR",
          "Unable to connect to server",
          0
        );
      }

      // Generic error
      throw new ApiException(
        "UNKNOWN_ERROR",
        error.message || "An unexpected error occurred",
        error.response?.status || 500
      );
    }
  );

  return client;
}

export const apiClient = createApiClient();
export { API_BASE_URL };
