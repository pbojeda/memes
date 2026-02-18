# Sprint 3: Products CRUD

**Goal:** Implement full product management (catalog, detail, admin CRUD, images, reviews).
**Start Date:** 2026-02-11
**End Date:** 2026-02-17
**Status:** In Progress (post-release bug fixes)

---

## Progress Overview

```
Progress: [█████████████████████████] 100%

Completed: 26/26 tasks
In Progress: 0 tasks
Pending: 0 tasks
Deferred: 0 tasks
Blocked: 0 tasks
```

---

## Active Task

| Field | Value |
|-------|-------|
| Task | — (Sprint 3 complete) |
| Branch | — |
| Step | — |
| Ticket | — |

---

## Backend Tasks

| ID | Task | Priority | Status | Branch | Notes |
|----|------|----------|--------|--------|-------|
| B3.1 | Create Product, ProductImage, ProductReview models | High | ✅ | feature/sprint3-B3.1-product-models | Completed 2026-02-11 |
| B3.2 | Create PriceHistory model | Medium | ✅ | feature/sprint3-B3.2-price-history-model | Completed 2026-02-11 |
| B3.3 | Implement product service (CRUD) | High | ✅ | feature/sprint3-B3.3-product-service | Completed 2026-02-12 |
| B3.4 | Implement product listing with filters | High | ✅ | feature/sprint3-B3.4-product-listing-filters | Completed 2026-02-12 |
| B3.5 | Implement product detail endpoint | High | ✅ | feature/sprint3-B3.5-product-detail-endpoint | Completed 2026-02-12 |
| B3.6 | Implement soft delete for products | Medium | ✅ | feature/sprint3-B3.6-soft-delete-endpoints | Completed 2026-02-12 |
| B3.7 | Implement product image upload | High | ✅ | feature/sprint3-B3.7-product-image-upload | Completed 2026-02-13 |
| B3.8 | Implement product review management | Medium | ✅ | feature/sprint3-B3.8-product-review-management | Completed 2026-02-13 |
| B3.9 | Create admin product endpoints | High | ✅ | feature/sprint3-B3.9-admin-product-endpoints | Completed 2026-02-13 |
| B3.10 | Write product integration tests | High | ✅ | feature/sprint3-B3.10-product-integration-tests | Completed 2026-02-16 |

---

## Frontend Tasks

| ID | Task | Priority | Status | Branch | Notes |
|----|------|----------|--------|--------|-------|
| F3.1 | Create product catalog page | High | ✅ | feature/sprint3-F3.1-catalog-page | Completed 2026-02-16 |
| F3.2 | Implement ProductCard component | High | ✅ | feature/sprint3-F3.2-product-card | Completed 2026-02-16 |
| F3.3 | Implement ProductGrid component | High | ✅ | feature/sprint3-F3.3-product-grid | Completed 2026-02-16 |
| F3.4 | Implement ProductFilters component | High | ✅ | feature/sprint3-F3.4-product-filters | Completed 2026-02-16 |
| F3.5 | Create product detail page | High | ✅ | feature/sprint3-F3.5-product-detail-page | Completed 2026-02-17 |
| F3.6 | Implement image gallery component | Medium | ✅ | feature/sprint3-F3.6-image-gallery | Completed 2026-02-16 |
| F3.7 | Implement reviews display | Medium | ✅ | feature/sprint3-F3.7-reviews-display | Completed 2026-02-16 |
| F3.8 | Create admin products list page | High | ✅ | feature/sprint3-F3.8-admin-products-list | Completed 2026-02-17 |
| F3.9 | Create admin product form (create/edit) | High | ✅ | feature/sprint3-F3.9-admin-product-form | Completed 2026-02-17 |
| F3.10 | Write product component tests | High | ✅ | — | TDD throughout F3.1–F3.9; all 26 source files covered (414 tests). Completed 2026-02-17 |
| F3.11 | Fix: Add "New Product" button to admin products list | High | ✅ | feature/sprint3-F3.11-new-product-button | Completed 2026-02-17 |
| F3.12 | Fix: Localized name object rendered as React child in ProductForm | High | ✅ | feature/sprint3-F3.12-fix-localized-name-productform | Completed 2026-02-17 |
| F3.13 | Fix: Backend auto-generate slug from title.es when not provided | High | ✅ | feature/sprint3-F3.13-auto-generate-slug | Completed 2026-02-17 |
| F3.14 | Fix: Add file upload support to ProductImageManager | High | ✅ | feature/sprint3-F3.14-file-upload-image-manager | Completed 2026-02-17 |
| F3.15 | Fix: Admin product form bugs (object Object, upload, UX) | High | ✅ | feature/sprint3-F3.15-admin-form-bugs | Completed 2026-02-17 |
| F3.16 | Fix: Edit page product type, list thumbnails, save feedback, button text | High | ✅ | feature/sprint3-F3.16-edit-bugs-thumbnails-feedback | Completed 2026-02-18 |

