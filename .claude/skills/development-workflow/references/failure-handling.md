# Failure Handling & Rollback Guide

## Types of Failures

| Failure Type | When It Happens | Severity |
|--------------|-----------------|----------|
| Test Failure | Tests don't pass | Medium |
| Validation Failure | production-code-validator finds issues | Medium |
| Build Failure | Code doesn't compile | High |
| Dependency Block | Waiting on another task | Low |
| External Block | Waiting on external resource | Medium |
| Critical Bug | Discovered during development | High |
| Scope Creep | Task is bigger than expected | Medium |

---

## Failure Recovery Procedures

### Test Failure

**Symptoms:**
- One or more tests failing
- New code breaks existing tests

**Recovery:**
1. **Identify** failing tests
2. **Analyze** root cause
3. **Fix** the code (not the test, unless test is wrong)
4. **Re-run** all tests
5. **Continue** workflow

**Update current-task.md:**
```markdown
### Issue Encountered
- Type: Test Failure
- Details: UserService.create test failing
- Cause: Missing validation for email format
- Resolution: Added email validation
- Time Lost: 30 minutes
```

**Do NOT:**
- Skip failing tests
- Delete tests to make them pass
- Disable tests temporarily

---

### Validation Failure (production-code-validator)

**Symptoms:**
- Validator reports CRITICAL or HIGH issues
- Code not production-ready

**Recovery:**
1. **Review** all issues reported
2. **Prioritize** by severity (CRITICAL first)
3. **Fix** each issue
4. **Re-run** validator
5. **Continue** only when clean

**Common Fixes:**

| Issue | Fix |
|-------|-----|
| console.log | Remove or use proper logger |
| TODO/FIXME | Complete the task or create new ticket |
| Hardcoded URL | Use environment variable |
| Hardcoded secret | Use secrets manager |
| Empty catch block | Add proper error handling |

**Update current-task.md:**
```markdown
### Issue Encountered
- Type: Validation Failure
- Issues Found: 3 (1 HIGH, 2 MEDIUM)
- Resolution: Fixed all issues
- Time Added: 45 minutes
```

---

### Build/Compile Failure

**Symptoms:**
- TypeScript errors
- Import errors
- Type mismatches

**Recovery:**
1. **Read** error messages carefully
2. **Fix** type errors first
3. **Check** imports and paths
4. **Rebuild** incrementally
5. **Run** tests after fix

**Common TypeScript Fixes:**

```typescript
// Missing type
const data: unknown = fetchData();
const data: UserData = fetchData(); // Fixed

// Type mismatch
function process(id: string) {}
process(123); // Error
process(String(123)); // Fixed

// Missing property
interface User { name: string; email: string; }
const user: User = { name: 'John' }; // Error
const user: User = { name: 'John', email: 'john@example.com' }; // Fixed
```

---

### Dependency Block

**Symptoms:**
- Task requires another task to be completed first
- External API not available
- Team member's work not ready

**Recovery:**
1. **Identify** the blocking task/resource
2. **Document** the block in current-task.md
3. **Options:**
   - Wait for blocker to resolve
   - Switch to different task
   - Create mock/stub to continue

**Update current-task.md:**
```markdown
### Status: Blocked

### Blocked By
- Task: B0.2 (Configure Prisma)
- Reason: Need database schema before implementing repository
- Estimated Unblock: 2026-02-03

### Workaround Attempted
- Created in-memory mock for testing
- Can continue with service logic
```

**Update sprint tracker:**
- Change task status to 🚫 Blocked
- Add blocker note

---

### Critical Bug Discovered

**Symptoms:**
- Bug in existing code discovered during development
- Bug blocks current task
- Bug affects other parts of system

**Recovery:**
1. **Document** the bug immediately
2. **Assess** impact and priority
3. **Decide:**
   - Fix now (if blocking current task)
   - Create ticket for later (if not blocking)
4. **If fixing:** Complete fix before continuing task

**Update bugs.md:**
```markdown
### 2026-02-02 - Critical: User session not persisting
- **Discovered During:** B0.1 development
- **Impact:** HIGH - affects all authenticated users
- **Root Cause:** Cookie not set with correct domain
- **Solution:** Updated cookie configuration
- **Prevention:** Add session persistence test
```

