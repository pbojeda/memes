# Architectural Decisions

This file records Architectural Decision Records (ADRs) with context and trade-offs.

## Format

Each decision should include:
- Date and ADR number
- Context (why the decision was needed)
- Decision (what was chosen)
- Alternatives considered
- Consequences (trade-offs, implications)

---

## Entries

<!-- Add ADR entries below this line -->

### ADR-002: Defer ProductType → Product relation until Sprint 3 (2026-02-09)

**Context:**
- B2.1 adds the `ProductType` model to Prisma schema
- The `data-model.md` spec defines a `products Product[]` relation on ProductType
- The `Product` model won't be created until Sprint 3

**Decision:**
Do not add the `products Product[]` relation field to ProductType in B2.1. Add it in Sprint 3 when the Product model is created.

**Alternatives Considered:**
- Add a stub/placeholder Product model → Rejected: introduces unused model, future migration conflicts
- Add the relation and comment it out → Rejected: commented code in schema is an anti-pattern

**Consequences:**
- Migration in Sprint 3 will add the relation via a new migration (no data loss, just schema addition)
- Sprint 2 service/tests for ProductType won't include product-related queries (which is correct for scope)

### ADR-003: Defer i18n to post-MVP (2026-02-10)

**Context:**
- B2.4 (i18n support for product type names) was planned for Sprint 2
- The ProductType model already stores localized names as JSON (`{ es: "...", en: "..." }`)
- Full i18n infrastructure (language detection, locale switching, translated UI) adds complexity without immediate business value for MVP

**Decision:**
Defer all i18n-related tasks until after MVP. The JSON name field remains as-is — the frontend will use the `es` key by default for MVP. No language switcher or locale-aware routing is needed yet.

**Alternatives Considered:**
- Implement i18n now → Rejected: delays MVP, low priority for initial launch targeting Spanish market

**Consequences:**
- B2.4 removed from Sprint 2 (marked as deferred)
- Frontend can hardcode `name.es` for MVP; switching to i18n later only requires changing the accessor
- No schema changes needed when i18n is implemented — the data structure already supports it

### ADR-004: Enforce rating constraint at validator level, not DB (2026-02-13)

**Context:**
- ProductReview.rating must be 1-5, per data model spec
- Prisma does not support DB-level CHECK constraints
- B3.1 code review flagged this as needing enforcement somewhere

**Decision:**
Enforce rating 1-5 at the application validator level (`productReviewValidator.ts`). The validator checks `Number.isInteger(rating)` and `rating >= 1 && rating <= 5` before data reaches the database.

**Alternatives Considered:**
- Raw SQL migration to add CHECK constraint → Rejected: breaks Prisma migration workflow, hard to maintain
- DB trigger → Rejected: over-engineering for a simple range check

**Consequences:**
- Validation only runs when requests go through the API — direct DB writes could bypass it
- Acceptable trade-off: only staff (MANAGER/ADMIN) can create reviews, and all access goes through API

### ADR-005: Review analytics from ALL reviews, not just visible (2026-02-13)

**Context:**
- List reviews endpoint returns `averageRating` and `ratingDistribution` in response meta
- Only visible reviews (`isVisible: true`) are returned in the data array
- Question: should analytics include hidden reviews?

**Decision:**
Compute `averageRating` and `ratingDistribution` from ALL reviews for a product (visible + hidden). The paginated data only shows visible reviews.

**Alternatives Considered:**
- Analytics from visible-only → Rejected: hiding one bad review would artificially inflate the average, misleading admins

**Consequences:**
- Admins see accurate product metrics regardless of visibility settings
- Public users see the same averageRating even if some reviews are hidden (consistent experience)

### ADR-006: No inline regex in Express 5 route params (2026-02-13)

**Context:**
- `path-to-regexp` v8 (used by Express 5) dropped support for inline regex in route parameters
- Pattern like `/:id([0-9a-f]{8}-...)` throws `PathError: Unexpected (`
- Need to distinguish UUID vs slug in product detail endpoint

**Decision:**
Handle UUID vs slug detection in the route handler via runtime regex check, not in the route definition. The `getProductDetail` handler tests the param with a UUID regex and routes accordingly.

**Alternatives Considered:**
- Separate routes (`/products/by-id/:id` and `/products/by-slug/:slug`) → Rejected: breaks REST conventions
- Downgrade path-to-regexp → Rejected: Express 5 dependency

**Consequences:**
- All future routes with mixed param formats must use handler-level detection
- Slightly more complex handler code, but cleaner route definitions

