import { apiClient, API_BASE_URL } from "./client";
import { ApiException } from "./types";

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("API Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Configuration", () => {
    it("should have correct base URL", () => {
      expect(apiClient.defaults.baseURL).toBe(API_BASE_URL);
    });

    it("should have correct default headers", () => {
      expect(apiClient.defaults.headers["Content-Type"]).toBe(
        "application/json"
      );
    });

    it("should have timeout configured", () => {
      expect(apiClient.defaults.timeout).toBe(30000);
    });
  });

  describe("Request Interceptor", () => {
    it("should add Authorization header when token exists", async () => {
      localStorageMock.getItem.mockReturnValue("test-token");

      const config = await apiClient.interceptors.request.handlers[0].fulfilled(
        { headers: {} } as any
      );

      expect(config.headers.Authorization).toBe("Bearer test-token");
    });

    it("should not add Authorization header when no token", async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const config = await apiClient.interceptors.request.handlers[0].fulfilled(
        { headers: {} } as any
      );

      expect(config.headers.Authorization).toBeUndefined();
    });
  });

  describe("Response Interceptor", () => {
    it("should pass through successful responses", async () => {
      const response = { data: { success: true } };
      const result =
        await apiClient.interceptors.response.handlers[0].fulfilled(response);
      expect(result).toBe(response);
    });

    it("should transform API errors to ApiException", async () => {
      const error = {
        response: {
          status: 400,
          data: {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid input",
              details: [{ field: "email", message: "Invalid format" }],
            },
          },
        },
      };

      try {
        await apiClient.interceptors.response.handlers[0].rejected(error);
        fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
        expect((e as ApiException).code).toBe("VALIDATION_ERROR");
        expect((e as ApiException).message).toBe("Invalid input");
        expect((e as ApiException).status).toBe(400);
        expect((e as ApiException).details).toHaveLength(1);
      }
    });

    it("should handle network errors", async () => {
      const error = {
        response: undefined,
        message: "Network Error",
      };

      try {
        await apiClient.interceptors.response.handlers[0].rejected(error);
        fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
        expect((e as ApiException).code).toBe("NETWORK_ERROR");
        expect((e as ApiException).status).toBe(0);
      }
    });
  });
});

describe("ApiException", () => {
  it("should create an exception with all properties", () => {
    const exception = new ApiException("TEST_ERROR", "Test message", 400, [
      { field: "test", message: "Test detail" },
    ]);

    expect(exception.code).toBe("TEST_ERROR");
    expect(exception.message).toBe("Test message");
    expect(exception.status).toBe(400);
    expect(exception.details).toHaveLength(1);
    expect(exception.name).toBe("ApiException");
  });
});
