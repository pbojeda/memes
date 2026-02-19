# Sprint 4: Cart & Checkout UI

**Goal:** Implement shopping cart and checkout flow UI.
**Start Date:** 2026-02-18
**Status:** In Progress

---

## Progress Overview

```
Progress: [██████                    ] 25%

Completed: 4/16 tasks
In Progress: 0 tasks
Pending: 12 tasks
Deferred: 0 tasks
Blocked: 0 tasks
```

---

## Active Task

| Field | Value |
|-------|-------|
| Task | B4.5 — Create order total calculation service |
| Branch | feature/sprint4-B4.5-order-total-calculation |
| Step | 3/5 (Finalize) |
| Ticket | docs/tickets/B4.5-order-total-calculation.md |

---

## Backend Tasks

| ID | Task | Priority | Status | Branch | Notes |
|----|------|----------|--------|--------|-------|
| B4.1 | Create Address model and migration | High | ✅ | feature/sprint4-B4.1-address-model | Completed 2026-02-18 |
| B4.2 | Implement address service (CRUD for users) | High | ✅ | feature/sprint4-B4.2-address-service | Completed 2026-02-18 |
| B4.3 | Create cart validation endpoint | High | ✅ | feature/sprint4-B4.3-cart-validation | Completed 2026-02-18 |
| B4.4 | Implement promo code validation | High | ✅ | feature/sprint4-B4.4-promo-code-validation | Completed 2026-02-19 |
| B4.5 | Create order total calculation service | High | 🔄 | feature/sprint4-B4.5-order-total-calculation | Depends on B4.4 ✅ |
| B4.6 | Write cart/checkout integration tests | High | ⏳ | — | Depends on B4.1-B4.5 |

---

## Frontend Tasks

| ID | Task | Priority | Status | Branch | Notes |
|----|------|----------|--------|--------|-------|
| F4.1 | Create cartStore (Zustand with persistence) | High | ⏳ | — | — |
| F4.2 | Implement CartDrawer component | High | ⏳ | — | Depends on F4.1, F4.3 |
| F4.3 | Implement CartItem component | High | ⏳ | — | Depends on F4.1 |
| F4.4 | Create cart page | High | ⏳ | — | Depends on F4.1, F4.3 |
| F4.5 | Implement checkout page (multi-step) | High | ⏳ | — | Depends on F4.1, F4.6, F4.7, F4.8 |
| F4.6 | Create shipping address form | High | ⏳ | — | Depends on B4.2 |
| F4.7 | Implement promo code input | High | ⏳ | — | Depends on B4.4 |
| F4.8 | Create order summary component | High | ⏳ | — | Depends on F4.1 |
| F4.9 | Implement cross-sell component | Medium | ⏳ | — | — |
| F4.10 | Write cart/checkout tests | High | ⏳ | — | TDD throughout |

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
B4.1 ──► B4.2 ──► B4.6
B4.4 ──► B4.5 ──► B4.6
B4.3 ──► B4.6

Frontend:
F4.1 ──► F4.3 ──► F4.2
     │         └──► F4.4
     └──► F4.8 ──► F4.5
F4.6 ──► F4.5
F4.7 ──► F4.5
F4.9 (independent)
F4.10 (TDD throughout F4.1–F4.9)
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
| ADR-010 | Validation endpoints return HTTP 200 for business failures | 2026-02-18 |
| ADR-011 | Defer maxUsesPerUser enforcement to order placement | 2026-02-19 |

---

## Bugs Found & Fixed

| Date | Bug | Solution |
|------|-----|----------|
| - | - | - |

---

## Deliverables Checklist

From PLAN_DESARROLLO.md:

- [ ] Cart functionality (add, remove, update quantity)
- [ ] Persistent cart (localStorage)
- [ ] Checkout flow UI
- [ ] Promo code application

---

## Sprint Notes

_Key learnings, issues, or observations:_

---

## Completion Log

| Date | Task | Commit | Notes |
|------|------|--------|-------|
| 2026-02-18 | B4.1 | 28667ef | Address model + migration + domain errors (6 tests), 986 total, PR #71 |
| 2026-02-18 | B4.2 | 814b458 | Address service CRUD + validator + controller + routes (75 tests), 1061 total, PR #72 |
| 2026-02-18 | B4.3 | 5e48783 | Cart validation endpoint + validator + service + controller + routes (76 tests), 1137 total, PR #73 |
| 2026-02-19 | B4.4 | 71362af | Promo code validation endpoint + DiscountType enum + PromoCode model + migration (108 tests), 1245 total, PR #74 |

---

*Created: 2026-02-18*
*Last Updated: 2026-02-19 (B4.4 completed)*
