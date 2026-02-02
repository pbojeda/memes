# Automation & Hooks Guide

## Overview

This document describes how to automate repetitive workflow tasks using Claude Code hooks and conventions.

---

## Claude Code Hooks

Claude Code supports hooks that run automatically on certain events. Configure in `.claude/hooks/`.

### Available Hook Points

| Hook | Triggers When |
|------|---------------|
| `pre-commit` | Before git commit |
| `post-commit` | After git commit |
| `on-file-save` | When files are saved |
| `on-task-start` | When starting a task |
| `on-task-complete` | When completing a task |

---

## Recommended Hooks

### Hook 1: Pre-Commit Validation

**Purpose:** Run production-code-validator before every commit.

**File:** `.claude/hooks/pre-commit.md`

```markdown
# Pre-Commit Hook

## Trigger
Before any git commit

## Actions
1. Run production-code-validator on staged files
2. If issues found:
   - Block commit
   - Show issues
   - Suggest fixes
3. If clean:
   - Allow commit to proceed

## Implementation
When user runs "git commit":
1. Get list of staged files
2. Run validation on each
3. Report results
4. Only proceed if all pass
```

### Hook 2: Post-Commit Memory Update

**Purpose:** Automatically update issues.md after commits.

**File:** `.claude/hooks/post-commit.md`

```markdown
# Post-Commit Hook

## Trigger
After successful git commit

## Actions
1. Read current-task.md for active task
2. If task is active:
   - Check if this is the final commit for the task
   - If yes, update issues.md to "Completed"
   - Update current-task.md history
3. Add commit hash to current task

## Implementation
After "git commit" succeeds:
1. Extract commit message
2. Parse task ID if present
3. Update relevant memory files
```

### Hook 3: Task Start Automation

**Purpose:** Automate task initialization.

**File:** `.claude/hooks/on-task-start.md`

```markdown
# On Task Start Hook

## Trigger
When user says "start task X"

## Actions
1. Verify no active task (check current-task.md)
2. Validate task exists in PLAN_DESARROLLO.md
3. Check dependencies in issues.md
4. Create branch automatically
5. Update current-task.md
6. Update sprint tracker
7. Start timer

## Implementation
1. Parse task ID from command
2. Read PLAN_DESARROLLO.md for task details
3. Check issues.md for blocking dependencies
4. Run: git checkout -b feature/sprint{N}-{ID}-{slug}
5. Update current-task.md with:
   - Task details
   - Started timestamp
   - Step 1 of 8
```

### Hook 4: Task Complete Automation

**Purpose:** Automate task finalization.

**File:** `.claude/hooks/on-task-complete.md`

```markdown
# On Task Complete Hook

## Trigger
When PR is merged or user says "complete task"

## Actions
1. Calculate total time
2. Update current-task.md:
   - Clear active task
   - Update Last Completed
   - Add to Session History
3. Update issues.md:
   - Mark task Completed
   - Add time metrics
4. Update sprint tracker:
   - Mark task ✅
   - Update progress percentage
5. Clean up branch

## Implementation
1. Read current-task.md for active task
2. Calculate duration from Started
3. Update all memory files
4. Run: git branch -d {branch-name}
5. Suggest next task
```

---

## Automation Scripts

### Script: Initialize Sprint

**Command:** `init sprint N`

**Auto-actions:**
```
1. Read PLAN_DESARROLLO.md Sprint N section
2. Create docs/project_notes/sprint-N-tracker.md
3. Populate with tasks from plan
4. Update current-task.md with sprint reference
5. Output summary
```

**Pseudo-code:**
```javascript
function initSprint(sprintNumber) {
  // 1. Read plan
  const plan = readFile('docs/PLAN_DESARROLLO.md');
  const sprintSection = extractSprintSection(plan, sprintNumber);

  // 2. Parse tasks
  const backendTasks = parseTaskTable(sprintSection, 'Backend');
  const frontendTasks = parseTaskTable(sprintSection, 'Frontend');

  // 3. Create tracker from template
  const template = readFile('.claude/skills/development-workflow/references/sprint-tracker.md');
  const tracker = populateTemplate(template, {
    number: sprintNumber,
    goal: sprintSection.goal,
    startDate: today(),
    endDate: addDays(today(), 14),
    backendTasks,
    frontendTasks
  });

  // 4. Write tracker
  writeFile(`docs/project_notes/sprint-${sprintNumber}-tracker.md`, tracker);

  // 5. Update current-task.md
  updateCurrentTask({
    activeSprint: sprintNumber,
    trackerPath: `sprint-${sprintNumber}-tracker.md`
  });

  return {
    sprintNumber,
    totalTasks: backendTasks.length + frontendTasks.length,
    message: `Sprint ${sprintNumber} initialized`
  };
}
```

### Script: Update Progress

**Command:** `update progress` or automatic

**Auto-actions:**
```
1. Read sprint tracker
2. Count tasks by status
3. Calculate percentage
4. Update progress bar
5. Update current-task.md summary
```

### Script: Generate Daily Report

