# Key Facts

This file stores project configuration, constants, and frequently-needed **non-sensitive** information.

## ⚠️ Security Warning

**NEVER store passwords, API keys, or sensitive credentials in this file.** This file is committed to version control.

**❌ Never store:** Passwords, API keys, tokens, service account keys, private keys, secrets
**✅ Safe to store:** Hostnames, ports, project IDs, URLs, service account emails, environment names

---

## Project Information

- **Project Name**: MemeStore
- **Repository**: FiveGuays/memes

## API Configuration

- **OpenAPI Spec:** `ai-specs/specs/api-spec.yaml`
- **Frontend types:** `frontend/lib/api/types.ts` (auto-generated from OpenAPI)
- **Generate types:** `cd frontend && npm run generate:api`
- **Backend base URL:** http://localhost:3000/api

## Local Development

| Service | Command | Port |
|---------|---------|------|
| Backend | `cd backend && npm run dev` | 3000 |
| Frontend | `cd frontend && npm run dev` | 3001 |

## Frontend Reusable Components

### Auth Components (`frontend/components/auth/`)
- `RegisterForm` - Registration form with password strength indicator
- `LoginForm` - Login form with role-based redirect (TARGET→/, others→/dashboard)
- `PasswordStrength` - Visual password requirements checklist
- `UserMenu` - Auth-aware dropdown: Login/Register links (unauth) or user initial + email + role badge + logout (auth)
- `ProtectedRoute` - Route guard with role-based access and returnTo redirect

### Admin Product Components (`frontend/components/admin/products/`)
- `ProductForm` - Shared form for create/edit products. Props: `product?: Product`, `initialImages?: ProductImage[]`, `onSuccess?: (product: Product) => void`. Flat form state (titleEs/En, descriptionEs/En, productTypeId, price, compareAtPrice, color, availableSizes, isActive, isHot, memeSourceUrl, memeIsOriginal, priceChangeReason). Self-contained product type loading. Validation: titleEs required, productTypeId required, price required/>=0/NaN check. `isActive` disabled in edit mode (managed via activate/deactivate endpoints). `priceChangeReason` shown only when price changed (tracked via `useRef`). Renders `ProductImageManager` in edit mode only.
- `ProductImageManager` - Controlled component for image CRUD. Props: `productId: string`, `images: ProductImage[]`, `onImagesChange`. Add image by URL (with protocol validation), delete, set primary. `actionLoadingId` pattern. Auto-sets first image as primary (`isPrimary: images.length === 0`). Sorts by `sortOrder` ascending.

