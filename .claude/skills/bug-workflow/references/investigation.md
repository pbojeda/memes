# Bug Investigation Guide

## Overview

Investigation is the most critical step in bug resolution. A thorough investigation leads to a proper fix; a rushed investigation leads to more bugs.

---

## Investigation Mindset

### Principles

1. **Understand before fixing** - Never fix what you don't understand
2. **Find root cause** - Treat the disease, not the symptom
3. **Question assumptions** - The obvious cause is often wrong
4. **Document as you go** - Future you will thank present you
5. **Time-box wisely** - Know when to ask for help

---

## Investigation Process

### Phase 1: Reproduce (15-30 min)

**Goal:** Confirm the bug exists and understand exact conditions.

**Steps:**
1. Follow reported reproduction steps exactly
2. Note if it fails consistently or intermittently
3. Try variations:
   - Different user/account
   - Different browser/device
   - Different data
4. Identify minimal reproduction case

**Output:**
```markdown
### Reproduction

**Consistently Reproducible:** Yes / No / Sometimes

**Minimal Steps:**
1. [Step 1]
2. [Step 2]
3. [Bug occurs]

**Variations Tested:**
- Chrome: Fails
- Firefox: Works
- Safari: Fails
- With new account: Works
- With old account: Fails

**Pattern Identified:**
Bug affects accounts created before 2026-01-15
```

---

### Phase 2: Isolate (30-60 min)

**Goal:** Narrow down the location and cause.

**Techniques:**

#### Binary Search (Git Bisect)

When did it start working/failing?

```bash
git bisect start
git bisect bad              # Current is bad
git bisect good abc123      # Known good commit
# Git will checkout commits for you to test
git bisect good/bad         # Mark each
# Eventually identifies the problematic commit
```

#### Layer Isolation

Where in the stack does it fail?

```
Frontend → API → Service → Database
    ↓         ↓        ↓         ↓
  Check    Check   Check    Check
  console  network  logs    queries
```

#### Component Isolation

Which component is at fault?

```
1. Test each component in isolation
2. Mock dependencies
3. Check interfaces between components
```

**Output:**
```markdown
### Isolation

**When Introduced:**
Commit def789 on 2026-01-15 ("Update user schema")

**Layer:**
Service layer - UserService.validateSession()

**Component:**
Session token validation logic

**Narrowed To:**
Line 45-52 in src/services/UserService.ts
```

---

### Phase 3: Understand (30-60 min)

**Goal:** Know exactly why the bug happens.

**Questions to Answer:**

1. **What should happen?**
   - Expected behavior
   - Correct code path

2. **What actually happens?**
   - Actual behavior
   - Incorrect code path

3. **Why does it happen?**
   - Root cause
   - Chain of events

4. **Why wasn't it caught?**
   - Missing test?
   - Edge case?
   - Changed requirements?

**Debugging Techniques:**

#### Add Logging
```typescript
console.log('validateSession input:', { token, userId });
console.log('validateSession decoded:', decodedToken);
console.log('validateSession comparison:', { expected, actual });
```

#### Use Debugger
```typescript
debugger; // Browser will pause here
// Or in Node:
// node --inspect-brk src/index.ts
```

#### Check Data
```sql
-- What does the data look like?
SELECT * FROM sessions WHERE user_id = 'xxx';
```

**Output:**
```markdown
### Root Cause Analysis

**Expected Behavior:**
Session token should be validated against stored token.

**Actual Behavior:**
Validation fails because stored token is URL-encoded but
incoming token is not encoded before comparison.

**Root Cause:**
When tokens are stored (login), they're URL-encoded for safety.
When tokens are validated (each request), they're compared raw.
The comparison fails because encoded !== raw.

**Why It Happened:**
- Login flow was updated to encode tokens (security fix)
- Validation flow was not updated to match
- No test covered this scenario

**Chain of Events:**
1. User logs in
2. Token "abc+123" stored as "abc%2B123"
3. User makes request with "abc+123"
4. Validation compares "abc+123" !== "abc%2B123"
5. Validation fails
6. User gets logged out
```

