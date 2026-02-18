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

### ADR-007: Product detail page as client component — defer SSR/SEO to post-MVP (2026-02-17)

**Context:**
- F3.5 implements `/products/[slug]` as a public product detail page
- Product detail pages are canonical SEO landing pages in e-commerce
- The catalog page (`/products`) already uses the `'use client'` pattern with `useSearchParams`
- A server+client split would enable SSR/ISR pre-rendering for better SEO and initial load

**Decision:**
Implement the entire page as a `'use client'` component using `useParams` for slug extraction, matching the catalog page pattern. Defer SSR/ISR conversion to post-MVP.

**Alternatives Considered:**
- Server Component wrapper that fetches data + passes to client child → Better for SEO, but adds complexity and requires handling server-side errors differently
- Next.js `generateStaticParams` + ISR → Best for SEO + performance, but requires backend reachability at build time and cache invalidation strategy

**Consequences:**
- Search engine crawlers get a blank shell until JavaScript hydrates — poor SEO for product pages
- Consistent pattern across all pages (simpler codebase for MVP)
- **Post-MVP action:** Convert `/products/[slug]` to Server Component with `fetch` + ISR for SEO. Also consider `/products` catalog page. This is the single highest-impact SEO improvement available.

### ADR-009: Allow zero default addresses via PATCH (2026-02-18)

**Context:**
- B4.2 address service enforces "cannot delete default address when >1 addresses exist"
- However, `PATCH { isDefault: false }` on the current default address succeeds without guard
- This leaves the user with zero default addresses
- Code review flagged this as a business logic gap

**Decision:**
Accept this as a known limitation for MVP. The checkout flow (F4.5/F4.6) will require selecting a shipping address regardless, so "no default" is not a blocking state. The frontend can prompt the user to pick an address if none is marked default.

**Alternatives Considered:**
- Block unsetting the default via PATCH → Adds complexity; the only valid operation would be "set another as default" which auto-unsets the current one. This is the correct long-term fix but over-engineers MVP.
- Add a guard that auto-promotes another address to default → Complex: which address to pick? Requires a policy (newest? oldest?).

**Consequences:**
- A user can end up with addresses but none marked as default
- The checkout flow must handle this case (prompt address selection)
- Post-MVP: consider adding the guard to `updateAddress` when `isDefault: false` and the address is currently default

### ADR-008: Auto-generate product slug from title.es on backend (2026-02-17)

**Context:**
- The frontend `CreateProductRequest` never included a `slug` field — the admin form has no slug input
- The backend `validateCreateProductInput` required `slug`, causing every product creation to fail with 400
- Slugs are needed for SEO-friendly product URLs (`/products/:slug`)

**Decision:**
Auto-generate the slug from `title.es` on the backend when not provided. Use NFD normalization to strip accents, lowercase, replace non-alphanumeric chars with hyphens. On slug collision (Prisma P2002 on `slug` field), retry with `-1` through `-10` suffixes. Truncate auto-generated slugs to 97 chars (leaving room for suffixes within the 100-char limit). Explicit slugs are not truncated.

**Alternatives Considered:**
- Add slug field to frontend form → Rejected: extra friction for admins, slugs should be automatic
- Generate slug on frontend → Rejected: slug uniqueness must be enforced server-side anyway; duplicate logic
- Use UUID-based slugs → Rejected: not SEO-friendly

**Consequences:**
- Product creation "just works" from the admin form without a slug field
- Slug can optionally be provided via API for programmatic clients
- Collision retry has a limit (10) — in the unlikely case of 11 identical titles, creation fails with `ProductSlugAlreadyExistsError`
- `generateSlug()` utility in `backend/src/utils/slugify.ts` can be reused for other entities