### Product Components (`frontend/components/product/`)
- `ProductCard` - Presentational card: image (next/image + placeholder), localized title, EUR price + compare-at strikethrough, Hot badge, star rating + review count, links to `/products/{slug}`
- `ProductGrid` - Responsive grid of ProductCards: 3 states (loading skeletons, empty with PackageOpen icon, populated). Props: `products`, `loading?`, `className?`, `skeletonCount?`, `columns?`. Default grid: 1→2→3→4 cols. Server Component.
- `ProductFilters` - Controlled client component (`'use client'`): search input, type Select, min/max price, sort Select, Hot checkbox, clear button. Props: `value: ProductFiltersValue`, `onFiltersChange`, `types?: ProductType[]`, `className?`. Emits `undefined` for cleared/default values (not empty strings). Uses sentinel `__all__` for "All types" in Radix Select (which doesn't allow empty string values).
- `ImageGallery` - Client component (`'use client'`): main image (next/image fill) + thumbnail strip + prev/next arrow buttons + keyboard nav (ArrowLeft/ArrowRight). Props: `images?: ProductImage[]`, `className?`. Sorts by `sortOrder` asc, `isPrimary` desc tiebreaker. Handles 0 images (ImageOff placeholder), 1 image (no nav controls). Uses `safeIndex` bounds checking for dynamic image array changes.
- `ReviewCard` - Presentational component: author name (bold), 5 star icons (filled/empty based on rating), comment text, relative date via `Intl.RelativeTimeFormat('en')`. Props: `review: Review`, `className?`. Handles undefined fields gracefully.
- `ReviewSummary` - Presentational component: large average rating number (`.toFixed(1)`), 5 stars (filled by `Math.round`), "Based on N review(s)" text, 5 distribution bars (5→1) with percentage widths. Props: `averageRating`, `totalReviews`, `ratingDistribution: Record<number, number>`, `className?`. Handles zero total (no division by zero) and missing keys (`?? 0`).
- `ReviewList` - Client component (`'use client'`): fetches reviews via `reviewService.list(productId, { page, limit: 5 })`, manages loading/error/empty/populated states. Composes ReviewSummary + ReviewCard list + Pagination. Props: `productId: string`, `className?`. Resets page to 1 on productId change.

### UI Primitives (`frontend/components/ui/`)
- `Button`, `Input`, `Label`, `Card`, `Alert`, `Badge`, `Checkbox`, `Dialog`, `Sheet`, `DropdownMenu`, `Table`, `Select`, `Pagination` (shadcn/ui + Radix)
- `Pagination` - Reusable pagination: prev/next buttons, page numbers with ellipsis truncation (<=7 shows all, >7 shows first/last/current±1). Props: `currentPage`, `totalPages`, `onPageChange`, `className?`. Returns null when totalPages <= 1. Accessible: `<nav aria-label="Pagination">`, `aria-current="page"` on current.
- **Radix Select testing**: Radix portals don't work in JSDOM — mock `radix-ui` Select with native `<select>` elements in tests. See `ProductFilters.test.tsx` for the pattern.

### Address Components (`frontend/components/address/`)
- `AddressForm` - Reusable create/edit form. Props: `initialData?: Address` (edit mode), `onSuccess: (address: Address) => void`, `onCancel?: () => void`. 10 fields with blur-triggered validation, auto-uppercase countryCode (2-char ISO), isDefault checkbox, API error handling (409 ADDRESS_LIMIT_EXCEEDED). Uses `addressService` for CRUD. Mirrors RegisterForm pattern.

### Promo Code Components (`frontend/components/promo-code/`)
- `PromoCodeInput` - Self-contained promo code validation component. Props: `orderTotal?: number`, `onApply?: (result: PromoCodeResult) => void`, `onRemove?: () => void`. 5 states: idle (empty input, Apply disabled), input (Apply enabled), loading (Applying..., disabled), applied (success card with Badge code + discount details + Remove button), error (Alert with message, input remains editable). Auto-uppercases input. Uses `promoCodeService.validate()`. Error handling: backend message for `valid=false`, "Invalid promo code..." for ApiException, "Could not apply..." for generic errors. Clears error on input change. Uses `formatPrice()` for currency display.
- **Test fixtures**: `createValidPromoResult`, `createInvalidPromoResult` in `components/promo-code/testing/fixtures.ts`

### Validations (`frontend/lib/validations/auth.ts`)
- `validateEmail(email)` - Email format validation
- `validatePassword(password)` - Password policy check (12+ chars, uppercase, lowercase, number)
- `validatePasswordMatch(password, confirm)` - Confirm password match

### Validations (`frontend/lib/validations/address.ts`)
- 10 individual validators: `validateFirstName`, `validateLastName`, `validateStreetLine1`, `validateStreetLine2`, `validateCity`, `validateState`, `validatePostalCode`, `validateCountryCode`, `validatePhone`, `validateLabel`
- `validateAddressForm(fields)` - Runs all validators, returns `{ isValid, errors }`
- `ADDRESS_FIELD_LIMITS` - Constants matching backend limits
- Pattern: `{ isValid: boolean; error?: string }` return type, trim before validate

### Pages (`frontend/app/`)
- `/products` - Catalog page (Client Component): assembles ProductFilters + ProductGrid + Pagination with bidirectional URL state sync. Reads/writes searchParams (search, typeSlug, minPrice, maxPrice, isHot, sort, page). Filter changes reset page to 1. Error state with retry. Suspense wrapper for useSearchParams.
- `/products/[slug]` - Product detail page (Client Component): composes ImageGallery + product info (title, description, price, sizes, color, Hot badge) + ReviewList. Fetches via `productService.getBySlug(slug)`. States: loading skeleton, error with retry, 404 (ApiException status check), populated. Uses `useParams` for slug extraction.
- `/cart` - Cart page (Server Component wrapper + `CartPageContent` client component): full-page cart view with responsive two-column layout. Server component exports `metadata: { title: 'Cart | MemeStore' }`. First page to use the server-component-with-metadata + client-content-component split pattern.
- `/admin` - Admin layout with `ProtectedRoute allowedRoles={['ADMIN']}` + `AdminSidebar`. All admin sub-pages inherit this auth guard.
- `/admin/product-types` - Product types CRUD page (Client Component): ProductTypesTable + create/edit/delete dialogs. Uses `productTypeService`.
- `/admin/products` - Admin products list page (Client Component): AdminProductsTable with search (debounced 300ms), status filter (All/Active/Inactive via `isActive` param), pagination (limit: 20), and action buttons (Edit link, Activate/Deactivate toggle, Delete with confirmation dialog). Uses `adminProductService`. `actionLoadingId` pattern disables row buttons during async actions.
- `/admin/products/new` - Create product page (Client Component): thin wrapper rendering `ProductForm` in create mode. On success, redirects to `/admin/products/{id}/edit` for image management.
- `/admin/products/[productId]/edit` - Edit product page (Client Component): fetches product + images via `Promise.all([getById, listImages])`, renders `ProductForm` in edit mode with `ProductImageManager`. Loading/error/retry states. `handleSuccess` callback updates product state + shows "Product updated successfully" Alert with 5s auto-dismiss.

### Services (`frontend/lib/services/`)
- `authService` - login, register, logout, refresh, forgotPassword, resetPassword
- `productService` - Public product access. `list(params?)` → `ProductListResponse` (data + meta with pagination). `getBySlug(slug)` → `ProductDetailResponse` (data: ProductDetail with images + reviews). Strips undefined params. Uses `NonNullable<operations['listProducts']['parameters']['query']>` for typed params.
- `adminProductService` - Admin product management. `list(params?)` → `ProductListResponse`. `getById(productId)` → `Product`. `create(data: CreateProductRequest)` → `Product`. `update(productId, data: UpdateProductRequest)` → `Product`. `activate(productId)` → `Product`. `deactivate(productId)` → `Product`. `delete(productId)` → `void`. `listImages(productId)` → `ProductImage[]`. `addImage(productId, data)` → `ProductImage`. `updateImage(productId, imageId, data)` → `ProductImage`. `deleteImage(productId, imageId)` → `void`. Separate from `productService` — admin-only operations.
- `reviewService` - `list(productId, params?)` → `ReviewListResponse` (data: Review[] + meta with pagination + averageRating + ratingDistribution). Strips undefined params. Same pattern as productService.
- `addressService` - User address CRUD (auth required). `list()` → `Address[]`. `create(data: CreateAddressRequest)` → `Address`. `update(addressId, data: UpdateAddressRequest)` → `Address`. `delete(addressId)` → `void`. Base path: `/users/me/addresses`.
- `promoCodeService` - Promo code validation (public, no auth). `validate(code, orderTotal?)` → `PromoCodeValidationData`. Calls `POST /promo-codes/validate`. Returns result for both valid and invalid codes without throwing. Exports `PromoCodeValidationData` type (single source of truth). Only throws `ApiException` for HTTP 400.

### Cart Components (`frontend/components/cart/`)
- `CartItem` - Presentational component: product image (80x80 next/image + ImageOff fallback), title link to `/products/{slug}`, size label (conditional), formatted unit price + line total via `formatPrice()`, quantity stepper (+/- buttons, bounds 1–99), remove button. Props: `item: CartItemLocal`, `onUpdateQuantity(productId, size, newQty)`, `onRemove(productId, size)`, `className?`. No store coupling — parent wires callbacks to cartStore. Uses `type="button"` on all buttons, `role="group"` on quantity stepper.
- `CartDrawer` - Slide-out side panel for quick cart access. `'use client'`, no props — reads from cartStore. Trigger button: ShoppingCart icon + badge (itemCount, capped at "99+"). Sheet content: SheetTitle "Shopping Cart", scrollable CartItem list (or "Your cart is empty"), subtotal bar with `formatPrice()`, "View Cart" link to `/cart`, "Continue Shopping" close button. Hydrates store on mount via `useCartStore.persist.rehydrate()`. Key: `${productId}-${size ?? 'no-size'}`.
- `CartPageContent` - Full-page cart view at `/cart`. `'use client'`, no props — reads from cartStore. Responsive `lg:grid-cols-3` layout: items column (col-span-2, `<ul>` of CartItem) + sticky order summary Card (col-span-1, item count, subtotal, "Proceed to Checkout" link to `/checkout`, "Continue Shopping" link to `/products`). Empty state: ShoppingBag icon + "Your cart is empty" + Continue Shopping link. Hydrates store on mount. `aria-labelledby` on `<main>`, `aria-label` on items list.
- **Test fixtures**: `createCartItem` in `components/cart/testing/fixtures.ts` — centralized factory for CartItem, CartDrawer, and CartPageContent tests.

### Stores (`frontend/stores/`)
- `authStore` (Zustand) - user, tokens, isAuthenticated, loading, error states
- `cartStore` (Zustand) - client-side cart with localStorage persistence. `CartItemLocal` items identified by productId+size. Actions: addItem (upsert, qty capped at 99), removeItem, updateQuantity (removes if <=0), clearCart. Computed: itemCount, subtotal (rounded 2dp). Persist config: partialize (items only), skipHydration: true, onRehydrateStorage recomputes derived. Storage key: `cart-storage`. Exports: `CartItemLocal`, `CartState`, `CartActions`, `CartStore`, `MAX_ITEM_QUANTITY`

## Backend Reusable Components

### Domain Entities (`backend/src/domain/entities/`)
- `User` - User entity with auth fields

### Domain Errors (`backend/src/domain/errors/`)
- `AuthError` - ValidationError, AuthenticationError, NotFoundError, ConflictError, ForbiddenError
- `ProductError` - ProductNotFoundError, InvalidProductDataError, ProductSlugAlreadyExistsError
- `ProductImageError` - ProductImageNotFoundError, InvalidProductImageDataError
- `ProductReviewError` - ProductReviewNotFoundError, InvalidProductReviewDataError
- `ProductTypeError` - ProductTypeNotFoundError, InvalidProductTypeDataError
- `AddressError` - AddressNotFoundError, AddressLimitExceededError, InvalidAddressDataError, DefaultAddressCannotBeDeletedError
- `CartError` - InvalidCartDataError
- `PromoCodeError` - InvalidPromoCodeDataError, PromoCodeNotFoundError, PromoCodeExpiredError, PromoCodeInactiveError, PromoCodeUsageLimitError, MinOrderAmountNotMetError, PromoCodeNotYetValidError
- `OrderTotalError` - InvalidOrderTotalDataError

### Services (`backend/src/application/services/`)
- `authService` - register, login, logout, refresh, password reset
- `tokenService` - JWT generation, verification, refresh token rotation
- `productService` - CRUD, listing with filters/pagination/sorting, soft delete/restore, slug-based detail. `createProduct` auto-generates slug from `title.es` via `generateSlug()` when not provided; retries with `-1..-10` suffix on collision (P2002 scoped to `slug` field); auto-generated slugs truncated to 97 chars (MAX_SLUG_LENGTH=100 minus suffix room). Exports `ProductWithType = Product & { productType: ProductType }` (returned by `getProductById`, `getProductBySlug`) and `ProductWithPrimaryImage = Product & { primaryImage?: ProductImage }` (returned by `listProducts` in `ListProductsResult.data`). `listProducts` includes `{ images: { isPrimary: true, take: 1 }, productType: true }` in query.
- `productImageService` - CRUD for product images, Cloudinary upload/delete
- `productReviewService` - CRUD, visibility toggle, analytics (averageRating, ratingDistribution)
- `addressService` - CRUD for user addresses. Max 10 per user. Atomic default-swap via `$transaction`. Auto-defaults first address. `findFirst({ id, userId })` scoping prevents IDOR. See ADR-009 for "zero default addresses" known limitation.
- `cartService` - `validateCart(input)` — validates client-side cart items against DB. Batch loads products via `findMany({ id: { in: ids } })`. Returns `{ valid, items, summary, errors }`. Per-item error codes: PRODUCT_NOT_FOUND, PRODUCT_INACTIVE, SIZE_REQUIRED, SIZE_NOT_ALLOWED, INVALID_SIZE. Returns structured result (never throws for business failures). See ADR-010.
- `promoCodeService` - `validatePromoCode(input)` — validates promo code and calculates discount. Lookup via `findUnique({ code })`. 6 validation rules (exists, active, date range, usage limit, min order amount). PERCENTAGE: capped by maxDiscountAmount and orderTotal. FIXED_AMOUNT: capped at orderTotal. Returns structured result (never throws for business failures). `maxUsesPerUser` deferred to order placement (ADR-011). See ADR-010.
- `orderTotalService` - `calculateOrderTotal(input)` — orchestrates `validateCart` + `validatePromoCode`. Returns `OrderTotalResult` with full financial breakdown (subtotal, discountAmount, shippingCost, taxAmount, total, currency, itemCount, validatedItems, appliedPromoCode, cartErrors). Never throws for business failures. Invalid promo code returns `valid: true` with `appliedPromoCode: null` and `promoCodeMessage`. MVP: shippingCost=0, taxAmount=0, currency='MXN'.

### Validators (`backend/src/application/validators/`)
- `authValidator` - validateRegisterInput, validateLoginInput, validateRefreshInput, etc.
- `productValidator` - validateCreateProductInput, validateUpdateProductInput, validateListProductsInput
- `productImageValidator` - validateAddImageInput, validateUpdateImageInput
- `productReviewValidator` - validateCreateReviewInput, validateUpdateReviewInput, validateToggleVisibilityInput, validateListReviewsInput
- `shared` - validateUUID, validateSlug (reusable across validators)
- `addressValidator` - validateCreateAddressInput, validateUpdateAddressInput, validateAddressId (plain TS, no Zod — matches existing pattern)
- `cartValidator` - validateCartInput — validates cart items array (max 50 items, valid UUIDs, quantity 1-99, optional size max 20 chars)
- `promoCodeValidator` - validatePromoCodeInput — trims + uppercases code (max 50 chars), validates optional orderTotal >= 0
- `orderTotalValidator` - validateOrderTotalInput — validates items array (same rules as cartValidator: max 50, UUID, quantity 1-99, optional size max 20 chars) + optional promoCode string (max 50 chars, trimmed and uppercased)

### Utilities (`backend/src/utils/`)
- `slugify` - `generateSlug(text: string): string` — NFD normalization, accent stripping, lowercase, non-alphanumeric→hyphen, collapse consecutive hyphens, strip leading/trailing hyphens. Falls back to `'product'` on empty result. Output satisfies `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`.
- `responseHelpers` - `success()`, `created()`, `noContent()`, pagination meta builder

### Controllers (`backend/src/presentation/controllers/`)
- `authController` - Auth endpoints
- `productController` - Product CRUD + listing + detail (slug/UUID) + activate/deactivate
- `productImageController` - Product image CRUD
- `productReviewController` - Review CRUD + visibility toggle
- `uploadController` - Cloudinary image upload
- `addressController` - Address CRUD, error mapping (400/404/409)
- `cartController` - Cart validation handler, maps InvalidCartDataError → 400
- `promoCodeController` - Promo code validation handler, maps InvalidPromoCodeDataError → 400
- `orderTotalController` - Order total calculation handler, maps InvalidOrderTotalDataError → 400

### Middleware (`backend/src/middleware/`)
- `authMiddleware` - JWT verification, request user injection
- `optionalAuthMiddleware` - JWT verification without requiring auth (for public + admin endpoints)
- `requireRole` - Role-based access control

### Routes (`backend/src/routes/`)
- `/auth` - Auth routes
- `/products` - Product routes (includes nested `/products/:productId/images` and `/products/:productId/reviews`)
- `/reviews` - Review-specific routes (`/:reviewId`, `/:reviewId/visibility`)
- `/product-types` - Product type CRUD
- `/upload` - File upload
- `/health` - Health check
- `/users/me/addresses` - Address CRUD (all routes require `authMiddleware`, no role restriction)
- `/cart` - Cart validation (`POST /validate`, public — no auth) + Order total calculation (`POST /calculate`, public — no auth)
- `/promo-codes` - Promo code validation (`POST /validate`, public — no auth)

### External Services
- **Cloudinary** - Image storage (free tier), credentials in `backend/.env`
  - Max file size: 5MB
  - Allowed types: image/jpeg, image/png, image/webp
  - Cleanup on delete: best-effort (log errors, no throw)

### Integration Tests (`backend/src/routes/*.integration.test.ts`)
- **Pattern**: supertest + jest mocks, one file per route group
- **Mock level**: Service layer (not Prisma) — controllers call services, so mock at that boundary
- **Auth helpers**: `setupAdminAuth()` and `setupRoleAuth(role)` per file (Jest mock scope is per-file)
- **Files**: authRoutes, productTypeRoutes (mock Prisma — legacy), productRoutes, productImageRoutes, uploadRoutes, reviewRoutes, addressRoutes (mock Prisma), cartRoutes (mock Prisma), promoCodeRoutes (mock Prisma), orderTotalRoutes (mock Prisma), checkoutFlow (mock Prisma — cross-module flow tests)
- **Total**: ~1331 backend tests (as of B4.6; +8 from B4.6)

### Frontend Image Config
- **next/image** configured for Cloudinary: `remotePatterns` in `frontend/next.config.ts` allows `https://res.cloudinary.com/**`
- **Test mock**: Mock `next/image` filtering out `fill`/`sizes` props; mock `lucide-react` icons as simple SVGs with `data-testid`
- **Test fixtures**: Shared factories in `frontend/components/product/testing/fixtures.ts`: `createProduct()`, `createProducts()`, `createProductImage()`, `createProductImages()`, `createReview()`, `createReviews()`, `createReviewListResponse()`
- **Price formatting**: `formatPrice()` in `lib/utils.ts` — `Intl.NumberFormat('es-ES', { currency: 'EUR' })`. Used by ProductCard and product detail page.

### Key Technical Constraints
- **Express 5 + path-to-regexp v8**: No inline regex in route params (see ADR-006)
- **Prisma**: No DB CHECK constraints — validation enforced at application layer
- **Roles for product management**: MANAGER and ADMIN only (not MARKETING)
- **UserRole enum**: `"TARGET" | "MANAGER" | "ADMIN" | "MARKETING"`
- **DiscountType enum**: `"PERCENTAGE" | "FIXED_AMOUNT"` — used by PromoCode model

