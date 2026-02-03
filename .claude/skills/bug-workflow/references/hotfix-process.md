# Hotfix Process Guide

## Overview

A hotfix is an emergency fix deployed directly to production to resolve a critical issue. Speed is essential, but so is not making things worse.

---

## When to Hotfix

### Criteria (ALL must be true)

- [ ] Issue is in production NOW
- [ ] Severity is Critical or High
- [ ] Users are actively impacted
- [ ] Cannot wait for normal release cycle
- [ ] Fix is understood and contained

### Examples

**DO Hotfix:**
- Authentication completely broken
- Payment processing failing
- Security vulnerability being exploited
- Data corruption occurring
- Main functionality unavailable

**DON'T Hotfix:**
- Performance issue (unless severe)
- Minor feature bug with workaround
- Issue only affecting few users
- Problem can wait until tomorrow
- You're not sure of the fix

---

## Hotfix Process

### Phase 1: Confirm (5-10 min)

**STOP. Breathe. Verify.**

Before acting:

1. **Confirm the issue is real**
   - Check monitoring/alerts
   - Try to reproduce
   - Get second confirmation

2. **Confirm severity**
   - Is it really Critical?
   - How many users affected?
   - Is it getting worse?

3. **Confirm you understand it**
   - Do you know the cause?
   - Do you know the fix?
   - What's the risk?

**If unsure about any of the above → Get help first**

---

### Phase 2: Alert (2 min)

**Communicate immediately:**

```
🚨 HOTFIX IN PROGRESS

Issue: [Brief description]
Impact: [Who/what is affected]
Status: Investigating/Fixing/Deploying
ETA: [Estimated fix time]
Owner: [Your name]

Will update in [X] minutes.
```

**Notify:**
- [ ] Team lead
- [ ] On-call person
- [ ] Relevant team members
- [ ] Stakeholders (if business critical)

---

### Phase 3: Branch (2 min)

**Create hotfix branch from production:**

```bash
# Ensure you're on the production branch
git checkout main
git pull origin main

# Create hotfix branch
git checkout -b hotfix/critical-auth-fix
```

**Naming:**
```
hotfix/<brief-description>
```

---

### Phase 4: Fix (10-30 min)

**Rules for hotfix code:**

1. **Minimal change only**
   - Fix the immediate problem
   - Nothing else

2. **No refactoring**
   - Don't clean up code
   - Don't improve architecture

3. **No new features**
   - Even if "quick"
   - Even if "while we're here"

4. **Document shortcuts**
   ```typescript
   // HOTFIX: Quick fix for auth issue
   // TODO: Proper fix in TICKET-123
   if (token.includes('%')) {
     token = decodeURIComponent(token);
   }
   ```

5. **Keep it reversible**
   - Easy to rollback if needed
   - No destructive changes

---

### Phase 5: Test (5-10 min)

**Minimal but essential testing:**

1. **Fix works**
   - Issue no longer occurs
   - Expected behavior restored

2. **Nothing else broke**
   - Critical paths still work
   - No new errors in logs

3. **Quick smoke test**
   - Login works
   - Main features work
   - Checkout works (if applicable)

**Skip in hotfix:**
- Full regression suite
- Edge case testing
- Performance testing

**Note:** We'll do proper testing after, but can't delay deploy

---

### Phase 6: Deploy (5-10 min)

**Fast-track deployment:**

```bash
# Commit
git add .
git commit -m "hotfix(auth): fix token validation for encoded characters

Emergency fix for production auth failure.
Proper fix to follow in TICKET-123.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# Push
git push origin hotfix/critical-auth-fix

# Create PR (if required) or merge directly
gh pr create --title "🚨 HOTFIX: Auth token validation" --body "CRITICAL - Deploy immediately"

# Or direct merge if process allows
git checkout main
git merge hotfix/critical-auth-fix
git push origin main
```

**Deploy to production:**
```bash
# Your deployment command
npm run deploy:production
# or
./deploy.sh production
```

---

### Phase 7: Verify (5 min)

**Confirm fix is working in production:**

1. **Check monitoring**
   - Error rates dropping
   - Success rates improving

2. **Manual verification**
   - Try the failing flow
   - Confirm it works