---

### Phase 4: Verify Understanding (15 min)

**Goal:** Confirm your analysis is correct before fixing.

**Verification Steps:**

1. **Predict behavior changes**
   - If I change X, Y should happen
   - Test the prediction

2. **Explain to someone** (or rubber duck)
   - Can you clearly explain the bug?
   - Does it make sense?

3. **Check for similar issues**
   - Search bugs.md for related bugs
   - Search codebase for similar patterns

**Red Flags (go back and investigate more):**

- ❌ "I'm not sure why, but this fix works"
- ❌ "It works on my machine"
- ❌ "I couldn't reproduce it but..."
- ❌ "The fix is bigger than expected"

**Green Lights (proceed to fix):**

- ✅ Can explain bug to non-technical person
- ✅ Know exact line(s) causing issue
- ✅ Understand why it wasn't caught
- ✅ Have idea for test that would catch it

---

## Investigation Tools

### Frontend

| Tool | Use For |
|------|---------|
| Browser DevTools | Console errors, network, DOM |
| React DevTools | Component state, props |
| Redux DevTools | State changes |
| Network Tab | API requests/responses |

### Backend

| Tool | Use For |
|------|---------|
| Server Logs | Error messages, stack traces |
| Database Client | Query data directly |
| Postman/curl | Test API in isolation |
| Node Inspector | Step-through debugging |

### General

| Tool | Use For |
|------|---------|
| Git Bisect | Find when bug was introduced |
| Git Blame | See who changed what when |
| Git Log | Recent changes to file |
| Grep/Search | Find related code |

---

## Time Limits

| Severity | Investigation Limit | Then |
|----------|---------------------|------|
| Critical | 30 min | Escalate + consider rollback |
| High | 2 hours | Escalate to senior dev |
| Medium | 4 hours | Pair with someone |
| Low | 1 day | Document and backlog |

---

## Investigation Output Template

```markdown
## Investigation Report: [Bug Title]

**Investigated By:** [Name]
**Date:** YYYY-MM-DD
**Time Spent:** X hours

### Summary

One paragraph explaining the bug and its cause.

### Reproduction

- **Reproducible:** Yes/No/Sometimes
- **Conditions:** [When it happens]
- **Minimal Steps:** [Numbered list]

### Root Cause

**What:** [Technical description]
**Where:** [File:line or component]
**When Introduced:** [Commit or date]
**Why:** [How it got past review/testing]

### Impact

- **Users Affected:** [Number or percentage]
- **Features Affected:** [List]
- **Data Impact:** [None/Corrupted/Lost]

### Proposed Fix

**Approach:** [Brief description]
**Files to Change:** [List]
**Risk Level:** Low/Medium/High
**Estimated Time:** [Hours]

### Prevention

- **Test to Add:** [Description]
- **Process Change:** [If any]
- **Documentation:** [If needed]

### Related

- **Similar Bugs:** [Links to bugs.md entries]
- **Related Code:** [Other places with same pattern]
```

---

## Common Investigation Mistakes

### Mistake 1: Fixing Too Fast

**Problem:** Jump to fix without understanding
**Result:** Fix doesn't work or causes new bugs

**Solution:** Force yourself to write the root cause before coding

### Mistake 2: Tunnel Vision

**Problem:** Assume cause and only look for confirmation
**Result:** Miss the real issue

**Solution:** Actively try to disprove your hypothesis

### Mistake 3: Not Documenting

**Problem:** Figure it out but don't write it down
**Result:** Waste time if bug recurs or similar bug appears

**Solution:** Document as you go, not at the end

### Mistake 4: Working Alone Too Long

**Problem:** Spend hours stuck on investigation
**Result:** Wasted time, frustration

**Solution:** Set time limits, ask for help early
