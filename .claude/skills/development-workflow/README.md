# Development Workflow Skill

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Workflow Diagram](#workflow-diagram)
- [Detailed Steps](#detailed-steps)
- [Memory System Integration](#memory-system-integration)
- [Agents and Skills Reference](#agents-and-skills-reference)
- [Sprint Management](#sprint-management)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

---

## Overview

This skill provides a structured, traceable development workflow that:

- Ensures consistent task execution across the team
- Integrates with the project memory system for automatic documentation
- Enforces TDD practices
- Uses specialized agents for quality assurance
- Tracks progress at task and sprint level

---

## Quick Start

### Start a New Task
```
User: "Start task B0.1"
```

### Check Sprint Progress
```
User: "Show sprint 0 progress"
```

### Move to Next Task
```
User: "Next task"
```

### Get Workflow Status
```
User: "Workflow status"
```

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT WORKFLOW                          │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 1. VALIDATE TASK                                                     │
│    ├─ Read task from PLAN_DESARROLLO.md                             │
│    ├─ Check decisions.md for conflicts                              │
│    ├─ Check bugs.md for known issues                                │
│    └─ Verify dependencies in sprint tracker                         │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. CREATE BRANCH                                                     │
│    └─ git checkout -b feature/sprint<N>-<task-id>-<description>     │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. GENERATE TICKET                                                   │
│    ├─ Backend → /plan-backend-ticket                                │
│    ├─ Frontend → /plan-frontend-ticket                              │
│    └─ Update sprint tracker → Task status: 🔄                       │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. DEVELOP (TDD)                                                     │
│    ┌──────────────────────────────────────────────┐                 │
│    │  Write Test → Implement → Refactor → Repeat  │                 │
│    └──────────────────────────────────────────────┘                 │
│    ├─ Backend → /develop-backend                                    │
│    ├─ Frontend → /develop-frontend                                  │
│    └─ Use agents: database-architect, backend/frontend-developer    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. VALIDATE CODE                                                     │
│    └─ Agent: production-code-validator                              │
│       ├─ No console.log/debug                                       │
│       ├─ No TODO/FIXME                                              │
│       ├─ No hardcoded secrets                                       │
│       └─ Proper error handling                                      │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. UPDATE DOCS (if needed)                                           │
│    ├─ API changes → api-spec.yaml                                   │
│    ├─ Schema changes → data-model.md                                │
│    └─ /update-docs                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 7. COMMIT                                                            │
│    ├─ Generate conventional commit message                          │
│    └─ Update sprint tracker → Task status: ✅, Completion Log       │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                            [Next Task]
```

---

## Detailed Steps

### Step 1: Validate Task

**Purpose:** Ensure the task is ready to be worked on.

**Actions:**

1. **Read the task** from `docs/PLAN_DESARROLLO.md`
   ```
   Find task by ID (e.g., B0.1, F1.3)
   ```

2. **Check architectural decisions**
   ```
   Read docs/project_notes/decisions.md
   Search for related ADRs
   ```

3. **Check known bugs**
   ```
   Read docs/project_notes/bugs.md
   Search for issues in the same area
   ```

4. **Verify dependencies**
   ```
   Read sprint tracker task tables
   Confirm blocking tasks are completed (status: ✅)
   ```

**Output:** Either "Task validated, ready to proceed" or a list of blockers.

---

### Step 2: Create Branch

**Purpose:** Isolate work in a feature branch.

**Naming Convention:**
```
feature/sprint<sprint-number>-<task-id>-<short-description>
```

**Examples:**
| Task | Branch Name |
|------|-------------|
| B0.1 | `feature/sprint0-B0.1-express-setup` |
| B1.2 | `feature/sprint1-B1.2-auth-service` |
| F3.1 | `feature/sprint3-F3.1-product-catalog` |

**Commands:**
```bash
# Create and switch to branch
git checkout -b feature/sprint0-B0.1-express-setup

# Verify
git branch --show-current
```

---

### Step 3: Generate Ticket

**Purpose:** Create a detailed work specification with test requirements.

**Skill Selection:**
| Task Type | Skill | Example |
|-----------|-------|---------|
| Backend (B*.*) | `/plan-backend-ticket` | B0.1, B1.5 |
| Frontend (F*.*) | `/plan-frontend-ticket` | F0.1, F2.3 |

**Ticket Must Include:**
- [ ] Clear description of what to implement
- [ ] Acceptance criteria (definition of done)
- [ ] Test specifications (what tests to write)
- [ ] Files to create or modify
- [ ] Dependencies and imports needed

**Sprint Tracker Update:**
Update sprint tracker:
- Set task status to 🔄 (In Progress) in the task table
- Update "Active Task" section with task details

---

### Step 4: Develop (TDD)

**Purpose:** Implement the task following Test-Driven Development.

**TDD Cycle:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│    ┌─────────┐    ┌──────────┐    ┌──────────┐     │
│    │  RED    │───▶│  GREEN   │───▶│ REFACTOR │──┐  │
│    │ (Test)  │    │ (Code)   │    │          │  │  │
│    └─────────┘    └──────────┘    └──────────┘  │  │
│         ▲                                       │  │
│         └───────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

1. **RED**: Write a failing test
2. **GREEN**: Write minimum code to make test pass
3. **REFACTOR**: Improve code quality
4. **REPEAT**: Next test case

**Skill Selection:**
| Task Type | Skill |
|-----------|-------|
| Backend | `/develop-backend` |
| Frontend | `/develop-frontend` |

**Agent Selection:**
| Situation | Agent to Use |
|-----------|--------------|
| Database schema, migrations | `database-architect` |
| Complex DDD implementation | `backend-developer` |
| React components, hooks | `frontend-developer` |
| Need code review | `code-review-specialist` |

---

### Step 5: Validate Code

**Purpose:** Ensure code is production-ready before commit.

**Agent:** `production-code-validator`

**Validation Checks:**

| Category | What to Check |
|----------|---------------|
| Debug artifacts | console.log, debugger, print statements |
| Incomplete code | TODO, FIXME, HACK comments |
| Security | Hardcoded credentials, API keys, localhost URLs |
| Placeholders | "test", "example", "foo", "bar" values |
| Error handling | Empty catch blocks, swallowed errors |
| Types | Missing TypeScript types |

**If Issues Found:**
1. Fix all issues
2. Run validation again
3. Only proceed when clean

---

### Step 6: Update Documentation

**Purpose:** Keep documentation in sync with code changes.

**When to Update:**

| Change Made | Documentation to Update |
|-------------|------------------------|
| New API endpoint | `ai-specs/specs/api-spec.yaml` |
| Database schema change | `ai-specs/specs/data-model.md` |
| New environment variable | `.env.example`, README |
| New dependency | `package.json` (automatic), README if setup needed |
| Configuration change | Relevant config docs |

**Skill:** `/update-docs`

**When to Skip:**
- Internal refactoring (no public API change)
- Test-only changes
- Code style changes

---

### Step 7: Commit

**Purpose:** Save work with a clear, conventional commit message.

**Commit Format:**
```
<type>(<scope>): <short description>

<longer description if needed>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**Commit Types:**
| Type | Use For |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change that doesn't fix bug or add feature |
| `test` | Adding or updating tests |
| `chore` | Build, config, tooling changes |

**Examples:**
```
feat(auth): implement JWT token service

Add JWT generation and validation with refresh token rotation.
Includes unit tests for all token operations.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**Sprint Tracker Update:**
Update sprint tracker:
- Set task status to ✅ in the task table
- Clear "Active Task" section
- Add entry to "Completion Log":

| Date | Task | Commit | Notes |
|------|------|--------|-------|
| 2026-02-02 | B0.1 | abc1234 | Express + TypeScript setup |

---

## Memory System Integration

### Automatic Memory Updates

The workflow automatically maintains project memory:

```
┌─────────────────────────────────────────────────────────────┐
│                    PROJECT MEMORY                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  docs/project_notes/                                         │
│  ├── sprint-X-tracker.md ◄── Active task, status, log       │
│  ├── bugs.md             ◄── Bugs found and fixed           │
│  ├── decisions.md        ◄── Architectural decisions made   │
│  └── key_facts.md        ◄── New configuration details      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Memory Checks (Before Task)

| File | What to Check |
|------|---------------|
| `sprint-X-tracker.md` | Active task (must be empty), dependencies completed |
| `decisions.md` | Existing decisions that might affect implementation |
| `bugs.md` | Known issues in the area being worked on |
| `key_facts.md` | Configuration details needed for the task |

### Memory Updates (After Task)

| Event | Update To |
|-------|-----------|
| Task started | `sprint-X-tracker.md` → Active Task section, status 🔄 |
| Task completed | `sprint-X-tracker.md` → Status ✅, Completion Log |
| Bug found and fixed | `bugs.md` → Add entry |
| Decision made | `decisions.md` → Add ADR |
| New config added | `key_facts.md` → Add details |

---

## Agents and Skills Reference

### Skills (User-Invocable)

| Skill | Purpose | Invoke With |
|-------|---------|-------------|
| `/plan-backend-ticket` | Generate backend task ticket | `/plan-backend-ticket B0.1` |
| `/plan-frontend-ticket` | Generate frontend task ticket | `/plan-frontend-ticket F0.1` |
| `/develop-backend` | Implement backend task | `/develop-backend` |
| `/develop-frontend` | Implement frontend task | `/develop-frontend` |
| `/update-docs` | Update documentation | `/update-docs` |

### Agents (AI Assistants)

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| `production-code-validator` | Validate code for production | Step 5: Before every commit |
| `code-review-specialist` | Thorough code review | Complex implementations, PRs |
| `database-architect` | Schema design, optimization | Database tasks, migrations |
| `backend-developer` | DDD patterns, services | Backend implementation |
| `frontend-developer` | React components, state | Frontend implementation |

---

## Sprint Management

### View Sprint Progress

To see current sprint status:

1. Read `docs/PLAN_DESARROLLO.md` for sprint tasks
2. Read sprint tracker for task status
3. Generate progress report

### Sprint Status Categories

| Status | Meaning |
|--------|---------|
| ✅ Completed | Task finished and committed |
| 🔄 In Progress | Currently being worked on |
| ⏳ Pending | Not started yet |
| 🚫 Blocked | Waiting on dependency |

### Sprint Tracker Template

See `references/sprint-tracker.md` for the tracking template.

---

## Examples

See `references/workflow-example.md` for a complete step-by-step example of executing the workflow for task B0.1.

---

## Troubleshooting

### Task Has Unmet Dependencies

**Problem:** A task depends on another that isn't complete.

**Solution:**
1. Check sprint tracker for the blocking task status
2. Either complete the dependency first, or
3. Ask if the dependency can be worked around

### Validation Fails

**Problem:** `production-code-validator` finds issues.

**Solution:**
1. Review the issues reported
2. Fix each issue
3. Run validation again
4. Don't skip or ignore issues

### Conflicting Architectural Decision

**Problem:** Implementation conflicts with existing ADR.

**Solution:**
1. Read the original decision in `decisions.md`
2. Understand why it was made
3. Either follow the existing decision, or
4. Propose a new ADR explaining why change is needed

### Unclear Task Requirements

**Problem:** Task description is ambiguous.

**Solution:**
1. Check related documentation (architecture, use cases)
2. Check `decisions.md` for context
3. Ask for clarification before proceeding

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-02 | Initial version |
