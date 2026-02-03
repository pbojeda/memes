# Sprint Initialization Template

Use this template when running `init sprint N` to create a new sprint tracker.

---

## How to Initialize a Sprint

### Step 1: Create Sprint Tracker File

Copy `sprint-tracker.md` template to:
```
docs/project_notes/sprint-{N}-tracker.md
```

### Step 2: Populate from PLAN_DESARROLLO.md

Read the sprint section from `docs/PLAN_DESARROLLO.md` and extract:
- Sprint goal
- Backend tasks (B*.*)
- Frontend tasks (F*.*)
- Deliverables checklist

### Step 3: Set Dates

- Start Date: Current date or planned start
- End Date: Start + 2 weeks (sprint duration)

### Step 4: Start Working

Use "start task B0.1" to begin the first task. The sprint tracker's "Active Task" section will be updated automatically.

---

## Sprint Tracker Template

```markdown
# Sprint {N}: {Sprint Title}

**Goal:** {Goal from PLAN_DESARROLLO.md}
**Start Date:** YYYY-MM-DD
**End Date:** YYYY-MM-DD
**Status:** In Progress

---

## Progress Overview

Progress: [          ] 0%

Completed: 0/{total} tasks
In Progress: 0 tasks
Pending: {total} tasks
Blocked: 0 tasks

---

## Backend Tasks

| ID | Task | Priority | Status | Branch | Notes |
|----|------|----------|--------|--------|-------|
{backend_tasks}

---

## Frontend Tasks

| ID | Task | Priority | Status | Branch | Notes |
|----|------|----------|--------|--------|-------|
{frontend_tasks}

---

## Status Legend

| Icon | Status |
|------|--------|
| ⏳ | Pending |
| 🔄 | In Progress |
| ✅ | Completed |
| 🚫 | Blocked |

---

## Deliverables Checklist

{deliverables}

---

## Sprint Notes

_Key learnings, issues, or observations:_

---

*Created: YYYY-MM-DD*
*Last Updated: YYYY-MM-DD*
```

---

## Example: Initializing Sprint 0

### Input Command
```
init sprint 0
```

### Actions Performed

1. **Read PLAN_DESARROLLO.md** for Sprint 0 section:
   ```markdown
   ### Sprint 0: Project Setup & Infrastructure
   **Goal**: Establish project foundation and development environment.

   Backend Tasks: B0.1 - B0.10
   Frontend Tasks: F0.1 - F0.10
   ```

2. **Create file** `docs/project_notes/sprint-0-tracker.md`:
   ```markdown
   # Sprint 0: Project Setup & Infrastructure

   **Goal:** Establish project foundation and development environment.
   **Start Date:** 2026-02-02
   **End Date:** 2026-02-16
   **Status:** In Progress

   ## Backend Tasks

   | ID | Task | Priority | Status | Branch | Notes |
   |----|------|----------|--------|--------|-------|
   | B0.1 | Initialize Express + TypeScript project | High | ⏳ | | |
   | B0.2 | Configure Prisma with PostgreSQL | High | ⏳ | | |
   | B0.3 | Setup Pino logger | High | ⏳ | | |
   ...
   ```

3. **Sprint tracker ready** - Use "start task B0.1" to begin working

### Output
```
✅ Sprint 0 initialized

Tracker: docs/project_notes/sprint-0-tracker.md
Tasks: 10 backend + 10 frontend = 20 total
Duration: 2026-02-02 to 2026-02-16

Next: Run "start task B0.1" to begin first task
```

---

## Sprint Completion

When all tasks in a sprint are completed:

1. Update sprint tracker status to "Completed"
2. Calculate final metrics
3. Archive or keep for reference
4. Initialize next sprint if continuing

### Sprint Completion Checklist

- [ ] All tasks marked as ✅ Completed
- [ ] All deliverables checked off
- [ ] Sprint notes documented
- [ ] Metrics recorded
- [ ] Next sprint initialized (if applicable)