3. **Watch logs**
   - No new errors
   - Expected behavior

**Update stakeholders:**
```
✅ HOTFIX DEPLOYED

Issue: [Brief description]
Status: RESOLVED
Verified: [How you verified]
Time to Fix: [Duration]

Post-mortem scheduled for [date/time].
```

---

### Phase 8: Document (10 min)

**Update bugs.md:**

```markdown
### 2026-02-02 - 🚨 HOTFIX: Authentication Token Failure

- **Severity:** Critical (Production Down)
- **Duration:** 45 minutes (14:30 - 15:15)
- **Impact:** All users unable to login
- **Root Cause:** Token encoding mismatch after security update
- **Hotfix:** Added decoding step before validation
- **Proper Fix:** TICKET-123 (scheduled for next sprint)
- **Commit:** abc123
- **Post-mortem:** Scheduled 2026-02-03
```

**Create follow-up ticket:**

If hotfix was a temporary solution:
```markdown
## TICKET-123: Proper Fix for Token Encoding

**Origin:** Hotfix 2026-02-02

**Problem:**
Hotfix added bandaid decoding. Need proper solution.

**Required:**
- Consistent encoding/decoding throughout auth flow
- Tests for all token formats
- Remove hotfix workaround
```

---

### Phase 9: Post-mortem (Later)

**Schedule within 48 hours:**

Questions to answer:
1. What happened?
2. Why did it happen?
3. How was it detected?
4. How was it fixed?
5. What was the impact?
6. How do we prevent recurrence?

**Post-mortem template:**

```markdown
## Post-mortem: Auth Token Failure

**Date of Incident:** 2026-02-02
**Duration:** 45 minutes
**Severity:** Critical
**Author:** [Name]

### Timeline

| Time | Event |
|------|-------|
| 14:30 | First alert triggered |
| 14:32 | On-call acknowledged |
| 14:35 | Issue confirmed, investigation started |
| 14:45 | Root cause identified |
| 14:55 | Hotfix ready |
| 15:05 | Deployed to production |
| 15:10 | Verified working |
| 15:15 | Incident closed |

### What Happened

[Detailed description]

### Root Cause

[Technical explanation]

### Impact

- Users affected: ~2,000
- Revenue impact: ~$5,000
- Reputation impact: Low (quick resolution)

### What Went Well

- Quick detection (5 min)
- Fast root cause identification
- Clean hotfix

### What Went Wrong

- Security update not fully tested
- No test for encoded tokens
- Deployment on Friday afternoon

### Action Items

| Item | Owner | Due |
|------|-------|-----|
| Add token encoding tests | [Dev] | 2026-02-05 |
| Review security update process | [Lead] | 2026-02-07 |
| Implement proper fix | [Dev] | 2026-02-10 |
| Update runbook | [DevOps] | 2026-02-07 |
```

---

## Hotfix Checklist

Print this and follow during incidents:

```
□ CONFIRM
  □ Issue verified
  □ Severity confirmed Critical/High
  □ Cause understood
  □ Fix known

□ ALERT
  □ Team notified
  □ Stakeholders informed
  □ Status page updated (if applicable)

□ BRANCH
  □ From production/main
  □ Named hotfix/description

□ FIX
  □ Minimal change only
  □ Documented with TODO
  □ Reversible

□ TEST
  □ Fix verified
  □ No regression
  □ Smoke test passed

□ DEPLOY
  □ PR created/merged
  □ Deployed to production
  □ Deployment verified

□ VERIFY
  □ Monitoring checked
  □ Manual test in prod
  □ Stakeholders updated

□ DOCUMENT
  □ bugs.md updated
  □ Follow-up ticket created
  □ Post-mortem scheduled
```

---

## Anti-patterns

### Don't

- ❌ Panic and rush without thinking
- ❌ Deploy untested changes
- ❌ Add "quick improvements" while fixing
- ❌ Skip documentation
- ❌ Forget to tell anyone
- ❌ Leave without verifying fix
- ❌ Skip post-mortem

### Do

- ✅ Stay calm
- ✅ Verify before acting
- ✅ Communicate constantly
- ✅ Keep changes minimal
- ✅ Test critical paths
- ✅ Document everything
- ✅ Learn from incident
