---
name: development-workflow
description: "Orchestrates the complete development workflow for each task. Invoke with: 'start task B0.1', 'show sprint progress', 'next task', 'pause task', or 'resume task'."
---

# Development Workflow Skill

## Overview

This skill orchestrates the development lifecycle for each task, integrating with the project memory system and using specialized agents for quality assurance.

## Commands

| Command | Action |
|---------|--------|
| `start task B0.1` | Begin working on a specific task |
| `next task` | Start the next pending task in current sprint |
| `pause task` | Save progress and pause current work |
| `resume task` | Continue a paused task |
| `show sprint progress` | View sprint completion status |
| `init sprint N` | Initialize a new sprint tracker |

---

## Task Complexity

**IMPORTANT:** Before starting any task, ask the user to classify its complexity:

```
"¿Qué complejidad tiene esta tarea?"
- Simple (instalar librería, config básica, copiar template)
- Standard (nuevo endpoint, componente, feature pequeña)
- Complex (feature completa, refactor significativo, integración externa)
```

### Workflow by Complexity

| Step | Simple | Standard | Complex |
|------|--------|----------|---------|
| 1. Setup | Branch only | Branch + Ticket | Branch + Ticket + ADR review |
| 2. Develop | Direct implementation | TDD with `/develop-*` skill | TDD with `/develop-*` skill |
| 3. Finalize | Update ticket + Commit | Validate + Update ticket + Commit | Validate + Update ticket + Commit |
| 4. Review | PR (auto-merge allowed) | PR + `code-review-specialist` + Human review | PR + `code-review-specialist` + Human review |
| 5. Complete | Merge + Update tracker | Merge + Update tracker | Merge + Update tracker |

### Skills Usage by Complexity

| Complexity | Planning Skill | Development Skill | code-review-specialist |
|------------|----------------|-------------------|------------------------|
| Simple | ❌ Skip | ❌ Direct implementation | ❌ Skip |
| Standard | ✅ `/plan-backend-ticket` or `/plan-frontend-ticket` | ✅ `/develop-backend` or `/develop-frontend` | ✅ Required |
| Complex | ✅ Required + ADR review | ✅ Required | ✅ Required |

---

## Workflow Steps (5 Steps)

### Step 1: Setup

**Actions:**
1. Verify no active task in sprint tracker
2. Check dependencies are completed
3. Create feature branch: `feature/sprint<N>-<task-id>-<short-description>`
4. **For Standard/Complex:** Generate ticket using appropriate skill
5. **For Complex:** Review `decisions.md` for related architectural decisions
6. Update sprint tracker: task status to 🔄

**Branch naming:**
```
feature/sprint0-B0.1-express-setup
feature/sprint1-F1.2-login-page
```

---

### Step 2: Develop

**For Simple tasks:**
- Implement directly following TDD principles
- Write tests for the configuration/setup

**For Standard/Complex tasks:**
- Use `/develop-backend` or `/develop-frontend` skill
- Follow strict TDD: Red → Green → Refactor
- Update documentation during development (not after):
  - New API endpoints → `api-spec.yaml`
  - Schema changes → `data-model.md`
  - New env variables → `.env.example`

**Agents to use when needed:**

| Situation | Agent |
|-----------|-------|
| Database schema design | `database-architect` |
| Complex backend logic | `backend-developer` |
| React components | `frontend-developer` |

---

### Step 3: Finalize

**Before committing, verify:**
1. Tests pass: `npm test`
2. Lint passes: `npm run lint`
3. Build succeeds: `npm run build`
4. **For Standard/Complex:** Run `production-code-validator`

**Update ticket:**
- Mark each acceptance criterion as `[x]` when verified
- Mark each Definition of Done item as `[x]`
- **Never commit without updating the ticket first**

**Create commit:**
```
<type>(<scope>): <description>

<body>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

Types: feat, fix, docs, style, refactor, test, chore

---

### Step 4: Review

**For Simple tasks:**
- Push branch
- Create PR
- Auto-merge allowed if all checks pass

**For Standard/Complex tasks:**
1. Push branch
2. Create PR with description
3. Run `code-review-specialist` agent
4. **Wait for human review** (this is a team project)
5. Address review comments if any
6. Get approval before merging

**PR Description Template:**
```markdown
## Summary
[Brief description of changes]

## Task
- Task ID: [B0.1]
- Sprint: [0]
- Complexity: [Simple/Standard/Complex]

## Changes
- [List of changes]

## Testing
- [x] All tests passing
- [x] Lint passing
- [x] Build succeeds
- [x] Validated with production-code-validator (if Standard/Complex)

## Checklist
- [ ] Ticket acceptance criteria updated
- [ ] Code reviewed
- [ ] Ready to merge
```

---

### Step 5: Complete

**After PR is merged:**
1. Delete feature branch (local and remote)
2. Update sprint tracker:
   - Mark task status as ✅
   - Add entry to Completion Log with date, task ID, commit hash, and notes
   - Update progress percentage
3. Record any bugs fixed in `bugs.md`
4. Record any decisions made in `decisions.md`

---

## Pause & Resume

### Pause Task

When you need to stop work temporarily:

1. Commit any work in progress (WIP commit if needed)
2. Update sprint tracker with pause context:

```markdown
## Paused Task

| Field | Value |
|-------|-------|
| Task | B0.1 - Initialize Express + TypeScript project |
| Branch | feature/sprint0-B0.1-express-setup |
| Paused At | Step 2 (Develop) |
| Context | Completed user validation tests. Next: implement password hashing |
```

### Resume Task

When continuing paused work:
1. Read sprint tracker for context
2. Checkout the branch
3. **Continue with the same agent** that was working on it
4. Clear the "Paused Task" section when resuming

---

## Sprint Tracking

### Single Source of Truth

The sprint tracker (`docs/project_notes/sprint-X-tracker.md`) contains:
- Task status in tables (⏳ Pending, 🔄 In Progress, ✅ Completed, 🚫 Blocked)
- Completion Log with all finished tasks
- Paused Task section (only when a task is paused)

### Initialize New Sprint

1. Use template from `references/sprint-init-template.md`
2. Save as `docs/project_notes/sprint-N-tracker.md`
3. Populate with tasks from `PLAN_DESARROLLO.md`

---

## Agents Reference

| Agent | When to Use |
|-------|-------------|
| `production-code-validator` | Before commit (Standard/Complex tasks) |
| `code-review-specialist` | Before merge (Standard/Complex tasks) |
| `database-architect` | Schema design, migrations, query optimization |
| `backend-developer` | DDD patterns, service implementation |
| `frontend-developer` | React components, state management |

---

## Templates

| Document | Purpose |
|----------|---------|
| `references/ticket-template.md` | Ticket format for Standard/Complex tasks |
| `references/sprint-init-template.md` | Initialize new sprints |
| `references/pr-template.md` | PR process and body template |

---

## Constraints

- **One task at a time**: Never start a new task before completing or pausing current
- **TDD mandatory**: All code needs tests
- **Type safety**: All code fully typed (TypeScript)
- **English only**: All technical artifacts in English
- **Ticket first**: Always update ticket before committing
- **Human review**: Standard/Complex tasks require human PR review
