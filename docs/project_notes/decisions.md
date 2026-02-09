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

