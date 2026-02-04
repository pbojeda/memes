# Workflow Example: Task B0.1

This document walks through a complete example of executing the development workflow for task B0.1: "Initialize Express + TypeScript project".

---

## Context

**Task ID:** B0.1
**Sprint:** 0 - Project Setup & Infrastructure
**Task:** Initialize Express + TypeScript project
**Priority:** High
**Type:** Setup

---

## Step 1: Validate Task

### 1.1 Read Task from PLAN_DESARROLLO.md

```markdown
| ID | Task | Priority | Type |
|----|------|----------|------|
| B0.1 | Initialize Express + TypeScript project | High | Setup |
```

### 1.2 Check Architectural Decisions

```bash
# Search decisions.md for Express or TypeScript decisions
```

**Result:** No existing decisions found. This is the first task.

### 1.3 Check Known Bugs

```bash
# Search bugs.md for related issues
```

**Result:** No bugs logged yet. Project is new.

### 1.4 Verify Dependencies

```bash
# Check sprint tracker for blocking tasks
```

**Result:** No dependencies. B0.1 is the first task.

### 1.5 Validation Summary

```
✅ Task validated
   - Task exists in PLAN_DESARROLLO.md
   - No blocking dependencies
   - No conflicting decisions
   - Ready to proceed
```

---

## Step 2: Create Branch

### 2.1 Create Feature Branch

```bash
git checkout -b feature/sprint0-B0.1-express-setup
```

### 2.2 Verify Branch

```bash
git branch --show-current
# Output: feature/sprint0-B0.1-express-setup
```

---

## Step 3: Generate Ticket

### 3.1 Invoke Skill

```
User: /plan-backend-ticket B0.1
```

### 3.2 Generated Ticket

```markdown
## B0.1: Initialize Express + TypeScript project

**Sprint:** 0
**Type:** Backend - Setup
**Priority:** High

### Description

Set up the Express.js server with TypeScript configuration. This establishes
the foundation for all backend development.

### Acceptance Criteria

- [ ] Express server starts without errors
- [ ] TypeScript compiles successfully
- [ ] Development hot-reload works
- [ ] Basic project structure created
- [ ] Health check endpoint responds

### Files to Create

| File | Purpose |
|------|---------|
| `backend/package.json` | Project dependencies |
| `backend/tsconfig.json` | TypeScript configuration |
| `backend/src/index.ts` | Main entry point |
| `backend/src/app.ts` | Express app configuration |
| `backend/src/app.test.ts` | Tests for app |

### Test Specifications

```typescript
describe('Express App', () => {
  it('should create an Express application', () => {
    expect(app).toBeDefined();
  });

  it('should respond to health check', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });
});
```

### Implementation Steps

1. Initialize npm project
2. Install dependencies (express, typescript, etc.)
3. Configure TypeScript
4. Create Express app with health endpoint
5. Add tests
```

### 3.3 Update Sprint Tracker

Update task status in sprint tracker to 🔄 (In Progress) and set "Active Task" section:

```markdown
## Active Task

**Status:** In Progress

| Field | Value |
|-------|-------|
| Task | B0.1 - Initialize Express + TypeScript project |
| Branch | feature/sprint0-B0.1-express-setup |
| Step | 4/8 (Develop) |
| Ticket | [B0.1-express-setup.md](../tickets/B0.1-express-setup.md) |
```

---

## Step 4: Develop (TDD)

### 4.1 Initialize Project

```bash
cd backend
npm init -y
```

### 4.2 Install Dependencies

```bash
npm install express
npm install -D typescript @types/express @types/node ts-node nodemon jest @types/jest ts-jest supertest @types/supertest
```

### 4.3 TDD Cycle 1: Express App Creation

**RED - Write Failing Test:**

```typescript
// backend/src/app.test.ts
import app from './app';

describe('Express App', () => {
  it('should create an Express application', () => {
    expect(app).toBeDefined();
  });
});
```

```bash
npm test
# FAIL - Cannot find module './app'
```

**GREEN - Minimum Implementation:**

```typescript
// backend/src/app.ts
import express from 'express';

const app = express();

export default app;
```

```bash
npm test
# PASS
```

