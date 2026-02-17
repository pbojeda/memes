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

### Product Components (`frontend/components/product/`)
- `ProductCard` - Presentational card: image (next/image + placeholder), localized title, EUR price + compare-at strikethrough, Hot badge, star rating + review count, links to `/products/{slug}`
- `ProductGrid` - Responsive grid of ProductCards: 3 states (loading skeletons, empty with PackageOpen icon, populated). Props: `products`, `loading?`, `className?`, `skeletonCount?`, `columns?`. Default grid: 1→2→3→4 cols. Server Component.
- `ProductFilters` - Controlled client component (`'use client'`): search input, type Select, min/max price, sort Select, Hot checkbox, clear button. Props: `value: ProductFiltersValue`, `onFiltersChange`, `types?: ProductType[]`, `className?`. Emits `undefined` for cleared/default values (not empty strings). Uses sentinel `__all__` for "All types" in Radix Select (which doesn't allow empty string values).
- `ImageGallery` - Client component (`'use client'`): main image (next/image fill) + thumbnail strip + prev/next arrow buttons + keyboard nav (ArrowLeft/ArrowRight). Props: `images?: ProductImage[]`, `className?`. Sorts by `sortOrder` asc, `isPrimary` desc tiebreaker. Handles 0 images (ImageOff placeholder), 1 image (no nav controls). Uses `safeIndex` bounds checking for dynamic image array changes.
- `ReviewCard` - Presentational component: author name (bold), 5 star icons (filled/empty based on rating), comment text, relative date via `Intl.RelativeTimeFormat('en')`. Props: `review: Review`, `className?`. Handles undefined fields gracefully.
- `ReviewSummary` - Presentational component: large average rating number (`.toFixed(1)`), 5 stars (filled by `Math.round`), "Based on N review(s)" text, 5 distribution bars (5→1) with percentage widths. Props: `averageRating`, `totalReviews`, `ratingDistribution: Record<number, number>`, `className?`. Handles zero total (no division by zero) and missing keys (`?? 0`).
- `ReviewList` - Client component (`'use client'`): fetches reviews via `reviewService.list(productId, { page, limit: 5 })`, manages loading/error/empty/populated states. Composes ReviewSummary + ReviewCard list + Pagination. Props: `productId: string`, `className?`. Resets page to 1 on productId change.

### UI Primitives (`frontend/components/ui/`)
- `Button`, `Input`, `Label`, `Card`, `Alert`, `Badge`, `Checkbox`, `Dialog`, `DropdownMenu`, `Table`, `Select`, `Pagination` (shadcn/ui + Radix)
- `Pagination` - Reusable pagination: prev/next buttons, page numbers with ellipsis truncation (<=7 shows all, >7 shows first/last/current±1). Props: `currentPage`, `totalPages`, `onPageChange`, `className?`. Returns null when totalPages <= 1. Accessible: `<nav aria-label="Pagination">`, `aria-current="page"` on current.
- **Radix Select testing**: Radix portals don't work in JSDOM — mock `radix-ui` Select with native `<select>` elements in tests. See `ProductFilters.test.tsx` for the pattern.

### Validations (`frontend/lib/validations/auth.ts`)
- `validateEmail(email)` - Email format validation
- `validatePassword(password)` - Password policy check (12+ chars, uppercase, lowercase, number)
- `validatePasswordMatch(password, confirm)` - Confirm password match

### Pages (`frontend/app/`)
- `/products` - Catalog page (Client Component): assembles ProductFilters + ProductGrid + Pagination with bidirectional URL state sync. Reads/writes searchParams (search, typeSlug, minPrice, maxPrice, isHot, sort, page). Filter changes reset page to 1. Error state with retry. Suspense wrapper for useSearchParams.
- `/products/[slug]` - Product detail page (Client Component): composes ImageGallery + product info (title, description, price, sizes, color, Hot badge) + ReviewList. Fetches via `productService.getBySlug(slug)`. States: loading skeleton, error with retry, 404 (ApiException status check), populated. Uses `useParams` for slug extraction.

### Services (`frontend/lib/services/`)
- `authService` - login, register, logout, refresh, forgotPassword, resetPassword
- `productService` - `list(params?)` → `ProductListResponse` (data + meta with pagination). `getBySlug(slug)` → `ProductDetailResponse` (data: ProductDetail with images + reviews). Strips undefined params. Uses `NonNullable<operations['listProducts']['parameters']['query']>` for typed params.
- `reviewService` - `list(productId, params?)` → `ReviewListResponse` (data: Review[] + meta with pagination + averageRating + ratingDistribution). Strips undefined params. Same pattern as productService.

### Stores (`frontend/stores/`)
- `authStore` (Zustand) - user, tokens, isAuthenticated, loading, error states

## Backend Reusable Components

### Domain Entities (`backend/src/domain/entities/`)
- `User` - User entity with auth fields

### Domain Errors (`backend/src/domain/errors/`)
- `AuthError` - ValidationError, AuthenticationError, NotFoundError, ConflictError, ForbiddenError
- `ProductError` - ProductNotFoundError, InvalidProductDataError, ProductSlugAlreadyExistsError
- `ProductImageError` - ProductImageNotFoundError, InvalidProductImageDataError
- `ProductReviewError` - ProductReviewNotFoundError, InvalidProductReviewDataError
- `ProductTypeError` - ProductTypeNotFoundError, InvalidProductTypeDataError

### Services (`backend/src/application/services/`)
- `authService` - register, login, logout, refresh, password reset
- `tokenService` - JWT generation, verification, refresh token rotation
- `productService` - CRUD, listing with filters/pagination/sorting, soft delete/restore, slug-based detail
- `productImageService` - CRUD for product images, Cloudinary upload/delete
- `productReviewService` - CRUD, visibility toggle, analytics (averageRating, ratingDistribution)

### Validators (`backend/src/application/validators/`)
- `authValidator` - validateRegisterInput, validateLoginInput, validateRefreshInput, etc.
- `productValidator` - validateCreateProductInput, validateUpdateProductInput, validateListProductsInput
- `productImageValidator` - validateAddImageInput, validateUpdateImageInput
- `productReviewValidator` - validateCreateReviewInput, validateUpdateReviewInput, validateToggleVisibilityInput, validateListReviewsInput
- `shared` - validateUUID, validateSlug (reusable across validators)

### Controllers (`backend/src/presentation/controllers/`)
- `authController` - Auth endpoints
- `productController` - Product CRUD + listing + detail (slug/UUID) + activate/deactivate
- `productImageController` - Product image CRUD
- `productReviewController` - Review CRUD + visibility toggle
- `uploadController` - Cloudinary image upload

### Middleware (`backend/src/presentation/middleware/`)
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

### External Services
- **Cloudinary** - Image storage (free tier), credentials in `backend/.env`
  - Max file size: 5MB
  - Allowed types: image/jpeg, image/png, image/webp
  - Cleanup on delete: best-effort (log errors, no throw)

### Integration Tests (`backend/src/routes/*.integration.test.ts`)
- **Pattern**: supertest + jest mocks, one file per route group
- **Mock level**: Service layer (not Prisma) — controllers call services, so mock at that boundary
- **Auth helpers**: `setupAdminAuth()` and `setupRoleAuth(role)` per file (Jest mock scope is per-file)
- **Files**: authRoutes, productTypeRoutes (mock Prisma — legacy), productRoutes, productImageRoutes, uploadRoutes, reviewRoutes
- **Total**: 962 backend tests (as of B3.10)

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

