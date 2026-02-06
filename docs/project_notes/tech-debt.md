# Technical Debt

This file tracks known technical debt items with context and planned remediation.

## Format

| Priority | Item | Description | Ticket | Added |
|----------|------|-------------|--------|-------|

---

## Entries

### TD-001: Timing Attack on Login (Low Priority)

**Added:** 2026-02-06
**Location:** `backend/src/application/services/authService.ts:login()`
**Severity:** Low

**Issue:**
The login flow has a timing difference between:
1. "Email not found" (fast - DB lookup only)
2. "User exists but inactive" (medium - DB lookup + active check)
3. "Wrong password" (slow - DB lookup + bcrypt comparison)

This theoretically enables email enumeration via timing analysis.

**Current Trade-off:**
We prioritize user experience by failing fast for inactive accounts rather than adding artificial delay. For an e-commerce platform, this risk is acceptable.

**Mitigation Applied:**
- Active status is checked BEFORE password comparison (prevents revealing correct password for inactive accounts)
- Generic error messages (InvalidCredentialsError) don't reveal which check failed

**Full Fix (if needed later):**
Perform bcrypt comparison against a dummy hash even when user doesn't exist:
```typescript
const dummyHash = '$2b$12$...'; // Pre-computed hash
const passwordHash = user?.passwordHash || dummyHash;
await bcrypt.compare(password, passwordHash); // Always takes same time
```

**When to prioritize:**
- If we add high-value features (admin accounts, financial data)
- If we detect automated enumeration attacks in logs

---

*Last updated: 2026-02-06*
