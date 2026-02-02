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
│  │ developer    │  │ developer    │                                 │
│  └──────────────┘  └──────────────┘                                 │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                      MEMORY LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ project-     │  │ current-     │  │ sprint-      │              │
│  │ memory       │  │ task.md      │  │ tracker.md   │              │
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
- Current task tracked in current-task.md

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
- Current task tracked in current-task.md

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

### backend-developer

**Location:** `.claude/agents/backend-developer.md`

**Purpose:** Implement backend code following DDD patterns.

**Expertise:**
- Domain entities
- Application services
- Repository pattern
- Express controllers
- Error handling

**When to Use:**
- Complex service implementation
- DDD pattern questions
- Architecture decisions

**Invocation:**
```
"Implement UserService with backend-developer"
"Use backend-developer for repository pattern"
```

---

### frontend-developer

**Location:** `.claude/agents/frontend-developer.md`

**Purpose:** Implement React components following project patterns.

**Expertise:**
- React components
- State management (Zustand)
- API integration (TanStack Query)
- Component testing

**When to Use:**
- Complex component implementation
- State management questions
- React patterns

**Invocation:**
```
"Implement ProductCard with frontend-developer"
"Use frontend-developer for cart state"
```

---

## Integration Patterns

### Pattern 1: Full Task Workflow

```
1. "Start task B1.2"
   └─> development-workflow validates task

2. "/plan-backend-ticket B1.2"
   └─> Generates detailed ticket

3. "/develop-backend"
   └─> May use: database-architect, backend-developer

4. "Validate code"
   └─> production-code-validator

5. "/update-docs"
   └─> Updates relevant documentation

6. "Generate commit"
   └─> Creates conventional commit

7. "Create PR"
   └─> May use: code-review-specialist
```

### Pattern 2: Agent Chaining

```
User: "Create user authentication system"

development-workflow
  └─> database-architect (design User schema)
      └─> backend-developer (implement auth service)
          └─> production-code-validator (validate)
              └─> code-review-specialist (review)
```

### Pattern 3: Skill with Agent Support

```
/develop-backend (for auth service)
  │
  ├─> Internal decision: Need database work
  │   └─> Invokes: database-architect
  │
  ├─> Internal decision: Complex DDD pattern
  │   └─> Invokes: backend-developer
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
current-task.md ◄► State tracking
       │
       ▼
issues.md ───────► Work log
```

### State Sharing

All skills share state through:
- `docs/project_notes/current-task.md` - Current work
- `docs/project_notes/sprint-N-tracker.md` - Sprint progress
- `docs/project_notes/issues.md` - Work history
- `docs/project_notes/decisions.md` - Architectural decisions

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
   - How does it affect current-task.md?

4. **Document:**
   - Add to this integration guide
   - Add to SKILL.md agents reference

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

### Memory Not Updating

**Error:** current-task.md not reflecting changes

**Solution:**
1. Manually verify file content
2. Check for file permission issues
3. Ensure skill explicitly updates memory
