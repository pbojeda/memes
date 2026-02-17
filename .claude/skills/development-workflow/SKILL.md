---
name: development-workflow
description: "Orchestrates the complete development workflow for each task. Invoke with: 'start task B0.1', 'show sprint progress', 'next task', or 'init sprint N'."
---

# Development Workflow Skill

## Quick Reference

1. **Setup** - Branch, ticket (Std/Cplx), sprint tracker → 🛑 TICKET APPROVAL
2. **Plan** - Planner agent writes implementation plan (Std/Cplx) → 🛑 PLAN APPROVAL
3. **Implement** - Developer agent, TDD, update docs
4. **Finalize** - Tests/lint/build, `production-code-validator`, summary → 🛑 COMMIT APPROVAL
5. **Review** - PR, `code-review-specialist` (Std/Cplx), human review → Merge

## Commands

- `start task B0.1` — Begin working on a specific task
- `next task` — Start the next pending task in current sprint
- `show sprint progress` — View sprint completion status
- `init sprint N` — Initialize a new sprint tracker

---

## Task Complexity

Ask user to classify complexity with **context-aware options** before starting. See `references/complexity-guide.md` for examples and how to ask.

### Workflow: Simple

1. Setup → Branch only
2. Plan → Skip
3. Implement → Direct implementation (TDD)
4. Finalize → Commit
5. Review → PR (auto-merge allowed)

### Workflow: Standard/Complex

1. Setup → Branch + Ticket + **User Review** (+ADR review for Complex)
2. Plan → Planner agent (`backend-planner` or `frontend-planner`) + **Plan Review**
3. Implement (`backend-developer` or `frontend-developer`) → Developer agent (TDD)
4. Finalize → `production-code-validator` + Commit
5. Review → PR + `code-review-specialist` + Human review

---

## Step 1: Setup

1. Verify sprint tracker exists (`docs/project_notes/sprint-X-tracker.md`)
2. Verify no active task in sprint tracker
3. Check dependencies are completed
4. Create feature branch: `feature/sprint<N>-<task-id>-<short-description>`
5. **Std/Cplx:** Generate ticket using `references/ticket-template.md`
   - Backend (B*.*): Apply standards from `/ai-specs/specs/backend-standards.mdc`
   - Frontend (F*.*): Apply standards from `/ai-specs/specs/frontend-standards.mdc`
   - Save to `docs/tickets/<task-id>-<short-description>.md`
6. **Complex:** Also review `decisions.md` for related ADRs
7. Update sprint tracker: task status → 🔄, Active Task → `1/5 (Setup)`

### 🛑 CHECKPOINT: TICKET APPROVAL REQUIRED (Std/Cplx only — Simple skips to Step 2b)

**Do NOT proceed to Step 2 until user explicitly approves.**
Ask: "Please review the ticket at `docs/tickets/[task-id].md`. Reply 'approved' to proceed."

---

## Step 2a: Plan (Standard/Complex only — Simple skips to 2b)

1. Use Task tool with planner agent:
   - Backend (B*.*) → `backend-planner`
   - Frontend (F*.*) → `frontend-planner`
2. Agent writes Implementation Plan into ticket's `## Implementation Plan` section
3. Update sprint tracker: Active Task → `2a/5 (Plan)`

### 🛑 CHECKPOINT: PLAN APPROVAL REQUIRED

**Do NOT proceed to Step 2b until user explicitly approves the plan.**
Ask: "Please review the Implementation Plan in `docs/tickets/[task-id].md`. Reply 'approved' to proceed."

---

## Step 2b: Implement

**Simple:** Implement directly following TDD principles.

**Std/Cplx:** Use Task tool with developer agent:
- Backend (B*.*) → `backend-developer`
- Frontend (F*.*) → `frontend-developer`

**TDD Cycle:** Write failing test → Minimum code to pass → Refactor → Repeat

**Update docs during development:**
- API endpoints → `api-spec.yaml` (then run `cd frontend && npm run generate:api`)
- DB schema changes → `data-model.md`
- New env variables → `.env.example`
- ADRs → `decisions.md`
- Use skill: `/update-docs`

---

## Step 3: Finalize

### Pre-commit checklist:
1. [ ] Tests pass: `npm test`
2. [ ] Lint passes: `npm run lint`
3. [ ] Build succeeds: `npm run build`

### >>> MANDATORY: RUN production-code-validator (Standard/Complex) <<<

Use the Task tool to launch the `production-code-validator` agent.
**Do NOT skip this step.** It catches debug code, TODOs, hardcoded values.

### Update ticket:
- Mark each acceptance criterion as `[x]`
- Mark each Definition of Done item as `[x]`
- **Never commit without updating the ticket first**

### Provide change summary to user:
- Files created (with purpose)
- Files modified (with what changed)
- Key points to review (security, breaking changes, dependencies)

### 🛑 CHECKPOINT: COMMIT APPROVAL REQUIRED

**Do NOT create commit until user acknowledges.**
Ask: "Ready to commit. Reply 'yes' to proceed or request changes."

**Commit format:** `<type>(<scope>): <description>` + body + `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
Types: feat, fix, docs, style, refactor, test, chore

---

## Step 4: Review

**Simple:** Push branch → Create PR → Auto-merge allowed if checks pass.

**Std/Cplx:**
1. Push branch
2. Create PR (use template from `references/pr-template.md`)

### >>> MANDATORY: RUN code-review-specialist <<<

Use the Task tool to launch the `code-review-specialist` agent.
**Do NOT skip this step.** It catches quality issues before human review.

3. **Wait for human review**
4. Address review comments if any
5. Get approval before merging

---

## Step 5: Complete

After PR is merged:
1. Delete feature branch (local and remote)
2. Update sprint tracker:
   - Task status → ✅
   - Add entry to Completion Log (date, task ID, commit hash, notes)
   - Update progress percentage
3. Record bugs fixed in `bugs.md`
4. Record decisions made in `decisions.md`

See `references/memory-integration.md` for full memory update checklist.

## Agents Reference

- `production-code-validator` — **Step 3:** Before commit (Std/Cplx)
- `code-review-specialist` — **Step 4:** Before merge (Std/Cplx)
- `database-architect` — Schema design, migrations, query optimization
- `backend-planner` — **Step 2a:** Implementation plan for backend (B*.*)
- `backend-developer` — **Step 2b:** TDD implementation for backend (B*.*)
- `frontend-planner` — **Step 2a:** Implementation plan for frontend (F*.*)
- `frontend-developer` — **Step 2b:** TDD implementation for frontend (F*.*)

## Templates & References

- `references/ticket-template.md` — Ticket format for Std/Cplx tasks
- `references/pr-template.md` — PR description template & merge process
- `references/sprint-init-template.md` — Initialize new sprints
- `references/complexity-guide.md` — How to ask about complexity with examples
- `references/memory-integration.md` — Memory system files & update rules
- `references/sprint-tracking.md` — Sprint tracker operational rules
- `references/task-checklist.md` — Detailed per-task checklist

## Constraints

- **One task at a time**: Never start a new task before completing current
- **TDD mandatory**: All code needs tests
- **Type safety**: All code fully typed (TypeScript, no `any`)
- **English only**: All technical artifacts in English
- **Memory first**: Always check `project_notes/` before changes
- **Sprint tracker**: Keep `sprint-X-tracker.md` updated at every step
- **Ticket first**: Std/Cplx requires ticket + user approval before coding
- **Human review**: Std/Cplx tasks require human PR review
- **Correct agents**: Backend → `backend-planner` + `backend-developer`, Frontend → `frontend-planner` + `frontend-developer`
