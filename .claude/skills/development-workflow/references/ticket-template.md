# Ticket Template

## [TASK-ID]: [Task Title]

**Sprint:** [N]
**Type:** Backend / Frontend
**Priority:** High / Medium / Low
**Complexity:** Simple / Standard / Complex

---

## Description

[Clear description of what needs to be implemented]

---

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
- [ ] All tests pass
- [ ] Code validated (Standard/Complex)

---

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `path/to/file.ts` | Description |
| `path/to/file.test.ts` | Tests |

---

## Test Specifications

```typescript
describe('[Feature]', () => {
  it('should [expected behavior]', () => {
    // Test case
  });

  it('should handle [edge case]', () => {
    // Edge case
  });

  it('should throw error when [error condition]', () => {
    // Error handling
  });
});
```

---

## Implementation Steps

### Step 1: [First functionality]
1. Write test (RED)
2. Implement (GREEN)
3. Refactor

### Step 2: [Second functionality]
1. Write test (RED)
2. Implement (GREEN)
3. Refactor

---

## API Contract (if applicable)

**Endpoint:** `[METHOD] /path`

**Request:**
```json
{ "field": "type" }
```

**Response:**
```json
{ "field": "type" }
```

---

## Dependencies (if applicable)

| Package | Purpose |
|---------|---------|
| package-name | Why needed |

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] No TypeScript/ESLint errors
- [ ] Documentation updated (if applicable)
- [ ] Ticket criteria marked as `[x]`