---

## Status Legend

| Icon | Status |
|------|--------|
| ⏳ | Pending |
| 🔄 | In Progress |
| ✅ | Completed |
| 🚫 | Blocked |
| 🔜 | Deferred |

---

## Task Dependencies

```
Backend:
B3.1 ──► B3.3 ──► B3.4
    │        │
    │        └──► B3.5
    │        │
    │        └──► B3.6
    │        │
    │        └──► B3.9 ──► B3.10
    │
    ├──► B3.2
    ├──► B3.7
    └──► B3.8

Frontend:
F3.2 ──► F3.3 ──► F3.1
F3.4 ──► F3.1
F3.6 ──► F3.5
F3.7 ──► F3.5
F3.8 ──► F3.9
F3.10 (TDD throughout F3.1–F3.9)
```

---

## Blockers

| Task | Blocked By | Resolution |
|------|------------|------------|
| - | - | - |

---

## Decisions Made This Sprint

| ADR | Title | Date |
|-----|-------|------|
| ADR-008 | Auto-generate product slug from title.es on backend | 2026-02-17 |

---

## Bugs Found & Fixed

| Date | Bug | Solution |
|------|-----|----------|
| 2026-02-17 | F3.11 — Missing "New Product" button on admin products list | Added Button + Link to `/admin/products/new` |
| 2026-02-17 | F3.12 — `pt.name` (localized object) rendered directly in ProductForm Select | Applied `getLocalizedName(pt.name)`, fixed test mocks to use `{es, en}` format |
| 2026-02-17 | F3.13 — "Slug is required" error on product creation | Auto-generate slug from `title.es` via `generateSlug()`, collision retry with suffixes, slug made optional in validator |
| 2026-02-17 | F3.14 — ProductImageManager only supports URL input, no file upload | Added uploadImage service + Upload File button + client-side MIME/size validation |
| 2026-02-18 | F3.16 — Product type lost on edit, thumbnails missing, no save feedback, wrong button text | Prisma includes (productType, primaryImage mapping), success Alert with 5s auto-dismiss, button "Update"/"Updating..." |

---

## Deliverables Checklist

From PLAN_DESARROLLO.md:

- [x] Product catalog with pagination
- [x] Product filtering and sorting
- [x] Product detail page with images and reviews
- [x] Admin product management CRUD

---

## Sprint Notes

_Key learnings, issues, or observations:_

- ADR-002: ProductType → Product relation deferred from Sprint 2, must be added in B3.1
- ADR-003: Localized fields (title, description) use JSON `{es: "...", en: "..."}` — frontend uses `es` key for MVP
- Product model has 20+ fields including Printful refs, meme metadata, and counters (see data-model.md §3.4)
- Future optimization: Consider adding DB index on `products.deleted_at` for soft-delete query performance (from B3.3 code review)
- Future improvement: Store Cloudinary `publicId` as a separate column in `product_images` instead of extracting it from URL on delete (from B3.7 code review)
- B3.10 should include integration tests for upload and product image endpoints (from B3.7 code review)
- `path-to-regexp` v8 (Express 5) does not support inline regex in route params — UUID vs slug distinction handled in handler via regex detection (from B3.9)
- B3.10 should also include integration tests for review endpoints (from B3.8 code review)
- Review analytics (averageRating, ratingDistribution) computed from ALL reviews (visible + hidden) for accurate product metrics (B3.8 design decision)

---

## Completion Log