**Update current-task.md:**
```markdown
### Issue Encountered
- Type: Critical Bug
- Bug ID: Added to bugs.md
- Impact on Task: Delayed by 2 hours
- Resolution: Fixed before continuing
```

---

### Scope Creep

**Symptoms:**
- Task is bigger than originally estimated
- Discovering hidden complexity
- Requirements unclear or expanding

**Recovery:**
1. **Stop** expanding scope
2. **Document** what was discovered
3. **Options:**
   - Complete minimal viable task
   - Split into multiple tasks
   - Discuss with team

**Update current-task.md:**
```markdown
### Scope Change
- Original Scope: Simple Express setup
- Discovered: Need to handle CORS, compression, security headers
- Decision: Split into B0.1a (basic) and B0.1b (middleware)
- New Tasks Created: B0.1b added to sprint tracker
```

**Update sprint tracker:**
- Add new task if splitting
- Update notes for original task

---

## Rollback Procedures

### When to Rollback

- Breaking changes merged to main
- Critical bug in production
- Failed deployment
- Data corruption

### Git Rollback

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

**Rollback to specific commit:**
```bash
git checkout <commit-hash>
# Create new branch from here if needed
git checkout -b rollback-branch
```

### Feature Branch Rollback

**Discard all changes and start fresh:**
```bash
git checkout main
git branch -D feature/sprint0-B0.1-express-setup
git checkout -b feature/sprint0-B0.1-express-setup
```

**Reset to last known good state:**
```bash
git log --oneline  # Find good commit
git reset --hard <good-commit-hash>
```

### Database Rollback

**Prisma migrations:**
```bash
npx prisma migrate reset  # Reset to initial state
npx prisma migrate deploy # Reapply migrations
```

**Specific migration rollback:**
```bash
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## Task Abandonment

### When to Abandon a Task

- Requirements changed significantly
- Task is no longer needed
- Better approach identified
- Blocking issue unresolvable

### Abandonment Process

1. **Document** reason in current-task.md
2. **Save** any useful work (stash or branch)
3. **Update** sprint tracker to ❌ Abandoned
4. **Clean up** branch
5. **Create** replacement task if needed

**Update current-task.md:**
```markdown
## Abandoned Task

| Field | Value |
|-------|-------|
| Task ID | B0.1 |
| Reason | Switching to Fastify instead of Express |
| Work Saved | branch: archive/B0.1-express-attempt |
| Replacement | B0.1-new: Initialize Fastify + TypeScript |
| Decision | ADR-001 added to decisions.md |
```

**Update decisions.md:**
```markdown
### ADR-001: Use Fastify instead of Express (2026-02-02)

**Context:**
- Started implementing Express server
- Discovered performance requirements need faster framework

**Decision:**
- Switch to Fastify for better performance

**Consequences:**
- ✅ Better performance
- ❌ Some middleware needs replacement
- ❌ Work on B0.1 (Express) abandoned
```

---

## Status Codes Reference

| Status | Icon | Meaning | Action |
|--------|------|---------|--------|
| In Progress | 🔄 | Normal work | Continue |
| Paused | ⏸️ | Temporarily stopped | Can resume |
| Blocked | 🚫 | Waiting on dependency | Resolve block |
| Failed | ❌ | Critical failure | Rollback/fix |
| Abandoned | 🗑️ | No longer needed | Clean up |
| Completed | ✅ | Successfully done | Next task |

---

## Prevention Strategies

### Avoid Test Failures
- Write tests first (TDD)
- Run tests frequently
- Use watch mode during development

### Avoid Validation Failures
- Use linter during development
- Check code before commit
- Follow code standards from start

### Avoid Blocks
- Check dependencies before starting
- Communicate with team early
- Use mocks when possible

### Avoid Scope Creep
- Understand requirements fully before starting
- Ask questions early
- Timebox exploration

---

## Emergency Contacts

| Situation | Action |
|-----------|--------|
| Production down | Alert team lead immediately |
| Data corruption | Stop all writes, assess damage |
| Security breach | Follow security incident process |
| Unresolvable block | Escalate to project manager |
