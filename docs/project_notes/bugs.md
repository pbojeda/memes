# Bug Log

This file logs bugs and their solutions for future reference. Keep entries brief and chronological.

## Format

Each bug entry should include:
- Date (YYYY-MM-DD)
- Brief description of the bug/issue
- Solution or fix applied
- Prevention notes (optional)

---

## Entries

<!-- Add bug entries below this line -->

### 2026-02-11 — Backend fails to start: `req.user` TS compilation error
- **Symptom**: `TSError: Property 'user' does not exist on type 'Request'` when running `npm run dev`
- **Cause**: `ts-node` doesn't load `.d.ts` files from `tsconfig.json` `include` by default. The `src/types/express.d.ts` augmentation was ignored.
- **Fix**: Add `"ts-node": { "files": true }` to `backend/tsconfig.json`
- **Prevention**: Always verify `npm run dev` starts cleanly after touching type augmentation files

### 2026-02-11 — Frontend registration/login fails with 404
- **Symptom**: Frontend API calls to `/api/v1/auth/*` return "Cannot POST"
- **Cause**: Backend routes were mounted at `/auth/*` without the `/api/v1` prefix that the frontend client expects
- **Fix**: Changed `app.use(routes)` to `app.use('/api/v1', routes)` in `backend/src/app.ts`
- **Prevention**: Ensure route prefix matches `API_BASE_URL` in frontend client

### 2026-02-11 — Frontend blocked by CORS
- **Symptom**: Browser blocks requests from `localhost:3001` to `localhost:3000`
- **Cause**: No CORS middleware configured on backend
- **Fix**: `npm install cors` + `app.use(cors())` in `app.ts`
- **Prevention**: CORS should be part of initial backend setup

### 2026-02-11 — Login fails: JWT_SECRET not configured
- **Symptom**: Login returns 500 with `JwtSecretNotConfiguredError`
- **Cause**: `.env` file only had `DATABASE_URL`, missing `JWT_SECRET` and other required vars
- **Fix**: Added `JWT_SECRET`, `NODE_ENV`, `PORT`, `FRONTEND_URL` to `.env`
- **Prevention**: Validate `.env` has all required vars on startup (env.ts does this, but JWT_SECRET is optional in dev)

### 2026-02-11 — Session lost on page navigation
- **Symptom**: User logged in but navigating to any route triggers redirect to `/login`
- **Cause**: Auth store `partialize` only persisted `accessToken` and `refreshToken`, not `user` or `isAuthenticated`. After rehydration, `isAuthenticated` was always `false`.
- **Fix**: Added `user` and `isAuthenticated` to `partialize` in `frontend/stores/authStore.ts`
- **Prevention**: When using Zustand `partialize`, ensure all fields needed for auth checks are included

### 2026-02-11 — ProductType name renders as `[object Object]`
- **Symptom**: React error "Objects are not valid as a React child (found: object with keys {es})"
- **Cause**: Backend returns `name` as `LocalizedString` JSON (`{es: "Camiseta"}`), but frontend renders `{pt.name}` expecting a string
- **Fix**: Created `getLocalizedName()` helper in `frontend/lib/utils.ts` and used it in all 4 components that render product type names
- **Prevention**: When i18n fields flow through the API, always use the helper to extract the display string

### 2026-02-17 — ProductType name renders as `[object Object]` in ProductForm (recurrence)
- **Symptom**: Same error as 2026-02-11 — "Objects are not valid as a React child" — but in the `ProductForm` Select dropdown (F3.9, written later)
- **Cause**: `{pt.name}` used directly instead of `{getLocalizedName(pt.name)}`. Test mocks used plain strings (`name: 'T-Shirts'`) instead of localized objects, which hid the bug.
- **Fix**: Applied `getLocalizedName(pt.name)` in `ProductForm.tsx`; updated test mocks to use `{es: 'Camisetas', en: 'T-Shirts'}` format
- **Prevention**: Test mocks for entities with localized fields must always use the `{es, en}` object format, never plain strings — otherwise the test passes but production breaks
