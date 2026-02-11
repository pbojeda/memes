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

