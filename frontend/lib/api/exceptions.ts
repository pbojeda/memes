/**
 * API error response structure from backend
 */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

/**
 * Custom exception class for API errors
 */
export class ApiException extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiException';
  }
}
