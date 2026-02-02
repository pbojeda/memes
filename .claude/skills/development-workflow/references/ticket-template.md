# Ticket Template

## [TASK-ID]: [Task Title]

**Sprint:** [N]
**Type:** Backend / Frontend
**Priority:** High / Medium / Low
**Estimated Complexity:** Simple / Medium / Complex

---

## Description

[Clear description of what needs to be implemented. Include context from PLAN_DESARROLLO.md and relevant architectural decisions.]

---

## Acceptance Criteria

The task is complete when:

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
- [ ] All tests pass
- [ ] Code validated by production-code-validator
- [ ] Documentation updated (if applicable)

---

## Technical Specification

### Files to Create

| File | Purpose |
|------|---------|
| `path/to/file.ts` | Description |
| `path/to/file.test.ts` | Tests for above |

### Files to Modify

| File | Changes |
|------|---------|
| `path/to/existing.ts` | Description of changes |

### Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| package-name | ^x.y.z | Why it's needed |

---

## Test Specifications (TDD)

### Test File: `[path/to/file.test.ts]`

#### Test Suite: [Suite Name]

```typescript
describe('[Suite Name]', () => {

  describe('[Feature/Function]', () => {

    it('should [expected behavior 1]', () => {
      // Test case 1
    });

    it('should [expected behavior 2]', () => {
      // Test case 2
    });

    it('should handle [edge case]', () => {
      // Edge case test
    });

    it('should throw error when [error condition]', () => {
      // Error handling test
    });

  });

});
```

### Test Cases Checklist

- [ ] Happy path: [description]
- [ ] Edge case: [description]
- [ ] Error case: [description]
- [ ] Integration: [description if applicable]

---

## Implementation Steps

Follow TDD cycle for each step:

### Step 1: [First piece of functionality]

1. **Test (RED)**
   ```typescript
   // Write test for [functionality]
   ```

2. **Implement (GREEN)**
   ```typescript
   // Minimum code to pass test
   ```

3. **Refactor**
   - [ ] Clean up code
   - [ ] Remove duplication
   - [ ] Improve naming

### Step 2: [Second piece of functionality]

1. **Test (RED)**
2. **Implement (GREEN)**
3. **Refactor**

### Step N: [Continue as needed]

---

## API Contract (if applicable)

### Endpoint: `[METHOD] /path/to/endpoint`

**Request:**
```json
{
  "field": "type"
}
```

**Response (Success):**
```json
{
  "field": "type"
}
```

**Response (Error):**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

---

## Database Changes (if applicable)

### New Tables/Models

```prisma
model ModelName {
  id        String   @id @default(uuid())
  field     Type
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Migrations

- [ ] Create migration: `npx prisma migrate dev --name [name]`
- [ ] Update seed data if needed

---

## Environment Variables (if applicable)

| Variable | Description | Example |
|----------|-------------|---------|
| `VAR_NAME` | What it's for | `example_value` |

---

## Related Documentation

- Architecture: [Link to relevant section]
- Data Model: [Link to relevant section]
- API Spec: [Link to relevant section]
- ADRs: [List any related decisions]

---

## Notes

_Additional context, warnings, or considerations:_

```
[Notes here]
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tests written and passing
- [ ] Code reviewed (production-code-validator)
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Documentation updated (if applicable)
- [ ] Commit created with conventional format
- [ ] issues.md updated