| Date | Task | Commit | Notes |
|------|------|--------|-------|
| 2026-02-11 | B3.1 | 50dbcd0 | Product, ProductImage, ProductReview models + migration + domain errors (13 tests), 416 total, PR #46 |
| 2026-02-11 | B3.2 | 9ac72d1 | PriceHistory model + migration + domain errors (4 tests), 420 total, PR #47 |
| 2026-02-12 | B3.3 | a6d9a7c | Product service CRUD + validators + shared utils (103 new tests), 523 total, PR #48 |
| 2026-02-12 | B3.4 | 4f224f2 | Product listing with filters, pagination, sorting (77 new tests), 600 total, PR #49 |
| 2026-02-12 | B3.5 | 8dbd558 | Product detail endpoint with images/reviews + viewCount fire-and-forget (11 new tests), 611 total, PR #50 |
| 2026-02-12 | B3.6 | a10bc4a | Soft delete + restore endpoints with auth/role middleware (8 new tests), 619 total, PR #51 |
| 2026-02-13 | B3.7 | d61f742 | Product image upload with Cloudinary + CRUD endpoints + multer + validators (106 new tests), 725 total, PR #52 |
| 2026-02-13 | B3.9 | 53d90bd | Admin product endpoints (create, update, list, getById, activate, deactivate) + 409 error mapping (35 new tests), 760 total, PR #53 |
| 2026-02-13 | B3.8 | 3e386c3 | Product review CRUD + visibility toggle + analytics (avgRating, distribution), rating 1-5 at validator level (80 new tests), 840 total, PR #54 |
| 2026-02-16 | B3.10 | b93bf35 | Integration tests for product, image, upload, review routes (122 new tests), 962 total, PR #55. Also documented GET /products/{productId} in api-spec |
| 2026-02-16 | F3.2 | a0c30da | ProductCard component with image, title, EUR price, Hot badge, star rating, link (17 new tests), 254 frontend total, PR #56 |
| 2026-02-16 | F3.3 | 36a5ca8 | ProductGrid component with loading skeletons, empty state icon, responsive grid, shared test fixtures (17 new tests), 271 frontend total, PR #57 |
| 2026-02-16 | F3.4 | 092ca2c | ProductFilters controlled component (search, type select, price range, sort, hot toggle, clear) + Select UI primitive (33 new tests), 304 frontend total, PR #58 |
| 2026-02-16 | F3.1 | 931fb7a | Catalog page (/products) with URL-synced filters + pagination + productService + Pagination UI component (41 new tests), 345 frontend total, PR #59 |
| 2026-02-16 | F3.6 | 1873b1f | ImageGallery component with main view, thumbnails, prev/next arrows, keyboard nav, sortOrder sorting, safeIndex bounds checking (27 new tests), 372 frontend total, PR #60 |
| 2026-02-16 | F3.7 | d0bbfd3 | ReviewCard + ReviewSummary + ReviewList components, reviewService, review test fixtures (35 new tests), 407 frontend total, PR #61 |
| 2026-02-17 | F3.5 | 19fb010 | Product detail page (/products/[slug]) composing ImageGallery + ReviewList + product info, productService.getBySlug, formatPrice extracted to utils (37 new tests), 439 frontend total, PR #62 |
| 2026-02-17 | F3.8 | f0f1066 | Admin products list page (/admin/products) with AdminProductsTable, DeleteProductDialog, adminProductService (list/activate/deactivate/delete), search + status filter + pagination, sidebar nav update, api-spec isActive param (90 new tests), 529 frontend total, PR #63 |
| 2026-02-17 | F3.9 | 15e9fff | Admin product form (create/edit) with ProductForm, ProductImageManager, new/edit pages, adminProductService extended with 7 new methods (getById, create, update, listImages, addImage, updateImage, deleteImage), TD-005/6/7/8 documented (51 new tests), 580 frontend total, PR #64 |
| 2026-02-17 | F3.10 | — | No additional code needed — TDD throughout F3.1–F3.9 achieved full coverage: 26 source files, 25 test suites, 414 product tests, 580 frontend total |
| 2026-02-17 | F3.11 | 8eb1313 | Add "New Product" button to admin products list page (2 new tests), 582 frontend total, PR #65 |
| 2026-02-17 | F3.12 | 198f114 | Fix localized name in ProductForm Select via getLocalizedName(), fix test mocks to use {es,en} objects (1 new test), 583 frontend total, PR #66 |
| 2026-02-17 | F3.13 | 449b216 | Auto-generate product slug from title.es with collision retry, new slugify utility, slug optional in validator/api-spec (15 new backend tests), 978 backend total, PR #67 |
| 2026-02-17 | F3.14 | 5e3dec8 | File upload support in ProductImageManager: uploadImage service method, Upload File button, client-side MIME/size validation, folder param for Cloudinary (9 new tests), 592 frontend total, PR #68 |
| 2026-02-17 | F3.15 | ace5074 | Fix admin product form bugs: getLocalizedField utility for [object Object], FormData Content-Type interceptor fix, create-mode image guidance Alert (11 new tests), 603 frontend total, PR #69 |
| 2026-02-18 | F3.16 | 4d4ded0 | Fix edit page bugs: productType include in getProductById/getProductBySlug, primaryImage include+mapping in listProducts, success Alert on edit page, button text "Update"/"Updating..." (5 new tests: 2 backend, 3 frontend), 980 backend / 606 frontend total, PR #70 |

---

*Created: 2026-02-11*
*Last Updated: 2026-02-18 (F3.16 completed — Sprint 3 100% complete, 26/26 tasks)*
