---
name: development-workflow
description: "Orchestrates the complete development workflow for each task in the project. Use this skill when starting work on a new task from PLAN_DESARROLLO.md, when you need to track progress on current sprint, or when onboarding team members to the development process. Invoke with: 'start task B0.1', 'show sprint progress', 'next task', 'workflow status', 'pause task', or 'resume task'."
---

# Development Workflow Skill

## Overview

This skill orchestrates the complete development lifecycle for each task, integrating with the project memory system for automatic traceability and using specialized agents for quality assurance.

## When to Use

| Command | Action |
|---------|--------|
| `start task B0.1` | Begin working on a specific task |
| `next task` | Start the next pending task in current sprint |
| `pause task` | Save progress and pause current work |
| `resume task` | Continue the paused task |
| `complete task` | Mark current task as done |
| `workflow status` | Show current task status |
| `show sprint progress` | View sprint completion status |
| `init sprint 0` | Initialize a new sprint tracker |

---

## State Management

### Current Task File

The file `docs/project_notes/current-task.md` always reflects the current state:

- **Active task** with step progress
- **Last completed** task
- **Session history** for time tracking

**Always update this file when:**
- Starting a task → Set as Active
- Changing steps → Update Current Step
- Pausing → Mark as Paused
- Completing → Move to Last Completed

### State Transitions

```
[No Task] --start--> [Active: Step 1]
                          |
                          v
[Active: Step N] --next step--> [Active: Step N+1]
                          |
                          +--pause--> [Paused]
                          |               |
                          |    <--resume--+
                          v
[Active: Step 7] --complete--> [No Task] + [Last Completed updated]
```

---

## Workflow Steps

### Step 1: Validate Task
Before starting any task from `docs/PLAN_DESARROLLO.md`:

**Actions:**
1. Check `docs/project_notes/current-task.md` for active task (must be empty)
2. Read the task from PLAN_DESARROLLO.md
3. Check `docs/project_notes/decisions.md` for related architectural decisions
4. Check `docs/project_notes/bugs.md` for known issues in this area
5. Verify dependencies are completed (check `docs/project_notes/issues.md`)

**Update current-task.md:**
```markdown
## Active Task

**Status:** Validating

| Field | Value |
|-------|-------|
| Task ID | B0.1 |
| Title | [Task title] |
| Sprint | 0 |
| Started | [timestamp] |
| Step | 1 of 8 (Validate) |
```

**Validation Checklist:**
- [ ] No other task in progress
- [ ] Task exists in PLAN_DESARROLLO.md
- [ ] No blocking dependencies
- [ ] No conflicting architectural decisions

**Output:** Confirmation or list of blockers

---

### Step 2: Create Branch
Create a feature branch for the task.

**Naming Convention:**
```
feature/sprint<N>-<task-id>-<short-description>
```

**Examples:**
- `feature/sprint0-B0.1-express-setup`
- `feature/sprint1-B1.2-auth-service`

**Command:**
```bash
git checkout -b feature/sprint0-B0.1-express-setup
```

**Update current-task.md:**
- Add Branch field
- Update Step to "2 of 8 (Branch)"

---

### Step 3: Generate Ticket
Generate a detailed work ticket with test specifications included.

**Use the appropriate skill:**
- Backend tasks (B*.*) → `/plan-backend-ticket <task-id>`
- Frontend tasks (F*.*) → `/plan-frontend-ticket <task-id>`

**Ticket MUST include:**
- Clear acceptance criteria
- Test specifications (TDD)
- Files to create/modify
- Dependencies and imports
- Implementation steps
- Definition of Done

**Save Ticket:**
- Save to `docs/tickets/<task-id>-<short-description>.md`
- Example: `docs/tickets/B0.1-express-setup.md`

**Auto-update Memory:**
- Add entry to `docs/project_notes/issues.md` with status "In Progress"
- Update `current-task.md` Step to "3 of 8 (Ticket)"

---

### Step 4: Develop (TDD)
Implement following strict Test-Driven Development.

**TDD Cycle:**
```
1. Write failing test → 2. Minimum code to pass → 3. Refactor → 4. Repeat
```

**Use the appropriate skill:**
- Backend tasks → `/develop-backend`
- Frontend tasks → `/develop-frontend`

**Use specialized agents when needed:**

| Situation | Agent |
|-----------|-------|
| Database schema design | `database-architect` |
| Complex backend logic | `backend-developer` |
| React components | `frontend-developer` |
| Code review needed | `code-review-specialist` |

**Update current-task.md:**
- Update Step to "4 of 8 (Develop)"
- Track TDD cycles in Current Step section

---

### Step 5: Validate Code
Run production validation before committing.

**Use Agent:** `production-code-validator`

**Checks:**
- No console.log or debug statements
- No TODO/FIXME comments
- No hardcoded credentials or URLs
- No placeholder code
- Proper error handling
- Type safety complete

**If issues found:** Fix before proceeding.

**Update current-task.md:**
- Update Step to "5 of 8 (Validate)"

---

### Step 6: Update Documentation (Conditional)
Only update docs when there are changes to:

