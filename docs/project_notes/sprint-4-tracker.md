# Sprint 4: Cart & Checkout UI

**Goal:** Implement shopping cart and checkout flow UI.
**Start Date:** 2026-02-18
**Status:** In Progress

---

## Progress Overview

```
Progress: [██████████████            ] 56%

Completed: 9/16 tasks
In Progress: 0 tasks
Pending: 7 tasks
Deferred: 0 tasks
Blocked: 0 tasks
```

---

## Active Task

| Field | Value |
|-------|-------|
| Task | F4.4 — Create cart page |
| Branch | feature/sprint4-F4.4-cart-page |
| Step | 2b/5 (Implement) |
| Ticket | docs/tickets/F4.4-cart-page.md |

---

## Backend Tasks

| ID | Task | Priority | Status | Branch | Notes |
|----|------|----------|--------|--------|-------|
| B4.1 | Create Address model and migration | High | ✅ | feature/sprint4-B4.1-address-model | Completed 2026-02-18 |
| B4.2 | Implement address service (CRUD for users) | High | ✅ | feature/sprint4-B4.2-address-service | Completed 2026-02-18 |
| B4.3 | Create cart validation endpoint | High | ✅ | feature/sprint4-B4.3-cart-validation | Completed 2026-02-18 |
| B4.4 | Implement promo code validation | High | ✅ | feature/sprint4-B4.4-promo-code-validation | Completed 2026-02-19 |
| B4.5 | Create order total calculation service | High | ✅ | feature/sprint4-B4.5-order-total-calculation | Completed 2026-02-19 |
| B4.6 | Write cart/checkout integration tests | High | ✅ | feature/sprint4-B4.6-cart-checkout-integration-tests | Completed 2026-02-19 |

---

## Frontend Tasks

| ID | Task | Priority | Status | Branch | Notes |
|----|------|----------|--------|--------|-------|
| F4.1 | Create cartStore (Zustand with persistence) | High | ✅ | feature/sprint4-F4.1-cart-store | Completed 2026-02-19 |
| F4.2 | Implement CartDrawer component | High | ✅ | feature/sprint4-F4.2-cart-drawer | Completed 2026-02-19 |
| F4.3 | Implement CartItem component | High | ✅ | feature/sprint4-F4.3-cart-item-component | Completed 2026-02-19 |
| F4.4 | Create cart page | High | 🔄 | feature/sprint4-F4.4-cart-page | Depends on F4.1, F4.3 |
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

### Tech debt from F4.2 code review (non-blocking)

1. **Store wiring tests use mock internals** — CartDrawer Group D tests call the spy directly instead of simulating user interaction through the mock CartItem. Works but gives weaker confidence about actual prop wiring.
2. **UI primitives don't forward refs** — `sheet.tsx` and `dialog.tsx` don't use `forwardRef`. Would matter if a consumer needs programmatic focus or measurement. Project-wide concern.
3. **SheetFooter vs DialogFooter layout inconsistency** — Sheet uses `flex-col`, Dialog uses `flex-col-reverse`. Button order on mobile differs. Should be a deliberate decision.
4. **CartDrawer mock design is fragile for multi-item** — `mockOnUpdateQuantity.mockImplementation(onUpdateQuantity)` always points to the last-rendered CartItem's props. Add a comment if Group D tests are extended to multiple items.
5. **No test for open/close state** — Sheet is mocked as a plain div, so toggling is invisible to the test suite. Accepted trade-off of the JSDOM portal mocking strategy.
6. **`data-slot` on `DialogPortal` in `dialog.tsx`** — Same issue as the one fixed in `sheet.tsx` (Portal doesn't render DOM, attribute silently dropped). Fix when touching `dialog.tsx` next.

### Tech debt from F4.4 code review (non-blocking)

7. **metadata.description missing on all pages** — `app/cart/page.tsx` has `title` but no `description`. No other page has it either. Important for SEO/positioning — address as a project-wide pass across all page routes.
8. **Store wiring tests use mock-capture pattern (codebase-wide)** — CartPageContent Group D (same as CartDrawer Group D) calls captured callback directly rather than simulating user interaction. Known trade-off; if addressed, do it for all cart tests at once.
9. **Duplicate h1 test across Groups B and F** — Group F "page has an h1 heading" is a subset of Group B "renders page heading Shopping Cart". Harmless but redundant. Remove if cleaning up tests.
10. **No test for same-productId-different-size edge case** — Component uses correct composite key but no test covers two items with same productId and different sizes rendering independently.

---

## Completion Log

| Date | Task | Commit | Notes |
|------|------|--------|-------|
| 2026-02-18 | B4.1 | 28667ef | Address model + migration + domain errors (6 tests), 986 total, PR #71 |
| 2026-02-18 | B4.2 | 814b458 | Address service CRUD + validator + controller + routes (75 tests), 1061 total, PR #72 |
| 2026-02-18 | B4.3 | 5e48783 | Cart validation endpoint + validator + service + controller + routes (76 tests), 1137 total, PR #73 |
| 2026-02-19 | B4.4 | 71362af | Promo code validation endpoint + DiscountType enum + PromoCode model + migration (108 tests), 1245 total, PR #74 |
| 2026-02-19 | B4.5 | 0c9ea64 | Order total calculation service + validator + controller + route (78 tests), 1323 total, PR #75 |
| 2026-02-19 | B4.6 | dc48914 | Cart/checkout cross-module integration tests (8 tests), 1331 total, PR #76 |
| 2026-02-19 | F4.1 | 4d82d25 | cartStore Zustand + localStorage persistence (26 tests), 632 frontend total, PR #77 |
| 2026-02-19 | F4.3 | 75527f0 | CartItem presentational component (27 tests), 659 frontend total, PR #78 |
| 2026-02-19 | F4.2 | 12c08d5 | CartDrawer slide-out + Sheet primitive (18 tests), 677 frontend total, PR #79 |

---

*Created: 2026-02-18*
*Last Updated: 2026-02-19 (F4.2 completed)*
