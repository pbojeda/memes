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

### TD-005: English Content Erasure on Product Edit (Medium Priority)

**Added:** 2026-02-17
**Location:** `frontend/components/admin/products/ProductForm.tsx`
**Severity:** Medium

**Issue:**
When editing a product, the form pre-fills `titleEs`/`descriptionEs` from `product.title`/`product.description` (which are already localized to `es` by the API). However, the `en` fields start empty because the API doesn't return the raw `LocalizedString` object — it returns the resolved string for the current locale.

If an admin edits a product that has English translations, the update will overwrite them with empty values unless the admin re-enters the English text.

**Current State:**
Acceptable for MVP since all content is primarily in Spanish. English translations are optional (ADR-003).

**Full Fix (if needed later):**
- Backend: Add an admin-specific endpoint or flag that returns raw `LocalizedString` objects (`{ es: "...", en: "..." }`) instead of resolved strings
- Frontend: Pre-fill both `titleEs` and `titleEn` from the raw object

**When to prioritize:**
- When English translations become actively used
- When content editors report losing translations

---

### TD-006: Empty Description May Fail Backend Validation (Low Priority)

**Added:** 2026-02-17
**Location:** `frontend/components/admin/products/ProductForm.tsx` (submit handler)
**Severity:** Low

**Issue:**
The form sends `description: { es: "" }` when the description field is left empty. The backend validator may reject empty strings for `description.es` depending on its validation rules. Currently, description is not required on the frontend form.

**Current State:**
Works in practice because the backend accepts empty descriptions. If backend validation changes, this would break silently.

**Full Fix (if needed later):**
- Only include `description` in the payload if at least `es` is non-empty:
```typescript
...(formState.descriptionEs.trim() ? { description: { es: formState.descriptionEs.trim(), ... } } : {})
```

**When to prioritize:**
- If backend adds strict validation for description
- If users report errors when submitting without description

---

### TD-007: next/image Domain Restriction for Arbitrary URLs (Low Priority)

**Added:** 2026-02-17
**Location:** `frontend/next.config.ts` (remotePatterns), `frontend/components/admin/products/ProductImageManager.tsx`
**Severity:** Low

**Issue:**
`ProductImageManager` allows adding images by arbitrary URL, but `next/image` only allows domains configured in `remotePatterns` (currently only `res.cloudinary.com`). Images from other domains will fail to render with a Next.js error.

**Current State:**
In practice, all product images are uploaded via Cloudinary (B3.7), so URLs are always `res.cloudinary.com`. The URL input in the admin form is for MVP convenience, and admins know to use Cloudinary URLs.

**Full Fix (if needed later):**
- Option A: Use `<img>` instead of `next/image` in the admin image manager (loses optimization but allows any domain)
- Option B: Add a warning in the UI if the URL doesn't match configured domains
- Option C: Route image addition through the backend upload endpoint instead of direct URL input

**When to prioritize:**
- If admins need to add images from non-Cloudinary sources
- When moving beyond MVP

---

### TD-008: memeSourceUrl and memeIsOriginal Not Pre-filled in Edit Mode (Medium Priority)

**Added:** 2026-02-17
**Location:** `frontend/components/admin/products/ProductForm.tsx` (getInitialFormState)
**Severity:** Medium

**Issue:**
The `Product` API response schema does not include `memeSourceUrl` or `memeIsOriginal` fields — these exist only on `CreateProductRequest` and `UpdateProductRequest`. In edit mode, both fields initialize to `''` and `false` respectively. When the admin saves without re-entering the meme source URL, the update payload sends `memeSourceUrl: undefined` and `memeIsOriginal: undefined`, which may silently clear those values on the backend depending on PATCH semantics.

Additionally, `memeIsOriginal || undefined` evaluates to `undefined` when `false`, so `memeIsOriginal: false` can never be explicitly sent.

**Current State:**
Acceptable for MVP since meme metadata is supplementary. The backend uses PATCH semantics where `undefined` fields are not modified.

**Full Fix (if needed later):**
1. Add `memeSourceUrl` and `memeIsOriginal` to the `Product` response schema in `api-spec.yaml`
2. Pre-fill form state from `product.memeSourceUrl` and `product.memeIsOriginal` in edit mode
3. Always include `memeIsOriginal` in the update payload (not conditionally via `|| undefined`)

**When to prioritize:**
- When meme metadata becomes important for SEO or attribution
- When admins report losing meme source URLs after editing products

---

*Last updated: 2026-02-17*
