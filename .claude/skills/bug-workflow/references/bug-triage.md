# Bug Triage Guide

## Overview

Triage is the process of assessing a bug's severity, priority, and determining the appropriate response.

---

## Severity Assessment

### Questions to Ask

1. **Impact Scope**
   - How many users are affected?
   - Which features are broken?
   - Is there a workaround?

2. **Business Impact**
   - Is revenue affected?
   - Is data at risk?
   - Are SLAs being violated?

3. **Technical Impact**
   - Is the system stable?
   - Are other services affected?
   - Is it getting worse?

---

## Severity Definitions

### 🔴 Critical

**Definition:** System unusable, data at risk, security compromised

**Characteristics:**
- Production is down or severely degraded
- Data loss or corruption occurring
- Security vulnerability being exploited
- Core business function completely broken
- No workaround available

**Examples:**
- Authentication completely broken
- Payment processing failing
- Database corruption
- Security breach detected
- Main page not loading

**Response:**
- Drop everything
- All hands on deck
- Fix within 1 hour
- Consider rollback

---

### 🟠 High

**Definition:** Major feature broken, significant user impact

**Characteristics:**
- Key feature not working
- Many users affected
- Workaround is difficult or partial
- Business impact is significant

**Examples:**
- Checkout fails for specific payment method
- Search returns wrong results
- User registration broken
- API returning 500 errors intermittently
- Mobile app crashing frequently

**Response:**
- Priority over other work
- Fix same day
- Assign senior developer
- Communicate to stakeholders

---

### 🟡 Medium

**Definition:** Feature impaired but usable, workaround exists

**Characteristics:**
- Feature works but has issues
- Some users affected
- Workaround is available
- Business can continue

**Examples:**
- Slow performance on specific page
- Formatting issues in reports
- Edge case causing errors
- Minor data display issues
- Feature works on retry

**Response:**
- Schedule within current sprint
- Normal development process
- Document workaround

---

### 🟢 Low

**Definition:** Minor issue, cosmetic, rarely occurs

**Characteristics:**
- Cosmetic or minor UX issue
- Very few users affected
- Easy workaround
- No business impact

**Examples:**
- Typo in UI text
- Alignment issue on one page
- Console warning (no error)
- Feature works differently than expected
- Very rare edge case

**Response:**
- Add to backlog
- Fix when convenient
- May bundle with other work

---

## Priority Matrix

| Severity | In Production | Users Affected | Priority |
|----------|---------------|----------------|----------|
| Critical | Yes | Many | P0 - Immediate |
| Critical | No | - | P1 - Today |
| High | Yes | Many | P1 - Today |
| High | Yes | Few | P2 - This week |
| High | No | - | P2 - This week |
| Medium | Yes | Any | P3 - This sprint |
| Medium | No | - | P4 - Backlog |
| Low | Any | Any | P5 - When convenient |

---

## Triage Checklist

### Initial Assessment

- [ ] Bug confirmed (reproduced)
- [ ] Severity determined
- [ ] Scope identified (users, features)
- [ ] Workaround available?
- [ ] In production?
- [ ] Getting worse?

### Documentation

- [ ] Clear description written
- [ ] Reproduction steps documented
- [ ] Error messages captured
- [ ] Screenshots/logs attached
- [ ] Environment noted

### Assignment

- [ ] Priority assigned
- [ ] Developer assigned
- [ ] Estimated effort
- [ ] Path chosen (A/B/C/D)
- [ ] Stakeholders notified (if needed)

---

## Triage Output Template

```markdown
## Bug Triage: [Brief Title]

**Reported:** YYYY-MM-DD HH:MM
**Triaged By:** [Name]

### Assessment

| Criteria | Value |
|----------|-------|
| Severity | 🟠 High |
| Priority | P1 - Today |
| In Production | Yes |
| Users Affected | ~500 |
| Workaround | Partial (use different browser) |

### Details

**Description:**
Users cannot complete checkout when using saved payment method.

**Reproduction:**
1. Login with account that has saved card
2. Add item to cart
3. Go to checkout
4. Select saved payment method
5. Click "Pay" - error appears

**Error Message:**
"Payment method validation failed: invalid_card_token"

### Decision

**Path:** B (Standard Fix)
**Assigned To:** [Developer]
**Estimated Effort:** 2-3 hours
**Target Resolution:** Today EOD

### Notes

Similar to issue fixed last month (see bugs.md 2026-01-15).
May be related to recent payment provider API update.
```

---

## Escalation Criteria

### Escalate to Team Lead When

- Critical severity
- Unclear root cause after 2 hours
- Fix requires architectural changes
- Multiple systems affected
- Security implications

### Escalate to Product When

- Feature change needed to fix properly
- User communication required
- Workaround has significant UX impact
- Priority conflict with planned work

---

## Common Triage Mistakes

### Don't

- ❌ Assume severity without investigation
- ❌ Mark everything as Critical
- ❌ Skip documentation "to save time"
- ❌ Start fixing without understanding
- ❌ Ignore "low" severity bugs forever

### Do

- ✅ Reproduce before triaging
- ✅ Be honest about severity
- ✅ Document for future reference
- ✅ Consider business context
- ✅ Reassess if new info emerges
