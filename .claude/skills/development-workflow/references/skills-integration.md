# Skills & Agents Integration Guide

## Overview

This document describes how the development-workflow skill integrates with other skills and agents in the project.

---

## Skills Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT WORKFLOW                             │
│                   (Orchestration Layer)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 3: Ticket         Step 4: Develop         Step 6: Docs        │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   │
│  │ /plan-backend   │   │ /develop-backend│   │ /update-docs    │   │
│  │ /plan-frontend  │   │ /develop-frontend│  │                 │   │
│  └────────┬────────┘   └────────┬────────┘   └────────┬────────┘   │
│           │                     │                     │             │
├───────────┴─────────────────────┴─────────────────────┴─────────────┤
│                                                                      │
│                         AGENTS LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ production-  │  │ code-review- │  │ database-    │              │
│  │ code-        │  │ specialist   │  │ architect    │              │
│  │ validator    │  │              │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐                                 │
│  │ backend-     │  │ frontend-    │                                 │
│  │ planner      │  │ planner      │                                 │
│  └──────────────┘  └──────────────┘                                 │
│  ┌──────────────┐  ┌──────────────┐                                 │
│  │ backend-     │  │ frontend-    │                                 │
│  │ developer    │  │ developer    │                                 │
│  └──────────────┘  └──────────────┘                                 │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                      MEMORY LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ project-     │  │ sprint-      │  │ bugs.md      │              │
│  │ memory       │  │ tracker.md   │  │ decisions.md │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Skills Reference

### Planning Skills

#### `/plan-backend-ticket <task-id>`

**Purpose:** Generate detailed backend task specification with TDD requirements.

**Input:** Task ID from PLAN_DESARROLLO.md (e.g., B0.1)

**Output:** Complete ticket including:
- Acceptance criteria
- Test specifications
- Files to create/modify
- API contracts
- Database changes

**Integration with workflow:**
- Called in Step 3 (Generate Ticket)
- Produces input for Step 4 (Develop)

**Example:**
```
User: /plan-backend-ticket B1.2
Output: Detailed ticket for "Implement auth service (register, login, logout)"
```

---

#### `/plan-frontend-ticket <task-id>`

**Purpose:** Generate detailed frontend task specification with component structure.

**Input:** Task ID from PLAN_DESARROLLO.md (e.g., F0.1)

**Output:** Complete ticket including:
- Component hierarchy
- State management approach
- Test specifications
- UI/UX requirements

**Integration with workflow:**
- Called in Step 3 (Generate Ticket)
- Produces input for Step 4 (Develop)

**Example:**
```
User: /plan-frontend-ticket F1.2
Output: Detailed ticket for "Implement login page"
```

---

### Development Skills

#### `/develop-backend`

**Purpose:** Implement backend task following DDD and TDD patterns.

**Expected Context:**
- Ticket generated from `/plan-backend-ticket`
- Current task tracked in sprint tracker "Active Task" section

**Process:**
1. Read ticket specifications
2. Follow TDD cycle
3. Implement using DDD patterns
4. Use appropriate agents when needed

**Integration with workflow:**
- Called in Step 4 (Develop)
- May invoke `database-architect` or `backend-developer` agents

**Example:**
```
User: /develop-backend
Context: Working on B1.2 (auth service)
Action: Implements auth service with tests
```

---

#### `/develop-frontend`

**Purpose:** Implement frontend task following React patterns.

**Expected Context:**
- Ticket generated from `/plan-frontend-ticket`
- Current task tracked in sprint tracker "Active Task" section

**Process:**
1. Read ticket specifications
2. Follow TDD cycle
3. Implement React components
4. Use appropriate agents when needed

**Integration with workflow:**
- Called in Step 4 (Develop)
- May invoke `frontend-developer` agent

**Example:**
```
User: /develop-frontend
Context: Working on F1.2 (login page)
Action: Implements login page with tests
```

---

### Documentation Skills

#### `/update-docs`

**Purpose:** Update project documentation after code changes.

**Triggers:**
- API endpoint changes → api-spec.yaml
- Schema changes → data-model.md
- Config changes → .env.example, README
- Setup changes → development guide

**Integration with workflow:**
- Called in Step 6 (Update Documentation)
- Conditional: only when applicable

**Example:**
```
User: /update-docs
Context: Added /health endpoint in B0.10
Action: Updates api-spec.yaml with new endpoint
```

---

## Agents Reference

### production-code-validator

**Location:** `.claude/agents/production-code-validator.md`

**Purpose:** Validate code is production-ready before commit.

**Checks:**
| Category | What It Checks |
|----------|----------------|
| Debug code | console.log, debugger, print |
| Incomplete | TODO, FIXME, HACK |
| Security | Hardcoded secrets, localhost URLs |
| Quality | Empty catch, missing types |

**When to Use:**
- Step 5 (Validate Code) - MANDATORY
- Before any commit
- Before PR merge

**Invocation:**
```
"Run production-code-validator on backend/"
"Validate code for production"
```

---

### code-review-specialist

**Location:** `.claude/agents/code-review-specialist.md`

**Purpose:** Thorough code review focusing on quality, security, and best practices.

**Review Areas:**
- Code correctness
- Security vulnerabilities
- Performance issues
- Maintainability
- Test coverage

**When to Use:**
- Complex implementations
- Before merging important PRs
- When unsure about approach

**Invocation:**
```
"Review the auth service implementation"
"Use code-review-specialist for PR review"
```

---

### database-architect

**Location:** `.claude/agents/database-architect.md`

