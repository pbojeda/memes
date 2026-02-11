# Sprint 2: Product Types & Categories

**Goal:** Implement product type management.
**Start Date:** 2026-02-09
**End Date:** 2026-02-11 (early)
**Status:** Completed

---

## Progress Overview

```
Progress: [█████████████████████████] 100%

Completed: 9/9 tasks
In Progress: 0 tasks
Pending: 0 tasks
Deferred: 1 task (B2.4)
Blocked: 0 tasks
```

---

## Active Task

None — Sprint 2 completed.

---

## Backend Tasks

| ID | Task | Priority | Status | Branch | Notes |
|----|------|----------|--------|--------|-------|
| B2.1 | Create ProductType model and migration | High | ✅ | feature/sprint2-B2.1-product-type-model | Completed 2026-02-09 |
| B2.2 | Implement product type service | High | ✅ | feature/sprint2-B2.2-product-type-service | Completed 2026-02-09 |
| B2.3 | Create product type endpoints (CRUD) | High | ✅ | feature/sprint2-B2.3-product-type-endpoints | Completed 2026-02-10 |
| B2.4 | Implement i18n support for product type names | Medium | 🚫 | | Deferred post-MVP (ADR-003) |
| B2.5 | Create seed data for product types | High | ✅ | feature/sprint2-B2.5-product-type-seed | Completed 2026-02-10 |
| B2.6 | Write product type integration tests | High | ✅ | feature/sprint2-B2.6-product-type-integration-tests | Completed 2026-02-10 |

---

## Frontend Tasks

| ID | Task | Priority | Status | Branch | Notes |
|----|------|----------|--------|--------|-------|
| F2.1 | Create product types service | High | ✅ | feature/sprint2-F2.1-product-types-service | Completed 2026-02-10 |
| F2.2 | Create product type filter component | High | ✅ | feature/sprint2-F2.2-product-type-filter | Completed 2026-02-10 |
| F2.3 | Implement admin product types page | Medium | ✅ | feature/sprint2-F2.3-admin-product-types | Completed 2026-02-11 |
| F2.4 | Write product type component tests | Medium | ✅ | | Tests written via TDD in F2.1–F2.3 (88 tests) |

---

## Status Legend

| Icon | Status |
|------|--------|
| ⏳ | Pending |
| 🔄 | In Progress |
| ✅ | Completed |
| 🚫 | Blocked |

---

## Task Dependencies

```
Backend:
B2.1 ──► B2.2 ──► B2.3
              │
              └──► B2.4
B2.1 ──► B2.5
B2.3 ──► B2.6

Frontend:
F2.1 ──► F2.2
F2.1 ──► F2.3
F2.3 ──► F2.4
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
| ADR-002 | Defer ProductType → Product relation until Sprint 3 | 2026-02-09 |
| ADR-003 | Defer i18n to post-MVP | 2026-02-10 |

---

## Bugs Found & Fixed

| Date | Bug | Solution |
|------|-----|----------|
| 2026-02-11 | ts-node fails to load Express type augmentation (`req.user` TS error) | Add `"ts-node": { "files": true }` to `tsconfig.json` |
| 2026-02-11 | Backend routes missing `/api/v1` prefix (frontend 404s) | Mount routes with `app.use('/api/v1', routes)` in `app.ts` |
| 2026-02-11 | No CORS middleware — frontend (port 3001) blocked from backend (port 3000) | Install and add `cors()` middleware to `app.ts` |
| 2026-02-11 | Prisma seed command not configured | Add `seed` property to `prisma.config.ts` |
| 2026-02-11 | Login fails — `JWT_SECRET` missing from `.env` | Add `JWT_SECRET` and other required vars to `.env` |
| 2026-02-11 | Session lost on navigation — auth store only persists tokens, not user/isAuthenticated | Add `user` and `isAuthenticated` to `partialize` in auth store |
| 2026-02-11 | `name` field rendered as `[object Object]` — backend returns `LocalizedString` JSON | Add `getLocalizedName()` helper to extract string from `{es: "..."}` objects |

---

## Deliverables Checklist

From PLAN_DESARROLLO.md:

- [x] Product types CRUD for admin
- [x] Product type filter on frontend
- [x] Seeded product types (t-shirt, hoodie, mug, etc.)

---

## Sprint Notes

_Key learnings, issues, or observations:_

- Sprint 2 started in parallel with Sprint 1 (frontend tasks F1.7, F1.8, F1.9 still pending in another terminal)
- First manual QA run revealed 7 integration bugs — all unit/integration tests passed but the app didn't work end-to-end
- Key gap: `.env` setup and runtime config were never tested as part of the development workflow
- `LocalizedString` JSON type (i18n deferred by ADR-003) still flows through the full stack — frontend must handle it

---

## Completion Log

| Date | Task | Commit | Notes |
|------|------|--------|-------|
| 2026-02-09 | B2.1 | cf7f25d | ProductType model + migration + domain errors + ADR-002 |
| 2026-02-09 | B2.2 | c959e64 | ProductType service + validator, 92 tests, role-aware getAll, slug race condition fix |
| 2026-02-10 | B2.3 | 44d7cd5 | CRUD endpoints + optionalAuthMiddleware + authController refactor, 361 tests, PR #40 |
| 2026-02-10 | B2.5 | 2f75da1 | Seed data (6 product types) + seed script + 9 tests, PR #41 |
| 2026-02-10 | B2.6 | c438463 | 33 integration tests for CRUD endpoints, 403 total tests, PR #42 |
| 2026-02-10 | F2.1 | ce0a234 | productTypeService CRUD + 19 tests (auth/RBAC coverage), PR #43 |
| 2026-02-10 | F2.2 | cc19375 | ProductTypeFilter + ButtonGroupSkeleton, 27 tests (180 total), PR #44 |
| 2026-02-11 | F2.3 | 66bf0d3 | Admin product types page, CRUD dialogs, admin layout, 57 tests (237 total), PR #45 |
| 2026-02-11 | F2.4 | — | Already covered by TDD in F2.1–F2.3: 88 product-type tests, 237 frontend total |

---

*Created: 2026-02-09*
*Last Updated: 2026-02-11*