**REFACTOR:** No changes needed yet.

### 4.4 TDD Cycle 2: Health Check Endpoint

**RED - Write Failing Test:**

```typescript
// backend/src/app.test.ts
import request from 'supertest';
import app from './app';

describe('Express App', () => {
  it('should create an Express application', () => {
    expect(app).toBeDefined();
  });

  describe('GET /health', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });

    it('should return status ok', async () => {
      const response = await request(app).get('/health');
      expect(response.body.status).toBe('ok');
    });
  });
});
```

```bash
npm test
# FAIL - Expected 200, received 404
```

**GREEN - Minimum Implementation:**

```typescript
// backend/src/app.ts
import express from 'express';

const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
```

```bash
npm test
# PASS - All tests passing
```

**REFACTOR:** Extract health route to separate file (optional for now).

### 4.5 Create Entry Point

```typescript
// backend/src/index.ts
import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 4.6 Verify All Tests Pass

```bash
npm test

# Output:
# PASS src/app.test.ts
#   Express App
#     ✓ should create an Express application
#     GET /health
#       ✓ should return 200 OK
#       ✓ should return status ok
#
# Tests: 3 passed, 3 total
```

---

## Step 5: Validate Code

### 5.1 Run Production Validator

```
User: Run production-code-validator on backend/
```

### 5.2 Validator Output

```
[SEVERITY: HIGH]
File: backend/src/index.ts
Line: 6
Category: Debug & Development Artifacts
Issue: console.log statement
Code: console.log(`Server running on port ${PORT}`);
Recommendation: Use proper logging library (pino)

SUMMARY:
- CRITICAL: 0
- HIGH: 1
- MEDIUM: 0
- LOW: 0

Status: NEEDS REVIEW
```

### 5.3 Fix Issues

```typescript
// backend/src/index.ts
import app from './app';
import pino from 'pino';

const logger = pino();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
```

### 5.4 Re-validate

```
Status: READY FOR PRODUCTION
- All checks passed
```

---

## Step 6: Update Documentation

### 6.1 Determine What Needs Update

| Change | Documentation | Needed? |
|--------|---------------|---------|
| New API endpoint | api-spec.yaml | ✅ Yes - /health |
| Schema changes | data-model.md | ❌ No |
| New env variables | .env.example | ✅ Yes - PORT |

### 6.2 Update api-spec.yaml

```yaml
paths:
  /health:
    get:
      summary: Health check endpoint
      responses:
        '200':
          description: Server is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: ok
```

### 6.3 Create .env.example

```bash
# Server Configuration
PORT=3000
```

---

## Step 7: Commit

### 7.1 Stage Changes

```bash
git add backend/
git status
```

### 7.2 Create Commit

```bash
git commit -m "$(cat <<'EOF'
feat(backend): initialize Express + TypeScript project

- Setup Express server with TypeScript configuration
- Add health check endpoint at GET /health
- Configure Jest for testing
- Add Pino logger for production logging

Tests: 3 passing

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### 7.3 Update Sprint Tracker

Update sprint tracker:
- Set task B0.1 status to ✅
- Clear "Active Task" section
- Add entry to "Completion Log":

| Date | Task | Commit | Notes |
|------|------|--------|-------|
| 2026-02-02 | B0.1 | abc1234 | Express + TypeScript setup, health endpoint |

---

## Summary

### Task Completed

```
✅ B0.1: Initialize Express + TypeScript project

Branch: feature/sprint0-B0.1-express-setup
Commit: abc1234
Tests: 3 passing
Validation: PASSED
```

### Files Created

```
backend/
├── package.json
├── tsconfig.json
├── .env.example
└── src/
    ├── index.ts
    ├── app.ts
    └── app.test.ts
```

### Sprint Tracker Updated

- Task status: ✅
- Completion Log: Entry added
- No bugs found
- No new architectural decisions needed

### Next Task

```
B0.2: Configure Prisma with PostgreSQL
```

---

## Lessons Learned

1. **Console.log caught by validator** - Always use proper logging from the start
2. **TDD works** - Tests drove the implementation naturally
3. **Memory system helps** - Having a record of what's done is useful

---

*Example completed: 2026-02-02*
