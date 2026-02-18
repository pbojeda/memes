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

### 2026-02-17 — "Slug is required" error when creating a product via admin form
- **Symptom**: Filling all fields in `/admin/products/new` and clicking Create returns 400: "Slug is required"
- **Cause**: Frontend `CreateProductRequest` never included a `slug` field. Backend `validateCreateProductInput` required it. No auto-generation logic existed.
- **Fix**: Made slug optional in validator; backend auto-generates from `title.es` via new `generateSlug()` utility; collision retry with `-1..-10` suffixes; truncation to 100 chars for auto-generated slugs
- **Prevention**: When adding required fields to the backend, verify the frontend form sends them. API-spec and frontend types must stay in sync.

### 2026-02-17 — [object Object] in title/description on product edit form (F3.15)
- **Symptom**: After creating a product and being redirected to the edit page, title and description fields display `[object Object]` instead of actual text
- **Cause**: Backend `getProductById` returns the raw Prisma model where `title`/`description` are JSONB `{es: "...", en: "..."}`. `getInitialFormState()` in `ProductForm.tsx` assigns `product.title ?? ''` directly to `titleEs`, treating the object as a string. The API spec types `Product.title` as `string` (for public localized responses), masking the type mismatch at compile time.
- **Fix**: Created `getLocalizedField()` utility in `lib/utils.ts` that extracts the `es` key from JSONB objects; applied in `getInitialFormState()` for title and description fields
- **Prevention**: Admin endpoints that return raw Prisma models with JSONB fields must have frontend handlers that parse the localized object. Test mocks must use `{es, en}` format.

### 2026-02-17 — "No file provided" error on image upload (F3.15)
- **Symptom**: Selecting a file and clicking "Upload File" in ProductImageManager fails with "No file provided"
- **Cause**: `client.ts` creates axios with default header `'Content-Type': 'application/json'`. When `uploadImage()` sends FormData, this default overrides axios auto-detection of `multipart/form-data` boundary. Multer receives the request as JSON, doesn't parse it, so `req.file` is `undefined`.
- **Fix**: Added axios request interceptor in `client.ts` that deletes `Content-Type` header when request data is `FormData`, allowing axios to auto-detect `multipart/form-data` with boundary
- **Prevention**: When an API client sets default `Content-Type`, ensure FormData requests override or remove the header so axios can auto-detect `multipart/form-data`.

### 2026-02-17 — Image manager not visible during product creation (F3.15)
- **Symptom**: On `/admin/products/new`, the "Upload File" and "Add Image" buttons don't appear. User expects to add images during product creation.
- **Cause**: `ProductForm.tsx` only renders `ProductImageManager` when `isEditMode && product?.id`. This is by design (images need a `productId`), but there is no UX guidance telling the user.
- **Fix**: Added informational Alert in create mode explaining "Images can be added after creating the product" with a link to edit page
- **Prevention**: When a feature is unavailable in a particular mode, show a clear message explaining why and when it becomes available.

### 2026-02-18 — Product type dropdown shows "Select a product type" on edit page (F3.16)
- **Symptom**: When editing a product, the product type dropdown doesn't show the current type — it shows the placeholder instead
- **Cause**: `getProductById()` in `productService.ts` called `prisma.product.findFirst({ where })` without `include: { productType: true }`. The `productType` relation was `undefined` in the response, so `ProductForm` couldn't match `product.productType?.id` to a dropdown option.
- **Fix**: Added `include: { productType: true }` to `getProductById()` and `getProductBySlug()`. Added `ProductWithType` return type.
- **Prevention**: When a Prisma query result is sent to the frontend and the frontend reads a relation field, the query must explicitly `include` that relation.

### 2026-02-18 — Image thumbnail missing in admin products list (F3.16)
- **Symptom**: Admin products table shows a grey placeholder instead of product thumbnails
- **Cause**: `listProducts()` in `productService.ts` called `prisma.product.findMany()` without including images. `product.primaryImage` was always `undefined` in the response.
- **Fix**: Added `include: { images: { where: { isPrimary: true }, take: 1 }, productType: true }` to `findMany()`. Map `images[0]` to `primaryImage` field via `ProductWithPrimaryImage` type.
- **Prevention**: When the frontend relies on a relation field (like `primaryImage`), the backend query must include it. Check the API spec and frontend rendering to verify which fields are consumed.

### 2026-02-18 — No success feedback after saving product edits (F3.16)
- **Symptom**: Clicking save on product edit page succeeds silently — no confirmation to the user
- **Cause**: `onSuccess` callback in edit page only called `setProduct()` to update local state, with no visual feedback
- **Fix**: Added `successMessage` state with `handleSuccess` callback that shows "Product updated successfully" Alert with 5s auto-dismiss via `setTimeout` + `useRef` cleanup
- **Prevention**: All mutating actions should provide visual feedback (success or error) to the user.

### 2026-02-18 — Button text "Save" instead of "Update" in product edit form (F3.16)
- **Symptom**: In edit mode, the submit button says "Save" / "Saving..." instead of "Update" / "Updating..."
- **Cause**: Button text ternary in `ProductForm.tsx` used "Save"/"Saving..." for edit mode
- **Fix**: Changed to "Update"/"Updating..." in edit mode, keeping "Create"/"Creating..." in create mode
- **Prevention**: Review button labels for contextual correctness when a form has multiple modes.
