# Metrics & Time Tracking Guide

## Overview

Track time and metrics to improve estimation accuracy and identify bottlenecks.

---

## Time Tracking

### Per-Task Tracking

Each task should track:

| Metric | Description |
|--------|-------------|
| Started | When work began |
| Completed | When task finished |
| Total Time | Elapsed time |
| Estimated | Original estimate (if any) |
| Variance | Difference from estimate |

### Update current-task.md with Time

```markdown
## Active Task

**Status:** In Progress

| Field | Value |
|-------|-------|
| Task ID | B0.1 |
| Title | Initialize Express + TypeScript project |
| Sprint | 0 |
| Branch | feature/sprint0-B0.1-express-setup |
| Started | 2026-02-02 10:30 |
| Estimated | 2 hours |
| Step | 4 of 8 (Develop) |

### Time Log

| Step | Started | Ended | Duration |
|------|---------|-------|----------|
| 1. Validate | 10:30 | 10:35 | 5m |
| 2. Branch | 10:35 | 10:37 | 2m |
| 3. Ticket | 10:37 | 10:55 | 18m |
| 4. Develop | 10:55 | - | ongoing |
```

### On Completion

```markdown
## Last Completed

| Field | Value |
|-------|-------|
| Task | B0.1: Initialize Express + TypeScript project |
| Completed | 2026-02-02 12:45 |
| Total Time | 2h 15m |
| Estimated | 2h |
| Variance | +15m (12.5% over) |

### Time Breakdown

| Step | Duration | % of Total |
|------|----------|------------|
| Validate | 5m | 4% |
| Branch | 2m | 1% |
| Ticket | 18m | 13% |
| Develop | 1h 20m | 59% |
| Validate Code | 10m | 7% |
| Docs | 5m | 4% |
| Commit | 5m | 4% |
| PR & Merge | 10m | 7% |
| **Total** | **2h 15m** | **100%** |
```

---

## Task Complexity Estimation

### Complexity Levels

| Level | Description | Typical Time |
|-------|-------------|--------------|
| XS | Trivial change | < 30 min |
| S | Simple, well-defined | 30 min - 2h |
| M | Moderate complexity | 2h - 4h |
| L | Complex, multiple parts | 4h - 8h |
| XL | Very complex, uncertain | 1-2 days |

### Estimation Guidelines

**XS Tasks:**
- Config changes
- Simple bug fixes
- Documentation updates

**S Tasks:**
- Single endpoint
- Simple component
- Basic CRUD operation

**M Tasks:**
- Feature with tests
- Multiple related endpoints
- Component with state

**L Tasks:**
- Feature spanning multiple files
- Integration with external service
- Complex business logic

**XL Tasks:**
- Major refactoring
- New subsystem
- Unknown complexity

---

## Sprint Metrics

### Sprint Tracker Metrics Section

```markdown
## Sprint Metrics

| Metric | Planned | Actual | Variance |
|--------|---------|--------|----------|
| Total Tasks | 20 | 18 | -2 (10% under) |
| Backend | 10 | 10 | 0 |
| Frontend | 10 | 8 | -2 |
| Story Points | 40 | 36 | -4 |
| Duration | 14 days | 16 days | +2 days |
| Velocity | - | 36 pts/sprint | - |

### Time Analysis

| Category | Hours | % of Sprint |
|----------|-------|-------------|
| Development | 60h | 75% |
| Code Review | 8h | 10% |
| Meetings | 4h | 5% |
| Blocked Time | 4h | 5% |
| Unplanned Work | 4h | 5% |

### Quality Metrics

| Metric | Value | Target |
|--------|-------|--------|
| Bugs Found | 3 | < 5 |
| Bugs Fixed | 3 | 100% |
| Test Coverage | 85% | > 80% |
| PRs Merged | 18 | - |
| Avg PR Time | 4h | < 24h |
```

---

## Velocity Tracking

### What is Velocity?

Velocity = Story Points completed per sprint

### Tracking Velocity

```markdown
## Project Velocity

| Sprint | Planned | Completed | Velocity |
|--------|---------|-----------|----------|
| 0 | 40 | 36 | 36 |
| 1 | 38 | 38 | 38 |
| 2 | 40 | 35 | 35 |
| **Avg** | **39** | **36** | **36** |
```

### Using Velocity for Planning

- Use 3-sprint rolling average
- Don't overcommit based on best sprint
- Factor in holidays, vacations