| Change Type | Documentation to Update |
|-------------|------------------------|
| New API endpoints | `ai-specs/specs/api-spec.yaml` |
| Schema changes | `ai-specs/specs/data-model.md` |
| New env variables | `.env.example`, README |
| Setup changes | `README.md`, Development Guide |

**Use skill:** `/update-docs`

**Update current-task.md:**
- Update Step to "6 of 8 (Docs)"

---

### Step 7: Generate Commit
Create commit following conventional commits format.

**Format:**
```
<type>(<scope>): <description>

<body>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**Types:** feat, fix, docs, style, refactor, test, chore

**Auto-update Memory:**
- Update `docs/project_notes/issues.md` entry to "Completed"
- Add any bugs found to `docs/project_notes/bugs.md`
- Add any decisions made to `docs/project_notes/decisions.md`

**Update current-task.md:**
- Update Step to "7 of 8 (Commit)"

---

### Step 8: PR & Merge
Create pull request and merge to main branch.

**Actions:**
1. Push branch to remote
2. Create PR with description
3. Run `code-review-specialist` agent if complex changes
4. Address any review comments
5. Merge PR
6. Delete feature branch

**PR Description Template:**
```markdown
## Summary
[Brief description of changes]

## Task
- Task ID: [B0.1]
- Sprint: [0]

## Changes
- [List of changes]

## Testing
- [x] All tests passing
- [x] Validated with production-code-validator

## Checklist
- [ ] Code reviewed
- [ ] Documentation updated (if applicable)
- [ ] Ready to merge
```

**Update current-task.md:**
- Update Step to "8 of 8 (PR & Merge)"

**On Completion:**
- Clear Active Task section
- Update Last Completed section
- Add entry to Session History

---

## Memory System Integration

### Files Updated Automatically

| File | Updated When |
|------|--------------|
| `current-task.md` | Every step change, pause, resume, complete |
| `issues.md` | Task started (In Progress), Task completed (Completed) |
| `bugs.md` | Bug discovered and fixed during development |
| `decisions.md` | Architectural decision made during implementation |
| `key_facts.md` | New configuration or environment details added |
| `docs/tickets/*.md` | Ticket generated (Step 3) |

### Before Each Task
```
1. Read docs/project_notes/current-task.md → Verify no active task
2. Read docs/project_notes/decisions.md → Check for relevant decisions
3. Read docs/project_notes/bugs.md → Check for known issues
4. Read docs/project_notes/issues.md → Verify dependencies completed
```

### After Each Task
```
1. Update docs/project_notes/current-task.md → Clear active, update history
2. Update docs/project_notes/issues.md → Mark task completed
3. If bug fixed → Add to docs/project_notes/bugs.md
4. If decision made → Add to docs/project_notes/decisions.md
```

---

## Pause & Resume

### Pause Task

When you need to stop work temporarily:

1. Save current progress in `current-task.md`
2. Add notes about where you left off
3. Commit any work in progress (WIP commit if needed)

**Update current-task.md:**
```markdown
**Status:** Paused

### Paused At
- Step: 4 of 8 (Develop)
- Last action: Completed test for user validation
- Next action: Implement password hashing
- Notes: Need to research bcrypt vs argon2
```

### Resume Task

When continuing paused work:

1. Read `current-task.md` for context
2. Review where you left off
3. Continue from the saved step

**Update current-task.md:**
- Change Status back to "In Progress"
- Update Session History with resume timestamp

---

## Sprint Tracking

### Initialize New Sprint

When starting a new sprint:

1. Create sprint tracker from `references/sprint-tracker.md`
2. Save as `docs/project_notes/sprint-N-tracker.md`
3. Populate with tasks from PLAN_DESARROLLO.md

### View Current Sprint Progress

Read sprint tracker and cross-reference with `issues.md` to show:
- ✅ Completed tasks
- 🔄 In-progress tasks
- ⏳ Pending tasks
- 🚫 Blocked tasks

---

## Agents Reference

| Agent | Use When |
|-------|----------|
| `production-code-validator` | Before every commit (Step 5) |
| `code-review-specialist` | Complex implementations, PR reviews |
| `database-architect` | Schema design, migrations, query optimization |
| `backend-developer` | DDD patterns, service implementation |
| `frontend-developer` | React components, state management |

---

## Templates & References

| Document | Purpose |
|----------|---------|
| `references/task-checklist.md` | Checklist for each task |
| `references/sprint-tracker.md` | Sprint progress tracking |
| `references/sprint-init-template.md` | How to initialize new sprints |
| `references/ticket-template.md` | Detailed ticket format |
| `references/pr-template.md` | Pull request process and template |
| `references/workflow-example.md` | Complete step-by-step example |
| `references/failure-handling.md` | Error handling and rollback guide |
| `references/skills-integration.md` | How skills and agents connect |
| `references/metrics-tracking.md` | Time and metrics tracking |
| `references/automation-hooks.md` | Automation and hooks guide |

---

## Examples

See `references/workflow-example.md` for a complete step-by-step example.

---

## Constraints

- **One task at a time**: Never start a new task before completing current
- **TDD mandatory**: No code without tests first
- **Type safety**: All code fully typed (TypeScript)
- **English only**: All technical artifacts in English
- **Memory first**: Always check project_notes before changes
- **State always current**: Keep current-task.md updated at every step