**Purpose:** Design optimal database schemas and queries.

**Capabilities:**
- Schema design
- Migration planning
- Index optimization
- Query performance

**When to Use:**
- Creating new models/tables
- Optimizing queries
- Planning migrations
- Database design decisions

**Invocation:**
```
"Design schema for user authentication"
"Use database-architect for the Product model"
```

---

### backend-planner

**Location:** `.claude/agents/backend-planner.md`

**Purpose:** Generate implementation plans for backend tasks (B*.*).

**Capabilities:**
- Codebase exploration (entities, services, validators, repositories)
- Identifies reusable code
- Writes structured plan into ticket

**When to Use:**
- Step 2a for Standard/Complex backend tasks
- Before `backend-developer` agent

**Invocation:**
```
"Use backend-planner to generate plan for docs/tickets/B2.3-xxx.md"
```

---

### backend-developer

**Location:** `.claude/agents/backend-developer.md`

**Purpose:** Implement backend tasks from approved ticket + implementation plan using TDD.

**Expertise:**
- Domain entities, application services, repository pattern
- Express controllers, error handling
- Test-driven development

**When to Use:**
- Step 2b for Standard/Complex backend tasks
- After plan is approved by user

**Invocation:**
```
"Use backend-developer to implement docs/tickets/B2.3-xxx.md"
```

---

### frontend-planner

**Location:** `.claude/agents/frontend-planner.md`

**Purpose:** Generate implementation plans for frontend tasks (F*.*).

**Capabilities:**
- Codebase exploration (components, services, stores, pages)
- Identifies reusable code
- Writes structured plan into ticket

**When to Use:**
- Step 2a for Standard/Complex frontend tasks
- Before `frontend-developer` agent

**Invocation:**
```
"Use frontend-planner to generate plan for docs/tickets/F1.2-xxx.md"
```

---

### frontend-developer

**Location:** `.claude/agents/frontend-developer.md`

**Purpose:** Implement frontend tasks from approved ticket + implementation plan using TDD.

**Expertise:**
- React components, state management (Zustand)
- API integration, component testing
- Test-driven development

**When to Use:**
- Step 2b for Standard/Complex frontend tasks
- After plan is approved by user

**Invocation:**
```
"Use frontend-developer to implement docs/tickets/F1.2-xxx.md"
```

---

## Integration Patterns

### Pattern 1: Full Task Workflow (Standard/Complex)

```
1. "Start task B1.2"
   └─> development-workflow validates task

2. "/plan-backend-ticket B1.2"
   └─> Generates detailed ticket

3. 🛑 User approves ticket

4. backend-planner agent
   └─> Writes Implementation Plan into ticket

5. 🛑 User approves plan

6. backend-developer agent
   └─> TDD implementation from plan
   └─> May use: database-architect

7. "Validate code"
   └─> production-code-validator

8. "/update-docs"
   └─> Updates relevant documentation

9. "Generate commit"
   └─> Creates conventional commit

10. "Create PR"
    └─> May use: code-review-specialist
```

### Pattern 2: Agent Chaining

```
User: "Create user authentication system"

development-workflow
  └─> backend-planner (generate implementation plan)
      └─> 🛑 User approves plan
          └─> backend-developer (TDD implementation)
              └─> production-code-validator (validate)
                  └─> code-review-specialist (review)
```

### Pattern 3: Planner → Developer Pipeline

```
backend-planner (for auth service)
  │
  ├─> Explores: domain/, services/, validators/, infrastructure/
  ├─> Identifies reusable code
  └─> Writes plan into ticket
      │
      └─> 🛑 User approves plan
          │
          └─> backend-developer (implements from plan)
              │
              ├─> Internal decision: Need database work
              │   └─> Invokes: database-architect
              │
              └─> On completion
                  └─> Automatic: production-code-validator
```

---

## Communication Between Skills

### Data Flow

```
PLAN_DESARROLLO.md
       │
       ▼
/plan-*-ticket ──► Ticket (with tests)
       │
       ▼
/develop-* ──────► Implementation
       │
       ▼
validator ───────► Validated code
       │
       ▼
/update-docs ────► Updated documentation
       │
       ▼
sprint-tracker.md ◄► State tracking & work log
```

### State Sharing

All skills share state through:
- `docs/project_notes/sprint-N-tracker.md` - Sprint progress, active task, completion log
- `docs/project_notes/decisions.md` - Architectural decisions
- `docs/project_notes/bugs.md` - Bug log
- `docs/project_notes/key_facts.md` - Project configuration

---

## Adding New Skills

When creating new skills that integrate with the workflow:

1. **Define clear input/output:**
   - What does the skill expect?
   - What does it produce?

2. **Identify integration points:**
   - Which workflow step does it fit?
   - Which agents might it use?

3. **Update memory:**
   - What should be logged?
   - How does it affect sprint tracker?

4. **Document:**
   - Add to this integration guide
   - Add to SKILL.md agents reference

### Memory Not Updating

**Error:** Sprint tracker not reflecting changes

**Solution:**
1. Manually verify file content
2. Check for file permission issues
3. Ensure skill explicitly updates sprint tracker

---

## Troubleshooting Integration

### Skill Not Found

**Error:** "Unknown skill /plan-backend-ticket"

**Solution:**
1. Check skill exists in `.claude/skills/`
2. Verify SKILL.md has correct name
3. Restart Claude Code session

### Agent Not Responding

**Error:** Agent takes too long or fails

**Solution:**
1. Check agent definition in `.claude/agents/`
2. Try simpler invocation
3. Break down the request

