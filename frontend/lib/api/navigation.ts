/**
 * Navigation helper for API client.
 * Extracted to a separate file to make it easily mockable in tests.
 */
export function navigateToLogin(): void {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
