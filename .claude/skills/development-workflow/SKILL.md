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

### Sprint Tracker (Single Source of Truth)

The file `docs/project_notes/sprint-X-tracker.md` (where X is the current sprint number) always reflects the current state:

- **Active Task** section with step progress
- **Task status** in the task tables
- **Completion Log** for finished tasks

**Always update the sprint tracker when:**
- Starting a task → Update "Active Task" section and task status to 🔄
- Changing steps → Update step in "Active Task" section
- Pausing → Mark as Paused in "Active Task" section
- Completing → Clear "Active Task", update task status to ✅, add to "Completion Log"

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
1. Check sprint tracker's "Active Task" section (must show "No active task")
2. Read the task from PLAN_DESARROLLO.md
3. Check `docs/project_notes/decisions.md` for related architectural decisions
4. Check `docs/project_notes/bugs.md` for known issues in this area
5. Verify dependencies are completed (check sprint tracker task status)

**Update sprint tracker "Active Task" section:**
```markdown
## Active Task

**Status:** In Progress

| Field | Value |
|-------|-------|
| Task | B0.1 - Initialize Express + TypeScript project |
| Branch | feature/sprint0-B0.1-express-setup |
| Step | 1/8 (Validate) |
| Ticket | [B0.1-express-setup.md](../tickets/B0.1-express-setup.md) |
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

**Update sprint tracker:**
- Add Branch field in "Active Task" section
- Update Step to "2/8 (Branch)"

---

### Step 3: Generate Ticket
Generate a detailed work ticket following the template.

**For backend tasks (B*.*)**:
- Adopt the role of `.claude/agents/backend-developer.md`
- Apply DDD and backend best practices from `/ai-specs/specs`

**For frontend tasks (F*.*)**:
- Adopt the role of `.claude/agents/frontend-developer.md`
- Apply React/Next.js and frontend best practices from `/ai-specs/specs`

**Rules:**
- Do not write code yet; provide only the plan
- The ticket must be detailed enough for autonomous implementation
- Use template from `references/ticket-template.md`

**Save Ticket:**
- Save to `docs/tickets/<task-id>-<short-description>.md`
- Example: `docs/tickets/B0.1-express-setup.md`

**Update sprint tracker:**
- Update "Active Task" section Step to "3/8 (Ticket)"
- Update task status in table to 🔄 (In Progress)

**⏸️ WAIT FOR USER REVIEW before proceeding to Step 4.**

---

### Step 4: Develop (TDD)
Implement following strict Test-Driven Development.

**TDD Cycle:**
```
1. Write failing test → 2. Minimum code to pass → 3. Refactor → 4. Repeat
```

**IMPORTANT: Use the Task tool with the appropriate agent:**
- Backend tasks (B*.*) → Use `backend-developer` agent
- Frontend tasks (F*.*) → Use `frontend-developer` agent

**Additional specialized agents:**

| Situation | Agent |
|-----------|-------|
| Database schema design | `database-architect` |
| Code review (Standard/Complex tasks) | `code-review-specialist` |
| Production validation | `production-code-validator` |

**Update sprint tracker:**
- Update "Active Task" section Step to "4/8 (Develop)"

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

**Update sprint tracker:**
- Update "Active Task" section Step to "5/8 (Validate)"

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

**Update sprint tracker:**
- Update "Active Task" section Step to "6/8 (Docs)"

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

**Update sprint tracker:**
- Update "Active Task" section Step to "7/8 (Commit)"
- Add any bugs found to `docs/project_notes/bugs.md`
- Add any decisions made to `docs/project_notes/decisions.md`

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

**Update sprint tracker:**
- Update "Active Task" section Step to "8/8 (PR & Merge)"

**On Completion:**
- Clear "Active Task" section (set to "No active task")
- Update task status in table to ✅
- Add entry to "Completion Log" with date, task ID, commit hash, and notes

---

## Memory System Integration

### Files Updated Automatically

| File | Updated When |
|------|--------------|
| `sprint-X-tracker.md` | Every step change, pause, resume, complete, task status |
| `bugs.md` | Bug discovered and fixed during development |
| `decisions.md` | Architectural decision made during implementation |
| `key_facts.md` | New configuration or environment details added |
| `docs/tickets/*.md` | Ticket generated (Step 3) |

### Before Each Task
```
1. Read docs/project_notes/sprint-X-tracker.md → Verify no active task
2. Read docs/project_notes/decisions.md → Check for relevant decisions
3. Read docs/project_notes/bugs.md → Check for known issues
4. Check sprint tracker task tables → Verify dependencies completed
```

### After Each Task
```
1. Update sprint tracker → Clear "Active Task", update task status to ✅
2. Update sprint tracker → Add entry to "Completion Log"
3. If bug fixed → Add to docs/project_notes/bugs.md
4. If decision made → Add to docs/project_notes/decisions.md
```

---

## Pause & Resume

### Pause Task

When you need to stop work temporarily:

1. Save current progress in sprint tracker "Active Task" section
2. Add notes about where you left off
3. Commit any work in progress (WIP commit if needed)

**Update sprint tracker "Active Task" section:**
```markdown
**Status:** Paused

| Field | Value |
|-------|-------|
| Task | B0.1 - Initialize Express + TypeScript project |
| Branch | feature/sprint0-B0.1-express-setup |
| Step | 4/8 (Develop) - Paused |
| Ticket | [B0.1-express-setup.md](../tickets/B0.1-express-setup.md) |

_Paused at: Completed test for user validation. Next: Implement password hashing._
```

### Resume Task

When continuing paused work:

1. Read sprint tracker "Active Task" section for context
2. Review where you left off
3. Continue from the saved step

**Update sprint tracker:**
- Change Status back to "In Progress"
- Update step progress

---

## Sprint Tracking

### Initialize New Sprint

When starting a new sprint:

1. Create sprint tracker from `references/sprint-init-template.md`
2. Save as `docs/project_notes/sprint-N-tracker.md`
3. Populate with tasks from PLAN_DESARROLLO.md

### View Current Sprint Progress

Read sprint tracker to see:
- ✅ Completed tasks
- 🔄 In-progress tasks (check "Active Task" section)
- ⏳ Pending tasks
- 🚫 Blocked tasks

The sprint tracker is the single source of truth for all task status.

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
| `references/ticket-template.md` | Template for creating task tickets |
| `references/sprint-init-template.md` | How to initialize new sprints |
| `references/sprint-tracker.md` | Sprint progress tracking format |
| `references/pr-template.md` | Pull request process and template |
| `references/task-checklist.md` | Checklist for each task |
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
- **Sprint tracker is source of truth**: Keep sprint-X-tracker.md updated at every step
- **User review required**: ALWAYS wait for user review after generating tickets (Step 3) before proceeding to development (Step 4)
- **Adopt correct role**: Backend tasks adopt `backend-developer` role, frontend tasks adopt `frontend-developer` role
- **Use ticket template**: Always use `references/ticket-template.md` for local tickets
