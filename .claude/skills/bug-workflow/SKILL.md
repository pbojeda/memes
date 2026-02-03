---
name: bug-workflow
description: "Handles bug discovery, triage, investigation, and resolution. Use this skill when a bug is found during development, reported by users, or discovered in production. Invoke with: 'report bug', 'fix bug', 'hotfix needed', 'investigate bug', or 'triage bug'. For complex bugs that require significant work, this skill can escalate to development-workflow."
---

# Bug Workflow Skill

## Overview

This skill manages the complete lifecycle of bug resolution, from discovery to fix, with proper documentation and prevention measures.

## When to Use

| Command | Situation |
|---------|-----------|
| `report bug` | Document a newly discovered bug |
| `triage bug` | Assess severity and priority |
| `investigate bug` | Find root cause |
| `fix bug` | Resolve a known bug |
| `hotfix needed` | Critical production bug |

---

## Bug Severity Levels

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| 🔴 **Critical** | Production down, data loss, security breach | Immediate (< 1h) | Auth broken, data corruption, security vulnerability |
| 🟠 **High** | Major feature broken, no workaround | Same day | Checkout fails, API errors, crash on common action |
| 🟡 **Medium** | Feature impaired, workaround exists | Within sprint | Slow performance, UI glitch, edge case failure |
| 🟢 **Low** | Minor issue, cosmetic | Backlog | Typo, minor UI inconsistency, rare edge case |

---

## Workflow Paths

### Path A: Quick Fix (Low/Medium Severity)

```
1. Triage → 2. Investigate → 3. Fix → 4. Test → 5. Document → 6. Commit
```

Duration: 30 min - 2 hours

### Path B: Standard Fix (Medium/High Severity)

```
1. Triage → 2. Create Branch → 3. Investigate → 4. Fix (TDD) → 5. Validate → 6. Document → 7. PR
```

Duration: 2 - 8 hours

### Path C: Hotfix (Critical Severity)

```
1. Confirm Critical → 2. Hotfix Branch → 3. Minimal Fix → 4. Test → 5. Deploy → 6. Document → 7. Post-mortem
```

Duration: < 1 hour to deploy, follow-up later

### Path D: Complex Bug → Escalate

```
1. Triage → 2. Determine Complexity → 3. Create Task → 4. → development-workflow
```

When bug requires significant refactoring or architectural changes.

---

## Workflow Steps

### Step 1: Report/Detect Bug

**Sources:**
- Discovered during development
- Failed tests
- User report
- Monitoring/alerts
- Code review

**Immediate Actions:**
1. Document what happened
2. Note reproduction steps
3. Capture error messages/logs
4. Identify affected area

**Update sprint tracker "Active Task" section (if working during a sprint):**
```markdown
## Active Task

**Status:** Bug Fix

| Field | Value |
|-------|-------|
| Bug | Session token validation issue |
| Source | Development / User / Monitoring |
| Area | Auth |
| Severity | High |
```

---

### Step 2: Triage

**Assess:**
1. **Severity** - How bad is the impact?
2. **Urgency** - How soon must it be fixed?
3. **Scope** - How many users/features affected?
4. **Complexity** - How hard to fix?

**Decision Matrix:**

| Severity | In Production? | Action |
|----------|----------------|--------|
| Critical | Yes | Path C: Hotfix NOW |
| Critical | No | Path B: Priority fix |
| High | Yes | Path B: Fix today |
| High | No | Path B: Fix this sprint |
| Medium | Any | Path A or B: Schedule |
| Low | Any | Path A: Backlog |

**Output:**
```markdown
### Triage Result

- **Severity:** High
- **Path:** B (Standard Fix)
- **Priority:** Fix today
- **Assigned:** [Developer]
- **Estimated:** 2-3 hours
```

---

### Step 3: Create Branch (Path B, C)

**Naming Convention:**

| Path | Convention | Example |
|------|------------|---------|
| Standard | `bugfix/<area>-<description>` | `bugfix/auth-session-expiry` |
| Hotfix | `hotfix/<description>` | `hotfix/critical-login-fix` |

**Command:**
```bash
git checkout -b bugfix/auth-session-expiry
```

---

### Step 4: Investigate

**Goal:** Find the root cause, not just the symptom.

**Investigation Steps:**

1. **Reproduce the bug**
   - Follow reported steps
   - Confirm it fails consistently
   - Note exact error messages

2. **Isolate the cause**
   - When did it start? (git bisect if needed)
   - What changed recently?
   - Which component is failing?

3. **Understand the impact**
   - What else might be affected?
   - Are there related issues?

4. **Document findings**
   ```markdown
   ### Investigation

   **Root Cause:**
   Session token validation fails when token contains special characters.

   **Introduced:**
   Commit abc123 on 2026-01-28

   **Affected:**
   - Login flow
   - Token refresh
   - API authentication

   **Related:**
   - Similar to bug fixed on 2026-01-15 (see bugs.md)
   ```

**Tools:**
- Logs analysis
- Debugger
- Git bisect
- Network inspector
- Database queries

---

### Step 5: Fix (TDD Approach)

**Even for bugs, use TDD:**

1. **Write test that reproduces the bug (RED)**
   ```typescript
   it('should handle tokens with special characters', () => {
     const token = 'abc+def/ghi=';
     expect(validateToken(token)).toBe(true);
   });
   ```

