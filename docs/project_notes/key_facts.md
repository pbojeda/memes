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

### UI Primitives (`frontend/components/ui/`)
- `Button`, `Input`, `Label`, `Card`, `Alert`, `Badge` (shadcn/ui + Radix)

### Validations (`frontend/lib/validations/auth.ts`)
- `validateEmail(email)` - Email format validation
- `validatePassword(password)` - Password policy check (12+ chars, uppercase, lowercase, number)
- `validatePasswordMatch(password, confirm)` - Confirm password match

### Services (`frontend/lib/services/`)
- `authService` - login, register, logout, refresh, forgotPassword, resetPassword

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
- **Test fixtures**: Shared `createProduct()` and `createProducts()` factories in `frontend/components/product/testing/fixtures.ts`
- **Price formatting**: `Intl.NumberFormat('es-ES', { currency: 'EUR' })` — co-located in `ProductCard.tsx` as `formatPrice()`, extract to `lib/utils.ts` when reused

### Key Technical Constraints
- **Express 5 + path-to-regexp v8**: No inline regex in route params (see ADR-006)
- **Prisma**: No DB CHECK constraints — validation enforced at application layer
- **Roles for product management**: MANAGER and ADMIN only (not MARKETING)
- **UserRole enum**: `"TARGET" | "MANAGER" | "ADMIN" | "MARKETING"`

