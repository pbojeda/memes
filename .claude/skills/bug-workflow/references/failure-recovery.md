# Failure Recovery Guide

## Common Failures

| Type | Cause | Action |
|------|-------|--------|
| Test Failure | Code bug | Fix code, not test |
| Validation Failure | Debug code, TODOs | Fix all issues |
| Build Failure | Type errors | Fix types first |
| Blocked | Dependency | Document, switch task or mock |

---

## Git Rollback Commands

**Undo last commit (not pushed):**
```bash
git reset --soft HEAD~1  # Keep changes staged
git reset --hard HEAD~1  # Discard changes
```

**Revert pushed commit:**
```bash
git revert <commit-hash>
git push
```

**Discard branch changes:**
```bash
git checkout main
git branch -D feature/branch-name
git checkout -b feature/branch-name  # Start fresh
```

---

## Database Rollback

```bash
npx prisma migrate reset        # Reset to initial
npx prisma migrate deploy       # Reapply migrations
```

---

## When to Abandon Task

- Requirements changed significantly
- Better approach identified
- Blocking issue unresolvable

**Process:**
1. Document reason in sprint tracker
2. Save useful work (stash/branch)
3. Update task status
4. Create replacement task if needed
