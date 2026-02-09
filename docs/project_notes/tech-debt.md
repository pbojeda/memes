# Technical Debt

This file tracks known technical debt items with context and planned remediation.

## Format

| Priority | Item | Description | Ticket | Added |
|----------|------|-------------|--------|-------|

---

## Entries

### TD-001: Timing Attack on Login (Low Priority)

**Added:** 2026-02-06
**Location:** `backend/src/application/services/authService.ts:login()`
**Severity:** Low

**Issue:**
The login flow has a timing difference between:
1. "Email not found" (fast - DB lookup only)
2. "User exists but inactive" (medium - DB lookup + active check)
3. "Wrong password" (slow - DB lookup + bcrypt comparison)

This theoretically enables email enumeration via timing analysis.

**Current Trade-off:**
We prioritize user experience by failing fast for inactive accounts rather than adding artificial delay. For an e-commerce platform, this risk is acceptable.

**Mitigation Applied:**
- Active status is checked BEFORE password comparison (prevents revealing correct password for inactive accounts)
- Generic error messages (InvalidCredentialsError) don't reveal which check failed

**Full Fix (if needed later):**
Perform bcrypt comparison against a dummy hash even when user doesn't exist:
```typescript
const dummyHash = '$2b$12$...'; // Pre-computed hash
const passwordHash = user?.passwordHash || dummyHash;
await bcrypt.compare(password, passwordHash); // Always takes same time
```

**When to prioritize:**
- If we add high-value features (admin accounts, financial data)
- If we detect automated enumeration attacks in logs

---

### TD-002: API Client Config Mutation in Retry (Low Priority)

**Added:** 2026-02-09
**Location:** `frontend/lib/api/client.ts` (response interceptor)
**Severity:** Low

**Issue:**
When multiple requests are queued during token refresh and the refresh succeeds, all queued promises retry with the same originalRequest config. Each retry mutates `originalRequest.headers` independently. While Axios typically creates new config objects, shared references could cause race conditions.

**Current State:**
Works correctly in practice. Axios handles config isolation.

**Full Fix (if needed later):**
Clone config before modifying:
```typescript
.then((token) => {
  const retryConfig = { ...originalRequest };
  retryConfig.headers = { ...originalRequest.headers };
  retryConfig.headers.Authorization = `Bearer ${token}`;
  return client(retryConfig);
})
```

**When to prioritize:**
- If we observe intermittent auth header issues in production
- If we upgrade Axios and behavior changes

---

### TD-003: Inconsistent Error Transformation in Refresh Path (Low Priority)

**Added:** 2026-02-09
**Location:** `frontend/lib/api/client.ts` (response interceptor catch block)
**Severity:** Low

**Issue:**
Non-401 errors call `transformError()` and become `ApiException`. However, errors from `authService.refresh()` are re-thrown without transformation, so they might not be `ApiException`.

**Current State:**
`authService.refresh()` already throws `ApiException` for its errors, so this is mostly covered. Only unexpected errors (runtime errors) would bypass transformation.

**Full Fix (if needed later):**
```typescript
} catch (refreshError) {
  processQueue(refreshError as Error, null);
  navigateToLogin();
  return Promise.reject(
    refreshError instanceof AxiosError
      ? transformError(refreshError)
      : refreshError
  );
}
```

**When to prioritize:**
- If error handling becomes inconsistent in UI components
- If we need unified error tracking/logging

---

### TD-004: No Timeout for Queued Requests During Refresh (Medium Priority)

**Added:** 2026-02-09
**Location:** `frontend/lib/api/client.ts` (request queuing logic)
**Severity:** Medium

**Issue:**
If token refresh hangs indefinitely (network issues, server timeout), all queued requests will wait forever without any timeout mechanism. This could freeze API calls across the application.

**Current State:**
The refresh call itself has the standard 30s Axios timeout, so complete hangs are unlikely. However, queued requests have no independent timeout.

**Full Fix (if needed later):**
```typescript
const REFRESH_TIMEOUT = 10000; // 10 seconds

return Promise.race([
  new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  }).then((token) => { /* ... */ }),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Token refresh timeout')), REFRESH_TIMEOUT)
  )
]);
```

**When to prioritize:**
- If we observe frozen UI states in production
- If refresh endpoint becomes slow or unreliable

---

*Last updated: 2026-02-09*
