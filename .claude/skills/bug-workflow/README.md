# Bug Workflow Skill

## Overview

This skill manages the complete bug lifecycle from discovery to resolution, with proper documentation and prevention measures.

---

## Quick Start

### Report a Bug
```
"report bug: users can't login with special characters in password"
```

### Fix a Known Bug
```
"fix bug: session token validation"
```

### Emergency Hotfix
```
"hotfix needed: production auth is down"
```

---

## Workflow Paths

| Path | When | Duration |
|------|------|----------|
| **A: Quick Fix** | Low/Medium bugs | 30 min - 2h |
| **B: Standard Fix** | Medium/High bugs | 2 - 8h |
| **C: Hotfix** | Critical in production | < 1h |
| **D: Escalate** | Complex bugs | → development-workflow |

---

## Severity Guide

| Level | Icon | Response Time | Example |
|-------|------|---------------|---------|
| Critical | 🔴 | Immediate | Production down |
| High | 🟠 | Same day | Major feature broken |
| Medium | 🟡 | This sprint | Feature impaired |
| Low | 🟢 | Backlog | Cosmetic issue |

---

## Process Overview

```
┌─────────────┐
│   DETECT    │  Found bug
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   TRIAGE    │  Assess severity & priority
└──────┬──────┘
       │
       ├─── Critical? ──► HOTFIX PATH
       │
       ▼
┌─────────────┐
│ INVESTIGATE │  Find root cause
└──────┬──────┘
       │
       ├─── Complex? ──► ESCALATE to development-workflow
       │
       ▼
┌─────────────┐
│  FIX (TDD)  │  Write test, then fix
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  VALIDATE   │  production-code-validator
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  DOCUMENT   │  Update bugs.md
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   COMMIT    │  fix(area): description
└─────────────┘
```

---

## Key Files

### Skill Files

| File | Purpose |
|------|---------|
| `SKILL.md` | Main workflow definition |
| `references/bug-triage.md` | How to assess severity |
| `references/investigation.md` | How to find root cause |
| `references/hotfix-process.md` | Emergency fix process |

### Memory Files

| File | Updated When |
|------|--------------|
| `docs/project_notes/bugs.md` | Every bug (always) |
| `docs/project_notes/sprint-X-tracker.md` | Bug in progress (Active Task section) |

---

## Branch Naming

| Type | Convention | Example |
|------|------------|---------|
| Standard bug | `bugfix/<area>-<desc>` | `bugfix/auth-token-encoding` |
| Hotfix | `hotfix/<desc>` | `hotfix/critical-login-fix` |

---

## Commit Format

```
fix(<area>): <description>

<What was the bug>
<Root cause>
<How it was fixed>

Fixes #issue (if applicable)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

---

## Integration with Development Workflow

| Scenario | Workflow to Use |
|----------|-----------------|
| New feature | development-workflow |
| Planned task | development-workflow |
| Bug found | **bug-workflow** |
| Bug is complex | bug-workflow → escalate → development-workflow |
| Bug during task | Pause task → bug-workflow → Resume task |

---

## Documentation Template

Every bug should be documented in `bugs.md`:

```markdown
### YYYY-MM-DD - Brief Title

- **Severity:** Critical / High / Medium / Low
- **Area:** Component or feature
- **Issue:** What went wrong
- **Root Cause:** Why it happened
- **Solution:** How it was fixed
- **Prevention:** How to avoid in future
- **Commit:** Hash or PR
- **Time to Fix:** Duration
```

---

## Quick Reference

### Commands

| Say | To |
|-----|----|
| "report bug: ..." | Document new bug |
| "triage bug" | Assess severity |
| "investigate bug" | Find root cause |
| "fix bug" | Resolve the bug |
| "hotfix needed" | Emergency fix |

### Checklists

- **Triage:** `references/bug-triage.md`
- **Investigation:** `references/investigation.md`
- **Hotfix:** `references/hotfix-process.md`

---

## Tips

1. **Always reproduce first** - Don't fix what you haven't seen
2. **Find root cause** - Treat disease, not symptoms
3. **Write test first** - Prove you understand the bug
4. **Document always** - Future you will thank you
5. **Prevent recurrence** - Add tests, validation, monitoring
