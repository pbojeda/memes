# Sprint 3: Products CRUD

**Goal:** Implement full product management (catalog, detail, admin CRUD, images, reviews).
**Start Date:** 2026-02-11
**End Date:** —
**Status:** In Progress

---

## Progress Overview

```
Progress: [████░░░░░░░░░░░░░░░░░░░░░] 15%

Completed: 3/20 tasks
In Progress: 0 tasks
Pending: 17 tasks
Deferred: 0 tasks
Blocked: 0 tasks
```

---

## Active Task

| Field | Value |
|-------|-------|
| Task | B3.4 — Implement product listing with filters |
| Branch | feature/sprint3-B3.4-product-listing-filters |
| Step | 3/5 (Finalize) |
| Ticket | docs/tickets/B3.4-product-listing-filters.md |

---

## Backend Tasks

| ID | Task | Priority | Status | Branch | Notes |
|----|------|----------|--------|--------|-------|
| B3.1 | Create Product, ProductImage, ProductReview models | High | ✅ | feature/sprint3-B3.1-product-models | Completed 2026-02-11 |
| B3.2 | Create PriceHistory model | Medium | ✅ | feature/sprint3-B3.2-price-history-model | Completed 2026-02-11 |
| B3.3 | Implement product service (CRUD) | High | ✅ | feature/sprint3-B3.3-product-service | Completed 2026-02-12 |
| B3.4 | Implement product listing with filters | High | 🔄 | feature/sprint3-B3.4-product-listing-filters | Pagination, sorting, type/price/active filters |
| B3.5 | Implement product detail endpoint | High | ⏳ | | Includes images, reviews |
| B3.6 | Implement soft delete for products | Medium | ⏳ | | deletedAt exclusion from public queries |
| B3.7 | Implement product image upload | High | ⏳ | | CDN/file storage |
| B3.8 | Implement product review management | Medium | ⏳ | | AI-generated flag, visibility toggle. **Must add rating CHECK (1-5) at validator/service level** — Prisma doesn't support DB CHECK constraints (from B3.1 code review) |
| B3.9 | Create admin product endpoints | High | ⏳ | | CRUD for MANAGER/ADMIN |
| B3.10 | Write product integration tests | High | ⏳ | | Full endpoint coverage |

---

## Frontend Tasks

| ID | Task | Priority | Status | Branch | Notes |
|----|------|----------|--------|--------|-------|
| F3.1 | Create product catalog page | High | ⏳ | | Public-facing, paginated |
| F3.2 | Implement ProductCard component | High | ⏳ | | Image, title, price, hot badge |
| F3.3 | Implement ProductGrid component | High | ⏳ | | Responsive layout |
| F3.4 | Implement ProductFilters component | High | ⏳ | | Type, price range, sorting |
| F3.5 | Create product detail page | High | ⏳ | | Gallery, description, sizes, reviews |
| F3.6 | Implement image gallery component | Medium | ⏳ | | Multiple images, navigation |
| F3.7 | Implement reviews display | Medium | ⏳ | | Star ratings, comments |
| F3.8 | Create admin products list page | High | ⏳ | | Table with CRUD actions |
| F3.9 | Create admin product form (create/edit) | High | ⏳ | | Multi-field form, image upload |
| F3.10 | Write product component tests | High | ⏳ | | TDD throughout F3.1–F3.9 |

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
| - | - | - |

---

## Bugs Found & Fixed

| Date | Bug | Solution |
|------|-----|----------|
| - | - | - |

---

## Deliverables Checklist

From PLAN_DESARROLLO.md:

- [ ] Product catalog with pagination
- [ ] Product filtering and sorting
- [ ] Product detail page with images and reviews
- [ ] Admin product management CRUD

---

## Sprint Notes

_Key learnings, issues, or observations:_

- ADR-002: ProductType → Product relation deferred from Sprint 2, must be added in B3.1
- ADR-003: Localized fields (title, description) use JSON `{es: "...", en: "..."}` — frontend uses `es` key for MVP
- Product model has 20+ fields including Printful refs, meme metadata, and counters (see data-model.md §3.4)
- Future optimization: Consider adding DB index on `products.deleted_at` for soft-delete query performance (from B3.3 code review)

---

## Completion Log

| Date | Task | Commit | Notes |
|------|------|--------|-------|
| 2026-02-11 | B3.1 | 50dbcd0 | Product, ProductImage, ProductReview models + migration + domain errors (13 tests), 416 total, PR #46 |
| 2026-02-11 | B3.2 | 9ac72d1 | PriceHistory model + migration + domain errors (4 tests), 420 total, PR #47 |
| 2026-02-12 | B3.3 | a6d9a7c | Product service CRUD + validators + shared utils (103 new tests), 523 total, PR #48 |

---

*Created: 2026-02-11*
*Last Updated: 2026-02-12*