2. **Run test - confirm it fails**
   - This proves we understand the bug

3. **Fix the code (GREEN)**
   - Minimal change to fix the issue
   - Don't refactor unrelated code

4. **Run test - confirm it passes**

5. **Run all tests**
   - Ensure no regression

**For Hotfixes (Path C):**
- Minimal fix only
- Skip refactoring
- Add TODO for proper fix later
- Document in hotfix notes

---

### Step 6: Validate

**Run production-code-validator:**
- Ensure no debug code left
- No TODO (except intentional for hotfix)
- Proper error handling

**Additional validation:**
- Manual test the fix
- Test related features
- Check edge cases

---

### Step 7: Document in bugs.md

**Always document bugs:**

```markdown
### 2026-02-02 - Session Token Special Characters

- **Severity:** High
- **Area:** Authentication
- **Issue:** Token validation failed when token contained +, /, or = characters
- **Root Cause:** URL encoding not applied before validation
- **Solution:** Added encodeURIComponent() before token comparison
- **Prevention:** Added test case for special characters in tokens
- **Commit:** def456
- **Time to Fix:** 1h 30m
```

---

### Step 8: Commit/PR

**Commit Message Format:**

```
fix(<area>): <description>

<What was the bug>
<What was the root cause>
<How it was fixed>

Fixes #issue-number (if applicable)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**Example:**
```
fix(auth): handle special characters in session tokens

Session validation failed when tokens contained URL-unsafe characters
(+, /, =). Root cause was missing URL encoding before comparison.

Added encodeURIComponent() to token validation and regression test.

Fixes #123

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

---

## Hotfix Process (Critical Bugs)

### When to Use

- Production is down
- Security vulnerability discovered
- Data corruption occurring
- Critical business function broken

### Hotfix Steps

```
1. ALERT team immediately
2. Confirm the issue (don't panic-fix wrong thing)
3. Create hotfix branch from main/production
4. Minimal fix ONLY
5. Test critical path
6. Deploy immediately
7. Monitor
8. Document
9. Schedule proper fix if needed
```

### Hotfix Checklist

- [ ] Team alerted
- [ ] Issue confirmed and understood
- [ ] Hotfix branch created from production
- [ ] Minimal fix implemented
- [ ] Critical paths tested
- [ ] Deployed to production
- [ ] Monitoring confirmed fix works
- [ ] Documented in bugs.md
- [ ] Post-mortem scheduled (if needed)
- [ ] Proper fix scheduled (if hotfix was temporary)

---

## Escalation to Development Workflow

### When to Escalate

- Bug fix requires > 1 day of work
- Multiple files/components affected
- Architectural changes needed
- New feature needed to properly fix
- Significant refactoring required

### How to Escalate

1. Document findings so far
2. Create task in sprint tracker or backlog
3. Reference bug in task description
4. Use `development-workflow` for implementation
5. Close bug when task is complete

**Example:**
```markdown
### Task: Fix Authentication Architecture

**Origin:** Bug - Session token handling
**Bug Reference:** bugs.md 2026-02-02

**Description:**
Current token handling has multiple issues. Need to refactor
authentication module to properly handle all token formats.

**Scope:**
- Refactor TokenService
- Update all token consumers
- Add comprehensive tests
```

---

## Memory Integration

### Files Updated

| File | When |
|------|------|
| `sprint-X-tracker.md` | Bug being worked on (Active Task section) |
| `bugs.md` | Always (bug documented) |
| `decisions.md` | If architectural decision made |

### Bug Entry Template

```markdown
### YYYY-MM-DD - Brief Title

- **Severity:** Critical / High / Medium / Low
- **Area:** Component/Feature affected
- **Issue:** What went wrong
- **Root Cause:** Why it happened
- **Solution:** How it was fixed
- **Prevention:** How to avoid in future
- **Commit:** Hash or PR link
- **Time to Fix:** Duration
```

---

## Prevention

### After Fixing a Bug

Ask these questions:

1. **Why wasn't this caught earlier?**
   - Missing test?
   - Missing validation?
   - Unclear requirements?

2. **Can this happen elsewhere?**
   - Similar code patterns?
   - Related features?

3. **What can prevent recurrence?**
   - Add test
   - Add validation
   - Update documentation
   - Add monitoring

### Add to bugs.md Prevention Section

```markdown
- **Prevention:**
  - Added test for special characters in tokens
  - Added input validation to TokenService
  - Updated auth documentation with valid token format
```

---

## Integration with Development Workflow

| Scenario | Use |
|----------|-----|
| New feature | `development-workflow` |
| Planned task | `development-workflow` |
| Bug found | `bug-workflow` |
| Bug is complex | `bug-workflow` → escalate → `development-workflow` |
| Bug during task | `bug-workflow` (pause task) → resume task |

---

## Quick Reference

### Commands

```
"report bug: login fails with special chars in password"
"triage bug: severity high, auth area"
"investigate bug"
"fix bug"
"hotfix needed: production auth down"
```

### Branch Names

```
bugfix/auth-special-chars
bugfix/cart-quantity-update
hotfix/critical-payment-fix
```

### Commit Prefixes

```
fix(auth): ...
fix(cart): ...
fix(api): ...
```