**Command:** `daily report`

**Auto-actions:**
```
1. Read current-task.md
2. Read session history
3. Calculate work done today
4. Format report
5. Output or save
```

---

## Memory File Auto-Updates

### When to Update Each File

| Event | current-task.md | issues.md | sprint-tracker.md | bugs.md | decisions.md |
|-------|-----------------|-----------|-------------------|---------|--------------|
| Start task | ✅ Active | ✅ In Progress | ✅ 🔄 | | |
| Change step | ✅ Step | | | | |
| Pause | ✅ Paused | | ✅ ⏸️ | | |
| Resume | ✅ Active | | ✅ 🔄 | | |
| Complete | ✅ History | ✅ Completed | ✅ ✅ | | |
| Bug found | | | | ✅ Add | |
| Decision made | | | | | ✅ Add |
| Blocked | ✅ Blocked | | ✅ 🚫 | | |

### Update Templates

**Add to issues.md (task started):**
```markdown
### YYYY-MM-DD - {TASK_ID}: {Task Title}
- **Status**: In Progress
- **Sprint**: {N}
- **Estimated**: {Xh}
- **Started**: {timestamp}
```

**Update issues.md (task completed):**
```markdown
### YYYY-MM-DD - {TASK_ID}: {Task Title}
- **Status**: Completed
- **Sprint**: {N}
- **Estimated**: {Xh}
- **Actual**: {Xh Xm}
- **Variance**: {±Xm}
- **Commit**: {hash}
```

---

## Workflow State Machine

```
                    ┌─────────────┐
                    │   IDLE      │
                    │ (No Task)   │
                    └──────┬──────┘
                           │ start task
                           ▼
                    ┌─────────────┐
          ┌────────│  VALIDATING │
          │        │  (Step 1)   │
          │        └──────┬──────┘
          │               │ validated
          │               ▼
          │        ┌─────────────┐
          │        │  BRANCHING  │
          │        │  (Step 2)   │
          │        └──────┬──────┘
          │               │ branched
          │               ▼
          │        ┌─────────────┐
          │        │  TICKETING  │
          │        │  (Step 3)   │
          │        └──────┬──────┘
          │               │ ticket ready
          │               ▼
          │        ┌─────────────┐
  blocked │   ┌───│  DEVELOPING │◄──────────┐
          │   │   │  (Step 4)   │           │
          │   │   └──────┬──────┘           │
          │   │          │ code ready       │ resume
          │   │ pause    ▼                  │
          │   │   ┌─────────────┐    ┌──────┴──────┐
          │   └──►│   PAUSED    │───►│   (same)    │
          │       └─────────────┘    └─────────────┘
          │               │
          │               ▼
          │        ┌─────────────┐
          │        │  VALIDATING │
          │        │  CODE (5)   │
          │        └──────┬──────┘
          │               │ validated
          │               ▼
          │        ┌─────────────┐
          │        │  DOCUMENTING│
          │        │  (Step 6)   │
          │        └──────┬──────┘
          │               │ docs done
          │               ▼
          │        ┌─────────────┐
          │        │  COMMITTING │
          │        │  (Step 7)   │
          │        └──────┬──────┘
          │               │ committed
          │               ▼
          │        ┌─────────────┐
          │        │  PR/MERGE   │
          │        │  (Step 8)   │
          │        └──────┬──────┘
          │               │ merged
          │               ▼
          │        ┌─────────────┐
          └───────►│  COMPLETED  │───────────┐
                   └─────────────┘           │
                           │                 │
                           ▼                 │
                    ┌─────────────┐          │
                    │    IDLE     │◄─────────┘
                    │ (Next Task) │
                    └─────────────┘
```

---

## Future Automation Ideas

### 1. Slack/Discord Notifications
- Notify team when task started/completed
- Alert on blockers
- Daily standup reminders

### 2. Time Tracking Integration
- Connect to Toggl/Clockify
- Auto-start/stop timers
- Sync with project management

### 3. CI/CD Triggers
- Run tests on task completion
- Deploy preview on PR
- Update Jira/Linear automatically

### 4. AI Insights
- Analyze patterns in time data
- Suggest task complexity
- Predict sprint completion

---

## Implementation Priority

| Priority | Automation | Effort | Impact |
|----------|------------|--------|--------|
| 1 | Pre-commit validation | Low | High |
| 2 | Task start/complete | Medium | High |
| 3 | Sprint initialization | Low | Medium |
| 4 | Progress updates | Low | Medium |
| 5 | Daily reports | Low | Low |
| 6 | External integrations | High | Medium |

---

## Configuration

### Enable Hooks

In `.claude/settings.json` (if supported):
```json
{
  "hooks": {
    "pre-commit": true,
    "post-commit": true,
    "on-task-start": true,
    "on-task-complete": true
  }
}
```

### Customize Behavior

Override defaults per-project in `.claude/config.json`:
```json
{
  "workflow": {
    "autoValidate": true,
    "autoUpdateMemory": true,
    "requireBranch": true,
    "requirePR": true
  }
}
```