---

## Issue Tracking Metrics

### Update issues.md with Metrics

```markdown
### 2026-02-02 - B0.1: Initialize Express + TypeScript project
- **Status**: Completed
- **Sprint**: 0
- **Estimated**: 2h
- **Actual**: 2h 15m
- **Variance**: +15m
- **Complexity**: S
- **Notes**: Slightly over due to logger decision
```

### Monthly Summary

```markdown
## February 2026 Summary

### Tasks

| Status | Count |
|--------|-------|
| Completed | 25 |
| In Progress | 2 |
| Blocked | 0 |
| Abandoned | 1 |

### Time

| Metric | Value |
|--------|-------|
| Total Hours | 80h |
| Avg per Task | 3.2h |
| Estimation Accuracy | 87% |

### Quality

| Metric | Value |
|--------|-------|
| Bugs Found | 5 |
| Bugs Fixed | 5 |
| Test Coverage | 82% |
```

---

## Bottleneck Analysis

### Identify Bottlenecks

Track which steps take longest:

```markdown
## Step Duration Analysis (Last 10 Tasks)

| Step | Avg Duration | % of Total | Notes |
|------|--------------|------------|-------|
| Validate | 5m | 3% | Consistent |
| Branch | 2m | 1% | Fast |
| Ticket | 15m | 10% | Varies with complexity |
| **Develop** | **2h** | **65%** | **Bottleneck** |
| Validate Code | 10m | 6% | Depends on issues |
| Docs | 8m | 5% | Only when needed |
| Commit | 5m | 3% | Consistent |
| PR & Merge | 15m | 10% | Review time varies |
```

### Common Bottlenecks

| Bottleneck | Cause | Solution |
|------------|-------|----------|
| Long Develop | Unclear requirements | Better ticket generation |
| Many Validation Issues | Poor coding habits | Linting during development |
| Slow PR Reviews | Team availability | Async reviews, pair programming |
| Frequent Blocks | Poor planning | Check dependencies early |

---

## Reporting

### Daily Standup Data

From current-task.md:
- What was completed yesterday
- What's in progress today
- Any blockers

### Weekly Report

```markdown
# Week of 2026-02-01

## Completed
- B0.1: Express setup (2h 15m)
- B0.2: Prisma config (3h)
- B0.3: Logger setup (1h)

## In Progress
- B0.4: Zod validation (started)

## Blocked
- None

## Metrics
- Tasks Completed: 3
- Total Time: 6h 15m
- Avg per Task: 2h 5m

## Next Week
- Complete B0.4 - B0.7
- Start frontend tasks
```

### Sprint Retrospective Data

```markdown
# Sprint 0 Retrospective

## What Went Well
- Task estimation improving
- TDD catching bugs early
- Validation preventing issues

## What Could Improve
- Ticket generation takes too long
- Some tasks were underestimated

## Metrics Review
- Planned: 20 tasks
- Completed: 18 tasks
- Velocity: 36 points
- Estimation Accuracy: 82%

## Action Items
- [ ] Create ticket templates for common patterns
- [ ] Add buffer for XL tasks
```

---

## Automation Ideas

### Auto-Calculate Duration

When completing a task:
1. Read Started timestamp
2. Calculate elapsed time
3. Update metrics automatically

### Velocity Dashboard

Create a simple dashboard showing:
- Current sprint progress
- Velocity trend
- Estimation accuracy

### Alerts

Set thresholds for:
- Task taking > 2x estimate
- Sprint falling behind
- High bug count

---

## Templates

### Task Time Entry

```markdown
| Step | Started | Ended | Duration | Notes |
|------|---------|-------|----------|-------|
| Validate | HH:MM | HH:MM | XXm | |
| Branch | HH:MM | HH:MM | XXm | |
| Ticket | HH:MM | HH:MM | XXm | |
| Develop | HH:MM | HH:MM | XXh XXm | |
| Validate | HH:MM | HH:MM | XXm | |
| Docs | HH:MM | HH:MM | XXm | |
| Commit | HH:MM | HH:MM | XXm | |
| PR | HH:MM | HH:MM | XXm | |
| **Total** | | | **XXh XXm** | |
```

### Complexity Estimation Checklist

Before estimating, consider:
- [ ] How many files affected?
- [ ] New vs modifying existing?
- [ ] External dependencies?
- [ ] Database changes?
- [ ] Clear requirements?
- [ ] Similar work done before?
